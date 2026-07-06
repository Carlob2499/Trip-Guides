# Waypoint Evolution Roadmap & Session Tracker

**Purpose:** Keeps the site-evolution work on track across sessions spaced
days or weeks apart. Claude Code: read this at the start of every session
to know where we left off. Check items off as they ship. Update the
"Session Log" at the bottom before ending each session.

**How to use:** each roadmap item is one shippable unit. The working rules
(the ship loop, plan-first, graceful external-API failure, verify-in-dist) now
live in the auto-loaded `CLAUDE.md` — not duplicated here. Only open this file
when you need the roadmap backlog itself; it is not required session reading.

---

## Phase 0 — Housekeeping
*Status: ✅ Complete (29 Jun 2026)*

Safe cleanup. Zero risk. Gets the workflow warmed up.

- [x] Remove dead Amadeus rows from Project_State.md integrations table
- [x] Fix any "Netlify" → "GitHub Pages" stale text (search all files)
- [x] Fix the double-slash Open Graph image URL bug
- [x] Bump service worker cache v3 → v4

<details><summary>Prompt</summary>

```
Four small cleanup fixes, each independent. Make all four, then run
`npm run build` and confirm it passes before committing.

1. In Project_State.md, remove the two Amadeus API rows from the
   integrations table (section 9) — Amadeus shut down its self-service
   API on 17 July 2026. Add a one-line note: "Amadeus self-service
   decommissioned Jul 2026 — removed."
2. Find any text describing hosting as "Netlify" and correct it to
   "GitHub Pages." Search all files, not just CLAUDE.md.
3. Find the Open Graph image meta tag producing a double-slash URL
   (.../og//Trip-Guides/...). Trace where that path is built and fix the
   construction so there's a single slash.
4. In public/sw.js, bump the cache constant from "tripguides-v3" to
   "tripguides-v4".

Show me each change as a diff before committing. Commit with message:
"Phase 0: cleanup — remove dead Amadeus refs, fix hosting text, OG URL,
bump SW cache."
```
</details>

---

## Phase 1 — Live Data APIs

### Session 1 — Live currency (Frankfurter) **[PLAN FIRST]**
*Status: ✅ Complete (29 Jun 2026)*

- [x] Plan approved
- [x] Hardcoded ₩1,535 replaced with live rate (all instances, code + prose)
- [x] Fetch-once-per-session caching in place
- [x] Graceful failure: fallback rate + "live unavailable" note
- [x] Source + timestamp shown on the displayed rate
- [x] Build passes, dist/ confirmed, committed

<details><summary>Prompt A — planning</summary>

```
I want to replace the hardcoded KRW exchange rate (₩1,535) in the Korea
guide's budget section with a live rate from the Frankfurter API
(api.frankfurter.dev — no key, CORS-safe, ECB daily rates).

Do NOT write code yet. First propose an approach and wait for my approval.
In your plan, address:
- Where the rate is currently hardcoded (find every instance — code AND
  prose)
- How to fetch once and cache for the session
- What happens if the API call fails — the budget must still work with a
  clear "live rate unavailable, using fallback" state, never a broken page
- Whether this should be reusable by other guides (Denmark/DKK, etc.) or
  Korea-only for now
- Which files change and what the schema impact is, if any

Keep it minimal. This is the first API integration and becomes the
template for the others, so I want the pattern clean.
```
</details>

<details><summary>Prompt B — after plan approved</summary>

```
Approach approved. Implement it. Requirements:
- Graceful failure is mandatory — if the fetch fails, fall back to the
  last known rate and show a small "rate as of [date], live update
  unavailable" note. Never let a failed API break the budget display.
- Cache the result in sessionStorage so it fetches once per session.
- The displayed rate must show its source and timestamp.

Then: run `npm run build`, confirm it passes, and grep dist/ to confirm
the live-rate code appears in the compiled Korea page. Show me the diff
and the build output before committing.
```
</details>

---

### Session 2 — Weather strip (Open-Meteo) **[PLAN FIRST]**
*Status: ✅ Complete (30 Jun 2026)*

- [x] Plan approved
- [x] `WeatherBlock.astro` created + Zod schema field added
- [x] Reads lat/lng from existing `map` sections (no new manual config)
- [x] Trip dates mapped to forecast range
- [x] Graceful failure: block hides cleanly if unavailable
- [x] Wired in all three: content.config.ts, Block.astro, new component
- [x] Build passes, dist/ confirmed, committed

<details><summary>Prompt</summary>

```
Add a weather forecast strip to guides, using Open-Meteo
(api.open-meteo.com — no key, CORS-safe). Follow the SAME pattern we
established for the Frankfurter currency integration: fetch-once, cache,
graceful failure, source + timestamp shown.

Plan first, then wait. In the plan address:
- Reading lat/lng from the guide JSON's existing `map` sections so it
  needs no new manual config per guide
- A new WeatherBlock.astro component + the Zod schema field to enable it
- How dates map to the forecast (the guide has trip dates; Open-Meteo
  returns a date range)
- Graceful failure: if weather is unavailable, the block hides cleanly
  rather than showing an error

This is a new section type, so it touches content.config.ts, Block.astro,
and a new component — confirm you'll wire all three.
```
</details>

---

### Session 3 — Public holidays (Nager.Date) **[PLAN FIRST]**
*Status: ✅ Complete (30 Jun 2026)*

- [x] CORS tested; path chosen (browser vs. build-time) and explained
- [x] Country code sourced from themes.ts (added if missing)
- [x] Holidays overlapping trip dates highlighted + closures flagged
- [x] Graceful failure handled
- [x] Build passes, dist/ confirmed, committed

<details><summary>Prompt</summary>

```
Add automatic public-holiday detection using Nager.Date
(date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}).

IMPORTANT: Nager.Date's CORS support is reported inconsistently. First,
test whether a direct browser fetch works from our site. If CORS blocks
it, switch to the build-time approach: fetch holidays during the GitHub
Actions build (in deploy.yml) and write them into a JSON file the static
site reads. Tell me which path you're taking and why before implementing.

The country code per guide should come from themes.ts (add it there if
it's not present). On the guide, highlight any holiday that overlaps the
trip dates and flag likely closures.

Plan first, then wait for approval.
```
</details>

---

## Phase 2 — Exports

### Session 4 — GPX + iCal exports
*Status: ✅ Complete (30 Jun 2026)*

- [x] GPX file per guide from `map` lat/lng (+ `sights` coords), loadable in map apps
- [x] iCal (.ics) from day cards, subscribable (all-day events — schema has no times)
- [x] PDF button investigated — `window.print()` only, no renderer; **button removed per owner request** (Ctrl+P/print stylesheet retained)
- [x] Download links placed in UI (Share modal "Take it with you" row)
- [x] Build produces files in dist/, committed

<details><summary>Prompt</summary>

```
Add three export outputs generated at build time. These read existing
guide data and produce downloadable files — they must not alter the live
site's existing behavior.

1. GPX: every `map` block's lat/lng → a .gpx file per guide, loadable in
   Google Maps / Organic Maps.
2. iCal (.ics): every day card's dates/times → a subscribable trip
   calendar.
3. Confirm whether the existing PDF button uses a real rendering step or
   browser print; if print-only, note what a build-time PDF would take
   (don't build it yet — just report).

Do GPX and iCal now. Plan first. For each, tell me where the download
link appears in the UI and confirm the build produces the files in dist/.
```
</details>

---

## Phase 3 — Authoring platform

### Session 5 — Shared checklist via URL — *SCRAPPED*
*Replaced by Session 6. The owner scrapped the shared-checklist idea; the checklist
progress bar it would have extended was itself removed in Session 4.*

### Session 6 — "Make a new Guide" + Guides-to-be tier
*Status: ✅ Shipped · Template-first; AI research is a later Claude Code pass, not in-site*

- [x] Mobile tab-bar scrolls horizontally only (fixed the both-axes drag)
- [x] Single-source country table (`src/data/countries.mjs`) — accent/currency/IANA
      tz/ISO code/capital for ~60 countries; DST bug fixed (fixed offsets → Intl)
- [x] `draft` schema flag + "Guides-to-be" secondary tier on the home page
- [x] Japan/Germany/Portugal stripped to the standard template + moved to drafts
- [x] Deterministic scaffold generator (`scripts/scaffold-guide.mjs`) — backbone with
      **API sections pre-wired** (map+weather+holidays) so live data shows immediately
- [x] "Make a new guide" button + quick-start modal on the home page
- [x] GitHub Issue Form → Action → PR (semi-automatic commit; owner merges, never auto)
- [x] Build passes, browser-verified, committed

**Follow-up (next session):** wire the deferred **AI research pass** — have the Action
(or a companion workflow) invoke Claude Code on the new-guide PR to research + fill the
scaffold per CLAUDE.md, 2–3 passes to Korea/Denmark polish, then drop `draft`.

---

## Phase 4 — Platform (parked until Phases 0–3 ship)

Bigger lifts. Don't start these until the above is done and stable.

- [ ] **Decap CMS** — form-based editor over the JSON (no backend). ~1 weekend.
- [ ] **Template extraction** — separate personal data from destination
      data; contributor docs; publish as GitHub template repo.
- [ ] **Japan guide rebuild** — first real use of docs/NEW_GUIDE_INTAKE.md;
      priorities-first rebuild from draft to backbone standard.

*These get their own planning session with Claude chat before prompting
Claude Code.*

---

## Working Rhythm (for limited time)

- One session at a time. Stop between them. Confirm the live site still
  works before starting the next.
- Do NOT marathon. Sessions 1–5 across a week or two is the right pace.
- For [PLAN FIRST] sessions: paste the proposed plan into Claude chat for
  review BEFORE approving, if unsure.
- If a build fails or behavior looks off: paste the error or the live URL
  into Claude chat for a diagnosis + corrective prompt.

---

## Session Log
*Append one entry per session before ending. Most recent at top.*

| Date | Session | Outcome | Notes / follow-ups |
|------|---------|---------|--------------------|
| 2 Jul 2026 | Tier 1 content-audit tooling | ✅ Shipped, build clean, all 4 checks verified against real repo/API data | No-LLM, zero ongoing-token-cost weekly accuracy sweep. `scripts/audit/lib.mjs` (shared helpers) + `check-links.mjs`, `check-photos.mjs`, `check-apis.mjs`, `check-staleness.mjs` + `run-audit.mjs` (orchestrator, posts/updates one tracking GitHub Issue) + `.github/workflows/content-audit.yml` (Monday 03:17 UTC + `workflow_dispatch`) + `content-audit` label added to `ensure-labels.yml`. **Real bug found during verification, not yet fixed:** `src/scripts/guide-ui.js` calls the Frankfurter `v2` endpoint, which is dead (404, confirmed independently via `curl` including the bare endpoint with no params); `v1` works and returns the expected shape — one-line fix, `v2`→`v1`, deferred to keep this session scoped to the audit tooling itself. **Two bugs caught and fixed while building:** (1) the standalone-invocation check (`import.meta.url === file://${process.argv[1]}`) silently never matched on Windows since `process.argv[1]` is a relative/backslash path — fixed with a shared `isMain()` helper using `pathToFileURL`; (2) the link checker's first pass flagged 24/103 links as "broken," but most were sites 403-ing the request (tested: even a full browser User-Agent didn't help, so it's not simple UA sniffing) — recalibrated into confidence tiers (`dead` 404/410 only counts as high-confidence; `blocked` 401/403/429 and `error` network failures are reported separately with an explicit "check manually" caveat) so the tracking issue doesn't cry wolf. Photo validator uses the Commons MediaWiki API's `missing` flag (verified against a deliberately fake filename) rather than a thumbnail HEAD request, which would give false confidence. Real findings from the first run: 7 dead links (Verizon TravelPass page, a Go Nordic Cruiseline tour page, HSB Turning Torso page, 3 visitseoul.net pages, t.kakao.com), 0 missing photos, currency canary failing (the Frankfurter bug above). **Follow-up:** fix the Frankfurter v2→v1 URL; consider Tier 2 (an actual research-pass agent) for re-verifying the 7 dead links' replacement facts — Tier 1 only detects, never fixes. |
| 2 Jul 2026 | Repo hygiene — cleanup after manual patch + file reorganization | ✅ Functional pass clean (build 6 pages, 70/70 tests); docs consolidated and reorganized | A downloaded-zip patch was manually applied outside the agent (an earlier attempt to apply it via the agent was correctly blocked by Claude Code's own instruction-poisoning classifier — the CLAUDE.md accuracy-rules-11–13 addition to `~/.claude/CLAUDE.md` was never applied and is still pending, owner's call how to do it). The manual apply left the repo in a messier state than before, found and fixed this session: **split-brain research-guide.md** — the improved prompt (source-tier ladder, verification ledger, adversarial check) had landed at `docs/research-pass/research-guide.md`, a location nothing reads, while the actual file every research pass loads (`.github/prompts/research-guide.md`) stayed on the old version; merged into the single canonical `.github/prompts/research-guide.md`, duplicate removed. **Two stray files removed from repo root:** `global-rules-additions.md` (entirely about editing `~/.claude/CLAUDE.md`, a file outside this repo — never belonged here) and `trip-guides-standards.patch` (one-time apply-artifact, fully consumed). **Deletions reviewed individually, not blanket-reverted:** `docs/content-review-2026-07.md` (the Korea restructuring audit trail) **restored** from git history; `docs/research-pass/research-guide.yml` + its `README.md` (the deliberately-inert, zero-cost staged CI workflow for auto-running research passes) **left deleted** — owner call, that staged-activation path is no longer part of the plan. **Repo root reorganized:** `ROADMAP.md`, `Project_State.md`, `PUBLISHING.md`, `NEW_GUIDE_INTAKE.md` moved into `docs/` (via `git mv`, history preserved); `CLAUDE.md` and `README.md` stay at root (auto-loaded / GitHub landing page — can't move). Every cross-reference updated and swept for stragglers (`CLAUDE.md`, `README.md`, this file's own Session-Opener prompt, `.github/prompts/research-guide.md`) — a stale "CLAUDE.md, CLAUDE.md" duplicate in the Session Opener prompt fixed to `~/.claude/CLAUDE.md, CLAUDE.md` while touching that line anyway. Historical Session Log rows and already-executed prompt blocks left untouched (accurate records of paths at the time, not live references). |
| 1 Jul 2026 | Repo hygiene — CLAUDE.md doc fix | ✅ Doc misconfiguration fixed; build clean | Repo-root `CLAUDE.md` was auto-loaded every session but held only generic accuracy rules already duplicated from `~/.claude/CLAUDE.md` — zero project content. The real standards (4-property guide definition, autogeneration test, content standards, architectural guardrails) lived in `Trip-Guides-CLAUDE.md`, which never auto-loads under that filename. **Fix:** `CLAUDE.md` now holds the project standards + a pointer to `Project_State.md` (kept as-is — it's the chat-upload context file for sessions without repo access, not redundant) + two new sections captured from this session's efficacy pass: **Gotchas** (this repo is OneDrive-synced; `astro dev` HMR can serve stale CSS — verify via `astro preview`) and **Operational Habits** (large-guide offset/limit reads, new client JS goes in `src/scripts/` not inline in GuideLayout, prefer grep/script over an Explore agent for objective/greppable questions, `guide.css` split threshold ~800 lines). `Trip-Guides-CLAUDE.md` deleted, fully absorbed. **COUNTRY_CODES audit:** already single-sourced in `src/data/countries.mjs`, imported by both `themes.ts` and `fetch-holidays.mjs` — resolved in an earlier session (Session 6), no duplication existed to fix, no code changed. **Scheduling finding (report only, nothing built):** a GitHub Actions `on: schedule:` cron workflow is real/buildable and repo-native but can only run a script (flag stale `verified` dates, open an issue) — it can't itself research/re-verify facts; this chat environment's own scheduling tools (`create_trigger`) are a separate, account-bound mechanism that could fire an actual Claude research pass, but live outside the repo/git history. Decision on which (if either) to build is deferred. |
| 1 Jul 2026 | AI research pass — staged (no live API) | ✅ Prompt + inert CI template committed; validated (no API) | Owner asked to "start local, no live API usage, keep code handy." Shipped the reusable **research prompt** `.github/prompts/research-guide.md` (encodes CLAUDE.md accuracy standard, intake-driven priorities, `≈`/`⚠` flags, photo rules, keep-`draft`, build-check) usable in a local Claude Code session now. The CI workflow is **staged inert** at `docs/research-pass/research-guide.yml` (under docs/, NOT `.github/workflows/`, so GitHub never runs it — zero cost/API) with owner/collaborator + `/research`-comment gating and VERIFY-before-activate markers on the `anthropics/claude-code-action` step (inputs not asserted from memory). `docs/research-pass/README.md` covers the local flow + activation steps (verify action inputs, add `ANTHROPIC_API_KEY`, move into `.github/workflows/`). Human stays the draft/merge gate. **Follow-up:** run a real local pass on germany/japan/portugal; then activate CI when ready. |
| 1 Jul 2026 | Session 6 — "Make a new Guide" + Guides-to-be | ✅ Shipped; build clean, browser-verified both viewports | **Tab fix:** `.guide-tabs` had `overflow-x:auto` + default `overflow-y:visible` (computes to auto) + `.gtab` `margin-bottom:-1px` → a 1px vertical scroll region; added `overflow-y:hidden`+`touch-action:pan-x` → horizontal-only. **Country data:** new `src/data/countries.mjs` (plain ESM, imported by both TS and the Node scripts) is the single source for accent/currency/IANA-tz/ISO/capital across ~60 countries; removed the duplicate COUNTRY_CODES map in fetch-holidays.mjs; **fixed the DST bug** — local-time pill + jet-lag now use IANA tz + `Intl` (was fixed offsets, an hour off in European winter). Rates NOT tabled per country (perishable) — live Frankfurter remains the source; only the 4 pre-existing fallbacks kept. **Guides-to-be tier:** `draft?:boolean` schema flag; `index.astro` splits curated (Korea+Denmark) from a secondary drafts grid. **Stripped** Japan/Germany/Portugal to the standard 16-section template (identity + real coords only; old content recoverable via git) → first occupants of the tier. **Scaffold generator** `scripts/scaffold-guide.mjs` (pure Node) emits a backbone guide (empty cards/checklists + budget) with **map+weather+holidays pre-wired** (coords from creator or the country's capital) + a filled `guides-intake/<slug>.md`. **Button:** home-page "Make a new guide" modal → prefilled GitHub Issue-Form URL. **Action:** `.github/workflows/new-guide.yml` parses the issue (`scripts/issue-to-scaffold.mjs`, no third-party actions), scaffolds, opens a PR (never auto-merges), closes the issue. The `new-guide` label the flow depends on is created automatically by `.github/workflows/ensure-labels.yml` (issue templates can apply labels but not create them) — no manual setup. **Follow-up:** the deferred AI research pass (Claude Code on the PR); the draft `verified` stamp renders in the green "verified" pill (minor visual mismatch, pre-existing pattern). Replaces scrapped Session 5. |
| 30 Jun 2026 | Technical-debt pass (whole repo) | ✅ Dead code/config cleaned; build clean, dist/ verified, browser-tested both viewports | Three parallel audits (client JS, CSS, components/lib/scripts/config) then fixes, each independently re-verified before applying. **Real bugs fixed:** `public/sw.js`'s offline fallback `caches.match("/")` could never match anything (SW scope is `/Trip-Guides/`, never bare `/`) — now matches `BASE + "/"`, restoring the last-resort offline fallback. **Dead code removed:** `updateCount()` in GuideLayout.astro was an orphaned wrapper (its `#progCount` target no longer exists post-Session-4) — calls now go straight to `updateDayCounts()`; a stale `flash("...use Copy progress")` message referencing the removed button. **Consolidated:** 3 separate month-name lookup tables (array + two differently-indexed objects) into one shared `MONTHS` array; duplicate `.pace` CSS rule merged; `flatSecs()` in index.astro replaced with the existing `flattenSections()` from lib/exports.ts. **Stale values fixed:** TripSplit.astro's KRW fallback default (1380 → 1535, matching themes.ts; was unreachable in practice since the real rate is always passed, but misleading). **Dependency hygiene:** `sharp` (used directly by `og/[slug].png.ts`) was an undeclared phantom dependency, only present because npm hoists it from Astro's own deps — added as an explicit direct dependency so it can't silently disappear on a different package manager or Astro version. **API-surface accuracy:** dropped unnecessary `export` from 3 internal-only helpers (`THEMES`, `DEFAULT_ACCENT`, `htmlToText`) that nothing outside their own file imports. **Repo hygiene:** removed the tracked `trip-guides-site.zip` (85 KB, dated 5 Jun — predates the GitHub Pages migration and every content session since; unreferenced by any build/CI step); `PUBLISHING.md` updated so it no longer points at a now-deleted file; `.gitignore` now excludes `*.zip`. **Resolved an old open question:** `wrangler.jsonc` (flagged "decide delete vs keep" after Phase 0) — kept; its own comment explains it's a deliberate guard against an Astro-CLI auto-adapter bug, explicitly harmless on every host. **Docs fixed:** Project_State.md's SW cache-version note was stale (said v3, code is v4); also fixed a self-inflicted table-corruption bug from the prior session's edit, where the Session 4 log row had absorbed Session 3's row into one malformed cell — split back into two correct rows. **Found but explicitly NOT fixed (flagged, not actioned):** `npm audit` reports a high-severity Astro XSS/SSRF advisory with no fix available within the current `^6.4.4` range (only Astro 7 resolves it) — a major-version upgrade is a real decision, not a cleanup, left for the owner; `astro check` (run for the first time ever on this repo, transiently, not added as a dependency) surfaces ~66 pre-existing type-strictness gaps (missing `@types/node`, implicit `any` in older vanilla-JS blocks) across files untouched today — retrofitting strict typing repo-wide is a different, much larger initiative than bloat removal and was left alone to avoid regression risk for no user-facing benefit. |
| 30 Jun 2026 | Session 4 — GPX + iCal exports (+ owner add-ons) | ✅ Exports shipped + share/UX cleanup; build clean, dist/ verified, browser-tested | Build-time static endpoints `src/pages/guides/[slug].gpx.ts` + `.ics.ts` (mirror the `og/[slug].png.ts` precedent), pure helpers in `src/lib/exports.ts` (reuses `parseGuideDate`/`deriveTripYear`). GPX = map centers + sights coords; iCal = all-day VEVENTs (days schema has no times), CRLF, 75-octet fold, stable UID. `getStaticPaths` filtered → guides without data get no file/link (germany/portugal use "Day N" labels → no .ics, by design). Real-import verified via node-ical + @tmcw/togeojson. **Owner add-ons same session:** Share-summary button (theme + planned + key spots; native share / clipboard); removed the **PDF button** (was `window.print()` only) and the **top checklist progress bar** (Copy/Restore/Clear) — `flash()` feedback relocated to a fixed toast; **mobile horizontal-scroll fixed** (`overflow-x:clip` on html+body, tab bar `overscroll-behavior-x:contain`+`max-width:100%`) — verified 0 page h-scroll across all 6 pages @390px. **Behavior change:** Share button now always opens the modal (was bypassing it via native share on mobile, which hid the downloads/summary). **Watch-item:** Share modal now carries link + QR + socials + summary + downloads — fine now; section it (Share vs Export) if it grows. **Follow-up:** denmark.json `Kastellet` (55.6909,12.5945) vs `CopenHill` (55.6916,12.5970) sit 175 m apart but aren't adjacent landmarks — likely a wrong coordinate; verify against a primary source (stacked GPX pins until fixed). |
| 30 Jun 2026 | Session 3 — Public holidays (Nager.Date) | ✅ Build-time holiday integration shipped; build clean, dist/ verified | Chose build-time (not browser fetch) — holidays are fixed for the year, so committed JSON + CI refresh beats a per-load fetch; works offline, no client JS, no runtime failure mode. `COUNTRY_CODES` in themes.ts; `src/lib/holidays.ts` for slicing; `scripts/fetch-holidays.mjs` for CI/local fetch. Three block states: holiday during trip (alert + closure flag), clear ("✓ normal hours"), adjacent (±3-day shoulder). Korea: clear + Constitution Day 2 days after; Denmark: clear + Grundlovsdag 3 days before. Block hides only on genuine data-unavailability. `tg:holidays` event deferred — no consumer yet. |
| 30 Jun 2026 | Session 2 — Weather strip (Open-Meteo) | ✅ WeatherBlock + canonical service shipped; build clean, dist/ verified | `WeatherBlock.astro` new component (hidden wrapper, title inside so failed fetch leaves no orphaned heading). Content.config.ts → 10th Zod union member. `hasWeatherSection` flag suppresses masthead `#wxWrap` when guide has its own weather section (no double-render). Service: sessionStorage cache (`tg-wx-{lat},{lng}`, UTC daily TTL), shape + temp sanity (−90..60 °C), trip-window date slice, "retrieved {date} · Open-Meteo" credit. Missing-map console.warn breadcrumb. Korea + Denmark both got in-flow `weather` sections. `tg:weather` CustomEvent deferred — no consumer yet. |
| 29 Jun 2026 | Session 1 — Live currency (Frankfurter) | ✅ Canonical rate service shipped; build clean, dist/ verified | Promoted existing Phase-7 fetch into full service: sessionStorage cache (UTC daily TTL, keyed `tg-rate-KRW`), sanity band `[500,3000]`, `applyLive`/`applyFallback`, `tg:rate` event broadcast. TripSplit + budget foot + stats pill all update live. Prose inconsistency fixed (`₩1,500` → `₩1,535` in 2 places). Pattern reusable for DKK/JPY/EUR — keys off `curCode`. |
| 29 Jun 2026 | Phase 0 — Housekeeping | ✅ All 4 fixes shipped; build clean, dist/ verified | Amadeus shutdown **verified** (PhocusWire; decommissions 17 Jul 2026 — imminent, not yet past). Netlify text was bigger than expected: PUBLISHING.md + README.md were full Netlify/Cloudflare walkthroughs, both rewritten to GitHub Pages. **Follow-up:** `wrangler.jsonc` (Cloudflare config) is now dead — decide delete vs keep. OG image URL was not just double-slashed but pointing at a non-existent path → social previews were broken; now fixed + target png confirmed to exist. |
