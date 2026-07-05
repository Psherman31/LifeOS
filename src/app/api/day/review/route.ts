import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { askJSON } from "@/lib/anthropic";
import { EVENING_SYSTEM } from "@/lib/prompts";
import { buildContext } from "@/lib/context";
import { todayLocal } from "@/lib/dates";

type Outcome = {
  itemId: string;
  outcome: "done" | "missed" | "released";
  missCause?: "blocked" | "no_time" | "no_energy" | "avoided" | "not_priority";
  blockerNote?: string;
};

// POST /api/day/review
// { outcomes: Outcome[], eveningNote?, braveNote?, braveValue? }
// Applies outcomes, runs the AI debrief, creates unblocking tasks for
// tomorrow, and writes brave acts to the values ledger.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const outcomes: Outcome[] = body.outcomes ?? [];
  const date = todayLocal();

  const plan = await prisma.dayPlan.findUnique({
    where: { date },
    include: { items: { include: { task: true, habit: true } } },
  });
  if (!plan) return NextResponse.json({ error: "No plan for today" }, { status: 404 });

  const itemById = new Map(plan.items.map((i) => [i.id, i]));

  for (const o of outcomes) {
    const item = itemById.get(o.itemId);
    if (!item) continue;

    await prisma.dayPlanItem.update({
      where: { id: item.id },
      data: {
        outcome: o.outcome === "missed" ? "missed" : o.outcome,
        missCause: o.outcome === "missed" ? o.missCause ?? null : null,
        blockerNote: o.blockerNote ?? null,
      },
    });

    if (!item.taskId || !item.task) continue;
    const dread = item.dreadFlag || item.task.dreadFlag;

    if (o.outcome === "done") {
      await prisma.task.update({
        where: { id: item.taskId },
        data: { status: "done", doneAt: new Date(), braveActFlag: dread },
      });
      // Completing a blocker frees whatever was waiting behind it.
      await prisma.task.updateMany({
        where: { blockedById: item.taskId },
        data: { blockedById: null },
      });
      if (item.task.stressId) {
        await prisma.stress.update({
          where: { id: item.task.stressId },
          data: { lastMovementAt: new Date() },
        });
      }
    } else if (o.outcome === "released" || o.missCause === "not_priority") {
      await prisma.task.update({ where: { id: item.taskId }, data: { status: "released" } });
    } else if (o.outcome === "missed" && o.missCause === "avoided") {
      // Invisible counter — feeds the intervention ladder, never the UI.
      await prisma.task.update({
        where: { id: item.taskId },
        data: { deferralCount: { increment: 1 } },
      });
    }
  }

  // AI debrief.
  const context = await buildContext({ forDate: date });
  const outcomeLines = outcomes
    .map((o) => {
      const item = itemById.get(o.itemId);
      if (!item) return null;
      const title = item.task?.title ?? item.habit?.title ?? "?";
      const taskRef = item.taskId ? `[task ${item.taskId}]` : "[habit]";
      const dread = item.dreadFlag || item.task?.dreadFlag ? " (was dread-flagged)" : "";
      const cause = o.outcome === "missed" ? ` cause=${o.missCause ?? "?"}` : "";
      const note = o.blockerNote ? ` blocker="${o.blockerNote}"` : "";
      return `${taskRef} ${item.tier.toUpperCase()} "${title}"${dread} → ${o.outcome}${cause}${note}`;
    })
    .filter(Boolean)
    .join("\n");

  let debrief: {
    summary: string;
    unblockTasks: {
      title: string;
      context?: string;
      size?: string;
      followUpTaskId?: string;
    }[];
    braveActs: { description: string; value?: string }[];
    tomorrowNote: string | null;
  };
  try {
    debrief = await askJSON({
      system: EVENING_SYSTEM,
      user: `${context}\n\nTODAY'S RECORDED OUTCOMES:\n${outcomeLines || "(none recorded)"}\n\nUser's note about the day: ${
        body.eveningNote?.trim() || "(none)"
      }\n\nDebrief the day.`,
      maxTokens: 1800,
    });
  } catch (e) {
    console.error("evening debrief failed", e);
    debrief = { summary: "", unblockTasks: [], braveActs: [], tomorrowNote: null };
  }

  // Create unblocking tasks; the missed task waits behind them.
  const createdTasks: { id: string; title: string }[] = [];
  for (const u of debrief.unblockTasks ?? []) {
    if (!u.title) continue;
    const followUp = u.followUpTaskId
      ? await prisma.task.findUnique({ where: { id: u.followUpTaskId } })
      : null;
    const t = await prisma.task.create({
      data: {
        title: u.title,
        context: u.context ?? "any",
        size: u.size ?? "quick",
        source: "system",
        domainId: followUp?.domainId ?? null,
        projectId: followUp?.projectId ?? null,
        stressId: followUp?.stressId ?? null,
      },
    });
    if (followUp) {
      await prisma.task.update({ where: { id: followUp.id }, data: { blockedById: t.id } });
    }
    createdTasks.push({ id: t.id, title: t.title });
  }

  // Values ledger: AI-recognized brave acts + the user's own entry.
  const ledger: { description: string; value?: string }[] = [...(debrief.braveActs ?? [])];
  if (body.braveNote?.trim()) {
    ledger.push({ description: body.braveNote.trim(), value: body.braveValue ?? null });
  }
  const dreadDoneIds = new Set(
    outcomes
      .filter((o) => {
        const item = itemById.get(o.itemId);
        return o.outcome === "done" && item && (item.dreadFlag || item.task?.dreadFlag);
      })
      .map((o) => o.itemId)
  );
  for (const entry of ledger) {
    await prisma.valuesLedgerEntry.create({
      data: {
        date,
        description: entry.description,
        value: entry.value ?? null,
        wasFlagged: dreadDoneIds.size > 0,
      },
    });
  }

  const summary =
    debrief.summary +
    (debrief.tomorrowNote ? `\nNote for tomorrow: ${debrief.tomorrowNote}` : "");

  const updated = await prisma.dayPlan.update({
    where: { id: plan.id },
    data: {
      status: "reviewed",
      reviewedAt: new Date(),
      eveningNote: body.eveningNote ?? null,
      eveningSummary: summary || null,
    },
  });

  return NextResponse.json({
    plan: updated,
    summary: debrief.summary,
    tomorrowNote: debrief.tomorrowNote,
    createdTasks,
    ledgerEntries: ledger.length,
  });
}
