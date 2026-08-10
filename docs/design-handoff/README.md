# Handoff: Waypoint — Atlas hub, guide sheets, and trip tools

## Overview

This is a full redesign of **Waypoint**, a static site of verified, personalized travel
guides. The product's differentiator is that every perishable fact — a price, an opening
hour, a door — is traced to a primary source and stamped with the date it was checked, and
where research came up short the guide says so instead of filling the hole.

The redesign covers three surfaces and the tooling that sits behind them:

1. **The atlas hub** — a cover hero opening into an interactive globe with the trips pinned
   on it, plus a plain "table view" twin for fast, in-transit access.
2. **The guide sheet** — the full reading experience, rendered from each guide's own JSON.
3. **Trip tools** — split costs, jetlag, closures, reminders, route order.

It replaces the previous design's full-bleed-photo homepage and its one-column guide layout.

## About the design files

**The files in `prototype/` are design references created in HTML — not production code to
copy.** They are prototypes demonstrating intended look, motion, and behaviour.

The target codebase is **Astro** (`Carlob2499/Trip-Guides`), with vanilla JS feature modules
under `src/features/`, pure logic under `src/lib/`, DOM scripts under `src/scripts/`, and
plain CSS under `src/styles/`. **Recreate these designs using that stack and those patterns.**
Do not introduce React — the prototype uses a React-flavoured runtime purely because that is
what the design tool renders in; every component below maps cleanly onto an Astro component
plus a vanilla enhancement script.

Two files are the exception and can be used almost as-is:

- **`prototype/atlas-map.js`** — a dependency-free custom element (`<atlas-map>`) that draws
  the globe on canvas. It needs `d3` and `topojson-client` on the page. Drop it into
  `src/features/atlas/ui/` and it works.
- **`prototype/trip-split.js`** — this is a **port of your own** `src/features/trip-split/model/
  {money,settle,summary}.ts` into plain JS, made so the prototype could run. **Do not port it
  back.** Keep your TypeScript originals; they are the source of truth and they have tests.

## Fidelity

**High-fidelity.** Colours, typography, spacing, motion timings, and interaction states are
final and are specified exactly below and in `DESIGN.md`. Recreate them precisely.

Two caveats:

- Photography in the prototype is loaded from Wikimedia Commons at the URLs each guide's JSON
  already records. Use your existing image pipeline.
- The globe's country geometry is fetched from `world-atlas@2.0.2` on a CDN. Decide whether to
  vendor it (~110KB) for the offline requirement.

## The design system

**`DESIGN.md` in this bundle is the authority** and supersedes the previous revision in the
repo. It carries the full token set as frontmatter (machine-readable), the CSS-variable
contract, the type scale, a motion table, and every Named Rule with the reason it exists.
Read it before writing any code. The sections below cover what DESIGN.md does not: exact
screen composition, state, and behaviour.

---

## Screens / views

### 1. Cover

**Purpose.** The first thing a visitor sees; establishes the instrument before the map appears.

**Layout.** Fixed full-viewport, `display:grid; place-items:center`, padded by the four safe-area
insets. Centred column, `gap:18px`, items centred.

**Components.**

| Element | Spec |
| --- | --- |
| Benchmark mark | 26×23px oxide triangle (`border-left/right:13px solid transparent; border-bottom:22px solid #9c4421`) with a 6px `--bg` dot at `left:10px; top:13px` |
| Wordmark | `WAYPOINT`, Source Sans 3, 700, `clamp(2rem,7vw,4.4rem)`, `letter-spacing:.24em` |
| Sub-line | `VERIFIED FIELD GUIDES`, 600, 10px, `.3em`, `--muted` |
| CTA | Pill, `--cta` ground, `--cta-ink` text, `13px 26px`, `min-height:46px`, copy: **"Enter the atlas"** |
| Scroll cue | 1px hairline, 34px tall, gradient `--rule2 → --aink`, terminating in a 9px oxide-ringed dot |

**Behaviour.** Auto-opens after **4200ms**. Any click, scroll, or wheel cancels the timer and
opens immediately. Dismissal sequence:

1. `0ms` — supporting elements (`[data-cover-fade]`) fade and drop away, 260ms.
2. `~120ms` — the wordmark **FLIPs** into its header position (measure both rects, apply the
   inverse transform, then transition to identity over 620ms `cubic-bezier(.22,1,.36,1)`).
3. `380ms` — the cover opens a circular **iris**: animate a
   `radial-gradient(circle at 50% 50%, transparent Npx, #000 N+1.5px)` mask from `r=0` to
   `r = hypot(w/2,h/2) * 1.05` over 780ms, cubic ease-out. The globe is already flying in
   beneath it.
4. On completion the cover unmounts.

Under `prefers-reduced-motion` the whole sequence is a single cut.

The cover is shown once per session (`sessionStorage`), and is behind a `bootIntro` flag.

---

### 2. World view (the atlas hub)

**Purpose.** See every trip in space and time; open one.

**Layout.** `height: calc(100dvh - headerHeight)`, `overflow:hidden`, `position:relative`. The
`<atlas-map>` canvas fills it absolutely. Everything else is an absolutely-positioned overlay
above it, and every overlay scales and fades together as the globe zooms in.

**The globe** (`prototype/atlas-map.js`). Orthographic projection, drawn on canvas — not SVG,
because SVG at this node count could not hold frame rate. Details:

- Two canvas layers, DPR-capped at 2. Redraws only when `_dirty`.
- Sphere fill, graticule (10° steps), index contours at the equator and prime meridian,
  country paths with the four visited countries filled `rgba(156,68,33,.32)` and stroked
  `#9c4421`.
- **Day/night terminator** from the real subsolar point (NOAA low-precision solar position),
  filled `rgba(0,0,0,.34)` in dark / `rgba(15,19,23,.20)` in light, edged in `--rule2`.
- **Route traverses** — dashed (`5,5`) great circles at `rgba(156,68,33,.72)` from a home base
  to each destination, sampled at 48 points so they clip correctly at the horizon, drawn in
  over 1400ms on load. Home base comes from the `home-base="lon,lat,LABEL"` attribute.
  **Currently `-118.4085,33.9416,LAX · HOME BASE` — this was a guess; confirm the real one.**
- **Furniture**: sheet corner ticks; a compass rose (24px radius desktop at `w-58,66`; 20px at
  `w/2,52` below 620px) with 30° graduations and a needle that swings to the selected sheet;
  a scale bar that re-rounds its km figure as you zoom.
- **Pins** at each trip's real anchor (Seoul, Tokyo, Copenhagen, Sedona): a pulsing ring
  (2.4s), a 22px-radius transparent hit circle (44px target), and a 7–9px oxide/grey dot.
- **Interaction**: drag to rotate, wheel/pinch to zoom (clamped `0.9R`–`5R`), idle spin that
  slows as you zoom and pauses on interaction for 2.6s. `flyTo(code)` eases rotation and
  scale over 1100ms taking the shortest path around the sphere.
- **Events**: `atlas-pos` (every frame — projected pin positions, visibility, sheet centre,
  zoom factor) and `atlas-select` (`{code, name}` on click, `code:null` for a country with no
  guide).

**Overlays.**

| Position | Content |
| --- | --- |
| Top-left | Live sheet-centre coordinate readout; **Index of sheets** — the four trips with dates, click to fly |
| Left-centre | **Key to the marks** — oxide dot = surveyed, grey = filed, dashed = route from home, shaded = night now |
| Right-centre | **The record** — a vertical chronology (Denmark complete, Korea complete, Sedona next, Japan planned); click a date to fly |
| Bottom-left | Zoom ±, **FIT WORLD**, **PAUSE / SPIN ON** |
| Bottom-right | **The North Star** motto panel, dismissible |
| Floating | Per-pin cover cards (desktop only) |

Every overlay carries `data-ref-fadezoom` and scales to
`max(0.5, 1 - (zoom-1)*0.5)` / fades to `max(0, 1 - (zoom-1)*0.85)`, becoming
`pointer-events:none` below 0.15 opacity.

**Pin cards (desktop).** Each is a mounted plate: cover photo in a hairline frame with oxide
corner ticks, the country code and coordinates, the title, a live local clock, and a
CTA. **They resolve their own collisions** — this is the fiddliest part of the design and worth
reading the source for:

- Each card tries **eight seats** around its pin (above, below, right, left, then four
  diagonals), taking the first with zero overlap against already-placed cards *and* every
  visible overlay panel.
- If no seat is clean, the solver **re-runs the entire pass with plate-bearing cards
  compacted** (photo hidden), and takes whichever result is clean. Solving per-card greedily
  does not work — the first card's full-size claim starves the rest.
- Failing that, it grid-searches for the lowest-overlap position.
- Cards **ride their pins on the compositor**: `translate3d` only, eased toward the solved
  offset at 0.16 per frame. Never animate `left`/`top`.
- The solver runs in `requestIdleCallback` (220ms timeout), only when the visible pin set
  changes or a card drifts >90px — never inside the frame loop.

**Clicking a pin**: desktop opens that guide directly; mobile raises a bottom sheet first.
Clicking empty ocean or a country with no guide raises a prompt offering to start a new guide
there.

---

### 3. Table view

**Purpose.** The daylight, in-transit surface. Everything the globe gives you, with none of
the instrument. This is the one users will actually reach for mid-trip.

**Layout.** Scrolling column, `max-width:1000px`, centred.

- **Sticky header** — search field (`min-height:44px`, `placeholder:"Search every sheet — a
  place, a price, 119…"`) with a clear button, then a horizontally-scrolling row of sheet
  chips that stay pinned.
- **Quick card** — the trip you are on, or the next one, in a 2px oxide border: kicker
  (`ON THIS TRIP NOW` / `NEXT TRIP` / `MOST RECENT`), title, the trip's emergency numbers as
  tappable `tel:` chips, currency, hazards, local time ticking, and "Open this sheet →".
- **Sheet list** — one row per trip, sorted by relevance to today (in-progress → upcoming →
  most recent), each with number, title, cities, dates, and a status stamp
  (`COMPLETE` green / `IN PROGRESS` oxide fill / `UPCOMING` oxide outline).
- **Tools row** — one tap into the tools screen.

**Search.** All four guides are indexed in the background on load (title + group + stripped
body text of every section). Typing ≥2 characters filters *sections*, showing a breadcrumb,
title, and 150-char snippet; tapping a result opens that guide **on the right tab**.

**No entrance animations on this path.** Content is legible the instant it paints.

---

### 4. Guide sheet

**Purpose.** Read the guide.

**Masthead.** The cover photograph mounted as a **plate**: square, sunken bed, 1px `--rule2`
frame, 2px oxide corner ticks at all four corners, `min-height: clamp(300px,50vh,540px)`,
`flex:1 1 560px`. Beside it (`flex:1 1 360px`, `align-content:end`): kicker, the title at
`clamp(2.5rem,6vw,4.8rem)/0.98`, the dek, and per-guide chips (emergency numbers as `tel:`
links in ochre, currency, base). Beneath both, a **plate line**: 2px oxide top border,
coordinates at `clamp(1.3rem,3vw,2.2rem)` in oxide, the plate stamp, the guide's fact and
source counts, and a `PRINT SHEET` control.

**No graticule over guide photography.** (Earlier revisions had one; it read as clutter at
card scale. The globe keeps its graticule because there it *is* the map.)

**Tab rail.** Sticky at `var(--hdr-h)` — the header measures its own height into that variable
on every update and resize; do not hardcode the offset. Pills, horizontally scrollable, active
pill filled oxide.

**Body.** Every section is a **panel** (below) in the panel grid. Sixteen section types are
rendered: `prose`, `panel`, `routes`, `list`, `map`, `sights`, `budget`, `venues`, `days`,
`holidays`, `infogrid`, `habitats`, `raids`, `tierlist`, `divergences`, `weather`.

**Field log.** Rendered from each guide's `_guide.json → learnings`: summary, key learnings,
day cards in a snap rail (green top border where the day worked, oxide where it didn't),
skipped items, and "what changed in the guide since". **Omitted entirely for guides with no
`learnings` record** — Japan and Sedona haven't happened yet.

---

### 5. Tools

Five tools behind one screen, reachable from the hub header, the guide header (opens on that
trip), the table view, and the mobile map menu. A trip selector in the tool rail switches
guides without leaving.

**Trip split.** Runs on your existing settlement engine. Seeds itself from the guide's own
`budget` section: `basis:"day"` rows multiply by `days`, `per:"group"` rows stay as one shared
bill, everything else multiplies by `party`. Seeded expenses are stamped **✓ FROM THE GUIDE**.
Panels: headline totals (total / per person / per day / count, with local currency where the
guide has a sourced rate), settle-up with an inline **PAID** mark per transfer, travellers
(name + payment handle + running net), add-expense (the same fields as your shipped form),
where-it-went category bars, and the full ledger with per-person share toggles.

⚠ **Two failure modes worth designing out.** First, seeding must not be memoised before the
guide's cache exists — a seed built without the budget section has to be provisional and
rebuilt when the real rows arrive. Second, **every entry point into Tools must load the trip's
data**; guard it in one place on the tools screen rather than at each of the four call sites,
because the one that forgets is the one that ships — on mobile the ☰ menu is the only route
in, so an omission there breaks tools entirely on phones.

**Jetlag.** Ported from your `src/lib/jetlag.ts` and `src/lib/tz-offset.ts` — ±0.4h dead zone,
eastward ~1 day per hour, westward ~1 day per 1.5h, melatonin note at ≥7h, and the body-clock
reading at 11pm local on arrival night. Use the TypeScript originals.

**Closures.** Holidays from `src/data/holidays/{CC}-2026.json`, partitioned exactly as
`src/lib/holidays.ts` does (during trip / 3-day shoulder either side). Japan has no holiday
record in the repo, and the tool **says so** rather than guessing. Recurring closures are
*scanned out of each guide's own sight entries* and carry their check dates.

**Reminders.** Every line is a checklist item the guide already carries, pulled from `checklist`
arrays across its sections, with booking-related items sorted first and flagged `BOOK AHEAD`.
Ticks persist. Nothing is authored by the interface.

**Route order.** Mapped points from the guide, nearest-neighbour then 2-opt, with leg
distances and a total — labelled as straight-line, not transit time.

---

## The panel — the one repeated unit

Every card in the product is this component. Getting it right is most of the work.

```
kicker (10px / .22em / oxide)   ⠿ drag handle          − / + collapse
title  (Literata 500, 1.45rem)
─────────────────────────────────────────────────────
body
```

- Square corners, `--card` ground, `1px solid var(--rule)`, padding `16px 20px 18px` open /
  `12px 16px` collapsed.
- **Collapsible** — state persists per scope in `localStorage`. Collapse animates height +
  opacity over 340ms; the grid re-measures as it runs.
- **Drag-reorderable** — HTML5 drag from the `⠿` handle; order persists per scope.
- Each section group also gets a **COLLAPSE ALL / EXPAND ALL** control in its header.

### The panel grid — and why it has no dead space

```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(min(100%, 340–460px), 1fr));
grid-auto-flow: row dense;
gap: 16–18px;
align-items: stretch;
```

Three behaviours, all necessary:

1. **Stretch, don't stagger.** Panels fill their row's height (`height:100%`), so a short panel
   expands to meet a tall neighbour.
2. **Collapsed sorts after open.** Sort order is: full-width → open → collapsed. Pairing a
   collapsed title bar with a full panel is what actually creates dead space.
3. **Wide types span `1 / -1`** — `sights`, `venues`, `days`, `infogrid`, `habitats`, `raids`,
   `tierlist`, `map`, `budget`, `divergences`, and lists over five items.

Masonry with row spans was tried first and rejected: it packs tightly but destroys reading
order and needs constant JS re-measurement.

---

## The notation layer

This is the product's actual differentiator and the thing most likely to be under-built. Four
sizes of one idea:

| Mark | Where | Spec |
| --- | --- | --- |
| **Provenance dot** | Inline, after any resolved fact | `1em` circle, `1px --rule2`, oxide on hover/focus. Click opens a popover |
| **Flag chip** | `≈ approx.`, `⚠ unconfirmed` | Control size, pill, 1px current-ink border, tappable, never smaller |
| **Stamp** | Check dates, source links | `0.82rem`, 640, `.08em`, uppercase, boxed in 1px of its own ink |
| **Reading** | Mastheads, gaps, totals | `clamp(1.5rem, 1.2rem + 2.4vw, 2.6rem)`, tabular, floors at 24px |

**The popover** carries the claim, `✓ CHECKED <date>`, a **staleness reading**, and the source
link. Staleness uses your `SHELF_LIFE_DAYS` (`fx:7, transit:90, hours:90, venue:180,
default:90`): past its life → `⚠ N DAYS OLD — M PAST ITS <CATEGORY> SHELF LIFE` in ochre;
inside the last third → `AGEING — N DAYS OF SHELF LIFE LEFT`.

**The gap.** Where research came up short: `⚠ NOT CONFIRMED` at Reading scale in ochre inside a
2px ochre border, a rule, the explanation, then a `WHAT TO DO INSTEAD` line at stamp scale.

---

## Interactions & behaviour

| Interaction | Spec |
| --- | --- |
| Cover → atlas | Fade, wordmark FLIP, iris reveal (see §1) |
| Hub card → guide masthead | FLIP the plate: capture source rect, apply inverse transform, transition to identity over **850ms** `cubic-bezier(.22,1,.36,1)` |
| Section reveals | One 0.7s rise (`translateY(22px)` → 0) per element, once, on intersect. One long-lived `IntersectionObserver`, never disconnected mid-flight; anything already in view on mount reveals on the next frame |
| Panel collapse | GSAP height + opacity, 340ms `power2.inOut`, grid re-measures on update |
| Mobile menu | Scrim fade 220ms; sheet `y:14 → 0`, `scale:.97 → 1`, 320ms `back.out(1.6)` from the button corner; rows stagger 28ms; ☰ rotates into ✕ |
| Pin sheet | `y:40 → 0`, 360ms `power3.out` |
| Globe fly-to | 1100ms eased rotation + scale, shortest path, then a 2.6s hold |
| Lightbox | Any guide photo opens at 1600px in a framed, corner-ticked overlay with its Commons credit |
| Theme | Light ⇄ dark toggle in the header; persisted |
| Print | `PRINT SHEET` hides all `[data-noprint]` chrome and force-expands every collapsed panel |

**Reduced motion disables everything, it does not soften it** — the morph becomes a cut, the
iris an instant swap, reveals paint immediately, the globe stops spinning. Press states stay,
because they are state, not motion.

---

## Mobile

Benchmark: **iPhone 17 Pro, 402 x 874 CSS px.** `prototype/Waypoint Mobile.dc.html` is a canvas
that runs the real build inside phone frames with the safe-area insets injected.

The mobile model is deliberately different from a shrunk desktop:

- **The globe shows bare pings.** No floating cards, no side rails, no coordinate readout —
  there is no spatial budget for them.
- **Tapping a ping raises a bottom sheet** with the trip, a ZOOM control, and "Open the sheet".
- **Header collapses** to brand + ＋ + theme, with a permanent **WORLD | TABLE** segmented
  switch so the plain surface is always one tap away.
- **A 52px ☰ button** bottom-right raises a menu: fly to each sheet, fit world, pause spin,
  tools, ＋ new guide. All rows 44px.
- **The motto is removed entirely** on mobile — it fought the menu button for the same corner.

### Mobile navigation inside a guide — preserve these lessons

These behaviours are **ported from the shipped app's `src/features/mobile-nav/`** and its
model tests. They were learned the hard way; keep the existing TypeScript models and wire the
new chrome to them rather than re-deriving anything.

**The bottom bar promotes the groups this device actually opens** (`model/rank.ts`).
Four slots: two content groups, then **ALL**, then **TOOLS**.

- Counts are **per-device, in localStorage, keyed by the group's full name** — never
  telemetry. Telemetry is write-only on the client and is a cross-visitor aggregate; a
  stranger's average is not this traveller's habit.
- **The current group always holds a slot**, so the bar can never show a set that excludes
  where the reader is.
- An unopened group has **no count at all** — ranking falls back to the guide’s own order
  rather than inventing a preference.
- **`seat()` keeps a promoted group where it already is.** Without it the two buttons trade
  places under the thumb that just tapped one.
- **`slotLabel()`** takes the head of a compound name ("Food & shopping" → "Food"), then
  truncates on a word boundary at 9 chars — but only if the stub stays readable. The full
  name stays in the accessible name and the sheet.

**Chrome yields to content, but only on intent** (`model/yield.ts`). Thresholds:
`YIELD_AT 80`, `RETURN_AT 24`, `JITTER 6`, `TOP_ZONE 140`.

- Downward travel past 80px slides the header, tab rail, and bottom bar away (280ms).
- Upward travel under 6px is **page jitter** — scroll anchoring, sub-pixel rounding, and lazy
  images produce a 1–3px rebound every time a scroll settles. The first implementation reset
  its accumulator on any upward pixel and so could never yield at all. Remember the rebound,
  change nothing.
- Above 24px of upward travel is a deliberate flick: bring the chrome back.
- Above the masthead (y < 140) chrome always shows, and it **stands down entirely while an
  overlay owns the screen** — a sheet, the menu, the lightbox, the Groups sheet.

**Swipe between groups is finger-tracked** (`model/gesture.ts`): `AXIS_LOCK_PX 24`,
`COMMIT_FRACTION 0.3`, `COMMIT_VELOCITY 0.5 px/ms`.

- The gesture is claimed only once it is **unambiguously horizontal** — a diagonal reads as
  vertical, because a page that steals a scroll feels broken in a way that a swipe needing one
  more pixel never does.
- Inside the range content tracks the finger at 0.9; at the first or last group it
  **rubber-bands** (0.28, capped at 56px) — the platform’s own way of saying "this is the
  end" without a message.
- Commit on 30% of viewport travel **or** a 0.5px/ms flick that has cleared the axis lock.

**The Groups sheet** (the **ALL** slot) lists every section with its card count and a
**resume line** — "you were at …" — for the group you last read. When nothing is remembered
the line is simply absent; never fabricate a "start here".

**Section memory runs on desktop too**, so a desktop session records where you were for the
next phone one.

**Display cutouts.** viewport-fit=cover is required, or every inset resolves to zero. The four
insets are declared once at :root as custom properties sourced from env(), and every fixed
or sticky edge pads with `max(reserved, var(--safe-*))` — never env() alone, because an
environment reporting zero must still leave the reserved gap.

---
## State

| State | Purpose |
| --- | --- |
| `screen` | `hub` / `guide` / `tools` / `new` / `progress` |
| `mode` | `atlas` / `ledger` — which hub face |
| `boot` | Cover showing (once per session) |
| `theme` | `light` / `dark`, persisted |
| `slug`, `tab` | Open guide and its section group |
| `tool`, `toolSlug` | Open tool and which trip it runs on |
| `ping` | Mobile pin sheet target |
| `menu` | Mobile map menu open |
| `query` | Table-view search |
| `fact` | Provenance popover target + anchor position |
| `lightbox` | Enlarged plate |

**Persisted** (`localStorage`): checklist ticks, panel collapse state, panel order per scope,
theme. **Session**: cover-seen.

**Data loading.** A `guides.json` manifest (kicker, dek, cover, section file list per guide) is
fetched first; each guide's sections load on demand and are cached. All four are indexed in the
background for search. Tools call `ensureGuide(slug)` to load a trip's data without navigating
to it.

---

## Design tokens

All in `DESIGN.md` frontmatter. The essentials:

**Light** — `--bg #dfe3d9` · `--card #f8faf3` · `--sunken #d2d7c8` · `--ink #171d24` ·
`--muted #4e5747` · `--rule #bec6b2` · `--rule2 #a3ac98` · accent `#9c4421` · `--aink #80371b` ·
`--on-aink #f0d2c7` · `--green #396345` · `--ochre #7f4a07`

**Dark (chart room)** — `--bg #0f1317` · `--card #242c34` · `--sunken #1a2129` ·
`--ink #e8ece3` · `--muted #9aa392` · `--rule #38414b` · `--rule2 #4e5865` ·
accent `#9c4421` *(unchanged — identity is data)* · `--aink #c78f78`

**Type** — Literata (display + body), Source Sans 3 (data, labels, all notation). No third
face, no monospace.

**Radius** — `0` containers and evidence, `999px` controls. Nothing between.

**Motion** — `cubic-bezier(.22,1,.36,1)` entrances, `power2.inOut` collapse,
`back.out(1.6)` arrivals.

---

## Assets

- **Photography**: Wikimedia Commons, via `Special:FilePath` URLs already recorded in each
  guide's JSON. Credits and licences are in the guides' reference sections.
- **Globe geometry**: `world-atlas@2.0.2` `countries-110m.json` (Natural Earth, public domain).
- **Libraries**: `d3@7` and `topojson-client@3` (globe), `leaflet@1.9.4` (guide maps),
  `gsap@3.12.5` (collapse and menu motion). Substitute Leaflet for your existing Google Maps
  integration if you prefer — the design only requires a light basemap, oxide circle markers,
  popups, auto-fit bounds, and a fly-to from the coordinate list.
- **Holiday data**: `prototype/holidays.json` is your own `src/data/holidays/{KR,US,DK}-2026.json`
  bundled for the prototype's fetch. Use the originals.

---

## Screenshots

`screenshots/` carries reference captures of each surface:

| File | Surface |
| --- | --- |
| `01-cover.png` | Cover hero before it opens into the atlas |
| `02-world-view.png` | The globe with pins, overlays, and sheet furniture |
| `03-table-view.png` | Table view — search, chips, quick card, sheet list |
| `04-guide-masthead.png` | Guide sheet masthead and plate line |
| `05-guide-panels.png` | Guide body — the panel grid in use |
| `06-tools-trip-split.png` | Trip split, seeded from the guide budget |
| `07-tools-closures.png` | Closures — real holiday record plus scanned closures |
| `08-mobile-frames.png`, `09-…-scrolled.png` | The mobile review canvas |

⚠ **Two capture caveats.** The screenshotter re-renders the DOM rather than taking a pixel
capture, so (a) the Wikimedia Commons photographs come out blank — every framed plate you see
empty holds a real photo in the running prototype — and (b) the mobile canvas cannot capture
its own iframes, so the phone frames appear empty. **Run the prototype for anything that
depends on imagery or the phone layout;** the screenshots are for structure, spacing, and
colour only.

---
## Files in this bundle

| File | What it is |
| --- | --- |
| `DESIGN.md` | **The design system, revision R4 — the repo's single visual authority.** It no longer "supersedes" anything: the pre-Atlas root `DESIGN.md` was retired 2026-08-10 |
| `enforcement/` | The machine-checkable half — `tokens.css`, `SPEC-COMPONENTS.md`, `ANTIPATTERNS.md`, `ACCEPTANCE.md`, `check-drift.mjs`, reference screenshots. Duplicate copies of the four docs sat beside this README until 2026-08-10; `enforcement/` is the only home |
| `prototype/Waypoint Overdrive v2.dc.html` | The full prototype — every screen, all logic |
| `prototype/Waypoint Mobile.dc.html` | Mobile review canvas: the real build in phone frames |
| `prototype/atlas-map.js` | `<atlas-map>` custom element — **usable as-is** |
| `prototype/trip-split.js` | JS port of your own settle/summary model — **reference only, do not port back** |
| `prototype/guides.json` | Manifest the prototype builds from |
| `prototype/holidays.json` | Your holiday data, bundled |
| `prototype/support.js`, `image-slot.js` | Design-tool runtime. **Not part of the design** |
| `prototype/atlas-mobile-home/` | **Next bundle up: the mobile Atlas home (option 4a — globe front door).** Committed 2026-08-10, not yet built. Its own README diffs the design against what already ships and marks the genuinely-new column: tap-to-pick via inverse orthographic projection, focus halo, spin pause-on-select, and the 3b home layout. Everything else reuses the repo implementation as-is |

To run the prototype: serve the folder and open `Waypoint Overdrive v2.dc.html`. It needs
network access for fonts, the globe geometry, and the photos.

---

## Open questions — all seven answered by the build (closed 2026-08-10)

Kept as a record of what the handoff could not decide on its own, and what the repo decided
instead. None of these is still open.

1. **Home base.** The prototype's global `home-base` attribute was rejected. Each guide draws
   its traverse from its own Traveler origin, derived from a reserved row in that guide's fact
   registry — see the two Traveler-origin decisions in `CONTEXT.md`.
2. **Exchange rates.** `live-data/model/rate.ts` is wired for all four guides. A Live rate and
   a guide's own Sourced rate are separate claims with separate shelf lives and are never
   conflated in one line of UI (`CONTEXT.md`, Language).
3. **Denmark's party size.** Answered by content, not config — Denmark is a five-person family
   trip, and its own learnings block records the mobility constraints that followed from it.
4. **Traveller names.** Supplied by the Firebase room, as assumed.
5. **Japan holiday data.** Present: `src/data/holidays/JP-2026.json`, alongside DK/KR/US.
   Fetched at build time from Nager.Date, offline-safe, no client JS.
6. **Contrast gate.** Ran, and it caught real failures rather than confirming the spec — six of
   the twelve Stage-F features turned up a measured contrast defect. The recurring lesson is
   recorded in `docs/HANDOFF.md`: axe skips hidden nodes, so every gesture-revealed surface
   needs its own scoped test in its own spec file.
7. **Not yet designed.** All twelve went through the Stage-F redesign, one commit each.
