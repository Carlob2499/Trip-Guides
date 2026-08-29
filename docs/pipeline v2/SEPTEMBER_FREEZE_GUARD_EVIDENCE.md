# September freeze guard evidence

Date: 2026-08-29

This note records the deterministic release-window control prepared ahead of the September deadlines. It does not move F01/F02/F03/F04 early and does not authorize V2 cutover.

## Shipped control

PR #129 merged the repository-side September freeze policy on main at `5c5df669ec4729c4a0a4eb046e69de07f952f83b`.

Policy:

- before 2026-09-20: normal engineering;
- 2026-09-20 through 2026-09-26: code/control-plane changes require `stabilization`, `release-blocker`, or `freeze-waiver`;
- 2026-09-27 through 2026-09-30: code/control-plane changes require `release-blocker` or `freeze-waiver`;
- the special September freeze expires 2026-10-01;
- traveler guide content and release-status/evidence bookkeeping stay editable;
- locked engineering doctrine (`AGENTS.md`, `CLAUDE.md`, `PRODUCT.md`, Pipeline V2 `DECISIONS.md`) is classified with code.

The guard runs as a trusted-base `pull_request_target` workflow. It checks out the base SHA and reads only PR metadata/changed filenames; it never executes PR-controlled code. Regression coverage pins New York date boundaries, path classification, label authority, mixed PR behavior, and Oct 1 expiry.

The label bootstrap creates `stabilization`, `release-blocker`, and `freeze-waiver`; its first post-merge main run was successful.

## Remaining repository-settings blocker

Live inspection after PR #129 still reports `main` with branch protection disabled, required status-check enforcement off, and no repository rulesets. Therefore the repository-side freeze check is observable but not unbypassable until repository settings require pull requests/checks. Issue #130 is the durable owner/tooling action for that configuration.

GitHub's documented protection/ruleset model supports required status checks, pull-request requirements, force-push blocking, and branch deletion protection; these controls must be configured in repository settings because the connected GitHub capability used by this automation can read but cannot modify branch protection/rulesets.

### Protection compatibility finding

A settings-only PR/status-check rule cannot be enabled blindly. The production `/new` scaffold path in `.github/workflows/new-guide.yml` intentionally lands its draft scaffold directly on `main` before starting the selected research engine. GitHub required-status protection can reject a direct push whose new commit has not already satisfied the required checks, so a naive PR-only/required-check configuration can break guide creation.

Issue #130 now requires a protected-branch-compatible write-path design and a no-Claude compatibility proof before F01 is considered mechanically enforced. The preferred direction is to migrate the scaffold write to a branch/PR landing path while preserving draft quarantine, global scaffold serialization, slug collision safety, issue reply/close behavior, V1 default routing, and the trusted V2 `workflow_call` cutover boundary.

A broad GitHub Actions bypass is not accepted as an automatic substitute. Repository audit shows multiple workflows with `contents: write`, including new-guide, change/mutation, V1/V2 research, feedback/recertification, watcher publication, and deployment-related automation. Any integration bypass must therefore be deliberately bounded and reviewed as a repository-wide trust decision rather than treated as a single-purpose scaffold exception.

No protection setting has been changed yet, and this finding does not alter Pipeline V2 runtime, acceptance criteria, or the frozen Kumamoto candidate.

## Acceptance isolation

The rebuilt Kumamoto candidate remains `acceptance/v2-kumamoto-20260902-r2` at `621dd43238d18b2b918827a9dca2268cd6f28c56`. PR #129 changed only release-governance workflow/tests/labels and does not mutate the frozen acceptance candidate, its model inputs, Pipeline V2 runtime, attempt authority, evidence/landing gates, selector, publication state, Fukuoka evidence, or V1 behavior.
