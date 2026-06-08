# Working notes for Claude Code

This file is read automatically. Follow it on every change to this project.

## What this project is
A static **Astro** website of curated travel guides, hosted on **Netlify**, which
rebuilds automatically whenever a commit lands on `main` in GitHub. The owner is
not a programmer — explain changes in plain language and keep the workflow simple.

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
   pages built and no schema errors. Only commit if the build is clean.

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
- Getting around, Itinerary, Sights, Food & shopping, plus any day trips and a
  country-special block (e.g. esports, onsen, ferries) where it fits.
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

## Roadmap / parked ideas
- DESKTOP-CLASS DOC HUB (Wanderlog-style): a per-trip resource hub to drop in
  reservation emails, hotel/excursion confirmations, train tickets, etc. and read
  them inside the guide. Parked for a dedicated session — it needs a storage +
  privacy design (these are sensitive personal docs) and likely an upload/paste
  flow, not a quick add. Don't bolt it on hastily.
- Bring Japan up to the universal-backbone + budget standard (needs its own
  verified research).
