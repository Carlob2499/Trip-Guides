# Waypoint Design Constitution

Status: **CURRENT DESIGN AUTHORITY — D6 COMPLETE / D7 GRAND REDESIGN AUTHORIZED**  
Owner: Carlo.  
Last reconciled: 2026-09-05.

This document is the **single human-readable authority for Waypoint visual and interaction design**.
It supersedes every previous visual direction, R4/R5 handoff, shipped visual convention, prototype,
screenshot, design experiment, or historical decision log where they conflict.

Authority order:

1. `PRODUCT.md` — product purpose, traveler priorities, capabilities, factual truth.
2. **This document** — brand identity, responsive composition, visual/interaction grammar.
3. `docs/reference/motion.md` — subordinate motion implementation doctrine.
4. `docs/reference/component-registry.json` — machine-facing component/pattern surface.
5. `src/styles/base.css`, `src/lib/breakpoints.ts`, executable a11y/resilience/design gates.

`docs/research/waypoint-design-reference-packet.md`, `docs/mockups/`, and uploaded mockup libraries are
**reference evidence only**. They help preserve visual continuity, but they never override this file.

The D7 implementation mandate is simple:

> **Replace the old visual system; do not layer the new one on top of it.**
>
> Merge before adding. Retire before replacing. No zombie navigation, card, sheet, map, search,
> typography, radius, or motion systems may survive indefinitely.

---

## 1. Product identity

Waypoint is **a modern boutique travel operating system with airline-grade precision, digital
cartography, and field-journal warmth**.

It should feel:

- **calm and premium** without becoming sparse for its own sake;
- **editorial and place-specific** without becoming a travel magazine that hides operational truth;
- **precise in the field** without looking like enterprise software;
- **visually ambitious on desktop** without behaving like an Awwwards demo reel;
- **compact and obvious on mobile** without becoming a shrunken desktop;
- **intelligent** without looking like an AI chat product.

Three registers coexist:

### Modern boutique — the ground
Calm composition, useful whitespace, tactile-but-digital surfaces, refined typography, restrained
depth, confident imagery, and intentional asymmetry.

### Airline precision — operational truth
Hours, prices, transit, timing, reservations, warnings, state, verification, directions, balances,
and emergency information are aligned, scan-first, predictable, and never subordinated to
decoration.

### Digital cartography — the Waypoint signature
Maps, contour/route motifs, geographic hierarchy, subtle map-like materiality, and spatial
continuity connect Atlas, Trip, Itinerary, Map, Guide, Search, and destination identity.

Decorative language never carries safety, uncertainty, price, time, route, or verification meaning.

---

## 2. Typography

The type system is locked.

- **Literata Variable** — display, editorial, destination, and reading voice.
- **Atkinson Hyperlegible Next** — UI, controls, operational data, navigation, dense information.
- CJK/system fallbacks remain appropriate to the locale.
- No third global type family without an explicit constitution change.

### Typography personality
Default personality is **editorial contrast**: serif display + hyperlegible sans UI.

Selective expressive moments are allowed on desktop and destination-entry surfaces:
- oversized destination/country names;
- image-integrated display type;
- unusual but legible alignment;
- type that participates in a geographic/arrival composition.

Those moments must remain exceptional. Routine UI never becomes typographic theater.

Operational numerals should use tabular alignment where useful.

---

## 3. Core palette and semantic color

The old purple/dashboard palette is retired.

Waypoint's base palette is:

- **warm paper / cream** — daylight ground;
- **sage / olive family** — calm secondary structure and selected supportive states;
- **warm charcoal** — dark-mode ground;
- **restrained oxide / rust orange** — Waypoint action/selection emphasis;
- **deep neutral ink** — primary text and structural contrast.

Exact values belong in tokens, not one-off literals.

### Semantic color
Color is controlled, not decorative.

Use semantic color when it saves time or prevents a mistake:
- success / confirmed;
- caution / timing risk;
- critical / emergency / closed;
- informational change;
- selection / current position;
- externally meaningful systems such as transit lines.

Real-world system colors may remain recognizable where that improves field use. Do not repaint a
known transit line into Waypoint rust merely for branding.

Category rainbow is rejected. Food, culture, shopping, nightlife, etc. are distinguished first by
iconography, copy, shape, and grouping.

Color is never the only cue. Pair meaningful color with text, icon, shape, or state label.

---

## 4. Material language — digital cartography

Surfaces are **mostly solid**.

Glass/translucency is selective and functional:
- floating navigation;
- temporary overlays;
- map controls;
- transient contextual panes.

Dense reading, itinerary facts, prices, critical status, and SOS never sit on low-contrast glass.

Waypoint may use subtle:
- topographic/contour motifs;
- map-paper softness;
- route-line texture;
- coordinate/grid hints;
- tonal layering;
- restrained photographic grain.

Reject:
- parchment cosplay;
- vintage-map theming;
- heavy film grain over text;
- decorative texture that reduces contrast.

---

## 5. Responsive system

Waypoint is one product with **responsive sibling compositions**.

Responsive does **not** mean desktop with pieces hidden or mobile stretched larger.

### Mobile
Mobile is designed for one-hand, in-field use:
- current trip context first;
- primary actions thumb reachable;
- sequential disclosure when simultaneous panels would crowd;
- 320px reflow is the safety floor;
- important controls approximately 44×44 CSS px where practical;
- day-by-day itinerary is a focused chronological card experience;
- map/detail/search use sheets or focused swaps when necessary;
- no feature is silently removed solely because width is narrow.

### Desktop
Desktop is the showpiece surface.

It should use width to:
- reveal relationships;
- compare options;
- keep spatial + operational context visible together;
- produce editorial and map-driven compositions impossible on a phone;
- use fluid contextual panes, card choreography, and richer transitions.

Desktop should feel influenced by the best Awwwards/Dribbble editorial/product craft while obeying
travel-product usability.

### Intermediate/tablet
Intermediate widths are first-class. Components recompose intrinsically/container-first.
No design is accepted merely because 375px and 1440px look good.

---

## 6. Navigation and orientation

### Default lifecycle
- **No active trip:** Atlas is the default home.
- **Active trip:** Trip is the default home.
- Atlas remains one action away at all times.

### Desktop navigation (decided 2026-09-05 — the frame strip)
Desktop navigation is the **top row of the dark frame** every surface sits inside (final mockup
package, boards 01 and 02):
- wordmark left (compass mark + WayPoint) — the way back to the Atlas;
- the destination tabs centred: **Trip · Itinerary · Map · Guide · Split**;
- the global actions right: Search pill, SOS, share, theme.

The strip is always in the dark register, on the cream page and in dark mode alike. There is no
floating rail and no flat sidebar; both are retired (§33). On the Atlas the strip's centre carries
the trips' status chips instead of tabs, since the destinations belong to a trip.

Primary destinations:
- Atlas (the wordmark, and its own page)
- Trip
- Itinerary
- Map
- Guide
- Split — a tab **on desktop only**, where the strip has the room; it stays a contextual trip
  utility everywhere else (Trip, group/expense contexts, Search).

Search is not a destination tab. It is a globally available contextual action.

SOS is not a destination tab. It is a globally available emergency tool.

### Mobile navigation
Keep the persistent bar compact and prudent with phone space:
- Atlas
- Trip
- Itinerary
- Map
- Guide

Atlas keeps its slot on a phone because the wordmark is too small a target to be the only way
home. Split is contextual.
Search is globally available without occupying a permanent destination slot.
SOS remains one-action accessible and visually distinct.

### The frame
On desktop every page is composed inside one dark, rounded frame on the cream ground (`.stage`):
the strip is its first row and the surface's own workspace fills the rest; ivory cards may follow
under the frame. On a phone the frame runs edge to edge. In dark mode the frame and the ground share
the register and the frame keeps a hairline so it still reads as the frame.

### Orientation
Use a **quiet contextual north star**, not loud breadcrumbs:
- current trip;
- current day;
- current area/region when useful.

Deeper hierarchy appears on demand. Avoid bulky breadcrumb bars or persistent page furniture.

---

## 7. Composition grammar

Use four composition families:

### Editorial
Destination identity, culture, narrative, Guide content, photography, post-trip recap.

### Operational
Schedules, hours, prices, transit, reservations, balances, warnings, checklist, settlement.

### Spatial
Map + place relationships, routes, neighborhoods, itinerary/map synchronization.

### Focused action
One immediate task with minimal competition: route, SOS, save/change, add expense, resolve issue.

Screens may blend families, but each region has a clear job.

### Desktop layout philosophy
Use a **hybrid spatial/editorial composition**:
- core information follows a disciplined grid;
- important moments may break the grid;
- selected objects can reorganize nearby panes;
- map, cards, and imagery can compose as one workspace;
- structure first, spectacle selectively.

---

## 8. Card system

Cards are not a universal page canvas. When used, they behave like designed objects.

### Card families
Use one related geometric family with four roles:

1. **Operational card** — scan-first, compact, stable.
2. **Editorial card** — larger proportion, image-led, freer internal composition.
3. **Compact tile** — dense saved place/result/utility object.
4. **Feature object** — rare desktop object with more distinctive silhouette or layering.

No fantasy-card theming, decorative borders, game UI chrome, or literal playing-card styling.

### Card composition
Default is expressive:
- stack;
- offset;
- partially overlap;
- fan subtly;
- vary scale;
- form chronological or thematic sequences;
- break the grid selectively.

The inspiration from card/deck-building games is **physicality and hierarchy**, not game theming.

### Card reflow
When cards move from stacked/grouped states into final layout:
- preserve object identity;
- animate from source position to destination position;
- avoid abrupt snapping/reordering;
- minimize layout shift;
- keep the user able to track each object.

Desktop may use rare table/canvas-like card arrangements.
Mobile uses the same language with tighter chronology and less simultaneous overlap.

---

## 9. Spacing and density

Use **adaptive density**.

Density follows the task, not the device:
- arrival/editorial/inspiration → spacious;
- planning/comparison → moderately dense;
- itinerary execution/map manipulation → dense;
- SOS/critical state → extremely clear, not aesthetically sparse.

Avoid dead space that exists only to signal luxury.
Avoid crowding every screen because desktop has room.

---

## 10. Imagery and photography

Imagery is **contextual**.

Use prominent imagery when it supports:
- destination identity;
- recognition;
- orientation;
- emotional arrival;
- editorial storytelling.

Keep functional surfaces denser where imagery would slow scanning.

Default treatment is editorial with substantial selective art direction:
- intentional crops;
- occasional full bleed;
- image/text interplay;
- controlled overlays;
- layered collage;
- dramatic masks/crops;
- animated reveals;
- destination-aware grading.

Place-detail imagery must still represent the actual place clearly.
Do not stylize factual imagery until it becomes misleading.

---

## 11. Destination identity and visual composer

Destination identity is strong.

The user should feel that opening a country/Guide is **like flying there**.

A Japan Guide, Korea Guide, Italy Guide, etc. may differ materially in:
- imagery;
- destination accent palette;
- cartographic texture;
- local visual motifs;
- icon nuances;
- transition style;
- dark-mode atmosphere;
- editorial rhythm;
- hero composition.

The Waypoint interaction grammar remains constant.

### Deterministic visual composer
Destination theming is driven by a deterministic composer/token layer, not unconstrained per-screen
AI styling.

Conceptual order:

**SPINE → ANCHOR → MERGE → ORDER → BUDGET → THEME → RENDER**

The composer decides:
- hierarchy;
- grouping;
- density;
- card order;
- emphasis;
- imagery allocation;
- allowed destination theme tokens.

The renderer decides pixels from approved tokens/components.

AI may help generate structured choices, but no LLM is allowed to freestyle global UI values or
invent destination symbolism at render time.

---

## 12. Destination entry / Atlas arrival

The approved globe/arrival concept is retained and elevated.

### First entry
Use a **full destination arrival**:
- globe or geographic continuity;
- route/path movement;
- country/city focus;
- destination typography;
- local imagery/motifs;
- interface assembly.

It may be cinematic, but operational access must not be delayed excessively.

### Repeat entry
Use a shorter cinematic reveal that preserves destination identity without replaying the full
sequence.

### Painted Atlas / living covers
Living Atlas identity may remain only where movement communicates geographic identity and respects
performance/reduced motion. Idle decorative drift is not required.

---

## 13. Dark mode

Dark mode is destination-aware atmosphere built on a robust neutral baseline.

Base:
- warm charcoal, never generic blue-gray;
- strong operational contrast;
- restrained luminous accents.

Destination layer may alter:
- imagery selection/treatment;
- cartographic lighting;
- local accent balance;
- texture;
- cinematic moments.

Tokyo at night may feel different from Kyoto, Seoul, or Rome, but operational UI remains Waypoint.

The interface must still work beautifully if all contextual/dynamic theming is unavailable.

---

## 14. Context adaptation

Context awareness is an enhancement layer, not a dependency.

Waypoint may subtly react to:
- day/night;
- current trip day;
- current neighborhood;
- weather;
- upcoming reservation;
- active transit;
- meaningful disruption.

The static baseline must be excellent in any condition.
If live context is absent, stale, offline, or denied, the UI degrades gracefully.

---

## 15. Maps

**Production maps use Google Maps Platform.**

Do not ship a separate bespoke basemap as the live primary map.

Waypoint owns the experience around Google Maps:
- cloud styling;
- Advanced Markers or equivalent;
- route overlays;
- itinerary/day state;
- selected/saved/current-place states;
- category filtering;
- neighborhood/area overlays where appropriate;
- synchronized card/list/detail state;
- camera choreography;
- destination-aware map styling.

Maps remain highly readable and preserve real-world/transit semantic color where useful.

Offline/degraded states must remain honest. A static/local fallback may exist for cached context, but
the live mapping engine is Google Maps.

---

## 16. Fluid desktop workspace

Desktop uses a **fully fluid workspace**.

Selecting an object from Map, Itinerary, Guide, or Search may cause nearby cards/panes to reorganize
around the active object rather than always opening a fixed side panel.

Rules:
- no teleportation;
- preserve shared-object continuity;
- important controls remain anchored;
- object movement communicates parent/child relationship;
- layout remains predictable after the transition;
- never recompose so aggressively that orientation is lost.

### Multi-panel policy
Single-focus is the default.

Users may deliberately **pin up to two comparison objects**. Larger multi-window arrangements are
not the default interaction model.

---

## 17. Scrolling

Native vertical scrolling remains the backbone.

Selected sections may use:
- horizontal card journeys;
- stacked-card reveals;
- pinned map-linked sequences;
- card unfolding/reflow;
- geographic/arrival choreography.

Use choreographed scroll only when it improves the mental model.
Never hijack scrolling merely to look premium.

Desktop may use selective high-expression sequences.
Mobile prioritizes predictable vertical chronology.

---

## 18. Motion

Motion must feel **buttery, fast, cohesive, and expected**.

Everything should feel physically connected, but nothing should make the user wait for animation.

Timing and implementation rules live in `docs/reference/motion.md`.

Core principles:
- routine actions resolve almost immediately;
- object expansion/reflow gets enough time to explain continuity;
- cinematic pacing is reserved for genuine scene changes;
- no gratuitous bounce or showy delay;
- shared-object transitions are preferred;
- animation is interruptible;
- reduced motion is complete;
- scrolling/clicking should feel like moving through one coherent spatial system.

---

## 19. Controls and progressive disclosure

Use **contextual floating controls + progressive reveal**.

Persist only high-value/frequent controls.
Reveal secondary actions near the object/task they affect.

Important actions must remain discoverable through the main interface; do not bury the only path in
hover, long-press, or context menu.

Avoid heavy persistent chrome.

---

## 20. Iconography

Use three levels.

### Utility glyphs
Familiar first:
search, back, close, share, edit, delete, filter, calendar, more, etc.

### Waypoint semantic symbols
A bespoke cartographic/travel pictogram family for:
food, café, nightlife, shrine/temple, museum, shopping, hotel, train, metro, bus, ferry, taxi,
walking, airport, luggage, reservation, timed entry, ticket, viewpoint, neighborhood, saved,
visited, planned, skipped, weather disruption, language help, ATM/cash, restroom, accessibility,
emergency, and other repeated travel semantics.

### Expressive pictograms/illustration
Use for content-level moments:
Guide-question cards, destination categories, milestones, onboarding, empty states.

The Waypoint icon hand should feel:
- cartographic;
- geometric but not sterile;
- consistent stroke/terminal behavior;
- occasionally waypoint/node inspired;
- recognizable at mobile sizes.

Do not put a pin motif into every icon.

Mobile icons prioritize silhouette and touch target over detail.
Ambiguous travel actions use icon + short label.

---

## 21. Search

Search is locked as **context-aware universal Search with category drawers**.

It understands:
- current trip;
- current day;
- current area/location when available;
- current itinerary/map/Guide state.

It can surface:
- Places;
- Itinerary;
- Guide;
- Notes;
- Transit;
- Food;
- other approved categories through More Filters.

Search is not a chatbot and not a developer command palette.

Desktop may show a fluid results/detail workspace.
Mobile uses a compact overlay/sheet with category drawers and clear escape.

Natural-language interpretation may exist invisibly, but the interface remains structured.

---

## 22. AI presence

AI is **mostly invisible**.

Users should experience:
- better recommendations;
- itinerary repair;
- conflict resolution;
- smarter Search;
- adaptive Guide questions;
- useful fallback suggestions;
- context-aware ranking.

They should not experience a persistent assistant persona following them through the product.

“Ask Waypoint” may exist as a secondary escape hatch.

---

## 23. Guide

Guide is a destination-understanding surface, not a generic article index.

Guide should combine:
- destination hero/identity;
- editorial topic areas;
- category drawers;
- card-based exploration;
- searchable knowledge;
- place-linked context;
- practical/operational facts.

Guide may be one of the most visually expressive surfaces.

### Create Guide
Replace long configuration forms with an **adaptive visual question deck**.

Rules:
- ask one clear decision at a time;
- answers determine later questions;
- previous answers remain visible as a quiet history/stack;
- cards deal/unfold/reflow smoothly;
- visual options are preferred where they improve comprehension;
- natural-language “just tell Waypoint” remains an escape hatch;
- final answers compile into structured intake, not prose soup.

This interaction language may be reused for other multi-step decisions where appropriate.

---

## 24. Trip

Trip is **what matters now** during an active trip.

The hierarchy is:

1. Now
2. Next
3. Leave by
4. Get there
5. Material problem / uncertainty
6. Relevant fallback
7. everything else

Trip should not revert into a generic dashboard of equal cards.

Before travel it may emphasize readiness.
After travel it becomes an editorial recap + Trip Learnings entry point.

---

## 25. Itinerary

### Mobile
Mobile Itinerary is day-by-day chronology.

Use:
- focused day header;
- strong current/upcoming hierarchy;
- chronological cards;
- compressed completed/later states where useful;
- card expansion into details/map;
- day scrubber or equivalent efficient day switching;
- smooth reflow preserving where objects came from.

Do not shrink a desktop timeline into a phone.

### Desktop
Desktop Itinerary is a resizable **temporal-spatial workbench**:
- timeline/day chronology;
- Google Map;
- synchronized selection;
- day/route state;
- contextual detail;
- optional pin-to-compare;
- card stack/unfold modes where useful.

The map and itinerary are one synchronized model, not separate products.

---

## 26. Map

Map is a spatial workspace, not merely an embed.

Use:
- Google Maps Platform;
- Waypoint markers/overlays;
- synchronized cards/detail;
- current day/selected places;
- category filters;
- route context;
- quiet orientation;
- fluid desktop workspace;
- focused mobile sheet behavior.

The approved globe belongs to Atlas/arrival, not as a replacement for a functional city map.

---

## 27. Split

Split is operational and dense.

It may use destination imagery in header/identity regions, but balances, expenses, settlement, and
group decisions remain stable, scan-first, and semantically clear.

Split is contextual, not a primary navigation destination.
It is reachable from Trip, relevant group/expense actions, Search, and expanded navigation.

---

## 28. SOS

SOS is a **layered emergency tool**, not a destination.

It is always one action away.

Use three focused layers:
1. category / what help is needed;
2. quick details + location/context;
3. connect/confirm.

Essential local numbers and critical trip information must remain available offline where feasible.

SOS is visually conservative:
- extremely high contrast;
- large targets;
- no decorative motion;
- no ambiguous icons;
- no hidden critical action;
- semantic color + icon + text.

---

## 29. Empty, loading, error, offline

Use expressive designed states with a practical core.

### Loading
Preserve the final geometry so content does not jump.
Skeletons match eventual card/panel structure.

### Empty
Use a destination-aware pictogram/illustration when useful, but always provide the clear next action.

### Error/offline
Truth first.
Never disguise missing data as a decorative empty state.
Offer the best available cached/local action.

Expressive treatment never obscures recovery.

---

## 30. Accessibility and resilience

WCAG 2.2 AA is the binding floor plus Waypoint field-use requirements.

- outdoor/glare readability;
- text enlargement;
- keyboard;
- touch;
- assistive semantics;
- 320px reflow;
- safe areas;
- long/CJK strings;
- dark mode;
- reduced motion;
- offline/degraded;
- missing/partial data;
- important field targets ~44×44 CSS px where practical;
- no critical state by color alone.

A beautiful state that fails a tired traveler outdoors is not an approved design.

---

## 31. Geometry and surfaces

The old zero-radius card law is superseded.

Use a **related radius family**, not one radius everywhere.

Recommended role scale:
- small/control inset: 10–14px;
- compact card: 14–18px;
- standard operational/editorial card: 18–24px;
- large hero/pane: 24–32px;
- pills: full radius.

Exact token values should be finalized in D7 and registered before widespread call-site use.

Border/shadow treatment should be restrained:
- hairline structure;
- low, broad shadows only for actual depth/focus;
- no floating-everything dashboard look.

---

## 32. Verification/provenance presentation

Verification remains traceable without dominating every surface.

Default:
- verified routine state is quiet;
- stale/conflicting/uncertain state is materially visible;
- claim/source/date detail appears on demand;
- no customer-facing pipeline jargon.

Provenance affordances must not become a field of tiny unexplained dots.

---

## 33. Old-system retirement

The D7 redesign is not additive.

The implementation program must identify and retire:
- old flat sidebar navigation, and the 2026-09-04 floating desktop rail it was replaced with;
- superseded mobile nav variants;
- purple-era palette and one-off call-site colors;
- zero-radius card law;
- old generic dashboard card grids;
- obsolete command-palette-first Search behavior where it conflicts with traveler-facing Search;
- old OSM-first map path where live Maps should use Google Maps Platform;
- duplicate panel/sheet/navigation systems;
- legacy story/swipe/yielding behaviors that do not survive this constitution;
- obsolete Painted Atlas/living-cover motion that exists only decoratively;
- old prototypes/handoffs that still claim implementation authority;
- redundant CSS/token overrides left behind by prior visual generations.

Do not leave hidden “legacy” variants active for convenience unless there is a documented temporary
compatibility boundary with a deletion task.

---

## 34. Canonical visual continuity

The September 2026 South Korea mockup library remains useful reference evidence.

Preserve from the strongest mockups:
- cream/sage/rust travel palette;
- Literata-like editorial display + hyperlegible UI contrast;
- Seoul/Korea destination imagery and cartographic warmth;
- Itinerary timeline + map workbench;
- mobile day view chronology;
- Guide hero + topic exploration;
- contextual Search categories;
- SOS layered flow;
- Split operational clarity;
- globe/arrival identity;
- Google-style city-map legibility.

Explicitly reject when they appear in older mockups:
- purple as the global Waypoint accent;
- permanent flat desktop sidebar as the final chrome;
- dashboard grids of equal rounded cards;
- six-plus equally weighted mobile destinations;
- Search as a conventional page/tab;
- SOS as a normal destination;
- generic AI gradients;
- identical destination theming;
- static page-to-page transitions with no object continuity.

The mockups are a visual library, not a voting system. Do not average incompatible generations.

---

## 35. Governance and D7 acceptance

D6 design reconciliation is **complete**.

D7 is authorized to implement the entire new visual system.

A redesign is not accepted until:

1. all major surfaces use the new system:
   - Atlas
   - Trip
   - Itinerary
   - Map
   - Guide
   - Search
   - Split
   - SOS
   - place/detail
   - new Guide intake
   - post-trip/Learnings
   - loading/error/offline states
2. desktop, tablet/intermediate, and mobile compositions are intentionally designed;
3. old conflicting patterns are removed;
4. Google Maps Platform is the live map foundation;
5. motion matches `docs/reference/motion.md`;
6. reduced motion is complete;
7. visual regression baselines are regenerated from the new system;
8. accessibility/resilience gates pass;
9. no factual destination content was changed by presentation work;
10. the final site looks like one coherent Waypoint product rather than a collage of mockup eras.

Implementation sequencing is owned by the temporary D7 work order, not by creating another design
authority.
