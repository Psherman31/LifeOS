"use client";

import { useState } from "react";

// The always-available inbox. Dump anything; the system files it.
export default function CaptureBox({ onCaptured }: { onCaptured?: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: string; title: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function capture() {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Capture failed");
      const body = await res.json();
      setResult(body.created);
      setText("");
      onCaptured?.();
      setTimeout(() => setResult(null), 6000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Capture failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <textarea
        className="input min-h-[72px] resize-none border-0 bg-transparent p-0 focus:border-0"
        placeholder="Dump anything here — tasks, worries, dates. I'll sort it."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-soft">
          {busy ? "Filing…" : "One box. Multiple things at once is fine."}
        </span>
        <button className="btn-quiet px-3 py-1.5" onClick={capture} disabled={busy || !text.trim()}>
          Capture
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-warn">{error}</p>}
      {result && result.length > 0 && (
        <div className="mt-3 border-t border-line pt-2 text-sm text-soft">
          Filed:{" "}
          {result.map((r, i) => (
            <span key={i}>
              {i > 0 && ", "}
              <span className="text-ink">{r.title}</span>
              <span className="text-xs"> ({r.kind})</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
