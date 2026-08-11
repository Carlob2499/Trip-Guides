# Screens — composition, all three viewports

One build. The three models below are the same DOM under different container queries. There is
**no device-specific code**, and adding a device must require zero changes.

| Container width | Model |
| --- | --- |
| < 744px | **phone** — pill row, one column, thumb bar |
| 744–1179px | **tablet** — vertical spine rail, reading column, thumb bar retained |
| ≥ 1180px | **desktop** — horizontal spine rail, reading column + margin column |

Device matrix this was checked against:

| Device | CSS px | Model |
| --- | --- | --- |
| iPhone SE | 375×667 | phone |
| iPhone 15/16 | 390×844 | phone |
| iPhone 17 Pro | 402×874 | phone (**the benchmark**) |
| iPhone Pro Max | 440×956 | phone |
| Pixel | 412×915 | phone |
| Fold, unfolded | 673×841 | phone portrait · tablet landscape |
| iPad mini | 744×1133 | tablet |
| iPad Pro 11" | 834×1194 | tablet |
| iPad Pro 13" | 1024×1366 | tablet · desktop in landscape |

---

## 1. The guide masthead

**Purpose.** Say what this trip is, and — if it is happening — where you are in it.

**Layout.** `display: flex; flex-wrap: wrap; gap: 22px; align-items: flex-end`.

**The plate** — `flex: 1 1 560px`, `min-height: clamp(300px, 50vh, 540px)`, square, sunken bed
(`--sunken`), `1px var(--rule2)` frame, **2px oxide corner ticks at all four corners** (~18–19px
arms, inset 9px). **No graticule over guide photography** — it was tried and cut; at card scale
it read as dirt on the lens. The globe keeps its graticule because there it *is* the map.

**When there is no cover photograph** the plate keeps its size, its frame and all four ticks, and
says `NO COVER PHOTOGRAPH YET` at micro-label scale with one line of explanation. It does not
shrink to a caption and the text column does not reflow into the space — so the masthead a guide
is born with is the same shape as the one it grows into.

**Text column** — `flex: 1 1 380px`, `align-content: end`: kicker (dates) → title at
`clamp(2.5rem, 6vw, 4.8rem)/.98` → dek → per-guide chips (emergency numbers as `tel:` links in
ochre, currency, base).

**Live-state column** — `flex: none`, right: the status stamp, the day + local time at Reading
scale, and progress (`21 of 37 stops · 4 to book`). This is what filled R4's dead space at
desktop width.

**The plate line** beneath all of it: `border-top: 2px solid var(--accent)`, then

- the trip's **cities** at Reading scale in `--aink` — `Seoul · Daejeon · Busan`
- the **next leg** — `Next: KTX 08:30 → Daejeon`, 700/11px/.14em, `--aink`
- the check stamp, the fact and source counts, and `PRINT SHEET`

Anything the guide does not carry renders nothing. An unresearched guide's plate line is shorter,
never padded.

## 2. The rail and the context line

Desktop: horizontal spine (`COMPONENTS.md` §2). Tablet: the same stations as a **vertical** spine
in a left column, 200–240px wide. Phone: the pill row (§3).

Beneath it, always: the active group's kicker, its descriptor, and the resume line when one
exists.

## 3. The day station — the deepest surface

**Purpose.** Read today.

Composition, in order:

1. **Day scrubber** — every day of the trip, active expanded (`COMPONENTS.md` §4).
2. **Day card** (`--card`, `1px var(--rule)`, `20px 22px 22px`):
   - kicker: `DAY 4 OF 8 · SAT 11 JUL · NOW` (or `· PLANNED`, `· DONE`)
   - title, then the **lead** — the two always-visible lines
   - the pace chip (`999px`, `1px var(--rule2)`, `white-space: nowrap`)
   - **the present band**, if today is this day (`COMPONENTS.md` §9)
   - **the gap block**, if this day has one — directly under the lead, above THE LINE
   - **THE LINE** — the day's stops, each with time, name, note, `MAPS ↗`
   - **Today's checks** — the guide's own `checklist` items, ticks persisted
3. **Margin column** (desktop only, 300px): to-book, Trip Split summary, and the day's marginalia
   sitting **level with the stops they annotate** — which is why hovering one is legible, and why
   the column is not moved below the reading.

Phone drops the margin column entirely; each mark folds inline under its own stop.

## 4. Tools — the last station

A tool rail of four pills (Split · Closures · Reminders · Route), the active one oxide-filled,
above a Panel grid. **No tool invents its own layout language.**

| Tool | Reads from | Never |
| --- | --- | --- |
| Trip split | `src/features/trip-split/model/{money,records,settle,summary}.ts` | re-derive settlement in the UI |
| Closures | `src/data/holidays/{CC}-2026.json` + `src/lib/holidays.ts` | guess a country's holidays |
| Reminders | `checklist` arrays already in the guide JSON | author a checklist item |
| Route order | mapped points in the guide | present straight-line distance as transit time |

**One guard, one place.** Every entry into Tools loads the trip's data via `ensureGuide(slug)`
guarded **on the tools screen itself**, not at the call site.

### Trip Split, in detail

Four Panels: **Where the money went** (headline totals) · **Travellers · running net** with
**Settle up** · **Add expense** (spans `1 / -1`) · **The ledger**.

**It ships empty.** `$0.00` · per person `$0.00` · largest single line `—` · expenses entered
`0` · every traveller `paid $0.00 · owes $0.00` with a net of `—` (**not `+0.00`**, which claims
a positive balance) · settle-up reads *"Settle up · nothing to settle yet"* with no *mark paid*
control and the stamp *"nothing paid yet — add an expense to start"* · the where-it-went bars are
**hidden**, not drawn at zero · the ledger shows one row, *"Nothing recorded yet — add what you
paid"*, rather than a bare header.

**Add expense** uses the shipped form's real fields, from `src/features/trip-split/ui/trip-split.js`:

| Field | Control |
| --- | --- |
| `desc` | text, placeholder "What for?" |
| `amount` | number, with a ₩/$ toggle and the conversion stated beneath at the guide's **sourced** rate |
| `category` | text, placeholder "e.g. Food" |
| `paidBy` | one person |
| `participants` | any number — a two-person split comes from **this set**, never an invented `per` value |
| `method` | `EQUAL` visible; `EXACT`, `PERCENTAGE`, `SHARES` behind one folded line |

A live preview restates the row in the model's own terms and is computed from the same
arithmetic, so it cannot disagree with the ledger.

## 5. Field log — its own station, after Sources

Rendered from `_guide.json → learnings`: summary, key learnings, day cards in a snap rail (green
top border where the day worked, oxide where it did not), skipped items, and what changed in the
guide since.

**The station is not drawn at all for a guide with no `learnings` record.** Korea has thirteen
stations; Sedona has nine. The rail is built from the guide, never from a fixed list — an empty
Field log is a promise the guide cannot keep.

## 6. Day zero — a guide before its trip

`prototypes/Waypoint Sedona.dc.html` is the reference. Nine absences, none of them errors:

| Absent | What the design does |
| --- | --- |
| Cover photograph | the plate keeps its shape, frame and ticks, and says so |
| Field log | the station is not drawn |
| The present | no live band, no pulsing dot, no deadline. Nothing fills the space |
| Any day walked | every chip reads `planned`; day 1 is selected because it is first |
| Ticks | `0 of 6`, denominator shown. A checklist that hides its denominator loses the reader |
| Expenses | `$0.00`, no nets, no transfers, bars hidden |
| A resume line | absent. **Never** replaced with an invented "start here" |
| A sourced rate | no rate line at all — never `1.00`, which implies a check nobody made |
| — | the four *real* gaps stay loud: unpublished spa prices, an unofficial parking fee, day-of-week hours, an active closure order |
