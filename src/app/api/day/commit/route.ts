import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayLocal } from "@/lib/dates";

type CommitItem = {
  taskId?: string;
  habitId?: string;
  tier: "must" | "extra";
  dreadFlag?: boolean;
};

// POST /api/day/commit { items: CommitItem[], winStatement?, calendarChecked? }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const items: CommitItem[] = body.items ?? [];
  const date = todayLocal();

  const plan = await prisma.dayPlan.upsert({
    where: { date },
    update: {},
    create: { date },
  });

  // Replace any prior selection (re-planning a day is allowed and cheap).
  await prisma.dayPlanItem.deleteMany({ where: { dayPlanId: plan.id, outcome: "pending" } });

  let sortOrder = 0;
  for (const item of items) {
    if (!item.taskId && !item.habitId) continue;
    await prisma.dayPlanItem.create({
      data: {
        dayPlanId: plan.id,
        taskId: item.taskId ?? null,
        habitId: item.habitId ?? null,
        tier: item.tier === "must" ? "must" : "extra",
        dreadFlag: !!item.dreadFlag,
        sortOrder: sortOrder++,
      },
    });
    if (item.taskId && item.dreadFlag) {
      await prisma.task.update({ where: { id: item.taskId }, data: { dreadFlag: true } });
    }
  }

  const updated = await prisma.dayPlan.update({
    where: { id: plan.id },
    data: {
      status: "committed",
      committedAt: new Date(),
      winStatement: body.winStatement ?? plan.winStatement,
      calendarChecked: body.calendarChecked ?? plan.calendarChecked,
    },
    include: {
      items: {
        include: { task: { include: { blockedBy: true } }, habit: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return NextResponse.json({ plan: updated });
}
