import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PATCH /api/stresses/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const b = await req.json();
  const data: Record<string, unknown> = {};
  if (b.status) {
    data.status = b.status;
    if (b.status === "closed") data.closedAt = new Date();
    data.lastMovementAt = new Date();
  }
  for (const key of ["title", "notes", "domainId", "decomposition"]) {
    if (key in b) data[key] = b[key];
  }
  const stress = await prisma.stress.update({ where: { id }, data });
  return NextResponse.json({ stress });
}
