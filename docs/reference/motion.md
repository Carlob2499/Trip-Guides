# Motion Doctrine — one signature, governed motion

Motion on Waypoint is a governed system, the way the tab budget governs tabs — not an accretion
of effects. This doc is the *rulebook* every motion change is judged against, plus the shipped
record (it absorbed `VISUAL_COVERS.md`).

## The signature: the trip unfolds, day by day

The ONE device this site is remembered by: **a segmented rail whose segments are the trip's
days**. It appeared three ways; the title-card intro is retired (below), leaving two:

1. ~~**Title-card story intro**~~ (2026-07-30, retired 2026-08 with the masthead plate rebuild)
   — the guide used to open as a full-bleed title card (cover + country name + day rail +
   accent gloss sweep + optional seasonal particle motif, schema `introMotif`), holding ~2.4s
   then panning into the guide. Its full-bleed CSS assumed the title sat absolutely OVER the
   photo inside one frame; the plate masthead moved the title beside the photo instead (docs/design-handoff/DESIGN.md
   "Type never sits on the photograph"), which the intro's fullscreen/pan transitions can't
   express without a rebuild. Retired rather than rebuilt because the redesign spec's own
   "Hub card → guide masthead: FLIP the plate" transition (README.md §Interactions) supersedes
   it — that's Phase 3 (the hub) work, not a patch here. `story-open.js`, `story-petals.js`,
   `story.css`, and the `introMotif` schema field are all deleted; guides now take the normal
   `gsap-hero.js` arrival on every visit, including the first.
2. **Story-mode itinerary** — the rail becomes navigation in the full-screen one-day-per-view
   deck (`story-mode.js` + `story-mode.css`). Unaffected — a different feature that happens to
   share the word "story".
3. **The card→hero morph** — the guide "opens" from its hub card via cross-document View
   Transitions (`transitions.css`). **V5:** the hub card's accent bar (`.hubcard-bar`) shares a
   `view-transition-name` with the masthead's own accent rule (`.masthead-rule`) — the trip's
   colour literally carries across the navigation, not just coincidentally matches (both sides
   already computed the same accent independently via `accentForGuide()`; the shared name is
   what makes the transition itself carry it).

Anything new that wants to be flashy must strengthen this signature, not compete with it.
(Design rule: spend the boldness in one place.)

## The motion inventory (everything that moves, and who owns it)

| Motion | Mechanism | Owner |
|---|---|---|
| Card → masthead morph | cross-doc View Transitions, `cover-<slug>` names | `transitions.css` |
| Card accent bar → masthead rule morph | cross-doc View Transitions, `accent-<slug>` names | `index.astro` + `GuideLayout.astro` |
| Masthead arrival (every visit) | GSAP timeline (lazy import) | `gsap-hero.js` |
| Hero parallax + Ken Burns | rAF transform (JS owns the transform) | `hero-parallax.js` |
| Scroll reveals (cards/days/sights) | **native** `animation-timeline: view()`; IO fallback | `scroll-motion.css` / `reveal.js` |
| Story-mode day slide/bounce | CSS keyframes toggled by class | `story-mode.css` |
| Section flight, micro-interactions | existing modules | `section-flight.js`, `micro.js` |
| Reading progress | scroll listener → `#readProg` | `guide-ui.js` |
| Overture auto-glide + recede (hub intro → guide grid) | JS-owned: eased auto-scroll + scroll-linked scale/fade/parallax/route-draw, all cancelable | `overture.js` + `hub-motion.css` |
| Atlas card hover glow + tinted border | per-guide `--accent` via `color-mix` (border + `:hover`/`:focus` box-shadow halo) | `hub-motion.css` |
| Atlas card scroll reveal | existing native `view()` (reveal.js fallback) — unchanged | `scroll-motion.css` / `reveal.js` |

## The rules (non-negotiable)

1. **Native-first.** Scroll-linked motion uses CSS scroll-driven animations
   (`animation-timeline`) where supported — off the main thread. JS motion is either a fallback
   (reveal.js) or owns a transform CSS can't express (parallax). Never add a scroll listener for
   something `view()`/`scroll()` can do.
2. **Reduced-motion always.** Every motion has a `prefers-reduced-motion` off-path — the JS
   modules short-circuit via `reducedMotion()`, the CSS via media query. The site is fully usable
   with zero animation.
3. **Fault-safe: content is never hidden waiting on JS.** Reveals/intros animate only under a
   JS-added class (or an `@supports` gate); the base state is always visible. A wedged script
   must never leave a blank page.
4. **One owner per property per element.** Two systems never animate the same element at once —
   e.g. `cold-open` claims visit 1 and `onboard` stands down via `window.__onboardShown`;
   `reveal.js` bails when `animation-timeline` is supported. Preserve this handshake pattern
   when adding motion.
5. **Timing vocabulary.** Micro-interactions ~150ms; content transitions 300–450ms
   (`cubic-bezier(.2,.7,.2,1)` — the house ease); orchestrated arrivals ≤ ~1s. Nothing loops
   forever.
6. **Motion encodes structure.** Animate to say something true about the content (days advance,
   a card becomes its guide, content enters as you reach it) — never decoration for its own sake.
   The generic-AI test applies to motion too.
7. **Perf budget holds.** No new motion dependencies without a doctrine change (GSAP is the one
   JS-motion dep, lazy-loaded). Prefer `transform`/`opacity`; never animate layout properties on
   scroll.

   Rule 7 had two live violations until the Atlas migration's Stage F, and both were of the
   shape that hides: a length animated from a handler that fires constantly. The reading spine's
   fill set `style.height` from the scroll listener, and the `/progress/` bar set `style.width`
   from its poll tick. Both are `transform: scale*()` driven by a custom property now
   (`--spine-fill`, `--pg-progress`), and both are pinned by a test that reads the computed
   transform rather than the rendered size — a screenshot cannot tell a width from a scale.
   When adding a bar, a fill, or a rail: the element spans its track in the box model and the
   script writes a 0..1 factor. Never a percentage width.

## Verifying motion (added to the ship loop, not instead of it)

`astro preview` at mobile 375px + desktop · dark + light · **reduced-motion on** (everything
still readable, nothing animates) · check nothing is stuck hidden after a full-page scroll ·
zero console errors. For interactive motion (story mode), drive it: open, navigate, close.

## The identity engine (colour, V4)

Each guide's accent is extracted from ITS OWN cover photo (`npm run extract-palette`), gated to
≥3.0:1 on both page grounds (the same floor as the zod `theme` gate), committed to
`src/data/palettes/<slug>.json`, and resolved everywhere by ONE precedence
(`src/lib/palettes.ts`): explicit `theme` → extracted palette → country accent. Design rule
inside the extractor: **sky/water hues are generic; the subject's built colour carries place**
(Nyhavn's amber, Gyeonghoeru's dancheong green) — a photo offering nothing but blue keeps its
blue. Re-run the extractor when a guide's cover changes.

## Shipped record + direction history (so we don't relitigate)

All phases of the original "trip unfolds" system are **shipped**: V1 card→masthead View
Transition morph + optional `cover` field · V3a first-open day-story intro · V3b native
scroll-driven reveals (`reveal.js` fallback) · V3c story-mode itinerary (the one-day-per-view
deck — the less-scroll/retention payoff) · V3d lead-first density polish · V4 per-country
palette identity (above). **Dropped (V2): palette duotone graphic cards** — read as "graphic
poster"; hub cards stay photo-forward. The hub Overture/Atlas work continues in
`docs/archive/INDEX.md → PLAN_VISUAL_OVERHAUL`.

Information-delivery half of the brief (retention, not just motion): one idea per view
(story mode), a consistent editorial measure with mono-face data on the right rail, and
tighter lead-first cards — the reader reaches where/how/when/book without hunting.

Sources (Jul 2026): [MDN scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations) ·
[Chrome: animate on scroll](https://developer.chrome.com/docs/css-ui/scroll-driven-animations) ·
[WebKit: scroll-driven with just CSS](https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/)

## Contour visibility pass (U9, 2026-07-22)

The V4 signature contour textures (hub Overture background + guide masthead overlay) shipped
with an open "eyeball post-deploy" note — the strokes were possibly too faint to register at
all (`.11`/`.07` alpha on the masthead; ~10–16% tints on the hub). Raised once, values below.

| Layer | Was | Now |
|---|---|---|
| Hub `--hub-contour-far` | `muted` @ 10% | `muted` @ 16% |
| Hub `--hub-contour-mid` | `muted` @ 16% | `muted` @ 24% |
| Hub `--hub-contour-near` | `accent2` @ 12% | `accent2` @ 18% |
| ~~Masthead `[data-mast-contour="0"/"1"]`~~ | `rgba(255,255,255,.11/.07)` | retired 2026-08 — docs/design-handoff/DESIGN.md removes graticules from guide photography entirely (clutter at plate scale); the hub contour rows above are unaffected and still live |

**Settled (2026-07-23):** real Playwright screenshots were taken of the Korea guide masthead
(desktop + mobile, light + dark, over its real loaded cover photo, plus over the dark
no-photo fallback) and of the hub's pre-auto-glide contour layer, and reviewed by the creator.
**Kept as-is — no step-back.** The strokes render clearly and legibly in all four masthead
states without competing with title legibility; the U9 values hold. This closes the last open
item in `docs/archive/INDEX.md → PLAN_FIELD_REPORT_FIXES` (E8 item 5).

## V6 — QA and the honest pass (2026-07-23)

First time the FULL Playwright suite (all specs, not just the one targeted per session) ran
together this arc — surfaced findings the visual overhaul itself never touched but that a
genuine "did this cost anything" pass has to report:

- **Visual snapshot baselines were stale since before V1** — every committed `-linux.png` still
  showed the pre-Overture hub design. Reviewed each of the 8 diffs by eye (not blind-updated —
  every one traced to already-shipped, already-reviewed V1–V5 markup) before refreshing.
- **Real a11y regression, not caused by V5:** the Overture hero (`.ov-wordmark`/`.ov-inner`, V1/V2)
  sat in a bare `<section>` with no accessible name, so axe flagged its content as not contained
  by any landmark. `<section class="overture">` → `<header class="overture">` (a top-level
  `<header>` is an implicit banner landmark) — zero visual/behavioral change, confirmed via
  pixel-identical snapshots before/after.
- **Real contrast bug:** `.bs-pos` (the bottom-bar "N/total" indicator) used the raw per-guide
  `--accent` as text color against `.botSections`'s background — which is `var(--ink)`, i.e.
  intentionally INVERTED relative to the page theme in both light and dark mode. Korea's accent
  measured 2.87:1 against it (needs 4.5:1). Fixed theme-independently by blending toward
  `var(--bg)` (the button's own established contrast partner) instead of a theme-conditional
  override — verified back over 4.5:1 in both themes by hand and confirmed 100 a11y score via
  Lighthouse afterward. *(Historical: `.botSections` was retired 2026-07-30 when the bottom bar
  became a five-slot tab bar. `.bs-pos` is now screen-reader-only inside the Groups button and
  the visible position lives in the sheet head, so this contrast pairing no longer exists.)*
- **Two label/name-mismatch findings** (WCAG 2.5.3): the hub-link `aria-label="All guides"` and
  the photo-credit `aria-label="Photo source on Wikimedia Commons"` both discarded their own
  visible text. Reworded to include it (`"Waypoint — all guides"` /
  `"Photo: Wikimedia Commons — view source"`) rather than removing the labels — the extra context
  they added was worth keeping.
- **Lighthouse numbers recorded** (local `astro preview`, mobile emulation, no prior baseline
  existed to diff against — this IS the first-recorded baseline): hub 89 perf / 100 a11y / 96
  best-practices / 91 SEO. Korea guide, after the fixes above: 100 a11y / 96 best-practices / 100
  SEO; perf and TBT were noisy run-to-run in this sandbox (46–89, plausibly CPU-contention
  artifacts, not a real regression) but **CLS held steady at ≈0.244** ("needs improvement") across
  every run — a real, unexplained signal. Root cause not found this session (ruled out: the cover
  photo, which is `position:absolute` and can't itself shift layout); filed as a follow-up
  (github.com/Carlob2499/Trip-Guides/issues/19) rather than guessed at.
- **Perf budget gate** (`scripts/check-perf-budget.mjs`): JS 593 KB / 900 KB budget, CSS 126 KB /
  300 KB, largest bundle 141 KB — comfortable headroom, the overhaul didn't bloat the bundle.
  Confirmed unrelated pre-existing E2E flakes (SOS focus-trap wrap, two Trip-Split network-harness
  tests) are NOT caused by this arc (`git diff` against pre-session `main` touches none of their
  source) and filed them (#17, #18) rather than fixing out-of-scope code under this plan's banner.
- **JS-off, reduced-motion, full 375px/desktop × dark/light matrix:** all clean. The guide page
  degrades to a flat, fully-readable single-scroll document with an explicit "This guide reads
  fine without JavaScript" note — by design, unaffected by this arc.

This closes `docs/archive/INDEX.md → PLAN_VISUAL_OVERHAUL`. The doctrine above (signature, inventory, rules,
identity engine) reflects what's actually shipped as of this pass.

## The motion language — "the overture, then the heartbeat" (decided 2026-07-28)

Chosen by the creator from three staged languages (design study, Plate 10): **C's
entrance + B's life.** Two rules govern every surface from R1 onward:

1. **The overture plays once per arrival.** On first view of a surface, its entrance
   choreography runs a single time — title settles, journey line draws, stations land in
   sequence, the day-dot travels home — then finishes. It never loops, never replays on
   scroll-back, and never runs two surfaces at once (one owner per property per element,
   as ever).
2. **Continuous motion is reserved for objects that encode live meaning.** After the
   overture, the only things allowed to keep moving are the ones whose motion IS
   information: the read-fill creeping along the journey line, its tip's soft glow,
   today's breathing dot, a living cover. Decoration gets one entrance, then stillness.
   Chrome never animates on its own, nothing moves between the reader and a tap, and
   scrolling is always plain scrolling.

Reduced-motion renders every finished frame with no entrance and no pulse. The existing
inventory rules (single motion dependency, once-per-view flags, lazy modules) apply to
every implementation of this language.

### Amendment — work-in-progress motion (creator ruling 2026-08-03)

Rule 2 above bans chrome that animates on its own. One narrow exception is now carved out,
because the ban was written for a site of *finished* guides and the pipeline gave us a
surface about a guide that does not exist yet: **while a guide is actively being built,
the surfaces reporting that build may animate continuously.** Specifically the `/progress/`
page's flight (the plane's position IS the cleared-stage count; its drift says the run is
alive) and the hub's build strip (its pulse says work is running right now).

The exception is bounded by the thing that justifies it, and does not widen rule 2:

- **It is licensed by live work, not by the surface.** The motion exists only while a build
  is in flight. It STOPS when the build stops — a stalled run holds its frame rather than
  animating reassuringly, because a pulse over a dead run is the page lying.
- **It ends when the build does.** Graduated, finished, and checked into → the strip is
  gone entirely, not idling. Nothing keeps moving after there is nothing to report.
- **It never spreads to guide chrome.** Every other surface still gets one entrance and
  then stillness. This is not a licence for ambient decoration anywhere else.
- **Reduced-motion still gets the finished frame** — no flight, no drift, no pulse; the
  plane is placed at its true stage and stays there.

Two implementation facts worth keeping, both found by forcing the failure path rather than
by reading the code (Boundary Check #2):

1. `offset-distance` animates via **neither** CSS transitions **nor** the Web Animations
   API in every engine — a `transitionstart` never fires and a WAAPI animation reports
   `running` forever without moving. Motion along an `offset-path` must be driven frame by
   frame, or the plane silently never flies.
2. rAF and ResizeObserver are both paused while a tab is hidden — correct behaviour, but
   `/progress/` is a page people deliberately leave and come back to. So every state change
   also writes its exact frame synchronously, a hidden update snaps instead of queueing a
   flight that cannot run, and the layout is re-measured on `visibilitychange` (a phone
   rotated in the background never delivered its resize).

## Living covers — the R4 rules (shipped 2026-07-28)

The cover stack, from birth upward (`docs/reference/visual-redesign.md` Move A½;
creator-delegated №7):

1. **The Painted Atlas is the universal default.** Every guide — current, scaffold, future —
   is born with a living cover: ridgelines seeded from its own slug (`src/lib/terrain.ts`,
   pure + tested), painted in its own accent, under a sky keyed to the destination's local
   clock (night 21–05 · dawn 05–08 · day 08–17 · dusk 17–21, destination time — a painter's
   sky, not astronomy). Its slow drift (26–46 s cycles) is licensed by rule 2 above: the
   scene shows the destination's sky *right now*, the same live fact as the local-time pill.
   It also backs every photo hero — a failed Commons image now reveals the painted scene
   instead of a dead grey field.
2. **A still photo is the identity layer.** Commons `file` (license machine-verifiable) or —
   new in R4 — a direct royalty-free CDN `src` (Pexels/Unsplash/Pixabay-class; `{w}` width
   token for srcset), where zod REQUIRES `credit` + `license` because the licensing isn't
   machine-checkable. The pathos register is liberal in sourcing, never in honesty.
   **`sights[].img` takes the same two sources on the same terms** (creator-widened
   2026-08-03) — the identity layer is the guide's whole photography, not just its cover, and
   a sight photo already feeds the masthead, hub card and chapter fans by fallback. Sourcing
   law for both slots: the guide-author skill's `references/image-sourcing.md`.
3. **Footage is the curated upgrade, never a requirement.** `cover.video` hot-links a
   library CDN (~4 MB ceiling by curation; nothing heavy enters the repo). Delivery is
   poster-first: no `src` attaches until `living-cover.js` clears every gate —
   reduced-motion, Save-Data, in-view, tab-visible — and autoplay refusal or a dead stream
   leaves the still standing as a COMPLETE cover, not a degraded one. A visible pause chip
   appears only once footage actually plays; while it plays, the credit chip swaps to the
   footage's credit (one surface, always crediting what's on screen). Footage must show the
   actual place — a near-miss stand-in (a Grand Canyon loop on a Sedona guide) is declined
   as quietly lying, per the plan's "no invented geography".

Sourcing note (creator-widened 2026-07-28): beyond Commons, royalty-free libraries are in
bounds for cover art. Practical findings — Mixkit serves stable, hot-linkable per-clip asset
URLs (the Korea palace cover is `assets.mixkit.co/videos/20095/…`, Mixkit Stock Video Free
License, credited anyway); Pexels/Pixabay require their API for reliable URLs (keyless
scraping is blocked); Coverr's grid exposes only ephemeral `coverr-temp-…` URLs — do not
hot-link those.

## Section anchors — the R5 rules (shipped 2026-07-28)

Every anchor figure is DERIVED from the guide's own researched data (`src/lib/anchors.ts`,
pure + tested) — never drawn or worded by hand, and a section whose data can't support a
figure honestly gets none (the pin-less fallback is a blank, not a guess):

- **Days timeline** — one station per day entry; dates from the entries, the two above-line
  words from the first/last days' own titles, today ringed client-side by the same date
  match the journey bar's Today uses.
- **Transit journey-line** — one station per route step, labelled by the step's own bold
  lead (the lead-first content standard doing double duty as structure).
- **Booking rings** — checklists ≥4 items open with a progress ring: total counted at
  build, fill counted live from the reader's own saved checkbox state (live meaning, so
  its fill transition is allowed motion).
- **Route-leg day headers** — "first stop → last stop · ≈N km"; km is summed ONLY when
  every consecutive waypoint pair carries verified coordinates — a partial sum would
  understate the day while reading as a fact, so any gap drops the number, never fudges it.

Motion: one draw-in per figure on first view (~600 ms), then stillness — implemented with
reveal.js's safety rail (markup renders COMPLETE; JS adds the pending state only when
motion is welcome, and a timeout finishes every frame if the observer never delivers).
Reduced-motion never sees an entrance. Descriptors ship alongside — creator-signed
content, schema-guarded so a group rename errors instead of silently orphaning its line.
(Voice standard revised 2026-07-28: rare + informational-only, block-types.md — the
original "warmth in the descriptors" framing is superseded.)

## Mobile navigation — the gestures (shipped 2026-07-30, `docs/archive/INDEX.md → PLAN_MOBILE_NAV`)

Below 900px the top chip strip is hidden, so the bottom bar IS the guide's navigation.
Everything here is gesture motion, which follows a different rule from the entrance motion
above: an entrance plays once and is decoration, while a gesture is a *conversation* — it
has to answer continuously, be interruptible, and be reversible. Hence "tracks the finger"
appears four times below and "animates" appears none.

- **Swipe between groups** (`features/mobile-nav/ui/swipe-tabs.js`) — content translates
  under the thumb at ~0.9:1, damped to a 56px rubber-band at the first/last group; the
  bar's indicator drifts off its slot and fades, because the destination usually is not
  one of the two promoted slots and sliding it *toward* one would point at the wrong
  group. Release commits past 30% of the width or a 0.5px/ms flick, else springs back.
  Axis-locked at |dx| > |dy| && 24px, and a touch that commits to vertical is dropped for
  the rest of that gesture rather than re-armed mid-fling. Reduced motion: commits
  instantly, tracks nothing.
- **Yielding chrome** (`ui/yield-chrome.js`) — reading down slides the bar away and
  squeezes the topbar to a strip carrying the current group + destination local time; the
  buttons never leave. Thresholds live in `model/yield.ts` because the naive version was
  wrong: page jitter (scroll anchoring rebounds ~2px after every settled scroll) reset the
  accumulator, so intent has to clear a threshold in both directions.
- **Day scrubber** (`ui/day-scrub.js`) — the existing `#dayScrub` rail compacts to fit
  (4–12 days) and takes a drag along its own axis, the date riding a bubble under the
  thumb. Deliberately NOT the vertical edge rail the plan drew: the phone itinerary is a
  horizontal deck, and a vertical rail would ask for a downward drag to move right.
- **Sheet physics** (`src/scripts/sheet-drag.js`) — the groups and SOS sheets follow the
  thumb down and dismiss past 25% of their own height or a 0.6px/ms flick. A drag starting
  inside a scrolled list belongs to that list.
- **Resume chip** (`ui/resume.js`) — on a fresh arrival only, an offer (not a redirect)
  back to where the reader stopped. Nothing remembered, nothing rendered.

Haptics ride the one existing `tapHaptic()` util (`src/scripts/util.js`) — swipe commit,
bar tap, scrub step, sheet dismiss, checklist tick. Android vibrates ~9ms; iOS Safari has
no Vibration API and silently no-ops. One grep to remove.
