# WayPoint Grand Visual Reference Pack

Status: **REFERENCE EVIDENCE — REQUIRED CONTINUITY INPUT, NOT DESIGN AUTHORITY**  
Authority: `docs/reference/design-system.md`  
Corrected: 2026-09-04

## Critical correction

The first `grand-reference.html` merged in PR #192 was a **schematic interaction study**. It was too visually simplified to represent the approved September mockups and must **not** be used as a standalone visual target.

The corrected rule is:

> **Named approved mockups provide visual ancestry. The constitution provides final law. The generated HTML only demonstrates how later D7 decisions evolve those mockups.**

Claude/Fable/Codex must not redraw WayPoint from the HTML study or average incompatible mockup generations.

## Read in this order for a whole-surface redesign

1. `PRODUCT.md`
2. `docs/reference/design-system.md`
3. `docs/reference/motion.md`
4. `docs/work-orders/waypoint-grand-redesign.md`
5. **`docs/mockups/CANONICAL_MOCKUP_LINEAGE.md`**
6. the named mockup(s) for the surface being implemented, when the mockup library is available
7. `docs/mockups/grand-reference.html` for the D7 evolution delta only
8. affected production code

## Canonical lineage summary

- **Atlas:** `Waypoint South Korea Atlas Showcase.png`
- **Global warm system / mobile:** `WayPoint Travel App UI Board(1).png`
- **Interaction/lifecycle/place detail:** `Waypoint Travel App Design Explorations.png`
- **Itinerary desktop:** `Seoul Trip Itinerary Workbench.png`
- **Guide:** `South Korea Travel Guide UI Mockup.png`
- **Search:** `WayPoint Seoul Search Experience.png`
- **SOS:** `WayPoint SOS Travel App Design.png`
- **Split:** `WayPoint Split Dashboard at Sunset.png` + Strategy Board
- **Trip content hierarchy:** Trip Cockpit boards, **not their purple styling/card-grid treatment**

See `CANONICAL_MOCKUP_LINEAGE.md` for exact preserve/change/reject rules.

## Corrected grand reference

`grand-reference.html` now exists to show the **evolution** of that lineage under final D7 decisions:
- adaptive floating desktop navigation;
- five-destination mobile navigation;
- Search/SOS as global tools;
- Split as contextual utility;
- expressive card/object reflow;
- fluid desktop detail panes;
- branching visual Guide intake;
- shared warm WayPoint visual DNA.

It is deliberately labelled with the mockup it evolves from. It must not be interpreted as higher-fidelity than the source mockup photography/composition.

Render local review captures with:

```bash
node docs/mockups/render-grand-reference.mjs
```

Expected captures:
- `atlas-desktop.png`
- `trip-desktop.png`
- `itinerary-desktop.png`
- `guide-desktop.png`
- `search-desktop.png`
- `builder-desktop.png`
- `split-desktop.png`
- `itinerary-mobile.png`
- `sos-mobile.png`

The PNGs are derived review artifacts and remain gitignored.

## Current Korea guide is the factual/asset source

For production migration, reuse current guide data and its real image/video references. Do not make up mock travel facts or swap in arbitrary stock content just to make a design screenshot look complete.

Examples already in the guide include Gyeonghoeru/Gyeongbokgung, Bukchon, N Seoul Tower, DDP, Cheonggyecheon, Insadong, and current post-trip Learnings.

## Acceptance

If a final production screenshot looks like a cleaner version of the old site but **does not visibly descend from the named approved mockup**, it fails visual continuity.

If it copies the old mockup literally while preserving a superseded sidebar/nav/palette rule, it also fails.

The target is **evolution, not reproduction and not reinvention**.
