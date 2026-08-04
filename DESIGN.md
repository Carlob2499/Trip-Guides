---
name: Waypoint
description: Verified, personalized travel guides that show their work — a field instrument, not a brochure.
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
  caution-ochre: "#7f4a07"
  chart-room-slate: "#0f1317"
  chart-room-sunken: "#1a2129"
  chart-room-card: "#242c34"
  lamplit-paper: "#e8ece3"
  lamplit-muted: "#9aa392"
  hairline-dark: "#38414b"
  hairline-strong-dark: "#4e5865"
typography:
  display:
    fontFamily: "'Literata Variable', Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.8rem, 8vw, 4.8rem)"
    fontWeight: 640
    lineHeight: 1.02
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "'Literata Variable', Georgia, serif"
    fontSize: "clamp(1.5rem, 4vw, 2.2rem)"
    fontWeight: 400
    lineHeight: 1.15
  title:
    fontFamily: "'Literata Variable', Georgia, serif"
    fontSize: "1.6rem"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "'Literata Variable', Georgia, serif"
    fontSize: "1.02rem"
    fontWeight: 400
    lineHeight: 1.72
  control:
    fontFamily: "'Source Sans 3 Variable', -apple-system, system-ui, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 600
    letterSpacing: "0.02em"
  label:
    fontFamily: "'Source Sans 3 Variable', -apple-system, system-ui, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 400
    letterSpacing: "0.06em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  pill: "999px"
components:
  tab-pill:
    backgroundColor: "color-mix(in srgb, {colors.map-ink} 5%, transparent)"
    textColor: "{colors.ink-muted}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 1.05rem"
    height: "38px"
  tab-pill-active:
    backgroundColor: "color-mix(in srgb, {colors.surveyors-red-oxide} 70%, {colors.map-ink} 30%)"
    textColor: "{colors.survey-paper}"
    rounded: "{rounded.pill}"
  control-pill:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "0.34rem 0.72rem"
    height: "36px"
  accent-pill:
    backgroundColor: "color-mix(in srgb, {colors.surveyors-red-oxide} 12%, {colors.card-paper})"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.pill}"
    padding: "0.08rem 0.5rem"
  card:
    backgroundColor: "{colors.card-paper}"
    textColor: "{colors.map-ink}"
    rounded: "{rounded.lg}"
    padding: "1.25rem 1.4rem"
  cta-primary:
    backgroundColor: "{colors.chart-room-slate}"
    textColor: "{colors.card-paper}"
    rounded: "{rounded.pill}"
    padding: "0.6rem 1.15rem"
  micro-label:
    backgroundColor: "transparent"
    textColor: "{colors.accent-ink}"
    typography: "{typography.label}"
---

# Design System: Waypoint

## Overview

**Creative North Star: "The Surveyor's Sheet"**

Waypoint looks like something that was measured, not something that was described. The
governing image is a survey sheet: paper that has been out in the field, carrying contour
lines, coordinates, dated marks, and annotations in iron-oxide pigment. Everything that makes
the product trustworthy — the source stamp, the verification date, the `≈` on a sourced
approximation, the `⚠` on an unconfirmed one — is a survey notation, and the visual system
treats those marks as first-class content rather than as fine print to be tucked away.

The system runs on two grounds and one instrument. In daylight it is cool sage survey paper
under blue-black map ink. At night it becomes a chart room: a deep slate table under lamplit
paper. Neither is a theme in the decorative sense; they are the same document under different
light, which is why the guide's identity colour deliberately does **not** re-map between them.
A country's accent is data, not decoration — it arrives from the guide's own record and is
painted identically in both modes, so a Denmark guide is the same red in a hotel room at
midnight as it is on a Copenhagen street at noon.

Density is deliberately low. The product's own doctrine is "open, not crowded": a guide has to
carry an entire trip — days, sights, food, budget, transit, phrases, emergencies — while still
feeling like something you can read on a phone with one hand. That tension is resolved by
restraint rather than by compression. Surfaces are flat and quiet at rest; hairlines do the
separating work that boxes and shadows would do elsewhere; the accent appears rarely enough
that when it does appear, it means something. The two visual worlds this system is measured
against and rejects are the travel-magazine spread (cream paper, full-bleed sunset, aspirational
script — refused in the token source itself) and the SaaS dashboard (blue-600 primary, generic
card grid, one neutral sans everywhere, gradient CTA).

**Key Characteristics:**

- Cartographic, not editorial: paper and ink, contour fields, coordinates, dated marks.
- One serif doing two jobs through a real optical-size axis; one quiet sans for data.
- Flat at rest, hairline-separated; shadow is reserved for state and for stacking order.
- Per-country accent as identity data, never re-mapped by theme.
- Provenance rendered, not hidden — the stamp is part of the design.

## Colors

A cool sage-and-ink ground that stays out of the way, with exactly one chromatic voice per
guide layered on top.

### Primary

- **Surveyor's Red-Oxide** (`#9c4421`): the house accent, and the shape every per-country
  accent takes. Iron-oxide pigment — the colour of a field annotation. It fills the active tab,
  the hero cover strip, focus rings, and large display marks. It is the guide's identity, and it
  is deliberately **not** contrast-gated, because it is never used as small text. Per-guide pages
  override it inline from the guide's own record; non-guide chrome (hub, about, health, progress)
  uses this value.
- **Accent Ink** (`#80371b` light / `#c78f78` dark): the accent doing the *text* job. Derived
  per accent by `src/lib/accent-tokens.ts` to clear 4.5:1 on every surface this site paints,
  flat or accent-tinted. Two shades travel together because a media query cannot recompute a
  colour; the stylesheet picks.
- **On-Accent** (`#f0d2c7`): text sitting *on* an accent fill. Exactly one correct answer per
  accent, identical in both themes, because its ground never re-maps.

### Neutral — daylight

- **Survey Paper** (`#dfe3d9`): the page. Cool, sage-tinted, deliberately not cream.
- **Card Paper** (`#f8faf3`): every card, panel, and sheet — the mark that lifts off the page.
- **Survey Paper Sunken** (`#d2d7c8`): inset panels, collapsed summaries, wells.
- **Map Ink** (`#171d24`): all primary text. Blue-black, never pure black.
- **Ink Muted** (`#4e5747`): secondary text, deks, meta, inactive controls.
- **Hairline** (`#bec6b2`) / **Hairline Strong** (`#a3ac98`): the 1px rules that do this
  system's separating work.

### Neutral — chart room

- **Chart Room Slate** (`#0f1317`) page, **Chart Room Card** (`#242c34`) cards, **Chart Room
  Sunken** (`#1a2129`) wells, **Lamplit Paper** (`#e8ece3`) text, **Lamplit Muted** (`#9aa392`)
  secondary, hairlines at `#38414b` / `#4e5865`.

### Tertiary — status

- **Field Green** (`#396345` / `#6aab76` dark): done, confirmed, on-plan.
- **Caution Ochre** (`#7f4a07` / `#d9923f` dark): stale, unconfirmed, advisory.
- **Emergency Red** (`#b3261e`, remapped to `#ef5350` in dark): the SOS affordance only. This
  one is semantic and is never derived from a guide's accent — an emergency control must read
  as an emergency control on every guide.

### Named Rules

**The Three Jobs Rule.** An accent has three jobs and they are three different colours.
Identity is `--accent`. Accent as text is `--accent-ink`. Text on an accent fill is
`--on-accent`. Never hand-blend a fourth at the call site — a `color-mix` invented in a rule
carries no contrast contract, and the one place that did (`.topbar-search`) is exactly where
the axe gate caught a 4.45:1 failure.

**The Identity Doesn't Theme Rule.** `--accent` is the same value in light and dark. Only its
*ink* re-maps. A guide's colour is a fact about the guide, not about the reader's display.

**The Tinted Ground Rule.** Accent text is rarely painted on a flat surface — chips and pills
tint their ground toward the accent, the one direction that eats contrast. Every accent-ink is
derived against both the flat surface and that surface tinted to the ceiling (18%). Never tint
a background past 18%; a test re-derives that ceiling from the stylesheets and fails if a rule
crosses it.

## Typography

**Display Font:** Literata Variable (Georgia, 'Times New Roman', serif)
**Body Font:** Literata Variable — the same face
**Label/Data Font:** Source Sans 3 Variable (-apple-system, system-ui, sans-serif)

**Character:** Three roles, two faces. Literata carries both display and body through its real
optical-size axis, so a large heading automatically takes the display cut and prose takes the
text cut with no per-rule settings — one voice, correctly sized at both ends. Source Sans 3 is
the instrument's other half: a quiet humanist sans reserved for the things a traveller reads as
*data* rather than as prose — times, prices, coordinates, distances, stamps, and every
uppercase micro-label. Korean and other CJK content falls through to a per-role OS fallback
chosen to match each role's intent (a serif for the serif roles, a sans for data), at zero byte
cost.

### Hierarchy

- **Display** (640, `clamp(2.8rem, 8vw, 4.8rem)`, 1.02): the masthead title. One per page.
- **Headline** (400, `clamp(1.5rem, 4vw, 2.2rem)`): category titles, the mid-band step.
- **Section** (400, `clamp(1.75rem, 1.5rem + 1.2vw, 2rem)`): section heads.
- **Title** (400, `1.6rem`, fixed): card, sheet, and panel titles.
- **Subtitle** (`clamp(1.2rem, 1.1rem + .4vw, 1.3rem)`): dense card and sheet titles.
- **Lead** (`1.15rem`): deks and lead paragraphs.
- **Body** (400, `1.02rem`, 1.72): all prose. Measure capped at `42rem` (`--read`).
- **Small / Caption** (`0.88rem` / `0.78rem`): UI chrome, secondary body, captions.
- **Control** (600, `0.82rem`) and **Control Small** (`0.72rem`): tabs, buttons, pills,
  badges, counters. These exist because 47 rules had independently invented sizes in the gaps
  between prose steps — controls are a type role, not an afterthought.
- **Label** (`0.68rem`, `0.06em` tracking, uppercase) and **Nano** (`0.6rem`): micro-labels,
  credits, stamps, bare numerals.

### Named Rules

**The Fluid Headings, Fixed Text Rule.** The heading band clamps; body and UI text never do. A
phone is held closer than a monitor, so reading text wants the same physical size on both and
shrinking it hurts — but a 32px section head that is right on a desktop is overbearing at
375px. Every clamp's maximum is the previous fixed value, so desktop rendering is unchanged and
only narrow viewports gain room.

**The Rem-In-The-Middle Rule.** Every clamp's middle term carries a rem component. A pure-`vw`
middle locks size to the viewport and stops responding to the reader's own font-size setting —
a WCAG 1.4.4 failure invisible to anyone who never changes that setting.

**The 24px Grading Rule.** Headings here are weight 400, which puts their WCAG large-text line
at 24px rather than 18.7px. Every heading step stays above it. This is why `--text-h3` is a
fixed `1.6rem` (25.6px) instead of fluid: any useful fluid range dips under 24px at phone
widths and silently re-grades every card title from needing 3:1 to needing 4.5:1 — which a
single-viewport axe run cannot catch.

## Layout

A single wide shell (`max-width: 1400px`, `0 1.1rem` gutters) holding a much narrower reading
column: prose and typed blocks are capped at `--read: 42rem` and centred, so a desktop window
never turns a guide into a wall of text. Category blocks break to two columns above the primary
breakpoint while individual blocks stay within the measure.

The breakpoint vocabulary is narrow on purpose — **900px** is the primary desktop/mobile split
(with `899px` as its max-width partner), **599px** handles small-phone density, and `520px`,
`640px`, and `1100px` handle three specific components. Sticky chrome height is a token
(`--chrome-h`, 94px desktop / 82px mobile) rather than a repeated literal, because it drives
scroll-padding and every section's scroll-margin; hard-coding it in two places is how anchor
offsets drift apart.

Rhythm is set by the body line-height of 1.72 and a card padding of `1.25rem 1.4rem`. There is
deliberately no abstract spacing scale — spacing is set per component against the reading
measure, and inventing a `--space-*` ladder now would be a second source of truth for values
that already agree.

Stacking is a named ladder, not ad-hoc integers: raised (120) for floating buttons and
popovers, sticky (310) for full-screen sheets, toast (940), modal (960), story overlay (1000),
and skip-link (1100) — the skip link sits above everything by design, because a skip link that
another layer can cover defeats its own purpose.

## Elevation & Depth

Near-flat, and tonal first. Depth comes from the three-surface ramp — sunken, page, card — and
from 1px hairlines. Shadows are not part of a surface's resting form; they are a response.

The R2 pass widened that ramp precisely because it had collapsed: the three light surfaces once
sat within 1.10:1 of each other, so a card barely separated from the page it sat on. The ramp
now measures 1.238:1 card-over-page and 1.128:1 page-over-sunken in daylight, 1.319:1 and
1.149:1 in the chart room. Layering reads without any shadow being asked to do it.

### Shadow Vocabulary

- **Rest** (`0 1px 3px rgba(16,20,24,.06)`): the barely-there seat under a card. Present, not
  visible.
- **Hover lift** (`0 6px 24px rgba(16,20,24,.1)`, hub cards `0 8px 28px rgba(16,20,24,.12)`,
  paired with `translateY(-2px…-3px)`): the response to a pointer.
- **Accent state glow** (`0 3px 14px color-mix(in srgb, var(--accent) 40%, transparent)`): the
  active tab and the Today chip only — a coloured shadow marks *selection*, never elevation.
- **Overlay** (`0 18px 50px`–`0 18px 60px`): modals and dialogs.
- **Sheet** (`0 -10px 34px rgba(16,20,24,.28)`): bottom sheets, throwing upward.
- **Focus ring** (`0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent)`): inputs and
  live markers. A halo, deliberately offsetless, because it is a ring and not a shadow.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. A shadow appears only as a response to
state (hover, focus, drag) or as a signal of stacking order (modal, sheet, popover).

**The Heavy-Shadow-Means-On-Top Rule.** The 18px/50px class of shadow is reserved for things
that are literally above everything else. Give a card that shadow at rest and modals stop
reading as modal — the reader loses a stacking cue they were processing without thinking.

## Shapes

Two families and nothing between them. **Controls are pills** — every tab, button, badge, chip,
and status pill is `999px`, so anything tappable is legible as tappable at a glance, including
in peripheral vision on a moving phone. **Containers are panels** — `6px` (`--r-sm`) for tight
inline marks like toasts and the "what's next" strip, `10px` (`--r-md`) for popovers, inputs,
and inline notes, `16px` (`--r-lg`) for cards, modals, hero surfaces, and sheets (sheets round
their top corners only, since they rise from the edge).

Borders are `1px` and do real work; the palette carries two hairline weights so a border can be
quiet (`--rule`) or assertive (`--rule2`) without inventing a third colour. Icons are drawn SVG
at a consistent stroke, sized 17–19px in chrome. The recurring cartographic motif — generated
contour-line fields behind the hub and About heroes — is drawn as polylines from a seeded
generator, not as a raster texture, and a fixed fractal-noise overlay at 5% opacity gives every
page its paper grain.

## Components

### Tabs (the guide's primary navigation)

- **Character:** quiet at rest, precise under the thumb.
- **Shape:** full pill (`999px`), `38px` tall (`36px` under 900px), horizontally scrollable with
  `scroll-snap`.
- **Rest:** 5% ink wash on transparent, muted text, `--font-display` at control size, weight 600.
- **Hover:** wash to 10%, text to full ink, `translateY(-1px)`.
- **Active:** filled with accent blended 30% toward ink, page-ground text, plus the accent state
  glow. Tool tabs are separated from content tabs by a `1px` rule and a squared-off left edge.
- **Focus:** `2px` accent outline at `2px` offset. **Press:** `scale(.94)`.

### Buttons and control pills

- **Shape:** full pill, `36px` minimum, `1px --rule2` border, transparent fill.
- **Colour:** muted text and border at rest; accent-ink for the accent-bearing variants.
- **Collapse:** below 560px the label drops and the control becomes a `38px` circular icon
  button — the target grows as the label leaves.
- **Press:** `scale(.98)` globally on every button, `[role=button]`, `summary`, and the named
  pill anchors, instant on press with the release riding each control's own transition.

### Cards

- **Corners:** `16px`. **Background:** card paper. **Border:** `1px --rule`, going `--rule2` on
  hover. **Padding:** `1.25rem 1.4rem`.
- **Shadow:** rest seat, lifting to hover on pointer with `translateY(-2px)`.

### Inputs

- **Shape:** `10px`, `1px --rule2`, page-ground fill, `40px` minimum height, body-size text
  (never smaller — a sub-16px input triggers iOS zoom-on-focus).
- **Focus:** border to accent plus a `3px` 22% accent halo; the default outline is removed only
  because the halo replaces it.

### Micro-labels and stamps

- Uppercase, `0.68rem`, `0.06em` tracking, `--font-data`, accent-ink. This is the notation
  layer — section kickers, credits, and the "Checked [date]" stamps. It is the smallest type in
  the system that carries meaning, and it is never used for prose.

### Provenance dot (signature component)

A `1em` inline circular button that sits directly after a perishable fact, muted until hover or
focus, then accent. It opens a popover carrying the claim's source and verification date. It is
the visual atom of the product's central promise, and it is deliberately sized to the text it
annotates — it reads as a mark on the sheet rather than as a UI control bolted beside one.

## Do's and Don'ts

### Do:

- **Do** derive accent text from `--accent-ink` and text-on-accent from `--on-accent`, always.
- **Do** reach for a token from the type scale — including `--text-control` and
  `--text-control-sm` for anything that is a button, tab, pill, badge, or counter.
- **Do** separate surfaces with a `1px` hairline and the tonal ramp before considering a shadow.
- **Do** keep prose inside `--read` (42rem) and let only maps, galleries, and tables break out.
- **Do** state a verification date wherever a perishable fact appears, in the micro-label role.
- **Do** re-run the axe gate (`npx playwright test tests/visual/a11y.spec.ts`) after any change
  to a colour token — it covers hub and guides across light, dark, desktop, and 375px.

### Don't:

- **Don't** invent an accent shade at a call site with `color-mix`. That is how a 4.45:1 text
  colour shipped; the derived tokens exist so it cannot recur.
- **Don't** re-map `--accent` for dark mode. Only its ink re-maps.
- **Don't** tint any background more than 18% toward the accent — accent-ink's contrast
  guarantee is derived against exactly that ceiling.
- **Don't** give a resting surface an overlay-weight shadow; that shadow means "above
  everything" and spending it elsewhere costs a stacking cue.
- **Don't** make heading type fluid below 24px, or body and UI type fluid at all.
- **Don't** introduce a second sans, a monospace, or a display face. Three roles, two faces.
- **Don't** use cream paper, full-bleed aspirational photography, or script display type — the
  travel-magazine world is a stated anti-reference.
- **Don't** reach for the SaaS-dashboard defaults: a blue primary, a uniform card grid as page
  structure, one neutral sans everywhere, or a gradient CTA.
- **Don't** hard-code `--chrome-h`, surface hexes, or the light/dark grounds outside
  `base.css` — `content.config.ts`, `accent-tokens.ts`, the manifest, and the OG/recap
  generators all read from the same values and drift silently when one is edited alone.
