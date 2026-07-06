# LifeOS

*A system for cultivating a good life*

**Product Specification — v0.8 (As Built) • July 2026**

Supersedes v0.7. This revision describes the system as designed and implemented in v1, incorporating three significant changes from the draft: the interface is selection-first rather than chat-first; the daily ritual is modeled directly on the user's proven paper practice; and robustness under stress — not feature completeness — is the explicit design criterion. The v0.7 philosophy is retained in full; this document describes how it actually operates.

---

## 1. What LifeOS Is

A good life is not a project you complete. It is something you cultivate — tending to the things that matter, season by season. Some seasons certain things need more attention. Others just need you to show up and not let them go to seed. The work is never finished. That is not a failure; that is the nature of the enterprise.

LifeOS is a system for cultivating a good life. It is not a productivity app. Productivity — getting things done, moving projects forward — is a side effect of living intentionally, not the goal.

Practically, it is a single entity that functions simultaneously as executive assistant, project manager, and performance coach — with the same information across all three roles. Existing systems fail not because any one tool is bad, but because the assistant, the project manager, and the coach all have different information. The assistant remembers the appointment but not the anxiety. The project manager knows the deadline but not the avoidance pattern. The coach understands the psychology but cannot decompose the project into steps. LifeOS holds all of it. The innovation is continuity of understanding.

## 2. Why It Is Shaped This Way

The system's design is reverse-engineered from a specific, observed failure.

The user's most productive period ran on a daily paper ritual: each morning, look at the calendar and write *"Today will be a win if…"* — the things that absolutely had to happen that day, plus enough extra to constitute an honest day's work. Each evening, before bed: congratulate yourself on what got done, nonjudgmentally diagnose what didn't, and plan to move it forward tomorrow if it was still a priority.

It worked — until stress rose and it broke, through a predictable chain: stress made certain items aversive → the aversive items sat on the page → every daily review meant looking at the things being avoided → the review itself became aversive → the ritual stopped → the backlog grew → returning meant facing the whole pile → re-entry became the most aversive task of all. Paper has no defense against this. A passive system lets avoided items accumulate shame, and its one ritual becomes the delivery mechanism for that shame.

LifeOS keeps the ritual's bones — they are proven — and engineers out each link in the failure chain. "More robust" means three specific things:

1. **The wagon is harder to fall off.** Avoided items get smaller instead of heavier (the intervention ladder, §6).
2. **Falling off costs less.** Nothing accumulates shame in your absence — no overdue counts, no backlog view, no metrics anywhere.
3. **Getting back on is nearly free.** Re-entry is one gentle question, not an excavation (§5.5).

No software can compel re-engagement. There will still be gaps. The design goal is a failure curve that bends where paper snapped.

## 3. The Interaction Model: Selection First

LifeOS is not a chat app. Most interaction is **dumping things in** and **selecting things out** — the feel of working from notes prepared by a personal assistant, not of holding a conversation. The AI's judgment shows up as pre-filled defaults to ratify or adjust, never as questions to answer. The cognitive load stays with the system.

There are three surfaces:

**Capture** — one box, always at the top of the Today screen. Dump anything: tasks, worries, dates, several at once, however it comes out (typed, or dictated via the keyboard microphone). The AI parses it into tasks, projects, and areas of stress, rewrites titles to be actionable, assigns domains and contexts, and files everything. The user never categorizes. If capture feels like work, everything downstream dies — so capture is instant and trustworthy.

**Selection** — the morning review (§5.1) and the day's check-offs. Drafts are prepared; the user picks. Thirty seconds on a good day, two minutes on a thoughtful one.

**Conversation, on demand** — chat exists and matters, but it is a room you enter deliberately (to decompose a stress, to work through avoidance, for the weekly conversation) or are invited into when patterns warrant it. It is never the front door. Every conversation ends with a "File the actions" step that converts what was agreed into real tasks — insight always lands somewhere.

## 4. The Organizational Structure

Life is organized around **domains** — permanent areas of life requiring ongoing cultivation (seeded with Work and Home/Parenting; extendable at any time). Within each domain live two kinds of things:

**Areas of stress** — amorphous feelings that something needs attention. "House maintenance is falling behind." These are real and important before they are actionable. Naming one is itself valuable; named things are less frightening than unnamed things. The system holds them and, when ready, helps break them down.

**Projects and tasks** — the concrete, behavioral layer where cultivation actually happens.

The movement between the two is the core pipeline: **name it → decompose it → generate next actions → surface at the right moment → detect stall → dissolve the stress.** Amorphous stress without concrete action is just anxiety; concrete tasks without understanding why they matter is just busy-ness. The system holds both and keeps moving one toward the other.

Tasks carry a dependency link: a task can wait behind another task (or a person). Blocked tasks never nag; completing the blocker automatically frees them.

## 5. The Rituals

### 5.1 Morning Review — "Today will be a win if…"

Anchored to arrival at work. The flow:

1. **Arrival.** "How are you coming into the day?" (optional, one sentence is plenty), a **low-energy day** toggle, and a prompt to glance at the calendar — v1 has no calendar integration, but the ritual insists on the glance, because meetings and hard commitments define what a winnable day looks like.
2. **Prepared notes.** The AI drafts a short briefing — what actually matters today: hard deadlines, items carried from yesterday with their unblocking tasks ready, anything time-sensitive — plus a suggested day. It does not recite the whole list; that is what the picker is for.
3. **Selection.** The day has two tiers:
   - **Must-dos** (1–3): the things that absolutely have to happen. These define the win condition. Fewer is better — a winnable day, not a maximal one.
   - **An honest day's work**: the flexible layer that makes the day feel full and earnest — drawn from deadlines, stale stresses, habits, and quick wins, sized to the room the day actually has.

   Hard or dreaded things are sequenced early; quick wins held in reserve. Each selected item can be flagged **"dreading this"** — one tap, which quietly arms the intervention ladder and marks any eventual completion as a brave act. Work-context items are proposed for the workday; home-context items only where the evening can hold them.
4. **Commit.** The day is locked in as a fresh, winnable draft.

If low-energy mode is on, the entire structure shrinks to one question: *what's one thing that would make today feel okay?* One must-do, at most a couple of genuinely quick extras. No planning, no review, no guilt. This mode prevents total disengagement while respecting actual capacity.

### 5.2 During the Day

The system stays in the background. The Today screen shows the win condition and the extras; items get checked off as they happen. When all must-dos are done, the screen says so plainly: **the win condition is met — anything else is extra.** New captures go in the box and are filed for future days, not piled onto today.

### 5.3 Evening Review — The Repair Loop

Anchored to before bed (the "day" runs until bedtime, covering evening home-context goals). Not a report card — a debrief with a repair loop:

1. **What happened.** Quick check-off of anything not already marked during the day.
2. **For each miss, a one-tap cause**, each routed differently:
   - **Something was missing (blocked)** → the system asks what, and drafts the unblocking task. *"Cook dinner" didn't happen because there were no groceries* → "Buy groceries" is created for tomorrow and "Cook dinner" waits behind it, resurfacing automatically once groceries are done. Tomorrow's draft opens with the repair already in place.
   - **Ran out of time / energy** → logistical, not avoidance. Re-pooled without ceremony; feeds the calibration that makes tomorrow's draft more winnable.
   - **Kept putting it off** → an invisible deferral counter ticks. No number is ever displayed — "deferred ×7" is just shame with a font. The counter only feeds the intervention ladder.
   - **Not a priority anymore** → released. Consciously letting go of a task is an intentional choice, not a failure, and the release valve is a first-class button.
3. **The values-ledger moment.** "Did anything today take courage, or express something you care about?" Optional, ten seconds. Dread-flagged items that got done are recognized as brave acts automatically.
4. **The debrief.** The AI writes a short summary in the assistant register: opens with what was accomplished, specifically; if the must-dos happened, the day was a win and it says so plainly, even if extras didn't; misses get causal curiosity, never disappointment. A whole day gone sideways is information about the day, not about the person.

### 5.4 The Weekly Conversation

The heart of the system, and the one ritual that insists on being a real conversation. Covers, conversationally: how the week felt; which areas moved and which stalled; anything ready to be decomposed; avoidance patterns visible in the data (named gently, once); a friction check ("anything getting in your way?"); a tolerations check ("anything you've been putting up with that you've stopped noticing?"). If it turns purely reflective, the system redirects: *"This is useful — what do you want to do about it?"* It always ends with 2–4 specific intentions, filed as real records that the following week's briefings remember.

### 5.5 Re-Entry After a Gap

Every system must assume the user will sometimes disappear. After a gap of a few days, the Today screen does not present a backlog — structurally, there is no backlog view to present. It opens with: **"Welcome back. It's been a little while — that's fine. Nothing piled up."** The gap length is noted, not counted. The values ledger is surfaced as evidence that the gap does not erase what came before.

Re-entry offers a short taking-stock conversation — what has a hard deadline in the next two weeks, which stresses still feel live, what can be released, and what one thing would make today feel okay — or a single tap to skip it and just plan today. Both are legitimate.

## 6. The Philosophy in Operation

The v0.7 principles, restated as they operate in the built system:

**Avoidance is information, not failure.** Three kinds, three responses: (a) *want to do it, discomfort in the way* → ACT-informed smallest-step work; (b) *not sure it's actually cared about* → values interrogation, not a nudge; (c) *may not need to exist* → delegation or conscious release.

**Shame is deadly.** Shame is a paralytic, not a motivator. The system is militantly non-shaming — and structurally, not just tonally: there are **no completion metrics, no streaks, no productivity scores, no overdue counts, and no red badges anywhere in the product**. Deferral counts exist in the database and are never rendered. Undone items return quietly to the pool; the Today view cannot become a shame pile because it is always a fresh draft. Confronting something difficult is an automatic win regardless of outcome, and the system says so.

**The intervention ladder.** Escalation only when the previous rung keeps not working: (1) simple practical offer — schedule it today or pick a better day; (2) light curiosity — "this keeps getting moved; anything in the way, or just a busy stretch?"; (3) values reconnection and smallest-step offer; (4) direct shame-spiral interruption — a two-minute version counts. The system never over-psychologizes a scheduling problem and never under-responds to a genuine spiral. Rungs 1–2 appear as inline offers; rungs 3–4 open a conversation.

**Always respond to abstraction with a concrete proposal.** A good assistant does not ask what you want to do; they bring a draft and ask if it looks right. Every surface obeys this: parsed captures arrive filed, the morning arrives drafted, the evening arrives with the unblocking task already written.

**Keep making the step smaller.** Shame makes steps look bigger than they are. The response to any step that feels too big is subdivision until willingness is present. "Open the document and look at the first page for fifteen seconds" is a real next action.

**Insight is the beginning of action, not a substitute.** Every conversation lands in a concrete task, a named stress, or an explicit decision to hold. Understanding in service of avoiding is still avoiding. The system is explicitly biased toward the mundane behavioral intervention over the elegant insight.

**Values are discovered, not declared.** No values intake at onboarding. Values emerge through use — through the ledger, through what gets protected under pressure, and eventually through regret-calibration in the monthly inventory (roadmap). The system earns the right to ask deeper questions by being useful first.

## 7. The AI Layer

Powered by Claude via the Anthropic API. A processing layer, not a storage layer: user data lives in the application's own database; context is assembled and passed at runtime.

**Voice.** A sharp personal assistant preparing notes for their principal: concise, concrete, professional, quietly warm. Congratulations are specific and brief. Diagnosis is nonjudgmental and practical. Never therapist-voice, never cheerleading, never identity statements about the user.

**Continuity of understanding.** Every AI call receives the same assembled context: domains; active stresses with staleness and decomposition status; projects and the task pool with dependencies, contexts, and (invisible) deferral counts; habits; the last week of day plans with outcomes and causes; recent values-ledger entries; and current weekly intentions. The morning briefing knows what last night's review learned. The weekly conversation knows what the mornings knew.

**Integration points:**
1. *Capture parsing* — batch brain dump → classified, titled, domain-assigned items.
2. *Morning drafting* — context → briefing, must-do/extra suggestions, sequencing note.
3. *Evening debrief* — outcomes and causes → summary, unblocking tasks, brave-act recognition, a note carried to tomorrow.
4. *Conversations* — decomposition, avoidance work, weekly, re-entry; streamed, with full context.
5. *Action extraction* — transcript → filed tasks, projects, releases, and intentions.

Every AI failure degrades gracefully: nothing is lost, the manual path always works, and the error says so in plain language.

## 8. Data Model (As Built)

- **Domain** — name, sort order.
- **Stress** — title (can be vague), domain, status (active/held/dormant/closed), decomposition state, last-movement date, avoidance flag.
- **Project** — title, parent stress, domain, status, deadline, waiting-on.
- **Task** — title, notes, status (pool/waiting/done/released), domain/project/stress links, context (work/home/any), size (quick/medium/big), deadline, **blocked-by task link**, waiting-on-person, **deferral count (never displayed)**, dread flag, avoidance type, brave-act flag, source.
- **Habit** — title, type (efficiency/values — they fail differently), trigger anchor, minimum viable version, status, context.
- **DayPlan** — local date, status (draft/committed/reviewed), morning briefing/note, evening summary/note, calendar-checked, low-energy mode.
- **DayPlanItem** — task or habit, tier (must/extra), dread flag, outcome (pending/done/missed/released), miss cause, blocker note.
- **ValuesLedgerEntry** — date, description, value expressed, whether it was dreaded beforehand. The only record that matters.
- **ChatSession / ChatMessage** — kind (general/decompose/avoidance/weekly/reentry), linked stress or task, transcript, summary.
- **WeeklyReview** — week, summary, intentions.
- **AppState** — last-active timestamp (drives re-entry detection).

## 9. Architecture

- **Form factor:** mobile-first web app (Next.js 15, TypeScript, Tailwind), added to the iPhone home screen as a full-screen app. Typed capture with keyboard dictation. A deliberate choice over native iOS for v1: the behavioral model is the asset; the software is the delivery mechanism, and this delivery mechanism ships in days, not months.
- **Data:** Prisma + SQLite, a single database file on a persistent volume. Single-user.
- **AI:** Anthropic API, model configurable (`ANTHROPIC_MODEL`, default Claude Sonnet).
- **Auth:** single passcode (`LIFEOS_PASSCODE`) behind an HTTP-only cookie; middleware guards every route and API.
- **Hosting:** Railway, auto-deploying from the GitHub repository. Total running cost ≈ $10–20/month including AI usage.
- **Privacy:** data stays in the user's own database; Anthropic processes but does not train on API traffic. Work items are captured at whatever level of detail the user is comfortable with.

## 10. Deliberately Not in v1 (Roadmap)

Staged so the core question gets tested before anything is added:

- **Monthly life inventory** — added once there is a month of history to inventory. Brings regret-as-calibration ("what does that regret tell you about something you care about more than you realized?"), the tolerations audit, domain assessments, and the fuller values-discovery work.
- **Gratitude field** in the morning review (a one-field addition, per the original paper ritual).
- **Notifications** — deferred by explicit choice; ritual anchors (arrival at work, before bed) carry the habit for now.
- **True voice pipeline and native iOS app.**
- **Email / Teams capture, photo OCR, share extension.**
- **Calendar integration** (read for planning, write for time-blocking) — v1 keeps only the prompt to look.
- **Contextual enrichment** — tasks arriving pre-loaded with the phone number, account, and link needed to complete them.
- **Adaptive time estimation, anticipatory date reminders, collaboration/shared tasks, web desktop companion.**

## 11. Known Failure Modes

- **The hyperfocus trap.** Building the system becomes the hyperfocus object. Mitigation: v1 is deliberately minimal and already shipped; changes are driven by friction discovered in use, not by the spec.
- **Intellectualized engagement.** Rich conversations about avoidance instead of action. Mitigation: every conversation ends in filed actions; the system redirects reflection toward commitment.
- **Shame reintroduction.** Mitigation is structural, not aspirational: the UI has no place to render a metric, streak, or overdue count, and the deferral counter has no UI representation at all.
- **Novelty decay.** The app itself will stop being interesting within weeks — separate from avoidance, and no app fully solves it. Mitigations: the daily ritual stays under a minute so it can survive on habit rather than interest; the drafted day and weekly conversation provide variation. Flagged for observation in the first month.
- **Re-engagement dependency.** No system survives disengagement it makes expensive. Mitigation: re-entry mode, low-energy mode, and the absence of any accumulating debt display.

## 12. Success Criteria

The system is succeeding if, over a sustained period:

- Amorphous stress regularly becomes named things, then concrete steps.
- Things previously avoided get acted on more — in smaller steps if necessary.
- The values ledger grows into genuine evidence of integrity and courage.
- Misses produce repairs (unblocking tasks) instead of residue.
- Gaps happen — and re-entry costs one tap instead of an excavation.
- Boom-bust amplitude shrinks; background anxiety drops.
- The daily ritual survives stressful weeks *in reduced form* rather than stopping.
- The system does not feel like another thing to maintain.

The single test that matters, stated plainly: **when stress rises and avoidance starts — the exact conditions that killed the paper system — does this bend instead of break?**
