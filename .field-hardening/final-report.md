# Waypoint Production Field-Hardening Report

**Campaign branch:** `external-ai/production-field-hardening`  
**Baseline:** `origin/main` at `c3ab203ae9b94c747fa8e08051dd2f18c28069aa`  
**Production examined:** <https://carlob2499.github.io/Trip-Guides/>  
**Review PR:** [#103 — Production field-hardening: restore guide Skip-link focus](https://github.com/Carlob2499/Trip-Guides/pull/103)
**Campaign posture:** review only. This branch does not merge or change `main`.

## Scope and protected boundaries

This was an evidence-led production field-hardening pass. It followed **observe → reproduce → classify → smallest-owner fix → regression proof → retest**. No V2 pipeline, Run A/Run B, V01/V02/V03/V05/V07, cutover, publication, research doctrine, guide fact, DS1/design-system, Firebase-rule, Worker deployment, hosting, credential, or `main` surface was edited.

| Protected area | Status |
|---|---|
| V1 default and frozen V2 validation/cutover | Unchanged |
| Guide facts, sources, recommendations, and trip data | Unchanged |
| Visual identity, navigation model, motion philosophy, DS1 | Unchanged |
| Firebase rules/configuration and any real traveler room | Unchanged |
| Worker source/configuration and deployment workflow | Unchanged |
| `main`, production settings, merges, force pushes | Unchanged |

## Confirmed defect and repair

| ID | Class | Reproduction | Smallest owner | Repair | Regression proof |
|---|---|---|---|---|---|
| FH-001 | Accessibility / keyboard focus | On the deployed Denmark guide, Tab focuses **Skip to content**. Enter updates the fragment to `#content`, but focus remains outside the guide’s reading region because `<main id="content">` was not programmatically focusable. | `src/layouts/GuideLayout.astro` | Added `tabindex="-1"` to the existing main reading landmark. This preserves the visual layout and keeps it out of normal Tab order. | Added a focused Playwright test in `tests/visual/a11y.spec.ts`. It failed pre-fix with `#content` inactive and passed after the repair. |

> The live production site remains on the baseline until this review branch is merged and deployed. The production retest of **FH-001** must happen only after that normal deployment path completes.

## Production field observations

| Area | Exercise | Result |
|---|---|---|
| Landing, Denmark, Korea | Opened public landing and both published guides; used guide tabs, Days, field content, source surfaces, and direct deep links/back navigation. | No blank, trapped, or stale traveler state reproduced. Denmark’s map had written offline fallback context; Korea rendered long content and Korean address controls. |
| Search and SOS recovery | Opened each non-destructive overlay and dismissed with Escape. | Both recovered. Keyboard checks later confirmed Escape returns focus to Search/SOS controls. |
| Persisted local state | Put a parseable primitive in this isolated browser profile’s Denmark reminder key, reloaded Tools, triggered one existing reminder, then removed the key. | Local reminder recovery normalized state and continued; no shared-room request occurred. |
| Responsive layouts | Denmark Tools and Korea Plan at `320×740`, `390×844`, `768×1024`, and `1280×800`; screenshots and measurements are retained outside the repo. | Eight HTTP 200 loads; no document-level horizontal overflow. No inaccessible control was reproduced. |
| PWA offline/reconnect | Online Denmark Days load → activated service worker → browser offline → reload → reconnect → reload. | Offline reload retained the Denmark Days route and usable content; reconnect returned normally. This proves cached reading/navigation only, not shared write replay. |
| Keyboard and reduced motion | Skip, Search, SOS, and Korea video behavior with browser reduced-motion preference. | Reduced-motion Korea video was paused with autoplay disabled and document animation duration `0s`. FH-001 was the sole focus failure found and is repaired on this branch. |
| Worker | `GET /health`, then one malformed `{}` public `/intake` request from the production origin. | Health returned configured repo, rate limit, and owner endpoints. Invalid input returned 400 before any issue/repository side effect. No valid intake, owner route, brute force, or stress action ran. |
| Browser performance | Three fresh service-worker-blocked 390px loads each for Denmark Days and Korea Plan. | Denmark median: DCL 407ms, load 626ms, FCP 156ms, 484,405B/31 resources. Korea median: DCL 490ms, load 4,490ms, FCP 144ms, 634,761B/35 resources. No user-visible performance defect justified a change. |

## Firebase result: exact limitation

This campaign **does not claim REAL FIREBASE PROOF**. The production guide supplied a committed room ID and Firebase bundle/auth request loaded, but both the committed guide room and a fresh isolated override room, `FIELDTEST-20260826T061116Z`, settled into their explicit device-local/offline states.

No reminder, person, expense, checklist, or other record was created in that field-test room. No existing traveler room was read, written, or altered. No direct REST probe, rule change, owner credential, invalid-key attempt, or manufactured rejection was used. Therefore real anonymous auth, deployed rules, network acknowledgement, offline queued write replay, and two-client convergence remain **unproven environment/service dependencies**, not source defects addressed by this branch.

## Verification record

| Command or check | Result | Notes |
|---|---|---|
| `npm run check:invariants` | PASS | Ran within the canonical core sequence. |
| `npm run lint` | PASS | Ran within the canonical core sequence. |
| `npm run typecheck` | PASS with existing warning-level diagnostics | No new type error. |
| `npm test` | PASS | 187 files, 3,055 tests passed, 1 existing todo. |
| `npm run coverage` | PASS | Full coverage suite completed. |
| `npm run build` | PASS | Rebuilt after FH-001. |
| Focused FH-001 Playwright test, pre-fix | EXPECTED FAIL | `#content` was inactive. |
| Focused FH-001 Playwright test, post-fix | PASS | 1/1 passed. |
| `npm run test:e2e` | PASS | 74/74 browser tests passed. |
| `npm run check:offline` | PASS | 4/4 service-worker contract tests passed. |
| `npm run check:perf` | FAIL — replicated baseline limitation | `dist/progress/index.html` first-paint JS: 219KB vs 200KB. The same `c3ab203` source, built in a detached baseline worktree with the same installed dependencies, fails identically. Not caused by FH-001; no unrelated performance/dependency change made. |
| `npm run ship:check` | FAIL only at the same replicated `check:perf` condition | Invariants, lint, typecheck, coverage, build, and offline components completed before the known performance gate failure. |
| `npm run verify-live` | PASS | Current production baseline has both published guides live and linked. |
| `git diff --check` | PASS | No whitespace errors. |

## Review disposition

The branch contains one production-reproduced, bounded repair and its regression proof, plus campaign evidence. The only canonical local failure is the pre-existing/replicated performance-budget condition on an unrelated Progress entry under the current dependency resolution. It is disclosed rather than hidden, and no scope-expanding fix was attempted.

**Review the field-hardening PR. Do not merge automatically.**
