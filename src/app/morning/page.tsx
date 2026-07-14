"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { HabitLite, TaskLite } from "@/lib/types";

type Draft = {
  briefing: string;
  mustIds: string[];
  extraIds: string[];
  sequencingNote: string | null;
};

type Selection = { tier: "must" | "extra"; dread: boolean };

export default function MorningPage() {
  return (
    <Suspense>
      <Morning />
    </Suspense>
  );
}

function Morning() {
  const params = useSearchParams();
  const [step, setStep] = useState<"arrive" | "pick">("arrive");
  const [note, setNote] = useState("");
  const [lowEnergy, setLowEnergy] = useState(params.get("lowEnergy") === "1");
  const [calendarChecked, setCalendarChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [tasks, setTasks] = useState<TaskLite[]>([]);
  const [habits, setHabits] = useState<HabitLite[]>([]);
  const [selected, setSelected] = useState<Map<string, Selection>>(new Map());
  const [showPool, setShowPool] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function prepare() {
    setBusy(true);
    const res = await fetch("/api/day/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note, lowEnergy }),
    });
    setBusy(false);
    if (!res.ok) return;
    const body = await res.json();
    setDraft(body.draft);
    setTasks(body.tasks);
    setHabits(body.habits);
    const sel = new Map<string, Selection>();
    for (const id of body.draft.mustIds ?? []) sel.set(id, { tier: "must", dread: false });
    for (const id of body.draft.extraIds ?? [])
      if (!sel.has(id)) sel.set(id, { tier: "extra", dread: false });
    setSelected(sel);
    setStep("pick");
  }

  function cycle(id: string) {
    setSelected((prev) => {
      const next = new Map(prev);
      const cur = next.get(id);
      if (!cur) next.set(id, { tier: "extra", dread: false });
      else if (cur.tier === "extra") next.set(id, { ...cur, tier: "must" });
      else next.delete(id);
      return next;
    });
  }

  function toggleDread(id: string) {
    setSelected((prev) => {
      const next = new Map(prev);
      const cur = next.get(id);
      if (cur) next.set(id, { ...cur, dread: !cur.dread });
      return next;
    });
  }

  async function commit() {
    setBusy(true);
    setError(null);
    const habitIds = new Set(habits.map((h) => h.id));
    const items = Array.from(selected.entries()).map(([id, s]) => ({
      [habitIds.has(id) ? "habitId" : "taskId"]: id,
      tier: s.tier,
      dreadFlag: s.dread,
    }));
    try {
      const res = await fetch("/api/day/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, calendarChecked }),
      });
      if (!res.ok) throw new Error("commit failed");
      // Hard navigation (not router.push) so Today remounts and refetches
      // its plan. A soft push can reuse a cached Today whose status is still
      // "draft", which shows the morning-review prompt again — the loop.
      window.location.assign("/");
    } catch {
      setBusy(false);
      setError("Couldn't lock in the day just now — try that once more.");
    }
  }

  const suggestedIds = useMemo(
    () => new Set([...(draft?.mustIds ?? []), ...(draft?.extraIds ?? [])]),
    [draft]
  );
  const suggested = tasks.filter((t) => suggestedIds.has(t.id));
  const pool = tasks.filter((t) => !suggestedIds.has(t.id));
  const mustCount = Array.from(selected.values()).filter((s) => s.tier === "must").length;

  if (step === "arrive") {
    return (
      <main className="flex flex-col gap-4">
        <h1 className="ritual-heading">Morning review</h1>
        <div className="card flex flex-col gap-3">
          <label className="text-sm font-medium">How are you coming into the day?</label>
          <textarea
            className="input min-h-[64px] resize-none"
            placeholder="Optional — a sentence is plenty."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#2d6a4f]"
              checked={lowEnergy}
              onChange={(e) => setLowEnergy(e.target.checked)}
            />
            Low-energy day — keep the ask small
          </label>
          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#2d6a4f]"
              checked={calendarChecked}
              onChange={(e) => setCalendarChecked(e.target.checked)}
            />
            I've glanced at my calendar for today
          </label>
          {!calendarChecked && (
            <p className="text-xs text-soft">
              Worth ten seconds — meetings and hard commitments shape what a winnable day looks
              like.
            </p>
          )}
          <button className="btn-primary" onClick={prepare} disabled={busy}>
            {busy ? "Preparing your notes…" : "Prepare my day"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4">
      <h1 className="ritual-heading">Today will be a win if…</h1>

      {draft?.briefing && (
        <div className="card bg-accent-soft/60 border-accent/20">
          <p className="text-xs font-medium uppercase tracking-wide text-accent">Notes for today</p>
          <p className="mt-1 text-sm leading-relaxed">{draft.briefing}</p>
          {draft.sequencingNote && (
            <p className="mt-2 text-sm italic text-soft">{draft.sequencingNote}</p>
          )}
        </div>
      )}

      <p className="text-sm text-soft">
        Tap once for <span className="font-medium text-ink">extra</span>, twice for{" "}
        <span className="font-medium text-ink">must-do</span>, three times to remove. Must-dos
        define the win{lowEnergy ? " — today, one is plenty" : " — keep them few"}.
      </p>

      <section className="flex flex-col gap-2">
        {suggested.map((t) => (
          <PickRow
            key={t.id}
            title={t.title}
            meta={rowMeta(t)}
            sel={selected.get(t.id)}
            onCycle={() => cycle(t.id)}
            onDread={() => toggleDread(t.id)}
          />
        ))}
        {habits.map((h) => (
          <PickRow
            key={h.id}
            title={h.title}
            meta="habit"
            sel={selected.get(h.id)}
            onCycle={() => cycle(h.id)}
            onDread={() => toggleDread(h.id)}
          />
        ))}
      </section>

      {pool.length > 0 && (
        <section>
          <button className="text-sm text-soft underline-offset-2 hover:underline" onClick={() => setShowPool(!showPool)}>
            {showPool ? "Hide" : "Pull from"} the pool ({pool.length})
          </button>
          {showPool && (
            <div className="mt-2 flex flex-col gap-2">
              {pool.map((t) => (
                <PickRow
                  key={t.id}
                  title={t.title}
                  meta={rowMeta(t)}
                  sel={selected.get(t.id)}
                  onCycle={() => cycle(t.id)}
                  onDread={() => toggleDread(t.id)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {error && <p className="text-sm text-warn">{error}</p>}
      <button className="btn-primary sticky bottom-20" onClick={commit} disabled={busy || selected.size === 0}>
        {busy ? "…" : `Commit the day (${mustCount} must-do${mustCount === 1 ? "" : "s"}, ${selected.size - mustCount} extra)`}
      </button>
    </main>
  );
}

function rowMeta(t: TaskLite): string {
  const parts = [t.context !== "any" ? t.context : null, t.size !== "medium" ? t.size : null];
  if (t.deadline) parts.push(`due ${t.deadline.slice(0, 10)}`);
  if (t.project) parts.push(t.project.title);
  else if (t.stress) parts.push(t.stress.title);
  return parts.filter(Boolean).join(" · ");
}

function PickRow({
  title,
  meta,
  sel,
  onCycle,
  onDread,
}: {
  title: string;
  meta: string;
  sel?: Selection;
  onCycle: () => void;
  onDread: () => void;
}) {
  return (
    <div
      className={`card flex items-center gap-3 py-3 transition-colors ${
        sel?.tier === "must"
          ? "border-accent bg-accent-soft"
          : sel
            ? "border-accent/40"
            : "opacity-80"
      }`}
    >
      <button onClick={onCycle} className="min-w-0 flex-1 text-left">
        <p className="text-[15px]">{title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {sel?.tier === "must" && <span className="chip">must-do</span>}
          {sel?.tier === "extra" && <span className="chip-muted">extra</span>}
          {meta && <span className="text-xs text-soft">{meta}</span>}
        </div>
      </button>
      {sel && (
        <button
          onClick={onDread}
          title="Mark as something you're dreading"
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            sel.dread ? "bg-warn/10 text-warn" : "bg-line/60 text-soft"
          }`}
        >
          {sel.dread ? "dreading it" : "dread?"}
        </button>
      )}
    </div>
  );
}
