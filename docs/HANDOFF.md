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

**Both `docs/PLAN_FIELD_REPORT_FIXES.md` (E1–E8) and `docs/PLAN_TRAVELER_FEATURES.md`
(F1/F2/F4–F7·C1) are CLEARED.** Everything buildable without a real trip or a human eyeball is
done. What's left, and only the creator can close it:
- **E2** — the real end-to-end pipeline proof — needs an actual trip to plan.
- **E8 item 5** — a human real-photo eyeball on the V4 contour-visibility pass.
- **F7 C2** — needs evidence from **two real research passes** running C1's bar test first;
  same real-trip gate as E2. C3 only builds if C2's evidence says so.

Next document up: `PLAN_VISUAL_OVERHAUL.md` (V5/V6) — nothing started there yet.

- **CLAUDE.md carries the Clarifying-Questions Doctrine** — binding on every plan/prompt/session.
- **Secret status:** `CLAUDE_CODE_OAUTH_TOKEN` confirmed valid 2026-07-20.
- **Housekeeping still open:** creator deletes merged remote branch
  `claude/test-coverage-analysis-siftjs` via GitHub UI (sandbox 403s on ref deletion).

## Where we left off

**F1** (1 commit): checklist items can upgrade from a bare string to `{ text, due, ... }` —
additive, schema-enforced (a `due` requires source+date, same as `entry[]`). New `deriveBookByTimeline`
buckets overdue/soon/later into a Trip Kit card. Backfilled 2 REAL dated items (Korea's
e-Arrival Card, Sedona's Red Rock Pass) — nothing invented where no real deadline existed.

**F2** (1 commit): shipped design **deviated from the plan's literal wording** after research
showed why — the intake budget target never reaches a shipped guide as data, and Trip Split has
no per-day/currency tracking. Built `src/features/budget-pact/` joining the Budget tab's own
plan against its own "your spend" actuals instead — see the plan doc's F2 section for the
full reasoning. Honest-blank until real spend is entered; shows both under AND over plan.

**F4** (1 commit): `derivePackingList` — rain/layers/sun-protection flags from the SAME forecast
+ daylight math the weather/sun strips already compute, zero new APIs. Piggybacks on the
existing fetch (`tg:wx`), never triggers its own. Verified via a synthetic forecast event (the
real Open-Meteo fetch is blocked in this sandbox, same as Commons/Firebase elsewhere).

**F5** (1 commit): `tests/visual/offline.spec.ts` — first real proof the PWA precache works
(airplane-mode E2E, all 5 built guides + shell). Found an ALREADY-SHIPPED "Works offline" badge
reading real Cache Storage (guide-ui.js §10) — added test coverage for it instead of building a
redundant one. `/health/`'s visual.yml entry upgraded support→proven.

**F6** (1 commit): real gap found — recert.yml already runs weekly but has zero recorded
executions, and has no concept of a guide's trip dates at all. New daily `pretrip-check.yml`
(report-only, mirrors content-audit.yml's single-tracking-issue pattern) flags guides entering
their T-7 window. Sedona will exercise this for real in ~40 days, unattended.

**F7 C1** (1 commit): the Critic bar-test lens, prompt-only, mirrored into both
research-pass.yml's self-correction loop and the guide-author skill's Done gate. **Built on
Sonnet** — the plan recommends Opus for C1/C2 and no mid-session model switch was available;
flagged to the creator before starting. C2/C3 not started (blocked on real research-pass
evidence, per above).

All of F1–F7·C1: build clean, full test suite green (762/762 — 34 new this arc), typecheck 0
errors, mobile 375px + desktop + dark eyeballed in preview for every user-facing change.

**Re-prompt the creator with:** "F1 through F7·C1 are all shipped and pushed — both grand plans
are now cleared except three things only you can do: E2 and F7 C2 both need a real trip to
plan (same gate), and E8's contour-visibility check needs your own eyes. Also — F7's plan
recommends Opus for the Critic sessions; C1 shipped on Sonnet since no switch was available
mid-session, worth a look if you want a second pass. Want me to start `PLAN_VISUAL_OVERHAUL.md`
(V5/V6) next, or prioritize something else?"
