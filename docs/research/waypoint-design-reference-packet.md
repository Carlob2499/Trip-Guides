# Waypoint External Design Research Packet

Status: **ADVISORY RESEARCH — NOT DESIGN AUTHORITY**  
Audience: Carlo + Claude Design during D6/D7 iteration  
Created: 2026-09-01  
Purpose: preserve the external UI/UX research behind the next Waypoint design iteration in a form that can be consumed without this ChatGPT conversation.

## 0. Read this before using the packet

This document is deliberately subordinate to Waypoint's own product and design rules.

Before using any idea here, read these repository authorities in this order:

1. PRODUCT.md — who Waypoint serves and what wins product tradeoffs.
2. docs/reference/design-system.md — current visual identity, token/core governance, mobile and motion non-negotiables.
3. docs/reference/motion.md — the governed motion vocabulary.
4. docs/reference/component-registry.json — the approved composable surface.
5. Existing accessibility, contrast, performance, offline, and visual-regression gates.

This packet does **not** authorize a new feature, component, token, interaction, data field, travel claim, or visual rule. It is a research input to Claude Design. Claude should use it to generate and compare candidates, then Carlo decides what survives. Only an explicitly approved follow-up may update design authority.

### The most important translation rule

External examples answer questions such as:

- What interaction pattern is worth testing?
- What hierarchy reduces cognitive load?
- What makes a mobile experience feel coherent?
- How can geography become navigation?
- Where can Waypoint become more memorable?

They do **not** answer:

- What should Waypoint copy?
- Which trendy visual style should replace the current identity?
- Which extra feature should be added to make a mockup look impressive?
- Which accessibility/performance/offline rule can be relaxed?

If an external idea conflicts with Waypoint's field-use contract, the external idea loses.

---

## 1. Evidence quality: how much weight to give each source

Not every source in this packet means the same thing.

### Tier A — strong external validation

**The Webby Awards: judging criteria + Travel & Lifestyle winners**

Why this is useful:
- The category directly includes travel guides, reviews, tips, experiences, flights/hotels, and leisure activities.
- The judging criteria explicitly consider content, structure/navigation, visual design, functionality, interactivity, innovation, and overall experience.
- The criteria state that good navigation should be intuitive and transparent, and that functionality should account for access needs and bandwidth limitations.

Use this source for:
- broad product-quality standards;
- travel-specific interaction patterns;
- judging whether design serves an audience rather than merely looking fashionable.

Do not use it as proof that every winner's exact implementation is appropriate for Waypoint.

Sources:
- https://winners.webbyawards.com/winners/websites-and-mobile-sites/general-desktop-mobile-sites/travel-lifestyle?years=0
- https://www.webbyawards.com/judging-criteria/

### Tier B — useful project case studies

These are agency/studio case studies describing real projects. They are valuable because they explain design intent, architecture, and in some cases measured results. Metrics are self-reported by the project teams and should be treated accordingly.

Core anchors:

**Primland Explore — Outpost**
- spatial exploration;
- landscape/map as the navigation model;
- hotspots that lead into deeper detail;
- strong sense of geographic continuity.

Source:
- https://outpost.design/work/primland-explore/

**Kentucky Bourbon Trail — Lewis**
- browsing and filtering connect directly to favorites, trip building, and sharing;
- discovery is not a dead end;
- the Trip Builder turns inspiration into an itinerary.
- Lewis reports 928 trips built and 5,080 items added during the first week; treat these as self-reported case-study metrics, not independent validation.

Source:
- https://www.lewiscommunications.com/case-study/kybourbontrail

**WellingtonNZ — DNA**
- crafted taxonomy;
- related-content blocks;
- organic exploration without repeatedly returning to top-level navigation;
- coherent content system across a large information set.

Source:
- https://www.dna.co.nz/work/wellingtonnz-com-destination-platform/

**Six Senses — Positioner**
- modular content rather than one rigid repeated grid;
- different section compositions create discovery;
- contextual content arrangement based on visitor state, such as returning visitor, upcoming guest, or country.

Source:
- https://www.positioner.com/hotel-brand-design/six-senses

**Discover Halifax — Bellweather**
- mobile-first approach;
- speed/performance called out as part of the experience;
- destination identity strengthened with local artwork rather than generic travel decoration;
- research, information architecture, usability testing, and visual identity treated as one program.

Source:
- https://bellweather.agency/work/discover-halifax/

### Tier C — curated interaction inspiration, with an awards bias

**Awwwards: Mobile & Apps + Mobile UI collection**

Why this is useful:
- exposes patterns for gestures, interaction design, microinteractions, transitions, responsive design, typography, unusual navigation, scrolling, and app-style mobile presentation;
- the Mobile UI collection explicitly frames its goal as balancing aesthetics and functionality.

Why to be cautious:
- Awwwards is an inspiration/awards environment, so spectacle and novelty are overrepresented compared with ordinary field utility;
- some examples are promotional sites viewed on mobile, not tools used repeatedly under pressure.

Sources:
- https://www.awwwards.com/websites/mobile-apps/
- https://www.awwwards.com/awwwards/collections/mobile-ui/

Use Awwwards primarily for:
- motion continuity;
- transition quality;
- mobile composition;
- interaction polish;
- visual rhythm.

Do not import:
- scroll-jacking;
- hidden navigation;
- decorative WebGL;
- long intros;
- motion that blocks interaction;
- low-contrast fashion UI.

### Tier D — visual idea library, not UX evidence

**Dribbble: “mobile awards” search**

The page describes itself as a place to browse “mobile awards designs, illustrations, and graphic elements.” This is not a vetted corpus of award-winning or production-tested mobile products.

Source:
- https://dribbble.com/search/mobile-awards

Use Dribbble as:
- a sketchbook;
- a source of layout variants;
- a source of bottom-sheet, card, control, typography, and visual hierarchy ideas.

Never use Dribbble popularity or visual polish as proof that:
- the interaction works;
- the design is accessible;
- the design is usable outdoors;
- the design survives long content;
- the design has been tested in production.

---

## 2. What the external research consistently suggests

These are **research hypotheses for Waypoint**, not approved rules.

### H1 — “Right now” should outrank “all features” during a trip

A strong field experience should not begin by asking the traveler to choose among every feature Waypoint has.

Candidate hierarchy during active travel:

1. What is happening now?
2. What is next?
3. When do I need to leave?
4. How do I get there?
5. Is anything important wrong, stale, closed, delayed, or unverified?
6. What are the best relevant alternatives if the plan changes?
7. Everything else.

Why this matters:
Waypoint already contains itinerary, coordinates, route links, verified facts, reminders, weather/closure-related data, Sights, Food, and tools. The research suggests the UX opportunity is often **prioritization**, not another feature.

Design question:
Can a traveler understand the next useful action in about three seconds without navigating through the information architecture?

### H2 — geography can become a navigation model

Primland is the clearest extreme example: geography itself becomes the interaction layer.

The Waypoint interpretation should be much lighter:
- tap a place -> the map identifies and centers it;
- tap a map pin -> the matching place information appears;
- select a neighborhood/area -> relevant verified options become visible;
- move from atlas -> destination -> day -> stop with spatial continuity where helpful.

This is not a request for a heavy 3D/WebGL experience.

Waypoint advantage:
Coordinates and mapped places already exist, so a spatial model can be deterministic and honest rather than decorative.

### H3 — discovery should lead naturally to a decision and an action

Kentucky Bourbon Trail is useful because browsing does not end at a content page; it leads into saved choices and trip construction.

Waypoint already has a planned itinerary, so the equivalent is not “build another Trip Builder.”

Instead, audit discovery surfaces for their natural next step:
- see it on the map;
- get there;
- understand when it fits;
- see why it was selected;
- compare a verified alternative;
- return to the current plan.

Avoid feature multiplication. Prefer connecting capabilities Waypoint already has.

### H4 — progressive disclosure can make a very information-dense guide feel calm

A place may have:
- name;
- category;
- neighborhood;
- hours;
- price;
- reservation requirement;
- address;
- coordinates;
- route;
- verification date;
- source;
- caveats;
- practical tips;
- alternatives.

The traveler usually does not need all of those at equal visual weight.

Candidate pattern:
- immediate field answer at the top;
- operational facts next;
- deeper explanation/provenance on demand;
- no loss of truth or evidence.

Progressive disclosure must never conceal a safety-critical warning, material uncertainty, or the only way to understand an action.

### H5 — map and list should behave as one system

Map-only interfaces are poor at explaining “what.”
List-only interfaces are poor at explaining “where.”

Candidate behavior:
- shared selection state;
- synchronized focus;
- consistent filters;
- place bottom sheet or detail pane;
- map remains useful without forcing constant context switching.

Mobile likely uses more sequential composition (map + bottom sheet/list).
Desktop can show more simultaneously.

### H6 — the design system needs composition variety, not arbitrary component variety

Six Senses is useful here: different content sections do not all use one rigid layout.

Waypoint should not respond by allowing one-off designs.

Instead, Claude should explore a small number of **composition grammars** built from approved components/tokens, for example:

1. Editorial / destination story
   - warmth, identity, selective imagery/illustration;
   - long-form or contextual explanation;
   - generous breathing room.

2. Operational / data
   - schedules, hours, prices, transit, state;
   - compact, aligned, scan-first;
   - “airline precision.”

3. Spatial / exploration
   - map + places + relationships;
   - discovery and orientation.

4. Focused action
   - one task;
   - minimal surrounding information;
   - strong primary action.

The names and exact count are not authority. Claude should test whether this model is useful.

Goal:
Avoid “card soup” while keeping the registry and zero-one-off-style discipline.

### H7 — destination identity should live in controlled accent slots

Discover Halifax reinforces the value of place-specific identity and local visual authorship.

Waypoint translation:
- Japan should feel unmistakably different from Denmark;
- both must still be unmistakably Waypoint;
- destination character belongs in approved identity regions: masthead, illustration/photo, atlas art, section marks, selected editorial moments;
- operational data should remain stable and predictable across destinations.

Do not theme hours, prices, transit, warnings, or evidence into decorative destination motifs.

### H8 — motion should preserve orientation

Awwwards is valuable for studying polish, but Waypoint's own motion doctrine remains the filter.

High-value candidates:
- atlas -> destination geographic fly-to;
- card/photo -> place-detail shared-element continuity;
- day -> adjacent day gesture continuity;
- selected pin -> corresponding place sheet;
- guide card -> guide masthead transition.

The movement should answer:
“Where did I go?”

Reject movement whose only answer is:
“It looks expensive.”

### H9 — mobile needs its own composition, not compressed desktop

Same system, same information, different composition.

Mobile:
- current context first;
- thumb-reachable primary action;
- sequential disclosure;
- bottom sheets where appropriate;
- strong gesture continuity;
- fewer simultaneous regions.

Desktop:
- more simultaneous context;
- side-by-side spatial/data relationships;
- calmer version of the same motion language.

Do not create two products. Do create two genuinely appropriate compositions.

### H10 — state communication is part of the product's identity

Because Waypoint makes unusually strong claims about verification and truth, status feedback can be a differentiator.

Candidates:
- Verified <date>
- saved offline;
- offline data may be limited;
- route action requires connection;
- hours are stale/unconfirmed;
- no verified alternative available;
- change saved;
- actual vs planned state.

The interface should communicate state without forcing the traveler to understand pipeline internals.

---

## 3. What not to copy

This section is intentionally blunt. A recurring failure mode in design-reference work is copying the thing that photographs well rather than the thing that works.

Reject by default:

- **WebGL/3D spectacle** that does not improve geographic understanding.
- **Scroll-jacking** or scripted scrolling that replaces native momentum.
- **Long cinematic entrances** before useful information becomes available.
- **Mystery navigation** hidden to make a screen look clean.
- **Low-contrast gray-on-gray typography** that fails in sunlight.
- **Glassmorphism as a visual default**, especially where blur hurts performance/legibility.
- **Card soup**: every paragraph and row inside nested rounded cards.
- **Huge imagery that pushes operational facts below the fold** during field use.
- **Decorative parallax** inside data regions.
- **Constant ambient motion** without live meaning.
- **Tiny icon-only actions** when the meaning is not universally obvious.
- **Gamification, badges, streaks, XP, or fake social proof** unless a real product requirement later justifies them.
- **AI-looking gradients, generic travel art, or invented local flavor.**
- **Feature invention for mockup completeness.**
- **Fake contextual intelligence** that depends on data the guide does not actually contain.

If a reference looks beautiful but would make a traveler slower, less certain, less accessible, or more dependent on connectivity, it is a bad Waypoint reference.

---

## 4. The eight design studies Claude Design should run

These studies are the main reason this packet exists.

Claude should use **real-shaped existing Waypoint data** wherever possible. If placeholder content is required, label it explicitly as placeholder. Do not invent travel facts.

### Study 1 — The “Right Now” field screen

Scenario:
Active trip, traveler is between itinerary events on a phone.

Explore:
- current time/context;
- next stop;
- leave-by time;
- travel duration/mode;
- material alert;
- primary route action;
- plan-change escape hatch;
- rest of today's schedule.

Questions:
- Can the traveler identify the next action in ~3 seconds?
- Is one primary action visually dominant?
- Are uncertainty and verification still visible?
- Is the primary action thumb-reachable?
- Does this work with one missing data field?

### Study 2 — Place detail with progressive disclosure

Create at least:
- one Sight;
- one Food/venue example.

Show:
- field-first summary;
- map/location relationship;
- hours/price/reservation or equivalent operational facts;
- route action;
- verification state;
- provenance/detail disclosure;
- practical guide tip;
- relationship to itinerary/nearby alternatives only where supported by existing data.

Questions:
- What is visible immediately?
- What moves behind disclosure?
- Are warnings ever accidentally buried?
- Does the page remain useful with no photo?

### Study 3 — Map + list as one experience

Prototype:
- map with selected place;
- matching list or sheet;
- selection from either side;
- simple filtering;
- neighborhood/area context if the data supports it.

Show both:
- phone;
- desktop/tablet.

Questions:
- Is selection state obvious?
- Does tapping one representation update the other?
- Is the map still useful offline/degraded?
- Can the user escape the map quickly?

### Study 4 — Navigation and motion continuity storyboard

Storyboard, do not merely decorate:
- atlas -> city/destination;
- guide -> day;
- day -> place;
- place -> route/directions context.

For every transition state:
- what visual element persists?
- what moves?
- what remains fixed?
- what does reduced-motion do?

Questions:
- Does motion preserve mental location?
- Is the transition interruptible?
- Does it stay inside the existing motion timing doctrine?
- Does it explain structure?

### Study 5 — Context-aware hierarchy across the trip lifecycle

Show the **same guide** in three states:

Before trip:
- readiness;
- bookings;
- entry/prep;
- important deadlines.

During trip:
- Today;
- next action;
- route;
- nearby fallback;
- field tools/SOS.

After trip:
- actual vs plan;
- costs/settlement;
- learnings/feedback;
- recap.

This is hierarchy, not three separate products.

Questions:
- Can the user still find everything?
- Does the interface merely reorder/emphasize supported information?
- Is there any hidden “smart” behavior that relies on nonexistent data?

### Study 6 — Composition grammar

Using the current component/token system as the base, make a comparison board for:
- editorial;
- operational/data;
- spatial/exploration;
- focused-action.

Goal:
Demonstrate that Waypoint can feel varied and intentional without new one-off components for every page.

Questions:
- Does each register have a recognizable job?
- Can existing components be composed into it?
- Where is a genuinely new component required, if anywhere?
- Is the proposed new component reusable enough to justify registry entry?

### Study 7 — Destination identity without data drift

Show at least two very different destinations using the same Waypoint system.

Candidate pair:
- Japan;
- Denmark.

Keep operational regions structurally consistent.
Vary only approved identity/accent regions.

Questions:
- Does each destination have real personality?
- Could the identity treatment belong to any random country? If yes, reject it.
- Does warmth compromise operational clarity?
- Does dark mode preserve destination identity?

### Study 8 — Real-conditions stress board

Take the strongest candidate from the prior studies and show:

- 375px phone;
- bright-sun/high-legibility condition;
- dark mode;
- offline/degraded state;
- reduced motion;
- long place name / long translated content;
- missing/unverified field;
- low-battery/conservative media state where relevant.

This board is mandatory.

A design that works only in a pristine artboard is not an approved Waypoint design.

---

## 5. Candidate acceptance rubric

Claude should evaluate each design candidate against these questions before presenting it to Carlo.

Score is not binding; the questions are.

### Field usefulness
- What task does this screen help complete?
- Is the next useful action obvious?
- Is critical information reachable in <=2 taps where PRODUCT.md requires it?

### Cognitive load
- What is primary?
- What is secondary?
- What is intentionally hidden until requested?
- Is anything visually competing without earning attention?

### Truth
- Does every shown state correspond to information Waypoint can actually know?
- Are missing and uncertain facts still honest?
- Has visual polish accidentally implied certainty?

### Mobile ergonomics
- Are real controls >=44px?
- Are primary field actions bottom/thumb reachable?
- Does it survive one-handed use?

### Spatial coherence
- If geography is shown, does it help orientation or action?
- Do map and textual representations stay synchronized?

### Motion
- What structural truth does each animation communicate?
- Can it be interrupted?
- Does reduced motion render a complete useful state?
- Is any motion merely ornamental?

### Identity
- Is the screen unmistakably Waypoint?
- Is destination identity authentic and contained?
- Are operational regions stable across destinations?

### Accessibility and resilience
- sunlight readability;
- dark mode;
- long content;
- CJK/multilingual text;
- offline/degraded state;
- no-JS/fault-safe behavior where applicable;
- bandwidth/performance discipline.

### System discipline
- Can this be built from approved tokens/components?
- If not, why is the new primitive necessary?
- Does it generalize?
- Would adding it make future guides simpler rather than more bespoke?

---

## 6. How Claude should present options to Carlo

Do **not** create three near-identical style variations just to create choice.

Use multiple options only when there is a real design decision, such as:
- persistent map vs map-on-demand;
- bottom sheet vs dedicated place transition;
- timeline emphasis vs single “next” card;
- editorial lead vs operational lead in a particular context.

When choices exist:
- show 2–3 materially different approaches;
- label the tradeoff in plain language;
- identify which repo/product constraints each option satisfies or strains;
- recommend one only after showing why.

When there is no meaningful choice:
- present one strong implementation candidate.

Do not ask Carlo to judge hidden implementation details from an artboard. Present the visible consequence.

---

## 7. Research-to-Waypoint mapping cheat sheet

| External lesson | Waypoint candidate | Why useful | Main danger |
| --- | --- | --- | --- |
| Primland spatial exploration | Geography as navigation / meaningful fly-to | Orientation and discovery | Heavy 3D spectacle |
| Kentucky Bourbon Trail discovery -> plan | Connect Sights/Food discovery to route/current plan | Existing features become a workflow | Rebuilding an unnecessary trip builder |
| Wellington taxonomy + related content | Deterministic nearby/related relationships | Reduces dead ends | Generic recommendation clutter |
| Six Senses varied layouts | Approved composition grammars | Avoids monotonous card stacks | One-off page designs |
| Six Senses contextual arrangement | Pre/during/post hierarchy | Guide feels situationally intelligent | Fake personalization |
| Discover Halifax mobile-first | Phone-first field composition | Matches PRODUCT.md primary scene | Desktop merely enlarged phone |
| Discover Halifax local art | Controlled destination identity slots | Place-specific warmth | Decorative stereotyping |
| Awwwards transitions | Shared-element / geographic continuity | Polished orientation | Motion for awards rather than tasks |
| Awwwards mobile interaction | Gestures, bottom sheets, responsive composition | Better one-handed UX | Hidden/mystery navigation |
| Dribbble visual hierarchy | Quick layout exploration | Fast divergent ideation | Treating pretty screenshots as evidence |

---

## 8. Suggested D6 -> D7 use

### D6: explore and decide

Use this packet during the holistic taste/UX review to:
1. audit current screens against the candidate acceptance rubric;
2. build the eight design studies;
3. identify genuine visual/interaction choices;
4. let Carlo approve/reject the visible directions;
5. produce a concrete punch list.

D6 should not silently rewrite design authority based on external references.

### D7: implement only what survived

For each approved D6 decision:
1. map it to existing tokens/components;
2. identify any required registered primitive;
3. update design authority only where Carlo's decision requires it;
4. implement;
5. run accessibility/performance/offline/reduced-motion/resilience gates;
6. prove the system still scales without one-off CSS.

---

## 9. Ready-to-use Claude Design instruction

When iteration begins, Carlo should be able to point Claude Design here plus the current repo authority.

Use this instruction as the starting brief:

> Read PRODUCT.md, docs/reference/design-system.md, docs/reference/motion.md, docs/reference/component-registry.json, and docs/research/waypoint-design-reference-packet.md before designing.
>
> Treat the external-design packet as advisory research, not authority. Do not copy the referenced sites. Extract interaction principles and test them against Waypoint's field-first, verified, personalized, offline-capable product contract.
>
> Run the eight design studies in the packet. Use existing real-shaped Waypoint content and capabilities; do not invent travel facts, unsupported context, social proof, product metrics, or new features to make the artboards look complete. Where data is absent, preserve an honest absence.
>
> For genuine design choices, show 2–3 materially different options and state the user-facing tradeoff. Otherwise show one strong candidate. Every strong candidate must be stress-tested at phone width, dark mode, offline/degraded, reduced-motion, long/multilingual content, and missing/unverified data.
>
> Optimize first for the traveler on the street: one hand, sunlight, possible poor connectivity, and a need for an answer now. Motion should preserve orientation; geography should help navigation; progressive disclosure should reduce clutter without hiding uncertainty or important warnings.
>
> Do not change design authority, tokens, registry, or implementation until Carlo has selected a direction.

---

## 10. Decision log

This section starts empty on purpose. Research becomes authority only through explicit decisions.

| Date | Study / question | Decision | Adopted into authority? | Notes |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

---

## 11. Source index

Primary/curated sources reviewed for this packet:

- Webby Travel & Lifestyle gallery  
  https://winners.webbyawards.com/winners/websites-and-mobile-sites/general-desktop-mobile-sites/travel-lifestyle?years=0
- Webby judging criteria  
  https://www.webbyawards.com/judging-criteria/
- Primland Explore / Outpost  
  https://outpost.design/work/primland-explore/
- Kentucky Bourbon Trail / Lewis  
  https://www.lewiscommunications.com/case-study/kybourbontrail
- WellingtonNZ / DNA  
  https://www.dna.co.nz/work/wellingtonnz-com-destination-platform/
- Six Senses / Positioner  
  https://www.positioner.com/hotel-brand-design/six-senses
- Discover Halifax / Bellweather  
  https://bellweather.agency/work/discover-halifax/
- Awwwards Mobile & Apps  
  https://www.awwwards.com/websites/mobile-apps/
- Awwwards Mobile UI collection  
  https://www.awwwards.com/awwwards/collections/mobile-ui/
- Dribbble “mobile awards” search  
  https://dribbble.com/search/mobile-awards

Research captured 2026-09-01. External pages can change; the interpretation above is the durable Waypoint-specific takeaway, while the links remain provenance for later re-checking.
