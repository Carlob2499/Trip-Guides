# Waypoint (Trip-Guides)

Waypoint is a personal travel command center built as a static Astro site with a research/verification pipeline behind it. Structured trip content becomes fast, offline-friendly guide pages; the pipeline researches, verifies, composes, and gates content before publication.

## What ships

- Static Astro guides from `src/content/guides/`.
- Research lifecycle with durable intake/state/evidence.
- Field tools: Trip, itinerary, maps/transit, Guide, Search, Split, SOS, Learnings, reminders, exports and offline use.
- Small Worker backend for owner/live controls that cannot safely live in static pages.
- GitHub Actions for verification and deployment.

Waypoint has two product lifecycles: **research** (create/research a guide) and **change** (modify an existing guide without rerunning the full research lifecycle).

Product doctrine lives in `PRODUCT.md`. Current operational/release-readiness truth lives in `docs/handoff.md`; agents receive its bounded current-state capsule automatically at SessionStart.

## Current product direction

Field use wins ties. The stable traveler architecture is **Trip · Itinerary · Map · Guide · Split**, with Atlas as world/trip entry and Search/SOS as global utilities. The trip/day model is the center; maps, reservations, contingencies and Split attach to canonical travel objects rather than becoming unrelated mini-products.

Trip Split, offline/poor-network behavior, accessibility, sunlight-readable mobile use and truthful uncertainty are protected requirements.

## Research engines — current state

Two implementations intentionally coexist, but their roles are no longer symmetric:

- **V2** — `.github/workflows/research-pass-v2.yml` + `scripts/pipeline-v2.mjs` + `scripts/pipeline/v2/`; **selected product research engine** for trusted `/new` because the owner has set `WAYPOINT_RESEARCH_ENGINE=v2`.
- **V1** — `.github/workflows/research-pass.yml` + `scripts/pipeline.mjs`; retained as the **rollback/compatibility path** until a separate retirement decision after final V2 release-readiness ratification.

The selector chooses the production research path; it is not evidence that release-readiness testing passed. Historical Fukuoka remains failed evidence, historical Kumamoto r1/r2/r3 remain stale evidence, and the next Kumamoto must be rebuilt from settled current `main` for final release-readiness ratification. Manual V2 dispatch remains PR/draft authority only.

## September 2026 closure

The D7 ten-surface transplant is on `main`; creator-directed fidelity corrections and final visual acceptance are still in progress. Do not start another redesign.

Issue #187 is the single September critical path. Current closure order is:

1. continuity/current-state reconciliation and retirement of obsolete transition automation;
2. creator-directed D7 fidelity fixes + creator visual acceptance;
3. deterministic product-completeness/runtime/release hardening;
4. final protected-main governance (#130);
5. one fresh exact-head Kumamoto release-readiness ratification;
6. adversarial field/device verification and final freeze.

Feature freeze: **September 20**. Code freeze: **September 27**. Engineering-complete target: **September 30**.

## Model-usage boundary

Claude usage is intentionally conserved for Kumamoto. The reciprocal Claude↔Codex PR reviewer and the stale hourly September completion watcher are retired. The LEARN feedback synthesis workflow remains available but is manual-only; it must not consume Claude on a schedule.

## Ownership map

| Path | Responsibility |
| --- | --- |
| `src/content/guides/` | Rendered guide data |
| `guides-intake/` | Intake, run state, evidence, coverage |
| `src/features/` | Product feature ownership |
| `src/lib/` | Shared deterministic helpers |
| `src/pages/` | Astro routes/screens |
| `scripts/` | Build, verification, audit and pipeline tooling |
| `worker/` | Owner/live backend endpoints |
| `.github/workflows/` | CI, deploy and lifecycle orchestration |
| `docs/reference/` | Current architecture/behavior; `design-system.md` is sole human-readable design authority |

Use `docs/reference/repo-map.md` only when ownership is unclear.

## Read by task, not by syllabus

Agent root instructions (`AGENTS.md` / `CLAUDE.md`) route work to the smallest useful authority.

- **Product decision:** `PRODUCT.md`.
- **Current operational state / next integration step:** SessionStart capsule from `scripts/handoff-head.mjs`; open full `docs/handoff.md` only for deeper current evidence.
- **Pipeline V2 / validation / release-readiness:** current capsule, then only the relevant file under `docs/pipeline v2/`.
- **Code ownership uncertainty:** `docs/reference/repo-map.md`, then the affected subsystem reference.
- **Visual/UI work:** `docs/reference/design-system.md` first, then affected code/gates.
- **Guide facts/research:** `waypoint-guide-author`.
- **Historical rationale:** `CONTEXT.md` only when current code/docs do not answer it.

Do not preload all of these for ordinary engineering work.

## Verification

Node.js 22+.

```bash
npm install
npm run dev
npm run check:fast
npm run check
npm run check:offline
npm run ship:check
```

Use focused checks while iterating; CI on the exact PR head is authoritative for merge/deploy status. Do not weaken a gate merely to make a branch green.

## Guide content and deployment

A guide lives under `src/content/guides/<slug>/`; `_guide.json` owns trip identity/metadata and numbered JSON files hold sections. `src/content.config.ts` is the schema authority. Malformed content fails the build; draft content stays quarantined until publication conditions are satisfied.

GitHub Actions builds/deploys to GitHub Pages. A failed build leaves the previous working site live; service-worker precaching/cached navigation provide offline resilience for built guide content.
