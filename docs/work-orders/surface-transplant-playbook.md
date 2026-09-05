# Surface Transplant Playbook — boards 02–10, one PR each

Status: **COMPLETE (2026-09-05) — all ten surfaces and the §4 after-list are on main.**
The closeout, the owner task list and the model-routed next steps are in
`surface-transplant-closeout.md`. What follows is the work order as it was executed; it stays
as the record of how each surface was decided, not as work still to do.

Status (original): **EXECUTION PLAYBOOK — HAND-OFF READY**  
Owner: Carlo  
Written: 2026-09-05 (after Surface 1 · Atlas, PR #195)  
Authority: `PRODUCT.md` → `docs/reference/design-system.md` → `docs/mockups/VISUAL_LINEAGE.md` + the boards in
`docs/mockups/final-package/mockups/` → `docs/reference/motion.md` → tokens, tests, gates.

This file exists so a **different model or session** can carry each remaining surface to main without
re-deriving the decisions. It is a work order, not a design authority. Where it and the constitution
disagree, the constitution wins; where the constitution is silent, the board wins; where the board shows
something the product has not wired, leave it out.

Model routing (owner's split): **Opus 5** for 02 Trip, 03 Itinerary, 04 Map, 05 Guide, 07 Builder;
**Sonnet 5** for 06 Search, 08 Split, 09 SOS, 10 Learnings. Fable is not required for any of them.
Judgment calls this file cannot settle go to the owner as one `AskUserQuestion`, never a guess.

---

## 0. Settled decisions (do not reopen)

- **Frame strip.** Desktop shell = the top row of the dark frame: wordmark left, tabs `Trip · Itinerary · Map · Guide · Split` centred, Search pill / SOS / share / theme right (`AppChrome.astro`, `chrome.css`). The floating rail is retired. §6.
- **Cream default, light/dark.** Page ground is cream (`--bg`) in light mode; the frame (`.stage.spatial`) is forest in both themes with a hairline so it still reads as a frame in dark mode.
- **Accent stays oxide** `#9c4421` (`--accent`), text accent `--accent-ink`. No palette lift. The boards' brighter orange is not reproduced.
- **Phone bar on guide pages** becomes `Trip · Itinerary · Map · Guide · Split` (Split takes the fifth slot; Atlas is the wordmark). The Atlas page keeps `Atlas · Trip · Itinerary · Map · Guide`. Land this in **02 Trip** together with `design-system.md` §6 and `tests/visual/resilience.spec.ts` (the five-id pin at `expect(ids …).toEqual([...])` and `DEST_NAV`).
- **Only wired features ship.** Notifications, avatars, "Saved guides/places", companions, notes/documents, ratings, "Optimize day", "Add stop", "Measure", "Compare", map layer toggles, "Export learnings", "Invite", taglines, design notes, "More" buttons, and every number the boards invent (528,800 ₩, 4.7 ★, 47 photos) are **not** built. An honest empty state or nothing at all replaces them.
- **Photos come through the usual integration**: Commons `img.file` on guide items → `atWidth`/`srcsetFor`/`imgCredit`. No photo API, no filler, no unverified file references.
- **Baselines regenerate only on CI** (`regenerate-gallery-baselines.yml`), never by hand. Regenerating a baseline is a regression lock, not design approval.
- **Creator visual acceptance** is a board-vs-build sheet under `docs/mockups/compare/NN-<surface>.webp`, embedded in the PR.

---

## 1. The frame pattern (already shipped in Atlas; reuse verbatim)

```
<div class="stage spatial">            ← chrome.css .stage: cream page, forest frame ≥900px (margin 18/22, --r-pane, hairline)
  <AppChrome …>                        ← the strip; ALWAYS first child; static inside the frame on desktop, sticky on phones
    <x slot="center">…</x>             ← optional; default = the tabs on a guide, empty on utility pages
  </AppChrome>
  <section class="…-stage-body">…</section>   ← the surface's own workspace in the dark register
</div>
<main class="…-below">…</main>         ← ivory cards under the frame (cream ground, --card surfaces)
```

Rules that follow from it:

- `.spatial` re-maps every surface token (`--bg --bg2 --card --rule --rule2 --muted --ink --accent-ink --aink --selected-ink --sunken --line --line-strong …`) to the dark register (`base.css`). Inside the frame write **tokens only**; never a hex, never `--dark-ink` tricks. Anything already token-driven turns forest for free.
- Panels inside the frame: `background: var(--card); border: 1px solid var(--rule); border-radius: var(--r-card)`; wells `var(--bg2)`; kickers = `--text-panel-kicker` + `--tracking-panel-kicker` uppercase `--muted`; row sub-labels `--text-nano` `--muted`.
- Press shapes: primary `var(--accent)` fill with `var(--on-accent)` text; secondary outline `var(--rule2)`; radius `--r-inset` for CTAs, `--r-pill` for chips, `--r-compact` for tiles, `--r-card` for cards, `--r-pane` for the frame and sheets. `border-radius` must be one of those tokens, `0`, `999px` or `50%` (drift gate).
- Elevation: `var(--shadow-float)` / `var(--shadow-lift)` / `none`, written **without a space after the colon** (`box-shadow:var(--shadow-float)`) — the drift regex misreads the spaced form.
- Type: only `--text-*` steps (type-scale test), only `--font-display|body|data`.
- Every control ≥ 44px in its smallest dimension at every device in `tests/visual/a11y.spec.ts` DEVICES (including 320/375/390). The strip drops the wordmark's word under 400px and keeps a 44px mark.
- A new `@media (min-width|max-width: N px)` in a stylesheet needs a `/* bp:MOBILE_MAX+1 — src/lib/breakpoints.ts */` (or `MOBILE_MAX`, `TABLET_MIN`, `DESKTOP_MIN`) marker on the line before it, and the file:marker list in `src/styles/breakpoints.test.ts` `EXPECTED` must be updated in the same commit.
- Registry: a new shared component lands in `docs/reference/component-registry.json` and renders in `src/pages/gallery.astro` (`src/gallery.test.ts`); block types with no curated specimen go in the gallery's closed `AWAITING_SPECIMEN` list, never a fabricated specimen.
- Retire as you go (§33): when a board grammar replaces an old composition, delete the old CSS/JS/markup in the same PR. No hidden legacy variants.

---

## 2. The per-PR procedure (identical for every surface)

1. **Branch.** `git fetch origin main && git checkout -B claude/waypoint-design-overhaul-9m1fro origin/main` (same designated branch name, restarted from main; never push anywhere else). If the previous PR on that name is merged, this is the fresh start the repo asks for.
2. **Read**, in order: this file's section for the surface → `docs/reference/design-system.md` (§6, §7, §8, §31 + the surface's own §) → the board PNG/WebP → the source files listed below → the tests listed below. Do not read old handoffs or PR prose for design authority.
3. **Build the surface** to the board grammar with wired features only. Desktop and phone are siblings, not a squeeze. Light and dark both.
4. **Iterate with screenshots**:
   ```
   npm run build && (nohup npm run preview -- --port 4322 >/tmp/preview.log 2>&1 &)
   PW_CHROMIUM=/opt/pw-browsers/chromium node scripts/design/shot.mjs out <surface> m,d light,dark stub
   ```
   `stub` answers Commons/OSM with local stubs when the sandbox has no egress; use `live` when it has. Compare against the board side by side; fix alignment, text, shapes; repeat. "Close if not exactly like the board" is the bar; sloppy is a defect.
5. **Gates, in this order, all green before the PR moves:**
   ```
   npm run check:fast                                   # invariants · eslint · astro check · vitest (incl. breakpoints/type-scale/drift/docs-integrity/gallery)
   npx playwright test tests/visual/a11y.spec.ts        # axe + 44px sweep, light/dark, 9 devices
   npx playwright test tests/visual/resilience.spec.ts tests/visual/offline-sync.spec.ts   # 320px reflow, hostile copy, offline
   npx playwright test tests/visual/design-canary.spec.ts
   npm run build                                        # includes the [integrations] line and the search index
   node scripts/drift-real.mjs                          # real drift must not grow (29 pre-existing on 2026-09-05)
   ```
   Fix root causes. Never widen a baseline, exclusion list, or cap to pass.
6. **Compare sheet.** `node scripts/design/compare.mjs docs/mockups/final-package/mockups/NN_<board>.webp out/NN.png "NN · <Surface> — board vs build" out/<s>-d-light.png "Build · 1440 · light" out/<s>-d-dark.png "Build · 1440 · dark" out/<s>-m-light.png "Build · 390 · light"`, convert to WebP (`sharp`, quality 82), commit as `docs/mockups/compare/NN-<surface>.webp`, add a row to `docs/mockups/compare/README.md`.
7. **Commit + push** with the repo's attribution footer. **Update `docs/reference/design-system.md`** only where a decision was made (record it in the surface's §, never as a new authority file).
8. **PR** to `main`, titled `Surface N · <Name>: <one line> (board NN)`, body = what changed / wired-only list / omitted list / verification line / the compare image (`https://raw.githubusercontent.com/Carlob2499/Trip-Guides/<branch>/docs/mockups/compare/NN-<surface>.webp`), footer.
9. **Baselines on CI:** dispatch `regenerate-gallery-baselines.yml` on the branch (`workflow_dispatch`); wait for the bot commit (`chore(baselines): …`); `git pull --ff-only`.
10. **Gates on the exact head:** dispatch `required-gate.yml` with input `base=main` **and** `design-canary.yml` on the branch; CodeQL runs on push. All green on the bot head → **merge** (merge commit, `expectedHeadSha` = bot head) → confirm `deploy.yml` green → open the live URL and look at the surface once.
11. If a gate is red: read the failed job log, fix the root cause, push, and repeat 9–10 (a changed gallery needs new baselines; a changed strip/surface may not).

Traps met so far, so nobody meets them twice: a 40px control in the strip; the wordmark link at 32px under 400px; a `var` in an `is:inline` script (eslint `no-var`); a raw `font-size: 1.15rem` (use `--text-lead`); new `bp:` markers not recorded in `breakpoints.test.ts`; `:root[data-atlas-mode] .x{display:block}` outranking a mobile `display:flex` (specificity); `position: fixed` FAB losing its `display` when a media block was rewritten; a full-page gallery diff of 1px height on a 36 000px page (baseline needed regenerating after the gallery changed); `box-shadow: var(--shadow-float)` (spaced) counted as drift.

---

## 3. Surface specs

Each spec: **board** · **grammar** (desktop / phone) · **include (wired)** · **omit** · **owners to touch** · **tests to update** · **acceptance**.

### 02 · Trip — `02_trip_page.webp` · Opus 5 · FIRST

The daily-use surface and the canary. This PR also introduces the frame body on guide pages and the phone-bar change.

**Grammar (desktop, ACTIVE phase).** Inside the frame under the strip: three columns.
Left (≈290px): identity card (title, dates, "Day N of M" + progress bar = `paintPhase` pills), **Next stop** card (photo 56px, name, area, time, "View directions" = the first transit link), **Weather now** (the live `data-wx-active` block), **Today's focus** (the day's `title`/`tldr`), **Reservations** (readiness items flagged `book` with a date inside the trip, else omit the card).
Centre: the day's stops as **photo rows** (`.tn-atom--now`, `.tn-atom--next`, then `.tn-rest` rows) — photo 96×72, time kicker, name, note, chevron; footer button "View full itinerary" (`data-dest-go="itinerary"`).
Right: **Today on the map** (`.tn-map`, already `spatial`; give it the frame's rounded pane and the "Open the map →" control); under it a three-cell strip only from data the guide holds (stops count · day distance from `dayPins` straight-line sum if `≥2` located stops · pace from `day.fit`); nothing estimated.
Below the frame (ivory): **Essentials** (the guide's `entry` rows + offline files `trip-dl`), **Split** card (`data-dest-go="split"` with the live summary), **Trip learnings** entry (link to `#learnings`).
PRE and POST phases keep their compositions but inside the frame: PRE = readiness stack lead + tiles; POST = recap atoms + Plan-vs-Actual.

**Grammar (phone).** Strip → identity band (photo scrim stays) → "Day N of M" bar → Next stop card with "View directions" → Weather now → Upcoming today (time · name · duration rows) → Today on the map → Reservations → Essentials → Split → Learnings. Phone bar `Trip · Itinerary · Map · Guide · Split`.

**Include (wired):** everything `trip.js` already paints (Now/Next/leave-by/Get there/rest of day/advisory/plan B/fit), `dayPins` today-map, live weather, readiness, exports, entry rows, Split summary, Learnings section. Photos via `placeImages`.
**Omit:** Trip companions, Message group, Notes & documents, Steps counter, "Est. time" unless from data, T-money/eSIM balances (not wired), Packing reminder card unless `tkPackingCard` has content.

**Owners:** `src/layouts/GuideLayout.astro` (wrap `AppChrome` + `main.content` in `<div class="stage spatial">`; colophon stays outside on cream), `src/components/AppChrome.astro` (phone bar slots on guide pages), `src/styles/chrome.css`, `src/components/TripDestination.astro`, `src/features/trip/ui/trip.js` (`stopAtom`, `paintNow` HTML for the row grammar), `src/styles/trip.css` (rewrite the ACTIVE composition; keep PRE/POST rules), `src/styles/guide.css` (`.content` inside the frame: padding, max-width none).
**Tests:** `tests/visual/resilience.spec.ts` five-id pin → `["trip","itinerary","map","guide","split"]` and `openDestination` for split via the bar; `src/styles/breakpoints.test.ts` if markers move; `design-system.md` §6 mobile list and §24.
**Acceptance:** compare sheet at 1440 light/dark + 390 light in ACTIVE phase (`CLOCK` default) and one PRE capture (`CLOCK=2026-06-20T10:00:00+09:00`); a11y 44px sweep green on korea at all nine devices; the Itinerary/Map/Guide/Split regions still render inside the frame without contrast failures (the `.spatial` remap makes this likely; axe decides).

### 03 · Itinerary — `03_itinerary_page.webp` · Opus 5

**Grammar (desktop).** Frame header row: "Seoul Itinerary" title (the guide title + "Itinerary"), day count + range; right: `Map view | List view` segmented control (wired: the workbench's map pane open/collapsed state), Export (`.ics`/`.gpx` links when present), Share (existing share modal). Day tabs row (`.day-rail` chips as tabs with `Day N` + weekday/date). Workbench: left timeline column (time · numbered stop card with 72×54 photo, name, category line from `kind/cat`, time range if authored, transit leg between stops = `day-leg` rows), centre map pane (`.itin-mappane`, numbered pins), right **stop inspector** (opens on stop select: photo, number, name, category, hours/notes from the item, action buttons = the transit links as "Directions", "View details" → the Guide chapter anchor). Footer strip inside the frame: stops · straight-line km · pace (`fit`) — data only.
**Grammar (phone).** Strip → day tabs → "Friday, Jul 11" head with weather if `data-wx` exists → timeline cards with photos → transit legs → sticky foot strip.
**Include:** every located stop, Plan/Actual toggle (keep), check-off boxes (keep; the board's checked circle IS the check), `data-map-pin-id` focus sync, Google/OSM map.
**Omit:** Optimize day, Add stop, Add note, weather number in the day head unless live weather is mounted for that day, "Re-center" unless the map module exposes it (it does: keep only if wired).
**Owners:** `src/components/ItineraryDestination.astro`, `src/styles/itinerary.css`, `src/features/itinerary/ui/*.js`, `src/components/blocks/DaysBlock.astro` (row grammar), `src/features/maps/ui/gmaps-render.js` (numbered markers if not yet).
**Acceptance:** desktop workbench with a selected stop (`itinerary:select` capture), phone day stack, 320 reflow.

### 04 · Map — `04_map_experience.webp` · Opus 5

**Grammar (desktop).** Frame: the map fills the stage; floating **Map panel** top-left (title, one line, quick actions = Search places (opens Search), Plan a route → Itinerary, Map layers → only the lenses that exist: All · Days · Today · Chapter), the **selected-place card** under it (photo, category chip, name, area, one line, "View details" → Guide anchor, "Add to itinerary" **omitted**); top filter chips = the categories the pins carry (`cat` values present in `allPins`), never invented ones; right **inspector** on select (`.mapdest-peek` → a card with photo, name, area, hours/price rows only from data, "Directions" = transit links); bottom-centre control bar = only wired controls (recentre/fit if exposed). Below the frame (ivory): **Explore neighbourhoods** = the map's `mapdest-group` list re-homed as cards with counts; **Transit legend** only if the map draws transit lines (it does not → omit); **Saved places** omit.
**Grammar (phone).** Strip → map hero with pins → bottom sheet on select (photo right, name, area, Directions) → bar.
**Owners:** `src/components/MapDestination.astro`, `src/styles/map.css`, `src/features/maps/ui/*.js`.
**Acceptance:** `map` and `map:select` captures both widths; degraded state (no key) still honest (`.map-degraded`).

### 05 · Guide — `05_guide_experience.webp` · Opus 5

**Grammar (desktop).** Frame: **hero** (cover photo full-width inside the frame, `SOUTH KOREA` kicker, display title = guide title, dek, the Search pill over the photo's foot, a weather chip only when live weather exists); **Explore by topic** = the chapter cards as photo tiles (chapter's first item image, icon, title, one line) in a 6-up row; below the frame (ivory): **Recommended** omit (neither curated guide carries a highlights chapter; korea's chapters are plan, essentials, getting around, itinerary, sights, Daejeon & MSI, gaming & anime, food & shopping, Pokémon GO, Tokyo, references), **Need to know** = the guide's facts (currency, language, best time, power, safety) only where `facts.json` carries them with verification, **Seasons** omit unless authored, **Explore the map** card → Map destination.
**Grammar (phone).** Strip → hero with kicker/title/dek → weather chip if live → "Explore by topic" tiles 2-up → bar. Chapter view keeps the current reading composition inside the frame.
**Owners:** `src/components/GuideDestination.astro`, `src/styles/guide-dest.css`, `src/styles/overview.css`, `src/components/blocks/*` (only presentation), `src/lib/guide-view.ts` (image lookup already exists).
**Acceptance:** `guide` + `guide:chapter` captures; provenance dots still open (`prov` capture); chapter reading at 320.

### 06 · Search — `06_search_experience.webp` · Sonnet 5

**Grammar (desktop overlay).** Left rail: "Search" title, one line, **All results** + category list = the drawers that exist (`DRAWERS` in `search.js`: places, days, transit, …) with counts; centre: field + chip row (same categories) + grouped results with 96×72 thumbnails (`.srch-thumb`), name, kicker line, one snippet; right: **detail pane** (`.srch-detail-*`: photo, name, kicker, snippet, "Open" CTA → the record's anchor). Phone: field + chips + grouped rows, detail becomes the row tap.
**Omit:** ratings, distances, "Add to itinerary", bookmarks, "People", "Anytime"/"South Korea" scope dropdowns (single-guide index).
**Owners:** `src/features/search/ui/search.js`, `src/features/search/styles.css`, `src/features/search/model/search-index.ts` (no schema change needed).
**Acceptance:** `search` capture both widths; focus trap and Escape still pass a11y.

### 07 · Guide Builder + Progress — `07_guide_builder.webp` · Opus 5

**Grammar (desktop).** `/new/`: frame with a left step list (the deck's sections as numbered steps with done ticks), centre = the question deck card (one question, its choices as photo/icon tiles where the intake offers enumerated options, free text where it does not), "Back"/"Next", a right **Your guide preview** panel that reflects the answers given so far (destination, dates, pace) — text only, nothing predicted. Below the frame: **Your answers** (the running summary), **Build with confidence** = the real promises only (facts verified, unknowns left blank, progress page). `/progress/`: same frame; the route map skeleton and stage stations stay; states come only from durable V2 run events; honest-empty preserved; the correction/notify cards become frame panels.
**Omit:** "Guide recommendations" cards, BETA tag, avatar, notifications, any duration promise not backed by the backend (U02 decision).
**Owners:** `src/pages/new.astro` (+ its styles), `src/pages/progress/index.astro`, `src/pages/progress/triage.astro`, `src/styles/progress.css`, `src/components/UtilityBar.astro` → replace with `AppChrome mode="atlas"`-style strip or extend `UtilityBar` to render inside `.stage.spatial` (prefer one shell: give `UtilityBar` the brand + right group and drop its plain strip).
**Tests:** `tests/visual/a11y.spec.ts` TARGET_PAGES includes `/progress/`; `src/features/pipeline-progress/*.test.ts` unchanged (presentation only).
**Acceptance:** `new` and `progress` captures; progress with `?slug=korea` (finished) and with an unknown slug (empty state).

### 08 · Split — `08_split_expenses.webp` · Sonnet 5

**Grammar (desktop).** Frame: header row (title "Split expenses", one line, **Add expense** primary, **Settle up** secondary = the existing settlement view); three summary cards: trip identity (cover, title, dates, cities, "View itinerary"), **Total trip spend** (base currency total + "paid by you"/"you owe" from the ledger), **Balances** (members with signed amounts); tabs `All expenses | My expenses` only if "me" is a wired concept (it is not → single list); expense table (date, description + note, category chip, paid by, total, split method, my share **omitted**). Below the frame (ivory): **Expense summary** donut by category (only if a chart already exists; otherwise a category list with amounts — no new chart library), **Recent activity** = the ledger's own order, **Settle-up suggestions** = the existing settlement output.
**Phone:** strip → total + balances → expense list → sticky Add expense; the add form as the existing sheet.
**Omit:** Export, Filters, Invite, avatars, USD conversion unless the ledger carries a rate (it does: show base + rate date).
**Owners:** `src/components/SplitDestination.astro`, `src/components/TripSplit.astro`, `src/styles/trip-split.css`, `src/features/trip-split/ui/*.js`.
**Acceptance:** `SEED_SPLIT=1` captures (seeded ledger) and an empty-state capture; offline-sync spec green.

### 09 · SOS — `09_sos_safety.webp` · Sonnet 5

**Grammar.** The SOS modal (desktop centred, phone sheet) gets the board's forest register and structure: kicker "In an emergency, call or tap", the big round SOS press (existing `sos-call--confirm` two-step), **country emergency numbers** as rows (number, label, chevron → tel:), **advisory** card when level ≥ 2, **category chips** (existing `sos-cats`), **Share live location** and **I'm safe** only if wired (they are not → omit), **Health** rows = the guide's health & safety chapter items with tel/URL, **Embassy** = only when the guide carries an embassy fact. Below-frame cards do not apply (modal).
**Owners:** `src/features/sos/ui/sos.js`, `src/styles/field-tools.css`.
**Acceptance:** `sos` capture both widths, focus trap, 44px on every row.

### 10 · Trip Learnings — `10_trip_learnings.webp` · Sonnet 5

**Grammar.** Inside the Trip destination's `#learnings` section: header (title, one line), **counts strip** only from data (days travelled, stops made, skipped — `recap` atoms), **Saved lessons** two columns "Do again / Do differently" only if the learnings model distinguishes them (else one list of `keyLearnings`), **Actually did / Skipped** from Plan-vs-Actual (`recap.changedDays`), **Notes** = the feedback survey's aggregated answers (`learn-agg`) when Firebase has records, else the honest empty line. Photos on rows via `placeImages`.
**Omit:** "Export learnings", "Would you return?", route snapshot map, food highlights unless authored, counts the model does not compute.
**Owners:** `src/components/Learnings.astro`, `src/features/learnings/styles.css`, `src/features/learnings/ui/survey.js`, the `.learn-*` rules in `src/styles/base.css`.
**Acceptance:** POST-phase capture (`CLOCK=2026-08-20T10:00:00+09:00`) both widths.

---

## 4. After the ten surfaces — DONE (#208, Opus 5)

- ~~Regenerate the OG and recap images in the forest register; they are the last hex literals
  `drift-real` reports.~~ Done: both cards read the register from `lib/accent-tokens.ts` and hold
  no palette of their own; accent text takes `inkDark`. Real drift 29 → 17.
- ~~Colophon and utility pages (`/about`, `/health`, `/404`) onto the frame strip via
  `UtilityBar`.~~ Done, plus `/change`: all four wrap in `.stage.spatial`.
- ~~Owner's closing report.~~ `surface-transplant-closeout.md`.

## 5. Owner-side prerequisites (not engineering)

- Repository secrets `PUBLIC_GMAPS_KEY` + `PUBLIC_GMAPS_MAP_ID` (see `docs/reference/integrations.md`) — Map/Itinerary cannot reach their boards on the embed fallback.
- Environment egress for `upload.wikimedia.org`, `*.openstreetmap.org`, `*.googleapis.com`, `*.github.io` so screenshots show real covers and tiles and the live deploy can be inspected.
- Visual acceptance per compare sheet (one line each).
