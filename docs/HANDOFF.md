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

**`docs/PLAN_FIELD_REPORT_FIXES.md` (E1→E8) is CLEARED.** E1/E3/E4/E5/E6/E7/E8(1–4) are **DONE**;
E2 is **deferred** (no trip planned — resume whenever one exists); E8 item 5 (a human real-photo
eyeball on the V4 contour-visibility pass) is the creator's, not an agent's — flagged, not
attempted. Next document up is `PLAN_TRAVELER_FEATURES.md` (F1/F2/F4-F7) — nothing has started
there yet this session; `PLAN_VISUAL_OVERHAUL.md` holds V5/V6 after that.

- **Secret status:** `CLAUDE_CODE_OAUTH_TOKEN` confirmed valid 2026-07-20 — not a blocker
  whenever E2 resumes.
- **CLAUDE.md carries the Clarifying-Questions Doctrine** — binding on every plan/prompt/session.

**Also on `main`:** the 07-20 review plan fully executed + removed; docs consolidated ~25%;
connector policy asserted (github + Claude Code Remote only). Visual arc V1–V4 live.

**Housekeeping still open:** creator deletes merged remote branch
`claude/test-coverage-analysis-siftjs` via GitHub UI (sandbox 403s on ref deletion).

## Where we left off

**E4 + E5**: both guides flipped to `provenance: "strict"`, surfacing real corrections (Korea:
MMCA's fee dropped to free, Leeum's roughly doubled; Denmark: a City Pass 48h price disagreement
recorded, not resolved silently).

**E6** (4 commits): `passport-countries` is now a real intake field across all three surfaces —
systematic for every future guide, not an ad-hoc question. `TripKit.astro`'s entry card is
dropdown-driven for >1 `entry[]` row. Korea + Denmark got real `entry[]` + `phrases` content —
**US passport only**, the one country either trip has evidence for. 5 cross-checked phrase
cards per guide (ko-KR/da-DK); no allergy/dietary fact invented for either party.

**E7** (1 commit): new sealed silo `src/features/route-opt/` — haversine + NN + 2-opt over a
day's located waypoints, zero network/schema/guide-JSON changes. Fires only above a real savings
threshold; verified against REAL guide data — exactly one real day each in Korea (≈6.44km) and
Denmark (≈1.5km). Model unit-tested (8 tests); DOM half covered by
`tests/visual/route-opt.spec.ts` — all green.

**E8** (1 commit, items 1–4): shelf-life constant now has a deep-equal sync test; the
flat-vs-directory guide-shape resolution (previously 3 duplicated copies — graduate-guide.mjs,
its `.yml` inline bash, audit/lib.mjs's readGuides) now lives once in
`scripts/lib/guide-shape.mjs`; US + Mexico got verified 911 SOS entries (Portugal's EU-112
fallback confirmed already-covered); the map-tile offline decision (tiles stay uncached, `routes`
blocks are the actual offline mitigation) is documented in `src/features/maps/README.md`. Item 5
(V4 contour-visibility human eyeball) is explicitly the creator's — not attempted.

All of E4–E8: build clean, full test suite green (731/731), typecheck 0 errors, mobile 375px +
desktop + dark + reduced-motion eyeballed in preview each time.

**The `PLAN_FIELD_REPORT_FIXES.md` queue this session was working is now cleared** except the
two items only the creator can close (E2 needs a real trip; E8 item 5 needs your own eyes).
Nothing else in it is silently open.

**Re-prompt the creator with:** "The Field Report execution queue (E1–E8) is fully cleared except
two things only you can do: E2 (the real end-to-end pipeline proof) needs an actual trip to plan,
and E8's contour-visibility check needs your own eyes in preview. Want me to start
`PLAN_TRAVELER_FEATURES.md` next (F1/F2/F4-F7), or is there something else you'd rather prioritize?"
