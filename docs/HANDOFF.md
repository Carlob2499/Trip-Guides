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

**The ACTIVE execution queue is `docs/PLAN_FIELD_REPORT_FIXES.md`** (E1→E8). E1/E3/E4/E5/E6/E7 are
**DONE**; E2 is **deferred** (no trip planned — resume whenever one exists); next up is **E8**
(hygiene sweep, no clarifying questions, proceed directly). `PLAN_TRAVELER_FEATURES.md` holds
F1/F2/F4-F7 after this queue; `PLAN_VISUAL_OVERHAUL.md` holds V5/V6.

- **E6 redesign (creator direction, 2026-07-23):** rather than asking per-guide which passport
  countries to research, `passport-countries` is now a real field across all three intake
  surfaces (issue form, `intake-schema.mjs`, `scaffold-guide.mjs`) — systematic for every future
  guide. `TripKit.astro`'s entry card is dropdown-driven whenever a guide has >1 `entry[]` row.
- **Secret status:** `CLAUDE_CODE_OAUTH_TOKEN` confirmed valid 2026-07-20 — not a blocker
  whenever E2 resumes.
- **CLAUDE.md carries the Clarifying-Questions Doctrine** — binding on every plan/prompt/session.

**Also on `main`:** the 07-20 review plan fully executed + removed; docs consolidated ~25%;
connector policy asserted (github + Claude Code Remote only). Visual arc V1–V4 live; V4
contour-visibility still needs a human real-photo eyeball (MOTION.md caveat).

**Housekeeping still open:** creator deletes merged remote branch
`claude/test-coverage-analysis-siftjs` via GitHub UI (sandbox 403s on ref deletion).

## Where we left off

**E4 + E5** (`research(korea):`, `research(denmark):`): both guides flipped to
`provenance: "strict"`, surfacing real corrections (Korea: MMCA's fee dropped to free, Leeum's
roughly doubled; Denmark: a City Pass 48h price disagreement recorded, not resolved silently).

**E6** (4 commits): `passport-countries` is now a real intake field across all three surfaces
(issue form, `intake-schema.mjs`, `scaffold-guide.mjs`) — systematic for every future guide, not
an ad-hoc question. `TripKit.astro`'s entry card is dropdown-driven for >1 `entry[]` row. Korea +
Denmark got real `entry[]` + `phrases` content — **US passport only**, the one country either
trip has evidence for (Korea: K-ETA's exemption through Dec 31 2026, a Korean MOFA consulate
notice; Denmark: Schengen 90/180-day rule, the EU's Your Europe page). 5 cross-checked phrase
cards per guide (ko-KR/da-DK); no allergy/dietary fact invented for either party.

**E7** (1 commit): new sealed silo `src/features/route-opt/` — haversine + NN + 2-opt over a
day's located waypoints, zero network/schema/guide-JSON changes. Advisory chip fires only above
a real savings threshold; verified against REAL guide data (not invented fixtures) — fires on
exactly one real day each in Korea (≈6.44km) and Denmark (≈1.5km), cross-checked with an
independent Python re-implementation before any UI was written. Model unit-tested (8 tests); DOM
half covered by `tests/visual/route-opt.spec.ts` (chip/sheet/apply/restore/reload/Escape) —
all green, pre-existing itinerary suite unaffected.

All of E4–E7: build clean, full test suite green, typecheck 0 errors, mobile 375px + desktop +
dark + reduced-motion eyeballed in preview each time.

**Next up: E8 — hygiene sweep (no half-turned keys).** Sonnet/Haiku, no clarifying questions
(plan says proceed directly). 5 items: shelf-life constant dedup test, guide-shape resolution
dedup, SOS coverage for us/mexico/portugal, map-tile offline decision documented, and a human
eyeball on the V4 contour-visibility pass (that last one is the creator's, not an agent's).

**Re-prompt the creator with:** "E1 through E7 are all shipped and pushed — the Field Report's
whole active queue except the deferred E2 (no trip planned yet) is done, including the route
optimizer. Next up is E8, the hygiene sweep (~1-1.5h) — one item in it (the V4 contour-visibility
eyeball) needs you personally, not me."
