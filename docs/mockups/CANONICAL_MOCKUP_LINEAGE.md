# WayPoint Canonical Mockup Lineage — D7

Status: **REFERENCE EVIDENCE — REQUIRED FOR D7 VISUAL CONTINUITY**  
Authority: `docs/reference/design-system.md`  
Locked: 2026-09-04

This file prevents a specific failure mode: an implementation agent must not average every WayPoint mockup into a new generic aesthetic, and must not treat a generated HTML study as a higher-fidelity visual source than the mockups Carlo approved.

## Precedence

For visual implementation, resolve conflicts in this order:

1. `PRODUCT.md` for product truth and field priorities.
2. `docs/reference/design-system.md` for final D6 decisions.
3. `docs/reference/motion.md` for motion law.
4. **This surface lineage table** for which approved mockup supplies the visual ancestry of each surface.
5. The named mockup itself for composition, imagery prominence, spatial rhythm, and tone.
6. `docs/mockups/grand-reference.html` only for D7 deltas that the named mockup predates.
7. Historical implementation/prototypes only for a concrete engineering question.

**Never reverse 4–6.** The generated grand reference is an evolution diagram, not permission to redraw the product from scratch.

## Global visual ancestry

### Primary system board — `WayPoint Travel App UI Board(1).png`
Preserve strongly:
- warm cream / sage / olive / oxide-rust palette;
- serif editorial display paired with clean operational sans;
- Korean imagery as meaningful content, not decoration;
- rounded but restrained surface geometry;
- useful maps and thumbnails;
- mobile day chronology and clear touch targets;
- one coherent Atlas / Trip / Itinerary / Map / Guide family.

D7 changes applied on top:
- five persistent destinations only: Atlas / Trip / Itinerary / Map / Guide;
- Search and SOS become global actions, not destination slots;
- Split becomes contextual;
- desktop flat sidebar is replaced by adaptive floating navigation;
- card composition becomes more expressive and less grid-like.

### Interaction/lifecycle board — `Waypoint Travel App Design Explorations.png`
Preserve strongly:
- “Right now” hierarchy;
- answer-first place detail with progressive disclosure;
- Map + List as one synchronized experience;
- shared-element path: Atlas → geography → day → place → route;
- before / during / after lifecycle;
- editorial / operational / spatial / focused-action composition families;
- different destination soul with stable operational grammar;
- bright-sun, offline, low-battery, dark, and reduced-motion acceptance states.

Do not copy its older navigation labels literally. Use its product/interaction grammar.

## Surface-by-surface lineage

| Surface | Primary visual ancestor | Preserve | D7 evolution / reject |
|---|---|---|---|
| **Atlas desktop + mobile** | `Waypoint South Korea Atlas Showcase.png` | Globe as hero; realistic geographic feel; subtle topographic ground; trip pins; destination list; large serif Atlas; zoomed South Korea state; UI recedes around geography | Replace flat sidebar with floating adaptive nav; Split/Search/SOS not permanent destinations; first-entry arrival gets richer shared-object motion; no galaxy/space spectacle |
| **Destination arrival** | Atlas Showcase + Design Explorations transition strip | Globe → place continuity; destination title; geographic zoom; purposeful motion | First visit can be cinematic; repeat visit shorter; never delay operational access; reduced-motion final state immediate |
| **Active Trip** | `Trip Cockpit: Seoul Overview Mockup.png`, `Trip Cockpit: Seoul Adventure Dashboard.png`, plus UI Board(1) | Active state; Next Up; leave-by/distance; today map + timeline; readiness/essentials/connectivity; Korean destination image context | Purple is rejected; equal-weight dashboard card soup rejected; Now/Next dominates; imagery more editorial; desktop composition becomes asymmetric/spatial |
| **Pre-trip / post-trip** | `Waypoint Travel App Design Explorations.png` lifecycle row | Readiness before trip; reflection/summary after trip; same product changing hierarchy by state | Use final WayPoint palette/typography; Trip Learnings becomes editorial notebook/reality layer rather than generic stats dashboard |
| **Itinerary desktop** | `Seoul Trip Itinerary Workbench.png` | **Strongest direct ancestor.** Day hero with cartographic texture; “all set” state; detailed timeline; thumbnails/tags; large synchronized map; rust route/markers; day scrubber; operational density | Flat sidebar removed; map uses Google Maps Platform; panes resize/reflow; card stack/unfold transitions; single focus + max two pinned comparisons; no independent timeline/map states |
| **Itinerary mobile** | UI Board(1) + mobile half of `Seoul Trip Itinerary Workbench.png` | Chronological day cards; time/duration; thumbnails; tags; day scrubber; clean cream/sage/rust field UI | Five-destination bottom nav; Split/Search/SOS removed from persistent slots; cards compress completed/later states and expand current/upcoming; no desktop pane shrink-down |
| **Map** | Itinerary Workbench + Design Explorations “Map + List as One Experience” | Large legible map; selected marker/card sync; filters; bottom/side contextual place detail; route relationship | **Google Maps Platform** live layer; WayPoint markers/overlays/camera; fluid detail pane; real transit colors; map stays functional before art-directed |
| **Guide desktop + mobile** | `South Korea Travel Guide UI Mockup.png` | **Strongest direct ancestor.** Large Korean hero photography; “Your guide to South Korea”; topic exploration; recently viewed; warm editorial composition; imagery-forward place knowledge | Flat sidebar removed; desktop gets richer spatial/editorial composition; topic cards become native horizontal/stacked journeys; stronger destination theme; operational facts remain scan-first |
| **Search** | `WayPoint Seoul Search Experience.png` (preferred) + `WayPoint Travel Search Mockup.png` | Wide context search; categories All/Places/Itinerary/Guide/Notes/Food/Transit; top result; itinerary/Guide/note/transit matches; result + detail relationship; Seoul backdrop | Search is a global overlay/action, not nav destination; fluid result/detail workspace; AI stays invisible; preserve category drawers rather than chat |
| **Place detail** | Design Explorations “Place Detail (Progressive Disclosure)” | Strong accurate image; title/status; reservation/action facts; Leave by; Get me there; details/tips deeper; provenance deeper | Desktop card morphs into contextual pane; mobile sheet → full detail; verification quiet unless stale/conflicting; same detail object across Search/Map/Itinerary/Guide |
| **Split** | `WayPoint Split Dashboard at Sunset.png` + `WayPoint Split Strategy Board.png` | Destination-aware hero; green/cream finance surface; obvious balance; expenses; settlement; group context; quick add flow | Split contextual rather than primary navigation; reduce dashboard chrome; operational areas keep high scanability; destination identity stays mostly header/editorial |
| **SOS** | `WayPoint SOS Travel App Design.png` | **Strongest direct ancestor.** Always accessible SOS action; three-layer sheet: category → details/location → connect; essential numbers offline; conservative red semantic treatment | SOS removed from persistent destination bar; keep ≤1 action from main field surfaces; no decorative motion; critical text/icon/color redundancy |
| **New Guide intake** | New D7 pattern, derived from final card system | One question at a time; visual choices; quiet history of prior answers; structured branching; natural-language escape hatch | Must look like the same WayPoint card/object family, not a survey SaaS or chatbot; cards deal/stack/unfold with continuity |
| **Loading / empty / offline / dark** | Design Explorations “Built for Real Conditions” + final constitution | Complete useful states in glare/offline/dark/reduced-motion; no hidden critical data | More destination-aware illustration/materiality where useful; geometry remains stable while loading; error/offline truth always beats visual flourish |

## Visual traits that are explicitly superseded even if a mockup contains them

- purple as WayPoint’s global accent;
- blue SaaS-era global palette;
- a full-height flat desktop sidebar;
- Split as a permanent destination;
- Search as a permanent destination;
- SOS as a permanent destination;
- six or seven equally weighted mobile destinations;
- equal-card dashboard grids;
- generic white rounded rectangles everywhere;
- zero-radius card law;
- OSM-first live map;
- chat-first AI;
- static cross-fades when a shared object can preserve continuity;
- decorative Awwwards motion that steals control from native scrolling.

## Required visual-delta review before implementing a surface

For each major surface Claude/Fable/Codex must write a short implementation note (PR description or working notes, not a new authority file):

1. **Ancestor:** exact mockup filename(s).
2. **Preserved:** 3–6 visual/compositional traits carried forward.
3. **Changed by D7:** final decisions that intentionally diverge.
4. **Rejected:** old traits that must not survive.
5. **Proof:** desktop + mobile/intermediate screenshots after implementation.

If an implementation cannot point to its visual ancestor, it is drifting.

## Cohesion test

A side-by-side review of Atlas, Trip, Itinerary, Map, Guide, Search, Split, SOS, place detail, and Guide intake should read as **one system evolving by task and destination**, not nine templates.

The repeated DNA is:
- Literata + Atkinson;
- warm paper / sage / rust / charcoal;
- destination photography and real geography;
- digital-cartography materiality;
- related card geometry, not identical cards;
- contextual controls;
- strong object continuity;
- adaptive density;
- mobile field clarity;
- destination-specific soul.
