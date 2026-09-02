# Waypoint Design Constitution

Status: **CURRENT DESIGN AUTHORITY — D6 RECONCILIATION IN PROGRESS**  
Owner: Carlo.  
Last reconciled: 2026-09-02.

This document is the **single human-readable authority for Waypoint visual and interaction
design**. No file under `docs/design-handoff/`, no prototype, screenshot, archived redesign,
research packet, or historical decision log may override it.

Authority order:

1. `PRODUCT.md` — user, product purpose, field-use priorities, capabilities, truth.
2. **This document** — brand identity, responsive composition, visual/interaction grammar.
3. `docs/reference/motion.md` — subordinate motion implementation doctrine.
4. `docs/reference/component-registry.json` — machine-facing approved component/pattern surface.
5. `src/styles/base.css`, `src/lib/breakpoints.ts`, tests/gates — executable token and safety truth.

`docs/research/waypoint-design-reference-packet.md` is advisory evidence for D6/D7. It is
never authority by itself.

---

## 1. Identity

Waypoint is **a modern boutique travel app with airline-grade precision and field-journal
warmth**.

Three registers make that concrete:

- **Modern boutique — the ground.** Calm, intentional composition; generous but useful space;
  restrained depth; polish that disappears into the task.
- **Airline precision — operational truth.** Hours, prices, transit, timing, reservations,
  warnings, state, and verification are aligned, scan-first, and predictable.
- **Field-journal warmth — identity and editorial context.** Photography, illustration,
  destination character, cartography, and narrative warmth live in controlled editorial
  regions. They never distort operational facts.

A screen may contain multiple registers, but each region must have a clear job. Decorative
language never carries safety, uncertainty, price, time, route, or verification meaning.

### Typography

- **Literata Variable** — display and reading voice.
- **Atkinson Hyperlegible Next** — operational/data/control voice, with tabular numerals where
  alignment matters.
- Existing CJK/system fallbacks remain.
- No third type family without an explicit constitution change.

### Palette

Direction: **Night Navy & Amber on warm paper**.

- deep navy = Waypoint structure/identity;
- amber = selected action/emphasis;
- warm paper/cream = daylight ground;
- warm charcoal = dark-mode ground; never blue-gray;
- semantic success/caution/critical states retain their own meaning and are not repurposed as
  destination decoration.

Destination-specific color may appear in approved identity regions when it preserves contrast
and semantic clarity. Final values come from the token system, never one-off call-site literals.

---

## 2. Responsive web design — a constitutional principle

Waypoint is one product with **responsive sibling compositions**.

Responsive does **not** mean:
- desktop with pieces hidden;
- mobile stretched larger;
- device-name branching;
- a handful of screenshots at canonical breakpoints.

The information and capability remain coherent while layout, disclosure, navigation, and
simultaneous context recompose according to available space, input method, and traveler state.

### Rules

1. **Mobile is designed, not derived.** Active-trip context comes first. Primary actions remain
   thumb reachable. Simultaneous regions reduce; disclosure becomes sequential where helpful.
2. **Desktop earns its space.** Use width to reveal relationships, compare options, and show
   spatial + operational context together. Do not merely enlarge phone cards.
3. **Prefer intrinsic/container-driven layout for content.** Components respond to the space
   they actually receive. Viewport queries are primarily for viewport-owned chrome and
   genuinely viewport-bound behavior.
4. **Intermediate widths are first-class.** A design is not accepted only because 375px and
   1440px look good.
5. **Notation relocates; it does not shrink into illegibility.** Dense tables, timelines,
   maps, and diagrams recompose, scroll locally, or disclose progressively.
6. **No capability loss by width alone.** Narrow screens may reprioritize or sequence a
   capability; they do not silently remove it.
7. **Safe areas are part of layout.** Fixed/sticky controls reserve notches, home indicators,
   and browser chrome correctly.
8. **320px reflow is the safety floor.** Long names, CJK/multilingual strings, text zoom,
   split-screen, landscape phones, tablets, and hostile unbroken content must not create
   page-level clipping or inaccessible actions.

Acceptance must cover phone, intermediate/tablet, desktop, touch, mouse, keyboard, dark mode,
text enlargement, reduced motion, offline/degraded state, missing data, and realistic long
content.

---

## 3. Hierarchy before features

Waypoint does not give every capability equal visual weight merely because it exists.

During active travel, the default hierarchy is:

1. **Now**
2. **Next**
3. **Leave by**
4. **Get there**
5. **Material problem / uncertainty**
6. **Relevant fallback**
7. everything else

Before and after a trip the hierarchy may change, but it must remain deterministic and based on
information Waypoint actually has.

A traveler should be able to identify the next useful action within a few seconds.

---

## 4. Composition grammar

The design system standardizes vocabulary without forcing every page into the same grid.

Use four composition families as defaults:

### Editorial
Destination identity, culture, context, imagery, explanatory prose. May use freer composition
and controlled visual drama.

### Operational
Schedules, hours, prices, transit, reservations, state, checklist, settlement. Compact,
aligned, predictable, scan-first.

### Spatial
Map + place relationships, route context, neighborhood/area orientation. Map and textual/list
representations should share selection and state rather than behaving as separate products.

### Focused action
One immediate task with minimal competition: route, SOS, save/change, add expense, resolve a
specific warning.

Cards/panels are tools inside these grammars, **not the universal page canvas**.

---

## 5. Progressive disclosure and truth

Dense verified information should feel calm without becoming vague.

Default sequence:
- immediate field answer;
- operational facts;
- deeper explanation/provenance on demand.

Never hide:
- a safety-critical warning;
- material uncertainty;
- stale/conflicting state that changes a decision;
- the only information needed to understand an action.

Routine verified state may be quieter than adverse state. Verification remains traceable to
claim/source/date; visual treatment may evolve during D6.

Customer-facing UI never exposes pipeline, agent, register, gate, or implementation vocabulary.

---

## 6. Destination identity

Different destinations should feel distinct without becoming different products.

Destination personality belongs in controlled regions such as:
- mastheads/hero media;
- selected editorial illustration or photography;
- atlas/spatial moments;
- section identity accents.

Operational structure remains stable across destinations. Never theme warnings, prices, hours,
transit, evidence, or interaction semantics into decorative local motifs.

Generic AI-looking gradients, invented local symbolism, and interchangeable "travel aesthetic"
art are rejected.

---

## 7. Motion

Motion explains **where something went, what changed, or how states relate**.

- Routine interaction is fast, interruptible, and subordinate to the task.
- Native scrolling is never hijacked.
- Shared/spatial continuity is preferred when it preserves orientation.
- A small number of geographic/spatial moments may be memorable; spectacle without orientation
  value is rejected.
- Continuous motion must encode live meaning or earn an explicit exception.
- Reduced motion supplies a complete usable state, not a broken or second-class version.

Implementation vocabulary and current owners live in `docs/reference/motion.md`.

---

## 8. Accessibility, resilience, and field conditions

WCAG 2.2 AA is the binding floor, plus Waypoint's stricter field-use requirements.

- Important field controls target at least approximately 44×44 CSS px where practical.
- Contrast and type are judged for outdoor/glare use, not only desktop viewing.
- Focus, keyboard, touch, and assistive semantics remain complete.
- Critical state never relies on color alone.
- Offline/degraded behavior remains honest.
- Low-bandwidth and conservative-media paths remain useful.
- Reduced-motion is complete.
- Print remains supported, but screens are designed screen-first.

A visually impressive state that fails the traveler under poor signal, glare, long text, or one
hand is not an approved Waypoint design.

---

## 9. Simplification and convergence

**Merge before adding. Retire before replacing.**

When a new pattern supersedes an old one, the old implementation and its active authority are
removed in the same program unless a documented compatibility reason prevents it.

Before introducing a component, navigation model, overlay, control family, layout grammar,
motion pattern, or visual treatment:

1. Can an existing one do the job?
2. Can two existing variants be consolidated?
3. Can an obsolete behavior be deleted instead?
4. Is this solving a traveler problem or preserving an old iteration?

No zombie patterns: two generations of navigation, cards, sheets, verification marks, or
responsive models do not coexist indefinitely.

Historical prototypes and experiments are evidence in Git history, not production authority.

---

## 10. Governance

- Agents use this constitution plus approved tokens/components; they do not infer authority from
  historical handoffs or prototypes.
- New global tokens/components require Carlo's approval and registry-first landing.
- New feature-specific composition may start locally when it uses approved primitives; it should
  graduate into the global system only after demonstrated reuse.
- Presentation work never alters factual travel content.
- Research is advisory until explicitly adopted here.
- Machine gates enforce safety floors and should ratchet toward this constitution, never preserve
  a superseded aesthetic by accident.

### Active design files

Keep active:
- `PRODUCT.md`
- `docs/reference/design-system.md`
- `docs/reference/motion.md`
- `docs/reference/component-registry.json`
- executable token/breakpoint/accessibility/resilience gates

Everything else is reference, research, implementation documentation, or history and must not
claim design authority.

---

## 11. D6 reconciliation — decision ledger

### Resolved

**D6-00 — No generic Tools/More destination.**  
Waypoint will not reserve permanent navigation space for a generic utility bucket. SOS remains
global; routing belongs with itinerary/spatial context; reminders/readiness utilities surface
where relevant. Split remains under separate review because it has demonstrated direct trip
utility.

**D6-01 — Stable primary navigation; retire adaptive promotion.**  
Primary destinations keep a stable identity and stable relative order. Waypoint will not
automatically promote/reorder content groups or tools based on device-local usage. Responsive
layouts may change the navigation *presentation* (for example bottom bar vs rail/sidebar), but
not the destination model. Remembering a user's last location inside a destination is allowed;
rewriting the navigation itself is not. D7 must remove the adaptive/promoted mobile-nav logic
and its supporting UX debt once the final destination model is approved.

**D6-02 — Trip is the stable lifecycle destination.**  
The first primary destination is `Trip`, not a permanent `Today` tab. Its composition adapts
to the trip lifecycle while its identity stays fixed: pre-trip emphasizes readiness/bookings/
deadlines; active-trip emphasizes Now → Next → Leave by → Get there → material problem →
fallback → remainder of today; post-trip emphasizes recap, planned-vs-actual, and learnings.

**D6-03 — Stable five-destination product architecture.**  
The primary traveler destinations are `Trip · Itinerary · Map · Guide · Split` in that stable
order. Search and SOS are global actions, not tabs. Each destination must continue to earn its
place during D6/D7; generic Tools/More remains rejected.

**D6-04 — Immersive destination cover is required.**  
The Guide/editorial destination must support an immersive, edge-to-edge destination cover on
mobile. The cover may extend beneath safe-area-aware app chrome in installed/standalone mode
and must remain space-efficient in ordinary mobile browsers. Operational facts must not be
pushed behind decorative spectacle; the immersive treatment belongs to editorial identity,
not every screen.

**D6-05 — Hybrid mobile navigation with a non-failable five-tab base.**  
`Trip · Itinerary · Map · Guide · Split` remains the stable, always-available navigation model.
The default/fallback presentation is a conventional five-tab bottom bar. Approved immersive
surfaces may present the same destinations as a compact/floating dock to free content space,
but the dock is enhancement only: no gesture-only dependency, no changed order/meaning, and
any accessibility, browser, viewport, reduced-motion, or implementation uncertainty falls
back to the standard bottom bar.

**D6-06 — Responsive hero siblings; desktop is the showcase surface.**  
Waypoint uses one Atlas/cover concept with different responsive compositions. Mobile and tablet
prioritize field operation: focused Atlas, immediate trip context, pinned-area shortcuts, and
minimal chrome. Desktop may be substantially more expressive because it is primarily a planning,
sharing, and newcomer-facing surface: a large stylized globe/Atlas, richer spatial transitions,
destination imagery, pinned places, and simultaneous trip context may coexist when they remain
fast, legible, and navigable. This is not a separate product and never changes factual content
or destination meaning by width.

Desktop spectacle must demonstrate Waypoint's specificity rather than imitate generic AI
aesthetics. Geographic continuity, real trip structure, verified information, destination
identity, and evidence are the differentiators. Mobile field priority still wins any conflict.

**D6-08 — Modern atlas globe: flat-first, minimally dimensional.**  
The Atlas globe is not photorealistic Earth and should sit very close to a flat illustrated
atlas. It reads as designed cartography first: simplified geography, crisp coastlines, restrained
terrain cues, Night Navy + Amber radar/cartographic identity, and almost no atmospheric or faux
3D rendering. Only enough dimensionality is retained to make rotation, orientation, and
globe→region→city transitions spatially legible. Avoid satellite realism, glossy sphere shading,
game-engine Earth, generic AI travel imagery, decorative gradients, and excessive card chrome.

**D6-09 — Visual Composer changes presentation, never truth.**  
After research and semantic structuring, a Visual Composer may split, shorten, reorder within
approved information hierarchy, and rewrite narrative copy for clarity. It may select only
sanctioned Waypoint composition families/components and emit layout intent rather than HTML/CSS.
It may not invent, delete, reinterpret, weaken, or silently summarize away researched facts,
warnings, uncertainty, provenance, or traveler constraints. Semantic fact IDs and provenance
survive composition unchanged. Build/render gates reject unsupported composition intent rather
than guessing.

**D6-10 — Guide organization is location/time first, with anchor-aware exceptions.**  
Waypoint Guides should default to organizing major chapters by geography and travel sequence,
because place and time are the most stable wayfinding frame across destinations. Strong traveler
anchors (events, non-negotiable interests, or unusually deep priorities) may earn their own
featured chapter or cross-location collection when their semantic weight warrants it. Korea is
the prototype for this hybrid: Seoul, Daejeon, and Busan provide the geographic spine while MSI,
Pokémon GO, food/shopping, and other high-value interests are composed within or across those
places rather than forcing the whole Guide into interest-first categories. The Visual Composer
must preserve cohesion and avoid duplicating content that belongs canonically in Trip, Itinerary,
Map, or Split.

**D6-11 — Guide opens to overview by default; active trips may resume relevant place.**  
The Guide destination defaults to the destination overview (for Korea: the Korea overview with
Seoul, Daejeon, Busan, and Essentials entry points). During an active trip, Guide may instead
resume the traveler’s relevant/current chapter when strong trip context exists, such as the
active itinerary day, current trip segment, or the traveler’s last Guide location. This is a
contextual convenience, not a different information architecture. The overview remains one tap
away and is the canonical default before travel, after travel, on first entry, or when context is
ambiguous. Do not require GPS/location permission for this behavior; itinerary/trip state and
explicit user navigation are sufficient.

On mobile, only one local Guide-navigation level is persistently visible at a time. Global
navigation remains Trip · Itinerary · Map · Guide · Split; deeper clusters are exposed through
content and direct links rather than stacked tab bars.

**D6-12 — Retire decorative country commentary pills and Guide rail primacy.**  
Guide surfaces must not use free-floating descriptive/commentary pills merely to add personality,
mood, or AI-written characterization. Compact chips remain valid only when they encode actionable
state, filters, categories, or other information that earns the space. Destination voice should
come from imagery, typography, geography, researched prose, and composition—not decorative
micro-commentary.

The existing Guide spine/rail is no longer the canonical navigation metaphor. It assumes a
largely linear journey through many stations, while the new Guide model is geography/time first
with progressive disclosure, anchors, and direct deep links. Mobile must not carry a persistent
multi-station rail. Desktop may use a more expressive thematic/spatial chapter index, but the
exact replacement is a visual-design decision to validate in polished Korea mockups. Whatever
replaces the rail must preserve orientation, direct access, keyboard/accessibility support, and
deep linking without reintroducing tab/pill clutter.

**D6-13 — City chapters are map-forward on desktop and map-assisted on mobile.**  
For geography-rich Guide chapters, desktop opens into a synchronized split composition: a
persistent spatial map occupies roughly half the canvas while the adjacent content pane presents
the city's itinerary context, semantic clusters, and selected-place detail. Map pins, clusters,
filters, itinerary references, and content selection are one shared state; selecting either side
updates the other. This is inspired by proven map+itinerary planning patterns but remains
Waypoint-specific through semantic clustering, verified context, and destination identity.

Mobile does not shrink the desktop split view. It uses a concise city landing (the approved
location-landing model) with a compact map hero showing pinned geography plus clear cluster/activity
entry points below. The traveler can expand into a full-screen Map or switch to a list/cluster
view, but the landing itself preserves orientation and decision support. Avoid pin-only overload,
stacked navigation bars, and requiring the user to interpret a dense map before meaningful
choices are visible.

**D6-14 — Guide clustering defaults to hybrid, with constrained alternate organization views.**  
The Visual Composer may organize a Guide chapter using one of a constrained set of strategies:
location, date/itinerary sequence, traveler interest, or a hybrid of those. Hybrid is the default
because geography provides durable orientation while itinerary and traveler intent can refine the
cluster label and ordering. Strong anchors may override the default when they are genuinely
load-bearing.

Desktop may expose alternate organization views such as By location, By date, or By interest
when the content supports them. These are alternate projections of the same semantic objects, not
duplicated content or separate taxonomies. Mobile should usually show the single best-composed
projection at a time, with optional lightweight switching only when it clearly improves wayfinding.
The Composer may choose the default per guide/chapter, but it may not invent arbitrary categories
outside the sanctioned strategies.

**D6-15 — Personalization is local-first; shared state is explicit.**  
Presentation preferences such as Guide lens, map/list mode, last chapter, and pinned areas/places
are stored locally per device and per guide. They require no account and do not enter Firebase.
The canonical Guide structure remains Composer-owned; visitors personalize projections, not truth.

**D6-16 — Firebase is for intentionally shared trip state only.**  
Trip Split remains guide-specific; the proposed guide-independent General Split is rejected.
Firebase is reserved for state the travel party intentionally shares for a specific trip.
Individual presentation preferences remain local to the device/browser. Existing guide room
identity and historical shared data must never be rotated or migrated silently.

**D6-17 — Retire voting, Trip Kit, and shared-readiness concepts; keep Trip Learnings distinct.**  
Waypoint does not carry a group-voting feature, a generic Trip Kit surface, or a shared-readiness
system. Do not resurrect these concepts under new labels during implementation.

Trip Learnings remains a distinct traveler-facing surface/tab for the trip's reality layer. It
collects and tallies actual issues, gripes, misses, friction, and Plan-versus-Actual observations
from the trip, then presents them as a coherent post-trip record. Learnings may use Firebase for
shared trip feedback, but it is not the same thing as technical client-error reporting.

Technical error reporting, where retained, is infrastructure only: it records app failures for
maintenance and must never appear as trip feedback, traveler learnings, or itinerary content.

**D6-18 — Every guide carries an always-present Trip Learnings notebook.**  
Trip Learnings exists for every guide from birth, even when it has no entries. Its empty state is
an invitation to submit feedback rather than an absent feature. The interaction should feel like a
shared station notebook: lightweight, personal, chronological, and easy for any traveler using the
trip to add to.

Submissions may record gripes, issues, misses, surprises, things that worked, route or timing
problems, and Plan-versus-Actual observations. The surface may tally recurring themes and summarize
patterns as entries accumulate. Raw notebook entries and their tallies are shared trip state and may
use Firebase.

Trip Learnings is distinct from researched Guide truth. User submissions must never silently alter,
override, or weaken canonical researched content. They can inform later review and guide revision,
but any promotion into the researched Guide requires the normal verification/content pipeline.

**D6-19 — Prototype Trip as the lifecycle-aware “what matters now” surface.**  
For the Korea prototype, Trip is the lifecycle-aware operational surface rather than a dashboard or
duplicate itinerary. Before travel it surfaces only material upcoming actions and deadlines; during
travel it prioritizes Now → Next → Leave by → Get there → material warning/problem → relevant
fallback → remainder of the day; after travel it becomes a concise trip outcome/recap gateway into
Plan-versus-Actual and Trip Learnings.

Itinerary remains the complete schedule and inspection surface. Trip must not become a second copy
of the itinerary or a card dashboard of weather, budget, reminders, and tools. This direction is
provisional pending polished Korea mockups; if visual testing reveals a materially stronger model,
D6 should be revised rather than preserving the prototype by inertia.

**D6-20 — Itinerary is day-first on mobile and a temporal-spatial workbench on desktop.**  
Mobile keeps a day-by-day, swipeable/snap-based itinerary rhythm: one day is the primary unit,
with compact day navigation and direct access to stops, timing, route handoff, warnings, and
Plan-versus-Actual. It must not become a shrunk desktop planner.

Desktop treats itinerary as movement through space over time. The primary composition is a
temporal-spatial workbench: a substantial interactive map synchronized with a schedule/timeline
pane and a compact trip/day selector. Selecting a day draws that day's ordered stops and route;
selecting a stop highlights its time, sequence, constraints, and place context in both map and
timeline. The map may expand/contract with task focus rather than remaining a decorative fixed
half-screen.

The Itinerary map is intentionally different from the global Map destination:
- Map answers “what is where?” and supports broad spatial exploration.
- Itinerary answers “where am I going, in what order, and when?” and visualizes route/time
  relationships.
Both project the same canonical places and trip data; neither duplicates them.

Desktop may support trip overview, focused-day, and selected-stop states within this one
workbench, but these are views of the same itinerary rather than separate modes with divergent
content.

**D6-21 — Desktop spatial workspaces use responsive, user-adjustable panes.**  
Desktop Map and Itinerary compositions must not hard-code a permanent 50/50 split. Where a map
shares the canvas with itinerary, Guide, cluster, or place detail, the panes should behave like a
modern application workspace: responsive to available width, user-resizable where practical, and
able to collapse/expand without losing the underlying state. The system should preserve sensible
minimum widths, keyboard/accessibility behavior, and a recoverable default layout rather than
allowing unusable pane sizes. Intermediate widths may automatically rebalance or stack when a
split composition no longer serves the task.

**D6-22 — Responsive hybrid is the default interaction model, not the exception.**  
When one semantic object is reached from different device classes or contexts, Waypoint should
prefer responsive sibling treatments over separate product concepts. Mobile may use sheets,
focused pages, and progressive disclosure; desktop may use side panes, persistent spatial context,
and richer simultaneous views. The underlying object, actions, facts, and identity remain the
same. A fixed single-mode treatment should be chosen only when responsive adaptation would make
the interaction less clear, less accessible, or materially less reliable.

Canonical place detail follows this rule: mobile opens a useful bottom sheet that can expand into
full detail; desktop opens a contextual side pane that preserves Map/Itinerary context and can
promote into the full editorial detail surface when needed.

**D6-23 — Evolve the existing Waypoint palette; do not replace it with a new mockup theme.**  
The current repository design system remains the visual foundation. Light mode keeps its
cream/sage-tinted cartographic paper character rather than moving toward generic white UI.
Dark mode keeps its warm charcoal/chart-room base and may become more explicitly black-adjacent
and cartographic in composition, but should not become glossy cyberpunk, neon, or generic
AI-dashboard styling. The established oxide/orange accent remains the primary identity accent;
future tuning should stay close to the current Waypoint pigment rather than adopting a louder
synthetic orange from generated mockups.

Typography remains the established Literata Variable + Atkinson Hyperlegible Next system unless a
separate typography review proves a concrete problem. Generated mockup font substitutions are not
design authority.

Future visual work should give photography and primary actions substantially more authority:
destination imagery may occupy larger, more deliberate regions; primary buttons should be easy to
find and feel tactile without turning every action into a filled CTA. Secondary controls, chips,
and metadata remain restrained. Light and dark modes are responsive siblings of one identity, not
two unrelated themes.

**D6-24 — Search is context-first and universal.**  
Waypoint has one global Search experience rather than separate per-guide and site-wide search
systems. When invoked from an active/current trip, results from that trip are ranked first:
places, itinerary entries, Guide content, neighborhoods/clusters, and other trip-specific
objects. Broader Waypoint results may follow as secondary results. From Atlas/Home or without a
clear active trip, Search is global by default.

Search should feel like ordinary travel search, not a developer command palette. Results are
grouped by traveler-facing object type such as Places, Itinerary, Guide, and Other trips, and
deep-link to the same canonical semantic objects used by Map, Guide, Trip, and Itinerary.

**D6-25 — SOS is a layered emergency sheet with immediate actions first.**  
SOS remains a global action, not a destination tab. Its first layer presents only immediate
emergency actions with large, unmistakable controls: call police, call ambulance/fire, and show
the traveler’s current/base address or location context when available. A second, clearly
separated urgent-help layer may expose nearest hospital/urgent care, embassy or consulate,
lost-passport guidance, trip base/hotel address, insurance/contact details when explicitly
provided, and critical local phrases.

SOS must not become a generic help dashboard or Tools drawer. Core emergency data and actions must
remain available offline wherever the guide can reasonably provide them. Mobile should use a
dominant full-height sheet with large targets; desktop may use a modal/side sheet but must preserve
the same hierarchy and urgency.

**D6-26 — Ship semantic travel objects now; keep them knowledge-graph-ready.**  
The pre-October implementation uses pragmatic semantic travel objects rather than a full
knowledge graph. Research emits typed objects and verified facts; the Visual Composer organizes
those objects; renderers project them into Trip, Itinerary, Map, Guide, Search, Split-adjacent
context, and other approved surfaces.

This semantic layer must nevertheless be designed for future graph evolution: stable object and
fact IDs, explicit object type, normalized geography, canonical relationships/references instead
of copied facts, preserved provenance/freshness, and machine-readable exports. Avoid coupling the
data model to current page sections or presentation components when the same concept can be named
semantically.

A post-October knowledge-base/graph phase may add richer relationships, cross-trip entities,
entity resolution, semantic retrieval, and agent-facing query/export interfaces. That future
system should remain portable and should not depend on any one vendor's conversational-memory
feature as its source of truth. Waypoint's verified knowledge remains the authoritative substrate;
AI memory/retrieval systems may consume it.

**D6-27 — Trip Learnings is a dedicated notebook surface inside Trip.**  
Trip Learnings does not become a sixth global destination. The global navigation remains
Trip · Itinerary · Map · Guide · Split. Learnings lives inside Trip as a distinct notebook/reality
surface that can be opened directly at any lifecycle stage. During travel it remains easy to add
notes, gripes, issues, surprises, and Plan-versus-Actual observations; after travel it becomes more
prominent as part of the trip outcome/recap experience.

This placement keeps lived trip experience separate from researched Guide knowledge while avoiding
permanent global-nav expansion. The notebook remains independently deep-linkable and visually
distinct rather than being reduced to a collapsed subsection.

**D6-28 — Atlas is restrained immersive, leaning minimal; mobile is stricter still.**  
Atlas uses the restrained-immersive direction but deliberately leans toward the minimal end of the
spectrum. The globe remains the dominant visual and interaction surface. Supporting navigation,
search, trip previews, and actions float around it only when useful and must not compete for equal
visual authority.

Desktop may use sparse floating/translucent controls over the survey/topographic ground, but avoids
a permanent conventional sidebar or dashboard framing. As the traveler zooms inward, nonessential
UI progressively recedes so geography and pins become the interface.

Mobile is more aggressive about space: the globe should consume most of the viewport, persistent
supporting UI is minimized, and destination/detail surfaces appear contextually rather than stacking
around the globe. The five global destinations remain reliably reachable, but Atlas-specific chrome
must stay compact. Progressive pin disclosure remains country/trip at world scale, city at country
scale, and place/anchor at deeper spatial scales.

**D6-29 — Image-forward composition, compressed text density, and context-correct actions.**  
Where a destination/place/event has useful verified photography, imagery should carry more visual
authority than in the current shipped UI. Prefer a prominent hero or lead image, then compress
supporting copy into concise, scannable facts and actions. Avoid dead whitespace and long prose
blocks when a photograph, map fragment, icon, timeline marker, or other semantically useful visual
can communicate orientation faster. Decorative imagery and icon clutter remain out of scope:
visuals must identify a place/event, show geography/state, or improve action recognition.

For finalized or in-progress trip plans, discovery surfaces must not offer generic `Add to plan`
actions for items that already belong to the canonical itinerary. Use context-correct actions such
as `View in itinerary`, `Navigate`, `Details`, or a deliberately framed replacement/swap action
when the traveler is considering an alternative. `Add to itinerary` remains valid only for a real,
currently-unscheduled candidate. Action labels must reflect the object's actual semantic state.

**D6-30 — Pre-trip Trip view blends priority, checklist, and timeline cues without becoming a planning dashboard.**  
Pre-trip Trip may combine a strong destination hero, a short priority stack, compact readiness/checklist
status, and lightweight countdown/timeline cues. The intent is not to build a heavy pre-trip
management system: only unresolved or time-sensitive actions receive strong emphasis, completed
items collapse into concise readiness summaries, and full planning detail remains in the Guide or
Itinerary where it belongs.

Because Waypoint is currently primarily owner-used rather than a high-frequency multi-user planning
product, the pre-trip surface should stay intentionally modest and easy to evolve. It must prove the
lifecycle model without creating new permanent complexity that the traveler does not yet need.

### Unresolved

These are deliberately **not** inferred from previous iterations. Carlo will resolve them one
at a time after evidence/recommendation review:

- persistent mobile chrome behavior (including yielding/scroll-reactive chrome);
- whether Split remains top-level after its dedicated utility review;
- panel drag/reorder;
- story-mode itinerary;
- global swipe navigation;
- yielding/scroll-reactive chrome;
- final geometry/radius system;
- provenance/verification visual treatment;
- role of Painted Atlas/living covers and ambient motion;
- cartographic ornament versus functional geography;
- command palette versus traveler-facing global Search;
- component/pattern cull and migration order.

Until a decision is recorded, current behavior may remain shipped but is **not automatically
future design law**.
