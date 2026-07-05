import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PATCH /api/day/item/[id] { outcome } — quick check-off during the day.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const b = await req.json();
  const item = await prisma.dayPlanItem.update({
    where: { id },
    data: { outcome: b.outcome ?? "done" },
    include: { task: true },
  });
  if (b.outcome === "done" && item.taskId && item.task) {
    await prisma.task.update({
      where: { id: item.taskId },
      data: {
        status: "done",
        doneAt: new Date(),
        braveActFlag: item.dreadFlag || item.task.dreadFlag,
      },
    });
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
  }
  return NextResponse.json({ item });
}
