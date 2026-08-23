# Waypoint repository map

This is the short ownership map for humans and coding agents. It exists to answer one question quickly: **where does a change belong, and what must it not accidentally replace?**

## System shape

Waypoint is a static Astro travel product with a research/verification backend and a small Worker for owner-only live actions.

```text
/new
  ↓
traveler intake
  ↓
research engine (V1 default / V2 behind selector)
  ↓
durable state + evidence + coverage + events
  ↓
compose + verification + landing gate
  ↓
draft review or authorized publication
  ↓
Astro build → GitHub Pages
```

The product has exactly two lifecycles:

- **Research** creates or re-researches a guide.
- **Change** modifies an existing guide without pretending every edit is a new research run.

## Top-level ownership

| Area | Owns | Do not confuse with |
| --- | --- | --- |
| `src/content/guides/` | Draft/published guide content rendered by Astro | Research run state |
| `guides-intake/` | Intake, run state, evidence, coverage, questions, and research artifacts | Traveler-facing final content |
| `src/features/` | Feature-owned product logic/UI with explicit public surfaces | Generic shared helpers |
| `src/lib/` | Shared deterministic helpers and cross-feature primitives | Feature-owned state/UI |
| `src/pages/` | Astro routes/screens and page composition | Feature business logic |
| `src/components/` | Shared rendered components | Feature model ownership |
| `src/scripts/` | Browser bootstraps and page glue | Pipeline/build automation |
| `scripts/` | Build, audit, verification, research, pipeline, and repo tooling | Browser runtime |
| `worker/` | Owner/live endpoints that need a backend | Static Pages runtime |
| `.github/workflows/` | CI, deploy, guide creation, research, change, recertification, and scheduled checks | Product business logic |
| `docs/reference/` | Current technical/operational truth | Completed plans or review history |
| `docs/design-handoff/` | Future Atlas design authority and enforcement | Current backend behavior |

## Product center

The intended field-use hierarchy is:

**Today · Itinerary · Map · Split · Guide**

The day-by-day itinerary is the organizing surface. New capabilities should attach to the trip/day context rather than becoming unrelated top-level systems unless there is a strong product reason.

Traveler-critical surfaces include:

- Today/day-to-day itinerary and plan/actual behavior
- maps, route/navigation links, and transit context
- reservation/access information
- Trip Split
- reminders/checklists and saved trip information
- SOS/emergency information
- useful exports such as GPX/ICS where applicable
- PWA/offline/poor-network behavior
- accessible, touch-friendly, sunlight-readable mobile behavior

## Feature silos that sound similar but are not duplicates

### `src/features/trip-split/`

Owns the actual shared-money system: deterministic split math, normalization, settlements, summary model, and calculator UI. One authoritative ledger per guide.

### `src/features/trip-tools/`

Owns the cross-trip Tools screen. It derives views/actions from existing systems such as Trip Split, closures, reminders, jet lag, and routing. It must not clone their underlying state machines.

### `src/features/trip-kit/`

Owns focused on-the-ground utilities such as arrival planning, booking timing, phrase/speak behavior, entry selection, and packing.

These folders share vocabulary, not ownership. Similar names are not evidence that they should be merged.

## Research pipeline generations

Two implementations intentionally coexist during cutover:

### V1

- `.github/workflows/research-pass.yml`
- `scripts/pipeline.mjs`
- associated V1 prompts/state paths

V1 remains the default and rollback path while `WAYPOINT_RESEARCH_ENGINE` is not set to `v2`.

### V2

- `.github/workflows/research-pass-v2.yml`
- `scripts/pipeline-v2.mjs`
- `scripts/pipeline/v2/`

V2 owns staged durable run state, mechanical Pass A/Pass B isolation, evidence/coverage contracts, events, bounded retry/recovery, and V2 landing authority.

V1 retirement is a cutover decision, not a cleanup inference.

## Pipeline V2 authority

If changing V2, read these before editing:

1. `docs/pipeline v2/DECISIONS.md` — locked decisions.
2. `docs/pipeline v2/IMPLEMENTATION_STATE.md` — current implementation/proof state.
3. `docs/pipeline v2/PIPELINE_VALIDATION_PACK.md` — remaining validation risk classes.
4. `docs/pipeline v2/SEPTEMBER_TRACKER.md` — delivery/cutover status.
5. `docs/reference/pipeline.md` — durable pipeline policy.

Do not create another parallel V2 status/plan document.

## Performance-sensitive dependencies

Heavy browser dependencies are intentional and should stay lazy/gated where possible:

- Firebase — live sync only
- `pdfjs-dist` — PDF ingestion only
- D3 modules / TopoJSON — Atlas/map visualization only
- GSAP — decorative motion only and skipped under reduced motion
- QRCode — share rendering only
- Sharp — build-time tooling, not a browser dependency

Use `npm run check:perf` after a production build when changing browser bundles.

## Verification hierarchy

- `npm run check:fast` — invariants + lint + typecheck + unit tests.
- `npm run check` — invariants + lint + typecheck + coverage + production build.
- `npm run check:offline` — service-worker/offline contract.
- `npm run ship:check` — `check` + offline contract + performance budget.

CI remains authoritative for merge/deploy status and includes accessibility checks.

## Consolidation rule

Only consolidate two implementations when all three are true:

1. they own the same product decision or durable state;
2. consumers can migrate to one public surface without semantic loss;
3. tests prove the survivor covers both behaviors.

Shared words, similar filenames, adjacent UI, or aesthetic preference are not sufficient evidence.
