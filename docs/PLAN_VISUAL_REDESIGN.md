# PLAN — The Living Atlas (drastic visual redesign: video heroes + navigation end-goal)

> Status: **VISION / UNAPPROVED.** Drafted 2026-07-27 from a real render review (Playwright
> screenshots of the built site: hub + Korea guide, desktop/mobile, light/dark). Nothing here
> is building yet — the Clarifying questions below gate every phase, per the
> Clarifying-Questions Doctrine. This doc extends `docs/MOTION.md`'s doctrine; it does not
> replace it.
>
> **Mock-ups exist** (2026-07-27): `node docs/mockups/build-mockup.mjs` renders the five-plate
> design study (`docs/mockups/living-atlas.html`, gitignored — it embeds ~1.2 MB of fonts +
> Commons photos as data URIs). Plates: living hub hero (Sedona) · Korea masthead + route
> draw · Expedition Line before/after + interactive + 375 px · interior atlas pass · the
> four-zoom continuum · the three paths + five forks. Motion is CSS simulation of the
> proposed 6–10 s ambient loops; the page honors `prefers-reduced-motion`.

## The diagnosis (what a fresh-eyes render review shows)

The site's identity — paper ground, contour cartography, Bricolage/Literata/Spline-Mono,
per-guide extracted accent, the day-rail signature — is strong **at the edges** and absent
**in the middle**:

1. **Heroes are static.** One Commons photo + Ken Burns nudge. For a product about *going
   somewhere*, the place never moves. The masthead is the biggest surface on the page and it
   is the least alive.
2. **Navigation is the weakest element on the guide page.** Two rows of gray look-alike pills
   (11 content chips + 5 tool icons on Korea). It is a docs-site toolbar wearing a travel
   product's clothes: no hierarchy (Plan weighs the same as References), no geography, no
   relationship to the day-rail signature that the rest of the motion system is built on.
3. **Hub and guide interior read as two different sites.** The hub is atmospheric (Overture
   contours, route line, editorial plates); past the masthead, the guide collapses into a
   texture-free two-column card wall. Place identity survives only as an accent color.
4. **The map is a tab.** In a site named Waypoint whose texture language is contour lines,
   geography is decoration, not structure.

## The end-goal (one sentence)

**One journey, one line: the whole site is a single atlas you zoom into — every hero alive,
every navigation surface a segment of the route, every fact signed.**

## The two registers (decided by the creator, 2026-07-27)

The site speaks in two deliberately split registers. **Covers and motion are pathos** — their
job is the web user's heart, and they are LIBERAL: footage chosen for feeling, from any
well-licensed source, graded toward the guide's accent. **Content is ethos** — the ledger,
and it does not bend: every price, hour, route, and claim stays verified under the full
apparatus. The boundary rule: *the shell may seduce; the spine may not lie.* A cover never
carries a fact flag (≈/⚠/Checked belong to content only), and the pathos license never
crosses into anything that asserts a fact — geography, routes, dates, and text overlays
remain ethos even when they appear inside a hero.

The existing signature ("the trip unfolds, day by day" — the segmented rail) is not replaced;
it is *promoted*. Today it appears three ways (story intro, story mode, card→hero morph).
The end state is that it appears everywhere navigation appears, because the navigation IS the
route.

## Move A — Living covers (video-animated heroes)

Every guide's cover graduates from photo → short ambient loop: 6–10 s, muted, slow
motion-of-place (Nyhavn water moving, a Jongno crosswalk, Cathedral Rock clouds). Not an
animation *event* — the ground layer under the existing choreography. The story-intro day
rail ticks over a living cover instead of a frozen one, which strengthens the signature
(MOTION.md: spend the boldness in one place).

- **Sourcing is liberal — the pathos register (see Two Registers above).** Footage may come
  from any well-licensed library (Pexels, Coverr, Mixkit, Commons, creator-shot), chosen for
  feeling rather than documentary fidelity, and may be graded/tinted toward the guide's
  accent for cohesion. Two invariants survive from the photo pipeline: every clip is
  **credited** (visible credit line, license recorded in the schema) and every clip is
  **licensed for this use**. Schema: `cover.video: { src, credit, license, poster? }` beside
  the existing `cover`. The poster IS the current photo — palette extraction is untouched
  (runs on the poster; the identity engine's input does not change).
- **Delivery is tiered, poster-first, budget-safe.** The photo renders exactly as today
  (first paint unchanged — the 200 KB per-page budget never sees video). Video is a lazy
  enhancement gated on ALL of: `prefers-reduced-motion: no-preference`, Save-Data off,
  `IntersectionObserver` in-view, and a per-file ceiling (~4 MB). Hot-linked from Commons
  `Special:FilePath` like photos — nothing heavy enters the repo. Pause when off-screen;
  visible pause control (WCAG 2.2.2); `muted playsinline loop`, no audio ever.
- **The morph stays cheap.** Card→hero View Transition carries the *poster*; the video
  cross-fades in ~300 ms after arrival (house ease). Hub cards may preview on hover/focus at
  desktop only — never autoplay N videos in a grid.
- **Fallback chain is the current one, extended:** video → poster photo → palette gradient +
  contours. A guide with no video is not a lesser guide; the field is optional forever.
- **Doctrine deltas:** one new row in MOTION.md's inventory (owner: `living-cover.js`,
  lazy module); rule 7 amended to name video's own budget (video never counts against JS
  first-paint; it has its own byte + autoplay-count ceiling). Rules 2/3/4 apply as written.

## Move B — The Expedition Line (the navigation end-goal)

Retire the gray pill toolbar as the *identity* of navigation. In its place: **one horizontal
route element — the trip drawn as a line with stations — that is simultaneously the section
nav, the reading progress, and the same object as the hub Overture route and the story-mode
day rail.**

- Content groups become **stations on the line**: current section = filled station + label in
  the guide accent; others = ticks with labels (clipped-label pattern from M4 already proves
  labels can compress without leaving the a11y tree). The line's traveled portion fills as
  you read — absorbing the separate `#readProg` progress bar (one object, not two).
- **Tool tabs collapse into a compass cluster** at the line's end (Search/SOS/Share/tools) —
  chrome, visually distinct from stations, exactly as the M4 divider already hints.
- **Mobile:** the line lives above the existing bottom bar and is thumb-scrubbable like a
  timeline; stations snap. 375 px with Korea's 11 groups is the stress case (see Q2).
- **Semantics survive:** same `tablist`/arrow-key ring, same targets — this is a re-skin of
  the *object*, not a rewire of the interaction. The a11y suite's tab assertions keep
  passing; visual baselines are re-recorded deliberately, on CI's runner.
- **The same object everywhere** (uniform-application rule): hub Overture route → guide
  Expedition Line → story-mode rail → print header rail → OG images' route strip. The V5
  accent-carry View Transition extends naturally: the hub card's route segment morphs into
  the guide's Expedition Line.

## Move C — One cartographic world (visual integration end-goal)

The hub, guide interior, story mode, OG, share, and print surfaces read as **plates of one
atlas at different zooms**:

- **Hub = continental zoom** (already closest to done): Overture route + contours; grid cards
  styled as numbered plates ("Plate 03 — South Korea").
- **Masthead = country zoom:** the living cover, over/under which the guide's OWN route —
  its real map-section pins connected day by day — draws once as the title settles (real
  coordinates only; a guide without a map section gets contours, never a fake squiggle —
  the Honest property applies to ornament too).
- **Interior gets the cartographic DNA back:** thin topo-rule dividers between groups;
  section numbers styled as chart indices (№ 01); day entries get a route-leg header
  (Day 4 · Jongno → Changdeokgung · 4.2 km) derived from existing pin data. The two-column
  card wall gains the editorial measure MOTION.md already names: full-width serif lead,
  mono data rail.
- **The map stops being only a tab:** any venue/waypoint tap opens the existing map surface
  as an overlay sheet ("where is this, from here") — reusing the map feature, not rebuilding
  it. Surfacing beats sourcing.

## What this deliberately does NOT do

- No new JS motion dependency (GSAP stays the only one; route drawing is SVG + CSS
  scroll-driven, per MOTION.md rule 1).
- No autoplaying grids, no audio, no scroll-jacking, no loop that competes with the story
  intro (one owner per property per element).
- No invented geography, ever — routes, pins, and any text that asserts a fact stay in the
  ethos register even when rendered inside a hero. Footage is liberal (pathos) but always
  licensed and credited, and never carries or implies a verification flag.

## Phasing (each phase lands the full ship loop + boundary checks)

| Phase | Scope | Risk gates |
|---|---|---|
| P1 | Living cover on ONE guide masthead (schema field, lazy module, gates, fallback chain) | Licensed-footage delivery smoke test from the deployed site (boundary check #3); Save-Data/reduced-motion forced once each (#2); credit + license recorded in schema |
| P2 | Living covers: hub hero + hover previews; morph-then-crossfade | CLS re-measure; autoplay ceiling |
| P3 | Expedition Line on guide pages (replaces pill strip visual, keeps tablist semantics); absorbs reading progress | a11y suite green; 375 px Korea stress; baselines re-recorded on CI |
| P4 | Route-carry: hub route ⇄ Expedition Line view-transition; masthead route draw | reduced-motion path; guides-without-maps fallback |
| P5 | Interior atlas pass: topo dividers, chart indices, day route-leg headers, editorial measure | tab budget untouched; print + OG parity (uniform application) |

## Clarifying questions (gate — put to the creator via AskUserQuestion before any phase builds)

1. ~~**Video sourcing policy.**~~ **DECIDED 2026-07-27 (creator):** covers are the pathos
   layer — liberal sourcing from any well-licensed library, chosen for feeling, credited,
   accent-graded. The verification apparatus applies to content only. See "The two registers"
   above.
2. **Expedition Line: replace or augment?** Wholesale replacement of the pill strip is the
   drastic path and the recommendation; the risk is Korea's 11 groups at 375 px. If the
   scrub/overflow prototype doesn't hold, fall back to line-above-pills (augment), which
   keeps the object but halves the payoff.
3. **Hero video weight ceiling and count.** Is ~4 MB/loop over Commons hot-links acceptable
   on the hub hero AND guide mastheads, or masthead-only first? (Hub currently also serves
   users on hotel wifi — the Save-Data gate helps but doesn't decide the default.)
4. **Does the masthead route-draw ship for guides whose map data is center-only** (no
   per-day pins), or is the honest fallback (contours only) the rule until pins exist?
5. **Phase order.** Hero-first (P1–P2, visible wow soonest) vs. navigation-first (P3, the
   structural payoff). *Recommendation: P1 first — smallest blast radius, proves the
   sourcing/licensing pipeline the rest depends on.*
