import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PATCH /api/tasks/[id] — status changes and edits.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const b = await req.json();
  const data: Record<string, unknown> = {};

  if (b.status) {
    data.status = b.status;
    if (b.status === "done") {
      data.doneAt = new Date();
      const t = await prisma.task.findUnique({ where: { id } });
      if (t?.dreadFlag) data.braveActFlag = true;
      // Free anything waiting behind this task.
      await prisma.task.updateMany({ where: { blockedById: id }, data: { blockedById: null } });
      if (t?.stressId) {
        await prisma.stress.update({
          where: { id: t.stressId },
          data: { lastMovementAt: new Date() },
        });
      }
    }
  }
  for (const key of ["title", "notes", "context", "size", "domainId", "waitingOnPerson"]) {
    if (key in b) data[key] = b[key];
  }
  if ("dreadFlag" in b) data.dreadFlag = !!b.dreadFlag;
  if ("deadline" in b) {
    data.deadline = b.deadline ? new Date(`${b.deadline}T12:00:00Z`) : null;
  }

  const task = await prisma.task.update({ where: { id }, data });
  return NextResponse.json({ task });
}
