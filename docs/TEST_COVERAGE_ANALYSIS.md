# Test Coverage Analysis

_Snapshot taken 2026-07-19. Reproduce with the command in "How these numbers were produced" below._

**Status: implemented.** P1–P5 below are done (585 tests now, up from 455) and the
coverage gate from the Infrastructure section is wired into CI. See the "✅ done"
notes inline; P6 (the UI blind spots) is left as a judgment call for whoever picks
up that feature next, not something to force in this pass.

## TL;DR

The **pure-logic core is excellent** — every `model/` silo and almost every
`src/lib/` module sits at 88–100%, backed by **585 passing unit tests across 44
files** (was 455/38 before this pass). That is exactly where the codebase
chose to invest, and it shows.

The gaps were not in that core. They were in three places where *testable logic
lived in an untested file* — P1–P5 below closed the first two (and the
reachable parts of the third):

1. **The content-verification tooling** (`scripts/audit/`, `scripts/verify-guide.mjs`,
   `scripts/scaffold-guide.mjs`) — the machinery that enforces the product's #1
   promise ("Verified"). Pure parsers here were only ~20% covered → now the
   whole pure-logic surface of these scripts is tested (P1, P4).
2. **The `content.config.ts` schema** — 495 lines of Zod that gate every guide,
   which had **zero tests asserting the rules themselves** (only build-time
   validation of whatever guides happen to exist) → now 21 schema-contract
   tests (P2).
3. **A slice of the client layer with no automated test of any kind** — not unit,
   not Playwright — notably `share`, `sos`, `voting`, the hub `wizard`, `palette`,
   `maps`, `reminders` UI. **Still open** (P6) — it's a design decision (peel
   logic into `model/` vs. add a Playwright spec), left for whoever picks up
   that feature next rather than forced in this pass.

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

### P1 — Test the "Verified" enforcement engine (high value, low effort — pure fns) ✅ done

`scripts/__tests__/audit-lib.test.mjs` covers all five parsers below plus
`readGuides()` itself (refactored to take an injectable `guidesDir`, tested
against an isolated temp dir for both guide shapes, malformed JSON, and
non-guide directories) — 33 tests total.


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

### P2 — Schema-contract tests for `content.config.ts` (high value, medium effort) ✅ done

`src/content.config.test.ts` (21 tests) mocks the `astro:content` virtual module
(a thin `{ z, defineCollection }` stand-in — this repo has one hoisted zod
install, so it's the same `z` instance astro would hand back) so the real
`guides` schema can be `safeParse`'d directly, no Astro build needed. Covers:
tabBudget at/over the default and a custom-raised budget; the `theme.primary`
WCAG contrast gate on both the light and dark background independently; the
`provenance:"strict"` ≈-without-`verified_on` gate (and that ⚠ stays exempt);
both `learnings.days` cross-reference checks (date must match an itinerary day,
a skipped stop's `group` must be real); `roomId`'s regex; and `entry`/`advisory`'s
required provenance fields.

**Correction from the original analysis:** the "prose tag allowlist" is *not*
a `content.config.ts` refinement — grepping the schema found no such check. It's
a `waypoint-guide-author`-skill convention only (human/AI judgment at write time,
not machine-enforced), so there was nothing to add a schema test for.

### P3 — `firebase/sync.js` pure helpers (medium value, medium effort) ✅ done

`src/features/firebase/sync.test.ts` (12 tests, `./client.js` mocked so no real
Firebase SDK or network): `generateTripCode` (length 10, unambiguous-alphabet
membership, and the actual security property — never `0/o/1/l/i`, not just a
regex match); `normalizeCode` (RTDB-unsafe chars, truncation, empty input);
`reportError`/`bumpCounter`'s no-op-without-config posture; and the `_errCount
>= 5` rate-limit cap traced through 7 calls in one dedicated, order-sensitive
test (module-level state, documented why it must run where it does).
`scripts/__tests__/gen-room-id.test.mjs` (5 tests) covers `genRoomId` the same way.

### P4 — Raise the partially-covered build tooling ✅ done

- `scripts/__tests__/scaffold-guide.test.mjs` (24 tests) — `slugify`,
  `dayLabelsFromRange`, `buildGuideObject` (coord/iso wiring, niche section,
  currency symbol, budget sizing, draft/provenance/roomId invariants),
  `buildIntakeMd`. `writeScaffold`'s real disk I/O stays out of scope — it's
  exercised end-to-end by `new-guide.yml`.
- `scripts/split-guide.mjs` was refactored (same shape as `graduate-guide.mjs`):
  extracted `groupSections()` (pure, throws on non-contiguity instead of
  `console.error`+`process.exit`) and `splitGuide(slug, { guidesDir })` (real
  I/O, injectable dir, returns a result object instead of exiting directly);
  the CLI is now a thin `isMain()`-guarded wrapper. Verified byte-for-byte
  identical CLI behavior (same log lines, same exit codes) by running it
  against a throwaway guide in the real repo before/after.
  `scripts/__tests__/split-guide.test.mjs` (12 tests) covers the pure grouping
  logic plus the full split against an isolated temp dir.
- `verify-guide.mjs`'s `report()` was exported (mirroring the existing
  `renderMarkdown` export) and its branches tested; `verify()` itself is now
  tested with `readGuides`/`checkStaleness`/`check-links`/`check-photos` mocked
  out (7 new tests in `scripts/__tests__/verify-guide.test.mjs`, 21 total).

### P5 — Close the small model/lib edge gaps (low effort, tidy) — partially done

Closed: `map-pins.ts`'s `derivePlannerData` was entirely untested (0 tests) —
now 7 tests. `sun.ts`'s `fmtClock` was entirely untested — now 4 tests,
including the invalid-timezone catch-fallback branch.

**Left open, deliberately:** `money.ts` L150 and `staleness.ts` L44 are
defensive "should never happen" internal-assertion branches, unreachable given
the validation earlier in each function (staleness's date regex guarantees
`Date.UTC(...)` can't produce `NaN`; money's largest-remainder math is provably
in-range given finite non-negative weights). `settle.ts` 81/85 turned out to be
the same shape — reaching them requires an intermediate greedy-match residual
landing exactly on the `EPS` (0.005) boundary, and 0.005 has no exact binary
floating-point representation, so a "0.005 minus 0.005" construction actually
lands a few `Number.EPSILON` away from the boundary (confirmed by trying it —
see git history if reviving this). Chasing an exact IEEE-754 boundary would be
a flaky, engine-version-dependent test for a genuinely defensive line, not a
real regression risk — not worth it.

### P6 — Decide coverage policy for the untested UI blind spots

For the "no test at any layer" list (P... share panel, SOS sheet, voting, hub
wizard, palette, gmaps render, survey), pick one per feature intentionally:

- **Preferred:** peel any remaining pure logic into `model/` and unit-test it
  (the established silo pattern). The **hub `wizard`** is the best candidate — a
  multi-step form with real branching/validation logic worth isolating.
- **Otherwise:** add a Playwright interaction spec for the highest-risk flow
  (SOS is surfaced for emergencies; a broken share link is user-visible).

---

## Infrastructure recommendation ✅ done

`@vitest/coverage-v8` is now a devDependency, `npm run coverage` runs
`vitest run --coverage`, and `vitest.config.ts` sets **per-glob thresholds**
(not a repo-wide number, which the intentional 0% UI would either force near-zero
or force fake tests to satisfy):

```
"src/lib/**":                    { statements: 90, branches: 80, functions: 95, lines: 95 }
"src/features/*/model/**":       { statements: 90, branches: 80, functions: 90, lines: 95 }
"scripts/audit/lib.mjs":         { statements: 65, branches: 65, functions: 60, lines: 65 }
```

Numbers sit a few points under what's currently measured — real regression
gates, not aspirational targets. `.github/workflows/test.yml` now runs
`npm run coverage` after `npm test`/`npm run typecheck`, so a regression in the
gated globs blocks the PR. Verified the mechanism actually fails the build (not
silently ignored) by temporarily setting an impossible threshold and confirming
a nonzero exit + a clear `does not meet "..." threshold` message, then reverting.

---

## How these numbers were produced

Originally (before `@vitest/coverage-v8` was a project dependency):

```bash
npm install
npm install -D @vitest/coverage-v8
npx vitest run --coverage --coverage.provider=v8 --coverage.all \
  --coverage.include='src/**/*.{ts,js}' --coverage.include='scripts/**/*.{mjs,ts}' \
  --coverage.exclude='**/*.test.*' --coverage.exclude='**/mocks/**' \
  --coverage.reporter=text
```

Now that the Infrastructure section is wired in, the same full-repo report is just:

```bash
npm run coverage
```

(`vitest.config.ts`'s own `include`/`exclude`/`thresholds` apply automatically —
only the gated globs fail the build, everything else is reported, not gated.)

`npm test` alone = 585 tests / 44 files, ~3.5s, all green.
