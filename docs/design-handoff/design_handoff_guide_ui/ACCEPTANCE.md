# Acceptance — the PR is not open until every box is ticked

Each line is a statement you must be able to **demonstrate**, not assert. Where a check is
mechanical, the command is given.

---

## Build and gates

- [ ] `npm run build` succeeds with no new warnings
- [ ] `npm test` green, including every new test in `TESTS.md`
- [ ] `npx playwright test` green
- [ ] `src/styles/var-defined.test.ts` green — `0` unresolved `var(--*)`
- [ ] `src/styles/type-scale.test.ts` green — any new size was **added to the scale deliberately**, not exempted
- [ ] `src/styles/atlas-tokens.test.ts` green, extended with the seven lifted Day tokens and the assertion that `[data-field="glare"]` does not exist
- [ ] axe: **zero** violations, both themes, on masthead / day station / Tools / day zero

## Superseded content actually removed

- [ ] `docs/design-handoff/DESIGN.md` amended with every row of `SUPERSEDES.md`, **in this PR**
- [ ] No `[data-field="glare"]` in any shipped CSS
- [ ] No `SHEET NN`, `PLATE NN — CC` or `GUIDE NN` on any guide surface (the hub keeps its index)
- [ ] No coordinate pair on the plate line
- [ ] Trip Split has **no** seeding function and **no** `✓ FROM THE GUIDE` stamp
- [ ] Jetlag is not a tool; its reading is in Plan; `src/lib/jetlag.ts` and its tests are untouched
- [ ] Tools has exactly **one** entry point

## Structure

- [ ] The rail is built from the guide's own groups — Korea renders 13 stations, Sedona 9
- [ ] Field log is a station for Korea and **is not drawn** for Sedona
- [ ] Tools is the last station for both
- [ ] No rendered string states a count that disagrees with what is rendered beneath it
- [ ] Zero device checks: `grep -rn "userAgent\|innerWidth\|isMobile\|isIOS" src/` returns nothing in guide code
- [ ] Guide body switches on **container** width; narrowing the container in a wide viewport changes the model

## Data

- [ ] Zero changes under `src/content/guides/` — `git diff --stat src/content/guides/` is empty
- [ ] Zero changes to `src/content.config.ts`
- [ ] Zero new npm dependencies — `git diff package.json` shows no added `dependencies`
- [ ] Settlement, jetlag, holidays and ranking are all computed by their existing models; the UI re-derives none of them
- [ ] Desktop and phone read the same trip-data module

## Absent states — each demonstrated on the day-zero fixture

- [ ] Plate at full height, four ticks, "no cover" line
- [ ] No present band, no `now` chip
- [ ] `0 of N` with the denominator visible
- [ ] Trip Split: `$0.00`, nets `—`, no transfers, bars hidden, ledger explains itself
- [ ] No resume line in the DOM at all
- [ ] No FX rate line; the string `1.00` appears nowhere
- [ ] Every real gap block still loud, at reading scale, 2px ochre

## Interaction

- [ ] Every target ≥44px on all nine devices, including the 375×667 SE
- [ ] Closed sheets are out of the tab order — tab-stop count asserted
- [ ] Open sheets trap focus; Escape closes; focus returns to the opener
- [ ] Folds open on hover **and** click on desktop, tap on touch, at unchanged type size
- [ ] Every route leg opens in a maps app; the whole-day link chains every stop
- [ ] Straight-line distances are labelled as such
- [ ] `prefers-reduced-motion`: no transitions or animations run; press states still work
- [ ] Print force-expands every collapsed Panel and every fold

## Phone

- [ ] Nothing renders under the status bar, the Dynamic Island or the home indicator
- [ ] Every fixed edge uses `max(reserved, var(--safe-*))`, never bare `env()`
- [ ] `viewport-fit=cover` present
- [ ] The active pill scrolls into view **within its own scroller** — `scrollIntoView` appears nowhere
- [ ] The progress line's width is `100 / stationCount`%
- [ ] The thumb bar seats the current group for **all** of Korea's 13 stations

## Honesty — the bar this product is actually held to

- [ ] Nothing on any screen is invented: no placeholder copy, no sample expenses, no fabricated resume line, no guessed coordinates, no assumed holidays
- [ ] Every figure is derived at runtime or absent
- [ ] Every unverified claim renders a gap block, not prose that reads like an answer
- [ ] Every fact with no source renders `NO PUBLIC SOURCE` rather than omitting its dot
