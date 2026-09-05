# Pipeline V2 — current implementation and proof state

This file is the durable technical state of Pipeline V2. It records **what exists now, what has been proven, and what remains unproven**. Detailed historical trial evidence stays in the dedicated evidence files and Git history; this file must describe the current system rather than freeze an older transition state.

## Current verdict — September 5, 2026

**Selected product research engine: V2.** The owner has set `WAYPOINT_RESEARCH_ENGINE=v2`, so trusted `/new` routes to Pipeline V2.

**V1 status: rollback / compatibility path.** V1 remains intact until a separate post-ratification retirement decision. It is not the current default.

**Draft product path: ACCEPTED / GREEN.** Uruguay Canary #4 remains the accepted end-to-end draft product-path proof.

**Reliability acceptance: ACCEPTED / GREEN.** Targeted escalation/cancellation failure-only seams are also proven; R03 is fully accepted.

**Fresh final release-readiness ratification: PENDING.** Fukuoka remains terminal failed evidence. Historical Kumamoto r1/r2/r3 are stale preflight evidence only. The next Kumamoto must be rebuilt/replayed from settled current `main`, exact-head proven, freshly drift-audited, then explicitly owner-authorized before any model-backed dispatch.

**Important distinction:** selecting V2 changes product routing. It does not rewrite historical Fukuoka/Kumamoto evidence or substitute for a fresh release-readiness ratification. The next Kumamoto validates the already-selected V2 system; it does not first authorize the selector.

**September control-plane state:** the reciprocal Claude↔Codex reviewer and the hourly September completion watcher are retired. LEARN feedback synthesis is manual-only to conserve Claude Pro usage for Kumamoto. No current automation may silently dispatch stale acceptance candidates.

**Frontend/runtime context:** D7's ten-surface transplant is on `main`, with creator-directed fidelity corrections in progress separately. PR #210's provider-neutral runtime integrations are on `main`. Those changes are acceptance-sensitive until settled and must be included in the final current-head drift/preflight reasoning.

## Architecture that exists

### Orchestration

- `.github/workflows/research-pass-v2.yml` — job-per-stage V2 workflow.
- `scripts/pipeline-v2.mjs` — V2 control CLI.
- `scripts/pipeline/v2/` — state, contracts, evidence, coverage, recovery, landing, workspace/isolation, telemetry, and related deterministic control-plane modules.
- `.github/workflows/new-guide.yml` — trusted product entry; routes to V2 when `WAYPOINT_RESEARCH_ENGINE == 'v2'` and retains the V1 rollback branch when it is not.

Manual V2 `workflow_dispatch` remains draft/PR authority (`landMode=pr`) regardless of selector state. Product routing and manual-run authority are intentionally separate.

### Durable artifacts

A V2 run uses durable run-scoped artifacts under `guides-intake/<slug>/`, including:

- frozen `intake.md`;
- `run.v2.json` for immutable run identity, stage/attempt state, landing/publication truth, and retry authority;
- `evidence.v2.json` for research candidates/findings/dispositions and saturation evidence;
- `coverage.v2.json` for material-intake coverage;
- feedback/findings artifacts for failed deterministic gates;
- question/answer artifacts where human input is required;
- `events.json` for durable observable run events.

Malformed mandatory artifacts fail closed. Missing facts are not inferred merely because a product surface would look fuller with them.

## Research-stage contracts

### Frozen intake

`intake.md` is the traveler requirement contract and is not rewritten by research stages.

### Model and effort routing

Fresh V2 product runs route by role:

- Pass A — Claude Sonnet 5, Medium.
- Pass B — mechanically isolated Claude Sonnet 5, Medium.
- Reconcile — Claude Opus 5, Medium.
- Critic — Claude Opus 5, Medium.

The trusted `/new` caller pins these defaults explicitly. High effort is an escalation, not the routine fresh-run default. There is no fifth editorial model stage: Reconcile owns fact-locked traveler-facing synthesis; the fresh-context Critic audits/repairs that product.

### Pass A / Pass B independence

Pass A and Pass B are separate research worlds. Pass B operates against the recorded clean baseline rather than Pass A output. A leak check fails closed when forbidden prior-pass artifacts appear.

### Reconcile

Reconcile is the first stage allowed to compare A and B. Pass-B-origin findings require written dispositions. Coverage accounts for material intake asks rather than treating candidate count as completeness.

### Critic

Critic runs with fresh context and without forbidden research artifacts. It is an adversarial product/evidence audit, not another transcript turn.

## Research breadth and evidence quality

V2 uses adaptive saturation rather than fixed candidate quotas. Research must show that further searching is producing duplicate/weaker evidence and that unresolved evidence is unlikely to change the recommendation before stopping.

Objective operational claims require appropriate authoritative/primary evidence. Experiential claims may use recent independent firsthand evidence under Guide Author rules. Search previews, mirrors/proxies, and inaccessible origins are not silently promoted to fetched verification.

Research memory may suggest leads; current research must verify current operational truth.

## Run identity and fresh-run safety

Each run has an immutable runId. A new research run for an existing slug receives a fresh run identity rather than reusing mutable prior-run state.

Fresh-run initialization excludes stale evidence, coverage, feedback, events, and run state from the new baseline. Active-generation resolution prevents an older published guide from hiding a newer active run. Ambiguous dual-active states fail visibly.

## Failure and recovery semantics

V2 separates three planes:

1. **agent process plane** — `usage-limit`, `agent-failure`, `cancelled`;
2. **artifact/gate plane** — `void-run`, `gate-failure`;
3. **deterministic control plane** — `unknown` / fail-closed control failures.

A nonzero agent process cannot enter the success/collection path with partial output. `finish-stage` judges returned output and therefore never invents `agent-failure` for its own artifact verdict.

Automatic quality repair is allowed only when all are true:

- failure is `gate-failure` or `void-run`;
- actionable findings exist for the same runId and stage;
- stage attempt budget remains;
- automatic-repair budget remains.

Current bounds remain **five quality attempts + one automatic quality-repair reservation**. A proven usage-limit interruption refunds that dispatch's quality-attempt charge and stops visibly; it does not immediately re-dispatch into the same exhausted window. Availability failures do not enlarge the quality or repair budgets. Cancellation, generic agent failure, unknown failure, missing findings, unreadable state, exhausted budgets, and already-published runs do not earn blind retries.

The retired September completion watcher no longer owns any retry/dispatch authority. Any future acceptance redispatch follows current durable run state and explicit owner/control-plane authority only.

## Landing and publication truth

Evidence gate, landing, selector state, release-readiness evidence, and publication are separate facts.

V2 records gate verdict before landing. Publication is finalized only after GitHub proves the exact intended merge/run identity. Publication cannot be inferred from a typed PR number, reused slug branch, selector setting, or clock time.

Auto-landing conflict/failure re-quarantines the remote guide as draft content. A quarantine that cannot be pushed is a loud failure, not a safe-draft claim.

The shared landing path is protected-main compatible through the exact-head transaction introduced in PR #149: it integrates current base, reruns required verification, and refuses stale head/base state.

## Progress and owner controls

Progress consumes V2 durable run state/events and preserves honest-empty behavior for metrics the pipeline does not emit.

Run events are runId-scoped. Historical event streams cannot attach to a different active run simply because the slug matches.

Owner notes use exact V2 identity:

`slug + runId + issue`

Client and Worker both verify that tuple. Stale/mismatched runs fail closed. V1 lacks the equivalent durable issue join and does not receive a guessed note target.

## Accepted live proof — Uruguay Canary #4

Uruguay exercised the repaired V2 draft path end-to-end:

- Pass A — first attempt;
- Pass B — first attempt;
- Reconcile — completed after three real deterministic gate failures, with blocking findings converging `5 → 2 → 0`;
- bounded automatic repair — used once, then correctly refused later;
- Critic — first attempt;
- landing gate — passed;
- publication — remained false;
- final authority — draft/PR evidence, not production publication.

This proves normal research, retained findings, deterministic repair, resume, criticism, and draft landing can complete together.

## Accepted failure-only proofs — R03

Two paths Uruguay did not naturally enter were closed separately with smaller no-model platform exercises:

1. real Actions-authenticated escalation issue read/comment + marker deduplication — PASS;
2. real cancelled-job grace-window chain (`always()` control-plane witness followed by `cancelled()` escalation witness) — PASS.

Permanent evidence: `R03_LIVE_FAILURE_SEAMS_EVIDENCE.md`. R03 is fully accepted; no full research canary is justified merely to reenact these failure paths.

## Historical validation evidence

The validation program and evidence remain durable, but historical FAIL/YELLOW trials are not current execution authority.

- V01 — historical YELLOW.
- V02/V03/V05 — historical FAIL classes; deterministic repair work subsequently landed.
- V04 — deterministic DONE.
- V06 — telemetry evidence DONE where measurable; unavailable metrics remain honest nulls.
- V07 — historical efficiency ACTION evidence; bounded deterministic waste defects were identified/handled.
- Fukuoka — terminal release-readiness FAIL at Reconcile after the authorized quality budget; Critic/landing not reached, publication false.

See the dedicated evidence files for exact SHAs, workflow runs, findings, and historical attempt accounting. Do not rewrite those records to match today's selected-engine state.

## Post-Fukuoka remediation

The deterministic/model-input remediation after Fukuoka remains part of the current system:

- same-stage validator findings are surfaced before broad research instructions on retry;
- retries are repair-first and preserve unaffected valid work;
- `search-preview` provenance cannot be relabeled as verification — fetch/read the real origin or remove/flag unsupported content;
- Reconcile is not instructed to execute environment gates its sandbox cannot run;
- map-placeholder repair is narrow and no-guess;
- role-based model/effort routing and final traveler-facing prose contract are settled in current code.

Fukuoka itself remains frozen historical evidence and is never repair-and-merged.

## Kumamoto — current authority

Historical r1/r2/r3 are preflight evidence only. No historical candidate has dispatch authority.

The next Kumamoto must:

1. wait until acceptance-sensitive continuity, creator-directed design, deterministic hardening, and release-governance changes are settled enough that the candidate will not immediately stale;
2. rebuild/replay the pre-registered scenario from then-current `main`;
3. prove the exact candidate head deterministically;
4. run a fresh acceptance-sensitive drift audit immediately before dispatch;
5. stop if drift appears;
6. receive explicit owner authorization before model use;
7. preserve resulting evidence whether PASS or FAIL without hand-editing model artifacts or weakening gates.

Because V2 is already selected operationally, this is **release-readiness ratification**, not a selector/cutover-enablement test.

## V1 rollback boundary

While V2 ratification is pending:

- keep `research-pass.yml`;
- keep V1 dispatch routing available when selector is not `v2`;
- keep shared publication/gate/history surfaces consumed by both generations;
- keep Progress able to represent V1 history where required;
- do not delete V1-only verification/checkpoint surfaces merely because V2 has equivalents.

After successful fresh ratification, V1 retirement may be considered as a **separate bounded change**. It is not required merely to call V2 selected, and it should be deferred if removal creates more risk than value before September code freeze.

## September continuity and quota boundaries

The reciprocal Claude↔Codex reviewer and hourly September completion watcher were transition scaffolding and are retired. Their scripts/prompts/tests/workflows must not silently return.

LEARN feedback synthesis remains a valid product utility but is manual-only during closure. Research/critic Claude usage is reserved for authorized research work, especially the fresh Kumamoto ratification; deterministic engineering and CI must not spend model quota to debug themselves.

Issue #187 owns the project critical path. `SEPTEMBER_TRACKER.md` owns V2 execution status. Issue #130 owns final protected-main repository-settings/proof truth.

## What remains before engineering-complete

Current P0 sequence:

1. continuity/current-state reconciliation;
2. creator-directed D7 fidelity corrections + creator visual acceptance;
3. deterministic product-completeness/runtime/performance hardening;
4. final #130 protected-main governance;
5. settled-main fresh Kumamoto release-readiness ratification;
6. adversarial physical-device/offline/degraded-provider closeout.

Feature freeze: **September 20, 2026**. Code freeze: **September 27, 2026**. Engineering-complete target: **September 30, 2026**.

## What not to do

- Do not rewrite Pipeline V2 because a simpler architecture is aesthetically appealing.
- Do not merge stages or weaken A/B/Critic isolation without an explicit architecture decision.
- Do not reintroduce fixed research-count quotas as a proxy for breadth.
- Do not use model runs to debug deterministic failures.
- Do not revive retired watcher/reviewer automation.
- Do not revert `WAYPOINT_RESEARCH_ENGINE` merely to satisfy stale pre-selection tooling.
- Do not continue Fukuoka or stale Kumamoto candidates.
- Do not extend attempt/retry caps because a deadline is near.
- Do not infer creator visual acceptance from functional/browser gates.
- Do not start Pipeline V3 or another broad redesign during September closure.
