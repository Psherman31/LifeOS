import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayLocal } from "@/lib/dates";

// POST /api/ledger — manual values-ledger entry.
export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.description?.trim()) {
    return NextResponse.json({ error: "Description required" }, { status: 400 });
  }
  const entry = await prisma.valuesLedgerEntry.create({
    data: {
      date: todayLocal(),
      description: b.description.trim(),
      value: b.value ?? null,
      note: b.note ?? null,
    },
  });
  return NextResponse.json({ entry });
}
