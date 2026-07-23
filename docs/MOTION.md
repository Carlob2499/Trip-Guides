# Motion Doctrine — one signature, governed motion

Motion on Waypoint is a governed system, the way the tab budget governs tabs — not an accretion
of effects. This doc is the *rulebook* every motion change is judged against, plus the shipped
record (it absorbed `VISUAL_COVERS.md`).

## The signature: the trip unfolds, day by day

The ONE device this site is remembered by: **a segmented rail whose segments are the trip's
days**. It appears exactly three ways, and they are the same object:

1. **First-open story intro** — the rail ticks through the days over the cover, once per guide
   (`story-open.js` + `story.css`).
2. **Story-mode itinerary** — the rail becomes navigation in the full-screen one-day-per-view
   deck (`story-mode.js` + `story-mode.css`).
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
| First-open day-story | CSS keyframes under `body.story-playing`; segment fill is the guide's own `--accent` (V5 — echoes the hub Overture route line's colour, since the route itself has scrolled off-screen by tap time and can't be a literal shared element) | `story.css` + `story-open.js` |
| Masthead arrival (repeat visits) | GSAP timeline (lazy import) | `gsap-hero.js` |
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
   e.g. `story-open` sets `window.__storyIntro` and `gsap-hero` stands down; `reveal.js` bails
   when `animation-timeline` is supported. Preserve this handshake pattern when adding motion.
5. **Timing vocabulary.** Micro-interactions ~150ms; content transitions 300–450ms
   (`cubic-bezier(.2,.7,.2,1)` — the house ease); orchestrated arrivals ≤ ~1s; the first-open
   story ~2.4s total (clamped per-day 170–430ms). Nothing loops forever.
6. **Motion encodes structure.** Animate to say something true about the content (days advance,
   a card becomes its guide, content enters as you reach it) — never decoration for its own sake.
   The generic-AI test applies to motion too.
7. **Perf budget holds.** No new motion dependencies without a doctrine change (GSAP is the one
   JS-motion dep, lazy-loaded). Prefer `transform`/`opacity`; never animate layout properties on
   scroll.

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
`docs/PLAN_VISUAL_OVERHAUL.md`.

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
| Masthead `[data-mast-contour="0"]` | `rgba(255,255,255,.11)` | `rgba(255,255,255,.15)` |
| Masthead `[data-mast-contour="1"]` | `rgba(255,255,255,.07)` | `rgba(255,255,255,.10)` |

**Settled (2026-07-23):** real Playwright screenshots were taken of the Korea guide masthead
(desktop + mobile, light + dark, over its real loaded cover photo, plus over the dark
no-photo fallback) and of the hub's pre-auto-glide contour layer, and reviewed by the creator.
**Kept as-is — no step-back.** The strokes render clearly and legibly in all four masthead
states without competing with title legibility; the U9 values hold. This closes the last open
item in `docs/PLAN_FIELD_REPORT_FIXES.md` (E8 item 5).

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
  Lighthouse afterward.
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

This closes `docs/PLAN_VISUAL_OVERHAUL.md`. The doctrine above (signature, inventory, rules,
identity engine) reflects what's actually shipped as of this pass.
