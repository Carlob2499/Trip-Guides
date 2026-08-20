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

### scripts/ (scan complete)

- **76 non-test files: all REACHABLE.** The scan's weakest-evidenced rows were re-verified by
  hand: `gen-room-id` (scaffold + firebase room model), `check-photos` (audit chain + verify),
  `fetch-wikivoyage`/`lookup-tz`/`lookup-place`/`search-commons` (operator/research tools named
  by package.json and the schema's own comments), `prose-shape` (its regression test enforces
  the debt baseline), `check-content-drift` (verify --network path). Zero orphan scripts.

### Census verdict

The repository is substantially cleaner than the eradication mandate anticipated — the
aggressive cleanup arcs recorded in `docs/archive/INDEX.md` already removed the dead
generations. The full census across CI, prompts, agent instructions, Worker, CSS, client code,
components, lib, data, dependencies, configs, fixtures, npm scripts, and scripts/ found
**zero DEAD code files**. What remains is small and specific:

| # | Item | Class | Action |
|---|---|---|---|
| 1 | `.github/ISSUE_TEMPLATE/{modify,revise}-guide.yml` body text promising the deleted approval-label flow | CONFLICTING_SPEC | Rewrite the two blurbs to the real flow (label triggers; author-association gates) |
| 2 | GitHub remote labels `modify-approved` / `revision-approved` | DEAD | `gh label delete` both |
| 3 | `docs/reference/motion.md` rows citing deleted `overture.js` + `hub-motion.css` | CONFLICTING_SPEC | Re-point at the shipped Atlas motion homes |
| 4 | `src/pages/new.astro` deep import past the hub silo index | CONFLICTING_SPEC (silo contract) | Re-export via `hub/index.ts`, import through it |
| 5 | `docs/pipeline v2/FABLE_IMPLEMENTATION_PROMPT.md` (545 lines) — the executed, superseded M0–M8 build prompt | HISTORY | Archive per `docs/archive/INDEX.md` convention; update the two referring docs |

## Classification counts

Across the six census domains (scripts 76 files · src client/components/lib/silos ~135 units ·
CSS 46 files · workflows 13 + prompts 11 · deps 30 · docs 54 active files):

| Class | Count | Items |
|---|---|---|
| CURRENT | everything not listed below | the census found the active tree essentially clean |
| TEMP_COMPAT | 5 registered items | see the register above |
| MIGRATE | 0 | no reachable code had a tested replacement waiting |
| DEAD | 3 | the three GitHub approval labels (deleted) |
| HISTORY | 1 | FABLE_IMPLEMENTATION_PROMPT.md (archived) |
| CONFLICTING_SPEC | 4 | two issue-template blurbs (fixed) · motion.md rows (fixed) · new.astro deep import (fixed) |

## Deletions / migrations executed (path · reason · replacement · proof · tests)

| Item | Class | Action | Proof |
|---|---|---|---|
| Labels `modify-approved` / `revision-approved` / `graduate-approved` | DEAD | `gh label delete` ×3 | zero code references (repo-wide grep); the flows that read them were deleted in earlier arcs |
| `docs/pipeline v2/FABLE_IMPLEMENTATION_PROMPT.md` | HISTORY | archived per `docs/archive/INDEX.md` convention (`git show 9f1599b:…`) | fully executed (M0–M8 + audit recorded in IMPLEMENTATION_STATE); referring docs updated; docs-integrity suite green |
| Issue-template blurbs | CONFLICTING_SPEC | rewritten to the real trigger/authorization flow | change.yml's actual `on:`/author-association contract |
| `motion.md` Overture/hub-motion rows | CONFLICTING_SPEC | re-pointed at shipped Atlas homes | `overture.js`/`hub-motion.css` absent from tree; hover styles live in `atlas*.css` |
| `new.astro` deep import | CONFLICTING_SPEC (silo contract) | re-exported `SECTIONS` through `hub/index.ts` | build green; blurb text renders in `dist/new/index.html` |

## Codebase measurements — after (same method as baseline)

| Metric | Before | After | Δ |
|---|---|---|---|
| Tracked files | 845 | 846 | +1 (net: +4 modules/tests, −1 archived doc, …) |
| src/ LOC | 58,619 | 58,622 | +3 |
| scripts/ LOC | 24,453 | 24,958 | +505 (feedback/capsule/events modules + canary-scar fixes + ~900 lines of new regression tests) |
| CSS LOC | 8,030 | 8,030 | 0 |
| Workflow YAML / count | 2,368 / 13 | 2,442 / 13 | +74 (guard, geocode job, feedback/capsule/remap wiring) |
| docs/ LOC | 21,201 | 21,403 | +202 (this ledger + finalization record − 545-line archived prompt) |
| prompts/ LOC | 712 | 712 | 0 (baseline was captured after the prompt edits — understates the +~40 feedback/contract lines) |

**The honest reading:** raw LOC grew ~+780, all of it safety fixes, truth-telling machinery, and
regression scars from a live canary — the class of increase the mandate explicitly accepts. The
CONCEPTUAL ledger moved the other way: one fewer standing work order in the authority set, three
fewer phantom controls (labels), zero competing implementations found (previous cleanup arcs had
already removed the dead generations — the census now PROVES the tree is clean rather than
assumes it), one silo-contract violation gone, and every remaining compatibility surface carries
a written retirement condition.

## TEMP_COMPAT register (why · depends-on · retirement condition)

| Item | Why it exists | Depends on it | Retirement condition |
|---|---|---|---|
| V1 research pipeline (`research-pass.yml`, V1 prompt set, V1 spine in `pipeline.mjs`) | V2 not yet accepted; `/new` still dispatches V1 | new-guide.yml auto-start; progress UI V1 adapter; korea/denmark run history | Independent Codex/Carlo acceptance of V2 creation/publication/resume/safety parity, then planned retirement map |
| `state.json` V1 run spine + `adaptV1RunState` | Published guides carry V1 run history; progress page reads both generations | `readAnyRunState`, progress gateway | V1 retirement + a decision on historical run-state display |
| V1 `coverage.json` ask registry | Scaffolder writes it; V2 derives material-ask IDs from it; verifier falls back to it pre-V2 | `loadCoverageContext.expectedAskIds`, `checkCoverage` legacy path | Scaffolder emits a V2-native ask registry (post-cutover change) |
| `.agents/` mirror of the Guide Author skill | Different agent products resolve different skill paths | V2 prompts point agents at `.agents/skills/...`; parity gated by `pipeline-v2-skill-parity.test.mjs` | A single-consumer world, or a build step that generates one from the other |
| Inert `research-pass-v2.yml` stub on `main` | workflow_dispatch registration requires the path on the default branch (verified 2026-08-19) | canary dispatch on feature refs | The final PR merge replaces it with the real workflow |

## V1 retirement map (final V1 retirement stays Carlo/Codex's decision)

**KEEP UNTIL CUTOVER** — removable immediately after accepted V2 cutover:
- `research-pass.yml` and the four V1 prompts (`research-passA/B/reconcile/critic.md`)
- `check-passb-coverage.mjs` (consumed only via `gate coverage` on the V1 research path)
- `pipeline.mjs`'s research checkpoint discipline (`--checkpoint` predecessor-commit refusal)
  as a research-agent-facing surface (the change lifecycle does not use it)
- The V1 research branch namespace handling (`research/<slug>`)

**SHARED** — required by current V2/product behavior regardless of V1's fate:
- `pipeline.mjs` subcommand spine (branch · prompt · gate · land · scaffold · publish ·
  answers-route/apply · questions · plan · report) — V2's workflow calls it throughout
- `gate.mjs` (budget/preflight/stuck/artifacts/compose/integrity/enforce/forks) — V2 + change
- `state.json` read/write (`readState`/`initState`) — the change lifecycle's attempt counters
  live there; V2's `readAnyRunState` adapter reads it for published guides' history
- `check-run-integrity.mjs` — change.yml keeps it post-cutover
- `check-candidates.mjs` (n/a-posture form; the numeric floors are already gone)
- Progress UI's V1 adapter chain — korea/denmark carry V1 run history forever
- V1 `coverage.json` as the material-ask registry (scaffolder writes it; V2 derives ask ids
  from it; the verifier falls back to it for V1 guides)

**ALREADY DEAD** — removed this session: the three approval labels
(`modify-approved`/`revision-approved`/`graduate-approved`) and the template prose that
promised them. The census found no dead V1 code files beyond these.

**POST-CUTOVER MIGRATION** — needs a data/design decision first:
- Scaffolder emitting a V2-native ask registry (retires legacy `coverage.json` writes)
- Historical `state.json` display strategy once V1 rendering paths retire
- V2 workflow gaining the `issue` notification input `/new` currently threads to V1

## Current authority set (post-census)

One home per topic; everything else is record, working state, or archived:

| Topic | Authority |
|---|---|
| What Waypoint is + working rules | `CLAUDE.md` (project) stacked on the global rules |
| Product definition | `PRODUCT.md` |
| Pipeline policy (two lifecycles) | `docs/reference/pipeline.md` |
| V2 research decisions (locked) | `docs/pipeline v2/DECISIONS.md` |
| V2 acceptance bar | `docs/pipeline v2/PIPELINE_VALIDATION_PACK.md` |
| Delivery plan / tracker | `docs/pipeline v2/IMPLEMENTATION_PLAN.md` + `SEPTEMBER_TRACKER.md` |
| V2 build + finalization record | `docs/pipeline v2/IMPLEMENTATION_STATE.md` |
| Architecture | `docs/reference/architecture.md` |
| Design system | `docs/design-handoff/DESIGN.md` (+ `enforcement/`) |
| Motion | `docs/reference/motion.md` |
| Quality bar | `docs/standards/guide-rubric.md` |
| Content discipline | the `waypoint-guide-author` skill (`.claude`/`.agents`, parity-gated) |
| Glossary + standing rulings | `CONTEXT.md` |

The executed V2 build prompt was archived out of this set (`docs/archive/INDEX.md →
FABLE_IMPLEMENTATION_PROMPT`); `CODEX_HANDOFF.md` remains as the recorded dependency contract.

## Remaining cleanup that cannot yet happen safely

- Everything in the **KEEP UNTIL CUTOVER** class above — blocked on independent V2 acceptance.
- `guides-intake/korea/` V1 run state and the V1 progress adapters — historical record for a
  published guide; retiring them is a post-cutover display decision, not a deletion.
- The canary's own test data (`canary/kansai-proof` branch, its research branch and draft PR)
  — deliberately quarantined on branches; deleted whole once the canary evidence is accepted.
