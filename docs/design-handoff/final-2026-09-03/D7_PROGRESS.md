# D7 implementation — progress log (breadcrumbs for a resumed session)

Branch: `claude/waypoint-design-routing-rex0vr` (started from frozen SHA `b37fe92`).
Authority order: `FABLE5_IMPLEMENTATION_PROMPT.md` in this folder. Read this file first on resume,
then `git log --oneline` and `git status` on the branch. WIP commits may be red; the log says
what is finished and what is mid-flight.

## Architecture decisions taken (do not re-decide)

- Five destinations are regions of ONE guide page (`src/layouts/GuideLayout.astro`):
  `#dest-trip · #dest-itinerary · #dest-map · #dest-guide · #dest-split`. Router =
  `src/scripts/guide-ui.js` (`showDest`, `goToHash`, `data-dest-nav`, `data-dest-go`).
- Global chrome = `src/components/AppChrome.astro` + `src/styles/chrome.css`: topbar (Atlas link,
  desktop destination row, Search, SOS mount `[data-sos-mount]`, share, theme), expanded Search
  field (`.searchbar`, folds on `body.chrome-scrolled`), five-slot bottom bar (yields on
  `body.chrome-yield`).
- Masthead (cover) lives INSIDE the Guide destination (`GuideDestination.astro`); Trip has its own
  restrained hero. Guide = overview cards → one chapter at a time (`data-chapter-panel`,
  `data-chapter-go`), desktop chapter index, spatial chapters get a map aside.
- `src/features/trip/` absorbs trip-tools (reminders, closures) + trip-kit (arrival, book-by,
  speak, entry-select, packing). `#tripData` = canonical days (replaces `#storyDays`).
  `ui/trip.js` paints phase + Now/Next.
- `src/features/search/` owns the index (moved from atlas) + ranking + overlay. Per-guide index
  is embedded as `#searchIndex`; cross-guide index stays `dist/data/search-index.json`.
- Schema additions (`src/content.config.ts`): `module` facet (D6-53 relation layer) and day
  `branches` (D6-46). Validation in superRefine.
- Retired: trip-tools, trip-kit, ToolsScreen, TripKit, tools-reminders.js (→ readiness-ticks.js),
  section-flight.js, onboard.js. Still to retire: guide-rail, palette, mobile-nav rank/swipe/
  resume/botbar/day-scrub, story-mode, spine, panel reorder, Reminders + reminders feature,
  mobile-nav.css, story-mode.css, tools.css, palette.css, planner.css.

## Status

- [x] Models: trip lifecycle/trip-data/readiness/recap (+tests), search index/rank (+tests).
- [x] Components written: AppChrome, TripDestination, ItineraryDestination, MapDestination,
      GuideDestination, SplitDestination, DaysBlock (timeline), GuideLayout.
- [x] Scripts: guide-ui.js (router), trip/ui/trip.js, readiness-ticks.js.
- [ ] itinerary feature rewrite (day-rail + workbench), maps lens/selection + OSM-until-init,
      search overlay + styles.css, mobile-nav simplification, sos mount, CSS (trip.css,
      itinerary.css, guide-dest.css, map dest), guide.css cleanup.
- [ ] Split rehierarchy (TripSplit.astro + trip-split.js: rows show method, add flow participants).
- [ ] Retirement + registry + gallery + tests (a11y/resilience/breakpoints/no-device-checks/
      color-scale/drift baseline) + CLAUDE.md/AGENTS.md ≤ 6500 bytes (invariant currently red).
- [ ] Atlas reconcile, Denmark branches data, Korea module metadata.
- [ ] Gates: check:fast, playwright, check, check:offline, check:perf, ship:check, drift. PR.
