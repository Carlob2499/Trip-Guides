# Trip Guides

This is your travel-guide blog. You write each destination as one simple
**content file**, and the project turns it into a polished web page. The look
and feel are exactly the same as the guides you already had — this just makes
them easier to add to, publish, and grow.

You do **not** need to read or write code to run this. The two things you'll
ever touch are explained below.

---

## The idea in one picture

```
src/content/guides/denmark.json     ← YOU edit these (the "recipe cards")
src/content/guides/korea.json
src/content/guides/japan.json
        │
        ▼
   the project's components          ← the "appliances" — leave these alone
        │
        ▼
   finished web pages                ← built automatically when you publish
```

Everything you care about lives in **`src/content/guides/`**. Each `.json`
file there is one destination. Everything else is the machinery that turns
those files into pages — you can ignore it.

---

## How to publish it on the web (about 15 minutes, one time)

> **A full, click-by-click walkthrough with fixes for every step is in
> [`docs/PUBLISHING.md`](./docs/PUBLISHING.md).** The short version is below.

The site is "static," meaning the pages are pre-built and then just served —
fast, cheap (free), and reliable. Your sight photos are automatically converted
to fast, modern WebP images during the build on the host (no work for you); if a
photo ever can't be reached, the guide shows the plain version instead, so the
site never breaks. The normal flow:

1. **Put the project on GitHub.** Make a free account at github.com, create a
   new repository named `Trip-Guides`, and upload this folder's contents (GitHub
   lets you drag files in through the website — you don't need the command line).
2. **Turn on GitHub Pages.** In the repo, go to **Settings → Pages → Source** and
   choose **GitHub Actions**. No second account or host to connect — GitHub builds
   and serves the site itself, using the recipe already in the repo
   (`.github/workflows/deploy.yml`).
3. **Wait for the green check.** The **Actions** tab shows the "Deploy to GitHub
   Pages" build running (~1–3 minutes). It installs, runs `npm run build`, and
   publishes the `dist` folder for you.
4. Your address appears at **Settings → Pages**:
   `https://your-username.github.io/Trip-Guides/`. Done. A custom domain can be
   added there later.

After that, **every time you change a guide and save it on GitHub, the site
rebuilds and updates itself automatically** — usually within a minute or two.

> The repo name must match the `base` in `astro.config.mjs` (`/Trip-Guides`).
> Official step-by-step: https://docs.astro.build/en/guides/deploy/github/

---

## Start a new guide (the quick way)

On the home page, click **"＋ Make a new guide."** Enter a country (and, optionally,
cities, dates, who's going, and priorities) and it opens a pre-filled GitHub issue.
Submitting it runs an automation that commits a **draft scaffold** — the standard guide
structure with live weather, public-holiday, and currency data already wired in for that
country — and opens it as a pull request. The draft appears under **"Guides-to-be"** on
the home page; a later research pass fills the facts (per CLAUDE.md) and, once verified,
it graduates to the main grid. Works for **any** country. *(No setup needed — the
`new-guide` label the automation relies on is created automatically by the
`ensure-labels` workflow.)*

## How to add a new destination by hand

1. Copy an existing guide file — `src/content/guides/denmark.json` is the best
   example — and rename it, e.g. `portugal.json`. The file name becomes the web
   address (`/guides/portugal/`).
2. Edit the fields: `title`, `country`, `dek` (the one-line description), and
   the `sections`. Keep the same shapes you see in the example.
3. Save. The home page picks it up and adds a card automatically — you never
   edit a list of destinations by hand.

**Two helpful guardrails are built in:**

- If a guide file is missing something it needs, or a section is malformed, the
  build **stops and tells you exactly which file and field** — so a broken guide
  can never quietly go live. (This is your accuracy-first rule, enforced by the
  tool instead of by memory.)
- Country colours live in **one** place — `src/lib/themes.ts`. Add a line there
  for a new country's accent colour and every page uses it.

### The section types you can use

Each section has a `type` and a `group` (the category it appears under in the
navigation). The available types: `panel` (a reference card with an optional
checklist), `prose` (a plain note), `list` (a checklist), `routes` (numbered
directions), `map` (an interactive map), `days` (the day-by-day itinerary),
`sights` (photo cards), `budget` (the cost calculator), `weather` (a live
forecast strip — needs a `map` section in the same guide for coordinates),
`holidays` (public holidays during the trip), and `raids` (Pokémon GO raid
counter tables). The example files show each one in use — `guide-template.jsonc`
covers the common "universal backbone" set; see `src/content.config.ts` for the
full, authoritative list of fields each type accepts.

---

## How Claude works on this with you

Because the project is just text files, Claude can read it, write new guides,
adjust components, and run the build to catch problems before you publish. The
smoothest setup for ongoing work is **Claude Code** (Anthropic's command-line
tool) pointed at this folder: Claude edits, runs the build, fixes anything that
breaks, and you review the changes. You can also just ask in chat and get edited
files back.

---

## For the curious: the folder map

```
src/
  content/guides/*.json   the guides themselves — what you edit
  content.config.ts       the "checker": rules every guide must satisfy
  lib/themes.ts           country -> accent colour (single source)
  lib/buckets.ts          groups sections into categories
  components/Block.astro  draws one section (panel, days, sights, ...)
  layouts/GuideLayout.astro  the page frame + nav + the small interactive bits
  pages/index.astro       the home page (lists all guides)
  pages/guides/[slug].astro  makes one page per guide file
  styles/                 the look (lifted unchanged from your originals)
astro.config.mjs          one-time settings (set your web address here)
package.json              the project's dependency list
```

## Running it on your own computer (optional)

If you ever want to preview locally: install Node.js, then in this folder run
`npm install` once, and `npm run dev` to open a live preview, or `npm run build`
to produce the final pages in a `dist/` folder.
