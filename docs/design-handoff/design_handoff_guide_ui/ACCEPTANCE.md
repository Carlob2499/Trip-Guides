# Acceptance — the PR is not open until every box is ticked

Each line is a statement you must be able to **demonstrate**, not assert. Where a check is
mechanical, the command is given.

---

## Build and gates

- [x] `npm run build` succeeds with no new warnings
- [x] `npm test` green, including every new test in `TESTS.md`
- [x] `npx playwright test` green
- [x] `src/styles/var-defined.test.ts` green — `0` unresolved `var(--*)`
- [x] `src/styles/type-scale.test.ts` green — no new size was needed; nothing exempted
- [x] `src/styles/atlas-tokens.test.ts` green, extended with the seven lifted Day tokens and the `glare` assertion
- [x] axe: **zero** violations, both themes, on masthead / day station / Tools / day zero

## Superseded content actually removed

- [x] `docs/design-handoff/DESIGN.md` amended with every R5 override, **in this PR** (folded into
      its body 2026-08-14; `SUPERSEDES.md` deleted, so one document states the current ruling)
- [x] No `[data-field="glare"]` in any shipped CSS
- [x] No `SHEET NN`, `PLATE NN — CC` or `GUIDE NN` on any guide surface (the hub keeps its index)
- [x] No coordinate pair on the plate line
- [x] Trip Split has **no** seeding function and **no** `✓ FROM THE GUIDE` stamp
- [x] Jetlag is not a tool; its reading is in Plan; `src/lib/jetlag.ts` and its tests are untouched
- [x] Tools has exactly **one** entry point

## Structure

- [x] The rail is built from the guide's own groups — Korea renders 13 stations, Sedona 9
- [x] Field log is a station for Korea and **is not drawn** for Sedona
- [x] Tools is the last station for both
- [x] No rendered string states a count that disagrees with what is rendered beneath it
- [x] Zero device checks **in guide code**, enforced by `scripts/__tests__/no-device-checks.test.mjs`
      rather than by a grep. Five files still read a viewport number and each is named there with
      its reason: popover placement (twice), gesture geometry, the hub globe's tap-vs-hover
      choice, and a `userAgent` string inside an error beacon. None decides a layout. The gate
      additionally asserts that the four files defining the guide body contain none at all.
- [x] Guide body switches on **container** width; narrowing the container in a wide viewport changes the model

## Data

- [~] **One** change under `src/content/guides/`, deliberate and recorded: `japan/01-plan.json`
      pointed readers to "the Entry card in your Trip kit" — a feature R5 deleted — from inside
      the Entry card. A removal that leaves stale pointers is not finished, and the continuity
      rule in CLAUDE.md outranks this guard for exactly that case. Nothing else was touched.
- [x] Zero changes to `src/content.config.ts`
- [x] Zero new npm dependencies — `git diff package.json` shows no added `dependencies`
- [x] Settlement, jetlag, holidays and ranking all still run in their existing models; the UI
      re-derives none of them (pin 9.6 walks the wiring; the silos' own tests are untouched)
- [x] Desktop and phone read the same trip-data module — `pins.spec.ts` 9.5 reads the stations,
      day count, cities, progress and store key at 375 and 1280 and requires them identical

## Absent states — each demonstrated on the day-zero fixture

- [x] Plate at full height (406px at 375px wide, inside `clamp(300px, 50vh, 540px)`) with all
      four ticks. **The "no cover" line is unexercised**: all four guides carry a cover, so no
      fixture shows it. The branch exists and is unchanged from R4; nobody has seen it render.
- [x] No present band and no `now` chip on `us` — verified in the running build, trip Sep 2-8
      against a device clock of Aug 11
- [x] Checklist counts render with the denominator visible (`2 of 6`, `2 of 9` observed); the
      count is derived, never typed — `copy-honesty.spec.ts` §5.5 asserts that
- [x] Trip Split ships empty and says so ("Add people first, then record who paid what.").
      The model side is pinned by `trip-split/__tests__/empty.test.ts`: zero total, every net
      zero rather than `+0.00`, no transfers, no rows manufactured from the guide's day count
- [x] No resume line in the DOM at all
- [x] No FX rate line; the string `1.00` appears nowhere
- [~] The gap block is intact (`GapBlock.astro`, 2px ochre, reading scale, never collapsed) and
      **no guide currently renders one** — it fires on `provenance.state: "unconfirmed"` and no
      sights item carries that today. Live capability, unexercised; ticking it would claim a
      demonstration nobody has seen.

## Interaction

- [x] Every target ≥44px on all nine devices — `a11y.spec.ts`, one test per device. Twenty-three
      classes were raised to meet it. Two remain under the line with stated reasons and counts
      that may only shrink (`TARGET_BASELINE`): `.transit-link` and `.dchip`, both density
      decisions across all four guides rather than fixes. Notation — the provenance dot, the ≈/⚠
      flag chips, a photo credit — is deliberately excluded: a 44px mark beside a 13px figure
      dominates the fact it footnotes.
- [x] Closed sheets are out of the tab order. The journey sheet was NOT: it slides away on a
      transform, which left ~90 links focusable. It ships and closes `inert` now.
- [x] Open sheets trap focus; Escape closes; focus returns to the opener
- [x] Folds open on hover **and** click on desktop, tap on touch, at unchanged type size
- [x] Verified on korea: 297 leg links plus 7 whole-day links, each a real
      `?api=1&origin=…&destination=…&waypoints=…` chain. Absent on `us`, correctly — its days
      have fewer than two located stops, and `dayRouteLink()` returns null rather than a link
      built from a place-name string
- [x] "Straight-line distance" renders in the route-order panel — asserted in `trip-tools.spec.ts`
- [x] 28 stylesheets carry a `prefers-reduced-motion` block; the rail's is explicit that press
      states are state, not motion, and stay. The axe gate runs the whole matrix under reduced
      motion, so every scan is also a reduced-motion render
- [x] `print.css` force-opens every `<details>` and Panel; `fold.css`'s own print block opens
      every fold, un-clamps its lead and drops the ▾ mark

## Phone

- [x] `safe-area.spec.ts` — static (`viewport-fit=cover` on every page) plus behavioural
      (non-zero insets injected at `:root`, and the chrome that must move moves)
- [x] The only bare `env(safe-area-*)` in the codebase is the `:root` block that DEFINES the
      four tokens. Every consumer wraps them in `max()`
- [x] `viewport-fit=cover` present
- [x] The active pill scrolls into view **within its own scroller** — `scrollIntoView` appears nowhere
- [x] Measured in the running build: 11.11% against `us`'s 9 stations, exactly `100/9`
- [x] The thumb bar seats the current group for **all** of Korea's 13 stations

## Honesty — the bar this product is actually held to

- [x] `copy-honesty.spec.ts` §5.6 sweeps all four guides for placeholder copy; the resume line
      is created and removed by the memory that owns it (`plate-line.spec.ts`); the ledger ships
      empty; holidays render only from a declared section and say so when there is no record
- [x] `copy-honesty.spec.ts` §5.1–5.5 — stated counts are compared against what is rendered,
      and the masthead's own `N of M` denominator against the rendered day count
- [~] Same standing as the gap block above: the path exists, nothing currently triggers it. A
      guide with an unconfirmed sight would be the demonstration and there is not one.
- [x] `NO PUBLIC SOURCE` renders on korea — verified in the running build, so the branch is
      exercised by a real guide rather than only existing

---

## Still open — not ticked, and not quietly dropped

- **The two `TARGET_BASELINE` classes.** `.transit-link` (189 per guide) and `.dchip` are real
  controls under 44px. Raising the transit pills wraps every day card's link row to three lines;
  raising the day chips means either scrolling the scrubber or abandoning "the whole trip in one
  row, active expanded" (COMPONENTS §4). Both are the creator's call, and the counts can only
  fall while it is unmade.
- **The hub globe's `matchMedia` branches** (`world-view.js`) choose tap-vs-hover by width where
  `(hover: none)` would say what is actually meant. Correct behaviour today, wrong question —
  hub work, outside R5's guide scope.
- **Print preview for the budget sheet** (pre-existing, tracked in `docs/handoff.md`).
