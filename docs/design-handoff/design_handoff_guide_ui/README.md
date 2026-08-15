# Handoff: Waypoint guide pages — revision R5

> **Read `00-START-HERE.md` first.** It carries the reading order and the precedence rules.
> This file is the master specification; the numbered documents beside it carry the exact values.

---

## Overview

Waypoint (`github.com/Carlob2499/Trip-Guides`) is a static Astro site of verified, personalised
travel guides. Its differentiator is that every perishable fact — a price, an opening hour, a
door — traces to a primary source and the date it was checked, and where research came up short
the guide says so instead of filling the hole.

This redesign covers **the guide pages themselves**: the reading surface, on phone, tablet and
desktop, in one build with no device-specific code. It does not touch the atlas hub, the cover or
table view, all of which R4 already settled and which remain as specified there.

What changes, in one list:

- the tab-pill rail becomes a **spine rail** — one line, every section group a station on it —
  and a **swipeable pill row with a progress line** on the phone
- **Tools becomes the last station**, with one entry point instead of four
- **Field log becomes its own station**, after Sources, drawn only when the guide has one
- **every long explanation folds** to two visible lines, opening in place at unchanged type size
- **the Day palette is lifted** so the page holds up in direct sun; there is no third theme
- **the plate line** carries the trip's cities and its next leg instead of coordinates and a
  plate number; guide numbering is retired from guide surfaces
- **Trip Split ships empty** and never seeds from the guide's budget forecast
- **jetlag stops being a tool**; its one reading moves into Plan. Four tools remain
- **route order hands off** to a maps app, per leg and for the whole day

## About the design files

**The files in `prototypes/` are design references created in HTML — not production code to
copy.** They demonstrate intended look, motion and behaviour. They render in a React-flavoured
design runtime because that is what the design tool produces; **that is an artefact, not a
requirement**, and every component in them maps cleanly onto an Astro component plus a vanilla
enhancement script.

**Recreate these designs in the repo's existing stack and patterns:** Astro pages and components,
plain CSS in `src/styles/`, vanilla JS modules in `src/scripts/`, self-contained features in
`src/features/<name>/` behind a single `index.ts`. Do not introduce a framework, a CSS library,
or a new npm dependency.

## Fidelity

**High-fidelity.** Colours, typography, spacing, motion timings and interaction states are final
and are specified exactly in `TOKENS.md`, `COMPONENTS.md` and `BEHAVIOR.md`. Recreate them
precisely. Nothing in those three files is a suggestion, and none of it should be re-derived from
a screenshot — the screenshotter re-renders the DOM rather than capturing pixels.

Two caveats:

- **Photography** in the prototypes is a striped placeholder. Use the existing image pipeline and
  each guide's own recorded Wikimedia Commons URLs.
- **The Korea day-4 content** in the prototypes is the guide's real content, read from
  `src/content/guides/korea/`. The Sedona content is read from `src/content/guides/us/`. Neither
  was invented, and neither should be edited.

## Screens / views

Full composition is in `SCREENS.md`. In summary:

| Screen | Purpose | Reference |
| --- | --- | --- |
| Guide masthead | say what this trip is, and where you are in it | `SCREENS.md` §1 |
| Rail + context line | move between sections; know your position | §2 |
| Day station | read today — the deepest surface | §3 |
| Tools | four tools, last station on the rail | §4 |
| Field log | the post-trip record, its own station | §5 |
| Day zero | a guide before its trip — nine absent states | §6 |

## Components

Exact measurements in `COMPONENTS.md`: the Panel · the spine rail · the pill row · the day
scrubber · the fold · the notation family · the gap block · status stamps · the present band ·
the thumb bar · sheets · route hand-off.

## Interactions & behaviour

`BEHAVIOR.md`: the DO-NOT-DERIVE constants (chrome yield, gesture, shelf life), the motion table,
section reveals, keyboard and assistive-technology contracts, the state table, and print.

## State management

`BEHAVIOR.md` §5. In short: `slug`, `group`, `day` and `tool` in the URL; theme, Panel collapse,
Panel order, checklist ticks, group open counts and section memory in `localStorage`, each scoped
as specified; sheet and fold state ephemeral.

## Design tokens

`TOKENS.md` — colour (both themes), type and the scale, radius, border weight, spacing and the
grid, safe areas, container-query breakpoints.

## Assets

- **Photography**: Wikimedia Commons, via the `Special:FilePath` URLs already recorded in each
  guide's JSON. Credits and licences are in the guides' reference sections.
- **Fonts**: Literata and Source Sans 3. Google-hosted in the prototypes, matching how the Astro
  site loads them today. If you want offline-first, self-host and swap for `@font-face` — but do
  not substitute the faces.
- **Icons**: there are none, and none should be drawn. The system's marks are typographic or
  geometric primitives: the benchmark triangle, corner ticks, the provenance dot, the `⠿` drag
  handle, `−`/`+`, `▾`, `↗`, `⚠`, `✓`.
- **Logo**: no logo file exists in the sources. The wordmark is set in type beside the benchmark
  triangle. Do not draw a mark.

## Files in this bundle

| File | What it is |
| --- | --- |
| `00-START-HERE.md` | reading order, precedence, glossary, what not to do |
| `PROMPT.md` | the message to paste into Claude Code |
| ~~`SUPERSEDES.md`~~ | deleted 2026-08-14 — its seven rows live in `docs/design-handoff/DESIGN.md`'s body, which is the single design authority |
| `README.md` | this file — the master specification |
| `TOKENS.md` | every exact value |
| `COMPONENTS.md` | per-component measurements |
| `SCREENS.md` | screen-by-screen composition, all three viewports |
| `BEHAVIOR.md` | interaction, state, motion, gestures, keyboard, print |
| `TESTS.md` | the tests to write, with every edge case found in review |
| `FALLBACKS.md` | absent data, runtime failure, contradictions, scope guards |
| `BUILD_ORDER.md` | six steps, the first three independently shippable, plus the repo file map |
| `ACCEPTANCE.md` | the checklist the PR is held to |
| `prototypes/` | runnable design references |
| `design-system/` | the R5 token layer, components, guideline cards and UI kits |

### The prototypes

| File | Shows |
| --- | --- |
| `Waypoint Guide Desktop.dc.html` | desktop: spine rail, day station, Tools, marginalia on hover |
| `Waypoint Guide Mobile.dc.html` | phone at 402×874: pill row, folds, thumb bar, four sheets |
| `Waypoint Guide Tablet.dc.html` | tablet: vertical spine, reading column, thumb bar retained |
| `Waypoint Guide.dc.html` | the review canvas: desktop + a nine-device contact sheet, click to run |
| `Waypoint Sedona.dc.html` | **day zero** — the same components with nothing filled in |
| `Waypoint Arrival.dc.html` | cover → hub → guide, for continuity with R4's surfaces |

To run one: serve the folder and open the file. They need network access for fonts.

## Open questions to raise before building

1. **The type scale.** `type-scale.test.ts` will almost certainly fail first, because the
   prototypes use inline `font` shorthand it has never seen. Each new size should be added to the
   scale deliberately — decide which, rather than exempting the files.
2. **Container queries** become the responsive contract for every future surface, not just this
   one. Confirm before it propagates.
3. **The lifted Day palette** has not been through an axe run. Two pairings were already flagged
   unverified in R4 and both sit on changed ground.
4. **Guide numbering** is retired from guide surfaces but `sheetOrdinal` stays for the hub.
   Confirm the hub keeps it.
5. **Real expense data.** Trip Split ships empty by design; if a real ledger exists somewhere, it
   is data, not a fixture, and it should arrive through the form.
