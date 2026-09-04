# D7 grand redesign — Phase 0 audit and deletion map

Status: execution record for `docs/work-orders/waypoint-grand-redesign.md` Phase 0.
Authority: `docs/reference/design-system.md` (2026-09-04 constitution). This file decides nothing.
Base: the `main` that carries PR #191 (the September checkpoint). Inventory taken 2026-09-04.

Legend — **keep** (already conforms), **migrate** (same owner, new law), **merge** (fold into one
owner), **delete** (retire; consumer named).

## 1. Navigation systems

| System | Owner | Consumers | Verdict |
| --- | --- | --- | --- |
| Guide shell: desktop destination cluster + utility row (`.destnav`, `.topbar`) | `AppChrome.astro`, `chrome.css`, router `guide-ui.js` | every guide page | **migrate** → adaptive floating rail (§6): Atlas · Trip · Itinerary · Map · Guide; Search/Create/SOS as global actions; compact by default, yields on deep work. No permanent flat sidebar. |
| Guide shell: five-slot bottom bar (`.botbar/.botslot`) | same | phones | **migrate** → Atlas · Trip · Itinerary · Map · Guide. Split leaves the bar (§6 "contextual"). |
| Split as a primary destination (`dest-split` region, `data-dest="split"`) | `SplitDestination.astro`, router | guide pages | **migrate** → contextual utility reached from Trip, expense actions, Search and the expanded rail (§27); the region stays, the slot goes. |
| Utility strip (`.ubar`) | `UtilityBar.astro`, `utility-bar.css` | intake, progress, triage, change, about, health, 404 | **merge** → the same floating rail language at reduced size (one rail owner for the whole product). |
| Atlas header (`.atlas-header`, `.atlas-toggle`) | `pages/index.astro`, `atlas-cover.css`, `atlas-world.css` | Atlas | **migrate** → rail + quiet orientation; World/Table toggle becomes a contextual control. |
| Yielding phone chrome | `features/mobile-nav` (`yield-chrome.js`) | guide phones | **keep** (§6 "may yield visually"; §33 retires only swipe/story variants, which are already gone). |
| Day rail / day nav | `ItineraryDestination.astro`, `itinerary.css` | Itinerary | **keep**, restyle in Phase 5 as day scrubber. |

## 2. Cards, panels, primitives

| Primitive | Owner | Verdict |
| --- | --- | --- |
| `Panel.astro` + `features/panel` (chapter panels, grid) | components/features | **migrate** → Editorial/Operational card roles (§8) on the radius family. |
| Trip atoms (`.tn-atom`), stop rows (`.stop`), map rows (`.mapdest-row`), split cards (`.split-card`), gd cards (`.gd-card`), hub `.card`, `.pg-card`, `.cp-card`, `.itk-sec`, `.ab-card` | per surface | **merge** → four card roles (Operational / Editorial / Compact tile / Feature object) expressed as shared classes on one geometry family; surfaces keep their own content, not their own geometry. |
| Zero-radius law (114 `border-radius:0` sites) | `check-design-drift.mjs` rule 1 | **delete** → replaced by the radius family tokens (§31) and a drift rule that accepts only those tokens. |
| No-elevation law (26 `box-shadow` sites, most exempt) | drift rule 6 | **migrate** → `--shadow-*` roles: hairline structure by default, one low broad shadow for actual depth/focus (§31). |
| `Fold.astro`, `Hint.astro`, `GapBlock.astro` | components | **keep** (progressive disclosure, §19). |
| `ReminderRow`, `TransitLinks`, `JetLag` | components | **keep**, restyle with tokens only. |

## 3. Sheets, overlays, modals

| System | Owner | Verdict |
| --- | --- | --- |
| Shared drag helper | `scripts/sheet-drag.js` | **keep** — the one sheet physics owner. |
| Map inspector sheet (`.mapdest-sheet`) | `map.css`, `map-dest.js` | **migrate** → the unified place/detail pane (Phase 10): mobile sheet → full detail; desktop shared-object pane. |
| Atlas ping sheet / menu sheet | `atlas-mobile.css`, `world-view.js` | **merge** → same detail pane language; menu sheet folds into the rail's expanded state. |
| SOS sheet | `sos.js`, `field-tools.css` | **migrate** → three layers (§28): category → details/location → connect/confirm; numbers offline. |
| Provenance popover / phone bottom sheet | `provenance-dot.js/.css` | **keep** (§32 on-demand detail), radius family only. |
| Share panel, currency popover, lightbox, toasts, offline pill | `features/share`, `field-tools.js`, `lightbox.js`, `offline-pill.js` | **keep**, radius/shadow tokens. |
| Search overlay | `features/search` | **migrate** → §21 category drawers + desktop result/detail workspace (Phase 7). |

## 4. Search

Current: global overlay, `⌘K` / `/` invocation, results grouped by object type with the current
trip first. Verdict: **migrate**. Keep the ranking model and index; replace the overlay with
category drawers (Places · Itinerary · Guide · Notes · Transit · Food), a desktop result + detail
workspace, and a mobile sheet with clear escape. The keyboard shortcuts stay as affordances, never
as the mental model (§21).

## 5. Maps

| Path | Owner | Verdict |
| --- | --- | --- |
| Google Maps Platform tier (lazy, key-gated, replaces the embed after first `idle`) | `features/maps/ui/gmaps-render.js` | **keep and promote** → the live map (§15). Advanced Markers, day/route state, destination-aware cloud styling, camera choreography (Phase 5). |
| OpenStreetMap embed (`.osmmap`, `fullscreen.js`, `workbench.js` bbox URL) | `map.css`, `features/itinerary/ui/workbench.js` | **compatibility shim**: it is what renders when `PUBLIC_GMAPS_KEY` is absent at build. Survives only with a named deletion task: *retire the OSM embed once the Pages secret is confirmed live*. Not the "live" map by definition. |
| Verified-stops fallback list (`.itin-map-fallback`) | `ItineraryDestination.astro` | **keep** — the honest offline/degraded state (§15, §29). |
| Globe | `features/atlas/ui/atlas-map.js` | **keep** for Atlas/arrival only; never the city map (§26). |

## 6. Colour, radius, type

| Item | Verdict |
| --- | --- |
| Palette tokens (`--bg` cream #e3e7dc … `--accent` rust #9c4421, warm charcoal dark) | **keep** — already cream/sage/rust/charcoal; add semantic roles (§3) as aliases, no new hues. |
| Purple-era literals | none found in `src/styles` or features (drift gate already forbids). **verified absent**. |
| `APPROVED_HEX` in the vendored drift checker | **migrate** → derive from base.css instead of a frozen list. |
| Radius: `--r-*` ladder deleted in 2026-08 | **reinstate** as the §31 family: `--r-inset` 12px, `--r-compact` 16px, `--r-card` 20px, `--r-pane` 28px, `--r-pill` 999px. |
| Type: Literata + Atkinson, scale tokens | **keep**; add `font-variant-numeric: tabular-nums` role for operational numerals (§2). |
| Third family in the drift TYPE rule ("Source Sans 3") | **delete** the stale allowance (the system has never shipped it). |

## 7. Motion

| Owner | Verdict |
| --- | --- |
| Tokens `--dur-tap/ui/reveal/hero`, `--ease-out-expo`, `--ease-spring` | **migrate** → motion.md timing roles: `--dur-immediate` 110ms, `--dur-routine` 190ms, `--dur-object` 320ms, `--dur-scene` 640ms, `--dur-arrival` 1100ms; easing quick-acquire/soft-decelerate; spring reserved for direct manipulation. |
| 20 `@keyframes` | audit each: `paDrift`, `paMist` (Painted Atlas idle drift) → **static by default, arrival-only** (§12, motion §10); `pg-breathe`, `pg-march`, `pg-ping`, `liveDot`, `nowPulse`, `tnPulse` → **keep** (live state); `sightShimmer` → **delete** if decorative; entry keyframes (`dayInL/R`, `sectionIn`, `abRise`, `su-rise`, `tgRise`, `kitPop`, `cpTriIn`, `cpDrift`, `cpPing`, `atlas-chip-pulse`) → **merge** onto the routine/object roles. |
| GSAP consumers: `gsap-hero.js`, `learnings/ui/survey.js`, `firebase/client.js`, `GuideLayout.astro` | **keep** only where orchestration is material (arrival choreography); routine transitions move to CSS. |
| `hero-parallax.js`, `scroll-motion.css`, `reveal.js` | **audit** against motion §6: no scroll traps; keep scroll-linked reveal only where the next composition logically follows. |
| View transitions on destination switch (router) | **keep**, timed to the routine role. |

## 8. Responsive branches

`src/lib/breakpoints.ts` (MOBILE_MAX 899, TABLET_MIN 720, DESKTOP_MIN 1180) with `bp:` markers pinned by `breakpoints.test.ts` — **keep**. Intermediate widths are first-class (§5); every migrated component recomposes container-first between 720 and 1180.

## 9. Painted Atlas / living covers

`PaintedAtlas.astro` + `painted-atlas.css` (+ `living-cover.js` video) — **migrate**: identity moment on arrival and as the static ground behind covers; idle drift off by default and under reduced motion; performance bounded (offscreen → stopped).

## 10. Gallery and baselines

`gallery.astro` + `gallery-baselines.spec.ts` — **keep** as the regression lock; regenerate once at Phase 15 after the new system lands, never mid-migration.

## Deletion tasks named

1. OSM embed retirement once `PUBLIC_GMAPS_KEY` is confirmed in Pages (owner: maps).
2. Split bottom-bar slot and desktop cluster entry (owner: shell) — done in Phase 2.
3. Zero-radius and no-elevation drift rules (owner: gates) — done in Phase 1.
4. Painted Atlas idle drift keyframes (owner: PaintedAtlas) — Phase 3/13.
5. Stale "Source Sans 3" allowance in the drift TYPE rule (owner: gates) — Phase 1.
6. Per-surface card geometry classes once the four card roles exist (owner: each surface) — Phases 4–10.
