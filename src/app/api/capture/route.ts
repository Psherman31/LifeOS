import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { askJSON } from "@/lib/anthropic";
import { CAPTURE_SYSTEM } from "@/lib/prompts";
import { todayLocal } from "@/lib/dates";

type ParsedChild = { title: string; context?: string; size?: string };
type ParsedItem = {
  kind: "task" | "stress" | "project";
  title: string;
  notes?: string | null;
  domain?: string | null;
  context?: string;
  size?: string;
  deadline?: string | null;
  children?: ParsedChild[];
};

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Nothing to capture" }, { status: 400 });
  }

  const domains = await prisma.domain.findMany({ where: { archived: false } });
  const domainByName = new Map(domains.map((d) => [d.name.toLowerCase(), d.id]));

  let parsed: { items: ParsedItem[] };
  try {
    parsed = await askJSON<{ items: ParsedItem[] }>({
      system: CAPTURE_SYSTEM,
      user: `Today is ${todayLocal()}. Available domains: ${domains
        .map((d) => d.name)
        .join(" | ")}\n\nCapture:\n${text}`,
    });
  } catch (e) {
    console.error("capture parse failed", e);
    return NextResponse.json(
      { error: "Couldn't reach the AI to sort this — nothing was lost, try again in a moment." },
      { status: 502 }
    );
  }

  const created: { kind: string; id: string; title: string }[] = [];

  for (const item of parsed.items ?? []) {
    const domainId = item.domain ? domainByName.get(item.domain.toLowerCase()) ?? null : null;
    const deadline = item.deadline ? new Date(`${item.deadline}T12:00:00Z`) : null;
    const base = {
      notes: item.notes ?? null,
      domainId,
    };

    if (item.kind === "stress") {
      const s = await prisma.stress.create({
        data: { title: item.title, ...base },
      });
      created.push({ kind: "stress", id: s.id, title: s.title });
    } else if (item.kind === "project") {
      const p = await prisma.project.create({
        data: { title: item.title, ...base, deadline },
      });
      created.push({ kind: "project", id: p.id, title: p.title });
      for (const child of item.children ?? []) {
        const t = await prisma.task.create({
          data: {
            title: child.title,
            projectId: p.id,
            domainId,
            context: child.context ?? "any",
            size: child.size ?? "medium",
            source: "capture",
          },
        });
        created.push({ kind: "task", id: t.id, title: t.title });
      }
    } else {
      const t = await prisma.task.create({
        data: {
          title: item.title,
          ...base,
          deadline,
          context: item.context ?? "any",
          size: item.size ?? "medium",
          source: "capture",
        },
      });
      created.push({ kind: "task", id: t.id, title: t.title });
    }
  }

  return NextResponse.json({ created });
}
