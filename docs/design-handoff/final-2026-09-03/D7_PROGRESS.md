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

- `src/lib/guide-view.ts` = the ONE derivation of everything the destinations receive;
  GuideLayout and the gallery both call `deriveGuideView`.
- Map embeds are lazy: `iframe[data-src]` inside a destination is promoted by `showDest`
  (guide-ui.js) when that destination first shows; the gallery promotes all of them itself.
- Search ranking is token-aware (`queryTokens`), strict-then-relaxed, deterministic.

## Status (2026-09-04)

- [x] Models, components, router, chrome, trip/search features, CSS layer.
- [x] Build green; `check:fast` green (invariants, lint, typecheck, 3135 unit tests);
      Playwright a11y + resilience green (85/85); `check:offline`, `check:perf` green.
- [x] Registry JSON, gallery (renders the five destinations), gate tests (breakpoints,
      no-device-checks, no-orphan, accent-ink, a11y + resilience specs) updated.
- [x] CLAUDE.md/AGENTS.md trimmed to 6478 bytes (parity kept).
- [x] Retired: guide-rail, palette, reminders feature, mobile-nav rank/swipe/resume/botbar/
      day-scrub, story-mode, spine, ToolsScreen/TripKit/Reminders, dead stylesheets.
- [ ] Still to do, in order: panel reorder retirement; guide.css/flight.css/field-tools.css
      stale rule sweep (rail/catblock/nav-hint/today-chip/spine); Split rehierarchy
      (TripSplit.astro + trip-split.js: per-row method, participants in add flow); Atlas
      reconcile (index.astro: global search hook, controls recede); Denmark `branches` data;
      Korea `module` metadata; gallery screenshot baselines review (never update blindly);
      docs (design-system.md D7 notes, repo-map, component registry notes); ACCEPTANCE_MATRIX
      evidence; `npm run check` + `ship:check`; PR.
