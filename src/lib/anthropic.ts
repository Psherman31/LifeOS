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
  return `AI call failed: ${message.slice(0, 200)}`;
}

/** Call Claude and parse a single JSON object out of the response. */
export async function askJSON<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 2000,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  const text = res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error(`No JSON in model response: ${text.slice(0, 200)}`);
  }
  return JSON.parse(text.slice(start, end + 1)) as T;
}
