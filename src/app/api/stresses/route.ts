import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/stresses — name an area of stress directly.
export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });
  const stress = await prisma.stress.create({
    data: { title: b.title.trim(), notes: b.notes ?? null, domainId: b.domainId ?? null },
  });
  return NextResponse.json({ stress });
}
