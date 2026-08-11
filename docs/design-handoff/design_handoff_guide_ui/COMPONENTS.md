# Components — exact measurements

Companion to `SCREENS.md`, which says what each screen *is*; this file says what each part
*measures*. Where a number appears here and in a prototype, **this file wins**.

Every component below is built from tokens in `TOKENS.md`. A literal hex, size or duration in
your CSS that is not in that file is a bug, with two exceptions noted inline.

---

## 1. Panel — the unit the whole product is made of

```css
.panel {
  background: var(--card);
  border: var(--rw, 1px) solid var(--rule);
  border-radius: 0;
  padding: 16px 20px 18px;      /* collapsed: 12px 16px */
  height: 100%;                  /* stretch to the row, never stagger */
  display: flex;
  flex-direction: column;
}
.panel__kicker { font: 700 10px/1 var(--fs); letter-spacing: .22em; text-transform: uppercase; color: var(--aink); }
.panel__title  { font: 500 1.45rem/1.2 var(--fd); color: var(--ink); }
.panel__rule   { height: 1px; background: var(--rule); margin: 10px 0 12px; }
```

Header row: kicker + `⠿` drag handle left, `−`/`+` collapse right. Both `min-height: 32px` hit
areas, both `data-noprint`.

**State.** Collapse state and Panel order persist in `localStorage`, **keyed per scope**
(`guide slug + section group`). A global key is wrong: collapsing the budget Panel in Korea must
not collapse it in Denmark.

**Collapse motion.** GSAP height + opacity, **340ms `power2.inOut`**, with the grid re-measuring
on the tween's **update** tick — not only on complete, or the row height lags a frame and the
page visibly jolts at the end of every collapse.

Each section group also gets a **COLLAPSE ALL / EXPAND ALL** control in its header.

---

## 2. Spine rail — tablet and desktop

The R5 replacement for the tab-pill rail. One horizontal 2px line; every section group is a
station on it; Tools is the last station; Field log sits after Sources when the guide has a
`learnings` record and **is not drawn at all when it does not**.

```
──●────────●────────●────────◉────────●────────●──   2px var(--rule), the line
  Plan  Essentials Transit  Days   Sights  Sources
```

| Part | Spec |
| --- | --- |
| The line | `height: 2px`, `background: var(--rule)`, insets 9px each end, sits at the vertical centre of the dots |
| Station dot, inactive | 11px circle, `var(--rule2)`, `2px solid var(--bg)` ring so it punches through the line |
| Station dot, active | 11px circle, `var(--accent)`, plus a halo: `box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 22%, transparent)` |
| Station label, inactive | `400 11px/1.25 var(--fs)`, `var(--muted)`, centred, wraps to two lines |
| Station label, active | `700 11px/1.25 var(--fs)`, `var(--ink)` |
| Hit area | the whole station column; `min-height: 44px` including the label |
| Distribution | `display: flex`; every station `flex: 1`. Equal widths, not content widths — the rail is a scale, and unequal stops read as unequal importance |
| Context line beneath | `padding: 9px 0 14px`, `border-top: 1px solid var(--rule)`; kicker (the group name, 10px/.22em/`--aink`) + descriptor (13px `--muted`) + right-aligned resume line |

**The resume line is absent when nothing is remembered.** Never a fabricated "start here".

**Sticky.** The rail sticks at `var(--hdr-h)`. **The header measures its own height into that
variable on every update and on resize** — do not hardcode the offset and do not compute it once
on mount. The header's height changes with the theme toggle's label, the trip chip, and mobile
chrome yield.

## 3. Pill row — phone only

```
( Plan )( Essentials )( Transit )(●Days●)( Sights ) …   [SOS]
────────────────────────▓▓▓▓▓▓▓───────────────────────   2px progress
day 4 of 8 · sat 11 jul                        ALL 13 ▾
```

| Part | Spec |
| --- | --- |
| Row | `display: flex; gap: 7px; overflow-x: auto;` `padding: 0 0 7px`, scrollbars hidden |
| Pill | `min-height: 40px`, `padding: 0 14px`, `border-radius: 999px`, `1px solid var(--rule2)`, `700 12px/1 var(--fs)`, `letter-spacing: .05em`, `white-space: nowrap` |
| Pill, active | `background: var(--accent)`, `color: var(--on-aink)`, border `var(--accent)`, `aria-current="true"` |
| Progress line | `height: 2px`, ground `var(--rule)`; the fill is `var(--accent)`, `width: (100 / stationCount)%`, `left: (index / stationCount * 100)%`, transitioning `left` and `width` over **280ms `cubic-bezier(.22,1,.36,1)`** |
| SOS | `min-width: 52px`, `min-height: 44px`, `999px`, `1px solid var(--crit)`, transparent ground, `700 11px/1 var(--fs)` |
| Sub-line | `min-height: 34px`, the day/descriptor left in 9px/.16em `--muted`, `ALL <n> ▾` right in `--aink`. The whole line opens the Journey sheet |

**Keeping the active pill in view.** On station change, scroll **the pill row's own scroller**:
`nav.scrollLeft = el.offsetLeft - (nav.clientWidth - el.offsetWidth) / 2`.
**Never `scrollIntoView`** — it scrolls every ancestor, including the page.

The progress line's width is `100 / n` where `n` is **this guide's** station count. Korea is 13,
Sedona is 9. Never a constant.

## 4. Day scrubber

All of a trip's days fit without scrolling; the active day expands to keep its date, the rest
show a numeral.

| Part | Spec |
| --- | --- |
| Row | `display: flex`, phone `padding: 9px 12px 10px`, desktop `gap: 5px` |
| Chip | `flex: 1` inactive, **`flex: 2.4` active** (phone) / `2.2` (desktop); `min-height: 44px` phone, 52px desktop; `min-width: 0`; `overflow: hidden` |
| Chip, active | ground `var(--sunken)`, `border-bottom: 2px solid var(--accent)` |
| Chip, inactive | transparent ground, `border-bottom: 2px solid transparent` (phone) / `var(--rule)` (desktop) |
| Numeral | `700 12px/1 var(--fs)`, tabular |
| Date | shown on the active chip only (phone); shown on all chips (desktop, where there is room) |
| State label | `done` / `now` / `next` / `planned`, 9px/.16em uppercase |

**`now` exists only if today falls inside the trip.** A pre-trip guide has no `now` chip, and
day 1 is selected because it is first, not because it is current.

## 5. Marginalia — the fold

Every long explanation folds identically.

```css
.fold { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 240ms ease; }
.fold > * { overflow: hidden; }
.fold[data-open] { grid-template-rows: 1fr; }
```

- **Two lines always visible** above the fold, at Lead size. Clamp with `-webkit-line-clamp: 2`.
- **Type size does not change when it opens.** An explanation that shrinks on open punishes the
  reader for opening it.
- **Desktop** (`@media (hover: hover) and (pointer: fine)`): opens on hover **and** on click, so
  it is reachable without a pointer. Keyboard: it is a `<button>`; Enter/Space toggles.
- **Touch**: tap only. No hover.
- `aria-expanded` on the control, `id`/`aria-controls` on the region.
- **Print force-opens every fold.**

## 6. Notation — four sizes of one idea

| Mark | Face | Size | Tracking | Weight | Border |
| --- | --- | --- | --- | --- | --- |
| Provenance dot | — | `1em` circle | — | — | `1px var(--rule2)`; oxide on hover/focus |
| Flag chip | `--fs` | control size, never smaller | .08em | 640 | `1px currentColor`, pill |
| Stamp | `--fs` | `0.82rem` | .08em | 640 | `1px` of its own ink, square |
| Reading | `--fs` | `clamp(1.5rem, 1.2rem + 2.4vw, 2.6rem)`, floor 24px | — | 600, tabular | none |

**The dot is a button.** It takes focus, has a 44px effective target through padding, and opens
the popover **on click, not hover** — hover-only provenance is unusable on the device this
product is actually read on.

**Popover contents, in order, no exceptions:** the claim → `✓ CHECKED <date>` → the staleness
reading → the source link (`SOURCE · host ↗`) or `NO PUBLIC SOURCE`.
Positioned clamped into the viewport:
`left: max(12px, min(anchorX - 160, innerWidth - 340))`.

**Staleness** uses `SHELF_LIFE_DAYS` — `fx: 7, transit: 90, hours: 90, venue: 180, default: 90`:

- past its life → `⚠ N DAYS OLD — M PAST ITS <CATEGORY> SHELF LIFE`, in `--ochre`
- inside the final third → `AGEING — N DAYS OF SHELF LIFE LEFT`
- otherwise → **no staleness line at all. Silence is the healthy state.**

## 7. The gap block — honest absence

```
┌─ 2px solid var(--ochre) ──────────────────────────┐
│ ⚠ NOT CONFIRMED                    Reading scale  │
│ ─────────────────────────────────  1px rule       │
│ what was looked for and what was found            │
│ WHAT TO DO INSTEAD — …             stamp scale    │
└───────────────────────────────────────────────────┘
```

Never styled down to look less alarming than it is. **Never collapsed by default.** Never
generated to fill a surface — a gap is produced by research coming up short and saying so, and
filling one requires a sourced fact, not prose. It spans the card's full width.

The product's entire claim rests on this block being as loud as a fact.

## 8. Status stamps

`COMPLETE` — `--green` outline · `IN PROGRESS` / `ON THIS TRIP NOW` — oxide fill with
`--on-aink` text · `UPCOMING` — oxide outline. Stamp typography (§6).
**Never a coloured dot without the word**; the word is the accessible carrier.

## 9. The present band — the second red-ink moment

Drawn on the day being read **only when today is that day**.

| Part | Spec |
| --- | --- |
| Ground | `var(--card)`, `1px solid var(--accent)` |
| Dot | 9px oxide circle with a 2.4s pulse ring (`box-shadow` 0 → 7px, opacity .5 → 0) |
| Label | `NOW · <what>` in `--aink`, 700, .14em |
| Deadline | the next hard time, **15px, 700, boxed in `1px solid var(--crit)`** — not muted 13px. It is the thing that ruins the day if missed |

Absent entirely when the trip has not started or has finished. Nothing is drawn in its place.

## 10. Thumb bar — phone

Four slots, `min-height: 52px` each, above the home indicator with
`padding-bottom: max(26px, var(--safe-b))`.

**Ranking is `src/features/mobile-nav/model/rank.ts`, ported verbatim.** Do not re-derive:

- Counts are **per-device, in `localStorage`, keyed by the group's full name** — never telemetry.
  Telemetry is write-only on the client and is a cross-visitor aggregate; a stranger's average is
  not this traveller's habit.
- **The current group always holds a slot**, so the bar can never show a set that excludes where
  the reader is.
- An unopened group has **no count at all** — ranking falls back to the guide's own order rather
  than inventing a preference.
- **`seat()` keeps a promoted group where it already is.** Without it the two buttons trade
  places under the thumb that just tapped one.
- **`slotLabel()`** takes the head of a compound name ("Food & shopping" → "Food"), then
  truncates on a word boundary at 9 characters, but only if the stub stays readable. The full
  name stays in the accessible name and in the sheet.

Slots: two ranked content groups, then **JOURNEY**, then **TOOLS**.

## 11. Sheets — Journey, SOS, Groups, Add expense

All four share one implementation.

| Part | Spec |
| --- | --- |
| Scrim | `rgba(10,12,14,.5)`, opacity 0 → 1 over **220ms ease** |
| Sheet | `translateY(101%)` → `0` over **360ms `cubic-bezier(.22,1,.36,1)`** |
| Rows | opacity + `translateY(8px)`, **28ms stagger** |
| Closed state | **`visibility: hidden` + `aria-hidden="true"`**, with `visibility` in the transition list at a **matching .36s delay** |

**Both sheets stay mounted.** Mounting on open gives the browser no start state to transition
from, which is the jarring cut this replaced. And because they stay mounted, the closed subtree
must leave the tab order — `visibility: hidden` does that, transitions *discretely* so the exit
motion survives intact, and works where React declines to emit `inert`.

Verified in review: closed = 48 controls in the DOM, 30 focusable, 18 phantom stops removed.

## 12. Route hand-off

Every leg carries `OPEN IN MAPS ↗`, built from the guide's own waypoint coordinates:

```
https://www.google.com/maps/dir/?api=1&origin=<lat,lng>&destination=<lat,lng>&travelmode=transit
```

Plus one **whole-day** link chaining every stop through `&waypoints=<lat,lng>|<lat,lng>`.

Google Maps leads because Korea's own field log records Naver and Kakao underperforming it on
that trip. Distances are **straight-line** and must be labelled as such — never presented as
transit time.
