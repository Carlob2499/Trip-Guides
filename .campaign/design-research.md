# Non-authoritative design research — 2026-08-25

> **Status:** Evidence for later design review only. This note neither changes nor supersedes `docs/design-handoff/DESIGN.md`, existing accessibility rules, current product authority, guide content, or implementation priorities.

## Sources analyzed

| Theme | Source | Evidence observed | Research-only interpretation |
|---|---|---|---|
| Map planning and field execution | [Ian Earp, “How to Plan Your Trip With Google My Maps”](https://www.youtube.com/watch?v=TR14gb60JQ4) | The creator separates research from logistics, layers stops by day, uses distance checks for feasibility, and reduces basemap detail to avoid visual overload. | Map context can support an itinerary’s decisions, but should not be mistaken for a replacement research pipeline or a request for manual layer management. |
| Offline field workflows | [Esri, “ArcGIS Field Maps: Taking Your Maps Offline”](https://www.youtube.com/watch?v=KL1qfHojkwQ) | The speakers distinguish prepared versus on-demand offline areas, expose a visible “Generating” state, and discuss later auto-resume of sync after connectivity returns. | Future offline review can prioritize truthful preparation/progress/recovery states. The enterprise map-packaging architecture and limits are not applicable product requirements. |
| Inclusive motion | [Val Head, “Making Motion Inclusive”](https://www.youtube.com/watch?v=q-pUnKCUlJA) | The presentation recommends honoring `prefers-reduced-motion`, identifying trigger-prone movement, and substituting rather than merely removing motion where feedback remains useful. | Existing reduced-motion and accessibility authority is directionally supported. This evidence does not authorize a new global toggle or production motion rewrite. |

## Near-exact source observations

### Map planning

> “Google My Maps is not necessarily a research tool... this is more of a tool to organize the logistics and ideas of your trip.” — Ian Earp, 04:59

> “Measure distances between points... to see if this is even going to be possible in a day.” — Ian Earp, 09:05

> “Access information super quickly and efficiently.” — Ian Earp, 13:57

The demonstration shows day-oriented grouping, activity icon distinctions, distance checks, lodging choice from geographic clustering, and a simplified basemap used to reduce spot clutter. It also exposes limits: authoring is desktop-led, route layers can become unwieldy, and manual layering is a workaround rather than an ideal workflow.

### Offline field work

> “Field Maps enables your fieldworkers to download maps for offline use so that they can have situational awareness, find assets, perform inspections, and capture data.” — Liz Armstrong, 06:21

> “Once the fieldworker has a connection later, Field Maps can automatically sync up any changes that occurred when offline.” — Liz Armstrong, 06:40

> “During the construction of new areas, Field Maps displays ‘Generating’ next to that area until it’s ready to be downloaded.” — Kevin Burke, 22:03

The field-map model makes preparation status and recovery behavior visible, while warning that schema changes, storage exhaustion, and offline-package updates are disruptive. These are comparative observations only; they do not authorize a new map-download system or a claim of offline capability beyond the existing PWA contract.

### Inclusive motion

> “Motion animation triggered by interaction can be disabled unless the animation is essential for functionality or the information being conveyed.” — Val Head, citing WCAG 2.3.3

> “The `prefers-reduced-motion` media feature is used to detect if the user has requested the system minimize the amount of animation or motion it uses.” — Val Head

> “Identify potentially triggering motion... then decide on the best reduced effect based on context.” — Val Head

The talk favors reduced substitutes over indiscriminate removal, clear pause/stop/hide controls for prolonged motion, and special caution for parallax or high-movement visual effects. This supports continued verification of existing accessibility behavior; it is not a mandate to change the current design system.

## Research hypotheses for a future authorized design review

1. **Decision-centric map context:** Keep geographic context subordinate to actionable itinerary/logistics decisions; test whether a selected day or leg can reveal only relevant map context rather than presenting an always-busy map.
2. **Truthful resilience signaling:** Any future offline surface should disclose preparation, availability, and recovery state clearly, never infer that a map or shared write is available when it is not.
3. **Motion as comprehension, not decoration:** Retain only motion that confirms state or spatial relationships; verify an equally comprehensible reduced-motion path.
4. **No inferred roadmap:** Research does not authorize manual map layers, broad collaborative editing, enterprise offline packages, a motion preference override, third-party data integrations, or changes to current design authority.

## Contrarian evidence: avoid feature accumulation

Blue Planit’s [comparative travel-planning review](https://www.youtube.com/watch?v=li-BCn1hHzE) provides deliberate counterweight to the map and offline demonstrations above:

> “The mobile app does seem a little bit cluttered and any serious planning will need to be done in the browser where there’s much more real estate.” — Blue Planit, on Wanderlog

> “The last time I used this feature [Export to Google Maps], it was slightly buggy and did not work every time.” — Blue Planit, on a third-party map handoff

> “You can't plot custom locations on the map like airports or Airbnbs. You can only plot items from their database.” — Blue Planit, on TripAdvisor

The review frames persistent trade-offs: closed POI databases exclude important traveler places; all-in-one products can become cluttered on mobile; forced collaborator accounts raise friction; and third-party navigation handoffs can fail. These observations reinforce a future review question—whether each added surface improves a decision in the traveler’s current moment—rather than authorizing custom POIs, drag-and-drop reordering, collaboration changes, new APIs, or any revision of existing Waypoint direction.
