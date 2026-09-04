# Waypoint Design Authority

Status: **SOLE DESIGN AUTHORITY — FROZEN FOR SEPTEMBER IMPLEMENTATION**  
Owner: Carlo  
Last reconciled: 2026-09-04

This file is the one and only human-readable authority for Waypoint visual design, interaction design, responsive composition, motion, surface hierarchy, and visual acceptance. It consolidates the completed D1–D6 work, the final late-review decisions, the useful lessons from prior handoffs/mockups/research, and the correction made after the first D7 implementation drifted visually.

No other design document, handoff, prototype, screenshot, mockup, research packet, archived plan, PR description, issue comment, component registry entry, or shipped legacy behavior may override this file.

`PRODUCT.md` remains product-purpose and factual capability doctrine. `src/styles/base.css`, breakpoints, production components, tests, and `docs/reference/component-registry.json` are executable implementation/conformance artifacts, not separate design authorities. When implementation disagrees with this file, the implementation is debt unless a genuine feasibility, accessibility, truth, or field-use blocker is demonstrated.

Git history is the archive. Do not preserve superseded design prose in the live tree merely for archaeology.

---

## 1. North star

Waypoint is a **field-first travel command center** backed by verified travel knowledge. It should feel like a modern boutique travel product with airline-grade operational precision and field-journal warmth.

The traveler on the street wins every tie: one hand, bright light, poor signal, fatigue, time pressure, unfamiliar geography. Desktop can be richer and more expressive, but it cannot create a different product or weaken the mobile field experience.

Four design properties are non-negotiable:

- **Verified:** important facts remain traceable to evidence/date.
- **Personal:** the trip and traveler context determine priority.
- **Actionable:** the next useful action is obvious.
- **Honest:** missing, stale, uncertain, offline, and degraded states never pretend to be complete/live.

The UI must not expose pipeline, agent, gate, register, or implementation vocabulary to travelers.

---

## 2. Information architecture and launch behavior

The stable primary traveler destinations are, in this order:

**Trip · Itinerary · Map · Guide · Split**

This order and identity do not adapt, reorder, or promote themselves based on usage.

Global infrastructure:

- **Atlas** — world/trip entry surface; always one obvious action away.
- **Search** — context-first universal search; never a destination tab.
- **SOS** — quiet global emergency utility; never a destination tab.
- **Learnings** — a distinct, deep-linkable notebook/reality surface inside Trip; never a sixth global destination.

Launch defaults:

- no materially active trip → **Atlas**;
- materially active mid-trip → **Trip**;
- Atlas remains one obvious action away in either case.

Explicitly retired: generic Tools/More, adaptive/promoted nav, Story Mode, top-level swipe navigation, panel drag/reorder as a user feature, Trip Kit, voting/collaboration creep, shared-readiness dashboards, command-palette framing, and a sixth Search/SOS/Learnings tab.

---

## 3. Responsive model

Waypoint uses **responsive sibling compositions**. Mobile is not compressed desktop; desktop is not enlarged mobile.

Rules:

1. Mobile is designed first for field operation and thumb reach.
2. Desktop earns width by revealing relationships, spatial context, comparison, and editorial identity.
3. Intermediate/tablet widths are first-class, not interpolation accidents.
4. Components respond to the space they receive; avoid brittle device-name branches.
5. Dense information relocates, scrolls locally, or progressively discloses rather than shrinking into illegibility.
6. Width alone must not silently remove a capability.
7. Safe areas are part of layout.
8. 320px reflow is the safety floor.
9. Long names, CJK/multilingual strings, 200% text enlargement, landscape phones, split-screen, keyboard, touch, reduced motion, dark mode, offline state, and missing data are acceptance cases.
10. Important field controls should be approximately 44×44 CSS px where practical.

Mobile may use focused pages and sheets; desktop may use contextual side panes and simultaneous map/content. They project the same canonical object/state.

---

## 4. Visual identity

### Ground and palette

Use the executable Waypoint palette; do not resurrect the superseded “Night Navy & Amber” phrase as permission to re-theme the product.

Current core direction:

- light ground: `#e3e7dc`;
- sunken ground: `#ced5c4`;
- card/working surface: `#fbfcf6`;
- ink: `#0f141a`;
- oxide accent: `#9c4421`;
- dark mode: existing warm charcoal/chart-room family, black-adjacent where useful, never cool blue-gray/cyberpunk.

Exact production values come from the token system. Do not create one-off call-site colors.

### Typography

- **Literata Variable** — editorial/display/reading voice.
- **Atkinson Hyperlegible Next** — operational/data/control voice; tabular numerals where useful.
- Preserve robust system/CJK fallbacks. Korean/Hangul must never render as tofu because the Latin house font lacks glyphs.
- No third house family without an explicit design change.

### Composition

Use four default composition grammars:

- **Editorial:** destination identity, culture, photography, narrative context.
- **Operational:** schedules, transit, prices, warnings, state, settlement.
- **Spatial:** map/place/route relationships with synchronized textual context.
- **Focused action:** one immediate task with minimal competition.

Cards/panels are tools inside these grammars, not the universal page canvas. Avoid “card soup.”

### Imagery

Useful verified imagery should carry substantially more visual authority than the old shipped UI. Prefer recognizable destination/place/event photography, map fragments, semantic icons, and timeline/route graphics that improve orientation.

Do not use decorative stock-like travel imagery, generic AI gradients, invented local symbolism, or icon clutter. A visual must identify, orient, encode state, or improve action recognition.

Strong destination imagery belongs mainly in Atlas, Guide openings, Trip heroes, and selected place/event moments. Operational facts remain on readable Waypoint working surfaces rather than busy photos.

### Density

Do not fill unused space by adding widgets. Increase the size/prominence of information already judged important before adding more information. Avoid both dead space and miniature dashboard typography.

---

## 5. Global shell and navigation

The shell must feel integrated with the product, not like a generic administration dashboard.

Mobile:

- stable five-destination bottom bar is the non-failable baseline;
- immersive surfaces may use the same destinations in a compact/floating treatment if accessibility/browser/reduced-motion conditions remain safe;
- chrome may yield while scrolling/zooming but must remain immediately recoverable;
- no gesture-only navigation and no hidden changed ordering.

Desktop:

- do **not** use a permanent flat conventional sidebar as the default shell;
- use an integrated/floating inline destination treatment around the readable working surface;
- Atlas stays obvious; Search is prominent; SOS stays globally reachable;
- chrome can become quieter with context/scroll but must not become mysterious or reorder itself;
- dense operational content sits on an opaque/readable working surface. Glass is not required and must not reduce readability.

The exact desktop shell compaction behavior is the principal remaining visual choice to pin in creator review; see §24.

---

## 6. Atlas

Atlas is the spatial front door, not a trip dashboard.

- restrained immersive direction, leaning minimal;
- globe/map is dominant;
- flat-first illustrated cartography with simplified geography, crisp coastlines, restrained terrain/topographic cues, almost no faux 3D atmosphere;
- enough dimensionality for rotation/orientation and globe→region→city continuity, not satellite realism or a glossy game-engine Earth;
- progressive disclosure: trip/country at world scale → city → place/anchor deeper in;
- controls recede as geography becomes the task;
- no synthetic “On Track/Off Track” trip-health scores.

Desktop can be the showcase: large spatial field, sparse floating controls, real trip structure/pins. Mobile is stricter: geography should consume most of the viewport and supporting UI appears contextually.

---

## 7. Trip — “what matters now”

Trip is the stable lifecycle destination. It is **not** a second itinerary and not a generic dashboard.

### Pre-trip

Use a strong but restrained destination hero plus a short stack of real unresolved/time-sensitive priorities, compact readiness/checklist summary, and lightweight countdown/timeline cues. Completed items collapse. Do not build a heavy planning dashboard or synthetic readiness score.

### Active trip

The deterministic priority order is:

1. **Now**
2. **Next**
3. **Leave by**
4. **Get there**
5. material problem / uncertainty
6. relevant fallback
7. remainder of the day

This should read like mission control: one dominant next-step object, large structured operational atoms, route/proximity context, useful imagery, and state-correct actions. Do not reserve space for Travel Party, generic Quick Actions, Saved, generic readiness widgets, or “Add” merely because space exists.

### Arrival/transit

Current-step autopilot dominates, with the next two steps compressed but visible. Dense is allowed when useful, but use structured time/location/transit/platform/exit/cost/address/ticket/warning/fallback atoms rather than prose walls.

### Post-trip

Lead with destination imagery and a concise editorial recap, then a few meaningful outcome atoms and major Plan-vs-Actual changes. No analytics dashboard. Flow naturally into Learnings.

### Learnings / feedback

Learnings is always present inside Trip and remains distinct from verified Guide truth. User notes never silently rewrite researched facts.

Trip Feedback remains a fast three-step flow:

1. Overall / Pace / Food ratings;
2. Plan-vs-Actual stop review (prefilled when safe, focus on changed/skipped/uncertain first, Went/Skipped, optional skip reason);
3. private reflection with lightweight prompts.

Save progress; use large controls; invite after completion without a blocking forced modal; allow later reopening from Learnings.

---

## 8. Itinerary

Itinerary is the complete schedule/inspection surface.

### Mobile

Preserve the approved SCRL-like day-by-day behavior:

- one day is the dominant unit;
- large, scan-friendly timeline atoms;
- contextual recognizable imagery without displacing the timeline;
- transit legs, times/windows, cost, warnings/restrictions, route handoff, and Plan-vs-Actual remain directly accessible;
- day switching belongs in the thumb zone via a rail/scrubber; tap and contextual adjacent-day swipe are valid;
- top arrows may be secondary, never the primary switcher;
- no generic day-level `Done` button; use a real contextual route/ticket action or leave the slot empty.

Flexible time windows are first-class; do not force every stop into an exact clock time.

Branched-party days are first-class. Mobile renders parallel branches as comprehensible sections, not miniature lanes, and allows reconvergence at shared anchors.

### Desktop

Use a temporal-spatial workbench:

- timeline/day plan on the **left**;
- real interactive map on the **right**;
- user-resizable panes with sensible minimums and a recoverable default;
- expected working range approximately 30–70%, not a hard 50/50 lock;
- selection synchronizes timeline, route, stop and map context;
- contextual place detail should not force the traveler out of the day view;
- panes may expand/collapse as temporal vs spatial focus changes;
- intermediate widths may rebalance/stack.

The desktop workbench should feel spatial/kinetic, not wallpaper-heavy or like a spreadsheet dashboard.

Motion is part of the behavior: day/stop changes, map focus, route highlighting and pane changes preserve spatial-temporal continuity. Reduced motion keeps all state changes without choreography.

---

## 9. Map

Map answers **“what is where?”** and is a spatial workspace, distinct from Itinerary’s **“where am I going, in what order, and when?”**.

- normal configured connected state uses the real Google Maps integration;
- OSM remains visible/usable until Google has actually initialized and remains the fallback if Google is absent/fails;
- never blank the map mount because an SDK failed;
- only canonical verified coordinates create pins;
- live routing/traffic/turn-by-turn belongs to Google/native provider handoff; Waypoint may show coarse researched timing such as `≈30 min · check live`;
- retain a verified native-provider fallback where materially needed (e.g. Naver where Google lacks parity).

Lifecycle framing:

- pre-trip → trip-wide spatial view;
- active → current city/area + nearby context;
- post-trip → completed trip-wide review.

Mobile: map owns nearly the viewport with a contextual bottom sheet that can grow.  
Desktop: large map with contextual inspector/side pane.  
Layers/lenses are contextual rather than permanent clutter.

A static/gallery test environment that cannot render the external map must still show a meaningful intentional degraded/map fallback state, not a giant unexplained blank rectangle.

---

## 10. Guide

Guide is editorial discovery + structured utility, organized primarily by **location and time**.

- large destination cover/hero, especially on desktop; do not shrink it merely to squeeze modules above the fold;
- geography/travel sequence is the durable spine;
- strong traveler anchors (event, non-negotiable interest) may earn featured treatment without forcing the whole Guide interest-first;
- overview is canonical default; active-trip context may resume a relevant chapter, but overview remains one action away;
- on mobile only one local Guide-navigation level is persistently visible at a time;
- retire the legacy multi-station Guide rail/spine as the main navigation metaphor;
- no decorative country-commentary pills.

City/location chapters:

- desktop is map-forward with synchronized map + content/selection;
- mobile is map-assisted, not a shrunk desktop split;
- use imagery and semantic clusters to orient before dense reference detail.

Place/event reference:

- recognizable useful image;
- high-value operational facts/warnings before deeper prose;
- dense reference layer (hours, cost, restrictions, transit, booking, provenance/freshness) available progressively;
- direct continuity to Map/Itinerary/navigation.

Knowledge modules:

- canonical practical How-To/transit/etiquette/culture modules are authored once;
- explicit deterministic metadata links them to relevant day/place/event objects;
- contextual surfacing is sparse, normally no more than one or two high-value links per day/step;
- no runtime model guessing relevance;
- do not turn Guide or Itinerary into an SEO/article feed.

Avoid generic wiki/blog feeds, ratings/review clutter, anonymous popularity scores, affiliate hierarchy, and AI “local flavor” unsupported by evidence.

Desktop chapter cards/titles must retain normal readable word wrapping; letter-by-letter wrapping is a hard visual failure, not an acceptable baseline.

---

## 11. Split

Split remains the trip-specific budgeting/bill-splitting tool and a top-level destination.

Final hierarchy (this supersedes the older balance-first experiment):

1. **Recent Expenses**
2. **Add Expense** — immediately visible/reachable
3. per-expense split method and participant state
4. balances / who-owes-who / settlement as secondary state

Fast add asks only:

1. who paid;
2. what it was for;
3. how much;
4. who shares it.

Every expense row exposes its split method without opening it: `Even`, `Exact`, `Shares`, or `%`.

Preserve the existing math/state, currencies, recorded payments, undo, search/filter and trip-specific sync. Optional category/note/rate/receipt/context stays secondary. Use semantic icons; do not fetch/generate expense photos unless linked to a canonical place that already owns a verified image.

No Decisions tab, voting, invite/travel-party dashboard, broad budget analytics, or collaboration creep.

---

## 12. Search

One global traveler-facing Search implementation.

Desktop:

- prominent persistent global field in utility chrome.

Mobile:

- expanded field at the top;
- compact recoverable sticky access while scrolled;
- focused overlay/sheet on activation.

Behavior:

- current trip first, then broader Waypoint;
- grouped by real canonical object type (e.g. Places, Itinerary, Guide, Other trips);
- deep-link to the exact canonical destination/day/place/Guide object;
- dismissal restores exact prior page/context/scroll;
- `/` and Cmd/Ctrl-K may be shortcuts, but the experience must not look/feel like a developer command palette;
- no AI-chat answer engine, fake recent-search content, popularity modules, voice/scan controls, or unsupported categories.

---

## 13. SOS

SOS is deliberately simple global infrastructure.

When opened, prioritize verified emergency phone numbers with direct `tel:` links, useful verified emergency/travel-help links already supported by the guide, and concise location/base/address context only when Waypoint already has it and it materially helps.

Core emergency numbers remain baked in/offline. Controls are large and unambiguous.

Do not build symptom triage, proactive emergency assistance, category dashboards, responder orchestration, “help request sent,” automatic group sharing, or a generic help center.

---

## 14. Provenance, freshness and degraded states

Ordinary verified facts stay visually calm. Use a quiet provenance affordance with deeper source/date/freshness/uncertainty detail on demand.

Escalate when decision risk changes:

- stale/uncertain → visible warning;
- conflicting/high-consequence → stronger treatment;
- safety/closure/restriction → never hidden behind decorative disclosure.

No citation wall and no synthetic trust score.

Offline/degraded state must keep written routes/addresses/emergency/core Guide facts usable. Missing media/map/live service must not leave a dishonest blank or fake “live” state.

---

## 15. Semantic content and Visual Composer

Ship semantic travel objects now; remain knowledge-graph-ready later.

Use stable object/fact IDs, explicit types, normalized geography, canonical relationships instead of copied facts, and preserved provenance/freshness.

A Visual Composer may change **presentation** only: split, shorten, order within approved hierarchy, choose sanctioned composition grammar, and rewrite narrative copy for clarity. It may not invent/delete/reinterpret/weaken a researched fact, warning, uncertainty, provenance, or traveler constraint. One fact/object can project to many surfaces; truth is not duplicated for visual convenience.

No runtime model is needed to decide routine relevance that Composer metadata can determine.

---

## 16. Motion

Motion explains where something went, what changed, or how states relate.

- routine transitions are fast, interruptible, and subordinate to task (roughly 150–350ms where a timed transition is appropriate);
- prefer shared/spatial continuity when it preserves orientation;
- no scroll hijacking;
- top-level destinations remain tap-driven;
- swipe/drag is contextual: itinerary days, sheets, galleries, maps/globe;
- geographic fly/focus is a signature only when it adds orientation;
- continuous motion must encode live meaning or have an explicit exception;
- motion should normally use transform/opacity rather than layout-thrashing animation;
- reduced motion supplies a complete usable state.

No cinematic Story Mode replacement.

---

## 17. Accessibility and field resilience

WCAG 2.2 AA is the binding floor plus Waypoint’s stricter field-use bar.

Acceptance covers:

- outdoor/glare legibility;
- important ~44px targets;
- keyboard/focus semantics;
- touch/coarse pointer;
- critical state not conveyed by color alone;
- 320px reflow;
- long/CJK/multilingual strings;
- 200% text enlargement;
- tablet/intermediate widths;
- safe areas;
- dark/light themes;
- reduced motion;
- offline/degraded behavior;
- conservative media/low bandwidth;
- print support without making screens print-first.

A beautiful screen that fails these conditions is rejected.

---

## 18. Explicit anti-patterns / retired lineage

Do not reintroduce these without a new explicit creator decision backed by evidence:

- generic Tools/More destination;
- adaptive/reordered primary navigation;
- global swipe between top-level destinations;
- Story Mode / Play-the-trip cinematic overlay;
- persistent Guide rail/spine;
- Trip Kit;
- voting/shared-readiness/travel-party dashboards;
- generic Quick Actions/Saved widgets on active Trip;
- command palette as Search identity;
- panel drag/reorder as a product feature;
- generic Add/Add-to-plan actions for objects already in the canonical itinerary;
- synthetic trip-health scores;
- card soup / equal-weight dashboards;
- decorative commentary chips;
- faux maps or fake live ETA/traffic;
- unverified ratings/review counts;
- fake people, amounts, dates, statuses, places, controls, or integrations added to make a mockup look complete;
- generic AI travel aesthetics.

---

## 19. Context-correct action language

For objects already in the plan, prefer actions such as:

- `View in itinerary`
- `Navigate`
- `Details`
- `Swap` / deliberately framed alternative action

Use `Add to itinerary` only for a genuine unscheduled candidate. Do not show `Add to plan` merely because a discovery template once had it.

---

## 20. Creator-approved visual target set recovered from D6 review

These are the visual/compositional targets the implementation must converge toward. The original ChatGPT raster bytes were not durably committed; that storage failure must not turn the D7 implementation into permission to invent another aesthetic. The written composition below is binding. Future raster/reference captures are review evidence, not a second authority.

### Active Trip — mobile

- South Korea fixture;
- dark/warm-charcoal active-now command-center treatment;
- current-place/destination imagery has real authority;
- one dominant Now/Next object with large operational atoms;
- compact, thumb-prudent shell; no dashboard widget grid.

### Itinerary — mobile

- light cream/sage Waypoint treatment;
- SCRL-like one-day-primary behavior;
- large timeline atoms, useful stop imagery, clear route semantics;
- thumb-zone day rail/scrub; Plan-vs-Actual reachable;
- no tiny-arrow-led paging.

### Itinerary — desktop

- dark/warm-charcoal temporal-spatial workbench reference;
- timeline left, large real map right;
- resizable synchronized panes;
- no hard 50/50 and no generic dashboard chrome.

### Map — mobile

- dark spatial-workspace reference;
- map owns nearly the viewport;
- contextual bottom sheet/selected-place atom;
- minimal competing chrome.

### Guide — desktop/landing

- light editorial South Korea landing;
- hero substantially more prominent than the current D7 gallery render;
- recognizable imagery + location/time-first chapter navigation;
- less dead space and less prose density;
- chapter typography remains readable and natural.

### Desktop shell

- integrated/floating inline navigation around the working surface;
- not a conventional flat sidebar;
- Atlas, stable five destinations, Search and SOS remain obvious;
- richer desktop composition without sacrificing readable operational grounds.

### Split

- comparatively compact/direct;
- ledger + fast entry dominate;
- visual polish serves scan speed rather than adding decoration.

These targets are examples in light/dark states, **not** a rule that Waypoint automatically switches theme by destination. Theme remains a coherent product-level user/system state.

---

## 21. Visual fidelity gate

Functional correctness and visual acceptance are separate.

A surface can be functionally green and still be visually rejected.

Before the next broad implementation run:

### V0 — reference preflight

Map the relevant production surfaces to this authority. Identify any code/content constraint that materially prevents the target. Do not invent an alternative silently.

### V1 — two-surface canary

Implement/rework **only**:

1. Active Trip mobile (South Korea fixture)
2. Itinerary desktop workbench (South Korea fixture)

Render representative production screenshots. Compare hierarchy, proportions, density, imagery prominence, navigation character and overall composition against §20. If materially off-target, correct those two before touching the remaining visual sweep.

This exists specifically to prevent another multi-hour model run from spending usage on the wrong visual interpretation.

### V2 — full convergence

Only after the canary is accepted, converge Atlas, Trip lifecycle siblings, Itinerary mobile, Map, Guide, Split, Search/SOS states and shell while preserving the working D7 engineering.

### V3 — paired review

Review production renders at representative phone + intermediate + desktop widths, light/dark where relevant, plus long/CJK/200%-text and degraded-map/image cases.

### Acceptance rule

- creator visual acceptance is required before declaring D7 design-complete;
- screenshot baselines are regression locks, **not design approval**;
- do not regenerate/approve final gallery baselines merely to make CI green;
- baseline only after accepted visuals, then rerun exact-head Required Gate.

Hard visual failures include: letter-by-letter heading wrapping, missing-glyph tofu, unexplained giant blank map regions, weak hero treatment that contradicts the hierarchy, excessive document/prose density on Trip, flat generic shell/sidebar drift, and any reappearance of retired dashboard patterns.

---

## 22. D7 engineering foundation to preserve

The current PR #186 engineering is not throwaway work. Preserve unless a concrete defect requires change:

- five stable destination routing;
- Atlas one action away;
- global Search + SOS;
- one canonical guide-view derivation;
- Trip lifecycle/Now-Next projection;
- mobile day-first Itinerary and desktop resizable workbench behavior;
- Google/OSM fallback architecture;
- deterministic Search ranking/deep-linking;
- Split math/state + fast entry;
- semantic module relations and branched days;
- accessibility/resilience/offline work;
- retirement of Story/Tools/Trip Kit/adaptive-nav/command-palette lineage.

The next implementation pass is **visual fidelity/convergence**, not D8 ideation and not an architecture rewrite.

---

## 23. September implementation path to Main

1. Consolidation/authority cleanup — this file becomes the only design packet; delete superseded design documents/assets from the live tree.
2. Resolve only the genuinely open visual choices in §24.
3. V0 preflight.
4. V1 two-surface canary.
5. Creator review; correct canary until accepted.
6. V2 full visual convergence on top of PR #186 engineering.
7. V3 paired responsive review + field/degraded cases.
8. Explicit creator visual acceptance.
9. Regenerate final CI-native gallery baselines.
10. Exact-head Required Gate green.
11. Merge PR #186 to `main`.
12. GitHub Pages production smoke: Trip → Itinerary → Map → Guide → Split, Search, SOS, workbench resize, mobile nav, map fallback, imagery.
13. Physical-device spot check; reopen frontend only for reproduced defects.

Do not start a new broad design-research round. Research is complete enough for this implementation unless a specific unresolved question below requires evidence.

---

## 24. Decision status / creator grilling queue

All major D6 product/design decisions are settled. The following are the only remaining creator-level visual forks identified during consolidation; ask them **one at a time** before the V1/full-convergence run. Everything else is an implementation or acceptance task, not a reason to reopen design.

### Q1 — Desktop shell compaction behavior

Direction is already settled: integrated/floating inline shell; no conventional flat sidebar; stable destinations; prominent Search; globally reachable SOS.

Need one final choice:

- **A — Floating rail that compacts on scroll/context (recommended).** Full rail at rest; reduces height/visual weight while working; immediately restores on upward intent/focus.
- **B — Floating rail that stays full-height/full-label.** Simpler and more stable; costs more vertical space.
- **C — Fixed inline page header.** Least dynamic and easiest to implement, but gives up some of the immersive desktop character already preferred.

### Q2 — Hero/image aggressiveness

Direction is settled: more useful imagery, less dead space, no brochure excess. Need to pin whether desktop Guide/Atlas should be allowed to devote roughly half-or-more of the opening viewport to imagery/spatial identity when useful, or keep imagery closer to one-third so operational content appears earlier.

### Q3 — Mobile chrome yield strength

Direction is settled: five destinations always recoverable; compact/yielding is allowed. Need to pin whether Map/Itinerary may reduce the bottom bar to a minimal recoverable strip during active map/scroll interaction, or whether labels/icons should remain fully visible at all times.

These choices do not authorize new features. If a later implementation exposes a genuine accessibility/truth/feasibility conflict, surface that conflict with evidence rather than inventing a fourth option.

---

## 25. No further design research is currently required

Existing research and D6 review already support the architecture and visual direction. Additional general Webby/Dribbble/Awwwards/competitor research now has diminishing value and risks reopening settled decisions.

Research only if a concrete implementation question cannot be resolved from this authority, production evidence, accessibility/field evidence, or the actual content fixtures.

---

## 26. Definition of design-complete

Waypoint’s design work is complete for the September program when:

1. production reflects this authority rather than merely satisfying functional selectors/tests;
2. the creator accepts the rendered D6 visual direction;
3. phone/intermediate/desktop, light/dark, CJK/long text, text zoom, reduced motion and degraded/offline states pass;
4. exact-head CI is green after accepted baseline regeneration;
5. PR #186 is merged and production smoke-tested;
6. remaining work is content/reverification or genuine field bugs, not unresolved frontend architecture or another redesign.

Until then, PR #186 is an engineering foundation, not the final accepted redesign.
