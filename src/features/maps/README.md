# maps feature

Two halves, both self-booting on import from `index.js`:

| File | Role | Gated? |
|---|---|---|
| `ui/fullscreen.js` | ⤢ button on every default OSM iframe | No — always on |
| `ui/gmaps-render.js` | Upgrades `[data-itin-map]` mounts to Google Maps | Yes — needs `PUBLIC_GMAPS_KEY` |

**Without a key the site is complete.** Each `map` section renders a keyless OpenStreetMap
iframe (`MapBlock.astro`), `gmaps-render.js` never boots, and Vite tree-shakes nothing
because the module is tiny and inert. Turning maps on is an *upgrade*, not a fix.

## Setup (~10 minutes)

You need **two** values, not one. Both are set as env vars at BUILD time and end up in the
page's `#tgConfig` blob — that is by design (see "The key is public" below).

### 1. Enable the API and create a key

In the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis), on a
project with billing enabled:

- Enable the **Maps JavaScript API**.
- Create an **API key**.

### 2. Restrict the key — this is the actual security control

The key ships to the browser in every built page. Restriction, not secrecy, is what stops
someone else spending your quota. On the key's settings:

- **Application restrictions → Websites**, and add:
  - `https://carlob2499.github.io/*` — the live site
  - `http://localhost:4322/*` — local `astro preview` (note `http`, not `https`)
- **API restrictions → Restrict key → Maps JavaScript API.**

The **protocol is mandatory**. Google's guidance: *"Always provide the whole referrer
string, including the protocol scheme, hostname and optional port (e.g.
`https://google.com`)."* A bare `carlob2499.github.io/*` is not a valid referrer and the
key will reject requests.

Don't be tempted to narrow it to the real path (`https://carlob2499.github.io/Trip-Guides/*`).
Browsers strip the path from cross-origin requests for privacy, so the referrer Google
actually receives is just the origin — a path-scoped rule would never match and every map
would fail. Origin + `/*` is the correct scope, and Google's own docs warn about exactly
this.

### 3. Create a Map ID — required, not optional

`gmaps-render.js` renders `AdvancedMarkerElement` pins, and Google's docs are explicit:
*"Advanced markers requires a map ID. If the map ID is missing, advanced markers cannot
load."*

On the **Map Management** page → **Create map ID** → set **Map type: JavaScript**, which
then makes you choose **Raster (the default) or Vector**. Either works — advanced markers
are supported on both, and this code uses only basic `PinElement` styling, which raster
handles fine. Vector adds smoother zoom plus tilt/rotation.

If you later want the other rendering type, Google's docs don't document changing it on an
existing map ID — but they do note a `renderingType` map option that "overrides any
rendering type settings made by configuring a map ID", so it's changeable in code
(`gmaps-render.js:60`, beside the existing `mapId`) without touching the console. Either
choice here is recoverable; don't overthink it.

The code falls back to `mapId: "DEMO_MAP_ID"` when none is set. That is Google's documented
**testing** shortcut — it renders, so a missing Map ID fails quietly rather than loudly, but
it is not a production Map ID and won't carry any cloud map styling you configure. Set a
real one.

### 4. Wire the values in

**Live site** — repo **Settings → Secrets and variables → Actions → New repository secret**,
twice:

| Secret name | Value |
|---|---|
| `PUBLIC_GMAPS_KEY` | the API key |
| `PUBLIC_GMAPS_MAP_ID` | the Map ID |

`deploy.yml` already passes both into the build (lines 40–41) — nothing to change there.
Push anything to `main` and the next deploy picks them up.

**Local dev** — put the two Maps keys in a gitignored `.env` at the repo root (create it if it
doesn't exist; **append** if it does, so you don't clobber other keys):

```
PUBLIC_GMAPS_KEY=your-key-here
PUBLIC_GMAPS_MAP_ID=your-map-id-here
```

Then `npm run build && npm run preview -- --port 4322`. The `PUBLIC_` prefix is what makes
Astro expose them to client code — renaming them breaks the wiring.

### 5. Verify it actually upgraded

Don't trust the build passing. On a guide page with a map, in the console:

```js
JSON.parse(document.getElementById('tgConfig').textContent).gmapsKey  // non-null?
document.querySelectorAll('.osmmap').length                            // 0 once upgraded
document.querySelectorAll('gmp-advanced-marker, .map-fs-btn').length   // pins present
```

A guide's OSM iframes are removed as each map upgrades — so `.osmmap` dropping to 0 on a
page that has map sections *is* the proof it worked. If the key is bad or restricted wrong,
you'll see `[gmaps] failed to load:` in the console and the OSM iframe stays; that fallback
is intentional.

## The key is public — and that's fine

`PUBLIC_GMAPS_KEY` is inlined into every built page. That's not a leak; a browser Maps key
has to reach the browser. Google's own guidance is to restrict it by HTTP referrer + API
rather than hide it. The GitHub secret only keeps it out of git history — the referrer
restriction in step 2 is what actually protects it. **If you skip step 2, the key is
usable by anyone who views source.**

## Gotcha the two halves share

`fullscreen.js` wires its ⤢ button at page load. `gmaps-render.js` upgrades lazily
(IntersectionObserver, 400px rootMargin) and *removes the OSM iframe* when it fires —
potentially minutes later. Its `init()` strips the now-dangling `.map-fs-btn` at the same
time, because Google's map ships its own `fullscreenControl: true`. If you ever move either
file, keep that coupling: a fullscreen button pointing at a detached iframe silently does
nothing on click.
