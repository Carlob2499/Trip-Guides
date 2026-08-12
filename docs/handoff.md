# HANDOFF — the warm-start context

> **Ritual (binding):** this file auto-loads at session start via the SessionStart hook
> (`scripts/handoff-head.mjs`) — do not Read it again. Greet the creator with the
> **"Where we left off"** line below and the recommended next step. At SESSION END, rewrite
> the Snapshot + Where-we-left-off sections, move the PREVIOUS snapshot to
> `docs/archive/HANDOFF_ARCHIVE.md`, and commit. The ≤120-line budget is gated by
> `scripts/__tests__/docs-integrity.test.mjs`; deep context lives in the north-star docs.

## Operating rules (stable — rarely change)

- **Model economy:** research/recert/fact edits + mechanical builds run on **Sonnet**; **Opus**
  for design sessions and judgment/first-run-triage work. Remind the creator to
  `/model`-switch at session start.
- **Never number guides as milestones** — the product is the backbone; a new guide is the
  backbone exercising.
- Ship loop on every change: build → **lint** → **typecheck** → test → `astro preview` :4322 →
  grep `dist/` → commit → push to `main` (the only branch — `verify-live` guards every deploy).
  Lint and typecheck are not optional: CI runs all three and session #20 pushed red twice by
  treating build+test as the whole gate.
- North stars: `docs/reference/pipeline.md` (generation/maintenance) · `docs/reference/motion.md`
  (presentation/motion) · `docs/standards/guide-rubric.md` (quality bar) ·
  `docs/evidence/competitive-landscape.md` (market parity reference) ·
  **`docs/archive/PLAN_ATLAS_MIGRATION.md`** (the Atlas work order — FULLY TICKED as of Stage G's
  closeout, 2026-08-09, as is R5's build order. There is no plan document driving work now; the
  Open items list below is the queue. Read the ledger for how something got its shape, not for
  what is next).

## Snapshot (2026-08-11b — R5 cleanup and hub fidelity; six commits, every defect at a boundary)

Six commits on `main`, all four CI workflows green on each. 1734 vitest · 225 Playwright ·
build/lint/typecheck/drift clean. R5's ACCEPTANCE walk is unchanged: 47 ticked, 3 flagged.

**The retired Tools screen's chrome is gone, and deleting it had orphaned a stylesheet**
(`a2cb0d8` + `28828d8`) — dead with the tabs: ToolsScreen's `trips`/`inGuide` props, masthead and
trip picker, `guide-ui.js`'s `specialPanels`/`hasPanel`/`isSpecial`, 20 CSS classes. **Finding:**
removing `/tools/` removed the ONLY import of `src/styles/tools.css`, so the station shipped
unstyled while build, lint, typecheck, 1722 unit and 225 Playwright stayed green — none assert
appearance. `GuideLayout.astro` imports it now; `no-orphan-stylesheets.test.mjs`, which compared
only BASENAMES (11 of the 52 sheets share one, so a single `styles.css` import covered all nine
feature silos), is fixed and now fails on any unimported `.css`. Mutation-tested; specifiers
resolve against the importing file.

**The globe's pin cards had no box, and the world view ignored its own type scale** (`24d7411`).
`.atlas-pincard-body`, a `<span>` in an `<a>` with no `display` rule, was inline and added nothing
to the anchor's height; `CARD_FULL_H`/`CARD_COMPACT_H` were literals set when the card was
text-only, never updated once the photo plate arrived. Heights are now measured off a real card,
none written back; typography rebuilt against `docs/design-handoff/screenshots/` in both themes.
`tripRangeLabel()` (`src/lib/trip-dates.ts`) is new: the rail first reused `dateLine()`, whose
masthead city/date contract sent a kicker with no city list back whole, printing a place name in
the date column.

**The desktop hub now matches the screenshots** (`24d2516`) — WORLD VIEW / TABLE VIEW as two
bordered buttons centred on the viewport, theme button labelled, mobile untouched. Cards now glide
to their seat over 500ms (they teleported since the solver re-seats only on 90px of globe drift)
and take the overlay elevation idiom. `imgCredit()` (`src/lib/img-width.ts`) credits Wikimedia
Commons for a Commons FilePath URL, null otherwise. Two new `scripts/drift-real.mjs` exemptions,
both classes with reasoning.

**The hub carries no tools door at all** (`9cce036`, creator ruling) — the TRIP TOOLS row and the
phone's ☰ link both pointed at whichever guide the hub featured. Gone, with `.atlas-toolsrow`;
verified in compiled `dist/` that no `tools` href survives on the hub. The two tests asserting the
doors now assert their absence at both widths.

**Tables in panels were clipped and unreachable on a phone** (`7cf750a`), found walking every
station of all four guides at 375px and 1440px. `.card table{display:block;overflow-x:auto}`
dates from when content lived in `.card`; it lives in panels now and the selector was never
extended, so a table rendered at natural width inside a `<details>` with `overflow:hidden` —
Korea's Plan station had sixteen tables 360–418px wide in a 313px column, fifteen unreachable.
`.pnl table` joins that rule in `src/styles/guide.css`. Also fixed: hint bubbles measuring 0×0
because `hint.js`'s idle `fitAll` ran while their station was still `hidden`, and
`tests/visual/plate-line.spec.ts`'s `networkidle` flake.

## Open items

- **Three paydown lists, all recorded as baselines that can only shrink** — 153 design-drift
  violations (`scripts/drift-baseline.json`), 43 prose-shape offences, 16 over-commented test
  files (`a11y.spec.ts` at 37% is the worst). Plus 1280 surviving mutants; read
  `docs/generated/where-the-tests-are-blind.md` top-down, the table is sorted by where it hurts.
- **Two of the eleven are NOT done, and neither is quietly dropped.**
  · **Print preview** (part of #8) — page-print hands off to the browser's dialog (which HAS one);
    the budget sheet prints its document without ever showing one, wanting its own preview-then-print
    shell shaped by the synchronous-gesture constraint: `window.print()` must not sit behind an await.
  · **"Is there a need for the Next Guide?"** (#11). There is no "Next Guide" anywhere in this
    codebase. Rather than delete something I have misidentified — ask what it is.
- **A visual call for the creator.** SPEC-COMPONENTS rule 1 decided two ambiguous cases the
  kit's mobile screenshots could not settle: the bottom-bar slots and day chips are full pills.
- **Airports for Sedona/Japan** — record them WHEN flights get booked. No fact yet; don't invent.
- **The gap block and the "no cover" plate have still never rendered.** Both code paths are
  intact; no guide triggers either. A guide with an unconfirmed sight, or with its cover
  removed, would be the demonstration.
- `/about/` and `/new/` are not in the SW precache shell. Cover overlay does not trap focus.
- Cloudflare dashboard Git integration still failing 0s builds on every push.
- Korea 03: critic flagged a swapped 명동 label on the Gyeongbokgung map point → file its issue.
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.

## Where we left off

**Every defect that mattered this session was invisible to the unit suite — each lived where code
met a system it does not control** — the bundler's import graph (a stylesheet nothing imported),
a constant describing an element, stale once it changed, a CSS selector never extended to the
content's new container, and axe's view of a card. Two sat behind gates that were themselves
green — CLAUDE.md's Boundary Checks paying out: thirty seconds at the seam beats more unit tests.

**The 375px/1440px walk of all four guides is done** — the pass the previous handoff recommended,
`us` included. Nothing now escapes its container on any guide at either width.

**Still your call, and still the last thing between R5 and a clean ACCEPTANCE:** `.transit-link`
(189/guide) and `.dchip` stay under the 44px floor, counts that can only shrink
(`TARGET_BASELINE` in `tests/visual/a11y.spec.ts`). Raising the transit pills wraps every day
card's link row; raising the day chips gives up COMPONENTS §4's "whole trip in one row".

**Still needs you:** `eslint.config.mjs` is hook-protected, so the R5 bundle ignore line you
approved could not go in. `docs/design-handoff/design_handoff_guide_ui/prototypes/support.js`
carries an `eslint-disable` header instead.

**Recommended next step:** decide the 44px density question above. Nothing else is blocked — the
Atlas migration ledger and R5's build order are both fully ticked, so Open items is the queue.
