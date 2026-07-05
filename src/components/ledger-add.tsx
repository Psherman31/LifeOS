"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LedgerAdd() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const router = useRouter();

  async function add() {
    if (!description.trim()) return;
    await fetch("/api/ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    setDescription("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        className="self-start text-sm text-soft underline-offset-2 hover:underline"
        onClick={() => setOpen(true)}
      >
        + add something directly
      </button>
    );
  }
  return (
    <div className="card flex flex-col gap-2">
      <textarea
        autoFocus
        className="input min-h-[56px] resize-none"
        placeholder="What did you do, and what did it express?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex gap-2">
        <button className="btn-primary" onClick={add}>
          Add to the ledger
        </button>
        <button className="btn-ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
