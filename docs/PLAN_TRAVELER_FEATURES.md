# Grand Plan — Traveler Features (research-prioritized)

Consecutive, self-contained sessions an executing agent (Opus by default — the creator's call;
Sonnet is fine for the mechanical builds per the model-economy note in `docs/HANDOFF.md`) can run
autonomously. Ordered by **net benefit for any traveler ÷ build cost**, grounded in the July 2026
research below and in what already exists — nothing here duplicates the shipped wave in
`docs/FEATURES.md` (transit links, Trip kit, phrases/entry mechanisms, sun strip, advisory pill,
recap card) or the existing `live-data` models (weather, currency rate, rainy-day day-swap).

## The session ritual (binding for EVERY session below)

Read `docs/HANDOFF.md` first (warm start) → read the session block → put the session's
*Clarifying questions* to the creator via `AskUserQuestion`, wait for explicit go → build
within scope (repo law applies: sealed silos, BASE_URL hrefs, verification dates on new facts,
tab budget, no paid APIs) → CLAUDE.md's ship loop on every change (`verify-live` guards the
deploy) → **end by rewriting `docs/HANDOFF.md`** (Snapshot + Where-we-left-off, naming the
NEXT session and its clarifiers) and committing. Never skip the HANDOFF rewrite — it is how
the plan survives session boundaries.

## Model & time budget

Per the repo's model-economy rule (HANDOFF operating rules): **Sonnet** for mechanical builds and
all research/fact work; **Opus** where judgment or novel debugging dominates. The creator switches
model at session start (`/model`) — each session's opening ritual includes reminding them.
"Active" = hands-on agent time; "wall-clock" = pipeline runs you wait on, not attention.

| Session | Model | Est. active | Notes |
|---|---|---|---|
| F0 pipeline proof | — | — | **MOVED** → PLAN_FIELD_REPORT_FIXES E2 |
| F1 prep timeline | Sonnet | 2–3.5 h | Schema (additive) + model + Trip kit card + sourced `due` research — **DONE** |
| F2 budget pact | Sonnet | 1–2 h | Join logic + one chip; smallest build session — **DONE** (design deviated from spec — see HANDOFF) |
| F3 dormant content | — | — | **MOVED** → PLAN_FIELD_REPORT_FIXES E6 |
| F4 packing strip | Sonnet | 1.5–2.5 h | Derivation model + Trip kit render — **DONE** |
| F5 offline confidence | Sonnet | 2–3 h | Offline E2E debugging can drag; budget for it — **DONE** |
| F6 pre-trip auto-recert | Sonnet | 1.5–2.5 h + first-run wall-clock | Probation mode first — **DONE** |
| F7 the Critic (C1–C3) | **Opus** C1–C2, Sonnet C3 | ≈4–6 h | **C1 DONE** (built on Sonnet, no model switch available — flagged to creator); C2/C3 blocked on 2 real research passes, same real-trip gate as E2 |
| F8 route optimizer | — | — | **MOVED** → PLAN_FIELD_REPORT_FIXES E7 (tap-to-apply) |
| **Plan total** | | **≈ 18–28 h active** | Each session independently shippable |

## Research grounding (July 2026)

- **61% of travelers** name hidden/unexpected fees as their top booking frustration; **31% are
  booking earlier to lock prices** (Fullstory / Deloitte 2026). → deadlines + fee-honest totals.
- **Packing (26%) and planning (23%)** are top pre-trip stressors; **76% want apps that reduce
  friction/stress** (Deloitte / Fullstory). → packing help, fewer decisions in-trip.
- **~Half of group travelers have fought about money** on a trip (CIT Bank 2026, already in
  FEATURES.md). → budget pact.
- **Full competitive sweep: `docs/COMPETITIVE_LANDSCAPE.md`** (Wanderlog, Mindtrip, Layla,
  Stippl, GuideGeek, TripIt, Polarsteps, Roadtrippers, Elsewhere/kimkim — segments, parity
  matrix, served-code inspection). Net: parity gaps worth closing are route optimization (F8),
  packing (F4), proven offline (F5); live co-edit and booking/price APIs are **rejected with
  reasons** (provenance moat, fee-funnel incentives). **Nobody competes on verified-fact
  freshness — that stays the moat**; these sessions deepen it.

---

## Session F0 — MOVED → `PLAN_FIELD_REPORT_FIXES.md` session E2

The pipeline-proof session now lives there (sequenced after the E1 publish-gate fix so the
run exercises the fixed gate). The OAuth secret is in place, confirmed valid 2026-07-20.

## Session F1 — Prep timeline: book-by deadlines (revive held #2)

**Why:** strongest validated gap. 31% book earlier to lock prices; 61% hate surprise fees; the
guides already answer "book?" per venue but never *when*. A T-minus timeline turns scattered
"book ahead" notes into one glanceable surface — coordination is where group trips die.
**Clarifying questions:** (a) Trip kit card or Reminders-tab integration — creator preference?
(b) Should deadline items carry a fee-honest "real total" note where sourced?
**Do:** additive optional `due` (ISO date) + existing booking fields on checklist/venue schema
(`content.config.ts`, zod, additive only — no guide breaks); pure model logic
(`src/features/trip-kit/model/` — T-minus computation, overdue/soon/later bucketing, tested);
render as a "Book by" card in Trip kit (first position after entry card); research pass populates
`due` values for existing guides with sources (guide-author skill discipline — a deadline is a
perishable fact: `source_url` + `verified_on`).
**Exit:** ship loop green; Korea or Sedona shows a real, sourced booking timeline; HANDOFF.

## Session F2 — Budget pact: plan vs. actual (revive held #3)

**Why:** ~half of group travelers fight about money; the repo already holds both halves — the
intake's budget/day target and Trip Split's live actuals — and never connects them.
**Clarifying questions:** (a) Tone — silent until over-budget (honest-blank doctrine) or always
visible? (b) Per-person or per-group framing?
**Do:** pure model fn joining intake budget target (guide meta) with Trip Split actuals
(existing silo); a single pact line/chip in the Budget tab ("Day 4: ≈$61 over plan"); zero new
backend, zero new tabs. Tests on the join logic + currency handling (reuse `live-data/rate`).
**Exit:** ship loop green; visible on a guide with real Trip Split seed data; HANDOFF.

**Shipped design, deviated from the spec above — reality-checked before building:** the
intake's budget-tier string ("Mid-range ($75–150/day)") never actually reaches a shipped
guide as structured data (it lives only in a per-guide intake `.md` several guides don't
even keep), and Trip Split tracks a single running grand total with no per-day breakdown
and no currency field — neither can support the "Day 4: over plan" framing at all. Built
instead as `src/features/budget-pact/`, joining the Budget tab's OWN already-numeric
per-item plan (`basis: "day"|"trip"`) against that SAME section's own "your spend" inputs
— already numeric, already per-day, already in the guide's currency, zero new backend
either way. See the commit for the full reasoning.

## Session F3 — MOVED → `PLAN_FIELD_REPORT_FIXES.md` session E6

The dormant-content session now lives there, with the creator's 2026-07-22 decisions woven in
(entry rows for US + additional passports, named at session start; ko-KR/da-DK phrase cards).

## Session F4 — Weather-aware packing strip

**Why:** packing is the #2 pre-trip stressor (26%). The repo already computes per-day weather,
sun, and activities — a packing strip is derivation, not new data. Zero APIs.
**Clarifying questions:** (a) Trip kit placement OK? (b) Per-day ("layers Tuesday") or per-trip
("pack for 4–18°C, two rain days") framing — or both?
**Do:** pure model (`live-data` or `trip-kit` model): forecast window + `env` tags + trip dates →
a short, honest packing list (rain shell if wet-code days, layers by temp spread, sun items by UV
proxy/daylight). Render in Trip kit. Never invent (no forecast → no strip — honest blank). Tests
against fixture forecasts.
**Exit:** ship loop; strip renders on a guide with live forecast, absent without; HANDOFF.

## Session F5 — Offline confidence

**Why:** connectivity gaps are a universal in-trip failure; the PWA precache exists but has never
been *proven* offline, and nothing tells the traveler it works. Confidence is the feature.
**Clarifying questions:** (a) Is an install-nudge banner acceptable, or indicator-only (quieter)?
**Do:** airplane-mode E2E (Playwright offline context): shell + all three guides load with zero
network; fix whatever fails (fonts, maps iframe fallback text, transit links degrade to coords).
Add a small "Saved for offline ✓" indicator (service-worker state, honest — only when actually
cached). Document the audit in the test file.
**Exit:** offline E2E green in CI; indicator live; ship loop; HANDOFF.

## Session F6 — Pre-trip auto-recert (freshness where it matters most)

**Why:** the moat is verified freshness, and it matters most in the days before departure —
exactly when a traveler stops checking. `recert.yml` exists but has never run (audit).
**Clarifying questions:** (a) T-7 the right window? (b) Auto-commit fixes or file-an-issue mode
for the first supervised runs (probation, like auto-publish)?
**Do:** add a scheduled trigger path that reads each guide's trip start date and fires recert for
guides entering the T-7 window; probation mode first (report, don't auto-commit) until one clean
supervised run, mirroring the auto-publish probation pattern. Update `/health/` verdict text.
**Exit:** one real recert run on a live guide (post-F0, the token exists); HANDOFF.

## Session F7 — The Critic: the pipeline's judgment layer (staged C1→C2→C3)

**Why:** (the Pass-C debate, 2026-07-20) the pipeline verifies facts but never judges the
*guide* — and generic-AI convergence is every rival planner's shared weakness, so the critic is
the anti-generic weapon. A third *gathering* pass would re-tread A/B for nothing; the value is a
**critique-and-repair lens** attacking exactly the rubric rows auto-publish stopped enforcing
(anchor quality, party fit, authenticity). It must *earn* stage-hood on evidence, not faith.

**Guardrails (binding at every stage):** (1) Critic ≠ editor — every change re-enters the
verification ledger (`source_url` + `verified_on`, continuity sweep); a rewrite that orphans a
citation is a defect. (2) Honest-blank survives critique — never fill a gap to feel complete.
(3) The instrument is the bar test: "Would this item appear in ANY generic AI guide? If yes:
replace it, or justify it against THIS traveler's ranked priorities." (4) Findings are logged
always, even when zero — silence is indistinguishable from not-run.

- **C1 — the lens (prompt-only; no new stage; Opus, 1–1.5 h).** Edit `research-pass.yml`'s
  verify self-correction loop + the guide-author skill's done gate: before verify may declare
  PASS, run the bar test across the merged guide, fix findings under guardrail #1, write the
  findings block into the scorecard. NO `STAGE_ORDER`/schema/checkpoint change. Exit: a dry-run
  against Korea or Sedona produces a real findings block.
- **C2 — the evidence gate (Opus, 0.75–1.5 h). Trigger, not schedule:** only after **two real
  research passes** have run C1's checklist (F0 counts as the first). Read both runs' findings:
  did the critic catch real blandness the mechanical verify missed? Did repairs survive
  verification? What did it cost? Record the verdict here under a dated **Evidence** heading,
  then `AskUserQuestion` the creator: promote (C3), stay prompt-only, or drop.
- **C3 — promotion to a true Pass C stage (Sonnet, 2–3 h; only if C2 says so).** The full
  continuity-swept ripple: `critique` into `STAGE_ORDER` between `reconcile` and `verified`
  (`scripts/pipeline.mjs` + tests), pipeline-progress model/labels/mocks, `research-pass.yml`
  stage charter (C1 checklist + guardrails verbatim), scorecard + `docs/PIPELINE.md` +
  `docs/GUIDE_RUBRIC.md` updated, attempt-cap wiring. Runtime cost ~+30–50%/run, paid only if
  promoted. Exit: one real run completes with the stage visible on `/progress/` + `/health/`.

*Escalation logic: C1 costs a prompt and can't hurt; C2 costs one reading session and prevents
building on vibes; C3 is real construction, paid for only with C2's evidence.*

## Session F8 — MOVED → `PLAN_FIELD_REPORT_FIXES.md` session E7

The route-optimizer session now lives there; the creator resolved its clarifier 2026-07-22 as
**tap-to-apply** (localStorage per-device reorder + restore, never mutating guide JSON).

---
*Priority logic: F0 unlocks everything (factory proof). F1–F2 are the two research-validated,
already-scoped features (held wave revived). F3 converts shipped mechanisms into real traveler
safety value at pure research cost. F4–F5 are zero-API stress-reducers (packing 26%, offline
confidence) that also close paid-competitor parity gaps. F6–F8 deepen the moat (freshness,
judgment, and free-what-they-charge-for). Re-sort only with new evidence — the parity matrix in
`docs/COMPETITIVE_LANDSCAPE.md` is the standing reference.*
