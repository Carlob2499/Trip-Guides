# HANDOFF — read this first, then re-prompt the creator

> **Ritual (binding):** at SESSION START, read this file INSTEAD of re-deriving history from
> the conversation, memory sprawl, or git log — it is the single warm-start context. Then
> greet the creator with the **"Where we left off"** line below and the recommended next step.
> At SESSION END, rewrite the Snapshot + Where-we-left-off sections (keep this header), commit.
> Keep it under ~80 lines — a handoff, not a chronicle. Deep context lives in the north-star
> docs it links; only follow those when the task actually needs them.

## Operating rules (stable — rarely change)

- **Model economy:** research/recert/fact edits + mechanical builds run on **Sonnet**; **Opus**
  for design sessions and judgment/first-run-triage work. Every grand-plan session below lists
  its own model — remind the creator to `/model`-switch at session start.
- **Never number guides as milestones** — the product is the backbone; a new guide is the
  backbone exercising.
- Ship loop on every change: build → test → `astro preview` :4322 (never `astro dev`) →
  grep `dist/` → commit → push to `main` (the only branch — `verify-live` guards every deploy).
- North stars: `docs/PIPELINE.md` (generation/maintenance) · `docs/MOTION.md`
  (presentation/motion — absorbed VISUAL_COVERS) · `docs/GUIDE_RUBRIC.md` (quality bar) ·
  `docs/COMPETITIVE_LANDSCAPE.md` (market parity reference).

## Snapshot (updated 2026-07-22, session close)

**The ACTIVE execution queue is `docs/PLAN_FIELD_REPORT_FIXES.md`** (E1→E8), built from the
2026-07-22 Field Report (`docs/FIELD_REPORT_2026-07-22.md` — evidence base, reference-only:
106-agent deep-research pass + three same-day codebase audits). It absorbs F0/F3/F8 from
`PLAN_TRAVELER_FEATURES.md` (marked "moved" there); F1/F2/F4/F5/F6/F7 remain there, sequenced
after it. `PLAN_VISUAL_OVERHAUL.md` still holds V5 (morph continuity) + V6 (QA/perf).

- **Creator decisions locked 2026-07-22 (don't re-ask):** Korea AND Denmark both backfill
  provenance and flip strict (Denmark via fresh re-verification dated today — never invented
  backdates) · route optimizer = tap-to-apply (localStorage per-device, never edits guide
  JSON) · entry cards = US + additional passports (countries named at E6 session start).
- **Secret status corrected:** `CLAUDE_CODE_OAUTH_TOKEN` IS in place — confirmed valid
  2026-07-20 (commits `e11dd7b`→`389b229`). What has never happened is the RUN (E2).
- **CLAUDE.md gained the Clarifying-Questions Doctrine** — binding on every plan/prompt/
  session: plans carry per-session clarifier blocks; sessions open with `AskUserQuestion`.

**Also on `main` (earlier 2026-07-22 sessions):** the 07-20 review execution plan was fully
executed and removed (security floor, pipeline unblocking, schema widening, runtime/UX fixes,
arch cleanup, test coverage — see git log `78fb1df`…`672855d`); docs consolidated ~25%
(VISUAL_COVERS→MOTION, SILO_ROADMAP→ARCHITECTURE, critic plan→F7, honest SECURITY.md);
connector policy asserted in CLAUDE.md (github + Claude Code Remote only). Visual arc V1–V4
live; the V4 contour-visibility retune still needs a human real-photo eyeball (MOTION.md
caveat; also E8 item 5).

**Housekeeping still open:** creator deletes merged remote branch
`claude/test-coverage-analysis-siftjs` via GitHub UI (sandbox 403s on ref deletion).

## Where we left off

The Field Report found the market evidence validates the verified-guide bet, and the audits
found two load-bearing holes: the autonomous publish path graduates on an OFFLINE verify whose
network content-gate fails OPEN (E1 fixes), and the factory has never actually run headless
(E2 proves). The full queue: **E1** fail-closed gate → **E2** real end-to-end run → **E3**
strict undated-figure gate → **E4/E5** Korea+Denmark backfill→strict → **E6** entry+phrases →
**E7** route optimizer (tap-to-apply) → **E8** hygiene. Each session's exact edits, tests, and
clarifiers are in the plan; the doctrine now requires opening every session with them.

**Re-prompt the creator with:** "The Field Report and its execution plan are committed. Next
up is E1 — the fail-closed publish gate (Sonnet, ~2h): it's the trivial fix protecting the
'verified' promise itself, and E2 (the first real pipeline run, Opus) is queued right behind
it now that the token's confirmed. Start E1?"
