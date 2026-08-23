# Waypoint repository map

This is the short orientation layer for humans and coding agents. It explains which directories own which responsibilities so cleanup work does not create a second source of truth by accident.

## Product shape

Waypoint is a static Astro travel-guide product with a research pipeline behind it. The website is generated from structured guide content, but the pipeline is the real backend: it researches, verifies, composes, tracks state, and only then allows a guide to land.

```text
/new
  ↓
intake + frozen traveler requirements
  ↓
research engine (V1 default / V2 behind selector)
  ↓
durable run state + evidence + coverage + events
  ↓
verification + composition + landing gate
  ↓
draft PR or production publication authority
  ↓
Astro build → GitHub Pages
```

## Top-level ownership

| Area | Owns | Do not confuse with |
|---|---|---|
| `src/content/guides/` | Published/draft guide content consumed by Astro | Pipeline state or agent scratch output |
| `guides-intake/` | Durable per-run intake/state/evidence artifacts | Final site content |
| `src/features/` | Product feature silos with explicit public surfaces | Shared generic libraries in `src/lib/` |
| `src/lib/` | Shared deterministic helpers and cross-feature primitives | Feature-owned UI/state |
| `src/pages/` | Astro routes/screens | Feature business logic |
| `src/components/` | Shared rendered components | Feature model ownership |
| `src/scripts/` | Browser-side bootstraps/glue | Pipeline/build tooling in root `scripts/` |
| `scripts/` | Build, verification, research, pipeline, audit, and repo automation | Browser runtime |
| `worker/` | Cloud worker endpoints used by live/owner controls | Static Pages runtime |
| `.github/workflows/` | CI, deploy, guide creation, research, review automation | Product business logic |
| `docs/reference/` | Current operational/reference truth | Archived plans/history |
| `docs/archive/` | Historical decisions/plans retained for archaeology | Current instructions |
| `docs/design-handoff/` | Authority for the future Atlas redesign | Current backend-cleanup scope |

## Feature silos that sound similar but are not duplicates

### `src/features/trip-split/`

Owns the actual group-money system: deterministic split math, settlement, normalization, summary model, and the calculator UI. It is one shared ledger per guide.

### `src/features/trip-tools/`

Owns the standalone cross-trip Tools screen. It derives a view over several existing systems (Trip Split, jetlag, closures, reminders, route ordering) rather than reimplementing them.

### `src/features/trip-kit/`

Owns focused on-the-ground utilities such as arrival planning, book-by timing, phrase/speak behavior, entry selection, and packing. It is not the same thing as the cross-trip Tools screen.

Treating these three folders as interchangeable because their names all contain “trip” would be a cleanup bug, not simplification.

## Research pipeline generations

Two implementations intentionally coexist during cutover:

- **V1:** `.github/workflows/research-pass.yml` + `scripts/pipeline.mjs` and associated V1 paths. It remains the default/rollback path while `WAYPOINT_RESEARCH_ENGINE` is not set to `v2`.
- **V2:** `.github/workflows/research-pass-v2.yml` + `scripts/pipeline-v2.mjs` + `scripts/pipeline/v2/`. It owns durable staged state, evidence, coverage, telemetry/events, bounded retries, recovery, and landing authority.

Do not delete V1 merely because V2 exists. Retirement is a product cutover decision, not a cleanup inference.

## Claude ↔ Codex review automation

The reciprocal-review system is a control plane, not product code.

- `.github/workflows/claude-codex-signal.yml` is an unprivileged doorbell.
- `.github/workflows/claude-codex-watcher.yml` separates **read-only validation** from **write-capable publication** at the job boundary.
- `scripts/codex-watcher.mjs` is the behavioral source of truth for work-order parsing/eligibility/idempotency.
- `prompts/codex-work-order.md` is the trusted prompt template.

The job-level permission boundary is security-critical and was restored by PR #79 after PR #78's history/body diverged from what actually reached `main`.

## Traveler-critical surfaces

Cleanup must preserve these even when they look like UI glue:

- day-to-day itinerary and plan/actual behavior
- maps and transit deep links
- arrival/autopilot tools
- entry/phrase/packing utilities
- Trip Split
- reminders/checklists
- SOS/emergency information
- exports (for example GPX/ICS where applicable)
- PWA/offline service worker and honest network fallbacks
- accessibility/touch/sunlight behavior

## Performance-sensitive dependencies

These packages are valuable but relatively heavy, so new imports should stay gated/lazy when possible:

- Firebase
- `pdfjs-dist`
- D3 modules / TopoJSON
- GSAP
- Sharp is build-time tooling, not a browser dependency

Use `scripts/check-perf-budget.mjs` after a production build to catch accidental bundle growth.

## Verification hierarchy

For ordinary engineering changes, the canonical local commands are:

- `npm run check:fast` — invariants + lint + typecheck + tests
- `npm run check` — invariants + production build + lint + typecheck + tests
- `npm run ship:check` — `check` plus the performance budget

CI still keeps its stricter coverage gate; these commands do not replace coverage in `.github/workflows/test.yml` or deployment verification on `main`.

## Rule for consolidation

Only consolidate two implementations when all three are true:

1. they own the same product decision or state;
2. consumers can be migrated to one public surface without semantic loss;
3. tests prove the survivor covers both behaviors.

Shared words, similar filenames, or adjacent UI are not sufficient evidence.
