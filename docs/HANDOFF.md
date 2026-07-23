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

**The ACTIVE execution queue is `docs/PLAN_FIELD_REPORT_FIXES.md`** (E1→E8). E1/E3/E4/E5/E6 are
**DONE**; E2 is **deferred** (no trip planned — resume whenever one exists); next up is **E7**.
`PLAN_TRAVELER_FEATURES.md` holds F1/F2/F4-F7 after this queue; `PLAN_VISUAL_OVERHAUL.md` holds
V5/V6.

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
`provenance: "strict"`, surfacing real corrections along the way (Korea: MMCA's fee dropped to
free, Leeum's roughly doubled; Denmark: a City Pass 48h price disagreement recorded, not
resolved silently). Both PASS `verify` offline + `--network`.

**E6** (`feat(intake):`, `feat(trip-kit):`, `research(entry):`, `research(phrases):`, 4 commits):
- Intake: `passport-countries` field wired through the issue form, `intake-schema.mjs`
  (FIELDS + zod), `scaffold-guide.mjs` (CLI + `buildIntakeMd`), and `NEW_GUIDE_INTAKE.md`.
- UI: `TripKit.astro`'s entry-requirements card shows a country picker only when `entry[]` has
  >1 row; single-row guides are unchanged. New `ui/entry-select.js` (untested by design, matches
  `ui/speak.js`'s DOM-glue pattern).
- Content: `entry[]` + `phrases` populated for Korea + Denmark — **US passport only**, the one
  country either trip has actual evidence for. Korea: K-ETA's exemption for US citizens through
  Dec 31, 2026, confirmed via a Korean MOFA consulate notice (a contradicting blog claim that
  K-ETA is mandatory again was checked against this official source and is wrong). Denmark: the
  Schengen 90/180-day rule + passport validity, confirmed via the EU's own Your Europe page.
  5 phrase cards per guide (ko-KR / da-DK), each translation cross-checked against an
  independent reputable source before shipping (a wrong native-script phrase is safety-adjacent).
  No allergy/dietary fact was invented for either party — neither guide records one, so only the
  generic "I'm vegetarian" situational card shipped, nothing more specific.
- Verified: build clean, verify PASS offline + `--network` (0 dead links) on both guides,
  717/717 tests, typecheck 0 errors, dark + mobile 375px eyeballed in preview (screenshots).

**Next up: E7 — day-route optimizer, tap-to-apply.** Sonnet (Opus if the geometry fights). New
sealed silo `src/features/route-opt/`, zero network/schema/guide-JSON changes — see the plan's
E7 section for the full spec (haversine + 2-opt, localStorage-only reorder, GPX/ICS/print keep
guide order).

**Re-prompt the creator with:** "E6 is shipped — passport-countries is now a real intake field,
the Trip Kit's entry card is dropdown-ready for multi-passport parties, and Korea + Denmark both
have real entry + phrase-card content for their US-passport travelers. Next up is E7 (route
optimizer, tap-to-apply, Sonnet, ~3-4h) — want me to start it?"
