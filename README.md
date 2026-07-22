# Waypoint (Trip-Guides)

Your travel-guide site. You write each destination as simple **content files**, and the
project turns them into polished web pages. You do **not** need to read or write code to
run this.

## The idea in one picture

```
src/content/guides/korea/           ← YOU edit these (the "recipe cards")
  _guide.json                         · the guide's title, dates, intro
  01-plan.json … 10-tokyo.json        · one small file per tab of the guide
        ▼
   the project's components          ← the "appliances" — leave these alone
        ▼
   finished web pages                ← built automatically when you publish
```

Everything you care about lives in **`src/content/guides/`** — one folder per destination;
`_guide.json` holds the guide's identity, each numbered file holds one tab's sections, so
you only ever open the small file you're changing. (A brand-new draft can also be a single
`<name>.json` file — both shapes work.)

## Publishing on the web (one-time, ~15 minutes)

The site is static — pre-built pages, served free and fast by GitHub Pages:

1. Put the project in a GitHub repository named `Trip-Guides` (the name must match `base`
   in `astro.config.mjs`).
2. **Settings → Pages → Source → GitHub Actions.** The recipe in
   `.github/workflows/deploy.yml` builds and publishes for you.
3. Wait for the green check in the **Actions** tab (~1–3 min). Your address appears at
   Settings → Pages: `https://your-username.github.io/Trip-Guides/`.

After that, **every saved change rebuilds and updates the site automatically.** Photos are
converted to fast WebP during the build; if one can't be reached, the plain version shows
instead — the site never breaks on a bad photo, and a failed build leaves the last working
version live.

## Start a new guide (the quick way)

On the home page, click **"＋ Make a new guide."** Enter a country (plus optional cities,
dates, party, priorities) and it opens a pre-filled GitHub issue. Submitting it commits a
**draft scaffold** — the standard guide structure with live weather, holiday, and currency
data wired in — as a pull request. The draft lives at its own URL (hidden from the home
page) until a research pass fills and verifies the facts (`draft: false`), then it appears
in the main grid. Works for any country; no setup needed.

**By hand:** copy an existing guide folder (`src/content/guides/denmark/` is the best
example), rename it (the folder name becomes the web address), and edit `title`, `country`,
`dek`, and the `sections`. The home page picks it up automatically.

**Two built-in guardrails:** a malformed guide **stops the build and names the exact file
and field** — a broken guide can never quietly go live; and country colours live in one
place (`src/lib/themes.ts`).

## Section types

Each section has a `type` and a `group` (its navigation tab): `panel`, `prose`, `list`,
`routes`, `map`, `days`, `sights`, `budget`, `weather` (needs a `map` in the same guide),
`holidays`, and `raids`, plus a few specialty types. `guide-template.jsonc` shows the
common backbone; `src/content.config.ts` is the full, authoritative list of fields.

## Working with Claude

Because the project is just text files, Claude can read it, write guides, adjust
components, and run the build to catch problems before you publish — smoothest via
**Claude Code** pointed at this folder.

## Running locally (optional)

Install Node.js, then `npm install` once; `npm run dev` for a live preview or
`npm run build` for the final pages in `dist/`.

## Troubleshooting a failed build

Open the **Actions** tab and click the red run:

- **The log names a content file** — the checker caught a typo or missing field; fix that
  file and commit. The rebuild is automatic.
- **404 after a successful build** — the `base` in `astro.config.mjs` must match the repo
  name (`/Trip-Guides`).
- **A photo didn't load but the site deployed** — the safety net worked; that photo fell
  back to the plain version.
