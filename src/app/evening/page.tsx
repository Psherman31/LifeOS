"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DayResponse, PlanItem } from "@/lib/types";

type Verdict = {
  outcome: "done" | "missed" | "released";
  missCause?: string;
  blockerNote?: string;
};

const CAUSES: { key: string; label: string }[] = [
  { key: "blocked", label: "Something was missing" },
  { key: "no_time", label: "Ran out of time" },
  { key: "no_energy", label: "Ran out of energy" },
  { key: "avoided", label: "Kept putting it off" },
  { key: "not_priority", label: "Not a priority anymore" },
];

export default function EveningPage() {
  const [data, setData] = useState<DayResponse | null>(null);
  const [verdicts, setVerdicts] = useState<Map<string, Verdict>>(new Map());
  const [eveningNote, setEveningNote] = useState("");
  const [braveNote, setBraveNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    summary: string;
    tomorrowNote: string | null;
    createdTasks: { id: string; title: string }[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/day")
      .then((r) => r.json())
      .then((d: DayResponse) => {
        setData(d);
        // Pre-fill: anything already checked off during the day stays done.
        const v = new Map<string, Verdict>();
        for (const item of d.plan.items) {
          if (item.outcome === "done") v.set(item.id, { outcome: "done" });
        }
        setVerdicts(v);
      });
  }, []);

  function setVerdict(id: string, verdict: Verdict | null) {
    setVerdicts((prev) => {
      const next = new Map(prev);
      if (verdict) next.set(id, verdict);
      else next.delete(id);
      return next;
    });
  }

  async function submit() {
    if (!data) return;
    setBusy(true);
    const outcomes = Array.from(verdicts.entries()).map(([itemId, v]) => ({ itemId, ...v }));
    const res = await fetch("/api/day/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcomes, eveningNote, braveNote }),
    });
    setBusy(false);
    if (res.ok) setResult(await res.json());
  }

  if (!data) return <main className="py-16 text-center text-soft">…</main>;

  if (result) {
    return (
      <main className="flex flex-col gap-4">
        <h1 className="ritual-heading">Day closed</h1>
        <div className="card">
          <p className="whitespace-pre-line text-[15px] leading-relaxed">{result.summary}</p>
          {result.tomorrowNote && (
            <p className="mt-3 border-t border-line pt-3 text-sm text-soft">
              For tomorrow: {result.tomorrowNote}
            </p>
          )}
        </div>
        {result.createdTasks.length > 0 && (
          <div className="card">
            <p className="text-sm font-medium">Set up for tomorrow:</p>
            <ul className="mt-1.5 flex flex-col gap-1 text-sm">
              {result.createdTasks.map((t) => (
                <li key={t.id}>→ {t.title}</li>
              ))}
            </ul>
          </div>
        )}
        <a href="/" className="btn-primary self-start">
          Done for tonight
        </a>
      </main>
    );
  }

  const items = data.plan.items;
  if (data.plan.status === "draft" || items.length === 0) {
    return (
      <main className="flex flex-col gap-4">
        <h1 className="ritual-heading">End of day</h1>
        <p className="text-soft">
          Today never got planned — that happens. Nothing to grade.{" "}
          <Link className="underline" href="/">
            Capture anything on your mind
          </Link>{" "}
          and start fresh tomorrow.
        </p>
      </main>
    );
  }

  const allJudged = items.every((i) => verdicts.has(i.id));

  return (
    <main className="flex flex-col gap-4">
      <header>
        <h1 className="ritual-heading">How did the day go?</h1>
        <p className="mt-1 text-sm text-soft">
          Not a report card — a debrief. Misses are information.
        </p>
      </header>

      <section className="flex flex-col gap-2.5">
        {items.map((item) => (
          <ReviewRow
            key={item.id}
            item={item}
            verdict={verdicts.get(item.id)}
            setVerdict={(v) => setVerdict(item.id, v)}
          />
        ))}
      </section>

      <div className="card flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium">
            Did anything today take courage, or express something you care about?
          </label>
          <textarea
            className="input mt-1.5 min-h-[56px] resize-none"
            placeholder="Goes in the values ledger — the only score that's kept."
            value={braveNote}
            onChange={(e) => setBraveNote(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Anything else about today?</label>
          <textarea
            className="input mt-1.5 min-h-[56px] resize-none"
            placeholder="Optional."
            value={eveningNote}
            onChange={(e) => setEveningNote(e.target.value)}
          />
        </div>
      </div>

      <button className="btn-primary" onClick={submit} disabled={busy || !allJudged}>
        {busy ? "Preparing the debrief…" : allJudged ? "Close the day" : "Mark each item first"}
      </button>
    </main>
  );
}

function ReviewRow({
  item,
  verdict,
  setVerdict,
}: {
  item: PlanItem;
  verdict?: Verdict;
  setVerdict: (v: Verdict | null) => void;
}) {
  const title = item.task?.title ?? item.habit?.title ?? "";
  const missed = verdict?.outcome === "missed";

  return (
    <div className="card py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[15px]">
          {title}{" "}
          {item.tier === "must" && <span className="chip ml-1 align-middle">must-do</span>}
          {item.dreadFlag && verdict?.outcome === "done" && (
            <span className="chip ml-1 align-middle">brave</span>
          )}
        </p>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Toggle
          on={verdict?.outcome === "done"}
          label="Done"
          onClick={() => setVerdict(verdict?.outcome === "done" ? null : { outcome: "done" })}
        />
        <Toggle
          on={missed}
          label="Didn't happen"
          onClick={() => setVerdict(missed ? null : { outcome: "missed" })}
        />
      </div>
      {missed && (
        <div className="mt-2.5 border-t border-line pt-2.5">
          <p className="text-xs text-soft">What got in the way?</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {CAUSES.map((c) => (
              <Toggle
                key={c.key}
                small
                on={verdict?.missCause === c.key}
                label={c.label}
                onClick={() =>
                  setVerdict({
                    outcome: c.key === "not_priority" ? "released" : "missed",
                    missCause: c.key,
                    blockerNote: verdict?.blockerNote,
                  })
                }
              />
            ))}
          </div>
          {verdict?.missCause === "blocked" && (
            <input
              className="input mt-2"
              placeholder="What was missing? (e.g. no groceries)"
              value={verdict.blockerNote ?? ""}
              onChange={(e) => setVerdict({ ...verdict, blockerNote: e.target.value })}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Toggle({
  on,
  label,
  onClick,
  small,
}: {
  on: boolean;
  label: string;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full font-medium transition-colors ${
        small ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm"
      } ${on ? "bg-accent text-white" : "bg-line/60 text-soft hover:bg-line"}`}
    >
      {label}
    </button>
  );
}
