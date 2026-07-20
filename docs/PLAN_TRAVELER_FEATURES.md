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

## Research grounding (July 2026)

- **61% of travelers** name hidden/unexpected fees as their top booking frustration; **31% are
  booking earlier to lock prices** (Fullstory / Deloitte 2026). → deadlines + fee-honest totals.
- **Packing (26%) and planning (23%)** are top pre-trip stressors; **76% want apps that reduce
  friction/stress** (Deloitte / Fullstory). → packing help, fewer decisions in-trip.
- **~Half of group travelers have fought about money** on a trip (CIT Bank 2026, already in
  FEATURES.md). → budget pact.
- Competitor scan (Wanderlog/TripIt/Polarsteps/AI planners): the market's paid moats are
  email-import vaults and flight alerts (rejected here: no paid APIs, vault dropped by creator).
  **Nobody competes on verified-fact freshness — that stays the moat**; these sessions deepen it.

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

## Session F7 — The judgment layer: bar-test in the verify loop

**Why:** (from the Pass-C debate, 2026-07-20) the pipeline verifies facts but never judges the
*guide*. Cheapest strong version: fold the bar test into the existing verify self-correction loop.
**Clarifying questions:** (a) Confirm prompt-only scope (no new pipeline stage yet). (b) Which
guide to trial it on.
**Do:** prompt-only edit to `research-pass.yml`'s verify-loop step + the guide-author skill's done
gate: before declaring PASS, read the full merged guide as the traveler; list every item a generic
AI guide to this destination would also contain; replace or justify each against the intake
ranking; log the pass's findings in the scorecard. NO new stage, NO STAGE_ORDER change.
**Exit:** the next real research run's scorecard shows bar-test findings; evaluate on evidence
whether a full Pass C stage is warranted (only then does it become its own plan). HANDOFF.

---
*Priority logic: F0 unlocks everything (factory proof). F1–F2 are the two research-validated,
already-scoped features (held wave revived). F3 converts shipped mechanisms into real traveler
safety value at pure research cost. F4–F5 are zero-API stress-reducers (packing 26%, offline
confidence). F6–F7 deepen the moat (freshness + judgment). Re-sort only with new evidence.*
