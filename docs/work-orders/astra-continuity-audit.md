# Astra continuity audit

Working base: `633e25b7b3678b08547500c28c7f682eb1b33af5`.
Branch: `codex/astra-continuity`.

## Coordination

Claude advanced to `96f2be63` (map opening hours and location). Review finding:
`src/features/maps/ui/map-live.js` clock() only assigns opts.timeZone when TZ is
truthy. Missing destTzIana therefore falls back to the reader's zone, despite the
stated destination-time contract. `dest-clock.test.ts` checks the catch branch but
does not execute the missing-zone case. Reconcile in Claude's map work by returning
null for absent TZ and testing that behavior. No concurrent file was edited here.

Remote `cleanup/continuity-september-20260905` was found at `b5d327da` during a
fresh fetch. It deletes the September watcher and retires reciprocal review
automation, reconciles V2 authority docs, and adds premerge performance checks.
Its watcher deletion supersedes this PR's ordering repair when integrated. Keep
the deletion when resolving that overlap; do not resurrect retired automation.
The runtime fixes and dependency updates remain independent. This branch is not
yet on main and had no open PR at inspection time. Avoid duplicating its authority
documentation and performance-gate work.

Claude's local `claude/navy-cream-tokens` branch was observed at `4945063b`.
Its changes cover theme tokens, shared page furniture, map pins, and performance
budgets. This audit's first changes concern the September watcher and dependency
overrides; they do not overlap those files. Recheck before integration.

## Confirmed defects and repairs

- A runtime limiter exception escaped the request handler before its provider
  error boundary. The guard now returns a sanitized 503 response with CORS headers
  and no provider call. A throwing-limiter regression failed before the repair;
  all 73 Worker tests and focused ESLint pass afterward.

- Runtime Google response parsing returned an unawaited `response.json()` inside
  a try/finally, clearing the abort timer as soon as headers arrived. Awaiting the
  body keeps the 12-second deadline in force for slow/stalled body downloads.
  A fake-timer regression failed before the fix and passes afterward, asserting
  abort, a sanitized 502 response, and timer cleanup. All 72 tests across the four
  Worker test files pass, as does focused ESLint. The Worker uses the root
  dependency manifest/lockfile; there is no independent Worker package tree.

- Actions run `33992832247` failed because the Kumamoto watcher tested the live
  V2 selector before reading the revocation of its historical r3 candidate.
  Revocation now exits with `eligible=false` before selector validation or fetching
  the candidate. Authorized candidates still encounter all existing safeguards.
  Eleven focused watcher tests pass, including execution of the workflow's actual
  Bash firewall with revoked and authorized authority. With ENGINE=v2, revoked
  authority exits successfully with eligible=false; authorized authority fails
  selector validation. Both cases prove no Git/GitHub invocation is reached.
- npm audit reported six affected packages through two development dependencies.
  Existing overrides pinned vulnerable `fast-uri` 3.1.5 and allowed `qs` 6.15.3.
  Updating them to 3.1.6 and ^6.16.0 changes only those two lockfile entries.
  A clean install reports zero known vulnerabilities. This is dependency audit
  evidence, not a claim that the application has no security defects.

## Verification and outstanding work

Independent code review found no runtime correctness/security findings and one
Windows shell-test portability issue. The fixed Git Bash path is replaced by the
existing repository discovery pattern (GIT_BASH, ProgramFiles, per-user install).
All eleven watcher tests pass after that correction. Full gate `34013394312` on
`ad8b40b6` completed successfully; the portability follow-up needs fresh CI.

Required gate `33995965059` completed successfully on `221845a9`, including
coverage, build, accessibility/resilience/offline sync, and gallery baselines.
Follow-up test commit `ad8b40b6` is pushed; its gate is `34013394312` and is pending.
The deployed Worker /health reports all configured guards, including runtime cost
guard and providers. Health is configuration evidence, not a provider success test.

Additional runtime tests confirm successful matrix responses despite failed cache
reads/writes and no shared-cache access for exact-position routes, whose responses
carry `Cache-Control: no-store`. All nine runtime-boundary tests pass. These tests
verify existing behavior and required no production change.

Required gate `33995965059` on `221845a9` passed unit/coverage and build and reached
accessibility/resilience. Do not treat that intermediate state as a completed gate.

Review: https://github.com/Carlob2499/Trip-Guides/pull/211 (draft).
Required gate run `33995727347` is pending; it includes coverage, accessibility,
resilience, offline sync, and gallery comparisons for this branch.

Live ruleset `21993991` was inspected: active on main, no bypass actors, with
only `non_fast_forward` and `pull_request` rules. Required status checks,
up-to-date integration enforcement, and deletion protection are absent. This
confirms the remaining governance gap in issue #130; passing CI does not mean
GitHub requires it before merge.

Claude's preview occupies port 4322. Do not reuse it as evidence for this branch.
Additional uncommitted Claude files observed: `src/styles/map.css` and
`tests/visual/map-geometry.spec.ts`.

The 102 protected invariant checks pass. `check:fast` passes: typecheck reports no
errors, and 208 test files pass (3,165 tests passed; one TODO). The initial lint run
reported one unused suppression in the design drift script; it was removed and
focused ESLint then passed. Production build, four service-worker contract tests,
and performance budgets pass. The default local build is unconfigured for Google
Maps, so this build does not prove live provider behavior.

Changes have not been deployed. Broader runtime, browser-offline, visual, and release
governance verification remains outstanding; visual acceptance must not be inferred
from merged PRs or functional tests.
