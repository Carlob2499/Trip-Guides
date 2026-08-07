# Design Migration Inventory

Preservation checklist ahead of a design/UI overhaul. Every item below is currently
shipping and user-facing (or, where noted, infra with no UI) — nothing here should be
silently dropped when the design migrates. Walked from `src/layouts/GuideLayout.astro`,
`src/features/*/index.{ts,js}`, `src/scripts/*.js`, `src/components/*.astro`, and
`src/components/blocks/*.astro`.

## Layout (`src/layouts/GuideLayout.astro`)

- **Pre-paint dark-mode init** (inline `<script>` in `<head>`) — reads `localStorage`/OS preference and stamps `data-theme` + `theme-color` meta before first paint, so there's no flash of the wrong theme.
- ~~**Title-card story-intro pre-paint stamp**~~ — RETIRED 2026-08 (creator-approved, masthead plate rebuild): its full-bleed treatment assumed the title sat absolutely over the photo, which the plate layout no longer does; the redesign's own hub→masthead FLIP transition (README.md §Interactions) supersedes it as Phase 3 work rather than needing a rebuild here.
- **Skip link** — "Skip to content", first focusable element, jumps keyboard/AT users past chrome.
- **Reading progress bar** (`#readProg`) — fixed 3px line at top that fills as the user scrolls.
- **Toast** (`#savedNote`) — transient save/copy confirmation region (`flash()`).
- **Sticky chrome wrapper** — topbar + tab bar stick together as one unit while scrolling.
- **Top navigation bar** — Waypoint home link/wordmark, Share button, Dark-mode toggle button (search + SOS buttons are injected into this cluster by `palette.js`/`sos.js`).
- **"Request a change" wizard** (`<ChangeRequest>`) — guided modal, hidden until the footer pill opens it.
- **Share modal** — QR code, copy-link, "Share trip summary" button, WhatsApp/Email share links, "Add to Home Screen" install tip, GPX/ICS download links (each shown only when that export data exists).
- **Guide tab bar** (`#guideTabs`, role=tablist) — one tab per section group, plus four tool tabs: Budget calculator, Group Vote, Reminders, Trip Kit (Learnings tab hidden until feedback exists).
- **Cold-open framing strip** (`#coldOpen`) — one-time "what is Waypoint" explainer for shared-link recipients, dismissible.
- **Masthead / hero** — REBUILT 2026-08 as DESIGN.md's "plate" (square, sunken bed, oxide corner ticks, beside a text column) + a new plate line (coordinates, CHECKED stamp, fact/source counts, print control). Carried over: cover photo or Painted Atlas fallback, living-cover video layer with visible pause button, photo/video credit chip. Retired (creator-approved, decorative-only, no spec counterpart): day-segment story rail, topographic contour overlay, title-card gloss sweep, optional seasonal particle canvas (`introMotif` — schema field removed).
- **What's-Next banner** (`#whatsNext`) — client-populated "today" line matched against device date.
- **Weather strip** (`#wxWrap`/`#wxMount`) — masthead weather widget (suppressed if the guide has its own `weather` section).
- **Guide stats bar** (`#guideStats`) — verified-warning pill, live currency-rate pill (both injected/shown client-side).
- **Draft-guide banners** — "Track live progress" link (to the pipeline-progress page) and "Nominate for graduation" issue link, shown only on `draft: true` guides.
- **Jet-lag calculator** — collapsible panel with origin-timezone picker and computed adaptation advice, shown when the destination has a known timezone.
- **Section tab panels** (`.catblock`) — per-group chapter opener (numeral, photo fan of up to 3 sight photos, title, descriptor/contents line), the routed `<Block>` per section, "Trip Feedback" CTA (on groups with a `days` section), "Next section" CTA linking to the next tab.
- **Colophon / footer** — "every fact checked against a primary source" claim line, optional guide footer note, stat list (last checked / verified facts / primary sources / next self-check — each rendered only if non-zero), offline-saved confirmation line, anonymous-telemetry disclosure line, "Request a change" footer pill (real link, progressively enhanced).
- **Mobile bottom tab bar** (`.botbar`, phone-width only) — two promoted content-group slots (device-ranked), a rotating Tools slot (Budget/Vote/Reminders/Kit/Learnings icon swap), "Groups" sheet-opener, "Today" jump button, "Map" deep-link (only when the guide has a map section).
- **Slide-up section sheet** (mobile) — full list of every group + subsection + all 5 tool links, drag-to-dismiss.
- **Client script bundle** — boots every feature/script listed below in a fixed load order (see Scripts/Features sections); embeds `#tgConfig` and `#storyDays` JSON config for client consumption.

## Features (`src/features/*/index.{ts,js}`)

- **exports** (`exports/index.ts`) — infra only (no UI): build-time GPX/ICS/summary builders consumed by download endpoints and the share-summary button.
- **field-tools** (`field-tools/index.js`) — on-the-street helpers: tap-to-copy "show the driver" native-script address card, tap-to-check-off stop numbers (persisted, shareable via a "share trip progress" link), tap-the-rate-pill currency quick-converter popover, floating "Today" chip opening a full-screen Focus Today view (today's stops only, tap-to-check synced to the real list, Plan B if present, "open the full plan" link), masthead data-freshness chip + tap-to-open budget-burn tile, and a live "N/Total" section-position readout (mirrored into the Groups button and the mobile sheet head).
- **palette** (`palette/index.js`) — command palette / quick-jump (Ctrl+K, `/`, or the topbar Search button): full-text search across sections, tabs, itinerary days, sights, and in-guide card text; jumps to and highlights the match.
- **sos** (`sos/index.js`) — one-tap verified emergency-numbers button + drag-to-dismiss sheet in the topbar (country-specific; EU/EEA falls back to a 112-only warn sheet; hidden where no data exists), plus an elevated (level ≥2) official travel-advisory link inside the sheet — the button renders for the advisory alone even with no researched emergency numbers.
- **reminders** (`reminders/index.js`) — "Notable items" shared scratchpad tool tab (door codes, meetup times, links), Firebase-synced.
- **learnings** (`learnings/index.js`) — Trip Feedback survey modal + the Learnings tab (post-trip recap, day flip Plan⇄Actual toggle), hidden until feedback exists.
- **maps** (`maps/index.js`) — fullscreen button on every OSM map embed; optional Google Maps upgrade with pins when `PUBLIC_GMAPS_KEY` is configured.
- **share** (`share/index.js`) — the share modal's panel logic (QR, copy-link, WhatsApp/email, trip-summary share text), coordinated body-scroll-lock with the mobile sheet.
- **telemetry** (`telemetry/index.js`) — infra only (no direct UI): anonymous per-tab open counting, disclosed via the colophon footer line.
- **voting** (`voting/index.js`) — Group Vote tool tab: propose options, +1 to pick, shareable vote link/QR.
- **budget-pact** (`budget-pact/index.js`) — "budget pact" line under the Budget tab's total row comparing plan vs. actual spend so far in the trip.
- **live-data** (`live-data/index.js`) — live ECB exchange-rate pill, Open-Meteo weather widget, day-swap advisory (rain/heat), sunrise/sunset times, packing-list derivation — all runtime third-party data.
- **pipeline-progress** (`pipeline-progress/index.ts`) — read-only progress view (the `/progress` page) showing a draft guide's research-pipeline stage/status.
- **trip-kit** (`trip-kit/index.js`) — Trip Kit tool tab: arrival autopilot steps, book-by deadline timeline, phrase cards (with text-to-speech), entry-requirements picker, weather-driven packing list.
- **firebase** (`firebase/index.js`) — infra only (no direct UI): shared-sync gateway (room join/resolve, error reporting, counters) used by Trip Split, Reminders, Learnings, Telemetry.
- **route-opt** (`route-opt/index.js`) — per-day route-optimizer advisory chip (haversine + nearest-neighbour + 2-opt) a traveler can apply or restore.
- **intake-questions** (`intake-questions/index.ts`) — infra only (no direct UI on a guide page): traveler-framed decision-point cards surfaced on the progress page during a research pass.
- **itinerary** (`itinerary/index.js`) — day-by-day interaction cluster: day-scrubber rail, live now-line, reading spine, per-day/full print, and full-screen Story Mode (swipeable one-day-per-view deck).
- **mobile-nav** (`mobile-nav/index.js`) — phone's primary bottom nav bar (device-ranked promoted groups + tools slot), the Groups sheet's resume lines, swipe-between-tabs gesture, day-scrubber sync, chrome-yielding on scroll.
- **change-request** (`change-request/index.js`) — the guided 3-step "Request a change" wizard that builds a prefilled GitHub issue.
- **trip-split** (`trip-split/index.ts`) — Budget Calculator tool tab: id-keyed members/expenses, minimum-transfer settlement math, category breakdown, PDF summary export, optional Firebase-backed shared live room.
- **hub** (`hub/index.js`) — home-page behaviors: guide grid interactions + dark-mode toggle wiring.

## Scripts (`src/scripts/*.js`)

- **anchors.js** — "today" ring on the Days timeline, live progress rings on checklist cards, and the one-time scroll-triggered draw-in animation for section-anchor figures.
- **cold-open.js** — reveals/dismisses the once-per-browser "what is Waypoint" framing strip for shared-link recipients.
- **gsap-hero.js** — the orchestrated masthead arrival animation (eyebrow → title → dek → stat tiles), GSAP-driven, skipped under reduced-motion or during the story intro.
- **guide-ui.js** — the core interactive bundle: tab-bar switching, mobile sheet, scroll-spy, checklist persistence, budget calculator wiring, storage-key migration, and boots most feature modules.
- **hero-parallax.js** — masthead photo drifts slower than the page on scroll (parallax) plus a one-time Ken-Burns drift-in on load.
- **hub-live-cards.js** — hub-card hover preview: plays a guide's living-cover video on desktop hover, falls back to the static photo.
- **jetlag-ui.js** — jet-lag calculator DOM wiring: toggle panel, origin-timezone select, rendered adaptation advice.
- **lightbox.js** — tap any venue/sight photo to view full-screen with caption + Commons/CDN credit; focus-trapped, Esc/backdrop/✕ to close.
- **living-cover.js** — drives the masthead's optional footage layer over the still cover: lazy-loads on view, pauses off-screen/hidden-tab, visible pause button, credit-chip swap while playing.
- **micro.js** — haptic tap buzz on touch of key controls; desktop-only "magnetic pull" cursor-follow flourish on the "next section" CTA.
- **offline-pill.js** — online/offline connection-state pill + `data-conn` attribute + "saved on this device" colophon confirmation once the service worker has actually cached the page.
- **onboard.js** — one-time dismissible navigation-hint strip teaching swipe/tab/Ctrl+K gestures, shown once per device.
- **overture.js** — the hub's cinematic first-screen intro: kinetic arrival, auto-glide scroll into the guide grid (interruptible by any real user input), scroll-linked recede/parallax, animated stats count-up.
- **provenance-dot.js** — tap-to-toggle popover showing a venue's source + verification info.
- **reveal.js** — scroll-triggered reveal-in animation for cards/days/hub cards (fallback where native CSS scroll-timelines aren't supported).
- **scroll-memory.js** — remembers and restores each section's scroll position per guide+tab across tab switches and reopens.
- **section-flight.js** — wires the "Next: …" end-of-section CTA cards to click the real tab buttons.
- **sheet-drag.js** — shared drag-to-dismiss gesture implementation for the mobile sheets (Groups sheet, SOS sheet).
- **staleness-ui.js** — client-side ⚠ "verified <date> — re-check" pill on sections whose provenance has passed its shelf life.
- ~~**story-open.js**~~ / ~~**story-petals.js**~~ — DELETED 2026-08 with the masthead plate rebuild (see the Masthead / hero entry above).
- **theme.js** — shared dark/light toggle button wiring (icon swap, PWA theme-color sync, localStorage persistence) used by both the guide topbar and the hub.
- **util.js** — shared helper library (HTML-escape, reduced-motion check, haptic tap, storage-key migration) — no direct UI, consumed by many of the above.

## Components (`src/components/*.astro`)

- **Block.astro** — routes each guide section to its typed sub-component (panel/prose/list/routes/map/budget/days/sights/raids/habitats/infogrid/tierlist/weather/holidays/venues/divergences), and renders the optional collapsible `<details>` card wrapper + "copy link to section" anchor button.
- **ChangeRequest.astro** — markup for the guided 3-step "Request a change" modal (tab picker → free-text change → review step).
- **Icon.astro** — the site's single stroke-SVG icon vocabulary (tool-tab icons, chrome icons like home/moon/edit/clock/shield/plane/etc.).
- **Learnings.astro** — Trip Feedback survey-modal shell + the Learnings tab panel (curated post-mortem, per-day skip tally, key-learnings list, changed-in-this-guide list, recap-image share/download link).
- **PaintedAtlas.astro** — the CSS/SVG "living cover" every guide is born with: slug-seeded terrain art under a sky that re-keys to the destination's live local time of day.
- **PwaHead.astro** — shared `<head>` PWA bits: manifest link, theme-color, icons, service-worker registration.
- **Reminders.astro** — "Notable items" tool-tab markup: label/text inputs, add button, live list, shared-room connecting indicator.
- **TransitLinks.astro** — "Get me there" one-tap deep-link row to a verified coordinate (rendered only when lat/lng exist).
- **TripKit.astro** — Trip Kit tool-tab markup: entry-requirements card (with passport picker), book-by deadline card, packing card (revealed once weather resolves), arrival-autopilot card (steps + checklist), phrase-cards (with speak buttons).
- **TripSplit.astro** — Budget Calculator tool-tab markup: people list, add-expense form with category suggestions and search/filter, results card (total, balances, settlements, paid history, category breakdown), undo bar.
- **Voting.astro** — Group Vote tool-tab markup: add-option form, options list, copy-vote-link/QR buttons, reset-votes button.

## Components / Blocks (`src/components/blocks/*.astro`)

- **BudgetBlock.astro** — per-guide cost breakdown table by category, trip-total vs. per-person toggle, live-rate footer line, budget-vs-target verdict line.
- **DaysBlock.astro** — the day-by-day itinerary: journey-shape anchor figure, "Play the trip" Story Mode launcher, day-scrubber chips, per-day cards (route-leg summary, Plan⇄Actual flip, tl;dr, pace, numbered waypoint stops with transit links, notes, Plan B alternate, day checklist).
- **DivergencesBlock.astro** — "generic guides say / what we found" correction cards with category tag and source link.
- **HabitatsBlock.astro** — responsive card grid for time-windowed rotations (day/time, type chips, priority targets, raid chips, tactical tip).
- **HolidaysBlock.astro** — public-holiday alert table for dates falling within the trip, "no holidays" reassurance state, nearby-holidays list, Nager.Date source credit.
- **InfoGridBlock.astro** — icon-labeled fact-tile grid.
- **ListBlock.astro** — a plain persisted checklist.
- **MapBlock.astro** — embedded OSM area map (upgradeable to Google Maps with pins), offline-connectivity note.
- **PanelBlock.astro** — lead/"More detail" fold-out card body, optional live checklist-progress ring, persisted checklist items.
- **ProseBlock.astro** — lead/"More detail" fold-out prose body (no checklist).
- **RaidBlock.astro** — collapsible per-boss counter tables with strategy notes and shiny-odds intro, grouped by raid tier.
- **RoutesBlock.astro** — transit-leg journey-line figure plus a persisted step checklist.
- **SightsBlock.astro** — photo-forward sight cards (responsive srcset, credit chip, kicker/name overlay) or text-only fallback, with transit links.
- **TierListBlock.astro** — ranked chip groups (priority tiers) with shiny/hot chip highlighting.
- **VenueBlock.astro** — venue cards: provenance-dot popover (checked date/source/evidence tier), price/booking pills, hours/closed/address/phone/directions detail list, transit links.
- **WeatherBlock.astro** — hidden mount shell populated client-side with the live forecast strip (avoids an orphaned heading on fetch failure).
