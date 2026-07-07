import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { askJSON, describeAnthropicError } from "@/lib/anthropic";
import { MORNING_SYSTEM } from "@/lib/prompts";
import { MORNING_SCHEMA } from "@/lib/schemas";
import { buildContext } from "@/lib/context";
import { todayLocal } from "@/lib/dates";

// POST /api/day/draft { note?, lowEnergy? }
// Returns the AI briefing plus suggested must/extra ids; also returns the
// full candidate pool so the picker can offer everything.
export async function POST(req: NextRequest) {
  const { note, lowEnergy } = await req.json().catch(() => ({}));
  const date = todayLocal();

  const plan = await prisma.dayPlan.upsert({
    where: { date },
    update: { morningNote: note ?? undefined, lowEnergyMode: !!lowEnergy },
    create: { date, morningNote: note ?? null, lowEnergyMode: !!lowEnergy },
  });

  const context = await buildContext({ forDate: date });

  let draft: {
    briefing: string;
    mustIds: string[];
    extraIds: string[];
    sequencingNote: string | null;
  };
  try {
    draft = await askJSON({
      system: MORNING_SYSTEM,
      user: `${context}\n\nlowEnergyMode: ${!!lowEnergy}\nUser's note on how they're coming into the day: ${
        note?.trim() || "(none)"
      }\n\nPrepare the morning notes.`,
      schema: MORNING_SCHEMA,
      maxTokens: 2000,
    });
  } catch (e) {
    console.error("morning draft failed", e);
    draft = {
      briefing: `I couldn't prepare notes just now — ${describeAnthropicError(e)} Pick your day manually below.`,
      mustIds: [],
      extraIds: [],
      sequencingNote: null,
    };
  }

  await prisma.dayPlan.update({
    where: { id: plan.id },
    data: { morningBriefing: draft.briefing },
  });

  // Full candidate pool for the picker.
  const [tasks, habits] = await Promise.all([
    prisma.task.findMany({
      where: { status: "pool" },
      include: { domain: true, project: true, stress: true, blockedBy: true },
      orderBy: [{ deadline: "asc" }, { createdAt: "asc" }],
      take: 100,
    }),
    prisma.habit.findMany({ where: { status: { in: ["forming", "established"] } } }),
  ]);
  const available = tasks.filter((t) => !t.blockedBy || t.blockedBy.status === "done");

  return NextResponse.json({ date, draft, tasks: available, habits });
}
