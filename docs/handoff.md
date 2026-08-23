# HANDOFF — current operational state

> Compact warm start for the next engineering session. Durable architecture belongs in `docs/reference/`; Pipeline V2 decisions/evidence belong in `docs/pipeline v2/`. This file should state only what is true now and what work comes next.

<!-- WARM_START_BEGIN -->
WAYPOINT / Trip-Guides — CURRENT STATE (2026-08-23)
Pipeline V2 reliability repair is merged and Canary #4 (`uruguay-20260823-9789de`) completed the draft product path GREEN. Uruguay remains `draft: true`, `publication: false`, `landMode: pr`; it is evidence, not production content.
V1 remains the production default/rollback path while `WAYPOINT_RESEARCH_ENGINE` is unset. Manual V2 dispatches remain draft-only; production cutover is a separate evidence-based decision.
Canary #4 proved the normal fresh-run/recovery path, including real gate failures and bounded retry authority. Two failure-only seams were not exercised and must not be described as proven: a real escalation issue comment / `gh` path, and the cancellation grace-window chain.
The Progress surface now has durable V2 run events and an owner-note path keyed to exact V2 run identity; facts that the backend cannot prove remain honestly blank.
Next engineering work: execute the remaining V01–V05 validation risk classes, obtain targeted live proof for the two failure-only reliability seams when it can be done safely, and approach V2 cutover only after those acceptance conditions are satisfied.
Read next: `README.md`, `PRODUCT.md`, `docs/reference/repo-map.md`, `docs/reference/pipeline.md`, `docs/pipeline v2/DECISIONS.md`, `docs/pipeline v2/IMPLEMENTATION_STATE.md`, `docs/pipeline v2/PIPELINE_VALIDATION_PACK.md`, `docs/pipeline v2/SEPTEMBER_TRACKER.md`.
<!-- WARM_START_END -->

## Accepted live evidence

### Canary history

- **Malta — RED.** Historical Canary #1. Preserve as failure evidence.
- **Luxembourg — RED.** Historical Canary #2. Preserve as failure/convergence evidence.
- **Portugal — RED.** Canary #3, issue #74, run `portugal-20260822-7c041e`; exposed the runtime reliability defect class repaired before Canary #4. Do not resume it as if it were a clean acceptance run.
- **Uruguay — GREEN draft product path.** Canary #4, run `uruguay-20260823-9789de`, branch `research-v2/uruguay`. Pass A/B completed on the first attempt; Reconcile converged after three real gate failures; bounded automatic repair was consumed once and correctly refused after that; Critic completed on the first attempt; the landing gate passed. The guide did not publish.

Canary #4 proves the draft research/product path. It does not by itself authorize production cutover.

## Current reliability boundary

The repaired V2 runtime now preserves these contracts:

- agent exit status cannot be hidden by output logging;
- a failed agent cannot enter the successful collection path;
- failure classes identify the correct execution plane;
- retry eligibility comes from durable V2 state, not one ephemeral workflow output;
- automatic repair remains bounded;
- stopped runs have a visible escalation path;
- incomplete or failed research cannot publish.

Two live-only proofs remain outstanding because Uruguay did not trigger those paths:

1. an actual escalation comment to the intake issue through authenticated `gh` in the stage job;
2. cancellation completing retry-decision + escalation inside GitHub's cancellation grace window.

These are targeted reliability proofs. They are not a reason to repeat an expensive full research canary merely for spectacle.

## Research-engine cutover truth

- V1 workflow/orchestrator remain present and usable.
- `/new` selects V2 only when `vars.WAYPOINT_RESEARCH_ENGINE == 'v2'`.
- With the selector unset, V1 is the production default.
- Manual V2 `workflow_dispatch` remains PR/draft mode.
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

## Current authority

- `README.md` — repository orientation and reading order.
- `PRODUCT.md` — product identity and non-negotiables.
- `docs/reference/repo-map.md` — ownership/boundaries.
- `docs/reference/pipeline.md` — durable pipeline policy.
- `docs/pipeline v2/DECISIONS.md` — locked V2 decisions.
- `docs/pipeline v2/IMPLEMENTATION_STATE.md` — durable V2 implementation/proof state.
- `docs/pipeline v2/PIPELINE_VALIDATION_PACK.md` — remaining validation risk classes.
- `docs/pipeline v2/SEPTEMBER_TRACKER.md` — delivery/cutover status and deadlines.
