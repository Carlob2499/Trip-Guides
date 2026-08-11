# What this supersedes

**Read this before you trust anything in `docs/`.** The repo carries a full earlier design
revision (R4). This bundle is **R5**. R4 is still largely correct and you should keep reading it
— but the following statements in it are now wrong, and a developer who follows them will build
the wrong product.

Every row below must be **amended in `docs/design-handoff/DESIGN.md` in the same pull request**.
Nothing here is a silent override. If you cannot amend a document, say so in the PR body rather
than leaving the contradiction in the repo.

---

## 1. Navigation

| R4 says | R5 says | Why |
| --- | --- | --- |
| Tab rail: pills, horizontally scrollable, active pill filled oxide, sticky at `var(--hdr-h)` | **Spine rail**: every section group is a station on one 2px horizontal line; the current station is a filled oxide dot with a halo ring; a context line beneath carries the active group's descriptor and the resume line | Eleven-plus groups overflowed a pill rail, and a pill rail says "these are categories". A spine says "this is one journey and you are here" |
| One rail for every viewport | Spine rail on **tablet and desktop**; a swipeable **pill row with a 2px progress line** on the **phone** | Thirteen stations do not fit a 402px line, and a rail whose ends you cannot see stops being a rail. The progress line carries the ordinal position the rail was giving up |
| Tools reachable from four entry points (hub header, guide header, table view, mobile ☰) | **One** entry point: Tools is the **last station on the rail** | `SPEC-COMPONENTS.md` §7 already warned that the call site which forgets `ensureGuide(slug)` is the one that ships, and that on mobile the ☰ was the only route in. One route cannot be forgotten |
| Field log rendered inline at the bottom of the guide body | Field log is **its own station**, after Sources | Rendering a retrospective at the bottom of the body puts post-trip content in front of a reader who is mid-trip |
| Breakpoints 760 / 900 / 620 | **Container queries at 744 and 1180** for the guide body; viewport media queries kept for page chrome only | One build serves phone, tablet and desktop with no device check and no user-agent sniffing |

## 2. Palette

| R4 says | R5 says | Why |
| --- | --- | --- |
| Day: `--bg #dfe3d9` `--card #f8faf3` `--sunken #d2d7c8` `--ink #171d24` `--muted #4e5747` `--rule #bec6b2` `--rule2 #a3ac98` | **`--bg #e3e7dc` `--card #fbfcf6` `--sunken #ced5c4` `--ink #0f141a` `--muted #3c4534` `--rule #a9b39b` `--rule2 #8a9480`** | Lighter paper, darker ink, darker rules. The palette people actually read on is the one that has to hold up in direct sun |
| — | **There is no third palette.** A "Glare" theme (`[data-field="glare"]`, `--bg #000`, `--accent #ff6a2b`) was built during review and **deleted, not hidden** | A third palette is a third contrast surface for `atlas-tokens.test.ts` to police, and one nobody remembers to switch into |

Everything else in the token set is **unchanged**: accent `#9c4421` (does not re-map between
themes — a guide's colour is a fact about the guide, not about the reader's display), `--aink`,
`--on-aink`, `--green`, `--ochre`, `--crit`, `--cta`, and the whole Night palette.

## 3. The masthead and the plate line

| R4 says | R5 says | Why |
| --- | --- | --- |
| Plate line carries **coordinates** at `clamp(1.3rem, 3vw, 2.2rem)` in oxide, and a plate stamp `PLATE NN — CC` | Plate line carries the trip's **cities** at reading scale (`Seoul · Daejeon · Busan`) and its **next leg** (`Next: KTX 08:30 → Daejeon`) | A decimal coordinate pair is not information a traveller standing in Seoul uses. The cities and the next leg are |
| Guide numbering on every surface (`SHEET 02`, `PLATE 02 — KR`, `GUIDE 02`) | **No numbering on guide surfaces.** Cities and dates instead | It carried nothing a traveller uses. **`sheetOrdinal` and `src/lib/sheet-order.ts` stay** — the atlas hub still indexes by number, and that is a legitimate index |
| The masthead's right column ends after the chips | The right column carries the **live trip state**: an `ON THIS TRIP NOW` / `UPCOMING` / `COMPLETE` stamp, the day and local time, and progress (`21 of 37 stops · 4 to book`) | That space was empty at desktop width and the state was the most useful thing to put in it |

**Coordinates survive on the globe.** The atlas hub's live sheet-centre readout, its compass rose
and its scale bar are unchanged. Coordinates there *are* the map. They are not on the guide page.

## 4. Trip Split — a deliberate reversal

| R4 says | R5 says | Why |
| --- | --- | --- |
| Trip Split **seeds itself** from the guide's `budget` section: `basis:"day"` rows × days, `per:"group"` rows as one shared bill, everything else × party. Seeded rows stamped **✓ FROM THE GUIDE** | Trip Split **never seeds**. It **ships empty**: `$0.00`, no travellers in deficit, no transfers, the where-it-went bars hidden rather than drawn at zero, and the line *"Nothing recorded yet — add what you paid."* | **An estimate is not a debt.** Seeding "meals per day, $32" produces a settle-up demanding transfers for money nobody spent. The forecast is real and useful — it belongs in the guide's own Budget panel, labelled a forecast, where it already lives |
| — | **No row in Trip Split ever carries `✓ FROM THE GUIDE`** | Nothing in that tool is vouched for by the guide |

⚠ **The mockups' six-row sample ledger has been deleted.** If you find it in an older copy of the
prototypes, it is not data. It was a plausible reconstruction of prices the guide records, and a
plausible number in a product whose claim is that facts trace to a check is worse than no number.

## 5. Tools

| R4 says | R5 says | Why |
| --- | --- | --- |
| Five tools: trip split, jetlag, closures, reminders, route order | **Four.** Jetlag is removed as a tool | Its one useful output — the body-clock reading at 11pm local on arrival night — is a fact about the flight, read once before departure. It moves into the **Plan** group |
| Route order presents an ordered list with leg distances | Route order **hands off**: every leg carries `OPEN IN MAPS ↗` built from the guide's own coordinates, plus one **whole-day** multi-stop link | A route you cannot walk is a table |

`src/lib/jetlag.ts` and `src/lib/tz-offset.ts` **stay** and keep their tests. Only the tool's
placement changes.

## 6. Prose

| R4 says | R5 says | Why |
| --- | --- | --- |
| Panel sections carry a lead/more-detail fold | **Every long explanation folds the same way**: two lines always visible, the rest opens in place — hover on desktop (pointer: fine), tap on touch — at **unchanged type size** | The reader needs the space, especially on a small phone, and an explanation that shrinks when it opens is a punishment for opening it |

## 7. The Red Ink Rule — extended, not replaced

R4: one red-ink moment per viewport, spent in exactly four places — a plate line, a gap, a stale
warning, SOS.

R5 allows **one second moment: the present.** The live band on the day being read — what is
happening now and when it ends — may take reading-scale accent alongside one of the four. Nothing
else qualifies: not the current day chip, not a "you are here" dot, not a countdown on a future
day. If a screen has to choose, the present wins and the other four stand down.

The rule governs **reading-scale** accent. It does **not** govern the 10px panel kicker, which is
notation and appears on every panel by R4's own component spec.

---

## Unchanged and reaffirmed — do not re-litigate

The Panel as the one repeated unit · the panel grid and its full-width → open → collapsed sort ·
the notation family (dot, chip, stamp, reading) · the gap block and its loudness · the plate with
corner ticks · Literata + Source Sans 3 and no third face · radius 0 on containers and 999px on
controls, nothing between · `max(reserved, var(--safe-*))` on every fixed or sticky edge, never
bare `env()` · `prefers-reduced-motion` **disables** motion, it does not soften it · transform and
opacity only on per-frame paths · the atlas hub, the cover, table view and the globe.
