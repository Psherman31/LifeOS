import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { askJSON, describeAnthropicError } from "@/lib/anthropic";
import { EXTRACT_SYSTEM } from "@/lib/prompts";
import { mondayOf, todayLocal } from "@/lib/dates";

// POST /api/chat/extract { sessionId }
// Turns a finished conversation into real records: tasks, projects,
// released tasks, weekly intentions.
export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) return NextResponse.json({ error: "No such session" }, { status: 404 });

  const transcript = session.messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  let extracted: {
    tasks: { title: string; context?: string; size?: string; deadline?: string | null }[];
    projects: { title: string; tasks?: { title: string; context?: string; size?: string }[] }[];
    releasedTaskIds: string[];
    intentions: string[];
    summary: string;
  };
  try {
    extracted = await askJSON({
      system: EXTRACT_SYSTEM,
      user: `Conversation kind: ${session.kind}\n\nTRANSCRIPT:\n${transcript}`,
    });
  } catch (e) {
    console.error("extract failed", e);
    return NextResponse.json(
      { error: `Couldn't file the actions — ${describeAnthropicError(e)} The conversation is saved.` },
      { status: 502 }
    );
  }

  const created: { kind: string; id: string; title: string }[] = [];
  const stress = session.stressId
    ? await prisma.stress.findUnique({ where: { id: session.stressId } })
    : null;

  for (const p of extracted.projects ?? []) {
    const proj = await prisma.project.create({
      data: { title: p.title, stressId: stress?.id ?? null, domainId: stress?.domainId ?? null },
    });
    created.push({ kind: "project", id: proj.id, title: proj.title });
    for (const t of p.tasks ?? []) {
      const task = await prisma.task.create({
        data: {
          title: t.title,
          projectId: proj.id,
          stressId: stress?.id ?? null,
          domainId: stress?.domainId ?? null,
          context: t.context ?? "any",
          size: t.size ?? "medium",
          source: "chat",
        },
      });
      created.push({ kind: "task", id: task.id, title: task.title });
    }
  }

  for (const t of extracted.tasks ?? []) {
    const task = await prisma.task.create({
      data: {
        title: t.title,
        stressId: stress?.id ?? null,
        domainId: stress?.domainId ?? null,
        context: t.context ?? "any",
        size: t.size ?? "medium",
        deadline: t.deadline ? new Date(`${t.deadline}T12:00:00Z`) : null,
        source: "chat",
      },
    });
    created.push({ kind: "task", id: task.id, title: task.title });
  }

  for (const id of extracted.releasedTaskIds ?? []) {
    await prisma.task
      .update({ where: { id }, data: { status: "released" } })
      .catch(() => null);
  }

  if (stress && created.length) {
    await prisma.stress.update({
      where: { id: stress.id },
      data: { decomposition: "partial", lastMovementAt: new Date() },
    });
  }

  if (session.kind === "weekly" && (extracted.intentions ?? []).length) {
    await prisma.weeklyReview.create({
      data: {
        weekOf: mondayOf(todayLocal()),
        summary: extracted.summary ?? null,
        intentions: JSON.stringify(extracted.intentions),
      },
    });
  }

  await prisma.chatSession.update({
    where: { id: session.id },
    data: { summary: extracted.summary ?? null },
  });

  return NextResponse.json({
    created,
    released: (extracted.releasedTaskIds ?? []).length,
    intentions: extracted.intentions ?? [],
    summary: extracted.summary ?? null,
  });
}
