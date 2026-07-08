import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayLocal } from "@/lib/dates";

// GET /api/export — a complete, human-readable JSON snapshot of everything.
// Cheap insurance: the whole database lives in one SQLite file on one volume,
// and the values ledger is meant to survive hard stretches. This lets you
// keep your own copy anywhere (iCloud, email, a folder).
export async function GET() {
  const [
    domains,
    stresses,
    projects,
    tasks,
    habits,
    dayPlans,
    ledger,
    chatSessions,
    weeklyReviews,
    appState,
  ] = await Promise.all([
    prisma.domain.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.stress.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.project.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.task.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.habit.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.dayPlan.findMany({
      orderBy: { date: "asc" },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.valuesLedgerEntry.findMany({ orderBy: [{ date: "asc" }, { createdAt: "asc" }] }),
    prisma.chatSession.findMany({
      orderBy: { createdAt: "asc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.weeklyReview.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.appState.findUnique({ where: { id: 1 } }),
  ]);

  const snapshot = {
    lifeos_export_version: 1,
    exported_at: new Date().toISOString(),
    counts: {
      domains: domains.length,
      stresses: stresses.length,
      projects: projects.length,
      tasks: tasks.length,
      habits: habits.length,
      dayPlans: dayPlans.length,
      ledgerEntries: ledger.length,
      chatSessions: chatSessions.length,
      weeklyReviews: weeklyReviews.length,
    },
    domains,
    stresses,
    projects,
    tasks,
    habits,
    dayPlans,
    valuesLedger: ledger,
    chatSessions,
    weeklyReviews,
    appState,
  };

  const body = JSON.stringify(snapshot, null, 2);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="lifeos-backup-${todayLocal()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
