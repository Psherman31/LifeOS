# LifeOS

*A system for cultivating a good life.*

LifeOS is a single-user personal system that functions as executive assistant,
project manager, and coach — one entity with the same information across all
three roles. It is not a productivity app; productivity is a side effect of
living intentionally. Built around the daily ritual: **"Today will be a win
if…"**

**To get your own copy running, follow [SETUP.md](./SETUP.md).**

## The shape of the system

- **Capture** — one box, always a tap away. Dump anything (several things at
  once is fine); Claude parses it into tasks, projects, and *areas of stress*
  and files it. You never categorize.
- **Morning review** — on arrival at work. The system has prepared notes and a
  draft day: a few **must-dos** that define the win condition, plus enough
  honest-day's-work extras. You select, flag anything you're dreading, and
  commit. Hard things early, quick wins in reserve.
- **During the day** — check things off on the Today screen. That's it.
- **Evening review** — before bed. A debrief, not a report card: what
  happened, and for each miss, *why* — with each cause routed differently.
  "Cooked dinner didn't happen because there were no groceries" automatically
  creates "Buy groceries" for tomorrow, and dinner waits behind it. Brave acts
  go to the values ledger.
- **The weekly conversation** — the heart of the system. A real dialogue that
  always ends in concrete intentions.
- **Areas of stress** — amorphous worries are first-class citizens. Name them
  ("house maintenance is falling behind"), and when ready, a five-minute
  decomposition conversation turns them into concrete steps.
- **The values ledger** — the only score kept. No streaks, no completion
  percentages, no overdue counts, anywhere. Records of courage and
  values-consistent action only.
- **Re-entry** — after any gap, the app opens with "Welcome back. Let's figure
  out where things stand." No backlog of shame; the pool quietly waits.
- **The intervention ladder** — avoidance is information, not failure.
  Deferrals are counted invisibly; the response escalates gently from a
  scheduling offer to making the step smaller, never to shame.

## Tech

- **Next.js 15** (App Router, TypeScript, Tailwind v4) — mobile-first web app,
  installable to the iPhone home screen.
- **Prisma + SQLite** — single-file database (a Railway volume in production).
- **Claude (Anthropic API)** — capture parsing, morning briefings, evening
  debriefs, and all conversations. Model configurable via `ANTHROPIC_MODEL`.
- **Auth** — single-user passcode (`LIFEOS_PASSCODE`) behind an HTTP-only
  cookie; middleware guards every route.

## Local development

```bash
cp .env.example .env   # fill in ANTHROPIC_API_KEY and LIFEOS_PASSCODE
npm install
npx prisma db push && npm run db:seed
npm run dev
```

## Roadmap (deliberately not in v1)

Native iOS app and true voice pipeline, email/Teams capture, calendar
integration, monthly life inventory (arrives once there's a month of history),
contextual enrichment, collaboration/shared tasks, notifications, gratitude
prompt in the morning review.
