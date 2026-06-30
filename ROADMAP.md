# Waypoint Evolution Roadmap & Session Tracker

**Purpose:** Keeps the site-evolution work on track across sessions spaced
days or weeks apart. Claude Code: read this at the start of every session
to know where we left off. Check items off as they ship. Update the
"Session Log" at the bottom before ending each session.

**How to use this file:**
- Each session below is ONE unit of work — scoped, shippable, self-verifying.
- Run them in order. Do not combine sessions.
- Prompts marked **[PLAN FIRST]** must propose an approach and wait for
  approval before writing code.
- After each session: tick the boxes, append a Session Log entry.

---

## Reusable Session Opener (run at the start of EVERY session)

```
Read CLAUDE.md, CLAUDE.md in this repo, Project_State.md, and
ROADMAP.md in full before doing anything. Then tell me, in a few bullets:
the last completed session per ROADMAP.md, what's next, and confirm you
understand the "verified not generic" principle. Do not change any code
yet — I'm confirming context before we start.
```

---

## Guiding Principles (the standard for every session)

1. **One unit of work per session.** Ship it, verify it, commit it, stop.
2. **Plan before code** on anything non-trivial. Approve the plan first.
3. **Verification is part of the work.** `npm run build` passes, `dist/`
   confirmed, the specific thing checked — before any commit.
4. **Establish the pattern once, replicate after.** The first API
   integration is the template; later ones reference it.
5. **Graceful failure is mandatory** for anything calling an external API.
   A dead API hides its widget; it never breaks the page.

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
*Status: ☐ Not started · Tests the build-time escape hatch for non-CORS APIs*

- [ ] CORS tested; path chosen (browser vs. build-time) and explained
- [ ] Country code sourced from themes.ts (added if missing)
- [ ] Holidays overlapping trip dates highlighted + closures flagged
- [ ] Graceful failure handled
- [ ] Build passes, dist/ confirmed, committed

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
*Status: ☐ Not started · Build-time outputs, safe — can't break live site*

- [ ] GPX file per guide from `map` lat/lng, loadable in map apps
- [ ] iCal (.ics) from day cards, subscribable
- [ ] PDF button investigated; build-time PDF effort reported (not built)
- [ ] Download links placed in UI
- [ ] Build produces files in dist/, committed

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

## Phase 3 — Group Features

### Session 5 — Shared checklist via URL **[PLAN FIRST]**
*Status: ☐ Not started · First real state-management complexity — own slot*

- [ ] Plan approved (encoding, restore flow, stale-URL handling)
- [ ] Checklist state encodes into a shareable URL
- [ ] Restore-on-open works; merges sanely with local state
- [ ] UI text makes clear this is a snapshot, NOT live sync
- [ ] Extends existing "copy progress" button rather than rebuilding
- [ ] Build passes, committed

<details><summary>Prompt</summary>

```
The checklist state is currently localStorage, per-device, so group
members don't share progress. I want a no-backend shared-state feature:
encode the current checklist state into a URL that can be shared (via the
existing WhatsApp button), and when someone opens that URL, their guide
restores to that state.

This is more complex than the API work — plan thoroughly and wait. Address:
- How state is encoded compactly into a URL hash (it could be large)
- The restore-on-load flow and how it merges with any existing local state
- What happens with an old/stale shared URL
- That this is a share-snapshot, NOT live sync — be clear about that
  limitation in any UI text
- Whether the existing "copy progress" button already does part of this
  and can be extended rather than rebuilt

Do not over-engineer. No backend, no library unless you justify it.
```
</details>

---

## Phase 4 — Platform (parked until Phases 0–3 ship)

Bigger lifts. Don't start these until the above is done and stable.

- [ ] **Decap CMS** — form-based editor over the JSON (no backend). ~1 weekend.
- [ ] **Template extraction** — separate personal data from destination
      data; contributor docs; publish as GitHub template repo.
- [ ] **Japan guide rebuild** — first real use of NEW_GUIDE_INTAKE.md;
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
| 30 Jun 2026 | Session 2 — Weather strip (Open-Meteo) | ✅ WeatherBlock + canonical service shipped; build clean, dist/ verified | `WeatherBlock.astro` new component (hidden wrapper, title inside so failed fetch leaves no orphaned heading). Content.config.ts → 10th Zod union member. `hasWeatherSection` flag suppresses masthead `#wxWrap` when guide has its own weather section (no double-render). Service: sessionStorage cache (`tg-wx-{lat},{lng}`, UTC daily TTL), shape + temp sanity (−90..60 °C), trip-window date slice, "retrieved {date} · Open-Meteo" credit. Missing-map console.warn breadcrumb. Korea + Denmark both got in-flow `weather` sections. `tg:weather` CustomEvent deferred — no consumer yet. |
| 29 Jun 2026 | Session 1 — Live currency (Frankfurter) | ✅ Canonical rate service shipped; build clean, dist/ verified | Promoted existing Phase-7 fetch into full service: sessionStorage cache (UTC daily TTL, keyed `tg-rate-KRW`), sanity band `[500,3000]`, `applyLive`/`applyFallback`, `tg:rate` event broadcast. TripSplit + budget foot + stats pill all update live. Prose inconsistency fixed (`₩1,500` → `₩1,535` in 2 places). Pattern reusable for DKK/JPY/EUR — keys off `curCode`. |
| 29 Jun 2026 | Phase 0 — Housekeeping | ✅ All 4 fixes shipped; build clean, dist/ verified | Amadeus shutdown **verified** (PhocusWire; decommissions 17 Jul 2026 — imminent, not yet past). Netlify text was bigger than expected: PUBLISHING.md + README.md were full Netlify/Cloudflare walkthroughs, both rewritten to GitHub Pages. **Follow-up:** `wrangler.jsonc` (Cloudflare config) is now dead — decide delete vs keep. OG image URL was not just double-slashed but pointing at a non-existent path → social previews were broken; now fixed + target png confirmed to exist. |
