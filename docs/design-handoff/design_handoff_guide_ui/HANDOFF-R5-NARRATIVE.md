# Handoff — the guide view, redesigned

**For:** Claude Code, working in `Carlob2499/Trip-Guides`.
**Scope:** the guide sheet only — `src/layouts/GuideLayout.astro`, the block renderers, the
tools screen, and the mobile chrome. The atlas hub, the cover, and table view are **out of
scope and unchanged**.

**The mockups are `Waypoint Guide Desktop.dc.html`, `Waypoint Guide Mobile.dc.html`, and
`Waypoint Guide Tablet.dc.html`.** They are design references, not production code. They are
built in a React-flavoured template runtime because that is what the design tool renders; the
target is Astro + vanilla JS + plain CSS, exactly as `docs/ARCHITECTURE.md` describes.

Everything in those files that is *commentary about the design* — the review strip, the "what
got cut" list, the motion table, the device contact sheet, the annotation callouts — is
**scaffolding, not product**. It is gated behind a `chrome` prop and must not be ported. If you
find yourself building a panel whose content is a note about a design decision, stop: that is
scaffolding that leaked.

---

## 0. How to read this document

Three kinds of statement, and they carry different force:

- **KEEP** — already correct in the repo. Do not touch it. Porting it "for consistency" is a
  regression, because the repo version has tests behind it.
- **CHANGE** — a deliberate departure from a shipped behaviour or from `docs/design-handoff/
  DESIGN.md` R4. Every one carries the reason. If the reason does not hold in code, raise it
  rather than implementing it.
- **NEW** — did not exist before.

Where this file and `docs/design-handoff/DESIGN.md` disagree, **this file wins for the guide
view and only for the guide view**, and §9 lists every point of disagreement explicitly so
DESIGN.md can be amended in the same PR. Where this file and the *mockups* disagree, this file
wins for intent and the mockups win for tie-breaks on spacing.

---

## 1. What actually changes

The guide view today is: masthead → sticky tab rail of section groups → panel grid → field log
at the bottom, with tools on a separate screen. Six changes.

| # | Change | Why |
| --- | --- | --- |
| 1 | **The tab rail becomes the spine rail** — one horizontal line, every section group a station on it, the current one filled | A pill rail says "these are categories". A spine says "this is one journey and you are here". The guide is a trip, not a taxonomy. |
| 2 | **Tools becomes the last station on the rail** | Tools were a separate screen reachable four ways, and the mobile ☰ route was the one that broke (`SPEC-COMPONENTS.md` §7). One route in, on the rail, cannot be forgotten at a call site. |
| 3 | **Field log becomes its own station**, after Sources | It was rendered inline at the bottom of the body, which put retrospective content in front of a reader who is mid-trip. |
| 4 | **Jetlag stops being a tool.** Its one output moves into the Plan group | It is read once, before departure, and it is a fact about the flight. Four tools remain. |
| 5 | **Route order hands off to a maps app** instead of ending at a list | A route you cannot walk is a table. |
| 6 | **Explanatory prose folds.** Two lines always visible; the rest opens on hover (desktop) or tap (mobile), at unchanged type size | `DESIGN.md`'s Load-Bearing Margin Rule, applied to the guide body. Screen space is the scarcest resource mid-trip. |

Everything else — the plate masthead, the panel unit, the notation family, the gap block, the
print sheet — is KEEP.

---

## 2. The spine rail

**Replaces:** the tab-pill rail in `GuideLayout.astro` and its styles in `src/styles/guide.css`.
**Keeps:** the sticky mechanism, `--hdr-h`, and the group model. The rail is a restyle plus one
new element, not a new navigation system.

### Structure

```
─●───────○───────○───────○───────○───────○──────  ← 2px --rule, stations on it
 Plan   Essentials  Transit  Days   Sights   …
```

- The line is `2px solid var(--rule)`, full width of the shell, `z-index` below the stations.
- A station is a `<button>` carrying a dot and a label beneath.
- Dot: `10px` circle, `2px solid var(--rule2)`, `--bg` fill. **Active:** filled
  `var(--accent)`, no border, plus a halo `0 0 0 6px color-mix(in srgb, var(--accent) 18%, transparent)`.
  **Visited** (a group this device has opened): filled `var(--rule2)`.
- Label: Control type (`0.75rem`, 640, `.08em`). Active label `var(--aink)`, others `var(--muted)`.
- Hit target `min-height: 44px` including the label. Never smaller — the dot is not the target.
- The rail scrolls horizontally with `scroll-snap-type: x proximity` and the active station
  `scroll-snap-align: center`. On selection it calls `scrollIntoView`'s equivalent by setting
  `scrollLeft` directly — **do not call `scrollIntoView`**, it fights the sticky header.

### Station order

The guide's own group order from its numbered section files, then two appended:

```
…the guide's groups…, Field log, Tools
```

Field log is omitted entirely when the guide has no `learnings` record (Japan, Sedona) —
same rule as today. Tools is always present.

### The context bar

Directly beneath the rail, a single line: the active group's descriptor on the left, and the
resume line on the right (`resumeLine()` from `src/features/mobile-nav/model/rank.ts` — it
returns empty when nothing is remembered, and **an empty return renders nothing**; never
substitute a "start here").

### Named rules this must not break

- **The Measured Chrome Rule** — the rail sticks at `var(--hdr-h)`, measured, never a literal.
- **The Two Doors Rule** — the rail is the immersive door; the Groups sheet (mobile) and the
  in-guide search are the plain ones. Do not remove either.

---

## 3. The day scrubber

**NEW.** Appears only on `days`-group views. It is not a section type; it is chrome for one group.

- One control per day of the trip, in a single row that **fits without scrolling on a 375px
  screen**. Eight days at 375px is the design constraint that sets its type.
- Inactive days render as the numeral alone (`4`) plus a 3px state dot.
- The active day expands to carry its weekday and date (`Sat 11`). It is the only one that does.
- State dot colour: `--green` done · `--accent` now (with the `nowPulse` keyframe) · `--muted`
  next · `--rule2` planned.
- Selecting a day does **not** navigate; it swaps the day card in place.

Fitting rule: the row is `display:flex; gap:4px` with each numeral `flex:1 1 0; min-width:0`
and the active one `flex:0 0 auto`. Do not solve this with a media query — see §7.

---

## 4. The fold (explanatory prose)

Applies to every long body string in the guide: `prose` bodies, `panel` section detail,
day-stop notes, sight descriptions.

**Desktop.** Two lines visible, clamped with `-webkit-line-clamp:2`. The rest opens on
`:hover` **and** `:focus-within` of the containing element. No layout shift for neighbours:
the opening element is `grid-template-rows: 0fr → 1fr` on a wrapper with `overflow:hidden`,
transitioned 240ms. Because it is a grid-row transition and not a height animation, it does
not need GSAP and does not trigger layout on other elements.

**Mobile.** Identical markup, opened by tap on the whole row, with the row carrying
`aria-expanded`. No hover.

**Both.** Type size does **not** change between folded and open. That is the Load-Bearing
Margin Rule: notation relocates, it never shrinks.

**Do not** put an ellipsis button, a "read more" link, or a chevron on this. The clamp itself
is the affordance, and the whole row is the target.

---

## 5. Mobile

The mobile model is in `Waypoint Guide Mobile.dc.html`. It is **the same thirteen stations and
the same two themes as desktop** — not a reduced product.

### What is pinned

Exactly one strip, at the top: active station · active day · SOS. Tapping it raises the
**journey sheet** — the spine rail turned vertical. Nothing else is pinned at the top.

At the bottom, the **thumb bar**: four slots, `min-height:52px`, padded
`max(12px, var(--safe-bottom))`.

### The thumb bar runs on the shipped model — KEEP

`src/features/mobile-nav/model/rank.ts` is ported into the mockup **verbatim** and must be used
as-is in production. Its four behaviours, restated so they cannot be dropped:

1. `promoted()` — the **current group always holds a slot**. The bar can never show a set that
   excludes where the reader is.
2. Counts are per-device `localStorage`, keyed by the group's full name. **Never telemetry** —
   telemetry is a cross-visitor aggregate and a stranger's average is not this traveller's habit.
3. An unopened group has **no count at all**; ranking falls back to the guide's own order.
4. `seat()` keeps a promoted group where it already is, so two buttons never trade places under
   the thumb that just tapped one.
5. `slotLabel()` takes the head of a compound name and truncates on a word boundary at 9 chars,
   only if the stub stays readable. The full name stays in the accessible name.

Slots are: two ranked content groups · **ALL** (the Groups sheet) · **TOOLS**.

### Chrome yield — KEEP

`src/features/mobile-nav/model/yield.ts`, unchanged: `YIELD_AT 80`, `RETURN_AT 24`,
`JITTER 6`, `TOP_ZONE 140`. The 6px jitter floor is not a tuning value — scroll anchoring and
lazy images produce a 1–3px rebound on every settle, and an implementation that resets its
accumulator on any upward pixel can never yield at all. **Do not re-derive it.**

### Swipe between stations — KEEP

`src/features/mobile-nav/model/gesture.ts`, unchanged: `AXIS_LOCK_PX 24`,
`COMMIT_FRACTION 0.3`, `COMMIT_VELOCITY 0.5 px/ms`, finger tracking 0.9, rubber-band 0.28
capped 56px. A diagonal reads as vertical, deliberately.

### Sheets

Journey sheet, SOS sheet, Groups sheet, add-expense sheet. All four share one pattern:

```css
/* closed */  transform: translateY(101%); opacity: 0; visibility: hidden;
/* open   */  transform: translateY(0);    opacity: 1; visibility: visible;
transition: transform .36s cubic-bezier(.22,1,.36,1), opacity .36s, visibility 0s .36s;
/* open state overrides the visibility delay to 0s */
```

`visibility` transitions **discretely**, so it flips to hidden only after the slide completes:
the exit motion survives and the closed subtree leaves the tab order and the accessibility
tree. Pair it with `aria-hidden="true"`. **This is load-bearing** — the first implementation
kept closed sheets focusable and put 18 phantom tab stops in the page. `inert` was tried first
and is not reliably reflected by the runtime; use visibility.

Rows inside the journey sheet stagger `28ms` apart.

---

## 6. Tablet — a third model, NEW

A tablet is neither a large phone nor a small desktop, and treating it as either is the
mistake. `Waypoint Guide Tablet.dc.html` is the reference.

**Vertical spine rail on the left** (the stations stacked, ~168px), **reading column beside
it**, **and the thumb bar retained** at the bottom. It is a held device, so the thumb layer
stays; it has column width to spare, so the rail is permanent rather than summoned.

Applies at container width ≥ **744px** and < **1180px**. Above that, desktop. The unfolded Fold
(≈673×841) is below the threshold and therefore gets the **phone** model in portrait and the
**tablet** model in landscape — which falls out of the container query without a device check.

---

## 7. Responsiveness — container queries

**CHANGE from `DESIGN.md`'s breakpoint list.** DESIGN.md names viewport breakpoints (760 / 900 /
620). Keep those for *page chrome* (the header, the print rules). For the **guide body**, use
container queries instead:

```css
.guide-shell { container-type: inline-size; container-name: guide; }

@container guide (min-width: 744px)  { /* tablet model */ }
@container guide (min-width: 1180px) { /* desktop model */ }
```

Reason: the same panel appears in the guide body, in a tools grid, and inside a sheet at three
different widths on one viewport. A viewport breakpoint gets all three wrong at once. This also
means the Fold, split-screen multitasking, and Stage Manager all work with no device list.

Everything between the two container breaks is fluid — `clamp()` for the heading band,
`repeat(auto-fit, minmax(min(100%, 340px), 1fr))` for the panel grid, `flex:1 1 0` for the day
scrubber. **The device matrix in the mockup's contact sheet is proof, not configuration:** there
is no per-device code anywhere, and adding a device must require zero changes.

| Device | CSS px | Model |
| --- | --- | --- |
| iPhone SE | 375×667 | phone |
| iPhone 15/16 | 390×844 | phone |
| iPhone 17 Pro | 402×874 | phone |
| iPhone Pro Max | 440×956 | phone |
| Pixel | 412×915 | phone |
| Fold, unfolded | 673×841 | phone portrait · tablet landscape |
| iPad mini | 744×1133 | tablet |
| iPad Pro 11" | 834×1194 | tablet |
| iPad Pro 13" | 1024×1366 | tablet · desktop in landscape |

---

## 8. Tools

Four tools, all panel grids. No tool invents its own layout language.

| Tool | Reads from | Never |
| --- | --- | --- |
| Trip split | `src/features/trip-split/model/{money,records,settle,summary}.ts` | re-derive settlement in the UI |
| Closures | `src/data/holidays/{CC}-2026.json` + `src/lib/holidays.ts` | guess a country's holidays |
| Reminders | `checklist` arrays already in the guide JSON | author a checklist item |
| Route order | mapped points in the guide | present straight-line distance as transit time |

Jetlag is **removed as a tool** and its reading (`src/lib/jetlag.ts`, `src/lib/tz-offset.ts` —
both KEEP, both still used) renders in the Plan group. Do not delete the lib.

### Trip split holds money that changed hands — CHANGE

**The guide's `budget` block is NOT seeded into Trip Split.** This is a deliberate reversal of
`docs/design-handoff/README.md` §5, and the reason is one sentence: **an estimate is not a
debt.** `02-essentials.json`'s 19 rows are the author's own forecast — "meals per day, $32" is
a plan, not a bill anyone paid. Seeding them produces a settle-up demanding transfers for money
nobody spent, which is the exact opposite of the Honest Absence Rule.

The budget block keeps its own home: it renders as the **budget panel in the Essentials
station**, labelled as a forecast. Trip Split reads none of it.

**What Trip Split does hold:** rows a traveller entered, each with a real payer and a real
participant set. Every row is created through the add-expense form (§ below) or synced from the
Firebase room. **Nothing is auto-created.**

**The empty state is the correct first-run state,** and it must be built, not designed around:
no rows, `$0.00` paid, no nets, and a line saying *"Nothing recorded yet — add what you paid."*
Do not populate it to make the screen look finished. A trip split with nothing in it is what a
trip split looks like before anyone spends anything.

**The ledger ships empty, and the mockups now show it empty.** The six reconstructed rows that
stood in for it have been deleted. They were plausible, not sourced — and in a product whose
claim is that facts trace to a check, a plausible number lying in a ledger is worse than no
number. `$0.00`, no nets, no transfers, "nothing recorded yet — add what you paid", and the
where-it-went bars hidden rather than drawn at zero. This is the first-run state; build it.

**Still live from `SPEC-COMPONENTS.md` §7:** guard `ensureGuide(slug)` on the tools screen
itself, not at the call sites. With Tools now a station there is one entry point, which is most
of that problem solved — keep the guard where it is. (The provisional-seeding failure mode is
retired along with the seeding.)

### No row carries `✓ FROM THE GUIDE`

That mark means the guide vouches for the figure. With seeding gone, nothing in Trip Split is
vouched for by the guide, so the stamp does not appear in this tool at all. It stays in use
everywhere else — sights, budget, closures, reminders — where it is still true.

### Add expense — use the shipped field set

From `src/features/trip-split/ui/trip-split.js`, not from the handoff prose:
`desc` · `amount` · `category` · `paidBy` · `participants` · `method`
(`EQUAL | EXACT | PERCENTAGE | SHARES`, from `model/money.ts`).

A two-person split comes from the **participant set**, not from a `per` value. An earlier draft
of this design invented `per: "party2"`; there is no such field and `settle.ts` would not
honour it.

`EQUAL` is the default and the only method visible at rest; the other three sit behind one
folded "Split method" line. Four visible fields, four taps for the ordinary case.

---

## 9. Where this contradicts `docs/design-handoff/DESIGN.md` R4

Amend DESIGN.md in the same PR. Nothing here is a silent override.

| DESIGN.md R4 says | This says | Reason |
| --- | --- | --- |
| Tab rail: pills, active pill filled oxide | Spine rail: stations on a 2px line | §2 |
| Breakpoints 760 / 900 / 620 | Container queries at 744 / 1180 for the guide body; viewport breaks kept for page chrome | §7 |
| Five tools, jetlag among them | Four tools; jetlag folds into Plan | §1.4 |
| Field log rendered in the guide body | Field log is a station | §1.3 |
| Tools reachable from four entry points | One entry point: the last station | §1.2 |
| One tab rail for every viewport | Spine rail on tablet + desktop; a swipeable pill row with a 2px progress line on the phone | Thirteen stations do not fit a 402px line, and a rail whose ends you cannot see stops being a rail |
| Plate stamp `PLATE NN — CC`; sheet numbering on every surface | No numbering on guide surfaces — cities and dates instead | It carried nothing a traveller uses. `sheetOrdinal` stays: the hub still indexes by it |
| Day tokens `--bg #dfe3d9` … `--rule2 #a3ac98` | Seven day tokens lifted; no third palette | The palette people actually read on is the one that must hold up in sun. A Glare theme was built and cut |
| Trip split seeds from the guide's budget, seeded rows stamped ✓ FROM THE GUIDE | Never seeded; ships empty | An estimate is not a debt. Settling one demands transfers nobody owes |
| Red Ink Rule: one moment, four places | One moment, four places, **plus the present** | The live band on the day being read. Not the day chip, not a "you are here" dot, not a countdown |

**Unchanged and reaffirmed**, so no one re-litigates them: the token set and both themes ·
Literata + Source Sans 3 and no third face · radius 0 for containers, 999px for controls, and
nothing between · the panel as the one repeated unit · the plate, its sunken bed, its hairline
frame, and corner ticks meaning evidence and nothing else · the notation family (dot, chip,
stamp, reading) · the gap block at Reading scale in ochre, never collapsed by default, never
styled down · `--accent` identical in both themes · one red-ink moment per viewport ·
`max(reserved, var(--safe-*))` on every fixed edge · reduced motion **disables**, never softens.

Glare palettes appear in earlier drafts of these mockups. They are **deleted, not hidden** —
including the third one that briefly shipped as `[data-field="glare"]`. Two themes: Day and
Night. A palette nobody switches into is a third contrast surface for
`src/styles/atlas-tokens.test.ts` to police.

**CHANGE — Day's contrast is lifted instead.** `--bg #e3e7dc` · `--card #fbfcf6` ·
`--sunken #ced5c4` · `--ink #0f141a` · `--muted #3c4534` · `--rule #a9b39b` ·
`--rule2 #8a9480`. Lighter paper, darker ink, darker rules — the palette people actually read
on is the one that has to hold up in direct sun. Accent, green, ochre and crit are unchanged.
These seven values replace R4's day tokens; run `atlas-tokens.test.ts` against them.

---

## 10. Motion

Additions to the table in `SPEC-COMPONENTS.md` §9. Everything there stays.

| Moment | Duration | Curve | Property |
| --- | --- | --- | --- |
| Station change (rail) | 260ms | `cubic-bezier(.22,1,.36,1)` | opacity + `translateY(10px)` on the body |
| Day change (scrubber) | 220ms | `cubic-bezier(.22,1,.36,1)` | opacity + `translateY(6px)` on the day card |
| Fold open/close | 240ms | ease | `grid-template-rows: 0fr → 1fr` |
| Sheet (all four) | 360ms | `cubic-bezier(.22,1,.36,1)` | `translateY` + opacity + delayed `visibility` |
| Sheet rows | 28ms stagger | — | opacity + `translateY(8px)` |
| Scrim | 220ms | ease | opacity |
| Thumb-bar slot swap | 200ms | `cubic-bezier(.22,1,.36,1)` | opacity |

**Transform and opacity only.** The one exception is the fold, and `grid-template-rows` is used
precisely because it contains its own layout rather than pushing siblings. Nothing animates
`left`, `top`, `width`, or `height`.

`prefers-reduced-motion: reduce` sets every duration above to `0s`. Press states survive — they
are state, not motion.

---

## 11. Data attributes

Every interactive element carries one, so the enhancement scripts never select on class.

| Attribute | On | Read by |
| --- | --- | --- |
| `data-station="<group>"` | rail station button | rail script; `rank.ts` counts |
| `data-station-active` | the active station | CSS state |
| `data-day="<n>"` | day scrubber control | day script |
| `data-day-state="done\|now\|next\|planned"` | day scrubber control | CSS state |
| `data-fold` | any foldable prose wrapper | fold script; print force-expand |
| `data-fold-open` | an open fold | CSS state |
| `data-sheet="journey\|sos\|groups\|expense"` | each sheet root | sheet script |
| `data-sheet-open` | the open sheet | CSS state |
| `data-thumb-slot="0..3"` | thumb-bar buttons | `rank.ts` seating |
| `data-tool="split\|closures\|reminders\|route"` | tool rail pills | tools script |
| `data-noprint` | all chrome | `PRINT SHEET` — KEEP, already shipped |
| `data-screen-label` | station and day roots | review tooling |

`PRINT SHEET` continues to hide every `[data-noprint]` and force-expand every collapsed panel —
and it must now also force-open every `[data-fold]`.

---

## 12. State table

| State | Values | Persisted | Trigger |
| --- | --- | --- | --- |
| `station` | any group name, `field-log`, `tools` | `localStorage`, per guide slug | rail, journey sheet, swipe, thumb bar |
| `day` | 1..n | session, per slug | day scrubber |
| `theme` | `day` \| `night` | `localStorage` | header toggle — KEEP |
| `tool` | `split` \| `closures` \| `reminders` \| `route` | none | tool rail |
| `fold` | per-element open/closed | none | hover / focus / tap |
| `sheet` | `null` \| one of four | none | strip tap, thumb bar, SOS |
| `chromeYielded` | boolean | none | `yield.ts` — KEEP |
| `panelCollapse`, `panelOrder` | per panel | `localStorage`, keyed **guide slug + group** | panel header — KEEP |
| `checklist` | per item | `localStorage` | reminders — KEEP |

The panel-collapse scope key is per guide **and** per group. A global key is wrong: collapsing
the budget panel in Korea must not collapse it in Denmark.

---

## 13. Repo file map

| Piece | Files to touch |
| --- | --- |
| Spine rail, context bar | `src/layouts/GuideLayout.astro` · `src/styles/guide.css` · new `src/scripts/spine-rail.js` |
| Day scrubber | `src/components/blocks/DaysBlock.astro` · `src/styles/guide.css` |
| The fold | `src/styles/guide.css` · new `src/scripts/fold.js` · `src/styles/print.css` (force-open) |
| Field log as a station | `src/layouts/GuideLayout.astro` · `src/features/learnings/` |
| Tools as a station | `src/layouts/GuideLayout.astro` · `src/styles/tools.css` |
| Thumb bar, sheets, yield, swipe | `src/features/mobile-nav/` (models KEEP) · `src/styles/mobile-nav.css` |
| Trip split + add expense | `src/features/trip-split/ui/trip-split.js` (models KEEP) |
| Jetlag into Plan | `src/lib/jetlag.ts` KEEP · `src/scripts/jetlag-ui.js` moves its mount |
| Route → maps | `src/lib/map-pins.ts` (coordinates already there) |
| Container queries | `src/styles/guide.css` · `src/styles/base.css` |
| Tablet model | `src/styles/guide.css` (a container-query block, not a new sheet) |

**Guides' JSON is not edited.** This is a design-only change, exactly as the Atlas redesign was.
If a change appears to require editing a `"type"` value or a section file, it is the wrong
change.

---

## 14. Gates that must still pass

Run these before opening the PR; each catches a class of bug the others cannot.

- `src/styles/var-defined.test.ts` — a `var()` nothing declares. CSS does not error on these;
  the declaration is invalid at computed-value time and silently falls back.
- `src/styles/type-scale.test.ts` — a raw `font-size` outside the scale.
- `src/styles/atlas-tokens.test.ts` — the contrast contracts, including the four ink-on-fill
  tokens that must **not** re-map (`--on-aink`, `--on-accent`, `--crit-fill`, `--on-crit`) and
  the two that **must** (`--on-green`, `--cta`/`--cta-ink`).
- `tests/visual/a11y.spec.ts` — and specifically: **no focusable element inside a closed
  sheet**. That is the regression §5 describes.
- `src/features/mobile-nav/__tests__/` — `rank`, `yield`, `gesture`. If a model test fails, the
  design is wrong, not the test.

Two contrast pairings from the earlier handoff have still not been through an axe run and are
used here: the 10px oxide panel kicker on `--card`, and ochre at 9.5–10.5px. Verify both.

## 15. Acceptance

- Every station on the rail opens; the current station always holds a thumb slot, on all
  thirteen.
- Eight day controls fit on 375px with no horizontal scroll.
- No focusable element inside a closed sheet (probe: count `a[href],button` with
  `visibility !== hidden`).
- Trip split opens **empty** on a trip with no recorded expenses — `$0.00`, no nets, no
  transfers — and the guide's budget block is nowhere in it.
- A row added through the form recomputes totals, nets and settle-up from
  `trip-split/model/settle.ts`, and carries no `✓ FROM THE GUIDE` stamp.
- The budget forecast still renders as a panel in Essentials, labelled as an estimate.
- Every fold opens on hover **and** keyboard focus on desktop, and on tap on mobile, with no
  type-size change.
- `PRINT SHEET` produces a sheet with every panel expanded, every fold open, and no chrome.
- The guide body reflows correctly at 375, 673, 744, 1024, and 1504 with **no device-specific
  code** anywhere in the diff.

---

## 16. What is NOT built — read before estimating

The three `.dc.html` files are **design references**, not production code, in exactly the sense
`docs/design-handoff/README.md` uses the word. They demonstrate look, motion and behaviour. Six
things stand between them and a shippable build, and none of them is cosmetic.

**1. Nothing renders from content.** Every string in the mockups is hardcoded: one guide (Korea),
one trip state (day 4 of 8, mid-trip), one theme at a time. There is no loader, no
`content.config.ts` dispatch, no `Block.astro`. The real build renders thirteen stations from
whatever `NN-<group>.json` files a guide happens to carry — including guides with fewer groups,
no `days` block, or no `learnings` record (Japan and Sedona have none; the Field log station
must not appear for them).

**2. The Trip Split ledger is demonstration data** — see §8. It must be deleted, not ported.

**3. Motion is CSS transitions here; the repo uses GSAP.** The timings in §10 are correct and
were measured; the mechanism is not. Panel collapse in particular must be GSAP height + opacity
with the grid re-measuring on the tween's update tick — a CSS transition cannot re-measure the
grid mid-flight, which is the jolt `SPEC-COMPONENTS.md` §1 warns about. And
`prefers-reduced-motion` must **cut**, not soften.

**4. No gate has run.** Not one of the five in §14. The mockups' custom properties were checked
by hand, which is not the same thing. Expect real failures: the type scale is the likeliest,
since the mockups use inline `font`-shorthand sizes that `type-scale.test.ts` has never seen.

**5. The lifted Day palette has never been through an axe run.** Seven tokens changed
(`--bg`, `--card`, `--sunken`, `--ink`, `--muted`, `--rule`, `--rule2`) and Day is the palette
opened in direct sun, so its contrast matters more than Night's. Two pairings were already
flagged unverified in R4 — the 10px oxide panel kicker on `--card`, and ochre at 9.5–10.5px —
and both sit on the changed ground. Run the axe pass before this ships.

**6. No absent, failing or waiting states exist.** The mockups show one healthy state of
everything. The real build needs: offline (the PWA case — `public/sw.js` already exists), a
live rate that failed to fetch, a guide missing its budget block, a group with no sections, a
day with no stops, a photo that 404s, and search with no results. `docs/design-handoff/README.md`
already specifies the honest-absence behaviour for most of these; apply it.

### Suggested order

1. **Spine rail + day scrubber**, rendering real groups from a real guide. Nothing else. This is
   the load-bearing change and everything else sits on it.
2. **The fold**, applied to every long body string (§4). Cheap, and it is what makes the density
   work.
3. **Mobile chrome** — pinned strip, thumb bar wired to the existing `rank.ts`, journey sheet.
   Wire to the models; derive nothing.
4. **Tools as the last station**, with Trip Split's empty state and add-expense form.
5. **The lifted Day palette**, then the axe run, then fix what it finds.
6. **Absent states**, then the gates, then the PR — with the `DESIGN.md` amendment from §9 in
   the same PR.

Steps 1–3 are shippable on their own. Do not hold them behind 4–6.
