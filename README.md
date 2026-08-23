# Waypoint (Trip-Guides)

Waypoint is a personal travel command center built as a static Astro site with a research and verification pipeline behind it. Structured trip content becomes fast, offline-friendly guide pages; the pipeline researches, verifies, composes, and gates that content before it can publish.

## What Waypoint is today

- **Static Astro travel guides** generated from structured files in `src/content/guides/`.
- **A research backend** that turns an intake into a verified draft guide, with durable state and evidence.
- **Field-use tools** for itinerary execution, maps/transit, Trip Split, SOS, reminders, exports, and offline use.
- **A small Worker backend** for owner-only/live controls that cannot be done safely in a static page alone.
- **GitHub Actions CI/deploy** with lint, typecheck, coverage, build, accessibility, project-invariant, offline, and performance checks.

Waypoint has exactly **two product lifecycles**:

1. **Research lifecycle** — create or research a trip guide.
2. **Change lifecycle** — modify an existing guide without re-running the entire research lifecycle.

## Product direction

Waypoint is becoming a single trip command center rather than a collection of unrelated guide tabs. The intended field-use hierarchy is:

**Today · Itinerary · Map · Split · Guide**

The day-by-day itinerary is the center of the product. Maps, reservations, navigation, saved information, contingencies, and Trip Split should attach to the day/trip model instead of becoming separate mini-products.

Trip Split is a first-class protected feature. Offline/poor-network usefulness, accessibility, sunlight-readable mobile use, and truthful uncertainty are core product requirements.

See `PRODUCT.md` for product doctrine and `docs/design-handoff/DESIGN.md` for the future Atlas design authority.

## How a new guide is created

```text
/new
  ↓
traveler intake (frozen requirements)
  ↓
draft scaffold
  ↓
research engine
  ↓
durable state + evidence + coverage + events
  ↓
compose + verification + landing gate
  ↓
draft review or authorized publication
  ↓
Astro build → GitHub Pages
```

Two research implementations intentionally coexist during cutover:

- **V1** — `.github/workflows/research-pass.yml` + `scripts/pipeline.mjs`. This remains the default/rollback path.
- **V2** — `.github/workflows/research-pass-v2.yml` + `scripts/pipeline-v2.mjs` + `scripts/pipeline/v2/`. This is the next-generation staged research path.

`WAYPOINT_RESEARCH_ENGINE=v2` is the explicit selector. Until cutover is deliberately accepted, V1 remains available and V2 must not be treated as permission to delete the rollback path.

Current delivery/cutover status lives in `docs/handoff.md` and `docs/pipeline v2/SEPTEMBER_TRACKER.md`.

## Where things live

| Path | Responsibility |
| --- | --- |
| `src/content/guides/` | Guide content rendered by Astro |
| `guides-intake/` | Intake, run state, evidence, coverage, and research artifacts |
| `src/features/` | Product feature ownership |
| `src/lib/` | Shared deterministic helpers |
| `src/pages/` | Astro routes/screens |
| `scripts/` | Build, verification, research, audit, and pipeline tooling |
| `worker/` | Owner/live backend endpoints |
| `.github/workflows/` | CI, deploy, guide creation, research, recertification, and scheduled checks |
| `docs/reference/` | How the system works now |
| `docs/design-handoff/` | Future Atlas design authority and enforcement |

For a deeper ownership map, read `docs/reference/repo-map.md`.

## Read this repo in this order

For normal engineering work:

1. `README.md` — orientation.
2. `PRODUCT.md` — product rules and non-negotiables.
3. `docs/handoff.md` — current operational state and next work.
4. `docs/reference/repo-map.md` — code ownership and boundaries.
5. The relevant file in `docs/reference/` for the subsystem you are changing.
6. `AGENTS.md` or `CLAUDE.md` when an agent is doing the work.

If you are changing Pipeline V2, also read `docs/pipeline v2/DECISIONS.md`, `IMPLEMENTATION_STATE.md`, and `SEPTEMBER_TRACKER.md`.

Historical plans and completed review transcripts belong in Git history, not in the active reading path.

## Verification

Node.js 22+ is required.

```bash
npm install
npm run dev          # local development
npm run check:fast   # invariants + lint + typecheck + unit tests
npm run check        # invariants + lint + typecheck + coverage + production build
npm run check:offline
npm run ship:check   # full check + offline contract + performance budget
```

CI is authoritative for merge/deploy status. Do not weaken a failing gate merely to make a branch green.

## Guide content

A guide lives under `src/content/guides/<slug>/`. `_guide.json` owns trip identity and metadata; numbered JSON files hold guide sections. `src/content.config.ts` is the schema authority.

Malformed content fails the build with the offending file/field instead of silently shipping. Draft content stays quarantined until its publication conditions are satisfied.

## Deployment

The site is built and deployed through GitHub Actions to GitHub Pages. A failed build leaves the previous working site live. Service-worker precaching and cached navigation provide offline/poor-network resilience for built guide content.
