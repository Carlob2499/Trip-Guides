# PLAN — The Living Atlas (drastic visual redesign: video heroes + navigation end-goal)

> Status: **VISION / UNAPPROVED.** Drafted 2026-07-27 from a real render review (Playwright
> screenshots of the built site: hub + Korea guide, desktop/mobile, light/dark). Nothing here
> is building yet — the Clarifying questions below gate every phase, per the
> Clarifying-Questions Doctrine. This doc extends `docs/MOTION.md`'s doctrine; it does not
> replace it.
>
> **Mock-ups exist — Study Nº 2, Field Edition** (2026-07-27):
> `node docs/mockups/build-mockup.mjs` renders the design study
> (`docs/mockups/living-atlas.html`, gitignored — it embeds ~1.4 MB of fonts + Commons
> photos as data URIs). Sections: type specimen (Field Edition vs shipped faces) · living
> hub hero (Sedona) · Korea masthead + route draw · the voice (Korea's 11 re-titles) ·
> nav split (desktop horizon interactive + mobile bar/sheet phones) · interior atlas ·
> four-zoom continuum · the R1–R5 programme + decision ledger. Motion is CSS simulation;
> the page honors `prefers-reduced-motion`.

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

## Move B — Navigation splits by device (revised 2026-07-27; fork №2 DECIDED: pills retire)

The pill toolbar retires on both devices — but its replacement is **not the same organ on
both**. The dev critique was right: mobile was a shrunken desktop, and 11 groups never fit a
375 px strip with dignity. The journey line is ONE object worn two ways:

**Desktop — the horizon.** A horizontal journey line under the masthead: one-word stations
(see Move D — the voice makes 11 stations fit one row), current station filled in the guide
accent, the traveled portion absorbing `#readProg` (one object, not two). Tools collapse to
a compass cluster past a divider. Same `tablist`/arrow-key semantics — a re-skin of the
object, not a rewire. Desktop had no crowding problem; it changes clothes, not species.

**Mobile — the spine (app-native).** No strips at all:
- **Bottom bar, four honest destinations:** Journey · Today · Map · Kit (final names = fork).
  SOS keeps its own red post top-right on every screen — an emergency never hides in a drawer.
- **The journey sheet** (bottom sheet, half-height, grabber, plain scroll): the same journey
  object turned vertical — every stop with full title + typed descriptor, done-ticks from
  reading progress, today's leg highlighted inside Day-by-day. It is a live table of contents,
  in thumb range, the pattern maps/booking apps already taught users.
- **Reading is sacred:** one section at a time, compact header, the existing next-section
  band as the linear path, a floating trip-aware **Today** chip. Nothing competes with scroll.
- **The law over all of it: chrome is still.** Motion lives in the covers; chrome never
  animates on its own; the sheet moves only under a thumb; no scroll-jacking, ever.
- **Same-object rule still holds** (uniform application): hub Overture route → desktop
  horizon → mobile sheet spine → story-mode rail → print/OG route strip.

## Move D — The voice (new, 2026-07-27) + the Field Edition type

**Titles.** "Plan · Essentials · Itinerary · References" is CMS furniture — the creator's
critique ("AI-slop") is correct. The standard that replaces it: **a title names what the
traveler is doing, not what the database calls the bucket** — verb-forward or place-forward,
never bucket-nouns. Two levels: a ONE-WORD station (line + sheet) and a full phrase at the
section head, always with a typed descriptor so scanning never suffers. Korea's proposal
(needs creator sign-off — titles are content): Fly/Before you fly · Pocket/In your pocket ·
Moving/Moving through Seoul · Days/Day by day · Walks/Worth the walk · Daejeon/The Daejeon
weekend · Arcade/Arcade nights · Food/Hungry in Seoul · GO/GO Fest week · Tokyo/The Tokyo
detour · Receipts/The receipts. The standard goes into the `waypoint-guide-author` skill so
every future guide is born with a voice; per-guide titles get creator sign-off.

**Type — the Field Edition (proposed; fork).** The shipped display/data faces read as
software (geometric grotesque + IDE mono) against Waypoint's natural themes. Proposal:
**Fraunces** (display — variable opsz/SOFT/WONK; naturalist-cover warmth) · **Literata
stays** (body — it was always a book) · **Courier Prime** (data — not code, *typed*: the
expedition log). All fontsource, self-hosted like today's faces; swap is token-level in
`base.css`. Bricolage Grotesque + Spline Sans Mono retire.

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

## Phasing (revised 2026-07-27 — foundation first; each phase lands the full ship loop + boundary checks)

| Phase | Scope | Risk gates |
|---|---|---|
| R1 | Field type (token-level swap in base.css) + the voice (titles per guide, creator-signed; standard into guide-author skill) | zero-layout-shift check per surface (type metrics differ); grep dist/ for old family names; a11y contrast re-verify |
| R2 | Mobile goes native: bottom bar (4 destinations), journey sheet, Today chip; mobile pill strip retires; SOS post kept | thumb-reach on real device; sheet = plain scroll, no scroll-jack; a11y (sheet as dialog/nav landmark); baselines re-recorded on CI |
| R3 | Desktop horizon: line replaces pills (desktop only), absorbs reading progress, tablist semantics kept | a11y suite green; arrow-key ring intact |
| R4 | Living covers (pathos, as decided): masthead first, then hub + hover previews | licensed-footage delivery smoke test from deployed site; Save-Data/reduced-motion forced once each; credit+license in schema; CLS re-measure |
| R5 | Interior atlas: leg headers from real pins, grid refs, editorial measure; route-carry view-transitions | reduced-motion path; pin-less fallback; print + OG parity |

## Clarifying questions (gate — put to the creator via AskUserQuestion before any phase builds)

1. ~~**Video sourcing policy.**~~ **DECIDED 2026-07-27 (creator):** covers are the pathos
   layer — liberal sourcing from any well-licensed library, chosen for feeling, credited,
   accent-graded. The verification apparatus applies to content only. See "The two registers"
   above.
2. ~~**Expedition Line: replace or augment?**~~ **DECIDED 2026-07-27 (creator):** pills
   retire on both devices; navigation splits by device (desktop horizon, mobile bar + sheet).
   See Move B.
3. **The four bottom-bar destinations.** Proposed: Journey · Today · Map · Kit. Swap one for
   Trip Split? For Search? Four is the budget; the names are the creator's call.
4. **The re-titles are content.** Korea's eleven proposed titles (Move D) need per-line
   creator sign-off — approve/edit/reject; the *standard* ships either way.
5. **The faces.** Fraunces + Literata + Courier Prime is the proposal (specimen in the
   design study). If it doesn't sing, the next round stages two alternates the same way.
6. **Hero video weight ceiling** (~4 MB, masthead-only first — rec) and **pin-less
   route-draw** (contours until real pins exist — rec): both carried from Study Nº 1,
   defaults recommended.
