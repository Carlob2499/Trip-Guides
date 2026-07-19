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

## Snapshot (updated 2026-07-18, session close)

**Backbone complete + a creator-approved feature wave queued.** 402 tests, all on `main`.

- **Pipeline complete (P0–P4):** typed intake → resumable dual-pass research (checkpoints)
  → `npm run verify` scorecard → graduate-on-evidence → weekly recert matrix. Sonnet pinned
  in research-pass.yml / recert.yml via `claude_args`.
- **Visual/motion complete (V1, V3a–d, V4):** card→hero morph · first-open day-story ·
  native scroll reveals · story-mode itinerary · lead scannability · cover-extracted
  palettes (one precedence on guide+hub+OG). Runtime: connection state machine,
  cold-visitor strip, weather day-swap (`env` tags, explicit-only), PWA complete. All
  chrome (share/SOS/search/exports) functionally verified in-browser.
- **NEW — `docs/FEATURES.md`:** ten researched features, scored (market + 2026 survey
  discourse + $0-API constraint). **Approved wave: #1 transit deep-links → #5 arrival
  autopilot → #6 phrase cards → #7 entry-requirements → #8 sun strip → #9 advisory pill →
  #10 recap card.** One new **Trip kit** tool tab (houses 5/6/7). Held: #2 prep timeline,
  #3 budget pact (revivable). Dropped: #4 reservation vault.

**Known waits:** R5 telemetry ranking needs real use; what's-open-now blocked on structured
hours; TRAVELER_PATTERNS grows only from real trips.

## Where we left off

The approved feature wave is next, one feature per session, in backlog order — **#1
"Get me there" transit deep-links first** (docs/FEATURES.md has the integration notes).

**Re-prompt the creator with:** "⚠ Switch to **Sonnet** for this session (feature builds are
Sonnet work). Next up per the approved backlog: #1 transit deep-links on every stop/sight —
start it? (Or: file a real trip; or revive held features #2/#3.)"
