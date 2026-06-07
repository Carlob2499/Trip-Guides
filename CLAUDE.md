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
- `src/components/Block.astro` — renders one section (panel, prose, list, routes,
  map, days, sights). Change here = changes every guide.
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
"your spend" fields that total live and save on the reader's device). A `group`
puts a section under a nav category; a category with a single section hides that
section's own title.

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
