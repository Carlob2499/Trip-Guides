# Motion Doctrine — one signature, governed motion

Motion on Waypoint is a governed system, the way the tab budget governs tabs — not an accretion
of effects. This doc is the standard every motion change is judged against. Companion to
`docs/VISUAL_COVERS.md` (what shipped and why); this is the *rulebook*.

## The signature: the trip unfolds, day by day

The ONE device this site is remembered by: **a segmented rail whose segments are the trip's
days**. It appears exactly three ways, and they are the same object:

1. **First-open story intro** — the rail ticks through the days over the cover, once per guide
   (`story-open.js` + `story.css`).
2. **Story-mode itinerary** — the rail becomes navigation in the full-screen one-day-per-view
   deck (`story-mode.js` + `story-mode.css`).
3. **The card→hero morph** — the guide "opens" from its hub card via cross-document View
   Transitions (`transitions.css`).

Anything new that wants to be flashy must strengthen this signature, not compete with it.
(Design rule: spend the boldness in one place.)

## The motion inventory (everything that moves, and who owns it)

| Motion | Mechanism | Owner |
|---|---|---|
| Card → masthead morph | cross-doc View Transitions, `cover-<slug>` names | `transitions.css` |
| First-open day-story | CSS keyframes under `body.story-playing` | `story.css` + `story-open.js` |
| Masthead arrival (repeat visits) | GSAP timeline (lazy import) | `gsap-hero.js` |
| Hero parallax + Ken Burns | rAF transform (JS owns the transform) | `hero-parallax.js` |
| Scroll reveals (cards/days/sights) | **native** `animation-timeline: view()`; IO fallback | `scroll-motion.css` / `reveal.js` |
| Story-mode day slide/bounce | CSS keyframes toggled by class | `story-mode.css` |
| Section flight, micro-interactions | existing modules | `section-flight.js`, `micro.js` |
| Reading progress | scroll listener → `#readProg` | `guide-ui.js` |
| *Overture contour parallax* (pending — V2, `docs/PLAN_VISUAL_OVERHAUL.md`) | `animation-timeline: scroll()`, transform-only | `hub-motion.css` tokens ready; component pending |
| *Overture route-line draw* (pending — V2) | `stroke-dashoffset` on scroll timeline | pending |
| *Atlas card reveal + hover glow* (pending — V3) | `view()` reveal + palette-accent glow | `--accent2`/`--accent-raw` tokens ready (V1); component pending |

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
