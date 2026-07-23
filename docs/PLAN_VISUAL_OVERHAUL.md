# Grand Plan — Visual Overhaul: "The Overture & the Atlas"

Consecutive sessions an executing agent (Opus by default — creator's call) can run autonomously.
Companion to `docs/MOTION.md` (the rulebook — **binding**; nothing below overrides it, and it
now also carries the shipped motion record). The concept: **the Overture**, a full-viewport
cinematic hub intro (generated topographic contours, kinetic Bricolage headline, a route line
drawing down through a real-numbers stats beat into the grid — scroll-through, never
time-gated), and **the Atlas**, the guide grid as the payoff (each card tinted by its guide's
own extracted palette). Doctrine compliance stated once: native scroll-driven first, reduced-
motion off-paths, one owner per property, house ease, no new motion deps, real numbers only.

## The session ritual (binding, same as PLAN_TRAVELER_FEATURES.md)

Read `docs/HANDOFF.md` → read the session block → **AskUserQuestion** the session's clarifiers
→ explicit go → build → ship loop → **rewrite HANDOFF** naming the next session → commit.
Visual sessions additionally run `npm run test:visual` and refresh Playwright snapshots
deliberately (an overhaul EXPECTS diffs — review each, never blind-update).

## Sessions V1–V4 — ✅ DONE (2026-07-20, all live on `main`)

Full session narratives: this file's git history + HANDOFF snapshots.

- **V1 foundation:** `src/lib/contours.ts` (seeded, deterministic), `src/lib/guide-stats.ts`
  (real counted stats), `paletteAccentsForGuide()`, `hub-motion.css` theme-derived tint tokens.
  Zero visual diff. Decisions logged: headline = **"Every fact checked. Every trip yours."**;
  replay = full Overture first visit, compact hero on return; key = `tg-overture-seen`.
- **V2 the Overture:** full-viewport hub masthead — contour parallax + kinetic headline +
  real stats beat + route line; first visit plays then **auto-glides** onto the hub
  (interruptible, once-per-visit, compact on return, off under reduced-motion). `overture.js`.
- **V3 the Atlas:** per-guide palette on every card — tinted border at rest, hover/focus glow
  in the guide's own hue (Option A, creator-picked). Pure CSS in `hub-motion.css`.
- **V4 interior depth:** faint topographic contour overlay over the guide hero photo
  (`.mast-contours`, strokes `.11`/`.07`, static by design, photo-guides only). Dropped
  honestly: hero parallax layer, verified-stamp settle (no target exists). Open item: eyeball
  strokes over REAL cover photos post-deploy; bump `.11` if faint.

## Session V5 — Morph continuity (the route continues) — ✅ DONE (2026-07-23)

**Goal:** hub→guide navigation reads as one continuous journey.
**Do:** extend the existing cross-document View-Transition morph: the tapped card's palette
accent carries into the guide masthead arrival; the Overture route line's exit state matches the
guide's story-intro rail entry (the signature literally continues). Verify OG images, print
styles, and `/progress/`+`/health/` pages are untouched. Fallback (no VT support) stays clean.
**Exit:** ship loop; morph verified on all three guides; HANDOFF.

**Shipped:** the accent carry is a real shared-element morph — `.hubcard-bar` (hub card) and
`.masthead-rule` (guide masthead) now share `view-transition-name:accent-<slug>`, so the trip's
colour visibly travels across the navigation (confirmed live via Playwright: mid-transition
screenshot shows the accent bar positioned exactly at its morph target, and the settled masthead
computed a real per-guide accent, not a default). **Deviated honestly on the route-line half:**
a literal shared element for "the route line's exit state" isn't feasible — `.ov-route-path` has
no tap-time hook and is normally scrolled off-screen by the time a card is tapped (confirmed via
research agent). Shipped the honest equivalent instead: `.mast-story-seg::after` (the story-rail
fill) now uses the guide's own `var(--accent)` instead of a fixed white, so the same colour that
drew the route down the hub arrives again as the trip's days draw in on the guide side — same
hue, not the same DOM node. OG images, print styles, `/progress/`, `/health/` all confirmed
untouched (no shared CSS beyond base.css's unrelated root-crossfade). Reduced-motion fallback
verified clean (zero `pageerror`s, no VT animation).

## Session V6 — QA, performance, and the honest pass

**Goal:** prove the overhaul cost nothing it shouldn't.
**Do:** perf budget + Lighthouse against main baseline (document numbers in the session
commit); full matrix — 375px/desktop × dark/light × reduced-motion × JS-off; offline PWA still
green; Playwright visual snapshot suite refreshed deliberately; axe/a11y pass on the hub;
MOTION.md rewritten so the doctrine describes what NOW exists (the doc is the rulebook — it
must not drift). File follow-up issues for anything consciously deferred.
**Exit:** ship loop; MOTION.md current; HANDOFF closes the plan with an honest "what changed /
what it cost / what was deferred" summary.

## Model & time budget (remaining)

| Session | Model | Est. active |
|---|---|---|
| V5 morph continuity | Sonnet (Opus if the morph fights back) | 1–2 h |
| V6 QA + perf | Sonnet | 1.5–2.5 h |

*Each session is independently shippable; stopping after any session leaves the site coherent.*
