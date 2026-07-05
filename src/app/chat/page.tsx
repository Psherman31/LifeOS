"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Msg = { role: "user" | "assistant"; content: string };

const OPENERS: Record<string, string> = {
  decompose: "Let's break this down into something manageable.",
  avoidance: "Something keeps not happening — let's look at it without any judgment.",
  weekly: "The weekly conversation. How did the week feel, overall?",
  reentry: "Welcome back. Let's figure out where things stand — no backlog to answer for.",
  general: "What's on your mind?",
};

export default function ChatPage() {
  return (
    <Suspense>
      <Chat />
    </Suspense>
  );
}

function Chat() {
  const params = useSearchParams();
  const router = useRouter();
  const kind = params.get("kind") ?? "general";
  const stressId = params.get("stressId");
  const taskId = params.get("taskId");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setBusy(true);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, kind, stressId, taskId, message: text }),
    });

    if (!res.ok || !res.body) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "Something went wrong — try again.",
        };
        return copy;
      });
      setBusy(false);
      return;
    }

    const sid = res.headers.get("x-session-id");
    if (sid) setSessionId(sid);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      const current = acc;
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: current };
        return copy;
      });
    }
    setBusy(false);
  }

  async function saveActions() {
    if (!sessionId) return;
    setExtracting(true);
    const res = await fetch("/api/chat/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    setExtracting(false);
    if (res.ok) {
      const body = await res.json();
      const n = body.created.length;
      const parts: string[] = [];
      if (n) parts.push(`${n} item${n === 1 ? "" : "s"} filed`);
      if (body.intentions?.length) parts.push(`${body.intentions.length} intentions set`);
      if (body.released) parts.push(`${body.released} released`);
      setExtracted(parts.length ? parts.join(" · ") : "Nothing concrete to file yet.");
      router.refresh();
    }
  }

  const heading =
    kind === "weekly"
      ? "The weekly conversation"
      : kind === "decompose"
        ? "Break it down"
        : kind === "reentry"
          ? "Taking stock"
          : kind === "avoidance"
            ? "Looking at it together"
            : "Talk it through";

  return (
    <main className="flex min-h-[80dvh] flex-col gap-3">
      <header className="flex items-center justify-between">
        <h1 className="ritual-heading">{heading}</h1>
        {sessionId && messages.length >= 2 && (
          <button className="btn-quiet px-3 py-1.5" onClick={saveActions} disabled={extracting}>
            {extracting ? "Filing…" : "File the actions"}
          </button>
        )}
      </header>
      {extracted && <p className="text-sm text-accent">{extracted}</p>}

      <div className="flex flex-1 flex-col gap-3">
        {messages.length === 0 && (
          <div className="card bg-accent-soft/60 border-accent/20">
            <p className="text-sm">{OPENERS[kind] ?? OPENERS.general}</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "self-end rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-[15px] text-white max-w-[85%]"
                : "self-start rounded-2xl rounded-bl-md bg-white border border-line px-4 py-2.5 text-[15px] leading-relaxed max-w-[92%] whitespace-pre-line"
            }
          >
            {m.content || "…"}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        className="sticky bottom-20 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="input bg-white shadow-sm"
          placeholder="Say it however it comes out."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn-primary shrink-0 px-4" disabled={busy || !input.trim()}>
          ↑
        </button>
      </form>
    </main>
  );
}
