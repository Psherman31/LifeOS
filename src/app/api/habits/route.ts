import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/habits
export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });
  const habit = await prisma.habit.create({
    data: {
      title: b.title.trim(),
      type: b.type === "efficiency" ? "efficiency" : "values",
      trigger: b.trigger ?? null,
      minimumVersion: b.minimumVersion ?? null,
      context: b.context ?? "any",
      domainId: b.domainId ?? null,
    },
  });
  return NextResponse.json({ habit });
}
