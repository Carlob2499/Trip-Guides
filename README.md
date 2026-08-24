# Waypoint (Trip-Guides)

Waypoint is a personal travel command center built as a static Astro site with a research/verification pipeline behind it. Structured trip content becomes fast, offline-friendly guide pages; the pipeline researches, verifies, composes, and gates content before publication.

## What ships

- Static Astro guides from `src/content/guides/`.
- Research lifecycle with durable intake/state/evidence.
- Field tools: itinerary, maps/transit, Trip Split, SOS, reminders, exports, offline use.
- Small Worker backend for owner/live controls that cannot safely live in static pages.
- GitHub Actions for verification and deployment.

Waypoint has two product lifecycles: **research** (create/research a guide) and **change** (modify an existing guide without rerunning the full research lifecycle).

Product doctrine lives in `PRODUCT.md`. Current operational/cutover truth lives in `docs/handoff.md`.

## Current product direction

Field use wins ties. The intended hierarchy is **Today · Itinerary · Map · Split · Guide**. The day/trip model is the center; maps, reservations, contingencies and Split should attach to it rather than becoming unrelated mini-products.

Trip Split, offline/poor-network behavior, accessibility, sunlight-readable mobile use and truthful uncertainty are protected requirements.

## Research engines

Two implementations intentionally coexist during validation:

- **V1** — `.github/workflows/research-pass.yml` + `scripts/pipeline.mjs`; production default/rollback.
- **V2** — `.github/workflows/research-pass-v2.yml` + `scripts/pipeline-v2.mjs` + `scripts/pipeline/v2/`; staged candidate.

`WAYPOINT_RESEARCH_ENGINE=v2` is the explicit selector. Until cutover is deliberately accepted, V1 stays available and V2 validation is not permission to retire it.

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
| `docs/reference/` | Current architecture/behavior |
| `docs/design-handoff/` | Atlas visual authority/reference |

Use `docs/reference/repo-map.md` only when ownership is unclear.

## Read by task, not by syllabus

Agent root instructions (`AGENTS.md` / `CLAUDE.md`) route work to the smallest useful authority.

- **Product decision:** `PRODUCT.md`.
- **Current operational state / next integration step:** `docs/handoff.md`.
- **Pipeline V2 / validation / cutover:** the relevant file under `docs/pipeline v2/`; start with `docs/handoff.md`.
- **Code ownership uncertainty:** `docs/reference/repo-map.md`, then the affected subsystem reference.
- **Visual/UI work:** `waypoint-design` + affected code; load only the relevant design reference. Full `/design` work may load the broader handoff/prototypes.
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
