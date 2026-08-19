# Legacy Eradication Ledger — Pipeline V2 finalization (2026-08-19)

> **Working ledger** for the repository-wide legacy census (Phase 6 of the finalization
> session) and the eradication that follows a green canary (Phase 7). Temporary by design:
> after acceptance this file may be archived/indexed once its active value has ended.
>
> Classification vocabulary (exactly one per item):
> **CURRENT** — present implementation or active authority.
> **TEMP_COMPAT** — old-looking code still protecting a real migration/transition/rollback need;
> every entry names why it exists, what depends on it, and its exact retirement condition.
> **MIGRATE** — still reachable, but a tested current replacement already owns the behavior.
> **DEAD** — no legitimate runtime, build, operator, migration, or current-test consumer remains.
> **HISTORY** — context that belongs in git/archive rather than active authority.
> **CONFLICTING_SPEC** — documentation/comments/code claims contradicting current authority.
>
> Deletion discipline: nothing is removed on "probably unused." Every deletion below carries
> its proof (reachability trace, replaced-by, or migration-complete) and the tests that ran.

## Baseline measurements (before cleanup, branch fable/pipeline-v2-finalize)

| Metric | Value |
|---|---|
| Tracked files | 845 |
| Tracked LOC (excl. lockfile/binaries) | ~113,000 (35,824 shown by capped batch; per-area below is authoritative) |
| src/ LOC | 58,619 |
| scripts/ LOC | 24,453 |
| CSS LOC | 8,030 |
| Workflow YAML LOC / count | 2,368 / 13 |
| docs/ LOC | 21,201 |
| prompts/ LOC | 712 |
| worker/ LOC | 522 |
| Block components / feature silos | 16 / 24 |

## Census findings

_(populated from the reachability scans — in progress)_

## Classification counts

_(pending)_

## Deletions (path · reason · replacement · proof · tests)

_(pending — nothing is deleted before the canary is green)_

## TEMP_COMPAT register (why · depends-on · retirement condition)

| Item | Why it exists | Depends on it | Retirement condition |
|---|---|---|---|
| V1 research pipeline (`research-pass.yml`, V1 prompt set, V1 spine in `pipeline.mjs`) | V2 not yet accepted; `/new` still dispatches V1 | new-guide.yml auto-start; progress UI V1 adapter; korea/denmark run history | Independent Codex/Carlo acceptance of V2 creation/publication/resume/safety parity, then planned retirement map |
| `state.json` V1 run spine + `adaptV1RunState` | Published guides carry V1 run history; progress page reads both generations | `readAnyRunState`, progress gateway | V1 retirement + a decision on historical run-state display |
| V1 `coverage.json` ask registry | Scaffolder writes it; V2 derives material-ask IDs from it; verifier falls back to it pre-V2 | `loadCoverageContext.expectedAskIds`, `checkCoverage` legacy path | Scaffolder emits a V2-native ask registry (post-cutover change) |
| `.agents/` mirror of the Guide Author skill | Different agent products resolve different skill paths | V2 prompts point agents at `.agents/skills/...`; parity gated by `pipeline-v2-skill-parity.test.mjs` | A single-consumer world, or a build step that generates one from the other |
| Inert `research-pass-v2.yml` stub on `main` | workflow_dispatch registration requires the path on the default branch (verified 2026-08-19) | canary dispatch on feature refs | The final PR merge replaces it with the real workflow |

## Current authority set (target end-state)

_(pending — the census names the winners; conflicting docs get resolved or archived)_

## Remaining cleanup that cannot yet happen safely

_(pending)_
