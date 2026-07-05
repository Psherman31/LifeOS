// Builds the context block passed to Claude — the "continuity of
// understanding" that makes one entity out of assistant, PM, and coach.

import { prisma } from "@/lib/db";
import { todayLocal, addDays, humanDate } from "@/lib/dates";

function line(parts: (string | null | undefined | false)[]): string {
  return parts.filter(Boolean).join(" ");
}

export async function buildContext(opts?: { forDate?: string }): Promise<string> {
  const today = opts?.forDate ?? todayLocal();

  const [domains, stresses, projects, tasks, habits, recentPlans, ledger, weekly] =
    await Promise.all([
      prisma.domain.findMany({ where: { archived: false }, orderBy: { sortOrder: "asc" } }),
      prisma.stress.findMany({
        where: { status: { in: ["active", "held"] } },
        include: { domain: true, tasks: { where: { status: "pool" }, select: { id: true } } },
        orderBy: { lastMovementAt: "asc" },
      }),
      prisma.project.findMany({
        where: { status: { in: ["active", "waiting"] } },
        include: { domain: true, tasks: { where: { status: "pool" }, select: { id: true } } },
      }),
      prisma.task.findMany({
        where: { status: { in: ["pool", "waiting"] } },
        include: { domain: true, project: true, stress: true, blockedBy: true },
        orderBy: [{ deadline: "asc" }, { createdAt: "asc" }],
        take: 80,
      }),
      prisma.habit.findMany({ where: { status: { in: ["forming", "established"] } } }),
      prisma.dayPlan.findMany({
        where: { date: { lt: today, gte: addDays(today, -7) } },
        include: { items: { include: { task: true, habit: true } } },
        orderBy: { date: "desc" },
      }),
      prisma.valuesLedgerEntry.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
      prisma.weeklyReview.findFirst({ orderBy: { createdAt: "desc" } }),
    ]);

  const out: string[] = [];
  out.push(`TODAY: ${today} (${humanDate(today)})`);
  out.push(`DOMAINS: ${domains.map((d) => d.name).join(" | ") || "none yet"}`);

  out.push("\nAREAS OF STRESS (active/held):");
  if (!stresses.length) out.push("  none");
  for (const s of stresses) {
    out.push(
      line([
        `  [stress ${s.id}]`,
        `"${s.title}"`,
        s.domain && `(${s.domain.name})`,
        `status=${s.status}, decomposition=${s.decomposition}, open-tasks=${s.tasks.length},`,
        `last-movement=${s.lastMovementAt.toISOString().slice(0, 10)}`,
        s.avoidanceFlag && "AVOIDANCE-FLAGGED",
      ])
    );
  }

  out.push("\nPROJECTS (active/waiting):");
  if (!projects.length) out.push("  none");
  for (const p of projects) {
    out.push(
      line([
        `  [project ${p.id}]`,
        `"${p.title}"`,
        p.domain && `(${p.domain.name})`,
        p.deadline && `deadline=${p.deadline.toISOString().slice(0, 10)}`,
        `open-tasks=${p.tasks.length}`,
        p.waitingOn && `waiting-on="${p.waitingOn}"`,
      ])
    );
  }

  out.push("\nTASK POOL (available + waiting):");
  if (!tasks.length) out.push("  none");
  for (const t of tasks) {
    const blocked = t.blockedBy && t.blockedBy.status !== "done";
    out.push(
      line([
        `  [task ${t.id}]`,
        `"${t.title}"`,
        `ctx=${t.context}, size=${t.size},`,
        t.deadline && `deadline=${t.deadline.toISOString().slice(0, 10)},`,
        t.domain && `domain=${t.domain.name},`,
        t.project && `project="${t.project.title}",`,
        t.stress && `stress="${t.stress.title}",`,
        t.deferralCount > 0 && `deferred=${t.deferralCount}x,`,
        t.dreadFlag && "DREAD-FLAGGED,",
        blocked && `BLOCKED-BY [task ${t.blockedById}] "${t.blockedBy!.title}",`,
        t.waitingOnPerson && `waiting-on-person="${t.waitingOnPerson}",`,
        `created=${t.createdAt.toISOString().slice(0, 10)}`,
      ])
    );
  }

  out.push("\nHABITS:");
  if (!habits.length) out.push("  none");
  for (const h of habits) {
    out.push(
      line([
        `  [habit ${h.id}]`,
        `"${h.title}"`,
        `type=${h.type}, ctx=${h.context},`,
        h.trigger && `anchor="${h.trigger}",`,
        h.minimumVersion && `minimum="${h.minimumVersion}"`,
      ])
    );
  }

  out.push("\nRECENT DAYS:");
  if (!recentPlans.length) out.push("  none");
  for (const plan of recentPlans) {
    const items = plan.items.map((i) => {
      const title = i.task?.title ?? i.habit?.title ?? "?";
      let o = i.outcome;
      if (i.missCause) o += `:${i.missCause}`;
      if (i.blockerNote) o += ` ("${i.blockerNote}")`;
      return `${i.tier === "must" ? "MUST" : "extra"} "${title}" → ${o}`;
    });
    out.push(`  ${plan.date} [${plan.status}]: ${items.join("; ") || "no items"}`);
    if (plan.eveningSummary) out.push(`    debrief: ${plan.eveningSummary}`);
  }

  out.push("\nVALUES LEDGER (recent):");
  if (!ledger.length) out.push("  empty so far");
  for (const e of ledger) {
    out.push(line([`  ${e.date}:`, e.description, e.value && `[${e.value}]`]));
  }

  if (weekly?.intentions) {
    out.push(`\nCURRENT WEEKLY INTENTIONS (week of ${weekly.weekOf}):`);
    try {
      for (const i of JSON.parse(weekly.intentions) as string[]) out.push(`  - ${i}`);
    } catch {
      out.push(`  ${weekly.intentions}`);
    }
  }

  return out.join("\n");
}
