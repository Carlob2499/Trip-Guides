# The Living Atlas — drafting history (2026-07-27 → 2026-08-10)

> **History, kept honest.** This is the narrative half of what was `PLAN_VISUAL_REDESIGN.md` and
> then `docs/reference/visual-redesign.md`: the render review that started it, the end-goal
> sentence, the superseded navigation and voice narratives, the scale argument, the R1–R6 phase
> table with its ledgers, and the execution record. Split out on 2026-08-14 because the file was
> half spec and half history and read as neither.
>
> **The spec half is still live** at `docs/reference/visual-redesign.md` — Moves A, A½, C, D and F
> in current form, which is what `living-cover.js`, `PaintedAtlas.astro`, `anchors.ts` and
> `compose-guide.mjs` cite. Where a section below disagrees with it, the reference doc wins and
> this one is the record of how the decision got made. Everything here is verbatim from the
> original; paths it names may no longer resolve.

---

## The original status header

> Two of its own pointers were already dangling when this was archived: the Clarifying-questions
> block it sends you to had been cut on 2026-08-10, and the Execution record it credits with naming
> "the one fork still genuinely open" names none. The open threads that survive are listed under
> "Still open" in the reference doc.

### The Living Atlas — living covers, device-split navigation, the Composer

> **What this is: the SPEC for shipped behaviour, not a plan.** Renamed from
> `PLAN_VISUAL_REDESIGN.md` on 2026-08-10, when `PLAN_` was made to mean "not built yet" —
> live code cites this file as its own specification (`living-cover.js`, `PaintedAtlas.astro`,
> `anchors.ts`, `terrain.ts`, `compose-guide.mjs`, `painted-atlas.css`, `content.config.ts`).
> The dead process scaffolding was cut the same day; see the Execution record at the foot,
> which also names the one fork still genuinely open. Historical status note follows.
>
> Status: **PARTLY SHIPPED — this doc is now half spec, half history** (corrected 2026-08-02;
> it previously read "VISION / UNAPPROVED · nothing here is building yet", which was badly
> wrong: live code cites this doc as its own specification). Drafted 2026-07-27 from a real
> render review (Playwright screenshots of the built site: hub + Korea guide, desktop/mobile,
> light/dark). This doc extends `docs/reference/motion.md`'s doctrine; it does not replace it.
>
> **Shipped since drafting — do NOT re-plan these:**
> - **Move A · Living covers** → `src/scripts/living-cover.js`, `cover.video` in the schema
>   (`src/content.config.ts`). Research never sets `cover.video`; the creator frame-verifies
>   and signs each clip.
> - **Move B · Navigation splits by device** → delivered by `docs/archive/PLAN_MOBILE_NAV.md`
>   (`src/features/mobile-nav/`), plus the masthead pill row cut 6 → 3.
> - **Move C · One cartographic world** → `src/components/PaintedAtlas.astro`,
>   `src/styles/painted-atlas.css` (the honest default cover when no photo is earned).
> - **Move F · The Composer** → `scripts/compose-guide.mjs`, wired into `research-pass.yml`
>   and `npm run compose-guide`.
>
> The remaining moves are still gated by the Clarifying questions below, per the
> Clarifying-Questions Doctrine.
>
> **Mock-ups exist — Study Nº 2, Field Edition** (2026-07-27):
> `node docs/mockups/build-mockup.mjs` renders the design study
> (`docs/mockups/living-atlas.html`, gitignored — it embeds ~1.4 MB of fonts + Commons
> photos as data URIs). Sections: type specimen (Field Edition vs shipped faces) · living
> hub hero (Sedona) · Korea masthead + route draw · the voice (Korea's 11 re-titles) ·
> nav split (desktop horizon interactive + mobile bar/sheet phones) · interior atlas ·
> four-zoom continuum · the R1–R5 programme + decision ledger. Motion is CSS simulation;
> the page honors `prefers-reduced-motion`.

---

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

---

## Superseded: Move B as drafted (the horizon and the four destinations)

> What shipped instead is in the reference doc's Move B: the spine rail owns the guide body and
> the phone bar carries four slots, none of them named below.

### Move B — Navigation splits by device (revised 2026-07-27; fork №2 DECIDED: pills retire)

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

---

## Superseded: Move D as drafted (three rounds of the voice)

### Move D — The voice (REVISED 2026-07-27, round 3 — titles DECIDED) + the Quiet Edition type

**Titles — DECIDED: information first, warmth second.** Round 2's evocative one-worders
("Pocket", "Receipts") traded wayfinding for cleverness and were withdrawn. The standing
rule: **the label you navigate by is literal, always**; the warmth lives in a small
descriptor under each section head. Only label changes that GAIN information per glance
survive: Itinerary→**Days**, Getting around→**Transit**, References→**Sources**. Korea's
descriptor set is staged in the design study (Plate 03). **REVISED 2026-07-28 (creator):
the "warmth" half is withdrawn — the shipped Korea set read as AI-written and was cut to
three informational lines. Descriptors are now RARE + informational-only (flat facts
where the label alone can't carry the meaning); the full ruling + banned patterns live
in the guide-author skill's block-types.md voice standard.** Standard goes into the
`waypoint-guide-author` skill; descriptors are content and get per-guide sign-off.

**Type — the Quiet Edition (round-3 proposal; fork №5 restaged).** Round 2's
Fraunces + Courier read as costume — three loud voices = clutter. The correction is
subtraction: **ONE serif — Literata — wearing display AND body through its real optical
sizes** (the `standard` fontsource variant carries `opsz`), plus **ONE quiet humanist
sans — Source Sans 3 — for every label and number** (tabular figures). Two voices total;
Bricolage Grotesque and Spline Sans Mono retire; no new serif enters. The three-generation
specimen (shipped → Nº 2 withdrawn → Nº 3) is in the study's Foundation section.

---

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

---

## Move C as drafted (the whole cartographic end-goal)

> The reference doc keeps this move's section-anchor bullet, which `src/lib/anchors.ts` cites. The
> hub, masthead and interior bullets below were overtaken by the Atlas design system
> (`docs/design-handoff/DESIGN.md`).

### Move C — One cartographic world (visual integration end-goal)

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

---

## Phasing (revised 2026-07-27 — foundation first; each phase lands the full ship loop + boundary checks)

| Phase | Scope | Risk gates |
|---|---|---|
| R1 | Quiet type (token-level: Literata `standard` opsz variant + Source Sans 3 in base.css) + literal labels & descriptors per guide (creator-signed; standard into guide-author skill) | zero-layout-shift check per surface (type metrics differ); grep dist/ for old family names; a11y contrast re-verify |
| R2 | Mobile goes native: bottom bar (4 destinations), journey sheet, Today chip; mobile pill strip retires; SOS post kept | thumb-reach on real device; sheet = plain scroll, no scroll-jack; a11y (sheet as dialog/nav landmark); baselines re-recorded on CI |
| R3 | Desktop horizon: line replaces pills (desktop only), absorbs reading progress, tablist semantics kept | a11y suite green; arrow-key ring intact |
| R4 — **SHIPPED 2026-07-28** | Living covers: Painted Atlas universal default (masthead + hub-card fallback + photo-fail backstop; `src/lib/terrain.ts` seeded/tested, `PaintedAtlas.astro`, destination-local sky) · cover schema widened (`src` direct royalty-free CDN with `{w}` srcset token, `video {src,poster,credit,creditUrl,license}`; non-Commons ⇒ credit+license zod-REQUIRED) · masthead footage layer (poster-first, reduced-motion/Save-Data/in-view/visibility gates, visible pause, credit swap, error ⇒ still stands) · Korea flagship footage wired (Mixkit 20095, Gwanghwamun/Gyeongbokgung timelapse, 2.83 MB 720p, hot-link verified live). Creator widened sourcing to royalty-free libraries this session. Deferred: hub hover previews (revisit with R5); Denmark/Sedona footage — honest blanks (see note below the table). | licensed-footage delivery smoke test from deployed site; Save-Data/reduced-motion forced once each; credit+license in schema; CLS re-measure |
| R5 — **SHIPPED 2026-07-28** | Interior atlas + section anchors: journey-line figures derived from the guide's own data (`src/lib/anchors.ts`, pure + 14 tests — Days timeline from day entries with today ringed client-side; Transit line from route steps' own bold leads; booking rings live over checklist state ≥4 items) · per-day route-leg headers (first stop → last stop · ≈km, summed ONLY over fully-coordinated legs) · voice descriptors (`descriptors` record, zod rejects keys no group uses; Korea's staged set shipped, every phrase verified against in-guide content — "the rain plan" was cut as invention) · cartographic neatline under group titles · hub hover previews (living cover plays on dwell, R4 gates apply). Draw-in once per figure via reveal.js's safety pattern; reduced-motion = complete frames, verified. Photo bands: the existing cat-opener photo fan already serves this; full bands deferred to content curation. | reduced-motion path (figures render complete); pin-less fallback; print + OG parity; anchors derive from data only — never hand-drawn |
| R6 — **SHIPPED 2026-07-28** | The Composer: facets in schema (`theme`/`phase`/`rank` optional on all 14 section types; weight DERIVED, never stored) · `scripts/compose-guide.mjs` — pure core (no fs/Date/random), rules SPINE → ANCHOR → MERGE → ORDER → BUDGET, 17 tests incl. determinism, idempotence, catalog no-unit-loss, dense-guide identity (korea+denmark compose to exactly themselves), phase-host folds, anchor immunity, both budget paths, and a real-CLI `--check`-never-writes proof · composition auto-applies inside the research agent's done gate — after the networked verify PASS, while still a draft (congruence fix, same day: the original post-agent auto-write fired too late on the PASS path and too early on cut-offs); the post-agent step is check-only and surfaces proposals in the job summary · `--write` refuses live guides without `--creator-signed` (assertWritable, tested) · writing reuses split-guide.mjs so shape/naming decisions stay in one home. | composer output is byte-deterministic given the same units (test); force one failure (⚠-hiding merge must fail the build); live-guide check-mode NEVER writes; guide-shape test still green |

**R6 ledger (2026-07-28).** Two deliberate divergences from the original sketch: (1) *scaffold
does NOT compose* — a fresh scaffold's spine placeholders are near-empty by definition and would
fold before research fills them; composition rides the research pass instead, which covers "automatic
for new guides" because every new guide is a draft moving through that pass. (2) *The identity
invariant is scoped to dense guides* — the Composer's first real act was a standing proposal on the
live **us** guide (fold "Etiquette & language" w2 and "Food & shopping" w2 — genuine one-card tabs,
exactly the "no one-paragraph tabs" rule). **RESOLVED 2026-07-29 — the creator signed ("Fold
them"): both sections tagged `phase: "daily"` and folded into Days (9 tabs → 7), applied via
`--write --creator-signed`. Applying it surfaced and fixed a real ORDER defect: a folded
arrival used to claim its host's first-appearance slot, so early-document Etiquette folding
into Days HOISTED Days ahead of Transit — a signed fold silently becoming an unsigned tab
reorder. A group's slot now comes from its native units only (folded-arrival fallback for
hosts with no natives); regression test "a folded arrival never hoists its host's tab slot"
pins it.**

**R4 footage ledger (2026-07-28).** Shipped: Korea — Mixkit `traditional-palace-in-korea-20095`
(Gwanghwamun Gate at Gyeongbokgung, daytime timelapse; frame-verified against the guide's own
Gyeonghoeru cover photo — same palace complex, honest continuity). Honest blanks, by rule not
by laziness: **Denmark** — the only ≤4 MB Copenhagen clip found (Mixkit 22062, Little Mermaid)
would switch the cover's identity away from its Nyhavn photo mid-fade; candidates for a future
pass: Mixkit 22059 Opera House (8.5 MB, over ceiling), Coverr's genuine Nyhavn aerials (blocked:
ephemeral `coverr-temp-…` URLs only, unusable without their API). **Sedona/US** — zero Sedona
footage on any keyless-reachable library; Grand Canyon stand-ins declined ("footage of the
actual place" rule). Both guides keep photo + Painted-Atlas backstop, which is a complete cover.
Source-access notes live in docs/reference/motion.md's R4 chapter.

**Pipeline congruence (2026-07-28, post-R6).** The arc's final move: making the GENERATION flow
deliver the vision unattended, per "new guides inherit everything". Audit finding — the R1–R6
surfaces all existed, but the research pass never fed three of them (no facet-tagging duty, no
descriptors, no cover/footage duty in the prompt), and the Composer's draft auto-apply was wired
after the agent step, where the PASS path had already graduated + merged (proposal-only forever)
and the cut-off path was still half-researched (premature folds). Fixes, all shipped: (1) compose
`--write` moved INSIDE the agent's done gate — post-verify-PASS, pre-graduation, the one moment a
guide is complete AND a draft; the post-agent step is now check/propose/guard-only. (2) THE LIVING
ATLAS PASS added to the research prompt + SKILL.md (headless and interactive stay congruent):
facets → descriptors (grep-verified) → cover photo (Commons-validated, Painted Atlas an honest
default) → footage scout (0–2 stable-URL candidates recorded in the intake doc; `cover.video` is
NEVER set by research — frame-verification is the creator's sign-off). (3) The scaffold seeds
`phase` on every foldable-group backbone section (fold-targets honest from birth; Plan/Days/Sources
stay untagged — they never fold) and the intake template carries the `## Cover art — footage
candidates` ledger. (4) New scaffold↔schema contract test (content.config.test.ts) — the seam
where scaffold output meets the build schema had no gate. Cover-art mechanics joined descriptors +
facets in block-types.md as their single home.

---

## Execution record (closed 2026-08-10)

The R1–R6 arc ran and landed; the Atlas migration then rebuilt on top of it. What used to sit
here — the per-phase session contract, the six paste-one-per-session prompts, the "morning
questions", the delegated-decisions list and the clarifying-question gate record — was ~90
lines of scaffolding for sessions that have already happened, and it was the largest single
block of dead text in `docs/`. Cut, not archived: the ship loop it restated lives in
`CLAUDE.md`, and every decision it recorded is either visible in the shipped code or has moved
to `CONTEXT.md`.

Verified shipped while cutting, so no session re-opens them: **Quiet Edition type** (Literata
across display and body via its optical-size axis, Source Sans 3 for data — `src/styles/
base.css`) · **the mobile bottom bar** (`src/features/mobile-nav/ui/botbar.js`) · **living
covers and the Painted Atlas default** (`src/scripts/living-cover.js`,
`src/components/PaintedAtlas.astro`) · **section anchors** (`src/lib/anchors.ts`) · **the
Composer** (`scripts/compose-guide.mjs`).

**The motion language is settled too.** Three languages were staged as live mock-ups; the
creator chose **C's entrance + B's life** on 2026-07-28, and it landed exactly where it was
meant to — `docs/reference/motion.md`, "the overture, then the heartbeat", with a 2026-08-03 amendment
for work-in-progress motion. Read it there; nothing about it lives here any more.
