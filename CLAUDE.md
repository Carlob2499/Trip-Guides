# Working notes for Claude Code

This file is read automatically. Follow it on every change to this project.

## ⛔ AGENT PRE-COMMIT CHECKLIST — read this before every `git commit`

These are the rules most commonly violated by background agents. Check each one before committing, without exception:

1. **Build must pass first.** Run `npm run build`. If `npm` is unavailable in the shell, stop and tell the user: *"Please run `npm run build` and confirm it passes before I commit."* Never commit without a clean build.
2. **Every price, URL, and travel fact must be verified** with a web search before it goes in. Flag anything unconfirmed as approximate ("≈", "⚠ check before you go"). Never invent links.
3. **No emojis unless the user explicitly asked for them.** Do not add emoji to any file without a direct request.
4. **Anchor all logistics to the confirmed lodging**, not a placeholder. If the Airbnb address or neighbourhood is unconfirmed, say so — don't assume a district.
5. **Read the current file before editing.** Make targeted edits; never regenerate a whole guide from memory. The owner edits content between sessions.
6. **Write JSON files as UTF-8 without BOM.** After any PowerShell file write, verify the first byte is `0x7B`. A BOM causes an immediate build failure.
7. **Never use Netlify as a build validator.** A failed production deploy is worse than a delayed commit.

## What this project is
A static **Astro** website of curated travel guides, hosted on **Netlify**, which
rebuilds automatically whenever a commit lands on `main` in GitHub. The owner is
not a programmer — explain changes in plain language and keep the workflow simple.

## Audits and comparisons — fix, don't report

When asked to compare a guide against the standard (Denmark/Korea) or audit it for gaps:
- **Immediately fix every gap found.** The comparison is a work order, not a report.
- The only exception: a gap that requires external research (price verification, web search) that can't be completed in the session — flag those explicitly as "needs research" and fix everything else.
- Do not present a list of gaps and wait for the user to say "so fix them." That is the same failure as not finding them at all, with an extra step.

## Golden rules (do not compromise these)
1. **Accuracy first.** Every price, opening time, URL, and travel fact must be
   verified with a web search before it goes in a guide. Flag anything you cannot
   confirm as approximate ("≈", "check before you go"). Never invent links.
2. **Verify photos.** A sight's `img.file` is an exact Wikimedia Commons filename.
   Confirm the `File:` page exists before adding it; if you can't, omit the photo
   rather than guess. Image optimisation + the offline fallback are already handled
   in `Block.astro` — don't re-add them.
3. **Don't clobber the owner's edits.** They may edit content on GitHub between
   sessions. Read the current files first; make targeted edits; never regenerate a
   whole guide from memory.
4. **Be honest.** If a request is a bad idea or won't work, say so plainly.
5. **Always build before committing:** run `npm run build`. It must finish with all
   pages built and no schema errors. Only commit if the build is clean. If `npm`
   is not available in the current shell, tell the user explicitly: "Please run
   `npm run build` in your terminal and confirm it passes before I commit."
   **Never use Netlify as a build validator — a failed production deploy is worse
   than a delayed commit.**

## Where things live
- `src/content/guides/*.json` — the guides themselves (the facts). One file = one
  destination = one page at `/guides/<filename>/`.
- `src/content.config.ts` — the schema: the authoritative list of what a guide and
  each section type may contain. If a build fails with a content error, this is why.
- `src/components/Block.astro` — thin router: routes each section type to its
  sub-component in `src/components/blocks/`. Change the router only to add a new
  type; change a sub-component to affect only that type.
- `src/components/blocks/` — one file per section type (PanelBlock, ProseBlock,
  ListBlock, RoutesBlock, MapBlock, BudgetBlock, DaysBlock, SightsBlock,
  RaidBlock). Adding a new type: create the sub-component here first, then wire
  it up in Block.astro and content.config.ts.
- `src/layouts/GuideLayout.astro` — page frame, sidebar/mobile nav, the small
  client script (scroll-spy, mobile sheet, checklist memory).
- `src/styles/guide.css`, `src/styles/hub.css` — all visual styling.
- `src/lib/themes.ts` — country → accent colour (single source). Add new countries
  here.
- `src/pages/index.astro` — home page; lists every guide automatically.

## Shared vs per-country (important)
Styling, layout, and components are **shared** — one change there applies to ALL
countries at once. Only the JSON facts are per-country, and they should stay
separate. There is no "edit once, change all guides' content," by design.

## How to add a destination
1. Copy `src/content/guides/denmark.json` as the model; rename it (e.g.
   `portugal.json`). The filename becomes the URL.
2. Fill in `title`, `country`, `dek`, and `sections`, keeping the exact shapes the
   schema defines. Research and verify every fact (rule 1) and every photo (rule 2).
3. If the country is new, add its accent colour in `src/lib/themes.ts`.
4. `npm run build`, confirm the new page appears and its section count looks right.
5. Commit with a clear message; push to `main`. Netlify deploys automatically.

## Section types (see content.config.ts for the exact fields)
`panel` (reference card + optional checklist), `prose` (plain card), `list`
(checklist), `routes` (numbered steps), `map` (lat/lng → live map), `days`
(itinerary), `sights` (photo cards), `budget` (interactive cost calculator:
per-day and one-off estimates, a server-computed trip total, and editable
"your spend" fields that total live and save on the reader's device), `raids`
(collapsible counter tables for each raid boss — structured data, not HTML).
A `group` puts a section under a nav category; a category with a single section
hides that section's own title.

**`prose` body fields** may contain inline HTML: `<p>`, `<b>`, `<i>`, `<a>`,
`<ul>/<li>`, `<ol>`. Do **not** put `<details>`, `<table>`, or any other complex
block elements in a `prose` body. If you need collapsible sections, tables, or
structured repeating content, add a proper section type to `content.config.ts`
instead (as `raids` was added). Hand-authored HTML in a `body` field is
technical debt — it's unvalidated, hard to update, and bypasses the schema.

## Accuracy & anti-hallucination standards — apply before every fact goes in

These rules apply to every piece of content, not just the sections listed in the backbone below. Follow them in order: source first, then write.

### 1. Source hierarchy — always reach the primary source
Official source (venue website, operator booking page, government portal) outranks major publisher (Lonely Planet, newspaper travel desk) outranks aggregator (TripAdvisor, Google Maps, travel blog). Aggregators are useful for leads; never cite them as the source of a fact. For any perishable fact (price, hours, operator name, entry requirement), link the specific page checked — not just the homepage.

### 2. Training data is a starting point, not a source
Treat all prices, hours, operator names, entry requirements, and event details as unverified until confirmed by a current web search. This applies even when the answer feels certain. Popular, well-documented destinations have the most text about them in training data — which makes the outdated information feel most authoritative. Counter-intuitively, the more confident the answer feels, the more important it is to check.

### 3. The "plausible but wrong" trap
The most dangerous errors are facts that sound authoritative, are internally consistent, and match expectations — but are wrong. Every confirmed error in this project was this type (DFDS → Go Nordic Cruiseline; "GO Fest ends at midnight"; "72-hour City Pass"). **Especially verify the things that obviously seem right.** High confidence from training data is a warning sign, not a green light.

### 4. Compound claims — check each component independently
A claim like "take Line 2 to Hongik Univ (8 min), then 5-min walk to the restaurant" contains at least three independently verifiable facts. Verifying the destination does not validate the route or the time. Check each component separately.

### 5. Omission errors — ask what hasn't been said
What the guide doesn't say can be as harmful as what it gets wrong. For every attraction and restaurant, ask: what important constraint have I not mentioned? Reservation requirements, cash-only policies, early closing times, age restrictions, and "closed on the specific days of this trip" are the most commonly omitted facts. Note both closed days AND closing times — "closed Mondays" is incomplete if the closing time on open days is 15:45.

### 6. Seasonal and edition variation
Hours and prices often vary by season; note which season they apply to if they differ. Event data (raid bosses, tournament schedules, event hours) is edition-specific — last year's GO Fest data is not this year's GO Fest data. Re-verify every event section from scratch, every time.

### 7. Internal consistency
If a fact appears in multiple sections of the guide, every instance must be identical. Before committing, search the guide for every key proper noun (restaurant names, event names, prices, operator names) and confirm there are no contradictions. Contradictions within a guide are a hallucination signal.

### 8. The ≈ flag means "checked, approximately" — not "haven't checked"
≈ means: I found the official source and the actual figure is approximately this — verify before paying. It does not mean "I haven't checked." If you haven't checked, write "unverified" or omit the figure entirely. A missing price is honest; a guessed price with a ≈ fig-leaf is not.

### 9. Confirm businesses still exist before citing them
Before naming a specific restaurant, hotel, or venue: search for it with the current year in the query to confirm it is still operating. Training-data businesses close, move, and change hands. A closed restaurant cited as a "pick" is worse than no recommendation.

### 10. Confirmation bias in searching
Finding a result that confirms your existing belief is not verification. Always trace back to the official primary source. Stopping at the first result that matches your training-data memory adds false confidence without adding accuracy.

## Universal backbone — every country guide should cover these
Build to this checklist and VERIFY each item (rule 1) before committing a new
country. Use `guide-template.jsonc` at the repo root as the fill-in model.
- Plan: when you land (airport→lodging), local essentials, entry & documents,
  booking checklist (with rough costs), phone & data, holidays & your dates
  (check for public holidays / closures / big events that overlap the travel
  dates).
- Money & budget: currency & cards, and a `budget` section with verified per-day
  and one-off estimates sized to the trip length.
- Health & safety: emergency number, the medical-help path for a foreign
  visitor, 24-hour pharmacy, tap-water safety, what to bring.
- Etiquette & language: how widely English is spoken, tipping norms, local
  do's/don'ts, key phrases.
- Getting around, Itinerary, Sights, plus any day trips and a country-special
  block (e.g. esports, onsen, ferries) where it fits.
- Food & shopping: two prose sections minimum — "What to eat" (local dishes and
  markets) and "Where to eat — picks near your route" (specific restaurants,
  ordered by proximity to the lodging). Every restaurant entry must answer four
  questions: **Where?** (address) **How do I get there from the hotel?**
  (transit route + time) **When in the trip does it fit?** (best day, fits
  around what) **Do I need to book?** (walk-in / reserve online / call ahead).
  Flag all prices as ≈ with a verify link; note any hours that couldn't be
  confirmed online.
Do NOT auto-generate these sections or their contents — scaffold them, then
research and verify. A stubbed section is fine to ship empty; an unverified one
is not.

## Freshness
Every guide carries a `verified` stamp (string under the dek). Keep it honest:
when you re-check a guide, update its date; if a guide hasn't been checked to the
current standard, say so plainly (Japan currently reads "⚠ Draft …"). Before any
real trip, re-verify the perishable facts (sailings, reservations, opening hours,
forecast). The Denmark guide models this with a "Final checks — before you fly"
panel.

## Offline / installable (PWA)
The site installs to a phone home screen and works offline once opened:
- `public/manifest.webmanifest` + `public/icons/*` (regenerate icons from
  `public/icons/favicon.svg`).
- `public/sw.js` — the service worker. Pages are network-first; assets/images/
  fonts are cache-first. Bump `CACHE` ("tripguides-v1" → v2) when you ship a big
  update so visitors refresh cleanly.
- `src/components/PwaHead.astro` — the shared <head> tags + worker registration;
  it's already in both layouts, so new pages get offline support for free.
- Limitation: embedded maps load in a cross-origin OpenStreetMap frame the worker
  can't cache, so maps need a connection. The text "Key transit routes" cover it.

## Lessons learned — Denmark guide (Jun 2026 iteration)
These were caught during a final accuracy pass and should inform every future guide.

### Verify the operator, not just the route
The Copenhagen–Oslo overnight sailing transferred from **DFDS to Go Nordic Cruiseline** in November 2024. The route, schedule, and terminal were unchanged — only the operator name changed. The guide used "DFDS" throughout for many iterations before this was caught. **Rule: always search the current operator for any transport booking. Route names outlast the companies that run them.**

### Transit pass durations are not always standard intervals
The DOT City Pass has no 72-hour option. The actual durations are 24h / 48h / 96h / 120h. The guide erroneously listed 72h for many iterations. **Rule: fetch the actual product page for any pass and list the real options — never assume 24/48/72/96/120 or similar progressions.**

### Specific prices need direct source links — estimates compound into errors
Multiple prices were wrong in ways that only showed up under direct verification:
- Folkehuset Absalon communal dinner: guide said ≈40 DKK → actual **75–100 DKK** (nearly doubled)
- Copenhagen Card: guide had 599/849/999 DKK → actual **589/859/1,039 DKK**
- Tivoli Gardens: guide low of 135 DKK → actual starting from **≈150 DKK**
**Rule: every price in a guide must have a canonical URL in the References section. If you can't link it, flag it as approximate and say so explicitly — but still try to find the link.**

### Opening hours constrain routing — note closing times, not just closed days
Grundtvig's Church is well-known to be "closed Mondays," but the guide omitted that it also **closes at 15:45 every day it's open**. That closing time has real implications for the Thursday route (the group must arrive by 15:15 at the latest). **Rule: note both closed days AND closing times for any attraction that appears on a routing day.**

### Every guide needs a References section with verified URLs
During the first many iterations, the guide had no source list. Adding a References group (a `prose` section in its own nav group) serves three purposes: it forces verification of every claim, it gives the reader a way to confirm or update facts themselves, and it is the standard practice of every serious travel publication. **Rule: every guide should ship with a References section linking every official source used.**

### Split-group itineraries need dual documentation throughout
When a travel party splits for multiple days, the splitting must be reflected in: (1) the day-by-day entries, (2) the route/logistics section, and (3) the booking checklist. Documenting only the main group's plan while treating the second group as an afterthought is unhelpful. **Rule: if a guide covers multiple sub-groups, each group gets its own plan in every relevant section.**

### Title quality is part of the guide's usefulness
Generic titles like "Kastellet + Reffen" or "City day + LEGO" describe contents without capturing character. Titles like "Fortresses, mermaids & Scandinavia's biggest street food market" tell the reader what kind of day it is. **Rule: write titles as if they'll appear on a YouTube thumbnail or a magazine cover. The reader should understand the experience, not just the itinerary items.**

### Day theme summaries are a distinct, addable layer
A one-line italic summary at the opening of each day's body field (e.g. "A gentle landing — find your bearings, then let the harbour do the heavy lifting.") adds emotional context that pacing notes and checklists can't provide. **Rule: every `days` item should open with a 1–2 sentence theme line before the logistical detail.**

### Complex content belongs in a section type, not an HTML string in a `prose` body
The raid counter charts were first implemented as a ~4,000-character HTML string in a `prose` body field — `<details>`, `<table>`, nested `<tr>` rows, all hand-written and unvalidated. This worked once but was fragile: one wrong bracket broke the display, updating a counter required editing raw HTML, and the schema gave zero help. The fix was to add a `raids` section type to `content.config.ts`, create `RaidBlock.astro` to render it, and migrate the data into a typed JSON structure. **Rule: if a `prose` body field grows beyond simple `<b>/<i>/<a>/<p>/<ul>` inline markup, stop and add a section type instead. The extra 20 minutes of schema work saves hours of maintenance.**

### Inline links go in the most actionable places; References handles citation
Link the first mention of each key resource in the most relevant section of the guide (e.g., "DOT Tickets app" in the transit panel, "tivoli.dk" in the Tivoli entry). Don't link every mention of every resource everywhere — that clutters the text. The References section is the comprehensive citation list; inline links are navigation shortcuts. **Rule: max one inline link per resource, in the place where it's most likely to be acted on.**

### Always write JSON files as UTF-8 without BOM
PowerShell's `[System.IO.File]::WriteAllText(path, text, [System.Text.Encoding]::UTF8)` silently prepends a **BOM** (bytes `0xEF 0xBB 0xBF`). Astro's JSON content loader — and `JSON.parse` — reject BOM-prefixed files with `Unexpected token ''`, causing an immediate build failure. This happened in the Jun 2026 session and produced a failed Netlify production deploy. **Rule: when writing or rewriting a `.json` file via PowerShell, use `New-Object System.Text.UTF8Encoding $false` as the encoding, or write raw bytes after stripping any leading BOM. Always verify the first byte is `0x7B` (`{`) after writing.**

### Netlify is not a build validator — build locally first
In the Jun 2026 session, `denmark.json` was committed and pushed without running `npm run build`. The BOM encoding bug above would have been caught immediately by a local build in under 15 seconds; instead it caused a failed production deploy visible to any visitor until the fix landed. **Rule: if `npm` is unavailable in the current shell, explicitly tell the user to run `npm run build` themselves and confirm it passes before pushing. Do not treat a green Netlify deploy as proof the build was clean — it means the build happened to pass, not that it was validated before commit.**

### Restaurant entries need four-question logistics, not just addresses
The Copenhagen food section was improved by adding AYCE Korean BBQ (KOBA, Seoul Nordhavn) and Filipino restaurants (Jabby's, Manila at Reffen) with explicit transit directions from the hotel, best-day-of-trip fit, and reservation requirements. Entries without this context are much less useful to a reader in the field. **Rule: every specific restaurant pick must answer — (1) exact address, (2) transit from lodging with time, (3) which day(s) of the itinerary it fits and why, (4) reservation requirement and how to make one. Flag unconfirmed hours with ⚠ and unconfirmed prices with ≈.**

## Roadmap / parked ideas
- DESKTOP-CLASS DOC HUB (Wanderlog-style): a per-trip resource hub to drop in
  reservation emails, hotel/excursion confirmations, train tickets, etc. and read
  them inside the guide. Parked for a dedicated session — it needs a storage +
  privacy design (these are sensitive personal docs) and likely an upload/paste
  flow, not a quick add. Don't bolt it on hastily.
- Bring Japan up to the universal-backbone + budget standard (needs its own
  verified research).
