# Waypoint Design System

**Waypoint** is a static site of verified, personalized travel guides — a field instrument,
not a brochure. Every perishable fact traces to a primary source and the date it was checked,
and where research came up short the guide says so instead of filling the hole.

This folder is the design system the product builds from: tokens, foundations, the component
inventory, and full-screen recreations of the real surfaces.

---

## Sources

Everything here derives from material the team already owns. Nothing was invented for this
folder except where flagged.

| Source | What came from it |
| --- | --- |
| `github.com/Carlob2499/Trip-Guides` (branch `main`) | The whole product. Astro, static, deployed to GitHub Pages |
| `docs/design-handoff/DESIGN.md` (revision **R4**, 2026-08-06) | **The authority.** Token set, type scale, motion table, and every Named Rule with its reason |
| `docs/design-handoff/README.md` | Screen composition, state, and behaviour per surface |
| `docs/design-handoff/SPEC-COMPONENTS.md` | Exact measured values per component |
| `src/styles/*.css` (40 sheets) | The shipped cascade; `guide.css`, `masthead.css`, `mobile-nav.css` in particular |
| `src/features/mobile-nav/model/{rank,yield,gesture}.ts` | The phone's behaviour models and their thresholds |
| `src/features/trip-split/model/{money,records,settle}.ts` | The settlement engine |
| `src/content/guides/korea/` | The guide content the UI kits render |
| `public/icons/` | The app icons in `assets/` |

Live: `carlob2499.github.io/Trip-Guides/`

**Revision.** This folder is **R5**. It carries R4 whole and adds what the 2026 guide-UI
work settled — the spine rail, a lifted Day palette, container queries, and a four-tool set. Every
departure from R4 is listed under "R4 → R5" at the end of this file, and `HANDOFF.md` §9
carries the same list for the developer.

---

## Content fundamentals

Waypoint's copy is the product. The interface is mostly a frame for sentences that had to be
checked before they could be written.

**Voice: a surveyor's field note.** Plain, dated, and specific. It states what was found, when
it was found, and what to do when it wasn't.

- **Second person, no first person.** "Leave the base by 08:00." "Your third friend is in Tokyo
  Jul 11–13." The guide never says "I" or "we" — it is a record, not a correspondent.
- **Sentence case for prose, uppercase + tracking for data.** This is a hard split and it is
  load-bearing: uppercase Source Sans at .08–.3em tracking is the notation voice; sentence-case
  Literata is the reading voice. A label in Literata is a category error.
- **Lowercase dates in chrome.** `✓ checked 18 jul 2026`, `recorded 16 jul 2026`. Uppercased
  only when the whole stamp is uppercase.
- **Numbers carry their unit and their source.** "≈₩1,400", "₩1,461/$1, Fed H.10, 24 jul 2026".
  A bare number is not a fact yet.
- **Absence is stated, never smoothed.** "⚠ NOT CONFIRMED", "no local rate captured", "no public
  source". Then a line saying what to do instead: "What to do instead — call Gobang,
  042-863-2104, before you go in."
- **Hedges are typographic, not verbal.** `≈` for approximate and `⚠` for unconfirmed are
  tappable marks, not the words "roughly" or "we think".
- **No marketing register.** No "discover", "unlock", "seamless", "curated experience". The one
  place the product speaks about itself is the north-star line, and it speaks in facts:
  "Every perishable fact traces to a primary source and the date it was checked."
- **No emoji.** The glyph set is `✓ ⚠ ≈ ⠿ ＋ − ☰ ↗ → ← ▾` and it is notation, not decoration.
- **Panel kickers name the KIND, not the title.** FIELD NOTE, SIGHTS, LEDGER, SETTLE UP,
  EMERGENCY. The kicker is the only thing visible when a panel is collapsed.
- **Never fill a surface with prose to make it look finished.** An empty-feeling panel is a
  layout problem or an honest gap; it is not a content gap to pad.

---

## Visual foundations

**The north star: the surveyor's sheet.** Waypoint looks like something that was measured, not
something that was described. Paper that has been out in the field, carrying contour lines,
coordinates, dated marks, and annotations in iron-oxide pigment.

**The organizing tension: quiet paper, loud marks.** Every surface, ground and container stays
calm — flat, sage, hairline-separated. Every act of *notation* may be as large and as pigmented
as the moment deserves.

### Colour

Cool sage and ink with exactly one chromatic voice. Daylight is `#dfe3d9` paper, `#f8faf3`
cards, `#171d24` ink. The chart room is `#0f1317` slate, `#242c34` cards, `#e8ece3` paper.
Iron oxide `#9c4421` is the accent and **does not re-map between themes** — a guide's colour
is a fact about the guide, not about the reader's display. Only its ink re-maps
(`#80371b` → `#c78f78`).

Status is three pigments and no more: field green (done, confirmed), caution ochre (stale,
unconfirmed, advisory), emergency red (SOS only, never derived from a guide's accent).

**The Red Ink Rule.** One red-ink moment per viewport, spent in exactly four places: a plate
line, a gap, a stale warning, SOS. A system with no defined maximum takes its maximum from the
category default.

R5 allows **one second moment: the present**. The live band on the day you are reading — what
is happening now and when it ends — may take reading-scale accent alongside one of the four.
Nothing else qualifies: not the current day chip, not a "you are here" dot, not a countdown on
a future day. If a screen has to choose, the present wins and the other four stand down.

The rule governs **reading-scale** accent — the loud moments. It does not govern the 10px
panel kicker, which is notation, not emphasis, and appears on every panel by design.

**The Scale Before Frequency Rule.** When the accent needs to be louder, make it *bigger* —
never more frequent, never a deeper ground tint. One display-scale mark spends less attention
than six control-scale accents, and it spends zero contrast budget.

### Type

Two faces, no third, no monospace. **Literata** for display and body; **Source Sans 3** for
data, labels and all notation. Tabular numerals do the alignment a mono would otherwise be
hired for. Nine roles, from Panel kicker (0.625rem/.22em) to Display (clamp to 4.8rem). The
notation layer spans Nano to Reading — smallness is not what identifies a mark as notation;
the data face, the tracking, and the stamp grammar are.

### Backgrounds and imagery

Flat colour. No gradients, no full-bleed aspirational photography, no textures, no patterns,
no illustration. Photography enters in exactly one way: **mounted as a plate** — square,
seated on the sunken surface, framed in 1px `--rule2`, with 2px oxide corner ticks at all four
corners. Type never sits on a photograph, scrims are banned, and graticules over guide
photography were tried and cut (at card scale they read as dirt on the lens). The globe keeps
its graticule because there it *is* the map.

Photography is real Wikimedia Commons imagery from each guide's own JSON, carrying its credit.
Where an image has not been placed yet, a striped placeholder with a monospace-voice caption
stands in — a placeholder is better than a bad attempt at the real thing.

### Elevation, borders, corners

Near-flat and tonal first. Depth comes from the three-surface ramp — sunken, page, card — and
from two hairline weights: `--rule` quiet, `--rule2` assertive. Shadows are a response, never
a resting state: rest `0 1px 3px/.06`, hover lift `0 8px 28px/.14` with `translateY(-4px)`,
bottom sheet `0 -12px 34px/.24` throwing upward, overlay `0 14px 40px`, focus a deliberately
offsetless `0 0 0 3px rgba(156,68,33,.22)` halo.

**Radius is binary.** `0` on anything that holds content or evidence; `999px` on anything you
press. There is no 4px, 8px or 12px anywhere in this product — a rounded card is the single
fastest way to make this design stop looking like itself.

### Motion

An instrument settling, not an interface performing. `cubic-bezier(.22,1,.36,1)` on entrance,
GSAP `power2.inOut` for collapse, `back.out(1.6)` for arrivals. The full table is in
`tokens/motion.css` and `guidelines/motion.html`: scrim 220ms, fade 260ms, chrome yield 280ms,
menu 320ms, collapse 340ms, sheet 360ms, reveal 700ms, wordmark FLIP 620ms, iris 780ms, plate
morph 850ms, globe fly 1100ms, rows stagger 28ms.

Nothing animates `left`/`top`/`width`/`height` on a per-frame path — transform and opacity
only. Height animates once, on collapse, and the grid re-measures on the tween's update tick,
not on complete, or the row height lags a frame and the page jolts at the end of every collapse.

`prefers-reduced-motion` **disables** motion rather than softening it. Press states survive:
they are state, not motion.

### Interaction states

- **Hover** (desktop only): the lift shadow with a 4px rise on cards; on controls, the border
  goes `--rule` → `--accent` and the ink goes `--muted` → `--ink`. Never an opacity fade — a
  faded control reads as disabled.
- **Press**: no shrink, no bounce. The fill deepens to the accent and the ink flips to
  `--on-aink`. Press is state and survives reduced motion.
- **Focus**: a 2px accent outline at 2px offset plus the halo. Offsetless by design, so it
  reads on a square container without implying a radius.
- **Active/selected**: filled oxide with `--on-aink` text. Never a coloured dot without the
  word — the word is the accessible carrier.
- **Disabled**: `--muted` ink, `--rule` border, no fill. Rare; prefer removing a control.

### Transparency and blur

Almost none. `color-mix` against `--accent` at low percentages for halos and pin rings;
scrims behind sheets at `rgba(10,12,14,.5)`. **No backdrop-filter anywhere** — it costs frames
on the phones this is read on, and a blurred instrument is a contradiction.

### Layout rules

One wide shell (1400px) holding a narrower reading column (42rem) for prose; everything else
in the panel grid. Sticky offsets are measured, never literal. Every fixed edge pads with
`max(reserved, var(--safe-*))`. Desktop margins carry marginalia; mobile folds them inline at
unchanged scale — notation never shrinks to fit, it relocates.

---

## Iconography

**There is no icon library, and that is deliberate.** The product draws its marks from Unicode
and from CSS primitives, so nothing has to load before a mark can render and every glyph
inherits the notation face and its tracking.

| Glyph | Job |
| --- | --- |
| `✓` | Checked / confirmed / done. Always paired with a date or a word |
| `⚠` | Unconfirmed, stale, advisory. Always ochre, never below Control size |
| `≈` | Approximate. Tappable, opens the provenance popover |
| `⠿` | The panel drag handle |
| `−` `+` | Panel collapse / expand |
| `＋` | New guide, add expense (fullwidth plus, not ASCII) |
| `☰` | The mobile map menu, in a 52px button |
| `↗` | Leaves the product (source links, OPEN IN MAPS) |
| `→` `←` | Navigation within the product |
| `▾` | A fold opens in place |

**CSS primitives, not SVG:** the benchmark mark is a 26×23px oxide triangle built from
borders with a 6px `--bg` dot; the provenance dot is a 1em bordered circle; corner ticks are
2px oxide borders on pseudo-elements; the compass rose and scale bar are drawn on the globe's
canvas. No hand-drawn SVG icons exist in the product and none should be added.

**Emoji are never used.**

**App icons** live in `assets/icons/` — `favicon.svg`, `icon-192.png`, `icon-512.png`,
`apple-touch-icon.png`, copied from the repo's `public/icons/`.

**No logo file exists in the sources.** The wordmark is set in type — `WAYPOINT`, Source Sans 3
700, `letter-spacing: .24em` — beside the benchmark triangle. Do not draw a mark; set the
name.

---

## Index

| Path | What it is |
| --- | --- |
| `styles.css` | The entry point. Link this one file; it imports everything below |
| `tokens/colors.css` | Palette, three themes, the three-jobs accent contract |
| `tokens/typography.css` | Nine type roles + ready-made `.wp-*` classes |
| `tokens/spacing.css` | Shell, measure, panel grid, tap targets, safe-area insets |
| `tokens/elevation.css` | The five shadows and the focus ring |
| `tokens/motion.css` | Easings, the duration table, the reduced-motion cut |
| `tokens/shape.css` | Radius (binary), corner-tick geometry |
| `tokens/fonts.css` | Literata + Source Sans 3 |
| `guidelines/*.html` | Foundation specimen cards — colour, type, notation, motion, shape |
| `components/panel/` | `Panel` — the one repeated unit |
| `components/notation/` | `ProvenanceDot`, `FlagChip`, `Stamp`, `Reading`, `GapBlock` |
| `components/plate/` | `Plate`, `PlateLine` |
| `components/controls/` | `Button`, `TabPill`, `Segmented`, `StatusStamp` |
| `components/navigation/` | `SpineRail`, `ThumbBar`, `DayScrubber` |
| `ui_kits/guide-sheet/` | The guide, desktop and phone |
| `ui_kits/atlas-hub/` | Cover → world → table |
| `ui_kits/tools/` | Split, closures, reminders, route |
| `assets/icons/` | App icons from the repo |
| `HANDOFF.md` | The developer handoff for the R5 guide work |
| `github.md` | Source-repo association and sync record |

Working prototypes, kept at the project root: `Waypoint Guide Desktop.dc.html`,
`Waypoint Guide Mobile.dc.html`, `Waypoint Guide Tablet.dc.html`, `Waypoint Arrival.dc.html`,
`Waypoint Guide.dc.html` (the combined canvas).

---

## Intentional additions

Three components have no counterpart in R4 because the surfaces they serve were designed in
this cycle. Each is listed in `HANDOFF.md` §9 as a departure.

- **`SpineRail`** — replaces the tab-pill rail. Every group is a station on one 2px line, the
  current one filled oxide with a halo. It keeps the "where am I on the journey" read while
  claiming no column.
- **`ThumbBar`** — the phone's four-slot command layer, running on the shipped
  `mobile-nav/model/rank.ts` rather than a fixed list.
- **`DayScrubber`** — all eight days fitted without scrolling; the active day expands to keep
  its date, the rest are numerals.

---

## R4 → R5

| Change | Why |
| --- | --- |
| **Spine rail replaces the tab-pill rail** | Eleven-plus groups overflowed a pill rail. Stations on a line carry ordinal position, which pills never did |
| **Day's contrast lifted; no third palette** | A Glare theme was built and then cut. A third palette is a third contrast surface for the gates to police and one nobody remembers to switch into. Day's paper is lighter and its ink and rules darker instead, so the palette people actually read on is the one that holds up outdoors |
| **The phone uses a pill row, not the spine rail** | Thirteen stations do not fit a 402px line, and a rail whose ends you cannot see stops being a rail. The pills swipe; a 2px progress line under them carries the ordinal position the rail was giving up. The spine rail stays on tablet and desktop |
| **Guide numbering retired** | `SHEET 02` / `PLATE 02 — KR` carried no information a traveller uses. The cities and the dates say more in the same space. Numbering survives only where it is an index — the hub's own list |
| **Trip Split ships empty** | An estimate is not a debt. The guide's budget forecast stays in Money & budget, labelled a forecast, and is never seeded into the ledger. The empty state — `$0.00`, no nets, "nothing recorded yet" — is the first-run state and is built, not designed around |
| **A second red-ink moment: the present** | The live band on the day you are reading may take reading-scale accent alongside one of the four. Nothing else qualifies |
| **Container queries replace the 760/900/620 breakpoints** | One build serves phone, tablet and desktop with no device check |
| **Four tools, not five** | Jetlag's one useful output is a fact about the flight, so it moved into the Plan group where it is read once before departure |
| **Field log is its own station** | Retrospective content should not sit in front of a traveller mid-trip |
| **One tools entry point** | R4's four entry points each needed the same guard; the one that forgets is the one that ships |
| **Trip Split is NOT seeded from the budget** | An estimate is not a debt. Seeding "meals per day, $32" produces a settle-up demanding transfers for money nobody spent. The forecast stays in the budget panel, labelled as a forecast |

Unchanged and reaffirmed: the panel and its grid, the plate and its corner ticks, the notation
family, the gap block, the three-jobs accent contract, binary radius, the motion table, the
reduced-motion cut, the safe-area contract, and every Named Rule in R4.
