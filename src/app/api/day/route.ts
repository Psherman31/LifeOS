import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayLocal, daysBetween } from "@/lib/dates";

const REENTRY_GAP_DAYS = 4;

// GET /api/day → today's plan (created as draft if missing) + re-entry state.
export async function GET() {
  const date = todayLocal();

  const state = await prisma.appState.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  const gapDays = daysBetween(state.lastActiveAt, new Date());
  const reentry = gapDays >= REENTRY_GAP_DAYS;
  await prisma.appState.update({ where: { id: 1 }, data: { lastActiveAt: new Date() } });

  const plan = await prisma.dayPlan.upsert({
    where: { date },
    update: {},
    create: { date },
    include: {
      items: {
        include: { task: { include: { blockedBy: true } }, habit: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const ledgerCount = await prisma.valuesLedgerEntry.count();

  return NextResponse.json({ date, plan, reentry, gapDays, ledgerCount });
}
