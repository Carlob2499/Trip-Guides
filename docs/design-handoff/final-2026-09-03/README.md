# WayPoint — D6 Frozen Design → Claude Fable 5 Implementation Handoff

Status: **FROZEN FOR IMPLEMENTATION — 2026-09-03**
Target: complete engineering by **2026-09-30**.
Source branch: `design/d6-product-reconciliation-20260902`.

This package exists to let Claude Fable 5 implement the approved WayPoint redesign without reopening product decisions or inheriting drift from generated mockups.

## Authority order — mandatory

Read and obey in this exact order:

1. `PRODUCT.md` — product purpose, field-use priorities, factual/capability truth.
2. `docs/reference/design-system.md` — binding visual, responsive, interaction, and D6 decision authority.
3. `docs/reference/motion.md` — binding subordinate motion doctrine.
4. `docs/reference/component-registry.json` — current shipped component/feature inventory; it is not a promise that obsolete R4/R5 compositions survive.
5. `src/styles/base.css`, `src/lib/breakpoints.ts`, tests/gates — executable token, breakpoint, accessibility, and resilience truth.
6. `docs/reference/search-ui-final.md` and `docs/reference/sos-ui-final.md` — final reviewed clarifications for those global utilities.
7. This handoff package — implementation sequencing, drift controls, acceptance matrix.
8. `visual-references/` — **reference only**, interpreted strictly through `MOCKUP_MANIFEST.json`.

Historical redesign files, old handoffs, archived prototypes, generated boards, and screenshots not listed in `MOCKUP_MANIFEST.json` are **not implementation authority**.

## Core implementation instruction

Implement the approved product. Do not redesign it.

Claude may independently choose:
- internal component decomposition;
- CSS/JS/TS organization;
- migration sequence;
- exact responsive mechanics that satisfy the locked behavior;
- test structure;
- accessibility implementation details;
- safe performance optimizations;
- bug fixes exposed during implementation.

Claude may **not** independently:
- add traveler-facing features because a mockup happened to draw them;
- change the five-destination model `Trip · Itinerary · Map · Guide · Split`;
- turn Atlas, Search, SOS, Learnings, or Story into additional primary tabs;
- rebrand the palette or typography;
- invent travel content, people, dates, prices, statuses, ratings, reviews, live ETAs, or integrations;
- weaken provenance, offline behavior, accessibility, reduced motion, or field-use priorities;
- resurrect retired Story Mode, voting, Trip Kit, shared readiness, or generic Tools/More concepts.

## Visual intent

WayPoint is a **modern boutique travel app with airline-grade operational precision and field-journal warmth**.

Use the shipped token system as the implementation truth:
- light ground `#e3e7dc`
- sunken ground `#ced5c4`
- card `#fbfcf6`
- ink `#0f141a`
- oxide accent `#9c4421`
- dark mode remains warm charcoal/chart-room, not generic navy/space/cyberpunk
- Literata Variable + Atkinson Hyperlegible Next only

Desktop may use destination imagery or cartographic atmosphere as an immersive outer layer, but navigable/operational content floats on distinct readable surfaces. Immersion belongs most strongly to Atlas and Guide; Map gets immersion from the map itself; Split/Search/SOS stay direct.

## Mockup rule

Mockups are **visual evidence, never feature truth**.

For every included image:
- copy only the qualities explicitly listed under `allowed_signals`;
- ignore everything listed under `forbidden_signals`;
- if an image conflicts with `PRODUCT.md`, `design-system.md`, executable tokens, or actual repository capability, the image loses;
- do not “complete” a mockup by implementing decorative controls or invented data.

See `MOCKUP_MANIFEST.json` and `DRIFT_GUARD.md`.

## Completion definition

The implementation is done only when:
- the surface acceptance criteria in `ACCEPTANCE_MATRIX.md` pass;
- Korea works with real repository content;
- Denmark still supports flexible times, branched days, and accessibility caveats;
- light/dark, phone/intermediate/desktop, touch/mouse/keyboard, text enlargement, reduced motion, offline/degraded, and missing-data paths are verified;
- no obsolete design lineage competes with the frozen system;
- the existing research/content truth is preserved.
