# Integrations — what Waypoint connects to, and how each one is switched on

Every external service is **config-gated and lazy-loaded** (CLAUDE.md). With nothing configured the
site builds, deploys and works: maps fall back to the OpenStreetMap embed, sync stays local, the
intake opens a prefilled GitHub issue. Configuring a key upgrades a surface; it never becomes a
dependency. `npm run build` prints one `[integrations]` line saying which are configured — names
only, never values.

| Integration | Where it is configured | Surfaces it upgrades | Without it |
| --- | --- | --- | --- |
| **Google Maps Platform** (Maps JavaScript API, Advanced Markers) | Build-time env `PUBLIC_GMAPS_KEY` (browser key, HTTP-referrer restricted to the Pages origin) and `PUBLIC_GMAPS_MAP_ID` (a Cloud map style id; `DEMO_MAP_ID` is used when absent). In CI: repository **secrets** of the same names, passed by `.github/workflows/deploy.yml`. | Map destination, Itinerary workbench map, Trip "today on the map", Guide chapter maps — live markers, day routes, clusters, category/day chips, synchronized selection (`src/features/maps`). | The OpenStreetMap embed is the map (honest fallback, §15). |
| **Cloud map style** | Google Cloud console → Map Styles → publish → Map ID → `PUBLIC_GMAPS_MAP_ID`. The lineage boards use a deep-forest cartography with rust route emphasis; the style lives in the console, the code only passes the id. | Same mounts. | Google's default style under `DEMO_MAP_ID`. |
| **Firebase Realtime Database** (Trip Split live sync) | `src/features/firebase/firebase-config.js` — the public web config, committed by design; `rules.json` pasted into the console; Anonymous auth enabled. Setup steps in `src/features/firebase/README.md`. | Split: group-mates on one trip code see the same ledger. | Split runs local-only on this device. |
| **Intake / change-request Worker** | `src/lib/backend-config.js` `WAYPOINT_BACKEND.url` (deployed by `.github/workflows/deploy-worker.yml`; owner-only routes take the owner key stored in the creator's browser via `src/scripts/owner-key.js`). | New-Guide dispatch, ✎ change requests, progress-page answers and the owner's triage queue. | Prefilled GitHub issues; progress page hides its answer controls. |
| **Research pipeline (Claude)** | Repository secret `CLAUDE_CODE_OAUTH_TOKEN`; repository variable `WAYPOINT_RESEARCH_ENGINE` (`v2` selects Pipeline V2; unset keeps V1 as production default). Models are pinned in `.github/workflows/new-guide.yml`. | Guide research and recertification runs. | No runs; the site is static content. |
| **Open-Meteo** (weather) and **Frankfurter** (exchange rates) | Keyless public APIs, called client-side only from `src/features/live-data`. | Trip forecast + packing list, Split conversions. | Honest blanks; the committed fallback rate carries its as-of date. |
| **GitHub Pages** | `.github/workflows/deploy.yml` on push to `main`; `SITE_BASE_URL` variable for absolute links in pipeline output. | The site itself. | — |

## Switching Google Maps on (the one owners usually ask about)

1. Google Cloud console → APIs & Services → enable **Maps JavaScript API**.
2. Credentials → create a **browser key**; restrict it to `https://carlob2499.github.io/*` (and the
   preview origin you use locally). Waypoint never sends the key anywhere but Google's loader.
3. Optional: Map Styles → create a style → publish → copy its **Map ID**.
4. GitHub → repository Settings → Secrets and variables → Actions → **New repository secret**:
   `PUBLIC_GMAPS_KEY` (and `PUBLIC_GMAPS_MAP_ID`). The next push to `main` rebuilds with them.
5. Locally: copy `.env.example` to `.env` and fill the same names; `npm run build` reports
   `[integrations] Google Maps: configured`.

The runtime contract (`src/features/maps/ui/gmaps-render.js`): with a key, every map mount is
Google-primary and its embed is dormant; a load error, quota error or 15 s without a first paint
wakes the embed and marks the mount `data-map-google-failed`, so a bad key degrades to the
fallback map, never to a blank pane. The design canary (`tests/visual/design-canary.spec.ts`)
accepts either terminal state.

## What is deliberately not a key

- Place photographs come from the repository (Wikimedia-credited files under `public/`), never
  from a photo API.
- Search runs on a build-time index shipped with the page; no service, works offline.
- Emergency numbers are verified data in `src/data/countries.mjs`, baked into the page.
