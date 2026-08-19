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

### CI / prompts / agent instructions / Worker (scan complete)

- **Workflows (13):** every referenced script exists; no untriggerable workflow; permissions
  match observed use (deploy.yml's `issues: write` is used by verify-live's deploy-verification
  issue). CURRENT across the set; `research-pass.yml` + V1 prompt set are TEMP_COMPAT (see
  register).
- **Prompts (11):** all composed by a workflow; zero orphans. CURRENT.
- **`.agents/` vs `.claude/` Guide Author:** byte-identical content modulo the deliberate
  CLAUDE.md→AGENTS.md pointer transform; hard parity is already test-gated
  (`pipeline-v2-skill-parity.test.mjs`). Verdict: keep both, keep the gate, build no generator —
  a canonicalization mechanism would add a build step to save zero drift risk that the gate
  already removes. CURRENT.
- **Worker routes (5):** /health, /intake, /change, /answer, /approve — all consumed by site
  features or operational monitoring. CURRENT.
- **CONFLICTING_SPEC found:** `.github/ISSUE_TEMPLATE/modify-guide.yml` + `revise-guide.yml`
  body text still promises the deleted `modify-approved`/`revision-approved` approval-label flow
  (reality: the request label triggers `change.yml`, gated by author association). Fix: rewrite
  the two template blurbs. The two approval labels still existing on the GitHub remote are DEAD
  (zero code references) — delete via `gh label delete`.
- **CONFLICTING_SPEC found:** `docs/reference/motion.md` motion-inventory rows cite
  `overture.js` + `hub-motion.css` (deleted with the old hub) as current homes. Fix: re-point
  rows at the shipped Atlas modules.
- **Stale note check:** `docs/handoff.md` items are accurate known-issue records (session file,
  rewritten each session-end) — not census targets.

### CSS / UI styling (scan complete)

- 46 stylesheets, 7,682 lines: **every file has an importer; zero orphans.** Selector-level deep
  scan of the 5 largest files found **zero dead selectors** (all suspicious hits were
  dynamically-composed classes or retired-feature mentions living in comments, not rules). All
  21 `@keyframes` referenced. Verdict: **CURRENT across the board** — no CSS eradication is
  warranted; prior cleanup passes already took this surface to zero.

### Dependencies / configs / fixtures / npm scripts (scan complete)

- **Dependencies:** every entry in dependencies + devDependencies has a confirmed consumer —
  zero UNUSED candidates. CURRENT.
- **Configs:** one instance per tool; `worker/wrangler.toml` is the only wrangler config (the
  stray root config from the historical boundary-check incident is long gone). CURRENT.
- **Fixtures:** `tests/fixtures/japan-regression/` (132 KB) consumed by two dedicated
  regression suites + migrate-facts/contradiction tests. **Regression scar — preserved.**
- **npm scripts (24):** all resolve to existing files; mix of workflow-invoked and deliberate
  manual/operator tools (lookup-place, search-commons, drift, …). CURRENT.

### src client code / components / lib / data (scan complete)

- **src/scripts (24), components (17 + 16 blocks), src/lib (30), feature silos (24): all
  REACHABLE.** The scan's one orphan claim (`features/intake-questions`) was a false positive —
  it is imported by pipeline-progress via `../intake-questions/index` (through the silo index,
  the sanctioned surface); re-verified by hand. Zero orphan client code.
- **src/data:** palettes + holidays consumed via `import.meta.glob`; `destinations/*.json`
  consumed by build scripts AND read by V2 Pass B agents (the prompt names the path). CURRENT.
- **One silo-contract violation found:** `src/pages/new.astro` deep-imports
  `features/hub/model/checklist` (`SECTIONS`) past the hub silo's index. Fix: re-export from
  `hub/index.ts`, import through it. (The A1 class from the architecture doc.)

### Remaining scans

_(scripts reachability — in progress)_

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
