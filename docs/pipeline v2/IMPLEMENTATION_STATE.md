# Pipeline V2 — current implementation and proof state

This file is the durable technical state of Pipeline V2. It records **what exists now, what has been proven, and what remains unproven**. Completed milestone-by-milestone construction history belongs in Git history, not in this current-state record.

## Current verdict

**Draft product path: ACCEPTED / GREEN.**

**Reliability acceptance: ACCEPTED / GREEN, including targeted failure-only GitHub seams.**

**Production cutover: NOT YET ACCEPTED.**

V2 exists beside V1. V1 remains the production default and rollback path while `WAYPOINT_RESEARCH_ENGINE` is unset. V2 is selected by the trusted `/new` path only when the selector is explicitly `v2`; manual V2 dispatch remains `landMode=pr` and cannot become production authority.

The accepted live canary is **Uruguay / Canary #4**:

- slug: `uruguay`
- runId: `uruguay-20260823-9789de`
- branch: `research-v2/uruguay`
- final guide state: draft
- `publication.published`: false
- `landMode`: `pr`
- landing gate: passed

The canary proved the normal draft research/product path. It did not authorize production cutover. Two failure-only paths the canary did not naturally enter were subsequently proven with smaller no-model GitHub exercises and are recorded in `R03_LIVE_FAILURE_SEAMS_EVIDENCE.md`.

## Architecture that exists

### Orchestration

- `.github/workflows/research-pass-v2.yml` — job-per-stage V2 workflow.
- `scripts/pipeline-v2.mjs` — V2 control CLI.
- `scripts/pipeline/v2/` — state, contracts, evidence, coverage, recovery, landing, workspace/isolation, telemetry, and related deterministic control-plane modules.

### Durable artifacts

A V2 run uses durable run-scoped artifacts under `guides-intake/<slug>/`, including:

- frozen `intake.md`;
- `run.v2.json` for immutable run identity, stage/attempt state, landing/publication truth, and retry authority;
- `evidence.v2.json` for research candidates/findings/dispositions and saturation evidence;
- `coverage.v2.json` for material-intake coverage;
- feedback/findings artifacts for failed deterministic gates;
- question/answer artifacts where the run needs human input;
- `events.json` for durable observable run events.

Mandatory malformed artifacts fail closed. Missing facts are not inferred merely because a UI would look nicer with a number.

## Research-stage contracts

### Frozen intake

`intake.md` is the traveler requirement contract and is not rewritten by research stages.

### Pass A / Pass B independence

Pass A and Pass B are separate research worlds. V2 makes Pass B independence mechanical by running it against the recorded baseline rather than Pass A's output. A leak check fails closed when forbidden prior-pass artifacts appear.

### Reconcile

Reconcile is the first stage allowed to compare A and B. Pass-B-origin findings require written dispositions. Coverage must account for material intake asks instead of assuming a large candidate count equals completeness.

### Critic

The critic runs with fresh context and without the research artifacts it is not supposed to inherit. Its job is adversarial product/evidence review, not another continuation turn of the research transcript.

## Research breadth and evidence quality

Fixed candidate quotas are not the definition of quality. V2 uses adaptive saturation: research must show that additional searching is yielding duplicates/weaker evidence and that unresolved evidence is unlikely to change the decision before it may stop.

Objective operational claims require appropriate authoritative/primary evidence. Experiential claims may use recent independent firsthand evidence under the Guide Author rules. Search previews, proxies, reader mirrors, and inaccessible verification pages are not silently promoted to fetched primary evidence.

Research memory may propose leads; current research must verify current operational facts.

## Run identity and fresh-run safety

Each run has an immutable runId. A new research pass for an already-researched slug receives a fresh run identity rather than reusing prior mutable state.

Fresh-run initialization removes stale run artifacts from the new baseline so Pass A/B/criticism cannot accidentally inherit a previous run's evidence, coverage, feedback, event stream, or run state.

Active-generation resolution is shared across Progress/question/answer routing. An active newer run cannot be hidden by the fact that an older guide is already published. Dual-active ambiguity is refused visibly rather than resolved by guesswork.

## Failure and recovery semantics

The repair introduced after Portugal separates three planes:

1. **agent process plane** — usage-limit, agent-failure, cancelled;
2. **artifact/gate plane** — void-run, gate-failure;
3. **deterministic control plane** — unknown/fail-closed control failures.

The logged-command wrapper preserves the producer's real exit status while still capturing output. A nonzero agent process cannot enter the success/collection path with partial output.

`finish-stage` handles work from a process that returned, so it never labels its own artifact verdict `agent-failure`.

Automatic repair is decided from durable state, not a transient workflow flag. It is allowed only when all of these are true:

- failure class is `gate-failure` or `void-run`;
- actionable validator findings exist for the same runId and stage;
- stage attempt budget remains;
- automatic-repair budget remains.

Current bounds remain five quality attempts and one automatic quality-repair reservation. A proven usage-limit interruption does not consume a quality attempt, but it also does not auto-retry into the same exhausted usage window; the run stops visibly and can be deliberately redispatched after availability returns. Cancellation, generic agent failures, unknown failures, missing findings, unreadable state, exhausted budgets, and already-published runs do not earn blind retries.

A stopped run has a visible escalation path rather than silently disappearing.

The remaining live-boundary questions are now proven: Actions can authenticate the real issue read/comment path with marker deduplication, and a real cancelled job can execute the post-agent `always()` control-plane step plus the subsequent `cancelled()` escalation step inside GitHub's cancellation grace window.

## Landing and publication truth

The evidence gate and landing are separate facts.

V2 records the gate verdict before landing. Publication is finalized only after GitHub proves the exact intended merge/run identity. Publication cannot be inferred from a typed PR number, a reused slug branch, or the current clock.

Auto-landing failures/conflicts re-quarantine the remote guide as draft content. A quarantine that cannot be pushed is a hard/loud failure, not a safe-draft claim.

Manual V2 dispatch remains PR/draft mode. The production selector does not change that manual-dispatch invariant.

## Progress and owner controls

Progress consumes V2's durable run state/events and preserves honest-empty behavior for metrics the pipeline does not emit.

Run events are runId-scoped. Historical event streams cannot be attached to a different active run merely because the slug matches.

Owner notes use an exact V2 identity tuple:

`slug + runId + issue`

The client resolves a verifiable V2 target and rechecks it before send. The Worker independently verifies the tuple against the durable V2 run before writing a GitHub comment. Stale/mismatched runs fail closed. V1 has no equivalent durable issue join and therefore does not receive a guessed note target.

The deterministic note-path contract is covered by zero-network tests. A live post-deploy note write remains an environment proof, not something unit tests can manufacture.

## Accepted live proof — Canary #4

Uruguay exercised the post-repair V2 draft path end to end:

- Pass A: first attempt;
- Pass B: first attempt;
- Reconcile: reached completion after three real deterministic gate failures, with blocking findings converging `5 → 2 → 0`;
- bounded automatic repair: used once, then correctly refused on later failures;
- Critic: first attempt;
- landing gate: passed;
- publication: remained false;
- final product: draft PR/guide evidence, not production content.

This proves that normal research, retained findings, deterministic repair, stage resume, criticism, and draft landing can complete together on the repaired runtime.

## Accepted targeted failure-only proofs

Uruguay itself did **not** exercise two failure-only runtime paths; that historical limitation remains true. They are now closed separately with the smallest safe platform exercises:

1. **Real escalation issue comment / `gh` authentication — PASS.** Issue #90 received the Actions-bot witness through the real issue read/comment path with marker deduplication; disposable PR #91 was closed unmerged.
2. **Cancellation grace-window chain — PASS.** Tests workflow run `32680115285` cancelled a simulated active agent, then successfully completed the post-cancellation `always()` control-plane witness and the subsequent `cancelled()` escalation witness; disposable PR #92 was closed unmerged.

See `R03_LIVE_FAILURE_SEAMS_EVIDENCE.md` for the permanent evidence record. No additional full research canary is justified solely to reenact either failure path.

## Validation before production cutover

The validation program is defined in `VALIDATION_RUNBOOK.md`, frozen into `VALIDATION_TRIAL_PACKETS.md`, and tracked in `SEPTEMBER_TRACKER.md`.

Current state:

- **V01:** YELLOW — Run A (`tokyo-20260826-41ae82`, 2026-08-26) passed all seven pre-registered conditions with no immediate-FAIL under the frozen candidate; the critic checkpoint/draft-PR landing remains unfinished at the attempt cap (two of five dispatches lost to account usage limits). Evidence, independent-review record, and defect classifications: `V01_RUNA_EVIDENCE.md`;
- **V02/V03/V05:** FAIL — Run B (`tottori-20260826-e29ab7`, 2026-08-26) executed under the frozen candidate; each class tripped one pre-registered immediate-FAIL (translated ambiguity hardened; last-return misattributed to a line not serving the station; jumbo-taxi cost priced at the wrong tariff category), all caught by the run's own fresh-context critic but never repaired to a gate-accepted state inside the bounded budget. Evidence, independent-review record, and new deterministic defects (reconcile gate skips the build gate; candidate-matcher false positive recurred; dual-pass corroboration counted a shared wrong number as independence; coverage over-claims): `V0235_RUNB_EVIDENCE.md`;
- **V04:** DONE deterministically;
- **V06:** DONE from truthful available telemetry;
- **V07:** FAIL / ACTION — the frozen method applied to both runs' durable telemetry found two W1 deterministic-waste patterns (the candidate-id contract mismatch repeated across both runs; the reconcile gate accepting a tree the critic's build gate then rejected, discarding a full critic attempt), each with a bounded control-plane-only correction; no research-behavior change is authorized. Evidence and the independent-review record: `V07_EFFICIENCY_EVIDENCE.md`.

A zero-credit readiness audit found no active `tokyo` or `tottori` V2 run/intake collision on current `main` and no missing deterministic evidence field that justifies changing the V2 schema before those trials. The frozen criteria remain unchanged.

The important distinction is:

- **draft product-path acceptance** is already green;
- **reliability acceptance** is green, including the targeted failure-only platform seams;
- **production cutover acceptance** remains a separate decision requiring the remaining model-backed validation and explicit cutover authority.

Cutover must not be inferred from a passing unit suite, from Canary #4 alone, or from setting a repository variable temporarily.

## V1 retirement boundary

Until explicit cutover acceptance:

- keep `research-pass.yml`;
- keep V1 dispatch routing available;
- keep shared `pipeline.mjs`/publication/gate/history surfaces that V2 also consumes;
- keep Progress able to display V1 history/active runs where required;
- do not delete V1-only verification/checkpoint surfaces merely because V2 has equivalents.

After cutover, V1-only retirement should be a separate bounded change with tests proving that shared/history/rollback responsibilities are not accidentally removed.

## What not to do

- Do not rewrite Pipeline V2 because a simpler architecture is aesthetically appealing.
- Do not merge stages or weaken isolation without a new explicit architecture decision.
- Do not reintroduce fixed research-count quotas as a proxy for breadth.
- Do not fabricate telemetry, publication, deployment, or verification facts.
- Do not use repeated expensive research runs to debug deterministic code.
- Do not delete V1 before cutover acceptance.
- Do not turn a draft/manual V2 run into production authority.
- Do not optimize research behavior from one quirky validation destination unless there is a deterministic defect or repeated evidence.

## Current authority and next work

Read together:

- `DECISIONS.md` — locked decisions.
- `VALIDATION_RUNBOOK.md` — bounded validation rules and class-level PASS/FAIL criteria.
- `VALIDATION_TRIAL_PACKETS.md` — pre-registered Run A/B scenarios.
- `R03_LIVE_FAILURE_SEAMS_EVIDENCE.md` — targeted GitHub reliability proofs.
- `V06_TELEMETRY_EVIDENCE.md` — truthful currently measurable telemetry.
- `V07_EVALUATION_METHOD.md` — frozen post-validation efficiency rubric.
- `SEPTEMBER_TRACKER.md` — delivery status/deadlines.
- `../reference/pipeline.md` — durable lifecycle policy.
- `../handoff.md` — current warm start.

**Next engineering surface:** the model-backed validation program executed 2026-08-26 remains historical truth and concluded **NOT READY — REPAIR REQUIRED** (`V2_VALIDATION_SYNTHESIS.md`). The bounded deterministic repairs for gate parity, post-critic evidence ownership, corroboration accounting, candidate identity/name ownership, availability-vs-quality budgeting, and coverage honesty are implemented on the review branch cut from `4a37f0c`; they do not retroactively turn V01/V02/V03/V05/V07 green. Next is independent code review, then one fresh repaired-class model-backed validation run. V1 remains the production default and V2 cutover remains unauthorized until that new evidence succeeds.
