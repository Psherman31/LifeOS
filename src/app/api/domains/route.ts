import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/domains
export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const count = await prisma.domain.count();
  const domain = await prisma.domain.create({
    data: { name: b.name.trim(), sortOrder: count },
  });
  return NextResponse.json({ domain });
}
