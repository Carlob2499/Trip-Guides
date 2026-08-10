# Handoff: WayPoint Mobile — Atlas Home (3b/4a "globe front door")

## Overview
Redesign of the WayPoint (Trip-Guides) Atlas home for mobile. Goal: users reach their guides ("sheets") fast, the space is decluttered, navigation feels natural and uses the whole phone. The chosen direction — option **4a** in `WayPoint Mobile.dc.html` — is a full-bleed interactive globe as the front door, with a vertical guide list as the workhorse below, a floating pill dock in thumb reach, and a wired flow into the Japan guide.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, NOT production code to copy. Recreate them in the target codebase's existing environment (Astro + vanilla JS web components, per the repo below) using its established patterns.

## ⚠ Reconcile with the existing repo first — avoid redundant work
Target repo: **Carlob2499/Trip-Guides** (branch `main`). Much of this design already exists there. Before writing anything, diff the design against these files and EXTEND them, do not rebuild:

| Design element | Already in repo | What's actually new |
|---|---|---|
| Globe rendering (canvas, day/night terminator, dirty-flag RAF loop, pins) | `src/features/atlas/ui/atlas-map.js` + `public/data/countries-110m.json` | Tap-to-pick (inverse orthographic projection → country hit test), `focus` halo ring on selected pin, spin pause-on-select (4s), spin restore |
| Tokens (colors, type) | `src/styles/base.css`, `docs/design-handoff/DESIGN.md` (R4 — the root `DESIGN.md` this bundle was written against was retired 2026-08-10) | Nothing — use repo tokens verbatim |
| Mobile pill dock | `src/features/mobile-nav/ui/botbar.js`, `mobile-nav.css` | Center "coin" slot variant is NOT in the final pick — final dock is 4 items: SHEETS / SEARCH / TOOLS / NEW (＋) |
| Guide page + day scrubber | `src/styles/guide.css`, `masthead.css`, `src/content/guides/japan/_guide.json` | Only the transition from home + back-with-state-intact |
| Atlas home layout | `src/pages/index.astro`, `atlas.css`, `atlas-world.css`, `atlas-mobile.css` | THIS is the main work: replace the mobile home layout with the 3b structure below |

Anything not in the "actually new" column: reuse the repo implementation as-is.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and interactions are final. Recreate pixel-perfectly, but source every token from `base.css` where an equivalent exists (the hex values below were lifted from it).

## Screens / Views

### 1. Atlas home (option 4a — the pick)
Single scrollable page, dark theme shown (light theme uses the repo's light tokens; same structure).

**Top bar** — fixed, z above scroll content. Height 40px, padding 12px 16px 10px. Background `color-mix(in srgb, #0f1317 88%, transparent)` + `backdrop-filter: blur(10px)`, bottom border 1px `#242c34`. Contents (flex, gap 8px): oxide triangle logo (14×12, `#9c4421`), "WAYPOINT" (Source Sans 3, 700, 11px, letter-spacing .24em), right-aligned "THE ATLAS · 4 SHEETS" (640, 9.5px, ls .18em, `#c78f78`).

**Globe hero** — first element in the scroll flow, height 400px, full-bleed, `cursor: crosshair` on desktop. The globe scrolls away freely (no snap, no collapse animation — this replaces earlier sticky-collapse explorations). Under it, caption bottom-left 16px/12px: "Tap a country — oxide means it has a sheet" (Source Sans 3, 11px, `#9aa392`).
- Pins: one per guide country; countries with sheets also get the oxide fill tint (repo's existing "surveyed" treatment).
- Tap a pinned country → halo ring on the pin (2px `#9c4421` light / `#d98a94` dark, r=12 + fainter r=17), spin pauses 4s, list scrolls smoothly to that sheet's row (`scrollTo`, row top − 90px).
- Tap an unpinned country → inline offer card (see below). Tap ocean → dismiss offer.

**Start-a-sheet offer** — appears between globe and list header. Margin 10px 16px 0, padding 11px 13px, bg `#242c34`, border 1px `#9c4421`, radius 10px. Text: "No sheet for **{Country}** yet." (Source Sans 3, 12.5px/1.4). Button "＋ Start one": pill, min-height 38px, padding 0 14px, bg `#e8ece3`, text `#0f1317`, 600 12px.

**List section header** — sticky top:0 within the scroll container. Padding 9px 16px, same blur/bg treatment as top bar. "YOUR SHEETS — UP NEXT FIRST" (Source Sans 3, 640, 10px, ls .2em, `#9aa392`).

**Guide list** — grid, gap 10px, padding 14px 16px 120px (bottom clearance for dock). Mixed density:
- **Up-next card (big)** — first item. Bg `#242c34`, border 1px `#9c4421`, radius 10px. Cover image slot 96px tall (design uses a placeholder hatch — repo should use the guide's cover). Body padding 12px 14px 14px: title (Literata 640 19px) + badge "UP NEXT · SEP 2" (Source Sans 3 640 9.5px ls .1em `#c78f78`); meta line "7 days · Opened 2 h ago · 33° clear" (11.5px, `#9aa392`, weather value `#e8ece3`).
- **Compact rows** — remaining guides. Flex, gap 12px, min-height 56px, padding 10px 14px, bg `#1a2129`, border 1px `#38414b`, radius 10px. 34×34 thumb (radius 8px), then title (Literata 640 15px) + tag (e.g. "JP · 04", 640 9px ls .1em `#c78f78`) and meta (10.5px `#9aa392`); right-aligned weather (11px, tabular-nums, `#e8ece3`). Selected row border → `#9c4421`.
- **Create card** — last item. Dashed 1.5px `#4e5865` border, radius 10px, centered ＋ circle (34px, `#c78f78`) + "START A SHEET" (600 11px ls .06em `#9aa392`).

**Dock** — floating pill, bottom 22px, centered, above everything. Padding 6px, gap 4px, bg `color-mix(in srgb,#242c34 92%,transparent)` + blur(10px), border 1px `#4e5865`, radius 999px, shadow `0 8px 28px rgba(0,0,0,.45)`. Four items, each min 58×48 (≥44px hit target), icon 17px + label 9.6px 600 ls .04em: SHEETS (active, `#e8ece3`), SEARCH, TOOLS, NEW (＋ in `#c78f78`). Inactive `#9aa392`. Dock auto-hides on scroll-down, returns on scroll-up (existing botbar.js behavior).

### 1b. Table view (option 6a — the globe escape hatch)
NOT a new screen or route — a **collapsed state of the same Atlas home**, for users who find the globe annoying. Integrate as a modifier class on the existing home (`data-view="table"` on the page root), not a fork.

- **Switch**: WORLD|TABLE segmented control replacing the "THE ATLAS · 4 SHEETS" slot in the top bar. Pill, 1px `#4e5865` border, radius 999px; segments padding 4px 11px, Source Sans 3 640 9px ls .14em; active segment bg `#e8ece3` text `#0f1317`, inactive text `#9aa392`.
- **Globe → horizon strip**: same canvas element, container height animates 400px → 88px (globe canvas keeps its 400px height, container `overflow: hidden` crops to the top of the sphere; add a `linear-gradient(to bottom, transparent 30%, var(--bg) 96%)` fade overlay). Pins on the rim remain tappable; tapping the strip switches back to WORLD. Do NOT unmount/remount the globe — reuse the existing atlas-map instance.
- **Dense list**: edge-to-edge rows (no card bg), min-height 60px, padding 11px 16px, hairline bottom border `#242c34`. Up-next row: bg `#1a2129` + 3px left border `#9c4421` + "UP NEXT · SEP 2" tag. Row content = same data as 4a rows (title Literata 640 16px, tag/meta, right weather). Header row: "YOUR SHEETS · N" left, sort control "UP NEXT ▾" right (`#c78f78`).
- **Persistence**: store the choice in `localStorage` (e.g. `wp.homeView = "world" | "table"`); apply before first paint to avoid a globe flash for table users.
- Everything else (dock, safe areas, offer card, guide transition) is identical to 4a.

### 2. Guide page (Japan — transition target)
Reuse the repo guide page. Design additions only:
- **Header**: back circle button (38px, 1px `#4e5865` border) → returns home with scroll position AND selection state intact. Title "Japan" (Literata 640 16px) over "SHEET JP · 04 — 27 DAYS · OCT 15–NOV 10" (640 9px ls .14em `#c78f78`). Right: current weather (11px).
- **Day scrubber**: horizontal chip row under header (padding 8px 12px, gap 6px, bg `#0f1317`, bottom border `#242c34`). Chips: pill, min-height 34px, padding 0 13px, 600 11px, single-line (white-space nowrap). Active: border `#9c4421`, bg `#242c34`, text `#e8ece3`. Inactive: border `#38414b`, transparent, `#9aa392`.
- **Day entries**: cards (bg `#1a2129`, border `#38414b`, radius 10px, padding 12px 14px, flex gap 12px): monospace time (11px `#c78f78`, min-width 44px), stop name (Literata 640 14.5px), note (11px `#9aa392`). Content from `src/content/guides/japan/_guide.json`.

## Safe areas (Dynamic Island / notch / gesture bar) — REQUIRED for the PWA
The design mockups sit inside device frames that simulate the status bar, so they don't carry inset CSS. The production PWA MUST:
- Add `viewport-fit=cover` to the viewport meta: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- **Top bar**: keep its 40px content height but add `padding-top: env(safe-area-inset-top, 0px)` (background/blur extends behind the Dynamic Island / status bar; content sits below it).
- **Globe hero**: no change — it scrolls under the top bar, which already covers the inset.
- **Dock**: `bottom: calc(22px + env(safe-area-inset-bottom, 0px))` so the pill clears the home-indicator gesture bar.
- **Guide page header**: same `padding-top: env(safe-area-inset-top, 0px)` treatment; day scrubber sits below it unchanged.
- **List bottom clearance**: 120px padding-bottom becomes `calc(120px + env(safe-area-inset-bottom, 0px))`.
- Landscape/foldables: also apply `env(safe-area-inset-left/right)` as padding on the top bar and dock container.

## What was explicitly REJECTED (do not carry over)
- The horizontal guide carousel (2a, 3a) — user picked 3b; the vertical list is the only guide UI below the globe.
- Sticky-collapse globe header (1a) and snap collapse — free scroll only; globe simply scrolls away.
- Draggable ledger sheet (1c).
- Globe "coin" in the dock center (1b) — final dock has no globe slot.
- Persistent search bar — search is a dock icon only.

## Notes for the implementing agent (Claude Code)
- **Smallest possible diff.** Extend `index.astro` + `atlas-mobile.css` + `atlas-map.js`; do not create new pages, routes, components, frameworks, or abstractions. If you find yourself writing a new file, re-check the reconcile table first.
- **No scope creep.** Implement exactly the screens above — no settings page, no extra sort modes, no animations beyond those specified, no "improvements" to untouched screens. If something seems missing, leave a TODO comment instead of inventing it.
- **Do not stub or fake.** Wire real data (guides content collection, existing weather source). If a data source doesn't exist, say so in your summary rather than hardcoding placeholder values silently.
- **Verify, don't assume.** Read each repo file in the reconcile table before editing it; the selectors/structure there are the source of truth, not this doc's approximations.
- **Table view is a state, not a page** — resist the instinct to make it a route. One DOM, one globe instance, a `data-view` attribute and CSS.
- Work in this order: (1) safe-area CSS, (2) 3b home layout, (3) globe tap-to-pick, (4) table state, (5) guide transition. Commit per step so partial progress is usable.
- **Report honestly.** In your final summary, list what you verified working versus what you couldn't test.

## Interactions & Behavior
- Globe tap: inverse orthographic pick → nearest pin within ~10° selects; else country polygon hit-test (point-in-ring over the topojson) → offer card; else dismiss.
- Selection: halo + `center`/`focus` set to the guide's lng/lat, spin attr → 0, restored after 4000ms; list smooth-scrolls to the row.
- Row tap: guide with a built sheet navigates to its guide page; others select-on-globe.
- Back: restores home scroll offset and selected state (design keeps state in the component; in Astro, sessionStorage or View Transitions state).
- Globe perf: keep the repo's dirty-flag RAF loop (idle frames free, pause when hidden/off-screen, honor prefers-reduced-motion). Ensure a first paint on world-load regardless of the visibility gate (we hit this bug — see `waypoint-globe.js` `_start()`).
- Dock: auto-hide on scroll-down / show on scroll-up; blur backdrop.
- All hit targets ≥ 44px. One-handed reach: primary actions (dock, up-next card, offer button) in the bottom half.

## State Management
- `selectedGuide: index | null` — drives halo, row border, list scroll.
- `offer: {countryName} | null` — start-a-sheet card visibility.
- `activeDay: index` — guide day scrubber.
- `screen: home | guide` + preserved home scroll offset.
- Weather values are placeholders ("33° clear" etc.) — wire to a real feed or omit.

## Design Tokens (dark set used in mocks — map to base.css equivalents)
- Bg `#0f1317` · sunken `#1a2129` · card `#242c34` · hairline `#38414b` · rule `#4e5865`
- Ink `#e8ece3` · muted `#9aa392` · oxide accent `#9c4421` · oxide-tint `#c78f78` · dark-mode halo `#d98a94`
- Type: Literata (titles, 640) + Source Sans 3 (UI, 600–700); monospace for times. Letter-spacing: .2em section labels, .1em tags, .24em wordmark.
- Radius: 10px cards, 999px pills. Shadows: `0 8px 24px rgba(0,0,0,.35)` cards, `0 8px 28px rgba(0,0,0,.45)` dock.
- Spacing: 16px page gutter, 10px list gap, 120px bottom clearance above dock.

## Efficient execution plan (Claude Code)
Run as one plan with parallel subagents; use a cheaper model (e.g. Haiku) for the mechanical tasks and reserve the strong model for Task 2 and integration.

0. **Recon (strong model, sequential, short)**: read `index.astro`, `atlas-map.js`, `botbar.js`, `atlas-mobile.css`, `base.css`; confirm the reconcile table above still holds; write the diff list.
1. **[subagent, cheap] Tokens & static markup**: mobile home layout (top bar, list section, cards, create card) — pure Astro/CSS from repo tokens.
2. **[subagent, strong] Globe interactions**: extend `atlas-map.js` with pick(), focus halo, spin pause. Reference implementation: `waypoint-globe.js` in this bundle (pick + inRing + halo are directly portable).
3. **[subagent, cheap] Dock tweaks**: 4-item variant of botbar, active state, auto-hide already exists.
4. **[subagent, cheap] Guide header/back + day scrubber styles** on the existing guide page.
5. **Integration + QA (strong)**: wire tap→select→scroll, row→guide, back-with-state; test 360–430px widths, light+dark, reduced motion, ≥44px targets, globe first-paint.
Tasks 1–4 touch disjoint files and can run in parallel after Task 0.

## Assets
- `public/data/countries-110m.json` (already in repo) — globe geometry.
- Guide covers: from repo guide content; mocks use hatched placeholders.
- No new imagery introduced.

## Files in this bundle
- `WayPoint Mobile.dc.html` — all explorations; **section 4 (id `4a`) is the spec**; section 3 (`3b`) shows the same layout pre-wiring; older sections are context only.
- `waypoint-globe.js` — canvas globe recreation with the new pick/halo/pause logic (reference for Task 2).
- `android-frame.jsx`, `ios-frame.jsx`, `support.js` — preview scaffolding only; ignore for implementation.

## Screenshots
- `screenshots/01-home-globe.png` — 4a home: globe hero + top bar + dock
- `screenshots/02-home-list-scrolled.png` — 4a scrolled: sticky list header, up-next card, compact rows
- `screenshots/03-japan-guide.png` — guide screen: back header, day scrubber, day entries
- `screenshots/04-option-3b-reference.png` — 3b pre-wiring reference

Note: screenshots are DOM re-renders; the noise texture may render blank. The live `WayPoint Mobile.dc.html` is the source of truth.
