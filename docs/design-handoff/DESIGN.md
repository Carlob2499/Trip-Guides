---
name: Waypoint
description: Verified, personalized travel guides that show their work — a field instrument, not a brochure.
revision: R5 — the guide-UI revision, 2026-08-11 (see the R5 section at the foot of this file; R4 front-matter values below are superseded where it says so)
colors:
  survey-paper: "#dfe3d9"
  survey-paper-sunken: "#d2d7c8"
  card-paper: "#f8faf3"
  map-ink: "#171d24"
  ink-muted: "#4e5747"
  hairline: "#bec6b2"
  hairline-strong: "#a3ac98"
  surveyors-red-oxide: "#9c4421"
  accent-ink: "#80371b"
  accent-ink-dark: "#c78f78"
  on-accent: "#f0d2c7"
  field-green: "#396345"
  field-green-dark: "#6aab76"
  caution-ochre: "#7f4a07"
  caution-ochre-dark: "#d9923f"
  emergency-red: "#b3261e"
  emergency-red-dark: "#ef5350"
  chart-room-slate: "#0f1317"
  chart-room-sunken: "#1a2129"
  chart-room-card: "#242c34"
  lamplit-paper: "#e8ece3"
  lamplit-muted: "#9aa392"
  hairline-dark: "#38414b"
  hairline-strong-dark: "#4e5865"
cssVariables:
  "--bg": "page ground — survey paper / chart-room slate"
  "--card": "card, panel, and sheet ground"
  "--sunken": "wells, inset panels, and the bed a plate is mounted in"
  "--ink": "primary text"
  "--muted": "secondary text, meta, inactive controls"
  "--rule": "quiet 1px hairline"
  "--rule2": "assertive 1px hairline — also the graticule and datum colour"
  "--aink": "accent doing the text job (re-maps by theme)"
  "--on-aink": "text on an accent fill (never re-maps)"
  "--green": "confirmed, complete, on-plan"
  "--ochre": "stale, unconfirmed, advisory"
  "--cta": "primary button ground"
  "--cta-ink": "primary button text"
  "--safe-top / --safe-bottom / --safe-left / --safe-right": "display-cutout insets, sourced from env() at :root"
  "--hdr-h": "measured sticky-header height, written by JS for sticky offsets"
typography:
  display:
    fontFamily: "'Literata', Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.5rem, 6vw, 4.8rem)"
    fontWeight: 640
    lineHeight: 0.98
    letterSpacing: "-0.014em"
  headline:
    fontFamily: "'Literata', Georgia, serif"
    fontSize: "clamp(1.5rem, 4vw, 2.2rem)"
    fontWeight: 400
    lineHeight: 1.15
  title:
    fontFamily: "'Literata', Georgia, serif"
    fontSize: "1.45rem"
    fontWeight: 500
    lineHeight: 1.15
  body:
    fontFamily: "'Literata', Georgia, serif"
    fontSize: "1.02rem"
    fontWeight: 400
    lineHeight: 1.72
  reading:
    fontFamily: "'Source Sans 3', -apple-system, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 1.2rem + 2.4vw, 2.6rem)"
    fontWeight: 640
    letterSpacing: "0.01em"
    fontVariantNumeric: "tabular-nums"
  stamp:
    fontFamily: "'Source Sans 3', -apple-system, system-ui, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 640
    letterSpacing: "0.08em"
  control:
    fontFamily: "'Source Sans 3', -apple-system, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 640
    letterSpacing: "0.08em"
  panel-kicker:
    fontFamily: "'Source Sans 3', -apple-system, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 640
    letterSpacing: "0.22em"
    textTransform: "uppercase"
  label:
    fontFamily: "'Source Sans 3', -apple-system, system-ui, sans-serif"
    fontSize: "0.66rem"
    fontWeight: 640
    letterSpacing: "0.16em"
rounded:
  none: "0px"
  sm: "6px"
  md: "10px"
  lg: "16px"
  pill: "999px"
motion:
  ease-enter: "cubic-bezier(.22,1,.36,1)"
  ease-inout: "power2.inOut (GSAP)"
  ease-arrive: "back.out(1.6) (GSAP)"
  reveal: "0.7s — entrance rise, once, on intersect"
  collapse: "0.34s — height + opacity"
  morph: "0.85s — plate to masthead (FLIP)"
  globe-fly: "1.1s — eased rotation and scale, then a 2.6s hold"
components:
  panel:
    backgroundColor: "{colors.card-paper}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.none}"
    padding: "16px 20px 18px"
    collapsedPadding: "12px 16px"
  plate:
    backgroundColor: "{colors.survey-paper-sunken}"
    border: "1px solid {colors.hairline-strong}"
    rounded: "{rounded.none}"
    cornerTicks: "2px {colors.surveyors-red-oxide}, 12–16px arms"
  stamp:
    textColor: "{colors.accent-ink}"
    typography: "{typography.stamp}"
    border: "1px solid currentColor"
    rounded: "{rounded.none}"
    padding: "2px 7px"
  provenance-dot:
    size: "1em"
    border: "1px solid {colors.hairline-strong}"
    hoverColor: "{colors.surveyors-red-oxide}"
    rounded: "{rounded.pill}"
  flag-chip:
    textColor: "{colors.caution-ochre}"
    border: "1px solid currentColor"
    rounded: "{rounded.pill}"
    padding: "2px 9px"
  cta-primary:
    backgroundColor: "{colors.chart-room-slate}"
    textColor: "{colors.card-paper}"
    rounded: "{rounded.pill}"
    padding: "13px 26px"
    minHeight: "46px"
  tab-pill:
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
    minHeight: "40px"
  tab-pill-active:
    backgroundColor: "{colors.surveyors-red-oxide}"
    textColor: "{colors.on-accent}"
---

# Design System: Waypoint

## Overview

**Creative North Star: "The Surveyor's Sheet"**

Waypoint looks like something that was measured, not something that was described. The
governing image is a survey sheet: paper that has been out in the field, carrying contour
lines, coordinates, dated marks, and annotations in iron-oxide pigment.

The organizing tension is **quiet paper, loud marks**. Every surface, ground, and container
stays calm — flat, sage, hairline-separated. Every act of *notation* — a coordinate, a
verification date, a source stamp, an `≈`, a `⚠`, a "we could not confirm this" — may be as
large and as pigmented as the moment deserves. The notation layer is the one thing
competitors structurally cannot copy, because they have nothing to notate.

The product has three faces and they share one vocabulary:

- **The cover** — a still sheet carrying the wordmark, opening into the atlas.
- **World view** — a drawn globe with the trips pinned on it, surrounded by sheet furniture
  (compass rose, scale bar, legend, chronology, index).
- **Table view** — the same record with the instrument removed: search, sticky chips, and a
  quick card for the trip you are on. The daylight, in-transit surface.

Everything below the hub — guide sheets, tools — is built from one repeated unit, the
**panel**. Getting that unit right is most of the system.

**Key Characteristics:**

- Cartographic, not editorial: paper and ink, contour structure, coordinates, dated marks.
- Quiet paper, loud marks: grounds never shout; notation may reach display scale.
- Photography enters only as a **plate** — mounted square into the sheet, never as a backdrop.
- One serif doing two jobs; one sans running from nano stamps to display-scale readings.
- Per-country accent as identity data, never re-mapped by theme.
- Every panel collapses and moves; the grid never leaves a hole.

### Named Rules

**The Quiet Paper, Loud Marks Rule.** Surfaces, containers, and grounds are calm; notation is
emphatic. If it is a *place content sits* (card, panel, sheet, background), it stays flat and
hairlined; if it is a *mark the surveyor made* (reading, stamp, flag, datum label, plate
line), it may take pigment and scale.

**The Red Ink Rule.** Maximum is iron-oxide notation at display scale on bare paper. It is
spent in exactly four places: the plate line of a masthead, a **gap** (research came up short
and the guide says so), a **stale or unconfirmed warning**, and the SOS affordance. One
red-ink moment per viewport. The rule exists because a system with no defined maximum takes
its maximum from the category default.

**The Two Doors Rule.** Every destination in the product is reachable from both an immersive
door and a plain one — globe pin *and* table row, atlas menu *and* header control. The
immersive surface is never the only way in, because the dominant read is mid-trip, on a
phone, in sunlight, in a hurry.

## Colors

A cool sage-and-ink ground with exactly one chromatic voice per guide layered on top. **The
token set is fixed and contrast-derived by code.** Consume it through the CSS variables in the
frontmatter, never as literals — the one exception is `#9c4421` itself, which is identity
data and is deliberately the same value in both themes.

### Primary

- **Surveyor's Red-Oxide** (`#9c4421`): the house accent and the shape every per-country
  accent takes. Fills the active tab, plate lines, corner ticks, focus rings, panel kickers,
  and large display marks. Deliberately **not** contrast-gated, because it is never small text.
- **Accent Ink** (`--aink`, `#80371b` light / `#c78f78` dark): the accent doing the *text* job,
  derived to clear 4.5:1 on every surface the site paints, flat or accent-tinted.
- **On-Accent** (`--on-aink`, `#f0d2c7`): text sitting *on* an accent fill. One correct answer
  per accent, identical in both themes, because its ground never re-maps.

### Neutral — daylight / chart room

`--bg` page, `--card` panels, `--sunken` wells and plate beds, `--ink` primary text,
`--muted` secondary, `--rule` / `--rule2` the two hairline weights. In the chart room these
resolve to slate `#0f1317`, card `#242c34`, sunken `#1a2129`, lamplit paper `#e8ece3`, muted
`#9aa392`, rules `#38414b` / `#4e5865`.

### Tertiary — status

- **Field Green** (`--green`): done, confirmed, on-plan, field-tested.
- **Caution Ochre** (`--ochre`): stale, unconfirmed, advisory, hazard. The pigment of the `⚠`
  flag and the gap, and it may render at display scale when the traveller must not miss it.
- **Emergency Red**: the SOS affordance only, never derived from a guide's accent.

### Named Rules

**The Three Jobs Rule.** An accent has three jobs and they are three different colours:
identity (`#9c4421`), accent-as-text (`--aink`), text-on-accent (`--on-aink`). Never hand-blend
a fourth at a call site — a `color-mix` invented in a rule carries no contrast contract.

**The Identity Doesn't Theme Rule.** `--accent` is the same value in light and dark. Only its
*ink* re-maps. A guide's colour is a fact about the guide, not about the reader's display.

**The Tinted Ground Rule.** Never tint a background more than 18% toward the accent; every
accent-ink is derived against the flat surface *and* that surface tinted to the ceiling.

**The Scale Before Frequency Rule.** When the accent needs to be louder, make it *bigger*,
never more *frequent* and never a deeper ground tint. One display-scale mark spends less
attention than six control-scale accents, and it spends zero contrast budget.

**The Honest Absence Rule.** When a figure cannot be sourced, the interface says so in ochre
rather than filling the hole — "no local rate captured", "no public source", "⚠ unconfirmed".
Silence reads as an oversight; a stated absence reads as rigour.

## Typography

**Display + body:** Literata. **Data, labels, and all notation:** Source Sans 3. Two faces,
no third, no monospace — tabular numerals do the alignment a mono would otherwise be hired for.

### Hierarchy

- **Display** (640, `clamp(2.5rem, 6vw, 4.8rem)`): the masthead title. One per page.
- **Reading** (640, `clamp(1.5rem, 1.2rem + 2.4vw, 2.6rem)`, tabular): coordinates, dates, and
  measurements at heading scale — plate lines, gaps, totals. Floors at 24px.
- **Headline** (400, `clamp(1.5rem, 4vw, 2.2rem)`): category titles.
- **Title** (500, `1.45rem`, fixed): panel and card titles.
- **Body** (400, `1.02rem`, 1.72): all prose.
- **Stamp** (640, `0.82rem`, `0.08em`, uppercase, boxed in 1px of its own ink): source stamps,
  check dates, plate captions, datum labels. The workhorse of the notation layer.
- **Control** (640, `0.75rem`, `0.08em`): tabs, buttons, pills, badges.
- **Panel kicker** (640, `0.625rem`, `0.22em`, oxide): the type label at the head of every
  panel — FIELD NOTE, SIGHTS, LEDGER, SETTLE UP. It is what makes a wall of panels legible at
  a glance.
- **Label / Nano** (`0.66rem` and below): chrome only — credits, counters, section kickers.
  Verification marks never live here.

### Named Rules

**The Notation Ladder Rule.** The notation layer spans Nano to Reading — smallness is not what
identifies a mark as notation; the data face, the tracking, and the stamp grammar are. Any
flag (`≈`, `⚠`) the reader can tap renders at Control size or larger, never below.

**The Fluid Headings, Fixed Text Rule.** The heading band clamps; body and UI text never do.
Every clamp's middle term carries a rem component, so the reader's own font-size setting still
moves the type (WCAG 1.4.4).

**The 24px Grading Rule.** Headings are weight 400–500, which puts their WCAG large-text line
at 24px rather than 18.7px. Every heading step stays above it; card titles are a fixed
`1.45rem` rather than fluid for exactly this reason.

**The Kicker Before Title Rule.** Every panel leads with its type kicker, then its title. The
kicker is the only thing visible when a panel is collapsed, so it must name the *kind* of
thing inside, not repeat the title.

## Layout

A single wide shell (`max-width: 1400px`) holding a narrower reading column (`--read: 42rem`)
for prose. Everything that is not prose lives in the **panel grid**.

**The panel grid** is the layout primitive:

```
display: grid;
grid-template-columns: repeat(auto-fit, minmax(min(100%, 340–460px), 1fr));
grid-auto-flow: row dense;
gap: 16–18px;
align-items: stretch;
```

Three behaviours make it gap-free:

1. **Stretch, don't stagger.** Panels fill their row's height, so a short panel expands to meet
   a tall neighbour instead of leaving a ragged shelf beneath it.
2. **Collapsed sorts after open.** A collapsed panel is a title bar; pairing one with a full
   panel is what actually creates dead space. Sorting collapsed panels to the end keeps every
   row homogeneous.
3. **Wide types claim the full row.** Sights, venues, day rails, ledgers, charts, and long
   reference lists span `1 / -1` — they are internally gridded already.

**Breakpoints** are narrow on purpose: **760px** is the mobile/desktop split for behaviour
(pin cards, rails, and the segmented switch), **900px** for the guide shell, **620px** for the
compass position. Sticky offsets are never literals — the header measures itself into
`--hdr-h` and the rails stick to that.

**Display cutouts** are first-class: `viewport-fit=cover`, the four `--safe-*` variables
declared once at `:root` from `env()`, and every fixed or sticky edge padded with
`max(reserved, var(--safe-*))`.

### Named Rules

**The Homogeneous Row Rule.** Never let a collapsed panel share a row with an open one. Sort
by state before you sort by order. This is the whole answer to "why is there dead space".

**The Measured Chrome Rule.** Any element that sticks below another writes and reads a measured
height variable. A hardcoded `top:` value is a bug waiting for the next padding change.

**The Reserved Inset Rule.** Cutout padding is `max(reserved, env())`, never `env()` alone —
an environment that reports zero must still leave the reserved gap.

**The Load-Bearing Margin Rule.** Desktop margins carry marginalia; mobile folds them inline at
unchanged scale. Notation never shrinks to fit — it relocates.

## Elevation & Depth

Near-flat, and tonal first. Depth comes from the three-surface ramp — sunken, page, card — and
from 1px hairlines. Shadows are a *response*, not a resting state.

One element goes *down* instead of up: the plate. A photograph is mounted into the sheet —
seated on the sunken surface, framed in 1px `--rule2` with oxide corner ticks — rather than
floated above it. Mounting is tonal and linear, never shadowed.

### Shadow Vocabulary

- **Rest**: `0 1px 3px rgba(16,20,24,.06)` — present, not visible.
- **Hover lift**: `0 8px 28px rgba(16,20,24,.14)` with `translateY(-4px)`.
- **Sheet**: `0 -12px 34px rgba(16,20,24,.24)` — bottom sheets, throwing upward.
- **Overlay**: `0 14px 40px` — menus, popovers, modals.
- **Focus ring**: `0 0 0 3px rgba(156,68,33,.22)` — a halo, deliberately offsetless.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. A shadow appears only as a response to
state or as a signal of stacking order.

**The Mounted, Not Floating Rule.** Evidence (photographs, maps, scans) is set *into* the
sheet — sunken bed, hairline frame, corner ticks, zero shadow. UI floats; evidence is fixed.

## Shapes

Three families and nothing between them. **Controls are pills** (`999px`) — anything tappable
is legible as tappable in peripheral vision. **Containers are square** — panels, cards, sheets,
and menus take `0px`, because the sheet is made of rectangles. **Evidence is square too**, but
distinguished by its furniture: a 1px `--rule2` frame and 2px oxide corner ticks. Nothing else
in the system carries corner ticks, so corner ticks *mean* record.

Borders are `1px` and do real work; two hairline weights let a border be quiet (`--rule`) or
assertive (`--rule2`) without inventing a third colour. Tap targets are never below 44px.

### Named Rules

**The Corner Tick Rule.** Oxide corner ticks mark evidence and nothing else. A photograph
without them has not been placed yet; a UI panel with them is lying about what it contains.

**The No Overlay On Photography Rule.** Scrims are banned, and so are graticules over guide
photography — the frame, the ticks, and the plate line carry the instrument. (The globe is the
exception: its graticule is the map, not an overlay on one.)

## Components

### The panel — the repeated unit

Every card in the product, in guides and tools alike, is the same component: kicker + title,
a drag handle (`⠿`), a collapse control (`−`/`+`), and a body. Order and collapse state persist
per scope. A panel is square, `--card` ground, 1px `--rule`, and stretches to its row.

### The plate — photography and the masthead

A guide's cover photograph is mounted as a numbered survey plate: square, sunken bed, hairline
frame, oxide corner ticks, and a **plate line** beneath it on bare paper carrying the plate
number, coordinates at Reading scale, and a boxed `CHECKED [date]` stamp. Type never sits on
the photograph. The plate is also the shared element that morphs from hub card to guide
masthead; under reduced motion the morph is a cut.

### The globe — world view

An orthographic canvas globe drawn from real geometry: graticule, index contours, country
fills with visited countries inked in oxide, a day/night terminator from the true solar
position, dashed great-circle traverses from the home base, a compass rose whose needle swings
to the selected sheet, and a scale bar that re-rounds as you zoom. Pins are pulsing oxide
markers with 44px targets; on desktop they carry cover-plate cards that resolve their own
collisions, and on mobile they are bare pings that raise a bottom sheet.

### The notation family — dot, chip, stamp, reading

Four sizes of the same idea. **Provenance dot** — a 1em inline mark after a perishable fact,
opening a popover with the claim, its check date, its source, and a **staleness reading**
computed from the fact's own shelf life. **Flag chips** (`≈ approx.`, `⚠ unconfirmed`) at
Control size, tappable. **Stamps** for dates and sources. **Reading** scale for mastheads,
totals, and gaps.

### The gap — signature state

Where research came up short, the guide says so loudly: `NOT CONFIRMED` at Reading scale in
ochre on bare paper, a datum rule, then a Stamp-scale line stating what was checked, when, and
what to do instead. This is also the error-recovery register.

### Table view — the transit surface

Search across every guide's sections, sticky sheet chips, and a quick card for the trip you
are on or about to take, carrying its emergency numbers, currency, and hazards with the local
time ticking. No entrance animations here — content is legible the instant it paints.

### Tools

Trip split, jetlag, closures, reminders, and route order, all built from panels and all seeded
from the guide's own record — split reads the budget rows and party size; closures read the
sights section; route reads the mapped points. Reachable from the hub header, the guide header,
the table view, and the mobile map menu, with a trip selector in the tool rail.

### Named Rules

**The Seeded From The Record Rule.** A tool never asks for data the guide already has. If it
cannot find the record, it says so and offers to load it — it does not silently start empty.

**The One Unit Rule.** New surfaces are assembled from panels, not from bespoke cards. If a
layout needs something a panel cannot do, extend the panel.

## Motion

Motion is an instrument settling, not an interface performing. Everything uses
`cubic-bezier(.22,1,.36,1)` on entrance and GSAP for anything that needs sequencing.

- **Cover → atlas**: supporting type drops, the wordmark FLIPs into the header, then the cover
  opens a circular iris from the centre while the globe flies in beneath.
- **Reveals**: a single 0.7s rise per element, once, on intersect — never on the transit path.
- **Collapse**: 0.34s height + opacity, with the grid re-measuring as it runs.
- **Globe**: idle spin that slows as you zoom, 1.1s eased fly-to, then a hold so you can read.
- **Cards on the globe** ride their pins on the compositor — transform only, never `left`/`top`.

### Named Rules

**The Reduced-Motion Is Off, Not Softer Rule.** `prefers-reduced-motion` disables animation
entirely — the morph becomes a cut, the iris becomes an instant swap, reveals paint immediately.
Press states stay, because they are state, not motion.

**The Composited Motion Rule.** Anything that moves every frame moves by `transform` with
`will-change`. Layout-triggering properties are never animated, and per-frame solvers run in
idle time, not in the event handler.

## Do's and Don'ts

### Do

- **Do** build new surfaces from panels, and let the grid stretch and dense-pack them.
- **Do** mount every photograph as a plate: square, hairline-framed, corner-ticked, captioned.
- **Do** render verification marks at Stamp scale by default, Reading scale in mastheads and gaps.
- **Do** spend the one red-ink moment per viewport on a plate line, a gap, a stale warning, or SOS.
- **Do** reach for a CSS variable, never a hex literal — the themes swap underneath you.
- **Do** state an absence in ochre when a figure cannot be sourced.
- **Do** give every immersive entry point a plain-surface twin.
- **Do** pad every fixed edge with `max(reserved, var(--safe-*))`.

### Don't

- **Don't** put a scrim on a photograph, or set type on one.
- **Don't** invent an accent shade at a call site, or tint a ground past 18%.
- **Don't** re-map `--accent` for dark mode — only its ink re-maps.
- **Don't** let a collapsed panel share a row with an open one.
- **Don't** hardcode a sticky offset; measure it.
- **Don't** render a tappable flag below Control size, or a gap quieter than Reading-scale ochre.
- **Don't** put corner ticks on anything that isn't evidence.
- **Don't** animate `left`/`top`, or run a layout solver inside a scroll or pointer handler.
- **Don't** soften motion for reduced-motion users — disable it.
- **Don't** introduce a second sans, a monospace, or a display face.
- **Don't** use cream paper, full-bleed aspirational photography, or script display type.
- **Don't** reach for SaaS-dashboard defaults: a blue primary, a uniform card grid as page
  structure, one neutral sans everywhere, or a gradient CTA.

## Change Ledger: R3 → R4

What this revision codifies that the previous document did not.

### New, and additive to the doctrine

- **The panel** as the single repeated unit, with collapse, drag-reorder, persisted order, and
  the three gap-free behaviours. Previously each surface invented its own card.
- **The panel kicker** type role (`0.625rem`, `0.22em`, oxide) — the label that makes a
  collapsed panel readable.
- **The globe** and its furniture (compass rose, scale bar, terminator, traverses, legend,
  chronology) as a named surface with its own rules.
- **Table view** as the stated transit surface, and **The Two Doors Rule** that requires it.
- **The Honest Absence Rule**, **The Seeded From The Record Rule**, **The Homogeneous Row Rule**,
  **The Measured Chrome Rule**, **The Reserved Inset Rule**, **The Corner Tick Rule**,
  **The Composited Motion Rule**.
- **Motion** promoted to a section of its own with a named easing set.
- **Display-cutout handling** as a layout concern rather than an afterthought.

### Changed from R3

- **Graticules came off guide photography.** R3 put a coordinate grid on the plate; in practice
  it read as clutter on a small card. The frame, ticks, and plate line carry the instrument
  instead. The globe keeps its graticule, because there it *is* the map.
- **Containers went square.** R3 had a radius ladder (6/10/16px) for panels and cards. The
  shipped system uses square containers and reserves radius for pills, which made "pill means
  tappable" unambiguous.
- **Control type dropped** from `0.82rem` to `0.75rem` with tighter tracking, and Label moved to
  `0.66rem`, once the panel kicker took over the labelling job.

### Would require rework to adopt elsewhere in the repo

- Any surface still using bespoke cards needs converting to panels (mechanical, but wide).
- Sticky offsets currently written as literals need the measured-variable treatment.
- Fixed-edge components need the `max(reserved, env())` inset pass.
- Photography components still emitting a graticule overlay need it removed.

---

## R5 — the guide-UI revision (2026-08-11)

`docs/design-handoff/design_handoff_guide_ui/SUPERSEDES.md` is the authority for everything in
this section; what follows records each of its rows here so this file is not read as current
where R5 has overtaken it. The front-matter above still carries R4's colour values — those are
superseded by row 2 below, and the shipped values live in `src/styles/base.css`, which is the
one place a token value is ever true.

### 1. Navigation

| R4 | R5 |
| --- | --- |
| Tab rail of scrollable pills, active pill filled oxide | **Spine rail** — every group is a station on one 2px line, the current station a filled oxide dot with a halo, a context line beneath carrying the active group's descriptor and the resume line |
| One rail at every viewport | Spine on **tablet and desktop**; a swipeable **pill row with a 2px progress line** on the **phone** |
| Tools reachable from four entry points | **One** — Tools is the **last station on the rail**. The standalone `/tools/<trip>/` screen is deleted |
| Field log inline at the bottom of the guide body | Field log is **its own station**, after Sources |
| Breakpoints 760 / 900 / 620 | **Container queries at 744 and 1180** for the guide body; viewport media queries for page chrome only |

### 2. Palette

Day lightened and its ink darkened: `--bg #e3e7dc` · `--card #fbfcf6` · `--sunken #ced5c4` ·
`--ink #0f141a` · `--muted #3c4534` · `--rule #a9b39b` · `--rule2 #8a9480`. The palette people
read on is the one that has to hold up in direct sun. Everything else is unchanged, including
the oxide accent, which does not re-map between themes.

**There is no third palette.** A "Glare" theme was built during review and **deleted, not
hidden** — a third contrast surface is one more thing to police and one nobody switches into.

### 3. The masthead and the plate line

| R4 | R5 |
| --- | --- |
| Plate line leads with **coordinates** at display scale, plus a `PLATE NN — CC` stamp | Plate line leads with the trip's **cities** at reading scale, then its **next leg** |
| Guide numbering on every guide surface | **None.** `sheetOrdinal` and `src/lib/sheet-order.ts` stay — the hub indexes by number, and an index is a legitimate use of one |
| The right column ends after the chips | It carries the **live trip state**: the status stamp, the day and local time, and what there is to get through |

**Coordinates survive on the globe**, where they *are* the map. They are not on the guide page.

### 4. Trip Split

**It never seeds.** R4 filled the ledger from the guide's `budget` section and stamped those
rows `✓ FROM THE GUIDE`. An estimate is not a debt: seeding "meals per day, $32" produces a
settle-up demanding transfers for money nobody spent. It now ships empty and says so. The
forecast is real and belongs in the guide's own Budget panel, labelled a forecast.

### 5. Tools

Four, not five — the **jet-lag** panel moved into the **Plan** group, where a fact about the
flight is read before departure rather than after landing. `src/lib/jetlag.ts` and
`src/lib/tz-offset.ts` are untouched and keep their tests; only the placement changed. Route
order **hands off**: every leg carries a maps link built from the guide's own coordinates, plus
one whole-day multi-stop link.

### 6. Prose

**Every long explanation folds the same way** — two lines always visible, the rest opening in
place, hover *and* click on a fine pointer, tap on touch — **at unchanged type size**. An
explanation that shrinks when it opens is a punishment for opening it.

### 7. The Red Ink Rule — extended, not replaced

R4 spent one red-ink moment per viewport in four places: a plate line, a gap, a stale warning,
SOS. R5 allows **one second moment: the present** — the live band on the day being read may take
reading-scale accent alongside one of the four. Nothing else qualifies, and where a screen has
to choose, the present wins. The rule governs reading-scale accent only; it does not govern the
10px panel kicker, which is notation.
