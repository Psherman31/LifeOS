import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { anthropic, MODEL, describeAnthropicError } from "@/lib/anthropic";
import { chatSystem } from "@/lib/prompts";
import { buildContext } from "@/lib/context";

export const maxDuration = 120;

// POST /api/chat { sessionId?, kind?, message, stressId?, taskId?, title? }
// Streams the assistant reply as plain text; session id in x-session-id header.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const message: string = (body.message ?? "").trim();
  if (!message) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  let session = body.sessionId
    ? await prisma.chatSession.findUnique({
        where: { id: body.sessionId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      })
    : null;

  if (!session) {
    session = await prisma.chatSession.create({
      data: {
        kind: body.kind ?? "general",
        stressId: body.stressId ?? null,
        taskId: body.taskId ?? null,
        title: body.title ?? null,
      },
      include: { messages: true },
    });
  }

  await prisma.chatMessage.create({
    data: { sessionId: session.id, role: "user", content: message },
  });

  const context = await buildContext();
  let focus = "";
  if (session.stressId) {
    const s = await prisma.stress.findUnique({ where: { id: session.stressId } });
    if (s) focus = `\n\nFOCUS OF THIS CONVERSATION: area of stress [stress ${s.id}] "${s.title}"${s.notes ? ` — notes: ${s.notes}` : ""}`;
  }
  if (session.taskId) {
    const t = await prisma.task.findUnique({ where: { id: session.taskId } });
    if (t)
      focus = `\n\nFOCUS OF THIS CONVERSATION: task [task ${t.id}] "${t.title}" (deferred ${t.deferralCount} times${t.dreadFlag ? ", dread-flagged" : ""})`;
  }

  const history = session.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  history.push({ role: "user", content: message });

  const sessionId = session.id;
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let full = "";
      try {
        const s = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 1500,
          system: `${chatSystem(session!.kind)}\n\nCURRENT CONTEXT:\n${context}${focus}`,
          messages: history,
        });
        s.on("text", (delta) => {
          full += delta;
          controller.enqueue(encoder.encode(delta));
        });
        await s.finalMessage();
      } catch (e) {
        console.error("chat stream failed", e);
        const msg = `\n[${describeAnthropicError(e)}]`;
        full += msg;
        controller.enqueue(encoder.encode(msg));
      }
      await prisma.chatMessage.create({
        data: { sessionId, role: "assistant", content: full },
      });
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "x-session-id": session.id,
      "Cache-Control": "no-cache",
    },
  });
}
