# Grand Plan — Visual Overhaul: "The Overture & the Atlas"

Consecutive sessions an executing agent (Opus by default — creator's call) can run autonomously.
Companion to `docs/MOTION.md` (the rulebook — **binding**; nothing below overrides it) and
`docs/VISUAL_COVERS.md`. Design-research grounding: the two native 2026 wins (CSS scroll-driven
animations + View Transitions — compositor-run, zero JS) are already this repo's foundation;
award-level travel sites win on **scroll storytelling** (the Spotify-Wrapped pattern: each scroll
reveals the next beat), purposeful parallax depth, and oversized kinetic typography. Waypoint's
guide interiors already carry the motion signature; **the hub is the plainest surface on the site
— that is where the boldness gets spent** (doctrine: one place).

## The concept

**The Overture:** a full-viewport cinematic intro on the hub, *before* the guide menu — the
creator's explicit ask. Layered topographic contour lines (generated SVG, brand-colored — maps
without stock photos) drift in parallax at three depths. An oversized Bricolage headline arrives
kinetically (≤1s, once). A **route line** — the day-rail signature generalized to site level —
draws itself downward as you scroll, its waypoint marker riding it, leading the eye through a
real-numbers stats beat ("3 guides · N verified facts · N primary sources," computed at build,
never invented) and into the guide grid. The hero recedes (scroll-driven scale + fade) as the
Atlas rises. **Scroll-through, never time-gated** — the traveler is always one flick from the
guides; content is never hidden waiting on JS (doctrine #3).

**The Atlas:** the guide grid rebuilt as the payoff — each card tinted by its guide's own
extracted palette (`src/data/palettes/` already exists), staggered `view()` reveals, hover
lift with palette glow, the featured guide staying in the list marked "Featured above" (dedup
never lies — CLAUDE.md). The existing card→masthead View-Transition morph becomes the Overture's
final beat: tap a card and the route continues into the guide.

**Doctrine compliance, stated once:** native scroll-driven first with IO fallback; every motion
has a reduced-motion off-path (static composition, fully usable); one owner per property
(the Overture registers like `story-open` does and stands down for anything else); house ease +
timing vocabulary; no new motion dependencies; perf budget holds; the generic-AI test applies —
every move here encodes something true (the route leads to the guides; the stats are real).

## The session ritual (binding, same as PLAN_TRAVELER_FEATURES.md)

Read `docs/HANDOFF.md` → read the session block → **AskUserQuestion** the session's clarifiers
(plus any warranted) → explicit go → build → ship loop (`build` → `test` → preview :4322 at
375px + desktop + dark + **reduced-motion** → grep `dist/` → commit → push `main`) → **rewrite
HANDOFF** naming the next session → commit. Visual sessions additionally run
`npm run test:visual` and refresh Playwright snapshots deliberately (a visual overhaul EXPECTS
diffs — review each, never blind-update).

---

## Session V1 — Foundation (no visible change yet)

**Goal:** the plumbing every later session stands on.
**Clarifiers:** (a) confirm the Overture concept + headline copy direction (see V2 options);
(b) full Overture every visit, or full on first visit / compact on return (recommended: full
every visit but short — it's scroll-through, not a gate; revisit after feel-testing).
**Do:** contour-SVG generator (build-time script → inline SVG, seeded per site palette, tested);
build-time stats collector (guides count, verified-fact count, distinct primary sources — grep
of content collections, tested — **real numbers only**); hub motion tokens + `hub-motion.css`
scaffold with reduced-motion gates; expose per-guide palette tokens on hub card markup (data
attrs); Overture ownership handshake (`window.__overture` flag, mirroring `__storyIntro`).
**Exit:** ship loop green, zero visual diff (foundation only), MOTION.md inventory table gains
the planned rows marked "pending." HANDOFF.

## Session V2 — The Overture hero

**Goal:** the creator's headline ask — the large intro before the guide menu.
**Clarifiers:** (a) headline voice — pick or redirect: "Guides built from the ground truth." /
"Every fact checked. Every trip yours." / "The atlas of trips that actually happened."; (b) may
the wizard (New-guide form) move below the grid, or must it stay above the fold?
**Do:** full-viewport hero section on `src/pages/index.astro`: three contour layers on
`animation-timeline: scroll()` parallax (transform-only); kinetic headline (chars/words rise
once on load, ≤1s, `story-open`-style class gate — base state visible); route-line SVG
(stroke-dashoffset on scroll timeline) from hero through the stats beat into the grid; waypoint
marker riding the line as scroll cue; stats beat counts up on `view()` entry (real V1 numbers).
Hero recedes via scroll-driven scale/fade. **Guards:** h1 is the LCP (text, not image); zero
CLS (all layers absolutely positioned, dimensions reserved); skip-to-guides link for keyboard;
`prefers-reduced-motion` renders the full composition static; page fully usable with JS off.
**Exit:** ship loop + visual snapshots reviewed; Lighthouse LCP/CLS on preview no worse than
main; HANDOFF.

## Session V3 — The Atlas grid

**Goal:** make arriving at the guides feel like the payoff, not the leftovers.
**Clarifiers:** (a) how bold may the palette tinting go — border+glow accents (recommended) or
full card-ground tints; (b) keep current card information density or trim.
**Do:** per-guide palette accents (V1 data attrs → border/eyebrow/glow); staggered `view()`
reveals (reveal.js fallback per doctrine); hover: lift + palette glow + cover Ken-Burns nudge
(~150ms micro vocabulary); featured/hero card stays in grid marked ("Featured above"); grid
enters as the Overture's route line terminates at it (the handoff moment).
**Exit:** ship loop; every guide's card carries its own identity; dedup rule intact; HANDOFF.

## Session V4 — Guide interior depth pass

**Goal:** carry the new depth language inside without touching the signature's ownership.
**Clarifiers:** (a) any guide sections the creator wants left visually untouched?
**Do:** masthead gains one contour parallax layer behind the existing cover treatment
(hero-parallax.js owns the transform — extend it, don't add a second owner); section-entry
choreography unified on the house ease; day-tab switch polish (existing owners only);
per-section verified-stamp chips get a settle micro-interaction. No new owners, no new deps.
**Exit:** ship loop on ALL THREE guides at both breakpoints; MOTION.md inventory updated;
HANDOFF.

## Session V5 — Morph continuity (the route continues)

**Goal:** hub→guide navigation reads as one continuous journey.
**Do:** extend the existing cross-document View-Transition morph: the tapped card's palette
accent carries into the guide masthead arrival; the Overture route line's exit state matches the
guide's story-intro rail entry (the signature literally continues). Verify OG images, print
styles, and `/progress/`+`/health/` pages are untouched. Fallback (no VT support) stays clean.
**Exit:** ship loop; morph verified on all three guides; HANDOFF.

## Session V6 — QA, performance, and the honest pass

**Goal:** prove the overhaul cost nothing it shouldn't.
**Do:** perf budget + Lighthouse against main baseline (document numbers in the session
commit); full matrix — 375px/desktop × dark/light × reduced-motion × JS-off; offline PWA still
green; Playwright visual snapshot suite refreshed deliberately; axe/a11y pass on the hub;
MOTION.md rewritten so the doctrine describes what NOW exists (the doc is the rulebook — it must
not drift). File follow-up issues for anything consciously deferred.
**Exit:** ship loop; MOTION.md current; HANDOFF closes the plan with an honest "what changed /
what it cost / what was deferred" summary.

---
*Sequencing logic: V1 makes everything else cheap and safe. V2 is the ask — the boldness, spent
in its one place. V3 is V2's payoff. V4–V5 spread the language without new owners. V6 is the
audit habit applied to ourselves. Each session is independently shippable; stopping after any
session leaves the site coherent.*
