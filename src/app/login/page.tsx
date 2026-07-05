"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    setBusy(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong.");
    }
  }

  return (
    <main className="flex min-h-[70dvh] flex-col justify-center gap-6">
      <div>
        <h1 className="ritual-heading text-3xl">LifeOS</h1>
        <p className="mt-1 text-soft">A system for cultivating a good life.</p>
      </div>
      <form onSubmit={submit} className="card flex flex-col gap-3">
        <input
          type="password"
          inputMode="text"
          autoFocus
          className="input"
          placeholder="Passcode"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
        />
        {error && <p className="text-sm text-warn">{error}</p>}
        <button className="btn-primary" disabled={busy || !passcode}>
          {busy ? "…" : "Open"}
        </button>
      </form>
    </main>
  );
}
