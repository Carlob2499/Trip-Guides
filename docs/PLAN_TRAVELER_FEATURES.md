# Grand Plan — Traveler Features (research-prioritized)

Consecutive, self-contained sessions an executing agent (Opus by default — the creator's call;
Sonnet is fine for the mechanical builds per the model-economy note in `docs/HANDOFF.md`) can run
autonomously. Ordered by **net benefit for any traveler ÷ build cost**, grounded in the July 2026
research below and in what already exists — nothing here duplicates the shipped wave in
`docs/FEATURES.md` (transit links, Trip kit, phrases/entry mechanisms, sun strip, advisory pill,
recap card) or the existing `live-data` models (weather, currency rate, rainy-day day-swap).

## The session ritual (binding for EVERY session below)

1. **Start:** read `docs/HANDOFF.md` first (warm start), then this plan's session block.
2. **Ask before building:** put the session's *Clarifying questions* to the creator via
   `AskUserQuestion` — plus any others genuinely warranted. Wait for explicit go.
3. **Build** within the session's scope. Repo law applies: sealed silos, BASE_URL hrefs,
   verification dates on new facts, tab budget, no paid APIs (the pipeline is the backend).
4. **Ship loop every change:** `npm run build` → `npm test` → `astro preview` :4322 at 375px +
   desktop + dark + reduced-motion → grep `dist/` → commit → push `main` (the only branch).
   `verify-live` then guards the deploy automatically.
5. **End: rewrite `docs/HANDOFF.md`** (Snapshot + Where-we-left-off, naming the NEXT session of
   this plan and its clarifying questions) and commit. The next session starts warm. Never skip
   this — it is how the plan survives session boundaries.

## Model & time budget

Per the repo's model-economy rule (HANDOFF operating rules): **Sonnet** for mechanical builds and
all research/fact work; **Opus** where judgment or novel debugging dominates. The creator switches
model at session start (`/model`) — each session's opening ritual includes reminding them.
"Active" = hands-on agent time; "wall-clock" = pipeline runs you wait on, not attention.

| Session | Model | Est. active | Notes |
|---|---|---|---|
| F0 pipeline proof | **Opus** driver (workflow agent stays Sonnet) | 1.5–3 h + 1–2 h wall-clock/run | Opus for first-run triage — failures will be novel; re-runs resume from checkpoints |
| F1 prep timeline | Sonnet | 2–3.5 h | Schema (additive) + model + Trip kit card + sourced `due` research |
| F2 budget pact | Sonnet | 1–2 h | Join logic + one chip; smallest build session |
| F3 dormant content | Sonnet | 2–3 h | Pure guide-author research × 3 guides (entry, phrases, env tags) |
| F4 packing strip | Sonnet | 1.5–2.5 h | Derivation model + Trip kit render |
| F5 offline confidence | Sonnet | 2–3 h | Offline E2E debugging can drag; budget for it |
| F6 pre-trip auto-recert | Sonnet | 1.5–2.5 h + first-run wall-clock | Probation mode first |
| F7 the Critic | see `PLAN_PIPELINE_CRITIC.md` | (C1–C3 budgeted there) | |
| F8 route optimizer | Sonnet | 2–3 h | 2-opt + fixtures + advisory chip |
| **Plan total (excl. F7)** | | **≈ 14–22 h active** | Each session independently shippable |

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

## Session F0 — Prove the pipeline end-to-end (THE GATE)

**Why first:** the audit's #1 finding — the research pipeline has never completed a real run.
Every session below gains value from a working factory; nothing else proves it.
**Prereq:** `CLAUDE_CODE_OAUTH_TOKEN` repo secret (creator adds via `claude setup-token`).
**Clarifying questions:** (a) Is the secret in place? (b) Destination, party, dates, ranked
priorities for the real test guide (use `docs/NEW_GUIDE_INTAKE.md`). (c) Budget cap for attempts.
**Do:** file the New-guide issue (or scaffold directly), trigger `research-pass.yml`, babysit the
run — watch checkpoints, the `/progress/` page, and fix any wiring failures as they surface
(commit fixes to `main`). Expect wiring bugs; that is the point of the session.
**Exit:** a real guide reaches `verified`, auto-publishes, its "🚀 Auto-published" issue appears,
`verify-live` passes, and `/health/` shows research-pass green. Rewrite HANDOFF.

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

## Session F3 — Turn on the dormant safety content (research, not code)

**Why:** `entry` (visa/passport — denied-boarding stakes) and `phrases` (allergy/taxi/help —
safety-adjacent) shipped as mechanisms but are DORMANT on every guide. Content, not features, is
the missing half. Also: tag each guide's days `env:"outdoor"`/`"indoor"` where honestly known so
the existing rainy-day swap advisory can actually fire (it is silent without explicit tags).
**Clarifying questions:** (a) Confirm traveler home country per guide (entry rules depend on it).
(b) Any allergies/dietary needs to prioritize in phrase cards?
**Do:** run the `waypoint-guide-author` skill per guide: populate `entry` from each destination's
official entry page (T0 source, `source_url`+`verified_on` are schema-required), `phrases` with
verified native script + romanization, and `env` day tags. No fabrication — a phrase or rule that
can't be verified stays blank (honest-blank).
**Exit:** entry + phrases live on all three guides; day-swap advisory armed; ship loop; HANDOFF.

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

## Session F7 — The judgment layer: run the Critic plan

**Why:** (from the Pass-C debate, 2026-07-20) the pipeline verifies facts but never judges the
*guide* — and per the competitive sweep, generic-AI convergence is every rival planner's shared
weakness, so the critic is the anti-generic weapon.
**Do:** execute **`docs/PLAN_PIPELINE_CRITIC.md`**, its own staged grand plan: C1 (bar-test as a
prompt-only lens in the verify loop — buildable now), C2 (evidence gate after two real runs),
C3 (promotion to a true Pass C stage only if the evidence says so). Its ritual, guardrails, and
clarifying questions live there; this session IS that plan's next unrun session.

## Session F8 — Day-route optimizer (beyond parity, free)

**Why:** route optimization is Wanderlog **Pro's** headline paid feature ($39.99/yr, online-only)
— and Waypoint already holds verified coordinates for every stop, so it can ship the same value
free, client-side, and offline. Parity where it counts; beyond parity on price and honesty.
**Clarifying questions:** (a) Suggest-only (like the rainy-day swap — advisory, never auto-apply)
or a tap-to-reorder? Recommended: suggest-only, matching the honesty pattern. (b) Per-day scope
only, or also flag "this stop belongs on a different day" (bigger; recommend deferring)?
**Do:** pure model in a sealed silo (nearest-neighbor + 2-opt over the day's verified coords —
tested against known-optimal fixtures; walking-distance heuristic, no routing API); a quiet
"Reorder could save ≈N km of backtracking" advisory chip on day cards that opens the suggested
order; honest-blank when a day has <3 located stops or the current order is already within
tolerance. Zero network, zero schema changes.
**Exit:** ship loop; advisory fires on a real guide day where reordering genuinely helps and
stays silent elsewhere; HANDOFF.

---
*Priority logic: F0 unlocks everything (factory proof). F1–F2 are the two research-validated,
already-scoped features (held wave revived). F3 converts shipped mechanisms into real traveler
safety value at pure research cost. F4–F5 are zero-API stress-reducers (packing 26%, offline
confidence) that also close paid-competitor parity gaps. F6–F8 deepen the moat (freshness,
judgment, and free-what-they-charge-for). Re-sort only with new evidence — the parity matrix in
`docs/COMPETITIVE_LANDSCAPE.md` is the standing reference.*
