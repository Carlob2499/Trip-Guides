# September freeze guard evidence

Date: 2026-08-30

This note records the deterministic release-window and protected-main compatibility controls prepared ahead of the September deadlines. It does not move F01/F02/F03/F04 early and does not authorize V2 cutover.

## Shipped freeze control

PR #129 merged the repository-side September freeze policy on main at `5c5df669ec4729c4a0a4eb046e69de07f952f83b`.

Policy:

- before 2026-09-20: normal engineering;
- 2026-09-20 through 2026-09-26: code/control-plane changes require `stabilization`, `release-blocker`, or `freeze-waiver`;
- 2026-09-27 through 2026-09-30: code/control-plane changes require `release-blocker` or `freeze-waiver`;
- the special September freeze expires 2026-10-01;
- traveler guide content and release-status/evidence bookkeeping stay editable;
- locked engineering doctrine (`AGENTS.md`, `CLAUDE.md`, `PRODUCT.md`, Pipeline V2 `DECISIONS.md`) is classified with code.

The ordinary freeze guard uses trusted-base `pull_request_target`: it reads PR metadata/changed filenames and never executes PR-controlled code. PR #140 also added an explicit `workflow_dispatch` PR-number path for automation-created scaffold PRs; that path still checks out trusted `main` and reads the target PR through GitHub APIs.

## Protected-main repository prerequisites

The compatibility defects identified by issue #130 are now repaired repository-side:

- PR #137 removed `mutation.yml`'s direct-main report write and reduced it to `contents: read`; the mutation report remains an Actions artifact.
- PR #138 added the always-reporting `Required gate / required-gate`, with path scope classified inside the job rather than through PR path filters. Trusted automation may explicitly dispatch it on an exact branch head; dispatched runs also form a prospective integration tree against current `main` before verification.
- PR #139 added a temporary zero-Claude compatibility probe. Main run `33285553280` created disposable GITHUB_TOKEN PR #141 at exact head `ba2de093ff52461d9ce7d9b5ce3f409ca1337b95`, explicitly dispatched Required gate run `33285560957`, verified that exact-head run succeeded, then closed PR #141 and deleted `proof/protected-main-33285553280`. The same bot-created PR head also received successful platform `Analyze (actions)` and `Analyze (javascript-typescript)` checks.
- PR #140 converted `/new` scaffold landing from direct-main push to a quarantined `scaffold/<slug>-<issue>` branch/PR transaction. It explicitly dispatches Required gate and trusted freeze evaluation, waits fail-closed for exact-head `required-gate`, `freeze-policy`, `Analyze (actions)`, and `Analyze (javascript-typescript)`, merges with exact-head matching, deletes the scaffold branch, and only then comments/closes the intake issue and allows existing V1/V2 research routing to continue. Regression tests pin no direct-main push, exact-head check requirements, fail-closed ordering, workflow permissions, and the public-country shell boundary.

The temporary PR #139 proof workflow is removed after its successful one-shot evidence is recorded here; it is not a permanent privileged write surface.

A broad GitHub Actions bypass is neither required nor authorized by these controls.

## Remaining settings-only blocker

Repository-side compatibility work is complete, but live repository settings still have to mechanically enforce it. `main` remains unprotected with required-status enforcement off and no repository ruleset. The connected GitHub capability used by this operator can inspect but cannot mutate branch protection/rulesets, so issue #130 remains open solely for the final owner/tooling settings action and verification.

The intended settings contract is: require pull requests for ordinary engineering, require the repository's always-reporting release gate(s) without path-filter deadlocks, block force-pushes and branch deletion on `main`, and avoid a generic GitHub Actions bypass. Settings must remain compatible with the now-proven automation-created scaffold PR path.

## Acceptance isolation

The rebuilt Kumamoto candidate remains `acceptance/v2-kumamoto-20260902-r2` at `621dd43238d18b2b918827a9dca2268cd6f28c56`. Release-governance work does not mutate that frozen candidate, its model inputs, Pipeline V2 runtime, attempt authority, evidence/landing gates, selector, publication state, Fukuoka evidence, or V1 research behavior.
