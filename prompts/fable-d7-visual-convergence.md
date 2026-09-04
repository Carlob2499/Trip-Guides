# Fable 5.1 work order — D7 visual convergence V1

Repository: `Carlob2499/Trip-Guides`  
Working branch / PR: `claude/waypoint-design-routing-rex0vr` / PR #186  
Role: **creation + production integration**, not product redesign or repo-governance cleanup.

This is an execution work order only. It is **not design authority**.

## Read first

1. `docs/reference/design-system.md` — sole design authority.
2. `docs/reference/design-system-assets/mockup-manifest.json`.
3. Only the visual files listed by that manifest.
4. The production components/styles for the two V1 surfaces.

Do not consult superseded design handoffs, old gallery screenshots, historical prototypes, deleted branches, or PR-era design prose as visual authority.

## Preserve

Do not rewrite or replace the working D7 engineering unless a concrete bug blocks the approved presentation:

- five-destination router and canonical destination state;
- Trip lifecycle/data derivation;
- Itinerary day state and resizable workbench behavior;
- Google/OSM map fallback architecture;
- global Search/SOS;
- Split engine/state;
- semantic content relations;
- offline/accessibility/resilience infrastructure;
- retired-feature removals.

Do not change Pipeline V1/V2, September release governance, research content, factual trip data, source/provenance data, or unrelated tests/workflows.

## V0 — preflight

Before editing, inspect the two target surfaces against the sole authority and manifest. Report only genuine implementation blockers involving truth, accessibility, or technical feasibility. Do **not** reopen recorded creator decisions or propose alternative design directions.

## V1 — implement only these two surfaces

### 1. South Korea active Trip — mobile

Target review state:

- 390 × 844 viewport;
- dark theme;
- trip-local time fixed by the canary to `2026-07-10T11:20:00+09:00`;
- use the actual South Korea guide content and repository-owned/approved media;
- composition must follow the active-Trip authority: **Now → Next → Leave by → Get there → material warning/problem → fallback → remainder of day**;
- one dominant operational object, strong useful imagery, large structured atoms, aggressive phone-space discipline;
- no dossier/prose-wall composition, generic dashboard grid, fake actions, or `Add to plan` for already-planned/completed objects.

### 2. South Korea Itinerary — desktop workbench

Target review state:

- 1440 × 1000 viewport;
- dark theme;
- actual South Korea itinerary data;
- timeline/day plan left, real operational map right;
- preserve the working resizable 30–70% pane behavior and synchronized selection;
- make temporal ↔ spatial continuity visually obvious;
- integrated/floating Waypoint shell, not conventional admin chrome/sidebar;
- no decorative/faux map and no document-dashboard composition.

## Visual rules

Treat the authority/manifest visual signals as binding for hierarchy, relative scale, density, panel relationships, imagery prominence, navigation character, typography wrapping, and responsive composition.

Exact sample text, route geometry, mockup prices/times, and decorative micro-detail are not facts. Use canonical repository content.

Do not invent a new Waypoint aesthetic. Do not average the approved references with the current D7 gallery rendering.

## Verification before handoff

Run the ordinary deterministic checks needed for touched code. The branch already provides:

```sh
npm run canary:visual
```

and `.github/workflows/design-canary.yml` automatically captures the two creator-review screenshots on relevant PR changes.

The canary screenshots are **review evidence, not baselines**. Do not call `baselines:update`, regenerate gallery baselines, or modify expected screenshots to make visual CI green.

Known mechanical regressions already handled outside this work order and pinned by tests:

- Korean/Hangul system font fallback;
- Guide headings may not break inside ordinary words;
- creator canary remains separate from regression baselines.

## Stop point

After both V1 surfaces are implemented and the automatic canary artifacts exist, **stop the visual sweep** and report:

- commit range;
- files changed;
- any genuine blocker/deviation from authority;
- the Design canary workflow run/artifact.

Do not continue to Atlas, Guide, Map destination, Split, Search, SOS, or the rest of Trip/Itinerary until creator review accepts the V1 direction. This stop point is intentional and protects model usage.
