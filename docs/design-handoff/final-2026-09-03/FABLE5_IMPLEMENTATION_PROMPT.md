# Implementation prompt — Claude Fable 5 / D7 convergence

Repository: `Carlob2499/Trip-Guides`
Active implementation branch: `claude/waypoint-design-routing-rex0vr`
Goal: preserve the working D7 engineering in PR #186, converge the rendered product to the creator-approved D6 design, and have the engineering program complete by 2026-09-30.

You are the implementation owner, not the product decision-maker.

## 0. Read first — exact authority order

Before editing:
1. `PRODUCT.md`
2. `docs/design-handoff/final-2026-09-03/FINAL_DECISIONS.md`
3. `docs/design-handoff/final-2026-09-03/VISUAL_FIDELITY_GATE.md`
4. `docs/design-handoff/final-2026-09-03/MOCKUP_MANIFEST.json`
5. `docs/reference/design-system.md`
6. `docs/reference/motion.md`
7. `docs/reference/component-registry.json`
8. `src/styles/base.css`
9. `src/lib/breakpoints.ts`
10. `docs/reference/search-ui-final.md`
11. `docs/reference/sos-ui-final.md`
12. `docs/design-handoff/final-2026-09-03/README.md`
13. `docs/design-handoff/final-2026-09-03/DRIFT_GUARD.md`
14. `docs/design-handoff/final-2026-09-03/ACCEPTANCE_MATRIX.md`
15. `docs/design-handoff/final-2026-09-03/D7_PROGRESS.md`

The creator-approved D6 raster mockups are binding **visual composition** references for the surfaces they depict. They are not factual-content authority. If those required raster references are not available in the current session/environment, do not infer a replacement design from prose or sanitized SVGs. Record `VISUAL_REFERENCE_MISSING` and stop visual convergence before spending a long implementation run.

Historical non-approved prototypes remain non-authoritative. Superseded alternatives must not be averaged together.

## 1. Operating rule

PR #186 already contains substantial working D7 architecture. **Do not rebuild it.** Preserve correct routing, data projection, Search, SOS, map fallback, Split state/math, schema work, accessibility, offline behavior, and retirement work unless the fidelity correction exposes a real defect.

Implement approved behavior decisively. Do not reopen settled product questions unless repository evidence exposes a real correctness/accessibility/feasibility blocker.

You have broad engineering discretion over:
- component boundaries;
- CSS/JS/TS organization;
- refactors needed to remove obsolete lineage;
- migration order;
- safe performance improvements;
- test structure;
- responsive implementation details;
- exact spacing/geometry tuning needed to realize the approved composition within accessibility and token constraints.

You do not have discretion to:
- invent traveler-facing features;
- alter factual trip content to make layouts convenient;
- re-theme WayPoint;
- change the five primary destinations;
- promote Search/SOS/Learnings/Atlas into extra primary tabs;
- weaken offline, provenance, accessibility, or reduced-motion requirements;
- resurrect retired Story/voting/Trip Kit/shared-readiness/Tools concepts;
- replace an approved visual composition with a new generic app layout merely because both satisfy the same feature list;
- self-declare visual acceptance from functional tests or regenerated screenshots.

When an approved mockup contains unsupported content/control detail, keep the visual composition and substitute only canonical WayPoint data/capability. Do not discard the entire mockup because one element is hallucinated.

## 2. Frozen product architecture

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

## 3. Visual-convergence program — usage controlled

### V0 — reference preflight, before any styling work

Load the final creator-approved raster mockups and map each one to the production surface it governs. Record explicit written overrides, if any.

Required coverage is defined in `VISUAL_FIDELITY_GATE.md`.

If a required reference is missing: stop with `VISUAL_REFERENCE_MISSING`. Do not spend hours producing a guessed visual replacement.

### V1 — two-surface visual canary

Before a full-site visual sweep, repair only these two representative surfaces:

1. **Active Trip — mobile**
2. **Itinerary temporal-spatial workbench — desktop**

Use real South Korea content. Produce production screenshots and compare them against the creator-approved references across:
- hierarchy;
- major proportions;
- density/dead space;
- imagery prominence and crop role;
- navigation/chrome character;
- typography scale relationships;
- card/panel frequency versus editorial/spatial composition;
- mobile thumb-zone economy;
- desktop use of width and simultaneous context;
- overall WayPoint identity.

If either canary is materially off-target, continue correcting those two surfaces. **Do not proceed to V2 merely because tests are green.**

### V2 — full surface convergence

Only after V1 is visually credible, extend the same approved language to remaining Trip states, Itinerary mobile, Map, Guide, Split, Search/chrome and responsive siblings.

Do not turn this into another product redesign or architecture pass.

### V3 — creator review

Produce a compact paired review artifact: approved reference beside current production render for the required phone/desktop surfaces.

Visual PASS requires Carlo's explicit acceptance unless Carlo explicitly delegates acceptance authority.

Only after V3 acceptance may final gallery baselines be regenerated/approved.

## 4. Existing functional architecture to preserve

### A. Shared foundation
- five stable destinations and global Search/SOS;
- use the existing sage/oxide token/type system;
- responsive working-surface/immersive-background pattern;
- intermediate widths, keyboard, touch, safe areas, reduced motion.

### B. Canonical semantic projection
- researched facts/provenance remain truth;
- relation metadata links canonical Guide knowledge modules to day/place/event IDs;
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
- **Recent Expenses + Add Expense are primary**;
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
- compact sheet with verified emergency numbers and useful links;
- preserve offline baked-in numbers, advisory behavior, and accessible focus handling;
- no proactive triage, responder orchestration, or help-center workflow.

### K. Provenance + degraded states
- quiet provenance dot; detail on demand;
- visible stale/uncertain/high-consequence escalation;
- useful fallbacks for missing image/map/live service;
- no blank map, no dishonest live status.

### L. Retirement/convergence
- keep already-retired Story Mode/navigation/Tools/Trip Kit/voting/shared-readiness lineage retired;
- do not resurrect obsolete components just to imitate a mockup;
- update registry/tests only as components genuinely change.

## 5. Mockup discipline — composition versus truth

The approved raster mockups are not literal data fixtures. Use them as visual composition targets.

Preserve where approved:
- hero/media prominence;
- spatial organization;
- hierarchy;
- density;
- navigation treatment;
- typography relationships;
- desktop/mobile sibling character;
- meaningful imagery/icon roles.

Never copy unsupported:
- fake data;
- fake people;
- invented tabs/categories;
- ratings/reviews;
- live traffic/ETA/open-now state;
- invented collaboration;
- controls/features not in product authority.

If an unsupported detail occupies a visually important place, replace it with the correct canonical WayPoint object or leave the region structurally honest; do not redesign the entire screen around its absence without evidence that the composition cannot work.

## 6. Verification

Functional verification remains mandatory:
- phone + intermediate/tablet + desktop;
- light + dark;
- keyboard + touch/mouse;
- text enlargement;
- reduced motion;
- missing/long content;
- offline/degraded path where relevant;
- no console errors;
- no factual-content mutation.

But functional green is not visual green.

Final acceptance is `ACCEPTANCE_MATRIX.md` + `VISUAL_FIDELITY_GATE.md`.

Use South Korea as the primary visual/functional fixture and Denmark as the adversarial generalization fixture.

## 7. Baseline rule

Screenshot baselines are regression locks, not approval.

Do **not** regenerate/approve final gallery baselines while visual acceptance is blocked or failed. A stable screenshot of the wrong composition is still wrong.

## 8. Delivery behavior

Do not ask the user to restate settled product decisions.

Stop for:
- `VISUAL_REFERENCE_MISSING` before visual work;
- an actual contradiction between binding authorities that remains unresolved after `FINAL_DECISIONS.md`;
- a destructive migration with no safe compatibility path;
- a genuinely new product decision not already covered.

Otherwise make the smallest correction consistent with the approved design, test it, and continue within the current checkpoint.

At completion of V1, report the two canary screenshots and fidelity findings before expanding scope.

At completion of the full program, provide:
- PR/commit range;
- retained D7 engineering versus changed visual composition;
- acceptance-matrix functional result;
- visual-fidelity result;
- removed obsolete features/components only if changed;
- any remaining known risks before the October trip.
