"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import CaptureBox from "@/components/CaptureBox";
import type { DayResponse, PlanItem } from "@/lib/types";

function human(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function TodayPage() {
  const [data, setData] = useState<DayResponse | null>(null);
  const [dismissedReentry, setDismissedReentry] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/day");
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleItem(item: PlanItem) {
    const next = item.outcome === "done" ? "pending" : "done";
    await fetch(`/api/day/item/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome: next }),
    });
    load();
  }

  if (!data) {
    return <main className="py-16 text-center text-soft">…</main>;
  }

  const { plan, reentry, gapDays, ledgerCount } = data;
  const musts = plan.items.filter((i) => i.tier === "must");
  const extras = plan.items.filter((i) => i.tier === "extra");
  const mustsDone = musts.length > 0 && musts.every((i) => i.outcome === "done");

  return (
    <main className="flex flex-col gap-4">
      <header>
        <p className="text-sm text-soft">{human(data.date)}</p>
        <h1 className="ritual-heading">Today</h1>
      </header>

      {reentry && !dismissedReentry && (
        <div className="card border-accent/30 bg-accent-soft">
          <p className="font-medium">Welcome back.</p>
          <p className="mt-1 text-sm text-soft">
            It's been a little while — that's fine. Nothing piled up.
            {ledgerCount > 0 && " Your values ledger is intact; the gap doesn't erase it."}{" "}
            Let's figure out where things stand.
          </p>
          <div className="mt-3 flex gap-2">
            <Link href="/chat?kind=reentry" className="btn-primary">
              Take stock together
            </Link>
            <button className="btn-ghost" onClick={() => setDismissedReentry(true)}>
              Just plan today
            </button>
          </div>
          <p className="mt-2 text-xs text-soft">({gapDays} days — noted, not counted.)</p>
        </div>
      )}

      <CaptureBox onCaptured={load} />

      {plan.status === "draft" && (
        <div className="card">
          <p className="ritual-heading text-xl">Today will be a win if…</p>
          <p className="mt-1 text-sm text-soft">
            Your day hasn't been planned yet. I'll prepare notes and a draft list — you pick.
          </p>
          <div className="mt-3 flex gap-2">
            <Link href="/morning" className="btn-primary">
              Morning review
            </Link>
            <Link href="/morning?lowEnergy=1" className="btn-ghost">
              Low-energy day
            </Link>
          </div>
        </div>
      )}

      {plan.status !== "draft" && (
        <>
          {plan.morningBriefing && plan.status === "committed" && (
            <div className="card bg-accent-soft/60 border-accent/20">
              <p className="text-xs font-medium uppercase tracking-wide text-accent">
                Notes for today
              </p>
              <p className="mt-1 text-sm leading-relaxed">{plan.morningBriefing}</p>
            </div>
          )}

          <section>
            <h2 className="ritual-heading text-xl">Today will be a win if…</h2>
            {mustsDone && (
              <p className="mt-1 text-sm font-medium text-accent">
                The win condition is met. Anything else is extra.
              </p>
            )}
            <ul className="mt-2 flex flex-col gap-2">
              {musts.map((item) => (
                <ItemRow key={item.id} item={item} onToggle={toggleItem} />
              ))}
              {musts.length === 0 && (
                <li className="text-sm text-soft">No must-dos today — a light day is a real day.</li>
              )}
            </ul>
          </section>

          {extras.length > 0 && (
            <section>
              <h2 className="text-sm font-medium uppercase tracking-wide text-soft">
                An honest day's work
              </h2>
              <ul className="mt-2 flex flex-col gap-2">
                {extras.map((item) => (
                  <ItemRow key={item.id} item={item} onToggle={toggleItem} />
                ))}
              </ul>
            </section>
          )}

          {plan.status === "committed" && (
            <Link href="/evening" className="btn-ghost self-start">
              End-of-day review →
            </Link>
          )}

          {plan.status === "reviewed" && plan.eveningSummary && (
            <div className="card">
              <p className="text-xs font-medium uppercase tracking-wide text-accent">
                Evening debrief
              </p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
                {plan.eveningSummary}
              </p>
              <p className="mt-3 text-sm text-soft">
                The day is closed. Anything new goes in the box for tomorrow.
              </p>
            </div>
          )}
        </>
      )}

      <footer className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-soft">
        <Link href="/chat?kind=weekly" className="underline-offset-2 hover:underline">
          Weekly conversation
        </Link>
        <Link href="/chat" className="underline-offset-2 hover:underline">
          Talk something through
        </Link>
      </footer>
    </main>
  );
}

function ItemRow({ item, onToggle }: { item: PlanItem; onToggle: (i: PlanItem) => void }) {
  const title = item.task?.title ?? item.habit?.title ?? "";
  const done = item.outcome === "done";
  const released = item.outcome === "released" || item.outcome === "missed";
  return (
    <li className="card flex items-center gap-3 py-3">
      <button
        aria-label={done ? "Mark not done" : "Mark done"}
        onClick={() => onToggle(item)}
        className={`h-6 w-6 shrink-0 rounded-full border-2 transition-colors ${
          done ? "border-accent bg-accent" : "border-line bg-white"
        }`}
      >
        {done && (
          <svg viewBox="0 0 24 24" className="h-full w-full p-0.5 text-white" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-[15px] ${done || released ? "text-soft line-through" : ""}`}>{title}</p>
        <div className="mt-0.5 flex gap-1.5">
          {item.habit && <span className="chip-muted">habit</span>}
          {item.dreadFlag && !done && <span className="chip">small step counts</span>}
          {item.dreadFlag && done && <span className="chip">brave</span>}
          {item.task?.context && item.task.context !== "any" && (
            <span className="chip-muted">{item.task.context}</span>
          )}
        </div>
      </div>
    </li>
  );
}
