# The Living Atlas — living covers, the Painted Atlas, section anchors, the Composer

> **This is the SPEC for shipped behaviour, not a plan.** Live code cites it by section name:
> `src/scripts/living-cover.js` and `src/content.config.ts` (Move A, A½), `PaintedAtlas.astro`,
> `src/lib/terrain.ts`, `painted-atlas.css` (Move A½ №4), `src/lib/anchors.ts` (Move C),
> `scripts/compose-guide.mjs` (Move D's label vocabulary, Move F). Change a rule here in the same
> pass as the code, or the citation starts lying.
>
> **The history moved out on 2026-08-14** — the drafting story, the R1–R6 phase table and its
> ledgers, the status corrections and the superseded navigation and voice narratives are in
> `docs/archive/visual-redesign-history.md`. This file extends `docs/reference/motion.md`'s
> doctrine and does not replace it; the guide page's own design authority is
> `docs/design-handoff/DESIGN.md`.

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
(`docs/reference/motion.md`: spend the boldness in one place).

- **Sourcing is liberal — the pathos register (see Two Registers above).** Footage may come
  from any well-licensed library (Pexels, Coverr, Mixkit, Commons, creator-shot), chosen for
  feeling rather than documentary fidelity, and may be graded/tinted toward the guide's
  accent for cohesion. Two invariants survive from the photo pipeline: every clip is
  **credited** (visible credit line, license recorded in the schema) and every clip is
  **licensed for this use**. Schema (`src/content.config.ts`):
  `cover.video: { src, poster?, credit, creditUrl?, license }` beside the existing `cover`, with
  `credit` + `license` zod-REQUIRED because non-Commons licensing is not machine-verifiable. The
  poster IS the current photo — palette extraction is untouched (runs on the poster; the identity
  engine's input does not change).
- **Delivery is tiered, poster-first, budget-safe.** The photo renders exactly as today
  (first paint unchanged — the 200 KB per-page budget never sees video). Video is a lazy
  enhancement gated on ALL of: `prefers-reduced-motion: no-preference`, Save-Data off,
  `IntersectionObserver` in-view, tab-visible, and a per-file ceiling (~4 MB by curation).
  Hot-linked from a library CDN — Commons `Special:FilePath` or a royalty-free library (R4
  widened it) — so nothing heavy enters the repo. Pause when off-screen;
  visible pause control (WCAG 2.2.2); `muted playsinline loop`, no audio ever.
- **The morph stays cheap.** Card→hero View Transition carries the *poster*; the video
  cross-fades in ~300 ms after arrival (house ease). Hub cards may preview on hover/focus at
  desktop only — never autoplay N videos in a grid.
- **Fallback chain is the current one, extended:** video → poster photo → palette gradient +
  contours. A guide with no video is not a lesser guide; the field is optional forever.
- **Where the doctrine lives:** `docs/reference/motion.md`, chapter "Living covers — the R4
  rules" — the cover stack, the gate list, the ~4 MB curation ceiling, and the rule that video
  never counts against the JS first-paint budget. Change a delivery rule there and here together.

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

## Move B — Navigation splits by device

The pill toolbar retired on both devices, and its replacement is **not the same organ on both** —
11 groups never fit a 375px strip with dignity. What shipped, and where it lives now:

- **The guide body's rail** is `docs/design-handoff/DESIGN.md`'s spine ("The rail — every group is
  a station"): a pill row with a progress line on the phone, a vertical spine on the tablet, a
  horizontal spine on the desktop, switched by container query. It supersedes both this plan's
  desktop "horizon" and the R4 pill strip; `src/features/guide-rail/` is the code.
- **Phone chrome** is `src/features/mobile-nav/` — a four-slot bottom bar (the group you are
  reading · the next-most-opened group · ☰ Groups · Tools), the journey sheet behind ☰ as the live
  table of contents, the Today chip, and swipe between tabs. The four-slot layout was chosen on a
  phone against a five-slot variant (creator, 2026-08-08); the plan's proposed
  Journey · Today · Map · Kit destinations are not what shipped — Today, the map and Trip Kit live
  in the sheet's tool row instead.
- **SOS keeps its own red post**, top-right on every screen. An emergency never hides in a drawer.
- **The law over all of it: chrome is still.** Motion lives in the covers; chrome never animates on
  its own; the sheet moves only under a thumb; no scroll-jacking, ever.
- **Same-object rule** (uniform application): hub route → the guide's spine → the sheet's vertical
  spine → story-mode rail → print/OG route strip are one object worn many ways.

## Move C — One cartographic world (section anchors)

Every guide surface reads as a plate of one atlas at a different zoom. The hub's and the guide
shell's share of that end-goal now belongs to `docs/design-handoff/DESIGN.md`; what stays here is
the part live code cites — the anchors `src/lib/anchors.ts` derives.

- **Section anchors (decided 2026-07-27 — figure + photo):** every section opens with a
  visual anchor. Baseline: a figure DERIVED from the guide's own data — day-timeline from
  day entries, transit-line diagram from transit links, booking ring from checklist state —
  so every current and future guide generates its own anchors with zero hand-drawing.
  Upgrade: a photo band where a good image exists (Commons, credited, ambient). Motion
  budget: one draw-in per figure on first view (~600 ms), then stillness; reduced-motion
  renders figures complete. This is the anti-prose-wall move: the figure is the section's
  thesis at a glance.

Shipped from this move: the anchor figures (`src/lib/anchors.ts`, `src/styles/anchors.css`) —
Days timeline from day entries, transit line from route steps' own bold leads, booking ring over
checklist state; per-day **route-leg headers** (`DaysBlock.astro`: first stop → last stop, ≈km
summed only over fully-coordinated legs); and the cartographic **neatline** under group titles
(`guide.css`). The rest of the move's end-goal narrative is history — see the archive.

## Move D — The voice, and the Quiet Edition type

**The label you navigate by is literal, always.** Evocative one-worders were withdrawn: they
traded wayfinding for cleverness. Only label changes that GAIN information per glance survive
(Itinerary→**Days**, Getting around→**Transit**, References→**Sources**). `compose-guide.mjs`
carries that vocabulary as `THEME_LABELS`, which is why a bare theme tag can become a navigable
label without a model wording it.

**Descriptors are RARE and informational-only** (creator, 2026-07-28 — the first shipped Korea set
read as AI-written and was cut to three flat lines). They are content, they get per-guide
sign-off, and the full ruling plus the banned patterns live in the `waypoint-guide-author` skill's
`references/block-types.md`, not here.

**Type — the Quiet Edition (shipped R1).** ONE serif, Literata, wearing display AND body through
its real optical-size axis, plus ONE quiet humanist sans, Source Sans 3, for every label and
number (tabular figures). Two voices total; Bricolage Grotesque and Spline Sans Mono retired. The
tokens are `--font-display` / `--font-body` / `--font-data` in `src/styles/base.css`.

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
  fold when near-empty, e.g. Transit folds into Plan/Days on a one-car road trip);
  **Anchor** (a top-2 intake priority with sufficient weight earns its own tab — Korea's
  MSI + GO Fest); **Merge** (a theme below threshold folds into its host — no one-paragraph
  tabs); **Reader-order** (tabs sort by when the traveler needs them, never alphabet);
  **Budget** (`tabBudget` binds; merging may never hide a ⚠ — that fails the build instead).
- **Pipeline integration:** composition runs INSIDE the research agent's done gate —
  post-verify-PASS, pre-publish, the one moment a guide is both complete and a draft. The
  post-agent step and CI are `--check` only and surface proposals in the job summary. Scaffold
  does NOT compose: a fresh scaffold's spine placeholders are near-empty by definition and would
  fold before research filled them. **Drafts recompose freely; LIVE guides get proposals only** —
  `--write` refuses a live guide without `--creator-signed` (the continuity doctrine, mechanized).
- **Naming rides Move D:** labels come from the literal-label vocabulary keyed by facets;
  descriptors are generated as proposals and remain creator-signed content.

## What this deliberately does NOT do

- No new JS motion dependency (GSAP stays the only one; route drawing is SVG + CSS
  scroll-driven, per `docs/reference/motion.md` rule 1).
- No autoplaying grids, no audio, no scroll-jacking, no loop that competes with the story
  intro (one owner per property per element).
- No invented geography, ever — routes, pins, and any text that asserts a fact stay in the
  ethos register even when rendered inside a hero. Footage is liberal (pathos) but always
  licensed and credited, and never carries or implies a verification flag.

## Still open

- **Footage for Denmark and Sedona.** Both are honest blanks by rule, not by laziness: no
  ≤4 MB clip was found that keeps each cover's identity, so both keep photo + Painted-Atlas
  backstop, which is a complete cover. The rejected candidates and their reasons are in the
  archive's R4 footage ledger; source-access notes are in `docs/reference/motion.md`'s R4 chapter.
- **Full photo bands on section anchors.** The existing chapter photo fan serves the role today;
  bands wait on content curation, not on code.

## The design study

`node docs/mockups/build-mockup.mjs` renders the Living Atlas study
(`docs/mockups/living-atlas.html`, gitignored — it embeds ~1.4 MB of fonts and Commons photos as
data URIs). It is a design study, not a spec: motion is CSS simulation, and it honors
`prefers-reduced-motion`. The tooling stays; what each plate argued is recorded in the archive.
