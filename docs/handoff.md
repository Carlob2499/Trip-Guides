# HANDOFF — current operational state

> Compact warm start for the next engineering session. Durable architecture belongs in `docs/reference/`; Pipeline V2 decisions/evidence belong in `docs/pipeline v2/`. This file should state only what is true now and what work comes next.

<!-- WARM_START_BEGIN -->
WAYPOINT / Trip-Guides — CURRENT STATE (2026-08-23)
Pipeline V2 reliability repair is merged and Canary #4 (`uruguay-20260823-9789de`) completed the draft product path GREEN. Uruguay remains `draft: true`, `publication: false`, `landMode: pr`; it is evidence, not production content.
V1 remains the production default/rollback path while `WAYPOINT_RESEARCH_ENGINE` is unset. Manual V2 dispatches remain draft-only; production cutover is a separate evidence-based decision.
The reciprocal Claude↔Codex reviewer automation remains active with the revision-4 job-level trust boundary; cleanup must not retire or weaken it.
Canary #4 proved the normal fresh-run/recovery path, including real gate failures and bounded retry authority. Its two previously unexercised failure-only platform seams are now closed by targeted no-model proofs: real authenticated/deduped issue escalation, and real GitHub Actions post-cancellation `always()` + `cancelled()` escalation execution.
The Progress surface now has durable V2 run events and an owner-note path keyed to exact V2 run identity; facts that the backend cannot prove remain honestly blank.
Remaining validation work requiring model capacity is Combined Research Run A for V01 and Combined Research Run B for V02/V03/V05. V04 and V06 are DONE; V07's evaluation method is pre-registered and waits for Run A/B quality verdicts.
Next engineering work: when model credits are available, re-check the dispatch gate, execute Run A, judge V01, execute Run B, judge V02/V03/V05 separately, then execute V07. Do not reopen deterministic cleanup without new defect evidence.
Read next: `README.md`, `PRODUCT.md`, `CONTEXT.md`, `docs/reference/repo-map.md`, `docs/reference/pipeline.md`, `docs/pipeline v2/DECISIONS.md`, `docs/pipeline v2/IMPLEMENTATION_STATE.md`, `docs/pipeline v2/VALIDATION_RUNBOOK.md`, `docs/pipeline v2/VALIDATION_TRIAL_PACKETS.md`, `docs/pipeline v2/R03_LIVE_FAILURE_SEAMS_EVIDENCE.md`, `docs/pipeline v2/V07_EVALUATION_METHOD.md`, `docs/pipeline v2/SEPTEMBER_TRACKER.md`.
<!-- WARM_START_END -->

## Accepted live evidence

### Canary history

- **Malta — RED.** Historical Canary #1. Preserve as failure evidence.
- **Luxembourg — RED.** Historical Canary #2. Preserve as failure/convergence evidence.
- **Portugal — RED.** Canary #3, issue #74, run `portugal-20260822-7c041e`; exposed the runtime reliability defect class repaired before Canary #4. Do not resume it as if it were a clean acceptance run.
- **Uruguay — GREEN draft product path.** Canary #4, run `uruguay-20260823-9789de`, branch `research-v2/uruguay`. Pass A/B completed on the first attempt; Reconcile converged after three real gate failures; bounded automatic repair was consumed once and correctly refused after that; Critic completed on the first attempt; the landing gate passed. The guide did not publish.

Canary #4 proves the draft research/product path. It does not by itself authorize production cutover.

### Targeted failure-only reliability proofs

The two platform paths Uruguay did not naturally exercise are now proven without another model-backed canary:

1. **Authenticated issue escalation — PASS.** Issue #90 received the real Actions-bot stop witness through `gh issue view` / `gh issue comment`, with marker deduplication proven on disposable PR #91. PR #91 was closed unmerged.
2. **Cancellation grace-window chain — PASS.** Real Tests workflow run `32680115285` cancelled a simulated active agent step, then completed the post-cancellation `always()` control-plane witness and the subsequent `cancelled()` escalation witness. Disposable PR #92 was closed unmerged.

Permanent evidence is recorded in `docs/pipeline v2/R03_LIVE_FAILURE_SEAMS_EVIDENCE.md`.

## Current reliability boundary

The repaired V2 runtime now preserves these contracts:

- agent exit status cannot be hidden by output logging;
- a failed agent cannot enter the successful collection path;
- failure classes identify the correct execution plane;
- retry eligibility comes from durable V2 state, not one ephemeral workflow output;
- automatic repair remains bounded;
- stopped runs have a visible escalation path;
- cancellation can reach the post-agent control plane and visible escalation path inside real GitHub Actions;
- incomplete or failed research cannot publish.

R03 is fully accepted. No remaining reliability seam requires another full research canary.

## Validation readiness

- V01/V02/V03/V05 are pre-registered and remain awaiting model-backed execution only.
- Run A: Tokyo, V01 food/reservation/source-independence trial.
- Run B: Tottori/Kurayoshi/Misasa, V02 native-language + V03 fragile transport + V05 group/mobility trial.
- Current `main` has no active `tokyo` or `tottori` V2 intake/run directory or matching active branch as of the zero-credit readiness audit.
- Existing V2 artifacts are sufficient to judge the frozen criteria: source family/independence, adaptive saturation, reservation/party rules, native-language audit, reconciliation, high-risk transport physical reality, group/luggage/mobility, coverage, and final guide refs are all inspectable.
- V04 is DONE deterministically. Do not spend another guide run reenacting it.
- V06 is DONE with truthful available telemetry.
- V07 is NOT YET EXECUTED. Its method is frozen in `docs/pipeline v2/V07_EVALUATION_METHOD.md` before Run A/B output exists.

## Research-engine cutover truth

- V1 workflow/orchestrator remain present and usable.
- `/new` selects V2 only when `vars.WAYPOINT_RESEARCH_ENGINE == 'v2'`.
- With the selector unset, V1 is the production default.
- Manual V2 `workflow_dispatch` remains PR/draft mode even if the selector is later set; manual input cannot mint auto-publication authority.
- A green draft canary is necessary evidence, not sufficient authority for production cutover.
- V1 retirement happens only after an explicit cutover decision and proven rollback/parity conditions.

## Progress truth

- V2 emits durable run events and Progress consumes them.
- Missing fetch/nugget/token/cost counters remain empty/null unless a durable source proves them.
- Owner notes are scoped to an exact V2 `slug + runId + issue` identity and fail closed when identity is stale or ambiguous.
- V1 does not receive a guessed note target because it lacks the same durable issue join.

## Standing operating rules

- Do not use repeated full research runs to debug deterministic state/schema/CI defects.
- Never infer one execution plane's failure from another.
- Interactive research never attempts CAPTCHA, Turnstile, MFA, login, or security verification; mark the source blocked and use another authority.
- Frozen intake is not rewritten by research stages.
- Pass A and Pass B independence is a contract, not a prompt suggestion.
- A missing metric is an honest blank. Never invent telemetry to fill a dashboard.
- Pipeline critic/process findings belong in process evidence, never traveler learnings.
- Every important safety guard should have a test capable of going red when the protected behavior is removed.
- Do not change permanent research breadth/behavior because one validation destination is quirky; require a deterministic defect or repeated evidence.

## Current authority

- `README.md` — repository orientation and reading order.
- `PRODUCT.md` — product identity and non-negotiables.
- `CONTEXT.md` — durable historical decisions; read on demand, not injected wholesale into warm starts.
- `docs/reference/repo-map.md` — ownership/boundaries.
- `docs/reference/pipeline.md` — durable pipeline policy.
- `docs/pipeline v2/DECISIONS.md` — locked V2 decisions.
- `docs/pipeline v2/IMPLEMENTATION_STATE.md` — durable V2 implementation/proof state.
- `docs/pipeline v2/VALIDATION_RUNBOOK.md` — bounded validation execution rules and PASS/FAIL criteria.
- `docs/pipeline v2/VALIDATION_TRIAL_PACKETS.md` — pre-registered Run A/B scenarios.
- `docs/pipeline v2/R03_LIVE_FAILURE_SEAMS_EVIDENCE.md` — targeted live issue-escalation/cancellation proofs.
- `docs/pipeline v2/V06_TELEMETRY_EVIDENCE.md` — truthful currently measurable telemetry.
- `docs/pipeline v2/V07_EVALUATION_METHOD.md` — pre-registered post-validation efficiency rubric.
- `docs/pipeline v2/SEPTEMBER_TRACKER.md` — delivery/cutover status and deadlines.
