# One-shot implementation prompt — Claude Fable 5

Repository: `Carlob2499/Trip-Guides`
Approved design source branch: `design/d6-product-reconciliation-20260902`
Goal: implement the frozen WayPoint D6 redesign and have the engineering program complete by 2026-09-30.

You are the implementation owner, not the product decision-maker.

## 0. Read first — exact authority order

Before editing:
1. `PRODUCT.md`
2. `docs/reference/design-system.md`
3. `docs/reference/motion.md`
4. `docs/reference/component-registry.json`
5. `src/styles/base.css`
6. `src/lib/breakpoints.ts`
7. `docs/reference/search-ui-final.md`
8. `docs/reference/sos-ui-final.md`
9. `docs/design-handoff/final-2026-09-03/README.md`
10. `docs/design-handoff/final-2026-09-03/DRIFT_GUARD.md`
11. `docs/design-handoff/final-2026-09-03/ACCEPTANCE_MATRIX.md`
12. `docs/design-handoff/final-2026-09-03/MOCKUP_MANIFEST.json`

Only after those may you inspect the images in `docs/design-handoff/final-2026-09-03/visual-references/`.

Do not treat historical prototypes, old design handoffs, archived screenshots, generated boards, or any image not listed in the manifest as authority.

## 1. Operating rule

Implement the approved behavior decisively. Do not reopen settled design questions unless repository evidence exposes a real correctness/accessibility/feasibility blocker.

You have broad engineering discretion over:
- component boundaries;
- CSS/JS/TS organization;
- refactors needed to remove obsolete lineage;
- migration order;
- safe performance improvements;
- test structure;
- responsive implementation details;
- exact spacing/geometry tuning within the existing token system.

You do not have discretion to:
- invent traveler-facing features;
- alter factual trip content to make layouts convenient;
- re-theme WayPoint;
- change the five primary destinations;
- promote Search/SOS/Learnings/Atlas into extra primary tabs;
- weaken offline, provenance, accessibility, or reduced-motion requirements;
- resurrect retired Story/voting/Trip Kit/shared-readiness/Tools concepts.

When a mockup conflicts with code/content/design authority, ignore the mockup.

## 2. Core product architecture to implement

Stable primary traveler destinations:
`Trip · Itinerary · Map · Guide · Split`

Global infrastructure:
- Atlas/Home: world/trip entry surface, one obvious action away
- Search: global contextual utility
- SOS: global emergency utility
- Learnings: inside Trip
- Google Maps: preferred connected map substrate
- OSM: resilient no-key/failure fallback

Launch:
- no active trip / normal browsing → Atlas
- materially active mid-trip → Trip
- Atlas remains one obvious action away

## 3. Implementation program

Work in dependency-safe vertical slices. Keep the site buildable after each slice.

### A. Shared foundation
- reconcile shell/navigation to frozen architecture;
- use existing token/type system; no new palette;
- establish responsive working-surface/immersive-background pattern;
- consolidate duplicate/zombie primitives as they are touched;
- preserve intermediate widths, keyboard, touch, safe areas, reduced motion.

### B. Canonical semantic projection
- retain researched facts/provenance as truth;
- add only the relation metadata needed for canonical Guide knowledge modules to point to day/place/event IDs;
- one canonical object/fact, many projections;
- no runtime-model guessing for relevance.

### C. Atlas
- restrained immersive, flat-first cartographic globe;
- progressive country/trip → city → place disclosure;
- sparse controls; recede during zoom;
- mobile aggressively space-prudent.

### D. Trip lifecycle
- pre-trip: lightweight hero + real unresolved priorities/readiness only;
- active: Now → Next → Leave by → Get there → warning/problem → fallback → rest of day;
- arrival: current-step autopilot + dense next two steps;
- post-trip: editorial recap → major Plan-vs-Actual → Learnings;
- preserve structured Trip Feedback: Overall/Pace/Food; Plan-vs-Actual; private reflection.

### E. Itinerary
- mobile: one day primary, large timeline atoms, contextual imagery, Plan-vs-Actual, thumb-zone day scrubber/rail;
- desktop: resizable timeline-left + real-map-right temporal-spatial workbench;
- support flexible time windows and parallel party branches;
- contextual place detail without losing day state.

### F. Map
- real Google Maps when configured/online;
- keep OSM visible until Google has actually initialized;
- mobile nearly-full map + contextual sheet;
- desktop large map + contextual inspector;
- live routing/traffic delegated to Google Maps app via universal URLs;
- WayPoint research timing remains approximate (`≈N min · check live`);
- preserve country-native fallback such as Naver where materially useful.

### G. Guide
- location/time first;
- large editorial hero and recognizable place imagery;
- map-forward desktop city chapters, map-assisted mobile;
- structured high-value facts before deeper prose;
- reusable canonical How-To/transit/etiquette/culture modules linked deterministically to relevant days/places/events;
- separate durable knowledge from live/perishable overlays.

### H. Split
- do not rewrite the financial engine unnecessarily;
- Recent Expenses + Add Expense are primary;
- four-question add flow: payer / purpose / amount / participants;
- make split method visible on every row: Even / Exact / Shares / %;
- preserve per-expense participant sets, validation, currency, payments, undo/search/filter behavior;
- balance/settlement secondary;
- use reusable semantic icons, not arbitrary expense photography.

### I. Search
- one global search implementation;
- desktop: prominent persistent global field;
- mobile: expanded field at top, compact sticky affordance while scrolled, focused overlay when activated;
- current trip first; grouped canonical object results; deep-link to exact destination/day/place/Guide object;
- restore prior context/scroll on dismiss;
- no AI-chat answer engine.

### J. SOS
- keep intentionally simple;
- quiet always-available control;
- open a compact sheet with verified emergency numbers and useful links;
- preserve offline baked-in numbers, advisory behavior, and accessible focus handling;
- no proactive triage workflow.

### K. Provenance + degraded states
- quiet provenance dot; detail on demand;
- visible stale/uncertain/high-consequence escalation;
- useful fallbacks for missing image/map/live service;
- no blank map, no dishonest live status.

### L. Retirement/convergence
- remove Story Mode dependency-safely after moving any neutral consumers off Story payload;
- retire obsolete navigation/Tools/Trip Kit/voting/shared-readiness lineage;
- update component registry and tests as components genuinely change;
- do not keep two generations alive indefinitely.

## 4. Mockup discipline

Open `MOCKUP_MANIFEST.json` before any visual reference.

Each image contains known generated drift. It is permitted only as a composition/interaction cue. Never copy:
- fake data;
- fake buttons;
- fake people;
- unapproved tabs/categories;
- ratings/reviews;
- live traffic/ETA;
- invented collaboration;
- colors/fonts that conflict with real tokens.

If uncertain whether a visual element is real, search the repository. If no implementation/approved D6 contract exists, omit it.

## 5. Verification

For each vertical slice:
- test phone + intermediate/tablet + desktop;
- light + dark;
- keyboard + touch/mouse;
- text enlargement;
- reduced motion;
- missing/long content;
- offline/degraded path where relevant;
- no console errors;
- no factual-content mutation.

Final acceptance is `ACCEPTANCE_MATRIX.md`.

Use South Korea as the primary visual/functional fixture and Denmark as the adversarial generalization fixture.

## 6. Delivery behavior

Do the work, do not stop to ask the user to restate decisions already recorded.

Stop only for:
- an actual contradiction between binding authorities that cannot be resolved from repository evidence;
- a destructive migration with no safe compatibility path;
- a genuinely new product decision not already covered.

Otherwise choose the safest implementation consistent with authority, document the choice briefly, test it, and continue.

At completion, provide:
- PR(s) / commit range;
- concise migration summary;
- removed obsolete features/components;
- acceptance-matrix result;
- any remaining known risks before the October trip.
