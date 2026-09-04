# D7 Work Order — Waypoint Grand Redesign

Status: **AUTHORIZED / EXECUTE TO COMPLETION**  
Owner: Carlo  
Created: 2026-09-04  
Authority: `PRODUCT.md` + `docs/reference/design-system.md` + `docs/reference/motion.md`

This is an **implementation work order**, not a second design authority.

The user has completed D6 design reconciliation. Do not restart preference discovery, resurrect
older design debates, or average incompatible mockup generations.

## Mission

Implement the Waypoint grand redesign across the entire site so the production experience is one
cohesive product.

This is not a partial skin.
This is not a prototype-only pass.
This is not “keep the old system and add new components beside it.”

> **The old conflicting visual system is to be retired as the new system lands.**

The target is the constitution as of 2026-09-04.

---

## Mandatory reads before editing

Read, in order:

1. `PRODUCT.md`
2. `docs/reference/design-system.md`
3. `docs/reference/motion.md`
4. `docs/reference/component-registry.json`
5. `.claude/skills/waypoint-design/SKILL.md`
6. `docs/mockups/GRAND_REFERENCE_README.md`
7. **`docs/mockups/CANONICAL_MOCKUP_LINEAGE.md`**
8. the named source mockup(s) for the surface, when the mockup library is available
9. `docs/mockups/grand-reference.html` **for D7 evolution deltas only — never as a standalone visual target**
10. affected source/components/styles
11. `docs/reference/repo-map.md` only when ownership is unclear
12. `docs/research/waypoint-design-reference-packet.md` only when external benchmark evidence is
    needed for a concrete unresolved implementation choice

Do **not** load historical design handoffs by default.

---

## Non-negotiable constraints

- Preserve factual travel content verbatim. Presentation work does not research or rewrite facts.
- Google Maps Platform is the live map foundation.
- Literata Variable + Atkinson Hyperlegible Next remain the global type families.
- New palette: warm paper/cream + sage/olive + warm charcoal + restrained oxide/rust.
- AI is mostly invisible.
- Search is context-aware with category drawers.
- SOS is a layered emergency tool, not a destination.
- Split is contextual, not a persistent primary destination.
- Atlas is default when no trip is active; Trip is default during active travel.
- Desktop uses adaptive floating navigation, fluid panes, spatial composition, and richer motion.
- Mobile is separately composed, compact, one-hand friendly, and itinerary day-by-day first.
- Native scrolling remains native.
- No zombie patterns.

---

## Visual continuity rules

Use the September South Korea mockup library as continuity evidence.

Preserve:
- Korea destination imagery and mood;
- cream/sage/rust direction;
- serif/sans contrast;
- globe/arrival concept;
- Trip “what matters now” hierarchy;
- itinerary timeline + map workbench;
- mobile day-by-day chronology;
- Guide hero/topic exploration;
- Search category drawers + contextual detail;
- layered SOS;
- operational Split clarity.

Reject:
- purple-era global palette;
- permanent flat desktop sidebar;
- generic equal-card dashboard grids;
- six-plus equal mobile nav destinations;
- Search as a normal tab/page;
- SOS as a normal tab/page;
- zero-radius card law;
- OSM-first live maps;
- identical destination theming;
- decorative motion without spatial/meaning value.

When mockups disagree, the constitution wins.

### Visual ancestry gate — required before each major surface

Before implementing Atlas, Trip, Itinerary, Map, Guide, Search, place detail, Split, SOS, or New Guide intake, identify the exact visual ancestor in `docs/mockups/CANONICAL_MOCKUP_LINEAGE.md`.

Record in working notes / PR description:

1. ancestor mockup filename(s);
2. visual/compositional traits being preserved;
3. final D7 decisions that intentionally change it;
4. superseded traits being deleted;
5. desktop + mobile/intermediate screenshot proof after implementation.

**Do not implement a surface from `grand-reference.html` alone.** The HTML study exists to resolve late D7 deltas; it may not downgrade the richer photography, hierarchy, spatial rhythm, or composition of the named approved mockups.

If the named source mockup is not available in the current execution environment, use the detailed lineage description and current Korea guide assets/data, and flag the missing image-reference availability in the completion report rather than inventing a new aesthetic.

### Reference-image truth

For South Korea reference states, use the current guide's real place names, current itinerary data, current Learnings/Actually/Skipped history, and existing licensed image/video references. Presentation work must not invent travel facts or substitute arbitrary stock content merely to fill a design.

---

## Implementation strategy

Work in coherent vertical slices, but continue until all phases are complete unless a genuine
external blocker is reached.

### Phase 0 — audit and deletion map

Before adding new primitives:

1. Inventory all active:
   - nav systems;
   - card/panel primitives;
   - sheet/modal systems;
   - Search/command palette behavior;
   - map implementations;
   - radius/color/type overrides;
   - motion systems;
   - responsive branches;
   - Painted Atlas/living-cover behaviors;
   - gallery/baselines.
2. Mark each as:
   - keep;
   - migrate;
   - merge;
   - delete.
3. Identify consumers so old systems can be removed in the same program.
4. Do not create a replacement until the deletion/migration owner is known.

### Phase 1 — tokens and primitives

Land the new foundation first:

- palette tokens;
- semantic color tokens;
- destination-theme token contract;
- radius family;
- surface/border/shadow roles;
- typography roles;
- motion timing/easing roles;
- icon sizing/touch-target roles;
- responsive container/breakpoint behavior.

Update `component-registry.json` only as components actually land.
Update drift/accessibility gates so they enforce the new constitution rather than the old visual law.

Delete superseded call-site literals and legacy token aliases when consumers have migrated.

### Phase 2 — shell/navigation/orientation

Replace the old shell.

Desktop:
- adaptive floating nav;
- quiet orientation anchor;
- contextual floating controls;
- Search access;
- SOS access;
- no permanent flat sidebar.

Mobile:
- compact bottom navigation;
- Atlas / Trip / Itinerary / Map / Guide;
- Search global action;
- SOS global action;
- Split contextual.

Verify keyboard/touch/focus/safe areas.

### Phase 3 — Atlas and destination arrival

Implement:
- Atlas home;
- active/inactive lifecycle;
- approved globe treatment;
- first-entry destination arrival;
- shorter repeat arrival;
- destination-aware theme activation;
- reduced-motion fallback.

Do not make the globe the city map.

### Phase 4 — Trip

Rebuild active Trip around:
- Now;
- Next;
- Leave by;
- Get there;
- material problem;
- fallback.

Remove equal-weight dashboard card soup.

Add pre-trip readiness and post-trip editorial/Learnings states without creating separate visual
systems.

### Phase 5 — Itinerary + Map

This is a flagship system.

Desktop:
- resizable temporal-spatial workbench;
- timeline/day chronology;
- Google Map;
- synchronized selection;
- shared-object detail;
- card stack/unfold/reflow;
- single-focus + max two pinned comparison objects.

Mobile:
- focused day-by-day card chronology;
- efficient day switching;
- map/detail sequence;
- current/upcoming emphasis;
- compact completed/later states;
- no shrunken desktop panes.

Replace OSM-first live map behavior with Google Maps Platform.
Preserve honest offline fallback behavior.

### Phase 6 — Guide + visual intake

Guide:
- strong destination hero;
- destination theme;
- category drawers;
- editorial card scrolling;
- contextual place links;
- practical/operational facts remain scan-first.

New Guide:
- adaptive branching visual question deck;
- one question at a time;
- previous answers visible as quiet card history;
- question branching from prior answers;
- card deal/unfold/reflow;
- structured intake output;
- natural-language escape hatch.

### Phase 7 — Search

Replace command-palette-first UX with traveler-facing contextual Search.

Desktop:
- global invocation;
- category drawers;
- fluid result/detail workspace;
- current trip/day/area context.

Mobile:
- compact overlay/sheet;
- categories;
- clear cancel/back;
- no persistent Search destination slot.

Keep developer/keyboard affordances if useful, but they must serve the traveler-facing Search model.

### Phase 8 — Split

Recompose Split as a contextual operational utility.

Keep:
- balances;
- expenses;
- settlement;
- group decisions;
- strong scanability.

Allow destination identity only in editorial/header regions.

### Phase 9 — SOS

Implement the three-layer emergency sheet:
1. category;
2. details/location;
3. connect/confirm.

Keep essential numbers available offline where feasible.
Use conservative motion and maximum clarity.

### Phase 10 — place detail / contextual panes

Unify place/detail behavior across Search, Map, Itinerary, and Guide.

Desktop:
- shared-object transition into fluid contextual pane;
- single focus;
- pin-to-compare.

Mobile:
- sheet → full detail progression.

Do not create separate detail systems for each surface.

### Phase 11 — imagery, iconography, empty/loading/offline

Implement:
- utility icon family;
- Waypoint travel pictogram family;
- expressive content pictograms;
- destination imagery treatment;
- stable loading skeleton geometry;
- expressive but useful empty states;
- honest degraded/offline states.

### Phase 12 — dark mode and destination composer

Implement deterministic destination theme manifests.

Theme may influence:
- accents;
- imagery treatment;
- cartographic texture;
- editorial motif;
- dark-mode atmosphere;
- selected motion choreography.

Theme may not alter:
- safety semantics;
- price/time meaning;
- transit truth;
- critical contrast;
- basic interaction grammar.

### Phase 13 — motion convergence

Use `docs/reference/motion.md`.

Migrate/remove:
- arbitrary durations/easings;
- duplicate GSAP/CSS owners;
- scroll hijacks;
- decorative loops;
- abrupt card/pane snapping;
- legacy motion that does not explain state.

Verify interruption and reduced motion.

### Phase 14 — cull old system

Before calling the redesign complete, grep and delete:

- old sidebar variants;
- superseded mobile nav;
- old card geometry/radius rules;
- old purple palette literals;
- OSM-first live maps;
- duplicate sheet/panel systems;
- old Search/command palette UI that conflicts with contextual Search;
- obsolete motion;
- obsolete design handoff authority claims;
- unused CSS and components left by the migration.

A compatibility shim may survive only if:
- a real consumer still needs it;
- removal is unsafe in this pass;
- there is a named deletion task and test.

### Phase 15 — acceptance

Run focused checks continuously, then the full boundary:

- `npm run check:fast`
- relevant unit/component/browser checks
- design drift checks
- a11y/resilience checks
- reduced-motion checks
- offline/degraded checks
- visual gallery/baseline update
- `npm run check` / `npm run ship:check` as appropriate

Manually verify:
- 320px
- common phone width
- tablet/intermediate
- 1280+
- 1440+
- touch
- mouse
- keyboard
- long/CJK content
- light
- destination-aware dark
- reduced motion
- poor/offline data
- rapid repeated interaction
- back/forward navigation
- no console errors

---

## Canonical screen acceptance

The redesign is not done until all of these visually belong to the same system:

- Atlas
- destination arrival
- active Trip
- pre-trip Trip
- post-trip/Learnings
- Itinerary desktop
- Itinerary mobile
- Map desktop
- Map mobile
- Guide desktop
- Guide mobile
- new Guide visual intake
- Search desktop
- Search mobile
- place detail desktop
- place detail mobile
- Split
- SOS layers
- loading
- empty
- error
- offline/degraded
- light
- dark

---

## What not to do

Do not:
- ask Carlo to re-decide settled visual direction;
- ship another purple dashboard;
- make every screen a grid of rounded cards;
- add a second navigation system;
- make all surfaces glass;
- use AI gradient filler;
- replace Google Maps with a decorative custom basemap;
- hide important actions behind hover;
- turn Search into chat;
- turn Waypoint into a persistent AI companion;
- make animation mandatory to understand state;
- leave old visual implementations around “just in case.”

---

## Completion report

When finished, report:

1. exact base SHA and final SHA;
2. old systems removed;
3. new primitives/components added;
4. major surfaces migrated;
5. Google Maps migration status;
6. responsive acceptance matrix;
7. reduced-motion status;
8. accessibility/resilience results;
9. visual baseline update;
10. remaining deviations from the constitution, if any.

If no deviations remain, state explicitly:

> **D7 GRAND REDESIGN COMPLETE — OLD VISUAL SYSTEM RETIRED.**
