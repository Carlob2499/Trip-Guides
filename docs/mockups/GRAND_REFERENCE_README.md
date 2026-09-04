# Waypoint Grand Visual Reference Pack

Status: **REFERENCE EVIDENCE — NOT DESIGN AUTHORITY**  
Authority: `docs/reference/design-system.md`  
Created: 2026-09-04

This folder helps Claude/Codex preserve continuity while implementing the D7 grand redesign.

## Read first

1. `docs/reference/design-system.md`
2. `docs/reference/motion.md`
3. `docs/work-orders/waypoint-grand-redesign.md`
4. this file
5. `docs/mockups/grand-reference.html`

The constitution wins whenever any image/mockup/example conflicts.

---

## September South Korea mockup continuity

The uploaded mockup library contains many generations. Do not average them together.

### Canonical continuity cues

#### WayPoint Travel App UI Board / WayPoint Travel App UI Board(1)
Preserve:
- warm cream/sage/rust direction;
- serif/sans contrast;
- Atlas / Trip / day itinerary / Map / Guide relationship;
- mobile day chronology;
- Korean destination photography;
- clear bottom-nav ergonomics.

Superseded:
- any purple-era accent;
- any six-item cramped persistent mobile bar;
- generic equal-card dashboard composition.

#### WayPoint Seoul Itinerary Mockup / Seoul Trip Itinerary Workbench
Preserve strongly:
- desktop temporal-spatial workbench;
- timeline + large map;
- rust route/markers;
- day header with cartographic texture;
- operational scanability;
- chronological mobile sibling.

Elevate:
- make panels fluid/resizable;
- add shared-object transitions;
- use Google Maps Platform;
- let card stacks unfold/reflow smoothly.

#### South Korea Travel Guide UI Mockup
Preserve strongly:
- destination hero imagery;
- large editorial type;
- Guide topic exploration;
- recently viewed / context relationships;
- cream/sage/rust editorial warmth.

Elevate:
- stronger destination identity;
- more expressive card scrolling;
- adaptive topic drawers;
- richer desktop composition.

#### WayPoint Seoul Search Experience / WayPoint Travel Search Mockup
Preserve strongly:
- context-aware global Search;
- category drawers/pills;
- place/itinerary/Guide/notes/transit/food distinctions;
- desktop result + detail relationship;
- mobile overlay.

Superseded:
- Search as a primary navigation destination;
- command-palette/developer framing as the main mental model.

#### WayPoint SOS Travel App Design
Preserve strongly:
- SOS as always-available tool;
- three-layer focused sheet;
- category → detail/location → connect/confirm;
- offline essential numbers;
- conservative, high-clarity visual treatment.

#### WayPoint Split dashboards
Preserve:
- operational clarity;
- visible balances;
- expense list density;
- settlement confidence;
- group decision readability.

Change:
- Split becomes contextual rather than permanent primary navigation.

#### Trip Cockpit boards
Preserve:
- active-trip state;
- next-up;
- today map/timeline relationship;
- readiness/essentials when relevant.

Superseded:
- equal-weight dashboard card soup;
- flat permanent desktop sidebar;
- purple-era styling.

---

## New grand reference

`grand-reference.html` is a deterministic visual study for:
- Atlas / globe / arrival;
- active Trip hierarchy;
- desktop Itinerary + Map;
- mobile day-by-day;
- Guide;
- contextual Search;
- new Guide visual intake;
- card geometry and motion intent.

It is intentionally not production code.
Do not copy its DOM/CSS architecture blindly.
Use it to understand composition, hierarchy, spacing, object relationships, and destination tone.

Run:

```bash
node docs/mockups/render-grand-reference.mjs
```

The render script writes local PNGs to `docs/mockups/.generated/` for visual inspection.
That directory is gitignored because rendered screenshots are derived/heavy.

Recommended output set:
- `atlas-desktop.png`
- `trip-desktop.png`
- `itinerary-desktop.png`
- `guide-desktop.png`
- `search-desktop.png`
- `builder-desktop.png`
- `itinerary-mobile.png`

---

## Cohesion test

A reviewer should be able to place screenshots from all major Waypoint surfaces side-by-side and
recognize one system through:

- typography;
- cream/sage/rust/charcoal palette;
- digital-cartography materiality;
- icon/pictogram hand;
- related card geometry;
- adaptive density;
- destination identity;
- contextual controls;
- object continuity;
- maps;
- motion.

If a screen looks like a different app, the redesign is not complete.
