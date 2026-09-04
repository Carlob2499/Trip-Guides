# D7 visual convergence — full-site completion matrix

Repository: `Carlob2499/Trip-Guides`
Branch: `claude/waypoint-design-overhaul-9m1fro` (continues PR #186's engineering foundation)
Role: production implementation and visual convergence against the sole authority. This file is
an execution record, **not design authority** — `docs/reference/design-system.md` is.

## Superseded on 2026-09-04 (later the same day)

Carlo's constitution commit (`bffb4df`, "D7: lock Waypoint grand redesign contract") replaced the
design-system document this record converged against. The section numbers below (§13, §14, §20,
§21) refer to that earlier document; SOS, provenance and offline are now governed by §28, §32 and
§29 of the current constitution, and the whole-site target is `docs/work-orders/waypoint-grand-redesign.md`.
This file stays as the execution record of the checkpoint that landed with PR #191.

## What changed on 2026-09-04

The creator replaced the two-canary stop point with one continuous migration: the two canaries
remain Checkpoint 1, and every other surface is audited and either converged or certified as
already conforming. The three formerly open visual-sanity items were locked the same day
(design-system.md §13, §14): SOS stress state, provenance/freshness disclosure, and offline as
quiet capability.

## Reading order (unchanged)

1. `docs/reference/design-system.md`
2. `docs/reference/design-system-assets/mockup-manifest.json` (its `v1_canary_routes` for the two checkpoint surfaces)
3. only the visual assets the manifest lists
4. the production components/styles for the surface in hand

Raster boards contribute only their `allowed_signals`; canonical repository data and the
Markdown authority override every sample fact, control, person, price, route and colour.

## Surface-by-surface matrix

| Surface | State | Owner(s) | Convergence notes |
| --- | --- | --- | --- |
| Global shell (desktop) | converged | `AppChrome.astro`, `chrome.css` | Integrated floating destination cluster inside the utility row (every destination control clears 44px, icon-only between 900 and 1099px); wide persistent Search; SOS/share/theme cluster; compacts on deep scroll without reordering. Not a sidebar. |
| Global shell (mobile) | converged | same | Compact topbar, expanded→compact Search, five-slot bottom bar with a mark (not colour alone) on the current destination; yielding chrome preserved. The first-visit “what is Waypoint” strip was retired: it competed with the operational fold on every surface. |
| Atlas | converged | `pages/index.astro`, `atlas-*.css`, `features/atlas` | The globe is the front door: the session splash cover was retired; the motto card and the mobile dock (a duplicate readout) were retired; the quick card carries identity + clock only (emergency numbers belong to SOS); the wordmark is the page's level-one heading. |
| Trip — active (V1 checkpoint, phone) | converged | `TripDestination.astro`, `features/trip/ui/trip.js`, `trip.css` | Compact identity band → Now (dominant, with the place’s own repository photo) → Next (compressed) → Get there → material problem → fallback → remainder of day. No dossier, no dashboard grid, no `Add to plan`. |
| Trip — active (desktop) | converged | same | Photo strip + day context, Now large left, Next beneath, remainder/fallback right. |
| Trip — pre / post | converged | same | Restrained hero, countdown, first six unresolved readiness items with the rest folded and still counted; editorial recap + outcome atoms post-trip. |
| Itinerary — desktop workbench (V1 checkpoint) | converged | `ItineraryDestination.astro`, `DaysBlock.astro`, `itinerary.css`, `features/itinerary` | One continuous timeline rail, time column, the stop’s own photo, large names, handoff; selected stop ↔ map pin synchronized (rail dot + row); framed map pane; 30–70% resize and collapse preserved. |
| Itinerary — mobile | converged | same | Day-first, compact day head, know-before links as one scrolling row, thumb-zone day rail. |
| Map | converged | `MapDestination.astro`, `map.css`, `features/maps/ui/map-dest.js`, `features/maps/ui/fullscreen.js` | Map fills its pane (the 300px iframe override was the bug); on desktop the map and the selected atom hold the viewport while the place list flows with the page, so no row is ever clipped by a second scroller (and every row is now contrast-rated by the a11y gate); selected place is a large atom with the place’s repository photo; degraded line stays on the map. |
| Guide — cover | converged | `GuideDestination.astro`, `masthead.css` | Full-width editorial cover (~58vh desktop, ~42vh phone) with the identity plate on its own surface; emergency chips removed from the hero (SOS owns them); currency moved to the plate line. |
| Guide — chapters | converged | `GuideDestination.astro`, `Block.astro`, `guide-dest.css` | Knowledge modules name their kind in the Panel kicker; the empty-wrapper grid rows that left phantom space under chapter heads are gone. |
| Split | converged | `TripSplit.astro`, `SplitDestination.astro`, `features/trip-split/ui/trip-split.js`, `trip-split.css` | Recent Expenses → Add Expense (primary, filled) → per-row `Who paid · Method · N people` with a semantic category icon → balances secondary. People card leads only while the ledger has nobody. Desktop: dimmed destination scene behind an opaque ledger. Engine, validation, currency, payments, undo, filter untouched. |
| Search | certified conforming | `features/search` | Desktop persistent field + overlay; mobile expanded/compact + full-height overlay; current-trip-first groups. No change needed beyond the shell. |
| SOS | converged (locked) | `features/sos/ui/sos.js`, `field-tools.css`, `base.css` (`--dark-warn`) | Near-black full-height sheet (modal on desktop); Police + Fire/Ambulance as two enormous one-tap calls in emergency red; verified second layer subordinate; offline stated once, quietly. Advisory ink uses a fixed dark-ground warn token (7.5:1) because the surface is dark in both themes. First-layer classification is by what a line is, never its position. |
| Provenance | converged (locked) | `provenance-dot.css`, `scripts/provenance-dot.js` | Quiet dot; popover on desktop, bottom sheet on phones; a lifted card can no longer trap the sheet. Failed-photo overlays no longer block the dot. |
| Utility pages (intake, progress, triage, change, about, health) | converged | `UtilityBar.astro`, `utility-bar.css`, each page | One shared strip (wordmark, way back to the Atlas, theme control) replaced four page-specific bars; health gained its way back. Page bodies were already on tokens and type. |
| 404 | converged | `pages/404.astro`, `not-found.css` | Astro's branded default replaced by a Waypoint page: the strip, one honest line, the Atlas and About as the ways on. |
| Offline / degraded | converged (locked) | `scripts/offline-pill.js`, `chrome.css`, map fallbacks | `Offline · saved copy` pill only while offline; per-module degraded states; PWA install/caching never advertised in chrome. |

## Honest deviations

- **Leave by** renders nowhere. The itinerary schema carries no travel-time or leave-by field,
  and inventing one from coordinates would be a fake live ETA (§9, §18). The atom appears the
  day Guide Author research produces a verified value; the Now → Next → Get there → problem →
  fallback → remainder order is otherwise complete.
- **Known location/base** in SOS renders nowhere: Waypoint does not possess it (§13).
- Local screenshots in the implementation sandbox could not reach Wikimedia or OpenStreetMap
  (egress policy); layouts were verified with local stand-in images. The Design canary workflow
  in CI captures the real-network renders.

## Wiring audit (2026-09-04)

Every visible control on Atlas, all five guide destinations, intake, progress, change, about and
health was clicked at 390×844 and 1440×1000 by a scripted pass: no internal link 404s; every
destination switch, day switch, map focus, Split action and theme control changes the page;
the only images that fail locally are on hosts the sandbox cannot reach (Wikimedia, OSM, the
GitHub badge service). The Atlas pin chip reads as “unstable” to automation because the globe
turns; a touch holds the globe (atlas-map.js `_hold`), reduced motion stops it, and the spin
control pauses it, so it is a real tap target.

## Verification

- `npm run check:fast` (invariants, lint, typecheck, unit tests including drift, colour-scale,
  breakpoints and design-fidelity contracts)
- `npx playwright test tests/visual/a11y.spec.ts tests/visual/resilience.spec.ts`
- `npm run canary:visual` — V1 checkpoint pair plus V2 captures of every surface, phone +
  desktop, dark + light (review evidence, never baselines)
- `npm run build`

Gallery baselines were **not** regenerated: baselines follow creator acceptance (§21).
