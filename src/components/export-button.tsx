"use client";

import { useState } from "react";

// Triggers a download of the full data snapshot. Kept dead simple: fetch the
// JSON, hand the browser a blob, let the OS share sheet do the rest (on iOS,
// "Save to Files" → iCloud, or mail it to yourself).
export function ExportButton() {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "lifeos-backup.json";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setNote("Downloaded. Stash it somewhere safe — iCloud, or email it to yourself.");
    } catch {
      setNote("Couldn't export just now — try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        className="self-start text-sm text-soft underline-offset-2 hover:underline"
        onClick={download}
        disabled={busy}
      >
        {busy ? "Preparing your backup…" : "↓ Export all my data"}
      </button>
      {note && <p className="text-xs text-soft">{note}</p>}
    </div>
  );
}
