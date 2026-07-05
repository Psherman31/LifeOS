// Client-side shapes for API payloads (subset of Prisma models).

export type TaskLite = {
  id: string;
  title: string;
  notes?: string | null;
  status: string;
  context: string;
  size: string;
  deadline?: string | null;
  dreadFlag: boolean;
  domain?: { name: string } | null;
  project?: { title: string } | null;
  stress?: { title: string } | null;
  blockedBy?: { id: string; title: string; status: string } | null;
};

export type HabitLite = {
  id: string;
  title: string;
  type: string;
  context: string;
  trigger?: string | null;
  minimumVersion?: string | null;
};

export type PlanItem = {
  id: string;
  tier: "must" | "extra";
  outcome: string;
  missCause?: string | null;
  blockerNote?: string | null;
  dreadFlag: boolean;
  task?: TaskLite | null;
  habit?: HabitLite | null;
};

export type DayPlan = {
  id: string;
  date: string;
  status: "draft" | "committed" | "reviewed";
  winStatement?: string | null;
  morningBriefing?: string | null;
  eveningSummary?: string | null;
  lowEnergyMode: boolean;
  items: PlanItem[];
};

export type DayResponse = {
  date: string;
  plan: DayPlan;
  reentry: boolean;
  gapDays: number;
  ledgerCount: number;
};
