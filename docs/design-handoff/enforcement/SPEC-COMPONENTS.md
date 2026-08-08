# Component contract — exact values

Companion to README.md. README says what each screen *is*; this file says what each part
*measures*. Where a number appears here and in the prototype, this file wins for intent and
the prototype wins for tie-breaks. Nothing here is approximate — no value below is a
suggestion, and none of them should be re-derived from a screenshot.

Read with SCREENSHOT-INDEX.md open; every component below names the capture that shows it.

---

## Contract rules that apply to every component

1. **Radius is binary.** `0` on anything that holds content or evidence; `999px` on anything
   you press. There is no 4px, 8px, or 12px anywhere in this product. A rounded card is the
   single fastest way to make this design stop looking like itself.
2. **Borders are hairlines except when they are structural.** `1px var(--rule)` is the default.
   `2px` oxide is reserved for exactly four things: the quick card, the plate line, the gap
   block, and corner ticks. If you find yourself reaching for a third weight, the answer is a
   different colour, not a thicker line.
3. **Oxide (`#9c4421`) is identity, not emphasis.** It marks the instrument: ticks, pins,
   route lines, active pills, the plate line. It does not mean "important". Nothing turns oxide
   because a designer wanted attention; things are oxide because they are part of the survey.
4. **Uppercase + tracking = data. Sentence case = prose.** Source Sans 3 at `.08em`–`.3em`
   tracking is the notation voice. Literata is the reading voice. A label in Literata or a
   paragraph in Source Sans is a category error, not a style choice.
5. **Every fixed or sticky edge pads with `max(reserved, var(--safe-*))`.** Never bare
   `env()`. An environment reporting zero must still leave the reserved gap.
6. **Nothing animates `left`/`top`/`width`/`height` on a per-frame path.** Transform and
   opacity only. Height animates once, on collapse, through GSAP, and the grid re-measures on
   its update tick.

---

## 1. Panel — the unit the whole product is made of

Shown in: `05-guide-panels.png`, `15-guide-panel-grid-dark.png`, `17-panels-collapsed.png`.

```css
.panel {
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 0;
  padding: 16px 20px 18px;   /* collapsed: 12px 16px */
  height: 100%;              /* stretch to the row, do not stagger */
  display: flex;
  flex-direction: column;
}
.panel__kicker { font: 600 10px/1 var(--fs); letter-spacing: .22em; text-transform: uppercase; color: var(--accent); }
.panel__title  { font: 500 1.45rem/1.2 var(--fd); color: var(--ink); }
.panel__rule   { height: 1px; background: var(--rule); margin: 10px 0 12px; }
```

Header row: kicker + `⠿` drag handle on the left, `−`/`+` collapse on the right, both
`min-height: 32px` hit areas, both `data-noprint`.

**State.** Collapse state and panel order persist in `localStorage`, **keyed per scope**
(`guide slug + section group`). A global key is wrong: collapsing the budget panel in Korea
must not collapse it in Denmark.

**Collapse motion.** GSAP height + opacity, **340ms `power2.inOut`**, with the grid
re-measuring on the tween's update tick — not only on complete, or the row height lags a
frame behind and the page visibly jolts at the end of every collapse.

### The grid

```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); /* 460px on wide types */
grid-auto-flow: row dense;
gap: 16px;      /* 18px above 1100px */
align-items: stretch;
```

**Sort order is load-bearing: full-width → open → collapsed.** This is the rule that removed
the dead space, and it is the one most likely to be dropped as an "unnecessary sort". A
collapsed title bar sitting next to a full-height panel is exactly what creates the ragged
gap the redesign was fixing.

**Span `1 / -1`:** `sights`, `venues`, `days`, `infogrid`, `habitats`, `raids`,
`tierlist`, `map`, `budget`, `divergences`, and any `list` over five items.

---

## 2. Notation — four sizes of one idea

Shown in: `16-provenance-popover.png`.

| Mark | Font | Size | Tracking | Weight | Border |
| --- | --- | --- | --- | --- | --- |
| Provenance dot | — | `1em` circle | — | — | `1px var(--rule2)`, oxide on hover/focus |
| Flag chip | Source Sans 3 | control size, never smaller | `.08em` | 640 | `1px currentColor`, pill |
| Stamp | Source Sans 3 | `0.82rem` | `.08em` | 640 | `1px` of its own ink, square |
| Reading | Source Sans 3 | `clamp(1.5rem, 1.2rem + 2.4vw, 2.6rem)`, floor 24px | — | tabular nums | none |

**The dot is a button.** It takes focus, it has a 44px effective target through padding, and
it opens the popover on click — not hover. Hover-only provenance is unusable on the device
this product is actually read on.

**Popover contents, in order, no exceptions:** the claim → `✓ CHECKED <date>` → the staleness
reading → the source link (`SOURCE · host ↗`) or `NO PUBLIC SOURCE`. It is positioned
`clamp`ed into the viewport: `left: max(12px, min(anchorX - 160, innerWidth - 340))`.

**Staleness** uses `SHELF_LIFE_DAYS` — `fx: 7, transit: 90, hours: 90, venue: 180, default: 90`:

- past its life → `⚠ N DAYS OLD — M PAST ITS <CATEGORY> SHELF LIFE`, in `--ochre`
- inside the final third → `AGEING — N DAYS OF SHELF LIFE LEFT`
- otherwise → no staleness line at all. Silence is the healthy state.

### The gap block (honest absence)

```
┌─ 2px solid var(--ochre) ─────────────────┐
│ ⚠ NOT CONFIRMED         (Reading scale)  │
│ ───────────────────────  1px rule        │
│ what was looked for and what was found   │
│ WHAT TO DO INSTEAD — …   (stamp scale)   │
└──────────────────────────────────────────┘
```

A gap block is **never** styled down to look less alarming than it is, and it is never
collapsed by default. The product's entire claim rests on this block being as loud as a fact.

---

## 3. Masthead + plate line

Shown in: `04-guide-masthead.png`, `14-guide-masthead-dark.png`.

Plate (the cover photo): `flex: 1 1 560px`, `min-height: clamp(300px, 50vh, 540px)`, square,
sunken bed (`--sunken`), `1px var(--rule2)` frame, **2px oxide corner ticks at all four
corners** (~18px arms). No graticule over photography — that was tried and cut; at card
scale it read as dirt on the lens.

Text column: `flex: 1 1 360px`, `align-content: end`. Kicker → title
`clamp(2.5rem, 6vw, 4.8rem)/0.98` → dek → chips (emergency numbers as `tel:` links in ochre,
currency, base).

Plate line beneath both: `border-top: 2px solid var(--accent)`, coordinates at
`clamp(1.3rem, 3vw, 2.2rem)` in oxide, plate stamp, fact/source counts, `PRINT SHEET`.

**Coordinates are structure, not decoration.** They are the largest non-title type on the
screen. Shrinking them to a caption is the single most likely drift in this whole redesign.

---

## 4. Tab rail

Sticky at `var(--hdr-h)`. **The header measures its own height into that variable on every
update and on resize** — do not hardcode the offset, and do not compute it once on mount. The
header's height changes with the theme toggle's label, the trip chip, and mobile chrome yield.

Pills, horizontally scrollable, `min-height: 44px`, active pill filled oxide with
`--on-aink` text.

---

## 5. Quick card (table view)

Shown in: `03-table-view.png`, `21-table-view-light.png`.

`2px solid var(--accent)`, square. Kicker is one of exactly three strings, chosen by date:
`ON THIS TRIP NOW` / `NEXT TRIP` / `MOST RECENT`. Then title, emergency numbers as tappable
`tel:` chips, currency, hazards, a ticking local clock, and `Open this sheet →`.

**No entrance animation anywhere on the table path.** This is the surface someone opens
standing in a train station with one bar of signal. Content is legible the instant it paints.

---

## 6. Status stamps

`COMPLETE` — `--green` outline · `IN PROGRESS` — oxide fill, `--on-aink` text ·
`UPCOMING` — oxide outline. Stamp typography (§2). Never a coloured dot without the word;
the word is the accessible carrier.

---

## 7. Tools

Shown in: `06-tools-trip-split.png`, `07-tools-closures.png`, `10-tools-jetlag.png`,
`11-tools-reminders.png`, `12-tools-route-order.png`.

All five tools are panel grids — no tool invents its own layout language. The tool rail is
pills (active oxide-filled) plus a trip `<select>`; both sit above the grid and both persist
across tool switches.

| Tool | Comes from | Never |
| --- | --- | --- |
| Trip split | your `trip-split/model/{money,settle,summary}.ts` | re-derive settlement in the UI |
| Jetlag | your `lib/jetlag.ts`, `lib/tz-offset.ts` | round the ±0.4h dead zone away |
| Closures | `data/holidays/{CC}-2026.json` + `lib/holidays.ts` | guess a country's holidays |
| Reminders | `checklist` arrays already in the guide JSON | author a checklist item |
| Route order | mapped points in the guide | present it as transit time |

**Seeded expenses carry `✓ FROM THE GUIDE`.** `basis:"day"` rows × days; `per:"group"` rows
stay one shared bill; everything else × party.

**One guard, one place.** Every entry into Tools loads the trip's data via `ensureGuide(slug)`
guarded **on the tools screen itself**, not at the four call sites. The call site that forgets
is the one that ships — and on mobile the ☰ menu is the only route in, so a miss there breaks
tools on phones entirely.

**Seeding must be provisional until the guide cache exists.** A seed built before the budget
section arrives has to be rebuilt when the real rows land, not memoised empty.

---

## 8. Globe

Shown in: `02-world-view.png`, `13-dark-world-view.png`.

`prototype/atlas-map.js` ships as-is. What must not be re-tuned:

- **Canvas, two layers, DPR capped at 2, redraw only when `_dirty`.** SVG was tried and could
  not hold frame rate at this node count.
- Visited countries `rgba(156,68,33,.32)` filled, `#9c4421` stroked.
- Terminator from the real subsolar point: `rgba(0,0,0,.34)` dark / `rgba(15,19,23,.20)` light.
- Route traverses: dashed `5,5`, `rgba(156,68,33,.72)`, **48 sample points** so they clip at
  the horizon, drawn in over 1400ms.
- Zoom clamp `0.9R`–`5R`; idle spin slows with zoom, pauses 2.6s on interaction;
  `flyTo` 1100ms shortest path.
- Pins: 2.4s pulse ring, 22px-radius hit circle (44px target), 7–9px dot.
- Events: `atlas-pos` per frame, `atlas-select` on click (`code: null` = no guide there).

Overlays scale `max(0.5, 1 - (zoom-1)*0.5)`, fade `max(0, 1 - (zoom-1)*0.85)`, and go
`pointer-events: none` below 0.15 opacity.

### Pin-card collision solver — do not simplify

Eight seats per card (above, below, right, left, then four diagonals), first clean seat wins,
tested against placed cards **and** every visible overlay panel. If no clean pass exists, the
whole pass re-runs with plate-bearing cards compacted (photo hidden) and the clean result
wins. Failing that, grid-search for lowest overlap.

**Greedy per-card solving does not work** — the first card's full-size claim starves the rest.
Cards ride pins on `translate3d` only, eased 0.16/frame. The solver runs in
`requestIdleCallback(220ms)`, only when the visible pin set changes or a card drifts >90px.
Never inside the frame loop.

---

## 9. Motion table

| Moment | Duration | Curve |
| --- | --- | --- |
| Cover supporting fade | 260ms | ease |
| Wordmark FLIP to header | 620ms | `cubic-bezier(.22,1,.36,1)` |
| Iris reveal (starts 380ms) | 780ms | cubic ease-out |
| Hub card → masthead FLIP | 850ms | `cubic-bezier(.22,1,.36,1)` |
| Section reveal (once, on intersect) | 700ms | `translateY(22px)` → 0 |
| Panel collapse | 340ms | `power2.inOut` |
| Mobile scrim | 220ms | ease |
| Mobile menu sheet | 320ms | `back.out(1.6)`, rows stagger 28ms |
| Pin sheet | 360ms | `power3.out` |
| Globe fly-to | 1100ms | eased, then 2.6s hold |
| Chrome yield | 280ms | `cubic-bezier(.22,1,.36,1)` |

**`prefers-reduced-motion` cuts, it does not soften.** Morph → cut, iris → instant swap,
reveals paint immediately, globe stops spinning. Press states survive: they are state, not motion.

---

## 10. Mobile thresholds

`YIELD_AT 80` · `RETURN_AT 24` · `JITTER 6` · `TOP_ZONE 140` ·
`AXIS_LOCK_PX 24` · `COMMIT_FRACTION 0.3` · `COMMIT_VELOCITY 0.5 px/ms` ·
rubber-band 0.28 capped 56px · finger tracking 0.9.

These are ported constants with model tests behind them in `src/features/mobile-nav/`. Wire
the new chrome to the existing models. Do not re-derive any of these numbers; the 6px jitter
floor in particular exists because scroll anchoring and lazy images produce a 1–3px rebound
every time a scroll settles, and the first implementation reset its accumulator on any upward
pixel and so could never yield at all.
