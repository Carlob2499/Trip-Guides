# Vendored data

## countries-110m.json

World country geometry — [world-atlas](https://github.com/topojson/world-atlas) v2.0.2's
`countries-110m.json` (110m-resolution TopoJSON, Natural Earth-derived), vendored here on
2026-08-08 rather than fetched from a CDN at runtime (D18, `docs/archive/PLAN_ATLAS_MIGRATION.md` —
the offline rule forbids a live CDN dependency for something this static). Confirmed the exact
pinned version via jsDelivr's own `package.json` for that tag before downloading the data file
itself: `https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/package.json`.

- **Source:** `https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json`
- **Shape:** a TopoJSON `Topology` with `objects.countries` (177 country geometries) and
  `objects.land`. Each country geometry's `id` is its **ISO 3166-1 NUMERIC** code, as a
  string (e.g. `"410"` for South Korea) — match it against
  `String(isoNumericFor(guide.country))` (`src/data/countries.mjs`), not the ISO alpha-2 code
  used elsewhere in this repo.
- **To re-vendor** (a version bump, not a routine task): re-run the same two `curl` fetches
  above against the new tag, confirm the `package.json` really reports that version before
  trusting the data file, and update this note's version number and date.
- **Served from:** `${BASE_URL}/data/countries-110m.json` — fetched client-side through the
  base path (`document.body.dataset.base`, this repo's established pattern for a client fetch
  under GitHub Pages' `/Trip-Guides/` prefix), never a bare `/data/...` path. Precached by the
  service worker (`scripts/gen-sw-precache.mjs`).
