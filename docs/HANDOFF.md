# HANDOFF — read this first, then re-prompt the creator

> **Ritual (binding):** at SESSION START, read this file INSTEAD of re-deriving history from
> the conversation, memory sprawl, or git log — it is the single warm-start context. Then
> greet the creator with the **"Where we left off"** line below and the recommended next step.
> At SESSION END, rewrite the Snapshot + Where-we-left-off sections (keep this header), commit.
> Keep it under ~80 lines — a handoff, not a chronicle. Deep context lives in the north-star
> docs it links; only follow those when the task actually needs them.

## Operating rules (stable — rarely change)

- **Model economy:** research/recert/fact edits run on **Sonnet** (light Opus only for a
  contested reconcile). Fable/Opus = design sessions only, on exception. Binding detail:
  `.claude/skills/waypoint-guide-author/references/research-efficiency.md`.
- **Never number guides as milestones** — the product is the backbone; a new guide is the
  backbone exercising.
- Ship loop on every change: build → test → `astro preview` :4322 (never `astro dev`) →
  grep `dist/` → commit → push.
- North stars: `docs/PIPELINE.md` (generation/maintenance) · `docs/VISUAL_COVERS.md` +
  `docs/MOTION.md` (presentation/motion) · `docs/GUIDE_RUBRIC.md` (quality bar).

## Snapshot (updated 2026-07-18)

**Everything designed is built, tested (402), deployed on `main`.**

- **Pipeline complete (P0–P4):** typed intake (issue form → zod contract) → resumable
  dual-pass research (checkpoints in `guides-intake/<slug>.state.json`) → `npm run verify`
  scorecard → graduate-on-evidence gate → weekly recert matrix (freshness PRs). Sonnet
  pinned in research-pass.yml / recert.yml via `claude_args`.
- **Visual/motion complete (V1, V3a–d, V4):** card→hero View-Transition morph · first-open
  day-story intro · native scroll-driven reveals · story-mode itinerary (one day per view,
  nav bar BELOW the panel) · lead-first scannability · per-guide palette extracted from each
  cover (`npm run extract-palette`, sky-suppression rule) with one precedence on guide+hub+OG.
- **Runtime:** connection state machine (`data-conn` — live tiles degrade explicitly),
  cold-visitor strip, converter clamp, PWA already complete. Share/SOS/search/dark/exports
  all functionally verified in-browser.
- **Weather day-swap shipped:** optional `env: outdoor|indoor|mixed` on day items (explicit
  tags only — no prose guessing); rain on an outdoor day + a dry indoor day nearby → one
  advisory line under the wx strip (`live-data/model/day-swap.ts`, 8 tests). Dormant on
  korea/denmark (past trips, untagged) by design.

**Known waits (not stalled):** R5 tool suite needs real telemetry; TRAVELER_PATTERNS grows
only from real trips; what's-open-now blocked on structured hours data (don't fabricate).

## Where we left off

The backbone is finished and idle, waiting to be exercised. **The single next action is a
real trip:** file the New-guide issue form (or the hub's "Make a new guide") → run the
research pass **on Sonnet** (Actions → Research pass, or the kickoff prompt the issue
comment prints) → review the draft PR against the verify scorecard → graduate.

**Re-prompt the creator with:** "The backbone is ready and waiting on a real trip. Do you
have a destination + travel party to file, or is there a code/design slice you want first?"
