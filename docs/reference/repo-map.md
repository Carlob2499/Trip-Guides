# Waypoint repository map

This is the short ownership map for humans and coding agents. It answers one question quickly: **where does a change belong, and what must it not accidentally replace?**

## System shape

Waypoint is a static Astro travel product with a research/verification backend and a small Worker for owner/live actions.

```text
/new
  ↓
traveler intake
  ↓
research engine (V2 selected / V1 rollback)
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
| `scripts/design/` | Surface screenshots + board-vs-build review tooling | Design authority or creator acceptance |
| `worker/` | Owner/live endpoints that need a backend | Static Pages runtime |
| `.github/workflows/` | CI, deploy, guide creation, research, change, recertification, and bounded/manual operational workflows | Product business logic |
| `docs/reference/` | Current technical/operational truth | Completed plans or review history |
| `docs/reference/design-system.md` | **Sole human-readable design authority** | Historical design material or shipped legacy behavior |
| `docs/reference/component-registry.json` | Machine-facing current component/feature inventory used by tests | A second design authority |
| `docs/reference/integrations.md` | Config-gated external services: where configuration lives, what each upgrades, and how it degrades | Secret values |
| `docs/mockups/` | Bound visual-reference evidence used by the design authority | A second design authority |

Historical/transition design documents and retired automation live in Git history/evidence, not as competing live authority.

## Product center

Do not restate the navigation hierarchy or visual composition here. Those are owned by `docs/reference/design-system.md`.

Traveler-critical capabilities include Trip lifecycle context, itinerary/Plan-vs-Actual, maps and navigation handoff, Guide/place reference, Search, Split, SOS/emergency information, Learnings, applicable exports, PWA/offline behavior, and accessible field use.

## Feature ownership

### `src/features/trip-split/`

Owns the shared-money system: deterministic split math, normalization, settlements, summary model, and calculator UI. One authoritative ledger per guide.

### `src/features/trip/`

Owns the trip lifecycle model: canonical days, phase (pre/active/post), Now/Next focus, readiness derivation, recap, and relevant trip utilities. It may derive from other owners but never clones their state machines.

### `src/features/itinerary/`

Owns itinerary interaction behavior such as day navigation and the desktop workbench divider. Presentation must conform to the sole design authority.

### `src/features/maps/`

Owns map embeds/provider behavior and map-destination interaction logic. It does not own travel facts or design authority.

### `src/features/search/`

Owns the global search index, deterministic ranking, deep links, and overlay behavior. Live location/runtime data may decorate or qualify results only through explicit owned contracts; it does not become a second recommendation source.

### Runtime integration layer

PR #210's provider-neutral runtime layer owns optional freshness/live overlays such as routes/matrix, reviewed Places state/hours, severe weather, AQI/UV, and ephemeral geolocation hooks. Runtime overlays may update current operational context; they do not rewrite authored itinerary truth or canonical researched facts, and core use must degrade honestly when providers/configuration are unavailable.

These folders share vocabulary, not ownership. Similar names are not evidence that they should be merged.

## Research pipeline generations

Two implementations intentionally coexist, with different current roles.

### V2 — selected product research engine

- `.github/workflows/research-pass-v2.yml`
- `scripts/pipeline-v2.mjs`
- `scripts/pipeline/v2/`

The owner has selected V2 through `WAYPOINT_RESEARCH_ENGINE=v2` on trusted `/new`. V2 owns staged durable run state, mechanical Pass A/Pass B isolation, evidence/coverage contracts, events, bounded retry/recovery, and V2 landing authority.

Selection is routing state, not a substitute for final release-readiness evidence. Fresh Kumamoto remains the final ratification test of the already-selected system.

### V1 — rollback / compatibility path

- `.github/workflows/research-pass.yml`
- `scripts/pipeline.mjs`
- associated V1 prompts/state paths

V1 remains available as rollback/compatibility. Retirement is a separate post-ratification decision, not a cleanup inference.

## Retired transition automation

The reciprocal Claude↔Codex reviewer and the hourly September completion watcher were temporary transition/release scaffolding and are intentionally absent from the live control plane. LEARN feedback synthesis remains available as an owner-triggered manual workflow but has no automatic schedule while Claude Pro usage is conserved for Kumamoto.

## Pipeline V2 authority

If changing V2, read these before editing:

1. `docs/pipeline v2/DECISIONS.md` — locked decisions.
2. `docs/pipeline v2/IMPLEMENTATION_STATE.md` — current implementation/proof state.
3. `docs/pipeline v2/PIPELINE_VALIDATION_PACK.md` — validation risk classes.
4. `docs/pipeline v2/SEPTEMBER_TRACKER.md` — delivery/release-readiness status.
5. `docs/reference/pipeline.md` — durable pipeline policy.

Do not create another parallel V2 status/plan document.

## Performance-sensitive dependencies

Heavy browser dependencies are intentional and should stay lazy/gated where possible:

- Firebase — live sync only
- `pdfjs-dist` — PDF ingestion only
- D3 modules / TopoJSON — Atlas/map visualization only
- GSAP — motion where the design authority permits it; skipped/reduced under reduced motion
- QRCode — share rendering only
- Sharp — build-time tooling, not a browser dependency

Use `npm run check:perf` after a production build when changing browser bundles. Performance-budget failure belongs before merge, not as a post-merge deployment surprise.

## Verification hierarchy

- `npm run check:fast` — invariants + lint + typecheck + unit tests.
- `npm run check` — invariants + lint + typecheck + coverage + production build.
- `npm run check:offline` — service-worker/offline contract.
- `npm run ship:check` — `check` + offline contract + performance budget.

CI on the exact prospective merge/head remains authoritative for merge/deploy status and includes accessibility/resilience requirements where relevant.

## Consolidation rule

Only consolidate two implementations when all three are true:

1. they own the same product decision or durable state;
2. consumers can migrate to one public surface without semantic loss;
3. tests prove the survivor covers both behaviors.

Shared words, similar filenames, adjacent UI, or aesthetic preference are not sufficient evidence.
