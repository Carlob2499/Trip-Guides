# Test Coverage Analysis

_Snapshot taken 2026-07-19. Reproduce with the command in "How these numbers were produced" below._

## TL;DR

The **pure-logic core is excellent** — every `model/` silo and almost every
`src/lib/` module sits at 88–100%, backed by **455 passing unit tests across 38
files**. That is exactly where the codebase chose to invest, and it shows.

The gaps are not in that core. They are in three places where *testable logic
still lives in an untested file*:

1. **The content-verification tooling** (`scripts/audit/`, `scripts/verify-guide.mjs`,
   `scripts/scaffold-guide.mjs`) — the machinery that enforces the product's #1
   promise ("Verified"). Pure parsers here are only ~20% covered.
2. **The `content.config.ts` schema** — 495 lines of Zod that gate every guide,
   with **zero tests asserting the rules themselves** (only build-time validation
   of whatever guides happen to exist).
3. **A slice of the client layer with no automated test of any kind** — not unit,
   not Playwright — notably `share`, `sos`, `voting`, the hub `wizard`, `palette`,
   `maps`, `reminders` UI.

Most of the raw `dist`/UI 0% is **by design** (DOM glue), so the headline
"19% lines" number is misleading. The recommendations below target *risk*, not
the percentage.

---

## The three test layers (what guards what)

| Layer | Tool | Runs in CI | Guards |
|---|---|---|---|
| **Unit** | Vitest (`npm test`) | `test.yml`, `deploy.yml` | Pure logic in `model/` + `src/lib/` + a few `scripts/*.test.mjs` |
| **Interaction / visual** | Playwright (`npm run test:visual`) | `visual.yml` | Built-page screenshots **and** real interaction flows (tab switching, swipe-nav, hash routing, currency converter, `?stops=` decode) for `hub`, `korea` guide, `itinerary`, `field-tools`, plus `a11y` axe scans |
| **Content facts** | audit/verify scripts | `content-audit.yml`, `recert.yml`, `graduate-guide.yml`, per-guide workflows | Guide facts: link liveness, photo existence on Commons, staleness, research/recency gates |

The key structural fact: the codebase **deliberately splits each feature into a
pure `model/` (zod + tested logic) and a DOM-only `ui/`** (the sealed-silo rule in
`CLAUDE.md`). So `model/*.ts` is heavily tested and `ui/*.js` is 0% in unit tests
— that 0% is intentional, and Playwright picks up *some* of it. This is a healthy
pattern; the analysis below respects it and only flags UI that **no** layer covers.

---

## Coverage snapshot

Aggregate over `src/**` + `scripts/**` (V8, `--all`, tests/mocks excluded):

```
Statements  18.72%   Branches  22.98%   Functions  20.70%   Lines  19.60%
```

That number is dominated by intentionally-untested DOM glue. The meaningful
breakdown:

**Well covered — leave alone (regression-guarded):**

| Area | Lines | Notes |
|---|---|---|
| `src/features/*/model/**` | 88–100% | exports 98, learnings 100, live-data 92–100, reminders 100, telemetry 100, trip-split 96–98, itinerary, share, voting, field-tools, trip-kit, firebase/outbox |
| `src/lib/**` | ~93% | buckets, contrast, lead-split, palettes, themes, trip-dates, tz-offset, holidays, jetlag, staleness, transit-links all ~100% |

**Partially covered — pure logic hiding in I/O files (the real, fixable gaps):**

| File | Lines | What's untested |
|---|---|---|
| `scripts/audit/lib.mjs` | 21% | `parseVerifiedDate`, `daysSince`, `extractLinks`, `extractPhotos`, `flatten` — all pure |
| `scripts/verify-guide.mjs` | 50% | rubric / gate logic 78–141, 189–205 |
| `scripts/scaffold-guide.mjs` | 11% | guide-JSON generation 232–298 |
| `scripts/recert.mjs` | 66% | 64–77 |
| `scripts/pipeline.mjs` | 63% | 155–178 |
| `src/lib/map-pins.ts` | 63% | lines 39–59 (weakest *tested* lib module) |

**Zero coverage, contains real logic (not just DOM glue):**

| File | Lines | Risk |
|---|---|---|
| `content.config.ts` | 0% (495 ln) | The master schema. Build validates *guides*; nothing validates the *rules* (tabBudget cap, flag semantics, prose-tag allowlist) against regression |
| `src/features/firebase/sync.js` | 0% (135 ln) | Outbox JSON guarding, **room-code generation** (unguessable = the security lock), `reportError` rate-limit cap, `bumpCounter` no-op-without-config |
| `scripts/split-guide.mjs` | 0% | Splits a draft into `NN-<group>.json` files — a bug corrupts guide directories |
| `scripts/gen-room-id.mjs` | 8% | Room-id invariants (length ≥ DB write-gate, alphabet) untested |
| `scripts/audit/{check-links,check-photos,check-apis,run-audit}.mjs` | 0% | Network I/O around testable decision logic |
| `src/pages/og/[slug].png.ts`, `recap/[slug].png.ts` | 0% | OG/recap image composition (cosmetic, lower risk) |

**Zero coverage but low-risk (thin glue over tested code):**

- `src/pages/guides/[slug].ics.ts` / `[slug].gpx.ts` — the real work (`buildIcs`,
  `buildGpx`, `collectWaypoints`, `collectDayEvents`) is in `features/exports`,
  which is **98% covered**. The endpoints are ~5 lines of wiring. Low priority.

**Zero coverage, DOM glue — expected, but note the blind spots below:**

- `src/scripts/guide-ui.js` (670 lines, 0%) — the single largest untested surface.
  An IIFE that reads config from the DOM; not exported, so not unit-testable as-is.
  Playwright *does* exercise its tab/hash/scroll behavior on the korea guide.
- `src/features/*/ui/*.js` — mostly expected 0%. **But** the following have **no
  automated test at any layer** (no `model/`, no Playwright spec touches them):
  `share/ui/share-panel.js`, `sos/ui/sos.js`, `voting/ui/voting.js`,
  `hub/ui/wizard.js` (the multi-step new-guide wizard, 209 ln), `palette/ui/palette.js`,
  `maps/ui/gmaps-render.js` (175 ln), `reminders/ui/reminders.js`,
  `learnings/ui/survey.js` (255 ln).

---

## Recommended improvements, ranked by risk × effort

### P1 — Test the "Verified" enforcement engine (high value, low effort — pure fns)

`scripts/audit/lib.mjs` holds the parsers every audit and the recert loop depend
on, and they're pure and trivially testable:

- `parseVerifiedDate(text)` — the function that reads "Checked [date]" stamps.
  Test: valid stamps, each month abbrev in `MONTHS`, malformed input → null,
  the boundary the recert cadence keys on.
- `daysSince(date, now)` — drives staleness. Test with an injected `now`
  (it already accepts one) across the recert threshold.
- `extractLinks(raw)` / `extractPhotos(guide)` / `flatten(sections)` — feed
  `check-links` / `check-photos`. Test extraction from nested sections, dedup,
  Commons `File:` shapes.

A regression here silently lets stale or unverified facts ship — the exact
failure the whole platform exists to prevent. **~1 test file, all synchronous.**

### P2 — Schema-contract tests for `content.config.ts` (high value, medium effort)

Build validates the guides that exist; it does **not** assert the refinements
still reject what they're meant to reject. Add a small suite that feeds crafted
objects to the exported schema and asserts:

- `tabBudget` enforcement fails a guide that exceeds its declared budget, passes
  one at exactly the budget (Korea's 11 / Denmark's 8 are the live cases).
- The prose-tag allowlist (`<p><b><i><a><ul><li><ol>`) rejects a `<div>`/`<script>`.
- `≈` / `⚠` flag fields and per-section "Checked [date]" stamps validate as
  documented.

This locks the doctrine into a test instead of tribal knowledge, and catches a
loosened refinement the day it's introduced rather than the day a guide trips it.

### P3 — `firebase/sync.js` pure helpers (medium value, medium effort)

Extract and test the non-DOM logic (mirrors how `model/outbox.ts` was already
peeled off and tested at 100%):

- **Room-code generation** — assert length (10), alphabet membership, and the
  *absence* of ambiguous chars (`0/o/1/l/i` are deliberately excluded because
  codes are read aloud). This is a security invariant: "the code itself is the lock."
- `reportError` rate-limit — the `_errCount >= 5` cap must hold (a render loop
  must not flood the DB).
- `bumpCounter` / `reportError` — no-op when `hasFirebase()` is false.

Do the same for `gen-room-id.mjs` (id length ≥ the rules' write-gate).

### P4 — Raise the partially-covered build tooling

`scaffold-guide.mjs` (11%) and `split-guide.mjs` (0%) transform guide JSON; a bug
produces malformed guide directories. Add unit tests over their pure transform
steps (they mirror the already-tested `graduate-guide`, `intake-schema`, and
`recert` script tests, so the harness pattern exists). Push `verify-guide.mjs`
(50%) up by covering the rubric/gate branches at 78–141.

### P5 — Close the small model/lib edge gaps (low effort, tidy)

- `src/lib/map-pins.ts` 39–59 (63% → the one weak tested lib module).
- `sun.ts` 115–119 — `fmtClock`'s invalid-timezone catch fallback.
- `staleness.ts` L44, `money.ts` L150, `settle.ts` 81/85 — single uncovered branches.

### P6 — Decide coverage policy for the untested UI blind spots

For the "no test at any layer" list (P... share panel, SOS sheet, voting, hub
wizard, palette, gmaps render, survey), pick one per feature intentionally:

- **Preferred:** peel any remaining pure logic into `model/` and unit-test it
  (the established silo pattern). The **hub `wizard`** is the best candidate — a
  multi-step form with real branching/validation logic worth isolating.
- **Otherwise:** add a Playwright interaction spec for the highest-risk flow
  (SOS is surfaced for emergencies; a broken share link is user-visible).

---

## Infrastructure recommendation

There is currently **no coverage tooling wired in** — `@vitest/coverage-v8`
isn't a dependency and there's no `coverage` script, so regressions in the
well-covered core are invisible until someone notices. Suggest:

1. Add `@vitest/coverage-v8` (dev) and a `"coverage": "vitest run --coverage"` script.
2. Set per-directory thresholds that **ratchet the strengths and ignore the DOM
   glue** — e.g. require `src/features/*/model/**` and `src/lib/**` to stay ≥ 90%,
   rather than a misleading global gate that the intentional 0% UI would force low.
   This protects the actual investment without pretending DOM glue should be 90%.

---

## How these numbers were produced

```bash
npm install
npm install -D @vitest/coverage-v8   # not yet a project dependency
npx vitest run --coverage --coverage.provider=v8 --coverage.all \
  --coverage.include='src/**/*.{ts,js}' --coverage.include='scripts/**/*.{mjs,ts}' \
  --coverage.exclude='**/*.test.*' --coverage.exclude='**/mocks/**' \
  --coverage.reporter=text
```

`npm test` alone = 455 tests / 38 files, ~3s, all green.
