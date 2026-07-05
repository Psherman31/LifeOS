import Link from "next/link";
import { prisma } from "@/lib/db";
import { QuickAdd, StressActions, TaskActions } from "@/components/browse-actions";

export const dynamic = "force-dynamic";

// The pool: everything being held, organized by domain. Deliberately calm —
// no counts of overdue anything, no red. The system resurfaces things at the
// right moment; this page is just for looking around.
export default async function BrowsePage() {
  const [domains, unassignedStresses, unassignedTasks, habits] = await Promise.all([
    prisma.domain.findMany({
      where: { archived: false },
      orderBy: { sortOrder: "asc" },
      include: {
        stresses: {
          where: { status: { in: ["active", "held"] } },
          include: { tasks: { where: { status: "pool" } }, projects: true },
          orderBy: { lastMovementAt: "asc" },
        },
        projects: {
          where: { status: { in: ["active", "waiting"] } },
          include: { tasks: { where: { status: "pool" } } },
        },
        tasks: {
          where: { status: "pool", projectId: null, stressId: null },
          orderBy: [{ deadline: "asc" }, { createdAt: "asc" }],
          include: { blockedBy: true },
        },
      },
    }),
    prisma.stress.findMany({
      where: { status: { in: ["active", "held"] }, domainId: null },
      include: { tasks: { where: { status: "pool" } }, projects: true },
    }),
    prisma.task.findMany({
      where: { status: "pool", domainId: null, projectId: null, stressId: null },
      orderBy: { createdAt: "asc" },
      include: { blockedBy: true },
    }),
    prisma.habit.findMany({ where: { status: { in: ["forming", "established"] } } }),
  ]);

  type S = (typeof domains)[number]["stresses"][number];
  type T = (typeof domains)[number]["tasks"][number];

  function StressCard({ s }: { s: S }) {
    return (
      <div className="card py-3">
        <p className="text-[15px]">{s.title}</p>
        <p className="mt-0.5 text-xs text-soft">
          area of stress · {s.status === "held" ? "held for now" : "active"}
          {s.tasks.length > 0 && ` · ${s.tasks.length} open step${s.tasks.length === 1 ? "" : "s"}`}
          {s.tasks.length === 0 &&
            s.decomposition === "none" &&
            " · not broken down yet — naming it already counts"}
        </p>
        <StressActions id={s.id} status={s.status} />
      </div>
    );
  }

  function TaskRow({ t }: { t: T }) {
    const blocked = t.blockedBy && t.blockedBy.status !== "done";
    return (
      <div className="card flex items-center justify-between gap-2 py-2.5">
        <div className="min-w-0">
          <p className="text-[15px]">{t.title}</p>
          <p className="text-xs text-soft">
            {[
              t.context !== "any" ? t.context : null,
              t.deadline ? `due ${t.deadline.toISOString().slice(0, 10)}` : null,
              blocked ? `waiting on: ${t.blockedBy!.title}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || " "}
          </p>
        </div>
        <TaskActions id={t.id} />
      </div>
    );
  }

  return (
    <main className="flex flex-col gap-6">
      <header>
        <h1 className="ritual-heading">Browse</h1>
        <p className="mt-1 text-sm text-soft">
          Everything being held, by domain. Nothing here is overdue — it's just waiting.
        </p>
      </header>

      {domains.map((d) => (
        <section key={d.id} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-soft">{d.name}</h2>
          {d.stresses.map((s) => (
            <StressCard key={s.id} s={s} />
          ))}
          {d.projects.map((p) => (
            <div key={p.id} className="card py-3">
              <p className="text-[15px]">{p.title}</p>
              <p className="mt-0.5 text-xs text-soft">
                project · {p.tasks.length} open step{p.tasks.length === 1 ? "" : "s"}
                {p.deadline && ` · due ${p.deadline.toISOString().slice(0, 10)}`}
              </p>
              <div className="mt-2 flex flex-col gap-1.5">
                {p.tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 pl-2 text-sm">
                    <span className="min-w-0">{t.title}</span>
                    <TaskActions id={t.id} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          {d.tasks.map((t) => (
            <TaskRow key={t.id} t={t} />
          ))}
          <QuickAdd kind="stress" domainId={d.id} placeholder={`name a stress in ${d.name}`} />
        </section>
      ))}

      {(unassignedStresses.length > 0 || unassignedTasks.length > 0) && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-soft">Unsorted</h2>
          {unassignedStresses.map((s) => (
            <StressCard key={s.id} s={s as unknown as S} />
          ))}
          {unassignedTasks.map((t) => (
            <TaskRow key={t.id} t={t as unknown as T} />
          ))}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-soft">Habits</h2>
        {habits.map((h) => (
          <div key={h.id} className="card py-3">
            <p className="text-[15px]">{h.title}</p>
            <p className="text-xs text-soft">
              {[h.type === "values" ? "values-based" : "efficiency", h.trigger && `after: ${h.trigger}`, h.minimumVersion && `minimum: ${h.minimumVersion}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        ))}
        <QuickAdd kind="habit" placeholder="add a habit" />
      </section>

      <section className="flex flex-col gap-2">
        <QuickAdd kind="domain" placeholder="add a life domain" />
        <p className="text-xs text-soft">
          Done and released items are kept but out of sight.{" "}
          <Link href="/ledger" className="underline underline-offset-2">
            The values ledger
          </Link>{" "}
          is the only record that matters.
        </p>
      </section>
    </main>
  );
}
