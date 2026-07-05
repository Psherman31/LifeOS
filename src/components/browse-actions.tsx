"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

async function patch(url: string, body: unknown) {
  await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function TaskActions({ id }: { id: string }) {
  const router = useRouter();
  return (
    <div className="flex shrink-0 gap-1.5">
      <button
        className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent"
        onClick={async () => {
          await patch(`/api/tasks/${id}`, { status: "done" });
          router.refresh();
        }}
      >
        done
      </button>
      <button
        className="rounded-full bg-line/60 px-2.5 py-1 text-xs font-medium text-soft"
        title="Consciously let this go — an intentional choice, not a failure."
        onClick={async () => {
          await patch(`/api/tasks/${id}`, { status: "released" });
          router.refresh();
        }}
      >
        let go
      </button>
    </div>
  );
}

export function StressActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <Link
        href={`/chat?kind=decompose&stressId=${id}`}
        className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-white"
      >
        break it down
      </Link>
      {status === "active" ? (
        <button
          className="rounded-full bg-line/60 px-3 py-1 text-xs font-medium text-soft"
          onClick={async () => {
            await patch(`/api/stresses/${id}`, { status: "held" });
            router.refresh();
          }}
        >
          hold for now
        </button>
      ) : (
        <button
          className="rounded-full bg-line/60 px-3 py-1 text-xs font-medium text-soft"
          onClick={async () => {
            await patch(`/api/stresses/${id}`, { status: "active" });
            router.refresh();
          }}
        >
          reactivate
        </button>
      )}
      <button
        className="rounded-full bg-line/60 px-3 py-1 text-xs font-medium text-soft"
        onClick={async () => {
          await patch(`/api/stresses/${id}`, { status: "closed" });
          router.refresh();
        }}
      >
        it's resolved
      </button>
    </div>
  );
}

export function QuickAdd({
  kind,
  domainId,
  placeholder,
}: {
  kind: "stress" | "habit" | "domain";
  domainId?: string;
  placeholder: string;
}) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function add() {
    if (!value.trim()) return;
    const url = kind === "domain" ? "/api/domains" : kind === "habit" ? "/api/habits" : "/api/stresses";
    const body =
      kind === "domain" ? { name: value } : { title: value, domainId: domainId ?? null };
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setValue("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        className="text-sm text-soft underline-offset-2 hover:underline"
        onClick={() => setOpen(true)}
      >
        + {placeholder}
      </button>
    );
  }
  return (
    <div className="flex gap-2">
      <input
        autoFocus
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
      />
      <button className="btn-quiet shrink-0 px-3 py-1.5" onClick={add}>
        Add
      </button>
    </div>
  );
}
