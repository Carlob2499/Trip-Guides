# Project State — Waypoint Travel Guides
**Last updated:** 28 Jun 2026  
**Repo:** github.com/Carlob2499/Trip-Guides  
**Live site:** carlob2499.github.io/Trip-Guides/  
**Primary working directory:** C:\Users\carlo\OneDrive\Documents\GitHub  

> **Instructions for Claude chat (non-desktop):** Upload this file at the start of any session to restore full project context. Ask Claude Code to update it at the end of every session before you close.

---

## 1. What This Project Is

A static **Astro** website of curated, fact-checked personal travel guides. The owner (Carlo) is not a programmer — the workflow is designed to be simple: edit JSON content files, push to GitHub, the site rebuilds automatically.

**Stack:**
- **Framework:** Astro (static site generator)
- **Content:** JSON files in `src/content/guides/` — one file per destination, one page at `/guides/<filename>/`
- **Styling:** Custom CSS in `src/styles/guide.css` and `src/styles/hub.css`
- **Hosting:** GitHub Pages at `carlob2499.github.io/Trip-Guides/` (migrated from Netlify in Jun 2026)
- **CI/CD:** GitHub Actions — `.github/workflows/deploy.yml` builds on every push to `main`
- **PWA:** Installable to phone home screen, works offline. Service worker at `public/sw.js`
- **Schema validation:** Zod via `src/content.config.ts` — build fails on schema violations

**Key architectural rule:** Styling/layout/components are shared across ALL guides. Only the JSON data files are per-country. A change to any component affects every guide simultaneously.

---

## 2. File Structure

```
src/
  content/
    guides/
      denmark.json       — 37 sections, gold standard, fully verified Jun 2026
      korea.json         — 56 sections, trip Jul 8–15 2026, verified 28 Jun 2026
      germany.json       — 20 sections, verified Jun 2026 (light)
      portugal.json      — 19 sections, verified Jun 2026 (light)
      japan.json         — 45 sections, ⚠ DRAFT — simulated itinerary, not verified
    content.config.ts    — Zod schema. ALL section types defined here. If build fails on content, check here first.
  components/
    Block.astro          — router: maps section type → block component
    PwaHead.astro        — shared <head> tags, service worker registration
    TripSplit.astro      — trip cost splitting calculator (interactive)
    blocks/
      PanelBlock.astro   — reference card with optional checklist
      ProseBlock.astro   — plain text card (body allows: <p><b><i><a><ul><li><ol> ONLY)
      ListBlock.astro    — checklist (localStorage persistence)
      RoutesBlock.astro  — numbered step-by-step directions
      MapBlock.astro     — lat/lng → embedded OpenStreetMap
      BudgetBlock.astro  — interactive cost calculator with editable "your spend" fields
      DaysBlock.astro    — day-by-day itinerary cards
      SightsBlock.astro  — photo card grid (images from Wikimedia Commons)
      RaidBlock.astro    — Pokémon GO raid boss counter tables (added Jun 2026)
  layouts/
    GuideLayout.astro    — page frame, sticky topbar, section tab bar, sidebar/mobile sheet nav, all client scripts
  lib/
    themes.ts            — country → accent colour AND DEST_TZ (timezone offset) AND CURRENCIES. Single source for all three. Add new countries here.
    buckets.ts           — groups sections into nav categories
    exports.ts           — build-time export helpers (pure): collectWaypoints, collectDayEvents, buildGpx, buildIcs, buildSummary. Used by the export endpoints + GuideLayout's Share modal.
  pages/
    index.astro          — home page, auto-lists all guides
    guides/[slug].astro  — dynamic route, one page per guide JSON
    guides/[slug].gpx.ts — build-time GPX export endpoint (map + sights coords) → dist/guides/<slug>.gpx
    guides/[slug].ics.ts — build-time iCal export endpoint (all-day day cards) → dist/guides/<slug>.ics
    og/[slug].png.ts     — build-time OG image endpoint (existing; the pattern the export endpoints follow)
  styles/
    guide.css            — all guide page styling
    hub.css              — home page styling
public/
  sw.js                  — service worker (CACHE = "tripguides-v3", BASE = "/Trip-Guides")
  manifest.webmanifest   — PWA manifest (start_url and scope both include /Trip-Guides/)
  icons/                 — PWA icons (source: favicon.svg)
.github/
  workflows/
    deploy.yml           — GitHub Actions: Node 22, npm ci, npm run build, deploy to gh-pages
astro.config.mjs         — site: https://carlob2499.github.io, base: /Trip-Guides
```

---

## 3. All Changes Made (Chronological)

### Phase 1 — Initial Korea guide build (multiple sessions before Jun 2026)
- Created `korea.json` from scratch with Seoul/Daejeon trip structure
- Added Air Premia airline confirmation (replaced Asiana hedging)
- Added Melody House Airbnb anchor in Hongdae as lodging reference
- Added MSI Finals 2026 at Daejeon Convention Center II (Jul 12)
- Added GO Fest Global 2026 sections (Jul 11–12, confirmed 10:00–19:00 KST)
- Added Road of Legends counter tables, raid boss data
- Added nightlife, eSIM, breakfast, late-night food, shopping sections
- Added booking checklist with confirmed vs unconfirmed items
- Multiple accuracy passes: food venue verification, sights, tickets, internal contradictions

### Phase 2 — UI/UX overhaul (Jun 2026)
- **Brand overhaul:** Fraunces typography, "Waypoint" identity, OG images, masthead stat bar
- **Stable checklist keys:** checkboxes use deterministic keys (section index + item index) stored in localStorage
- **Scroll memory:** returns to last position on revisit
- **Deep links:** every section has a shareable anchor URL
- **Swipe navigation:** mobile left/right swipe between sections
- **Budget subtotals:** per-day and one-off cost categories show running totals
- **Jump-to-today:** day cards highlight the current calendar date automatically; fixed a non-breaking space (U+00A0) bug in the date matching logic
- **Day completion badges:** "Day kit N/M" shows how many checklist items are ticked per day
- **Copy-address button:** venue entries get a "주소 복사" button that copies the Korean address to clipboard; `lang="ko"` added for accessibility
- **Section tab bar:** horizontal scrollable tab navigation at top of guide; keyboard accessible (ArrowLeft/Right/Home/End with roving tabindex)
- **Trip Split calculator:** interactive tool for splitting trip costs among group members; fixed currency symbol bug (was hardcoded `$`, now uses local currency symbol); fixed custom-split reset bug (custom amounts no longer wiped when editing the total)
- **Scroll padding fix:** `scroll-padding-top` corrected from 72px to 94px to match actual sticky chrome height
- **Phone links (`tel:`)**, CTA buttons, app deep links added

### Phase 3 — Korea guide P0/P1/P2 content (Jun 2026)
- **KRW exchange rate:** reconciled from 1380 to 1535 (verified via Google Finance Jun 2026) across both code (`themes.ts`) and budget section prose
- **DEST_TZ consolidated:** removed inline timezone offset definitions from `GuideLayout.astro`; all timezone data now lives in `src/lib/themes.ts` as `DEST_TZ` export
- **lang="ko"** added to Korean-language copy-address button text
- **GO Fest prose refactor:** converted dense paragraph/`<br/>` blocks in Days 3–4 and "what to know" section into proper `<ul><li>` bullet lists
- **New: "Info to confirm" checklist:** 12-item localStorage-persistent list (7 confirmed ✔, 5 pending with source links) added as a section
- **New: "Caught tracker" checklist:** 22-item priority target list for GO Fest (Mega Mewtwo X/Y, Xurkitree, etc.) stored in localStorage
- **Itinerary additions:**
  - Day 2 (Jul 10): LoL Park visit at ~15:30, T1 Basecamp post-dinner
  - Day 5 (Jul 13): HYBE Insight (requires advance Weverse booking, ≈₩22,000; Hangangjin Line 6)
  - Day 6 (Jul 14): Apgujeong streetwear strip (Stüssý/Gentle Monster/Ader Error, Line 3 from Anguk) + Olive Young options + T1 Basecamp Hongdae send-off
  - Day 7 (Jul 15): Rewritten as checkout/airport day; duty-free Olive Young at ICN noted
- **Daejeon correction:** removed wrong "last KTX on Sunday night" warning (group stays 2 nights, Jul 11 and 12); replaced with correct Monday morning return note
- **Booking checklist:** HYBE Insight pre-booking item added
- **HYBE Insight** added to Day 5 with full transit, cost, and booking instructions

### Phase 4 — Denmark guide accuracy pass (Jun 2026)
- Ferry operator corrected: **DFDS → Go Nordic Cruiseline** (transferred Nov 2024)
- DOT City Pass durations corrected: 72h option does not exist; actual: 24h/48h/96h/120h
- Folkehuset Absalon dinner: ≈40 DKK → actual 75–100 DKK
- Copenhagen Card prices corrected: 599/849/999 → 589/859/1,039 DKK
- Tivoli Gardens entry price corrected: ≈150 DKK (was 135)
- Grundtvig's Church closing time added: 15:45 (not just "closed Mondays")
- References section added with all primary source URLs
- Split-group (solo traveller) itinerary documented throughout
- Day titles rewritten: magazine-quality titles instead of bare lists
- Day theme summaries (1–2 sentence italic openers) added to all day entries
- Raid counter tables migrated from hand-authored HTML string in `prose` body → typed `raids` section type
- Added AYCE Korean BBQ (KOBA, Seoul Nordhavn), Filipino restaurants (Jabby's, Manila at Reffen) to Copenhagen food section with 4-question logistics

### Phase 5 — GitHub Pages migration (Jun 2026)
- **`astro.config.mjs`:** added `site: 'https://carlob2499.github.io'` and `base: '/Trip-Guides'`
- **`PwaHead.astro`:** rewrote to derive all paths from `import.meta.env.BASE_URL` (manifest, icons, service worker registration URL)
- **`public/sw.js`:** added `const BASE = "/Trip-Guides"`, prefixed all CORE cache paths, bumped CACHE to `tripguides-v3`
- **`public/manifest.webmanifest`:** updated `start_url`, `scope`, and all icon `src` values to include `/Trip-Guides/`
- **`.github/workflows/deploy.yml`:** created from scratch (Node 22, npm ci, npm run build, upload-pages-artifact, deploy-pages)
- **Bug fix — Node.js version:** initial workflow used Node 20; Astro requires >=22.12.0; bumped to 22
- **Bug fix — 404 on all country links:** `index.astro` and `GuideLayout.astro` used root-absolute hrefs (`/guides/...`, `/`) without the base prefix. Astro does NOT auto-rewrite template-literal hrefs. Fixed by adding `const base = import.meta.env.BASE_URL.replace(/\/$/, "")` to both files and prefixing all nav hrefs. Verified in `dist/` output before push.

### Phase 6 — CLAUDE.md rule expansion (Jun 2026)
Added rules 8–15 to the pre-commit checklist:
- Verify built `dist/` output, not just source
- Push correct and complete on first pass
- Never construct a URL from inference; give navigation steps instead
- Zero grep results ≠ proof of absence; verify the grep itself
- When Edit tool fails on unicode/special chars, switch to Node.js script immediately
- After any workflow change, confirm a green Actions run before closing
- On base path changes, audit ALL internal hrefs before first push
- Prose body beyond simple inline tags = signal to add a section type

### Phase 7 — UI/UX feature pass (Jun 2026)
Researched leading travel apps (Wanderlog, TripIt, Google Travel, Polarsteps) and added 7 features:
- **Reading progress bar:** 3px accent line fixed at top, fills on scroll (Medium/Substack pattern)
- **Trip countdown pill:** stats bar shows "N days to go / Today! / Happening now! / N days ago" (parsed from first days-section date)
- **Local time at destination:** live clock pill in stats bar, updates every 60s, uses `DEST_TZ`
- **Offline-ready badge:** green pill shown when the guide is in the SW cache
- **Live currency rate:** Frankfurter API (no key, ECB data) → "$1 = N KRW" pill in stats bar
- **Weather strip:** Open-Meteo (no key) forecast using the guide's map lat/lng
- **Map fullscreen button:** ⤢ overlay on every embedded OSM iframe
- **Home page hub cards:** trip countdown badge + itinerary day count, computed at build time

### Phase 8 — Self-audit & fixes (Jun 2026)
Comprehensive review of the Phase 5–7 work; fixed in the same session:
- **Weather window bug (accuracy):** was `forecast_days=7` (next 7 days from *today*), which for the Korea trip showed Jun 28–Jul 4 — dates that don't overlap the trip. Now fetches the 16-day max and slices to the **trip dates** when in range; labels honestly ("Trip-dates forecast" vs "Next N days") and warns when the trip is still beyond the 16-day horizon.
- **Color emoji in weather (rule + design):** replaced 🌧⛈ etc. with monochrome text-presentation symbols (`☀︎ ⛅︎ ☁︎ ☂︎ ❄︎ ☈`) to honor the no-emoji rule and the editorial monochrome design.
- **Currency rounding bug:** `Math.round(rate)` turned EUR 0.93 into a useless "1" and lost DKK precision. Now magnitude-aware: KRW/JPY whole, DKK 2dp, EUR 3dp. Fixes Germany/Portugal/Denmark.
- **Offline badge cache coupling:** hardcoded `caches.has("tripguides-v3")` would silently break on the next SW version bump. Now matches any `tripguides-*` key via `caches.keys()`.
- **Map fullscreen mismatch:** JS called `wrap.requestFullscreen()` but the CSS targeted `.osmmap:fullscreen`, so the iframe stayed 300px. Now requests fullscreen on the iframe itself + added `allowfullscreen` to the iframe.
- **Stale git worktree lock removed:** the recurring `Permission denied: .git/worktrees/agent-...` error on every git command is gone (pruned + directory deleted).
- **CLAUDE.md:** updated "hosted on Netlify" → GitHub Pages; documented the base-path constraint and the client-side API integration contract (no keys, always `.catch`, format per currency, monochrome UI icons).

---

## 4. Current Known Bugs / Issues

### Resolved in the Phase 8 self-audit (Jun 2026)
- ~~Stale git worktree lock erroring on every git command~~ — **fixed** (pruned + deleted).
- ~~CLAUDE.md said "hosted on Netlify"~~ — **fixed** (now GitHub Pages).
- ~~Weather strip showed next-7-days-from-today, not trip dates~~ — **fixed** (16-day fetch, sliced to trip).
- ~~Color emoji in weather strip~~ — **fixed** (monochrome text symbols).
- ~~Currency rate `Math.round` broke EUR/DKK~~ — **fixed** (magnitude-aware).
- ~~Offline badge hardcoded the SW cache version~~ — **fixed** (prefix match).
- ~~Map fullscreen left iframe at 300px~~ — **fixed** (fullscreen the iframe).

### Open — latent, lower priority
- **Denmark map coordinate (likely error):** in `denmark.json`, `Kastellet` (55.6909, 12.5945) and `CopenHill / Amager Bakke` (55.6916, 12.5970) sit only ~175 m apart, but they are not adjacent landmarks in reality — at least one coordinate is probably wrong. Surfaced by the GPX export (Session 4), which stacks the two pins. Verify against a primary source before correcting; not changed here (no invented coordinate).
- **DST-incorrect timezones:** `DEST_TZ` and the live-time/jet-lag features use FIXED UTC offsets (e.g. Denmark: 2 = summer time). Correct for the summer trips in scope, but European guides would be 1 hour off in winter. Proper fix: map country → IANA zone (e.g. "Asia/Seoul") and use `Intl.DateTimeFormat`, which handles DST automatically. Affects the local-time pill and jet-lag calc.
- **Live FX rate vs hardcoded budget rate:** the live pill (Frankfurter) and the hardcoded `approxRate` in `themes.ts` / budget prose can drift apart, showing two different KRW rates on one page. Consider feeding the live rate into the budget calculator, or labeling the hardcoded one "approx" more prominently.
- **Pre-existing color emoji in Korea content JSON** (🌿🎮🏠🏟🔼): present in the guide content from earlier work, not the weather code. Left in place because they may be intentional section icons — confirm with owner before removing (the no-emoji rule targets new additions).
- **Date-parse duplication:** the "Wed Jul 8" → Date logic exists in both `index.astro` (build) and `GuideLayout.astro` (client countdown/weather). Minor DRY; could move to a shared helper.

### Content gaps (not bugs, but tracked)
- **Japan guide:** marked `⚠ Draft` — 45 sections but they are simulated/unverified proposals. Needs the same accuracy treatment as Denmark/Korea before any real trip.
- **Germany and Portugal:** 19–20 sections each, verified at a surface level Jun 2026, but missing: detailed "Where to eat" with 4-question logistics, References section, budget calculator per-trip estimates. Both need a full backbone audit before use.
- **Korea References section:** exists but some URLs are Naver search result URLs, not primary sources. Needs primary-source replacement pass.
- **Korea "Where to eat":** food section needs cleaner visual hierarchy (possible dedicated section type or at minimum bold restaurant-name anchors)
- **Korea specific PC bang recommendation:** currently says "they're everywhere near Hongdae" — a specific named recommendation with address is missing
- **Korea pre-flight countdown body:** reads as a status log; should be reframed as actionable instructions
- **Korea datelines:** "Road of Legends" and GO Fest raids sections missing "verified: Jun 2026" stamps
- **Korea Etiquette & Language:** oldest-person-pays dining custom not documented

---

## 5. Architecture Decisions & Constraints

### Why JSON for content (not MDX or a CMS)
Zod schema validation catches structural errors at build time. A missing required field or a wrong type fails the build before anything ships. MDX would be more flexible but gives up all validation. The owner is non-technical — the schema is the guardrail.

### Why `raids` is a section type, not inline HTML
The initial Pokémon raid counter tables were a ~4,000-character HTML string in a `prose` body field. One wrong bracket broke the display. When the raid roster changed, editing raw HTML was error-prone and the schema gave no help. The fix: added `type: "raids"` to `content.config.ts`, created `RaidBlock.astro`, migrated data to typed JSON. Rule going forward: if a `prose` body needs `<details>`, `<table>`, or deeply nested structure, add a section type instead.

### Why `DEST_TZ` and `CURRENCIES` live in `themes.ts`
Originally defined inline in `GuideLayout.astro`. Consolidated to `themes.ts` so adding a new country requires editing exactly one file. `themes.ts` is now the single source for: accent colour, destination timezone offset, and currency information.

### Why exports (GPX/iCal) are build-time endpoints, not a pre-build script
The holiday data uses a pre-build script (`fetch-holidays.mjs`) only because it
fetches from an external API. GPX/iCal derive purely from committed guide JSON, so
they are Astro static endpoints (`pages/guides/[slug].gpx.ts` / `.ics.ts`, mirroring
`og/[slug].png.ts`) — no script, no `deploy.yml` change. `getStaticPaths` is filtered
so a guide without map/day data emits no file (and the Share modal hides that link).
iCal events are all-day because the `days` schema stores a date string, not times —
honest, not invented. Guides with relative "Day N" labels (germany, portugal) get no
`.ics` by design.

### PDF / print
There is no build-time PDF renderer. "Save as PDF" was the browser's own
`window.print()` dialog; the visible **PDF button was removed** (owner request,
Session 4). The print stylesheet remains, so Ctrl+P / the mobile share-sheet print
still produces the clean print layout. A true build-time PDF would need a headless
renderer (e.g. Playwright driving the print CSS) added to CI — not built.

### Why base-path hrefs must be explicit
Astro auto-rewrites `<img src="...">` and asset references when `base` is set, but does NOT rewrite `href` attributes written as string literals or template literals in `.astro` files. Every navigational href that starts with `/` must be prefixed with `import.meta.env.BASE_URL` (or a `base` variable derived from it). This was learned the hard way when all country links 404'd after the GitHub Pages migration.

### Why Astro's Edit tool fails on unicode
The Edit tool matches `old_string` against the raw file bytes. Em dashes (U+2014), non-breaking spaces (U+00A0), and curly quotes look identical in chat but are different bytes. When an Edit fails once on a line with these characters, the correct fix is to write a Node.js script to the scratchpad directory and run it with `node`, not to retry the Edit.

### GitHub Pages vs Netlify
Migrated to GitHub Pages Jun 2026. Astro config requires `base: '/Trip-Guides'` and `site: 'https://carlob2499.github.io'`. The GitHub Actions workflow (`deploy.yml`) handles build + deploy. To change the base path in future (e.g. custom domain), update `astro.config.mjs` only — all hrefs derive from `import.meta.env.BASE_URL`.

### PWA / offline
Service worker (`public/sw.js`) is network-first for HTML (fresh content when online, cached when offline) and cache-first for assets. Maps are NOT cached — they load inside a cross-origin OpenStreetMap frame the service worker cannot reach. Text "Key transit routes" sections cover the offline case. Cache key is `tripguides-v3`; bump to v4 on the next major release.

---

## 6. Next Steps / Roadmap

### Immediate (before Korea trip, Jul 8 2026)
- [ ] Re-verify GO Fest Global 2026 raid roster and spawns as the event approaches (leekduck.com, official Pokémon GO blog) — boss lineup may change or be announced closer to the date
- [ ] Confirm KTX seat reservations (letskorail.com) and Asiana/Air Premia flight details
- [ ] Book HYBE Insight tickets via Weverse before they sell out
- [ ] Book MSI Finals viewing (tickets confirmed, but logistics to DCC II need rehearsal)
- [ ] Update Korea "Info to confirm" checklist as pending items are resolved
- [ ] Korea References: replace Naver-search URLs with direct primary sources
- [ ] Korea: add specific PC bang recommendation near Hongdae with address

### Medium term
- [ ] **Live currency rates:** integrate Frankfurter API (free, no key, CORS-safe) to replace hardcoded ₩1,535 rate in Budget section. ~10 lines of client-side JS
- [ ] **Weather widget:** integrate Open-Meteo API (free, no key, CORS-safe) for 14-day forecast strip on trip dates. Uses lat/lng already in the guide JSON's `map` sections
- [ ] **Jet lag calculator:** self-contained Astro component (no external API needed). Inputs: home timezone, destination timezone, flight duration. Output: day-by-day sleep shift recommendation
- [ ] **Fix CLAUDE.md:** update "hosted on Netlify" to "hosted on GitHub Pages" in the "What this project is" section
- [ ] **Germany and Portugal backbone audit:** add Where-to-eat with 4-question logistics, References section, verified budget estimates for each
- [ ] **Korea visual hierarchy in food section:** either add a dedicated restaurant section type, or add bold name anchors at minimum

### Long term / parked
- [ ] **Japan guide:** full verification pass and upgrade to backbone standard (needs dedicated research session with web search for every hotel, attraction, transit price, and event)
- [ ] **Document hub (Wanderlog-style):** per-trip resource hub to upload reservation emails, train tickets, hotel confirmations — accessible inside the guide on mobile. Needs privacy/storage design first. Do not bolt on hastily
- [ ] **Visa API integration:** Travel Buddy on RapidAPI (120 free calls/month, client-side safe) — could power a dynamic visa requirements widget keyed to passport country
- [ ] ~~**Amadeus flight search**~~ — removed; Amadeus self-service portal decommissions 17 Jul 2026 (see §9). If flight search is still wanted, evaluate an alternative provider (e.g. Duffel, Kiwi/Tequila) — all require a serverless function to hold the secret
- [ ] **Ticketmaster events widget:** free API, 5,000 calls/day, good Europe coverage — could show events happening during the trip dates automatically. Weak Japan/Korea coverage

---

## 7. How To Work With This Project

### Workflow for any content change
1. Read the target `.json` file first (never regenerate from memory)
2. Make targeted edits
3. Run `npm run build` — must pass with zero schema errors
4. Grep `dist/` to confirm changed paths appear correctly in compiled HTML
5. Commit with a descriptive message
6. Push to `main` — GitHub Actions deploys automatically (~2 min)
7. Check the Actions tab to confirm a green run

### Adding a new country
1. Copy `src/content/guides/denmark.json` as the template
2. Rename (e.g. `portugal.json`) — filename becomes the URL path
3. Add the country's accent colour (and DEST_TZ, currency) in `src/lib/themes.ts`
4. Research and verify every fact before writing (rule: source first, write second)
5. `npm run build`, confirm the new page builds and section count looks right
6. Commit and push

### Adding a new section type
1. Create the block component in `src/components/blocks/NewBlock.astro`
2. Wire it up in `src/components/Block.astro` (add the type → component mapping)
3. Add the Zod schema definition in `src/content.config.ts`
4. Use the new type in a guide JSON file to test
5. Run `npm run build` to confirm schema validation passes

### JSON file encoding (critical)
Write JSON files as UTF-8 without BOM. If using PowerShell:
```powershell
$enc = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($path, $content, $enc)
# Verify first byte is 0x7B:
$bytes = [System.IO.File]::ReadAllBytes($path)
if ($bytes[0] -ne 0x7B) { Write-Error "BOM detected or wrong encoding" }
```
A BOM (bytes EF BB BF) causes an immediate build failure with `Unexpected token ''`.

### When editing files with special characters
If the Edit tool fails to match a string that contains em dashes (—), non-breaking spaces, or curly quotes, do not retry the Edit tool. Write a Node.js script to the scratchpad at:
`C:\Users\carlo\AppData\Local\Temp\claude\...\scratchpad\`
and run it with `node <path>`.

---

## 8. Content Standards Reference

### Every restaurant entry must answer 4 questions
1. **Where?** Exact address (Korean + romanised)
2. **How do I get there from the hotel?** Transit route + approximate time
3. **When in the trip does it fit?** Best day, and why (proximity to other plans)
4. **Do I need to book?** Walk-in / reserve online / call ahead

### Price flags
- `≈` means: I found the official source and the figure is approximately this — verify before paying
- `⚠` means: hours or details could not be confirmed online — check before going
- A missing price is honest. A guessed price with a `≈` is not.

### Photo validation
Every `img.file` value in a `sights` section must be an exact Wikimedia Commons `File:` page filename. Confirm the `File:` page exists before adding. If unsure, omit — do not guess.

### The `prose` body tag allowlist
`<p>` `<b>` `<i>` `<a>` `<ul>` `<li>` `<ol>` — that is the complete allowed set. Any other HTML in a prose body (`<details>`, `<table>`, `<figure>`, `<br/>` used as a layout tool) is a signal to add a typed section instead.

---

## 9. API Integrations — Status

| Category | API | Free Tier | Client-Side Safe | Status |
|---|---|---|---|---|
| Currency (live) | Frankfurter (api.frankfurter.dev) | No quota, no key needed | Yes | **BUILT** — live FX pill in stats bar |
| Weather | Open-Meteo (api.open-meteo.com) | 10,000/day, no key | Yes | **BUILT** — 7-day strip sliced to trip dates |
| Jet lag calc | In-house (fixed UTC offsets) | N/A | Yes | **BUILT** — collapsible panel in masthead (see DST caveat in §4) |
| Visa requirements | Travel Buddy via RapidAPI | 120 calls/month | Yes (expose key only) | Research done |
| Events | Ticketmaster Discovery | 5,000 calls/day | Yes (expose key only) | Research done; weak Asia coverage |
| Transit | Google Maps Routes API | 10,000/month | Yes (restrict key by referrer) | Research done; no Japan transit |

> **Amadeus self-service API removed (Phase 0, Jun 2026):** Amadeus announced (Feb 2026) it is decommissioning its self-service developer portal on **17 Jul 2026** — API keys deactivate and the portal closes; only the enterprise AQC API survives. Verified via [PhocusWire](https://www.phocuswire.com/amadeus-shut-down-self-service-apis-portal-developers). The former Flights/Hotels rows were dropped. (Note: as of this writing the date is still ~weeks away, not yet past — but the closure is confirmed and the free tier is going away, so it's off the table.)

**Built-integration contract** (follow when adding more): no API keys in client code; always `.catch()` + feature-detect so a dead API never breaks the page; format output for the actual currency/locale; keep UI icons monochrome.

**Not accessible to hobbyists:** Google Flights, Skyscanner, Expedia, Booking.com — all require commercial partnership approval or have no public API.

---

*Update this file at the end of every Claude Code session. Upload to Claude.ai chat at the start of any session where you are working from a device without access to the desktop Claude Code installation.*
