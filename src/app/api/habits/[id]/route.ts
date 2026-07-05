import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PATCH /api/habits/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const b = await req.json();
  const data: Record<string, unknown> = {};
  for (const key of ["title", "type", "trigger", "minimumVersion", "status", "context", "domainId"]) {
    if (key in b) data[key] = b[key];
  }
  const habit = await prisma.habit.update({ where: { id }, data });
  return NextResponse.json({ habit });
}
