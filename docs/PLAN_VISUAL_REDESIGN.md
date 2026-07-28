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

## Move D — The voice (REVISED 2026-07-27, round 3 — titles DECIDED) + the Quiet Edition type

**Titles — DECIDED: information first, warmth second.** Round 2's evocative one-worders
("Pocket", "Receipts") traded wayfinding for cleverness and were withdrawn. The standing
rule: **the label you navigate by is literal, always**; the warmth lives in a small
descriptor under each section head. Only label changes that GAIN information per glance
survive: Itinerary→**Days**, Getting around→**Transit**, References→**Sources**. Korea's
descriptor set is staged in the design study (Plate 03). Standard goes into the
`waypoint-guide-author` skill; descriptors are content and get per-guide sign-off.

**Type — the Quiet Edition (round-3 proposal; fork №5 restaged).** Round 2's
Fraunces + Courier read as costume — three loud voices = clutter. The correction is
subtraction: **ONE serif — Literata — wearing display AND body through its real optical
sizes** (the `standard` fontsource variant carries `opsz`), plus **ONE quiet humanist
sans — Source Sans 3 — for every label and number** (tabular figures). Two voices total;
Bricolage Grotesque and Spline Sans Mono retire; no new serif enters. The three-generation
specimen (shipped → Nº 2 withdrawn → Nº 3) is in the study's Foundation section.

## Move A½ — The motion sourcebook (added 2026-07-27; creator asked for more options)

Video is one instrument. The full option set, ranked by pathos-with-honesty:

1. **Licensed stock loops** (Pexels/Coverr/Mixkit/Pixabay) — the flagship as proposed;
   ~2–4 MB, real footage of the real place, curated per guide.
2. **Commons WebM** — fallback library; same File:/credit pipeline as photos.
3. **Cinemagraph / animated AVIF** — a still where one thing moves; ships and autoplays as
   an image, ~0.3–1 MB; the quiet connoisseur option.
4. **The Painted Atlas (the universal default)** — CSS/SVG terrain painted from the guide's
   own extracted palette, sky keyed to the destination's local clock (already computed for
   the masthead), contour layers drifting like slow weather. ZERO assets, zero sourcing,
   reduced-motion clean — and **automatic for every guide from birth**, which makes "living"
   a property of the system rather than of sourcing. Live demo in the design study, Plate 07.
5. **Creator's own footage** — the long game; the learnings loop points here (after a trip,
   the cover can become what was actually seen — Plan⇄Actual as cinema).
6. **Declined, with reasons:** AI-generated video (even pathos should be footage of the
   actual place; synthetic scenery quietly lies), YouTube/Vimeo embeds (tracking + chrome +
   CSP), Lottie (runtime dependency for an app-ish look — reserved).

**The stack:** Painted Atlas from birth → stock/Commons/cinemagraph as curated per-guide
upgrades → own footage after trips. Delivery for all: poster-first, lazy, gated
(reduced-motion / Save-Data / in-view), visible pause, credit where footage exists.
Hosting: hot-link library CDNs first; the existing Cloudflare account is the self-host
fallback if hot-linking proves flaky.

## Scale — the factory (added 2026-07-27; creator asked about expansion)

The architecture already answers it: **shared components are global; only JSON is
per-country** (CLAUDE.md guardrail). Every surface in this plan lives at the layout level,
so `scaffold-guide.mjs` + the new-guide pipeline produce the full format for any country
with zero per-country design work:

- **Automatic at scaffold:** the format itself, Painted Atlas cover, palette extraction from
  the first photo, route-draw once pins exist, both navigation organs, stats/colophon/OG/
  print, tab-budget enforcement.
- **Curated once per guide:** cover footage (an upgrade over the painted default, never a
  requirement), the cover photo/poster, a non-default tab budget.
- **Creator-signed, never automated:** section titles (the voice standard proposes; the
  creator approves) and every fact — the ethos register has no autopilot.
- **Hub at scale:** already count-aware (editorial 2-up ≤4, grid 5+). Designed next tier:
  at 10+ guides the Atlas grows continent shelves + the existing search; every guide stays
  in the complete index (completeness beats tidiness — no pagination black holes).

## Move C — One cartographic world (visual integration end-goal)

The hub, guide interior, story mode, OG, share, and print surfaces read as **plates of one
atlas at different zooms**:

- **Hub = continental zoom** (already closest to done): Overture route + contours; grid cards
  styled as numbered plates ("Plate 03 — South Korea").
- **Masthead = country zoom — CLEAN (decided 2026-07-27):** the living cover carries only
  image, title, and scrim. The route-draw overlay was cut ("flies on the wall"); the guide's
  real geography lives in the journey sheet's spine, the day-leg headers, and the map
  surface. Nothing crawls over a photograph.
- **Section anchors (decided 2026-07-27 — figure + photo):** every section opens with a
  visual anchor. Baseline: a figure DERIVED from the guide's own data — day-timeline from
  day entries, transit-line diagram from transit links, booking ring from checklist state —
  so every current and future guide generates its own anchors with zero hand-drawing.
  Upgrade: a photo band where a good image exists (Commons, credited, ambient). Motion
  budget: one draw-in per figure on first view (~600 ms), then stillness; reduced-motion
  renders figures complete. This is the anti-prose-wall move: the figure is the section's
  thesis at a glance.
- **Interior gets the cartographic DNA back:** thin topo-rule dividers between groups;
  section numbers styled as chart indices (№ 01); day entries get a route-leg header
  (Day 4 · Jongno → Changdeokgung · 4.2 km) derived from existing pin data. The two-column
  card wall gains the editorial measure MOTION.md already names: full-width serif lead,
  mono data rail.
- **The map stops being only a tab:** any venue/waypoint tap opens the existing map surface
  as an overlay sheet ("where is this, from here") — reusing the map feature, not rebuilding
  it. Surfacing beats sourcing.

## Move F — The Composer (added 2026-07-27; creator-requested): tabs assemble themselves

Today tabs are buckets chosen at scaffold time. The Composer inverts it: **research emits
tagged units; deterministic code assembles each guide's tabs; the creator signs.** No model
ever freelances information architecture.

- **Unit facets join the schema.** Every content unit (venue, brief, checklist, day,
  warning) carries: `theme` · `phase` (before / arrival / daily / leaving) · `rank` (from
  the intake's ranked priorities) · `weight` (derived: item counts / prose length / ⚠
  presence). The research pass the pipeline already runs is where tagging happens — the
  agent tags, nothing more.
- **`scripts/compose-guide.mjs`** — pure, unit-tested, beside `scaffold-guide.mjs`. Rules,
  in order: **Spine** (Plan · Essentials · Transit · Days · Sources always exist — but may
  fold when near-empty, e.g. Sedona's Transit folds into Plan/Days for a one-car trip);
  **Anchor** (a top-2 intake priority with sufficient weight earns its own tab — Korea's
  MSI + GO Fest); **Merge** (a theme below threshold folds into its host — no one-paragraph
  tabs); **Reader-order** (tabs sort by when the traveler needs them, never alphabet);
  **Budget** (`tabBudget` binds; merging may never hide a ⚠ — that fails the build instead).
- **Pipeline integration:** scaffold calls compose for new guides (auto); CI +
  research-pass run `compose --check` on edits. **Drafts recompose freely before
  graduation; LIVE guides get proposals only** — a compose-check comment naming the change
  and waiting for sign-off (the continuity doctrine already demands this).
- **Naming rides Move D:** labels come from the literal-label vocabulary keyed by facets;
  descriptors are generated as proposals and remain creator-signed content.

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
| R1 | Quiet type (token-level: Literata `standard` opsz variant + Source Sans 3 in base.css) + literal labels & descriptors per guide (creator-signed; standard into guide-author skill) | zero-layout-shift check per surface (type metrics differ); grep dist/ for old family names; a11y contrast re-verify |
| R2 | Mobile goes native: bottom bar (4 destinations), journey sheet, Today chip; mobile pill strip retires; SOS post kept | thumb-reach on real device; sheet = plain scroll, no scroll-jack; a11y (sheet as dialog/nav landmark); baselines re-recorded on CI |
| R3 | Desktop horizon: line replaces pills (desktop only), absorbs reading progress, tablist semantics kept | a11y suite green; arrow-key ring intact |
| R4 — **SHIPPED 2026-07-28** | Living covers: Painted Atlas universal default (masthead + hub-card fallback + photo-fail backstop; `src/lib/terrain.ts` seeded/tested, `PaintedAtlas.astro`, destination-local sky) · cover schema widened (`src` direct royalty-free CDN with `{w}` srcset token, `video {src,poster,credit,creditUrl,license}`; non-Commons ⇒ credit+license zod-REQUIRED) · masthead footage layer (poster-first, reduced-motion/Save-Data/in-view/visibility gates, visible pause, credit swap, error ⇒ still stands) · Korea flagship footage wired (Mixkit 20095, Gwanghwamun/Gyeongbokgung timelapse, 2.83 MB 720p, hot-link verified live). Creator widened sourcing to royalty-free libraries this session. Deferred: hub hover previews (revisit with R5); Denmark/Sedona footage — honest blanks (see note below the table). | licensed-footage delivery smoke test from deployed site; Save-Data/reduced-motion forced once each; credit+license in schema; CLS re-measure |
| R5 — **SHIPPED 2026-07-28** | Interior atlas + section anchors: journey-line figures derived from the guide's own data (`src/lib/anchors.ts`, pure + 14 tests — Days timeline from day entries with today ringed client-side; Transit line from route steps' own bold leads; booking rings live over checklist state ≥4 items) · per-day route-leg headers (first stop → last stop · ≈km, summed ONLY over fully-coordinated legs) · voice descriptors (`descriptors` record, zod rejects keys no group uses; Korea's staged set shipped, every phrase verified against in-guide content — "the rain plan" was cut as invention) · cartographic neatline under group titles · hub hover previews (living cover plays on dwell, R4 gates apply). Draw-in once per figure via reveal.js's safety pattern; reduced-motion = complete frames, verified. Photo bands: the existing cat-opener photo fan already serves this; full bands deferred to content curation. | reduced-motion path (figures render complete); pin-less fallback; print + OG parity; anchors derive from data only — never hand-drawn |
| R6 — **SHIPPED 2026-07-28** | The Composer: facets in schema (`theme`/`phase`/`rank` optional on all 14 section types; weight DERIVED, never stored) · `scripts/compose-guide.mjs` — pure core (no fs/Date/random), rules SPINE → ANCHOR → MERGE → ORDER → BUDGET, 17 tests incl. determinism, idempotence, catalog no-unit-loss, dense-guide identity (korea+denmark compose to exactly themselves), phase-host folds, anchor immunity, both budget paths, and a real-CLI `--check`-never-writes proof · research-pass workflow runs the check every pass: DRAFTS auto-apply on the research branch, LIVE guides get the printed proposal in the job summary · `--write` refuses live guides without `--creator-signed` (assertWritable, tested) · writing reuses split-guide.mjs so shape/naming decisions stay in one home. | composer output is byte-deterministic given the same units (test); force one failure (⚠-hiding merge must fail the build); live-guide check-mode NEVER writes; guide-shape test still green |

**R6 ledger (2026-07-28).** Two deliberate divergences from the original sketch: (1) *scaffold
does NOT compose* — a fresh scaffold's spine placeholders are near-empty by definition and would
fold before research fills them; composition rides the research pass instead, which covers "automatic
for new guides" because every new guide is a draft moving through that pass. (2) *The identity
invariant is scoped to dense guides* — the Composer's first real act was a standing proposal on the
live **us** guide (fold "Etiquette & language" w2 and "Food & shopping" w2 — genuine one-card tabs,
exactly the "no one-paragraph tabs" rule). That proposal AWAITS THE CREATOR: apply with
`npm run compose-guide -- --slug us --write --creator-signed`, tune the fold targets first by
tagging those sections' `phase` (untagged folds default to Plan), or dismiss by leaving it — the
check exits 2 informatively and never writes.

**R4 footage ledger (2026-07-28).** Shipped: Korea — Mixkit `traditional-palace-in-korea-20095`
(Gwanghwamun Gate at Gyeongbokgung, daytime timelapse; frame-verified against the guide's own
Gyeonghoeru cover photo — same palace complex, honest continuity). Honest blanks, by rule not
by laziness: **Denmark** — the only ≤4 MB Copenhagen clip found (Mixkit 22062, Little Mermaid)
would switch the cover's identity away from its Nyhavn photo mid-fade; candidates for a future
pass: Mixkit 22059 Opera House (8.5 MB, over ceiling), Coverr's genuine Nyhavn aerials (blocked:
ephemeral `coverr-temp-…` URLs only, unusable without their API). **Sedona/US** — zero Sedona
footage on any keyless-reachable library; Grand Canyon stand-ins declined ("footage of the
actual place" rule). Both guides keep photo + Painted-Atlas backstop, which is a complete cover.
Source-access notes live in docs/MOTION.md's R4 chapter.

## Execution protocol (unattended Opus sessions — read before running any phase)

**Session contract, every phase:** (1) ENTRY — on branch, previous phase merged, all gates
green, HANDOFF read. (2) WORK — this phase's scope and nothing else; a discovered fork
outside scope is recorded in the plan, not improvised. (3) EXIT — the full ship loop
(`npm run build` 0 errors · `npm test` green · `astro preview` at 375px + desktop, dark,
reduced-motion · grep `dist/`) + boundary checks where a phase touches a seam + commit +
push + HANDOFF Snapshot/Where-we-left-off rewritten. A phase that cannot pass its gates
STOPS AND REPORTS; it never pushes past a red gate.

**Hard boundaries (no phase may cross without the creator):** title/descriptor text on
live guides · live-guide recomposition (proposal-only, always) · footage selection ·
re-recording a11y baselines anywhere but CI · anything the morning answers below left
unanswered.

**Per-phase session prompts (paste one per session):**
- R1: "Execute R1 of docs/PLAN_VISUAL_REDESIGN.md: Quiet type + literal labels. Creator
  answers: [Q1/Q2]. Ship loop + zero-layout-shift gate."
- R2: "Execute R2: mobile bottom bar + journey sheet + Today chip per the plan. Bar
  destinations: [Q3]. Ship loop + a11y gates."
- R3: "Execute R3: desktop horizon line replacing pills, absorbing reading progress."
- R4: "Execute R4: living covers — Painted Atlas default + footage upgrades per [Q4]."
- R5: "Execute R5: section anchors + interior atlas per the plan."
- R6: "Execute R6: the Composer per Move F. Authority: [Q5]."

Model routing (revised 2026-07-28, creator's ask): **R1–R6 execute on Fable
(`claude-fable-5`)** — the model that authored every study and this protocol. Opus is the
fallback executor if Fable is unavailable; composer unit-tagging rides the existing
(Sonnet) research pass. HANDOFF's model-economy note should be updated when R1 lands.

## Delegated decisions (2026-07-28 — creator: "you determine the best outcome")

All reversible on the creator's word, recorded so no session re-litigates them:
type = Quiet Edition locked · descriptors = staged set ships as working copy (creator may
edit before graduation) · bottom bar = Journey · Today · Map · Kit (Search in the sheet,
Trip Split inside Kit) · cover stack = Painted Atlas default + footage upgrades +
hot-link-first · Composer authority = drafts auto, live proposal-only · unattended range =
full arc R1→R6, one report per phase.

## The last fork — the motion language (creator's choice, staged as live mock-ups, Plate 10)

Motion is the creator's stated key, and taste forks have been missed twice — so this one is
theirs, from three complete languages demoed live: **A · Still waters** (motion in covers
only; figures draw once; today's doctrine polished) · **B · The journey breathes**
(RECOMMENDED — continuous motion reserved for objects that encode live meaning: the
read-fill creeps, its tip glows, today's dot breathes; chrome still) · **C · Cinema** (a
full entrance scene per view — title rise, horizon draw, stations landing, day-dot travel —
then stillness; highest risk to the visuals-never-outrank-scrolling law). The winning
language becomes a MOTION.md chapter and parameterizes every R-phase. If B: add the rule
"continuous motion only on meaning-bearing objects; decoration gets one entrance, then
stillness."

## The morning questions (2026-07-27 — the six answers that unlock unattended execution)

Q1 Quiet Edition type: lock / adjust / restage? · Q2 Korea descriptors: approve / edit /
rewrite? · Q3 Bottom-bar four: Journey·Today·Map·Kit or swaps? · Q4 Cover stack: painted
default + hot-link confirmed? · Q5 Composer authority: drafts auto + live proposal-only?
· Q6 Unattended range: R1 only / R1–R3 / full R1–R6? (Full text + options: the design
study's "Morning questions" section.)

## Clarifying questions (historical gate record — superseded where marked decided)

1. ~~**Video sourcing policy.**~~ **DECIDED 2026-07-27 (creator):** covers are the pathos
   layer — liberal sourcing from any well-licensed library, chosen for feeling, credited,
   accent-graded. The verification apparatus applies to content only. See "The two registers"
   above.
2. ~~**Expedition Line: replace or augment?**~~ **DECIDED 2026-07-27 (creator):** pills
   retire on both devices; navigation splits by device (desktop horizon, mobile bar + sheet).
   See Move B.
3. **The four bottom-bar destinations.** Proposed: Journey · Today · Map · Kit. Swap one for
   Trip Split? For Search? Four is the budget; the names are the creator's call.
4. ~~**The re-titles.**~~ **DECIDED 2026-07-27 (creator):** labels literal always; warmth in
   descriptors only; Days/Transit/Sources are the surviving label upgrades. Descriptor text
   still gets per-guide sign-off (it's content).
5. **The faces, round three.** Quiet Edition staged: Literata alone (display via optical
   sizes) + Source Sans 3. Awaiting the creator's eye on the three-generation specimen.
   *Rec: this one — one family can't clash with itself.*
5b. **DECIDED 2026-07-27 (creator):** covers are CLEAN (no route overlay — "flies on the
   wall"), and every section gets an anchor (figure + photo — "both").
6. **Hero video weight ceiling** (~4 MB, masthead-only first — rec) and **pin-less
   route-draw** (contours until real pins exist — rec): both carried from Study Nº 1,
   defaults recommended.
7. **The cover stack** (Move A½): Painted Atlas as the automatic default for every guide,
   footage as a curated per-guide upgrade, own footage after trips? And hosting: hot-link
   library CDNs vs. self-host on the existing Cloudflare account?
   *Rec: painted default + hot-link first.*
