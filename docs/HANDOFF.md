# HANDOFF — the warm-start context

> **Ritual (binding):** this file auto-loads at session start via the SessionStart hook
> (`scripts/handoff-head.mjs`) — do not Read it again. Greet the creator with the
> **"Where we left off"** line below and the recommended next step. At SESSION END, rewrite
> the Snapshot + Where-we-left-off sections, move the PREVIOUS snapshot to
> `docs/archive/HANDOFF_ARCHIVE.md`, and commit. The ≤120-line budget is gated by
> `scripts/__tests__/docs-integrity.test.mjs`; deep context lives in the north-star docs.

## Operating rules (stable — rarely change)

- **Model economy:** research/recert/fact edits + mechanical builds run on **Sonnet**; **Opus**
  for design sessions and judgment/first-run-triage work. Remind the creator to
  `/model`-switch at session start.
- **Never number guides as milestones** — the product is the backbone; a new guide is the
  backbone exercising.
- Ship loop on every change: build → **lint** → **typecheck** → test → `astro preview` :4322 →
  grep `dist/` → commit → push to `main` (the only branch — `verify-live` guards every deploy).
  Lint and typecheck are not optional: CI runs all three and session #20 pushed red twice by
  treating build+test as the whole gate.
- North stars: `docs/PIPELINE.md` (generation/maintenance) · `docs/MOTION.md`
  (presentation/motion) · `docs/GUIDE_RUBRIC.md` (quality bar) ·
  `docs/COMPETITIVE_LANDSCAPE.md` (market parity reference) ·
  **`docs/PLAN_ATLAS_MIGRATION.md`** (the current work order — its own Progress ledger is the
  source of truth for which stage is next; read that before re-deriving status from git log).

## Snapshot (2026-08-07 — Phase 2 completed; Atlas migration plan Stage A shipped)

**Session #38 ended mid-Phase-2** (archive has its detail); four more sessions/commits landed
before this one picked up the Atlas migration plan: `f3734c0` finished Phase 2 (sights/venues/
days/divergences all on Panels — the "remaining blocked" line in the old snapshot is resolved),
`efaca03` rebuilt the masthead as **the plate** (square, sunken bed, oxide corner ticks — the
plate NUMBER was deliberately omitted then for having no real data source), `edbd7b7` fixed
notation-layer gaps (staleness reading, sights' own provenance dot, dead CSS tokens) and
explicitly deferred the flag-chip and gap-state work as needing "a real architecture decision."
`06da464` wrote `docs/PLAN_ATLAS_MIGRATION.md` itself (a Fable grilling session, D1–D22 settled);
`b051389` cleared all 4 Dependabot alerts; `4e25569` integrated the creator's anchor bundle
(SPEC-COMPONENTS.md, ACCEPTANCE.md, ANTIPATTERNS.md, screenshots 10–21) into the plan.

**This session: Stage A — Guide-sheet completion, all 11 items.** Day-scrub `position:sticky`
fixed (`.pnl-body-in` clips only while collapsing/collapsed, not in the open steady state — a
`.pnl-clip` class carries the brief expand-transition case). `place_id` now reaches
`<TransitLinks>` from sights/venues. `closed_days` renders a Closed row on sights and gets a
new build-time (never-failing) cross-check against itinerary waypoints
(`scripts/check-closed-days.mjs`). Venues now grid inside a Panel (D12). The plate NUMBER
efaca03 omitted now ships — `src/lib/sheet-order.ts` (chronological-by-trip-start, pure+tested)
feeds "PLATE NN — CC"; masthead conformance bundle (16px inner mat, corner ticks at ITS corners,
title 640/-.014em, plate-line bottom hairline) done to the design-handoff prototype's exact
markup. Provenance popover conformance (oxide square border, WHERE THIS CAME FROM kicker via
`--aink` not raw oxide — D8's contrast trap avoided by construction, NO PUBLIC SOURCE fallback) —
extracted into one shared `ProvenancePopover.astro` (was tripled across 3 call sites). Flag
chips (D10) — edbd7b7's deferred item: `renderFactValue` now emits a real allowlisted `<a>` (no
new `<span>` shape needed) for `state:"approx"`, works with zero JS, `flag-chip.js` logic in
provenance-dot.js builds the same popover client-side from data-* attributes. Gap state (D9) —
edbd7b7's other deferred item: `state:"unconfirmed"` + `instead` added to the shared provenance
fields, `GapBlock.astro` built to the exact SPEC-COMPONENTS.md ASCII spec, wired into sights/
venues; verified via a scratch-and-revert content test (renders nowhere in real guides yet, by
design). COLLAPSE ALL/EXPAND ALL landed in each panel-group header. Hash auto-expand was already
shipped (verified live, no change needed). A real new a11y baseline entry
(`DAY_SCRUB_STICKY_RANGE_WHY`) was needed and added, verified/measured, not guessed — the day-
scrub fix interacting with the a11y gate's own force-all-tabs-open harness technique.

## Open items

- **Needs the creator:** (1) LOCAL branch `worktree-agent-a7dc7eeb397c6a368` (progress-study,
  `5917f8f`, exists nowhere else) — keep or lose; (2) sign off revise-guide `land` default `draft`
  → `auto` + V6 Q4 thresholds; (3) Cloudflare dashboard Git integration still failing 0s builds on
  every push — consider disabling; (4) skill-evals `push` trigger yes/no (fired 0 times as
  `pull_request`-only); (5) Stage C checkpoint — Sedona/Japan departure-airport confirmation
  (D14/Clarifying #1), asked once at end of Stage C, not before.
- Korea 03: critic flagged a swapped 명동 label on the Gyeongbokgung map point → file its issue.
- S1–S5 research standards + dossier contract still await their first real research pass.
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.
- feedback-export Monday cron: if 2026-08-10's scheduled fire is also absent, investigate.
- `.card:has(.brow)` 3px `border-left` — incumbent, revisit only if card language reworked.
- **Panel, still deferred by design:** two tabs on one scope clobber each other's collapse state
  (accepted); story-mode's accent mixes ride a fixed dark ground with no contrast gate (residual
  risk).
- `.claude/launch.json`'s `astro-preview-alt` (:4323) — remove if it reads as debris; :4322 stays
  the canonical ship-loop surface.

## Where we left off

**This session:** executed `docs/PLAN_ATLAS_MIGRATION.md` Stage A end to end (all 11 items),
full ship loop green, this HANDOFF rewrite is Stage A's own housekeeping item (A11).

**Recommended next step:** Stage B — Atlas data layer (no visible UI change): airport
gazetteer, the reserved `traveler-origin` fact-row contract, tz backfill (korea/denmark), the
per-guide atlas record derivation, vendoring world TopoJSON, the search-index build step, and
the intake congruence line. Stages A+B were scoped to fit one session by the plan itself — if
context allows, continue straight into B rather than stopping.

**Re-prompt the creator with:** "Stage A of the Atlas migration is done — all eleven
guide-sheet items, full ship loop green. Two of them closed gaps a session in early August
deliberately deferred for 'needing a real architecture decision': the approx-value flag chip
and the not-confirmed gap block both now exist, wired, tested. The masthead also gained the
plate number it was missing a real source for — it has one now, chronological by trip start.
Next is Stage B, the invisible data-layer groundwork Stage C's hub needs before it can be
built aside the live site."
