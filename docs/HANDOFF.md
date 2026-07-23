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

## Snapshot (updated 2026-07-23, session close)

**The ACTIVE execution queue is `docs/PLAN_FIELD_REPORT_FIXES.md`** (E1→E8), built from the
2026-07-22 Field Report (`docs/FIELD_REPORT_2026-07-22.md` — evidence base, reference-only:
106-agent deep-research pass + three same-day codebase audits). It absorbs F0/F3/F8 from
`PLAN_TRAVELER_FEATURES.md` (marked "moved" there); F1/F2/F4/F5/F6/F7 remain there, sequenced
after it. `PLAN_VISUAL_OVERHAUL.md` still holds V5 (morph continuity) + V6 (QA/perf).

- **E1 is DONE (this session)** — the fail-closed `--network` publish gate. See "Where we left
  off" below for what shipped.
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

**E1 shipped this session (3 commits, `fix(pipeline):` prefix):**
1. `verify-guide.mjs` gained an `unverifiable` content state — a Commons API outage or a total
   link-probe outage used to leave `dead`/`missing` both empty, which read as a clean pass (the
   fail-open hole). Now it blocks (`content-unverifiable`); a single flaky link stays advisory.
   5 new tests, 28/28 green in that file.
2. `research-pass.yml` gained step (c2), a FINAL NETWORK GATE between the offline
   self-correction loop and auto-graduation — the offline rounds never checked links/photos, so
   the loop could reach "PASS" having proven nothing about content.
3. `research-pass.yml`'s landing snippet now derives `PASSED` from the actual verify exit code,
   not `nextStage=null` alone.
`graduate-guide.yml` (manual path) needed no change — already gates on the raw exit code, so it
inherits the fix for free. Table-top trace of both paths (dead-link/outage/clean) is in the
third commit's body. Ship loop ran clean: build, `npm test` (707/707), typecheck (0 errors),
workflow YAML re-read + sanity-parsed. No UI touched, so no `astro preview` pass was needed.

**Next up: E2 — prove the pipeline end-to-end (Opus driver).** The secret is confirmed valid;
the one thing that's never happened is a real headless run exercising the now-fixed gate. E2's
session-start clarifiers (destination/party/dates/priorities for the test guide; attempt
budget) still need an `AskUserQuestion` before starting, per the plan and doctrine.

**Re-prompt the creator with:** "E1 (fail-closed publish gate) is shipped and pushed. Next up is
E2 — the first real end-to-end pipeline run (Opus driver, workflow agent stays Sonnet): file a
real guide, watch it move through checkpoints, fix any wiring failures live. Needs a destination/
party/dates/priorities for the test guide and an attempt-budget default. Start E2?"
