# Screenshot index

Twenty-one captures. Each names the spec section it evidences and what to look at.

⚠ **Two capture caveats, unchanged.** The screenshotter re-renders the DOM rather than taking a
pixel capture, so (a) Wikimedia photographs come out blank — every empty framed plate holds a
real photo in the running prototype — and (b) the mobile canvas cannot capture its own iframes,
so the phone frames appear empty. **Run the prototype for anything depending on imagery or the
phone layout.** These are for structure, spacing, and colour.

| File | Surface | Read it for |
| --- | --- | --- |
| `01-cover.png` | Cover, before the iris | Benchmark mark, wordmark tracking, scroll cue |
| `02-world-view.png` | Globe, light | Overlay placement, pin cards, sheet furniture |
| `03-table-view.png` | Table view, dark | Sticky search, chips, quick card, sheet rows |
| `04-guide-masthead.png` | Guide masthead | Plate proportions, corner ticks, plate line |
| `05-guide-panels.png` | Guide body | Panel grid, span rules, stretch |
| `06-tools-trip-split.png` | Trip split | Seeded rows, settle-up, category bars |
| `07-tools-closures.png` | Closures | Holiday partition, scanned closures, check dates |
| `08-mobile-frames.png` | Mobile canvas | Frame setup only — see caveat |
| `09-mobile-frames-scrolled.png` | Mobile canvas, scrolled | Frame setup only — see caveat |
| `10-tools-jetlag.png` | Jetlag | Reading scale in use; dead-zone copy |
| `11-tools-reminders.png` | Reminders | `BOOK AHEAD` flags, booking-first sort, tick state |
| `12-tools-route-order.png` | Route order | Leg list, total, the straight-line disclaimer |
| `13-dark-world-view.png` | Globe, dark | Terminator over the dark ground; oxide unchanged |
| `14-guide-masthead-dark.png` | Masthead, dark | Oxide coordinates on `--bg #0f1317` |
| `15-guide-panel-grid-dark.png` | Panel grid, dark | `--card` against `--bg`; hairline weight |
| `16-provenance-popover.png` | Popover open | Order of contents; `WHERE THIS CAME FROM` header |
| `17-panels-collapsed.png` | All panels collapsed | Collapsed padding `12px 16px`; `+ EXPAND ALL`; no dead space below |
| `18-sources-tab.png` | Sources group | Stamp treatment on every reference |
| `19-guide-light-theme.png` | Guide, light | The same sheet in the other ground |
| `20-new-guide-intake.png` | New guide | Intake form; ranked priorities with drag handles |
| `21-table-view-light.png` | Table view, light | Quick card's 2px oxide border in daylight |

## What no screenshot can show you

Capture these from the running prototype before you build the corresponding piece:

- The **cover → atlas** sequence (fade, FLIP, iris) — timing is the whole point.
- The **hub card → masthead FLIP** at 850ms.
- **Pin cards riding the globe** during a drag, and the solver re-seating them.
- **Panel collapse** and the grid re-measuring under it.
- The **mobile chrome yield** and the swipe rubber-band.
- Every **photograph** in the product.
