# Repaired-class Combined Research Run B #2 (Yamagata) — evidence packet

Status: **RUN-B BLOCKED — REPAIR SURFACE EXCEEDS BOUNDED VALIDATION** (defect #3 since repaired under Codex work order `runb-feedback-truncation-109-15a77ac`; see addendum)
Authority: `VALIDATION_RUNBOOK.md` §V02/§V03/§V05 · frozen scenario `VALIDATION_TRIAL_PACKETS.md` §"Combined Research Run B" · post-#106/#107 repaired-class authorization (`docs/handoff.md`)
Bounded self-repair budget: one fresh Run-B, at most two deterministic repair cycles. Both cycles were spent on real defects; a third independent defect stops the pass by rule.

## Run identity

- Slug `yamagata` (substituted: `tottori` is occupied by the prior Run-B's durable state on `research-v2/tottori`; per the packet's occupancy rule, Yamagata Prefecture — Yamagata / Yamadera / Ginzan Onsen — satisfies all three risk classes; substitution documented in the frozen intake before dispatch)
- runId `yamagata-20260828-73821a` · branch `research-v2/yamagata` · scaffold/dispatch head `b28e741`
- Frozen candidate exactly: Sonnet 5 high (A + B + reconcile), Opus 5 critic · `landMode: pr` · publication boundary held throughout
- Attempts: 10/10 at final state, from an original cap 5 extended twice by documented hand decisions on the run branch (`399599e` 5→8, `c650abd` 8→10) after deterministic — not research — failures; auto-retry 1/1; counters truthful at every step

## Stage history

| Stage | Attempts | Outcome |
|---|---|---|
| Pass A | 1 | complete first try |
| Pass B | 1 | complete first try |
| Reconcile | 5 | findings converged 11→5 blocking → build-gate catch → artifact-truth catch → complete at a5 |
| Critic | 5 | all five attempts refused by offline verify; final run state `failed`, resume=critic, total attempts 10/10 |

## What the live run PROVED (the repaired contracts working)

- **R-C repaired, observed live:** reconcile attempt 3 was refused because the composed tree fails `npm run build` (a `≈` panel without `verified_on`) — the exact defect class the old gate silently accepted at Tottori's `b153af3`. The gate now runs the build and fails closed.
- **R-E repaired, observed live:** reconcile attempt 4 was refused for crowd/atmosphere claims resting on a single experiential source set (copied families counted once), worth-labels on non-retained candidates, and a dishonest saturation claim. Convergence no longer buys independence.
- **Critic baseline pinning, observed live:** `stages.critic.baseline` pinned once at the pre-critic geocode commit and never rewritten across five attempts.
- **Retained critic output, observed live:** every refused critic attempt's in-scope work was committed (`… retained for repair`) and survived the workflow boundary into the next dispatch's fresh checkout.
- **Fail-closed corrections accounting, observed live:** an undeclared changed leaf, a wrong envelope key, and string-shaped `source`/`freshness` were each refused with exact machine findings; no critic assertion was ever accepted as proof.
- **Attempt accounting, observed live:** the run went honestly `stuck` at its cap ("no agent spend"), and each hand extension is a visible commit on the run branch. Nothing was silently retried.
- **Resumption, observed live:** every re-dispatch continued the same runId at the recorded resume stage; nothing restarted or skipped ahead.

Not exercised live (covered deterministically by the 137-test prerequisite suites, all green at dispatch): evidence-owner routing to reconcile, routed replay with zero critic invocations, supersession decisions, coverage against superseded evidence, landing.

## Deterministic defects found (the reason for BLOCKED)

1. **REPAIRED (cycle 1) — capsule/validator corrections-handoff mismatch.** The critic capsule said 'write … with schema `wp-critic-corrections/2.1`' and listed `source`/`freshness` as bare names; the validator reads `schemaVersion` and requires objects. Critic attempts 1–2 were refused on exactly those two faces. Fixed in `contract-capsule.mjs` (keys and object shapes stated verbatim); red-first regression pins every schema key and both "never a …" guardrails into the generated capsule.
2. **REPAIRED (cycle 2) — retained declarations lost across repair attempts.** Whole-stage leaf accounting spans pinned-baseline→final tree, but each blind repair attempt declares only its own edits and its raw workspace doc clobbers the retained one (attempt 2 replaced attempt 1's complete 45-target handoff with 6 malformed rows; attempts 3–4 could never satisfy accounting again). `reconcile-critic-truth` now supplements the current doc with row-valid declarations from the stage's earlier retained docs (newest first, current attempt winning per target, rows for no-longer-changed leaves dropped, never phantom). Red-first regression drives the exact scar shape.
3. **REPAIRED post-verdict under work order `runb-feedback-truncation-109-15a77ac` — retry feedback truncation starved multi-location contract findings.** The live run proved that the previous single-line corrections finding was amputated by the 400-character per-line feedback cap, so later blind critic attempts could not see the full undeclared-pointer set. The repair emits one bounded machine finding per location, preserving the existing prompt-security boundary and structured feedback grammar. Red-first regression covers the real ContractError → CLI → `extractGateFindings` chain. The repaired storage path was then observed live on critic attempt 5: all five resulting `corrections.8–12.source.kind` findings were stored completely. This repair did not itself prove repair-to-green.

## Addendum — work order `runb-feedback-truncation-109-15a77ac` (2026-08-28, post-verdict)

The independent Codex review accepted both repairs and authorized one bounded repair of defect #3 plus one further critic-owned attempt on this same run.

- **Defect #3 REPAIRED (red-first):** the undeclared/phantom/no-handoff ContractErrors now emit one bounded `  · ` issue line per location (the repo's existing idiom, which the structured feedback grammar preserves end-to-end). Regression drives the real chain (ContractError → CLI print → `extractGateFindings`) for both classes. Production LOC +21; no cap, validator, or prompt-security semantics changed.
- **Critic attempt 5 (10/10, one paid critic invocation):** dispatched on the repaired head. Note honestly: its retry feedback was the attempt-4 entry *stored pre-fix* (still truncated) — a cancel issued on realizing this did not reach the container, so the attempt ran anyway. Despite that, the critic declared a full corrections handoff (13+ rows spanning the previously undeclared surface); the doc was refused by the schema on exactly **5 precise findings** (`corrections.8–12.source.kind` invalid enum value), before leaf accounting ran.
- **Feedback repair PROVEN in durable state:** the attempt-5 failure was recorded by the repaired code — feedback.v2.json now carries all 5 findings as complete bounded per-issue lines, nothing amputated. (The full 42-pointer regeneration was also exercised locally against the real run artifacts: the repaired formatter yields 42 complete findings from the same inputs that previously collapsed to one truncated line.)
- **Terminal state:** `failed`, resume=critic, attempts 10/10. The work order capped spend at 10/10, so no further attempt was taken. The run is 5 enum-value corrections away from re-entering leaf accounting, with complete actionable feedback stored for the next authorized attempt.

## Final addendum — critic attempt 6 and resume-version skew

After PR #109 merged, one final critic slot was deliberately authorized (10→11) to consume the five complete `source.kind` findings without another Fable/engineering pass.

- **Critic attempt 6 fixed the five enum findings.** Its retained `critic-corrections.v2.json` uses contract-valid `operator` / `official` source kinds rather than the invalid `primary` value from attempt 5.
- **The attempt still failed, but the failure does not exercise PR #109's repaired gate.** The V2 setup command resumed by checking out `research-v2/yamagata` wholesale. That branch still carried pre-#109 `scripts/pipeline/v2/evidence.mjs` (blob `78b2a8a8…`), while merged `main` carried the repaired per-location implementation (blob `112bef65…`). The retry therefore rolled its own control-plane code backward before validation and emitted the old joined/truncated contract failure.
- **Root cause:** durable research branches were treated as owners of both run artifacts *and* pipeline implementation version. A resume must own the former only; current dispatch code must own the latter.
- **Repair:** PR #110 adds a real-git regression and makes V2 resumes merge/push the current dispatch commit into an existing research branch before init/budget/route. Later fresh jobs therefore re-check out the synchronized control plane while retaining run artifacts.
- **No additional paid retry is authorized by this repair.** Attempt 6's paid output is durably retained at `37b80b5`; the validation campaign has already exceeded its bounded repair budget.

## Current adjudication / next action

The repaired-class Run-B campaign is **closed without repair-to-green proof**. Treat the live result as **BLOCKED / NOT READY FOR V2 CUTOVER**, with the final attempt confounded by the now-repaired resume-versioning defect rather than by a new research-quality finding. Do not extend Yamagata again and do not start another Run-B as part of this repair cycle.

After PR #110 merges, freeze this deterministic repair loop. V1 remains the production default. Any future V2 acceptance canary must be a separately authorized release-readiness action, not another continuation of this exhausted Run-B.

## Repository state

- Deterministic repairs #1–#3: merged via PR #109 at `dbeb721`
- Resume-versioning repair: PR #110, review-gated
- Durable run: `research-v2/yamagata` at `8def6d3`+, `failed`, `resume=critic`, 11/11 total attempts; critic attempts 6
- Critic attempt 6 retained output: `37b80b5`; five prior enum findings corrected
- No publication; V1 remains production default
