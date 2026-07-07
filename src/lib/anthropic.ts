import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

/** Turn an Anthropic SDK error into a plain-English hint, for logs and UI. */
export function describeAnthropicError(e: unknown): string {
  const status = (e as { status?: number })?.status;
  const message = e instanceof Error ? e.message : String(e);
  if (status === 401) return "The Anthropic API key is missing or invalid — check ANTHROPIC_API_KEY.";
  if (status === 400 && /credit balance/i.test(message)) {
    return "The Anthropic account has no credit — add billing at console.anthropic.com.";
  }
  if (status === 404) return `The model "${MODEL}" wasn't found — check ANTHROPIC_MODEL.`;
  if (status === 429) return "Rate limited by the Anthropic API — try again in a moment.";
  if (status && status >= 500) return "Anthropic's API is having trouble right now — try again shortly.";
  if (message.startsWith("truncated:")) {
    return "The AI's reply was cut off before it finished — try again, or it may need a larger token budget.";
  }
  return `AI call failed: ${message.slice(0, 200)}`;
}

/**
 * Call Claude and get back a structured object, via a forced tool call
 * rather than free-text JSON. Asking a model to type raw JSON as prose has a
 * real failure mode: given a weighty or emotional context, it can drift into
 * a longer, more conversational answer and run out of tokens before ever
 * reaching a closing brace, leaving nothing valid to parse. Forcing a tool
 * call means the API returns an already-parsed object — there is no text to
 * mis-close.
 */
export async function askJSON<T>(opts: {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T> {
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 2000,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
    tools: [
      {
        name: "respond",
        description: "Provide the structured response described in the system prompt.",
        input_schema: opts.schema as { type: "object"; [k: string]: unknown },
      },
    ],
    tool_choice: { type: "tool", name: "respond" },
  });

  const toolUse = res.content.find((b) => b.type === "tool_use") as
    | { type: "tool_use"; input: unknown }
    | undefined;
  if (!toolUse) {
    if (res.stop_reason === "max_tokens") {
      throw new Error("truncated: the model's reply was cut off before it could respond");
    }
    throw new Error("The model did not return a structured response");
  }
  return toolUse.input as T;
}
