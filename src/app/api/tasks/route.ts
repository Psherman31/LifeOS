import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/tasks — direct manual add (no AI parsing)
export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });
  const task = await prisma.task.create({
    data: {
      title: b.title.trim(),
      notes: b.notes ?? null,
      domainId: b.domainId ?? null,
      projectId: b.projectId ?? null,
      stressId: b.stressId ?? null,
      context: b.context ?? "any",
      size: b.size ?? "medium",
      deadline: b.deadline ? new Date(`${b.deadline}T12:00:00Z`) : null,
      source: "manual",
    },
  });
  return NextResponse.json({ task });
}
