# Waypoint D7 Visual Lineage — Mockup Fidelity Contract

Status: **MANDATORY VISUAL REFERENCE FOR D7**  
Design authority: `docs/reference/design-system.md`  
Implementation authority: `docs/work-orders/waypoint-grand-redesign.md`  
Locked: 2026-09-04

## Why this file exists

The September mockup library is not merely a bag of inspiration. It is the **visual ancestry of the
approved Waypoint redesign**.

A previous D7 reference pass made a critical mistake: it translated the written constitution into
new schematic CSS compositions. The hierarchy was directionally correct, but the result lost the
visual sophistication already present in the approved mockups — real destination imagery, rich
navy/forest and ivory layering, photographic structure, map/globe depth, dense-but-deliberate
information design, device-specific composition, and premium editorial/spatial relationships.

**Do not repeat that mistake.**

> Start from the strongest approved mockups. Preserve their visual grammar. Apply only the later
> product/UX decisions that the constitution explicitly changed.

The desired result must look like **the same Waypoint design matured**, not a new redesign invented
from prose.

---

## Authority rule

Use these layers in this order:

1. `PRODUCT.md` — factual/product truth and field priorities.
2. `docs/reference/design-system.md` — final decisions that may explicitly change a mockup behavior.
3. **This visual-lineage contract + the September mockup library** — composition, imagery,
   typography character, density, spatial relationships, material depth, responsive character,
   and destination mood.
4. `docs/reference/motion.md` — transition/choreography implementation.
5. production tokens/components/gates.

The constitution overrides a mockup **only where there is an actual conflict**. It is not license to
redraw the visual language from scratch.

### Examples

- Mockup has a permanent flat sidebar, constitution says adaptive floating nav → **change the nav,
  preserve the surrounding visual composition and richness**.
- Mockup has six equal mobile destinations, constitution says five core destinations + contextual
  Split/Search/SOS → **change the destination architecture, preserve the mobile visual grammar**.
- Mockup has purple-era accent, constitution says cream/sage/rust/charcoal → **change the color,
  preserve the composition**.
- Mockup has strong photography, layered map, purposeful overlap, destination mood → **preserve it**.
  Do not replace it with gradients, abstract placeholders, or simplified boxes merely because the
  contract describes the concept in words.

---

## Non-negotiable fidelity test

For every flagship surface, place the implementation screenshot beside the relevant approved
mockup(s).

The implementation should read immediately as:

> **same design family, matured under the final UX decisions**

It fails if it reads as:

> **a different app that happens to use similar colors and fonts**

Preserve, unless an explicit later decision conflicts:

- photographic hierarchy and crop logic;
- globe/map as a major visual anchor where the mockup uses one;
- rich dark navy/forest spatial surfaces paired with warm ivory/editorial surfaces;
- rust/orange selection and action emphasis;
- subtle contour/cartographic texture;
- Literata-like editorial hierarchy + Atkinson-like operational clarity;
- deliberate asymmetry and overlapping/floating relationships;
- dense desktop information composition without card soup;
- device-specific mobile composition;
- premium border, shadow, translucency, image, and map depth;
- strong destination identity;
- maps and cards that feel spatially connected rather than separate widgets.

Do **not** substitute:

- abstract CSS gradients for destination imagery when the mockup uses imagery;
- schematic map art for the production Google Maps experience;
- generic SaaS cards for the mockup's composed objects;
- large dead zones for the mockup's useful density;
- new brand marks/taglines that are not part of Waypoint;
- generic AI-travel aesthetics;
- a newly invented aesthetic justified only by the written constitution.

---

## Primary lineage references from `Waypoint_Mockup_Library_for_Codex(1).zip`

The library contains 81 boards and a manifest/contact sheet. Use the full library when available,
but these are high-value anchors for the final system.

### Atlas / globe / destination discovery

**Primary**
- `072__waypoint_south_korea_travel_atlas_dashboard.webp`
  - warm ivory + contour ground;
  - photographic globe as hero;
  - destination pins with restrained semantic color;
  - South Korea photo card;
  - quiet search and floating utility controls;
  - destination panel and supporting quick actions;
  - excellent typography scale.
- `074__waypoint_south_korea_travel_guide.webp`
  - mobile globe/Atlas composition;
  - oversized geographic visual before utility;
  - active-trip card + pinned destinations;
  - restrained mobile chrome.
- `076__waypoint_travel_app_design_board.webp`
  - pinned-area mobile behavior;
  - expandable tray and globe/table relationships;
  - device-frame presentation of the same system.
- `060__waypoint_atlas_travel_ui_presentation.webp`
  - broader Atlas brand/material lineage;
  - globe/table duality;
  - contour detail and destination cards.

**Apply later decisions**
- Atlas default only when no trip is active;
- adaptive floating desktop navigation instead of permanent flat rail;
- five core mobile destinations;
- Split contextual;
- Search global/contextual;
- destination-specific theming stronger than the oldest generic Atlas boards.

### Map / spatial workspace / place detail

**Primary**
- `064__waypoint_korea_trip_map_showcase.webp`
- `073__waypoint_south_korea_travel_dashboard.webp`
- `075__waypoint_south_korea_travel_map.webp`
- `078__waypoint_travel_map_ui_showcase.webp`

Preserve strongly:
- dark spatial/map register;
- orange route/pin emphasis;
- place cards/panes attached visually to selected geography;
- desktop vs mobile sibling behavior;
- spatial lenses and map-first clarity;
- rich but legible map atmosphere.

Apply later decisions:
- Google Maps Platform underneath;
- fluid/resizable panes rather than one permanently fixed detail column;
- shared-object transitions;
- single focus by default, pin up to two for comparison;
- current Trip/day/area orientation remains quiet.

### Guide / editorial place knowledge

**Primary**
- `065__waypoint_mockup_guide.webp` for scan-first place facts and Get Me There hierarchy;
- `056__guide-curated-reference.webp` and later South Korea Guide boards for layered editorial
  hierarchy;
- broad UI boards in the 070–081 range for destination photography, responsive treatment, and
  stronger final visual language.

Preserve:
- editorial serif hierarchy;
- large useful imagery;
- warm paper/sage operational facts;
- strong place identity;
- factual clarity first, detail/provenance one level deeper.

Apply later decisions:
- category drawers;
- expressive horizontal/card journeys on desktop;
- destination-specific visual theme;
- AI remains invisible.

### Search

**Primary**
- `067__waypoint_mockup_search.webp`
- Search states within the broad South Korea UI boards.

Preserve:
- traveler-facing search;
- categories;
- result + contextual detail relationship;
- map/place/Guide/itinerary distinctions.

Apply later decisions:
- Search is global/context-aware, not a permanent destination tab;
- results understand current Trip/day/location/Guide/map context;
- no chatbot-first presentation.

### SOS

**Primary**
- `068__waypoint_mockup_sos.webp`

Preserve strongly:
- conservative, high-clarity emergency sheet;
- strong typographic hierarchy;
- offline numbers;
- layered progression;
- minimal decorative motion.

### Split

**Primary**
- `069__waypoint_mockup_split.webp`

Preserve:
- balance prominence;
- expense density;
- settlement clarity;
- group readability.

Apply later decision:
- Split is contextual, not a permanent primary destination.

### Navigation / responsive architecture

Reference:
- `063__waypoint_hybrid_navigation_blueprint.webp`
- `070__waypoint_navigation_alternatives_board.webp`
- `071__waypoint_s_stable_five_destination_architecture.webp`
- `077__waypoint_travel_app_design_system.webp`

Use these to preserve continuity while applying the final navigation contract.

---

## New features decided after the library

When a final feature does not yet have a direct approved mockup — for example the adaptive New Guide
question deck, fluid pin-to-compare state, or final shared-object card choreography — **extend the
existing visual grammar** instead of inventing a new one.

The extension must inherit:
- existing typography scale;
- destination imagery treatment;
- map/contour materiality;
- card/panel geometry family;
- cream/sage/rust/charcoal system;
- premium photographic/spatial depth;
- desktop density;
- mobile restraint.

New feature mockups are acceptable only when they look as if they could have been another board in
the supplied mockup library.

---

## Generated-reference warning

The first `docs/mockups/grand-reference.html` pass created on 2026-09-04 is **RETIRED** as a visual
reference because it was too schematic and visually drifted from the approved mockup lineage.

It must not be used as a visual target, baseline, or source of aesthetic decisions.

Its Git history may remain as evidence of the rejected approach.

---

## D7 acceptance addition

D7 is not complete until:

1. every flagship surface passes the side-by-side lineage test;
2. final screenshot baselines look recognizably descended from the approved mockup library;
3. explicit later UX/product changes are implemented without erasing the visual ancestry;
4. no schematic placeholder treatment has accidentally become production design;
5. mobile and desktop both preserve the same design family while remaining true sibling
   compositions.
