# Waypoint Design Authority

Status: **SOLE DESIGN AUTHORITY — FROZEN FOR SEPTEMBER IMPLEMENTATION**  
Owner: Carlo  
Last reconciled: 2026-09-04

This file is the one and only human-readable authority for Waypoint visual design, interaction design, responsive composition, motion, surface hierarchy, and visual acceptance. It consolidates the completed D1–D6 work, the final late-review decisions, the useful lessons from prior handoffs/mockups/research, and the correction made after the first D7 implementation drifted visually.

No other design document, handoff, prototype, screenshot, mockup, research packet, archived plan, PR description, issue comment, component registry entry, or shipped legacy behavior may override this file.

`PRODUCT.md` remains product-purpose and factual capability doctrine. `src/styles/base.css`, breakpoints, production components, tests, and `docs/reference/component-registry.json` are executable implementation/conformance artifacts, not separate design authorities. When implementation disagrees with this file, the implementation is debt unless a genuine feasibility, accessibility, truth, or field-use blocker is demonstrated.

The sole visual companion set lives under `docs/reference/design-system-assets/`. `mockup-manifest.json` identifies the recovered creator-reviewed D6 composition redraws, the selected topic-limited raster decision boards recovered from the creator's conversation archive, and the sanitized canonical gap-coverage board. These files are **supporting figures inside this authority packet, not separate authorities**. If any visual reference conflicts with this Markdown, **this Markdown wins**. No agent may average the selected references with unselected/superseded mockups, component-gallery screenshots, historical design handoffs, or earlier D1–D7 experiments.

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

Desktop compaction is an implementation detail, not a creator fork. Default to a stable full treatment at rest that may subtly reduce visual weight during deep scroll/map/workbench interaction, while remaining immediately recoverable and never changing destination order or identity.

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

- large destination cover/hero, especially on desktop; as a directional composition target it occupies roughly 55–60% of the main content region on desktop where the layout permits and roughly 40–45% of the mobile viewport; do not shrink it merely to squeeze modules above the fold;
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
- activation opens an overlay/panel over the current surface; Search is not a standalone page.

Mobile:

- expanded field at the top;
- compact recoverable sticky access while scrolled;
- activation opens one focused full-height overlay/sheet with appropriate keyboard focus.

Behavior:

- current trip first, then broader Waypoint;
- grouped by real canonical object type (e.g. Places, Itinerary, Guide, Other trips);
- deep-link to the exact canonical destination/day/place/Guide object;
- dismissal restores exact prior page/context/scroll;
- `/` and Cmd/Ctrl-K may be shortcuts, but the experience must not look/feel like a developer command palette;
- no AI-chat answer engine, fake recent-search content, popularity modules, voice/scan controls, or unsupported categories.

---

## 13. SOS

SOS is deliberately simple global infrastructure. It is a global action, never a destination.

First urgent layer:

- Police;
- Fire / Ambulance;
- the traveler’s known location/base only when Waypoint actually possesses it and it materially helps.

Second urgent-help layer may include only verified/supported information: nearest-hospital or urgent-medical guidance, embassy/consulate, lost-passport guidance, hotel/base address, traveler-provided insurance/contact details and critical emergency phrases.

Core emergency numbers remain baked in/offline. Controls are large and unambiguous.

Responsive container:

- mobile uses a dominant full-height emergency sheet;
- desktop uses a modal or side sheet preserving the same urgent-first hierarchy.

Do not build symptom triage, proactive emergency assistance, category dashboards, responder orchestration, “help request sent,” automatic group sharing, or a generic help center.

The product hierarchy is locked, but the final stress-state visual is still open. The unresolved sanity test is whether Police and Fire/Ambulance are immediately obvious and one-tap under stress with every secondary action visibly subordinate.

---

## 14. Provenance, freshness and degraded states

Ordinary verified facts stay visually calm. Use a quiet provenance affordance with deeper source/date/freshness/uncertainty detail on demand.

Escalate when decision risk changes:

- stale/uncertain → visible warning;
- conflicting/high-consequence → stronger treatment;
- safety/closure/restriction → never hidden behind decorative disclosure.

No citation wall and no synthetic trust score.

Offline/degraded state must keep written routes/addresses/emergency/core Guide facts usable. Missing media/map/live service must not leave a dishonest blank or fake “live” state.

The behavior above is locked. Final visual treatment remains open for only:

1. provenance / trust / freshness disclosure;
2. offline, stale-cache, partial-service, loading, map-provider failure and reconnect states.

Together with the SOS stress-state visual, these are the only unresolved visual-sanity items. Approved/locked surfaces elsewhere in this document are frozen unless a real implementation blocker proves them technically impossible or materially harmful.

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

## 20. Approved visual targets and pending sanity candidates recovered from D6 review

The package contains both creator-approved visual/compositional targets and explicitly non-final sanity candidates. The implementation must converge toward approved targets only. Entries marked `visual_sanity_pending` exist solely to test the still-open SOS, provenance and degraded-state treatments; they must not be treated as approved finals or copied wholesale. The original ChatGPT raster bytes were initially missing from the repository, then recovered from the creator-supplied 81-image WayPoint conversation archive on 2026-09-04. The selected decision boards are now committed beside the sanitized D6 redraws so that the storage failure cannot become permission to invent another aesthetic.

The active visual package is governed by [`design-system-assets/mockup-manifest.json`](design-system-assets/mockup-manifest.json). It contains the recovered D6 SVGs, a deliberately small set of topic-limited raster decision boards and pending sanity candidates from that archive, and [`canonical-mockups.svg`](design-system-assets/canonical-mockups.svg) for gap coverage only. Generated boards often contain correct composition beside hallucinated copy, controls, data, or color; therefore only each manifest entry's `allowed_signals` may be used, and pending entries remain excluded from convergence.

Recovered D6 references take precedence over the reconstructed board for the same topic. The board and recovered SVGs are **supporting figures governed by this section**, not separate design authorities. Binding visual signals are hierarchy, relative scale, panel relationships, responsive composition, hero prominence, density limits, map/sheet behavior, typography wrapping, and key-state/action placement. Exact photographs, sample text/data, prices, times, route geometry, pin names, and decorative micro-details are illustrative unless this Markdown separately specifies them.

For Fable 5.1 / Claude / Codex: read this Markdown first, then `mockup-manifest.json`, then only the listed visual assets. Follow `v1_canary_routes` exactly for the first two surfaces. Do not average or reconcile the selected evidence with old screenshots, the D7 component gallery, unselected archive images, superseded D1–D7 mockups, or historical design prose.

### V1 exact visual route

`mockup-manifest.json#v1_canary_routes` owns the exact asset order, per-image allowlist and rejected signals for the two V1 screens. It routes Active Trip to the recovered Right Now/lifecycle decision boards and desktop Itinerary to the recovered temporal-spatial workbench. `canonical-mockups.svg#WAY-01` and `#WAY-03` remain fallback gap coverage, not primary judging references. The theme, truth and behavior rules in this Markdown always override sample styling or content inside a raster board.

Canonical board IDs:

- `WAY-00` — desktop shell + Atlas;
- `WAY-01` — Trip active-now/lifecycle;
- `WAY-02` — Itinerary mobile;
- `WAY-03` — Itinerary desktop workbench;
- `WAY-04` — Map mobile;
- `WAY-05` — Map desktop;
- `WAY-06` — Guide editorial landing;
- `WAY-07` — Split;
- `WAY-08` — Search overlay;
- `WAY-09` — SOS emergency sheet.

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

Map the relevant production surfaces to this authority, `mockup-manifest.json`, and `WAY-00`–`WAY-09`. Identify any code/content constraint that materially prevents the target. Do not invent an alternative silently.

### V1 — two-surface canary

Implement/rework **only**:

1. Active Trip mobile (South Korea fixture)
2. Itinerary desktop workbench (South Korea fixture)

Render representative production screenshots. Compare hierarchy, proportions, density, imagery prominence, navigation character and overall composition against §20 and the visual package. If materially off-target, correct those two before touching the remaining visual sweep.

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

1. Consolidation/authority cleanup — this file plus its subordinate visual asset set are the single design packet; superseded design documents stay out of the live tree.
2. V0 preflight; do not reopen recorded creator decisions.
3. V1 two-surface canary.
4. Creator review of rendered output; correct canary until accepted.
5. V2 full visual convergence on top of PR #186 engineering.
6. V3 paired responsive review + field/degraded cases.
7. Explicit creator visual acceptance.
8. Regenerate final CI-native gallery baselines.
9. Exact-head Required Gate green.
10. Merge PR #186 to `main`.
11. GitHub Pages production smoke: Trip → Itinerary → Map → Guide → Split, Search, SOS, workbench resize, mobile nav, map fallback, imagery.
12. Physical-device spot check; reopen frontend only for reproduced defects.

Do not start a new broad design-research round. Research is complete enough for implementation unless a specific correctness/accessibility/feasibility blocker requires evidence.

---

## 24. Settled implementation defaults — no creator grilling queue

The D6 handoff explicitly instructed the implementer not to ask the creator to restate recorded decisions and granted engineering discretion over responsive implementation details. The prior three-question queue was a consolidation error and is retired.

Use these defaults unless testing exposes a real accessibility, truth, or feasibility blocker:

- **Desktop shell:** integrated/floating inline chrome; no conventional flat sidebar. It may subtly yield/compact during deep work, but never reorder, become mysterious, or lose immediate recoverability.
- **Hero/image prominence:** use useful destination/place imagery more aggressively where it improves identity/orientation, especially Atlas and Guide openings. Do not shrink heroes merely to force more modules above the fold; do not let imagery bury time-critical operational content.
- **Mobile chrome:** remain aggressively space-prudent. Map/Itinerary chrome may yield during active interaction if the stable five destinations remain immediately recoverable, accessible, and unchanged in identity/order.

These are implementation defaults, not authorization for new features or a fresh design phase. Only a genuine unresolved product contradiction should come back to Carlo as a new decision.

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
