# Tests to write

The repo has three CSS gates and a Playwright visual suite. Everything below is **new** and must
exist before the PR. Each case is written as a statement that must be true; several encode a bug
found during design review, and those are marked **⌁ regression** — they will pass trivially on
day one and are there for the change six months from now.

Run: `npm test` (vitest, model + CSS gates) · `npx playwright test` (visual + a11y).

---

## 1. Rail composition — `src/features/guide-rail/__tests__/stations.test.ts`

| # | Statement |
| --- | --- |
| 1.1 | A guide with a `learnings` record produces a station list ending `… Sources, Field log, Tools` |
| 1.2 | ⌁ A guide **without** a `learnings` record produces a list ending `… Sources, Tools` — **Field log is absent, not empty** |
| 1.3 | Tools is always last, for every guide |
| 1.4 | Station count is derived from the guide, never a constant. Korea → 13, Sedona → 9 |
| 1.5 | ⌁ The progress line's width is `100 / stationCount`%, so Korea's is 7.69% and Sedona's is 11.1% — **not a shared constant** |
| 1.6 | The active station's index maps to `left: index / stationCount * 100%` |
| 1.7 | A guide with one group renders one station at 100% width without dividing by zero |
| 1.8 | A group name containing an ampersand or a non-ASCII character survives to the label unescaped |

## 2. Thumb-bar ranking — `src/features/mobile-nav/__tests__/rank.test.ts` (extend)

| # | Statement |
| --- | --- |
| 2.1 | ⌁ **The current group always holds a slot** — assert for *every* group in a 13-station guide, not just the first two. This is the exact defect review found: hard-coded slots left 9 of 13 groups with no current slot |
| 2.2 | An unopened group contributes **no** count; ranking falls back to the guide's own order |
| 2.3 | `seat()` keeps a promoted group at the index it already occupies |
| 2.4 | ⌁ Tapping the right-hand slot does not make its label jump to the left slot |
| 2.5 | `slotLabel("Food & shopping")` → `"Food"`; the full name remains the accessible name |
| 2.6 | `slotLabel` never truncates mid-word, and returns the full name when the stub would be unreadable |
| 2.7 | `resumeLine()` returns empty for a guide never opened — **never a default string** |
| 2.8 | Counts are read from `localStorage` keyed by the group's **full** name, and telemetry is never read |

## 3. Trip Split — `src/features/trip-split/__tests__/empty.test.ts`

| # | Statement |
| --- | --- |
| 3.1 | ⌁ With no expenses: total `$0.00`, per-person `$0.00`, count `0` |
| 3.2 | ⌁ With no expenses every net renders `—`, **never `+0.00`** (which claims a positive balance) |
| 3.3 | ⌁ With no expenses the where-it-went bars are **not rendered**, not rendered at 0% |
| 3.4 | ⌁ With no expenses the ledger renders one explanatory row, **not a bare header** |
| 3.5 | ⌁ Settle-up renders no *mark paid* control and the empty stamp when there are no transfers — heading, control and stamp all read from **one** flag so they cannot disagree |
| 3.6 | ⌁ **No code path seeds the ledger from a guide's `budget` block.** Assert the seeding function does not exist / is not called |
| 3.7 | ⌁ **No row anywhere in Trip Split carries `✓ FROM THE GUIDE`** |
| 3.8 | A single expense split EQUAL across 3 produces three nets summing to zero |
| 3.9 | A two-person split comes from the **participant set**, and `method` stays `EQUAL` |
| 3.10 | Settlement is computed by `model/settle.ts`; the UI re-derives nothing |
| 3.11 | Sum of paid equals the total for any random 20-expense fixture (property test) |
| 3.12 | Currency conversion applies **once**; converting twice is detectable and fails |
| 3.13 | An expense with an empty participant set is rejected by the form, not silently divided by zero |

## 4. Empty and absent states — `tests/visual/day-zero.spec.ts`

Run against a fixture guide with no learnings, no cover, no expenses, no ticks, no rate.

| # | Statement |
| --- | --- |
| 4.1 | The plate renders at full height with four corner ticks and the "no cover" line |
| 4.2 | ⌁ No element with the present-band selector exists |
| 4.3 | ⌁ No day chip carries the `now` state |
| 4.4 | ⌁ No resume line is rendered — assert **absence**, not empty string in the DOM |
| 4.5 | ⌁ No FX rate line is rendered, and the string `1.00` appears nowhere |
| 4.6 | The checklist shows `0 of N` with N > 0 |
| 4.7 | Every real gap block still renders at reading scale in `--ochre` inside a 2px border |
| 4.8 | The page has no console errors and no unresolved `var(--*)` |

## 5. Copy honesty — `tests/copy-honesty.test.ts` (new, cheap, high value)

⌁ Every case here is a defect that actually shipped into review: a rendered figure contradicting
the copy beside it.

| # | Statement |
| --- | --- |
| 5.1 | No rendered string states a station count. If one does, it equals the rendered station count |
| 5.2 | No rendered string states a group count that disagrees with the rendered groups |
| 5.3 | Any "N expenses" string equals the ledger's row count |
| 5.4 | Any "N transfers" string equals the settle-up row count |
| 5.5 | A stated width, count or total is either derived at runtime or absent. **Prefer absent** — a hand-maintained figure drifts the moment the thing beneath it changes |
| 5.6 | The strings `sample`, `demo`, `placeholder`, `lorem`, `TODO` and `FIXME` appear in no rendered guide surface |

## 6. Accessibility — `tests/visual/a11y.spec.ts` (extend)

| # | Statement |
| --- | --- |
| 6.1 | ⌁ With every sheet closed, no control inside a sheet is focusable — count tab stops and assert the exact number |
| 6.2 | With a sheet open, its controls are focusable, focus is trapped, and Escape closes it |
| 6.3 | Focus returns to the opening control on close |
| 6.4 | Every interactive element is ≥44px in its smallest dimension, on all nine devices in the matrix |
| 6.5 | axe passes with zero violations in **both** themes on masthead, day station, Tools, and day zero |
| 6.6 | ⌁ Contrast: the 10px oxide kicker on `--card`, and ochre at 9.5–10.5px, in the **lifted Day palette** — both were flagged unverified in R4 and both sit on changed ground |
| 6.7 | The active station carries `aria-current`; the active day chip carries `aria-current="date"` |
| 6.8 | Every fold's control carries `aria-expanded` matching its region's state |
| 6.9 | With `prefers-reduced-motion`, no element has a non-zero `transition-duration` or `animation-duration`; press states still change on `:active` |

## 7. Responsive — `tests/visual/containers.spec.ts`

| # | Statement |
| --- | --- |
| 7.1 | At 743px the phone model renders; at 744px the tablet model does; at 1180px the desktop model does |
| 7.2 | ⌁ The switch is driven by **container** width, not viewport — assert by narrowing the container inside a wide viewport |
| 7.3 | ⌁ No `navigator.userAgent`, no `window.innerWidth` branch and no device-name string appears in guide JS |
| 7.4 | On all nine devices: `scrollWidth === clientWidth` on the rail and on the page — no horizontal overflow |
| 7.5 | ⌁ On the phone, no content renders under the status-bar zone; the scroll region begins below the reserved top inset |
| 7.6 | Every fixed edge computes `max(reserved, safe-inset)`, and a zero-inset environment still leaves the reserved gap |
| 7.7 | The Fold at 673×841 renders the phone model in portrait and the tablet model in landscape, with no device check |

## 8. CSS gates — existing, must stay green

| Gate | What it catches |
| --- | --- |
| `src/styles/var-defined.test.ts` | a `var()` nothing declares. CSS does not error on those |
| `src/styles/type-scale.test.ts` | a raw `font-size` outside the scale. **Expect this to fail first** |
| `src/styles/atlas-tokens.test.ts` | the contrast contracts, including the four `--on-*` tokens that must not re-map and the two that must |

Add to `atlas-tokens.test.ts`: ⌁ **`[data-field="glare"]` does not exist**, and the seven lifted
Day tokens hold their exact values.

## 9. Regression pins — `tests/pins.test.ts`

⌁ Every one of these was a real defect in this design cycle.

| # | Pin |
| --- | --- |
| 9.1 | The rail is built from the guide, so adding a station cannot leave a stale count in copy |
| 9.2 | The thumb bar seats the current group for all 13 Korea stations |
| 9.3 | Sheets animate **and** leave the tab order when closed — both, not one |
| 9.4 | Ledger, travellers and settle-up read one shared tuple shape; a mismatch renders a tone name where a figure belongs |
| 9.5 | Desktop and phone read the **same** trip data module. Data belongs to the guide, not to a viewport |
| 9.6 | `ensureGuide(slug)` is guarded on the tools screen, not at the call sites |
| 9.7 | Trip Split's seeding function does not exist |
| 9.8 | No guide surface renders a sheet, plate or guide number |
