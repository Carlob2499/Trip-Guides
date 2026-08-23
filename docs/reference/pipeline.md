# The Waypoint Pipeline — current policy

Waypoint has exactly **two product lifecycles**: **Research** creates or re-researches a guide; **Change** edits a guide that already exists. Everything else is infrastructure serving one of those two.

This file owns durable pipeline policy. Current delivery status belongs in `docs/handoff.md` and `docs/pipeline v2/SEPTEMBER_TRACKER.md`. V2 implementation/proof detail belongs in `docs/pipeline v2/IMPLEMENTATION_STATE.md`.

## Two lifecycles, and nothing else

| | Research | Change |
| --- | --- | --- |
| Purpose | Build or re-research a guide | Modify an existing guide |
| Entry | `/new` / research dispatch | request, answers, date-lock, staleness, approved feedback |
| Workflow | V1 or V2 research implementation | `change.yml` |
| Expensive work | staged and resumable | scoped edit; failed run can restart |
| Publication | evidence-gated | evidence-gated; unsolicited changes remain PR-only |

A helper workflow, CI job, Worker endpoint, progress page, or review tool is not a third lifecycle.

## Research lifecycle

> **Two GENERATION implementations, one Research lifecycle.**

| | V1 | V2 |
| --- | --- | --- |
| Workflow | `research-pass.yml` | `research-pass-v2.yml` |
| Orchestrator | `scripts/pipeline.mjs` | `scripts/pipeline-v2.mjs` + `scripts/pipeline/v2/` |
| Role | **default and rollback path** until cutover | next-generation staged research path |
| Selected by | default while selector is unset | trusted `/new` only when `WAYPOINT_RESEARCH_ENGINE == 'v2'` |
| Manual V2 dispatch | n/a | always `landMode=pr`; cannot become production authority |
| State ownership | V1 checkpoints/state | workflow-owned `run.v2.json` |
| Pass A/B independence | separate research invocations | mechanically isolated at the recorded baseline |
| Critic | fresh context | mechanically stripped of forbidden prior-run artifacts |

V1 retirement is not a cleanup decision. It happens only after explicit cutover acceptance and proven rollback/parity conditions.

### Frozen intake

`guides-intake/<slug>/intake.md` is the traveler requirement contract. Research stages do not rewrite it. Durable research decisions, evidence, questions, coverage, attempts, and telemetry live in their own artifacts.

### Research independence

Pass A and Pass B are independent research passes, not two turns of one conversation. Reconcile is responsible for comparing them and recording dispositions. The critic receives fresh context and audits the resulting product rather than inheriting the research transcript.

### V2 state and resume

V2 uses durable run identity and per-stage state. A resume continues the same run and does not silently skip an owed stage. Completed expensive stages remain completed unless an explicit contract reopens them.

A fresh second run for the same slug receives a new run identity; stale mutable artifacts from the prior run must not contaminate the new baseline.

### V2 failure semantics

Failure classes name the plane where the failure occurred:

- `usage-limit`, `agent-failure`, `cancelled`, `unknown` describe process/control-plane failures.
- `void-run` means the agent returned but produced no usable stage-owned result.
- `gate-failure` means the agent returned work and a deterministic contract rejected it.

`finish-stage` judges output from a process that returned, so it is **never `agent-failure`**.

Partial output from a failed agent process never enters the successful collection/verification path.

Automatic repair is deliberately narrow. Only an actionable `gate-failure` or `void-run` with validator findings for the same run/stage and remaining budgets may receive the bounded automatic repair. `usage-limit`, cancellation, generic agent failure, unreadable state, missing findings, or exhausted budgets stop visibly instead of spending more research blindly.

Current caps remain bounded: five stage attempts and one automatic repair reservation unless a locked decision explicitly changes them.

### Publication authority

Research truth and publication truth are separate facts.

A gate may pass before a merge occurs. V2 publication is a two-phase transaction: the evidence/landing gate must pass first; publication is finalized only after GitHub proves the intended PR/merge identity. A failed/conflicted auto landing leaves the guide quarantined as draft content.

Manual V2 dispatches remain `landMode=pr` regardless of selector state.

## Change lifecycle

`change.yml` handles updates to an existing guide. The plan is built deterministically from the trigger and bounded to the affected guide areas rather than allowing an agent to invent unlimited scope.

Typical sources:

- **request** — traveler/owner change request;
- **answers** — a previously open traveler question was answered;
- **date-lock** — assumed dates became confirmed;
- **staleness** — scheduled recertification found expired operational facts;
- **feedback** — an approved feedback-derived proposal.

A change nobody explicitly asked for does not silently auto-publish merely because tests are green. Staleness/feedback maintenance remains reviewable when policy requires it.

The Change lifecycle preserves continuity: update the requested fact/section, then inspect dependent routes, itineraries, reservations, timings, costs, and statements that could now contradict the edit.

## Evidence gate

Publishing requires the repository's real deterministic evidence gate, not an agent's assertion that research is done.

At minimum, the product must satisfy the relevant schema/build and guide verification contracts. Networked verification is used where publication requires current external evidence. A missing or malformed mandatory artifact fails closed.

Human-judgment rows remain human judgment; deterministic checks must never manufacture a machine verdict for something the repository cannot actually prove.

## `/new` and the selector

`new-guide.yml` owns the trusted product entry.

- selector unset / not `v2` → V1 remains the default research path;
- `WAYPOINT_RESEARCH_ENGINE == 'v2'` → trusted `/new` may route to V2;
- manual V2 dispatch → draft/PR authority only.

The selector changes routing. It does not, by itself, delete V1, authorize publication, or prove production cutover.

## Worker boundary

GitHub is the durable record; the site is the human interface. The Worker handles owner/live operations that a static page cannot safely perform alone.

Owner-capable endpoints fail closed when owner authentication is absent or invalid. Publicly fileable issues do not, by themselves, grant agent-spending or publication authority.

## Progress truth

`/progress/` is an observability/control surface, so honesty outranks visual completeness.

- V2 run events come from durable pipeline facts.
- Missing fetch/nugget/token/cost metrics stay null/empty unless a durable source proves them.
- Active-generation resolution happens before historical publication state, so a newer run cannot be hidden by an older live guide.
- Conflicting active generations fail visibly rather than choosing one arbitrarily.
- Owner notes target only a verifiable V2 `slug + runId + issue` identity; the Worker independently re-verifies the same tuple before writing to GitHub.
- V1 does not receive a guessed note target because it lacks that durable issue join.

A stalled run must not animate as if work is progressing. A passed research gate must not be described as a successful landing until landing is actually proven.

## Recertification and learning

**Refresh:** scheduled checks identify expired facts, broken operational links, or other maintenance needs and feed the Change lifecycle.

**Learn:** traveler feedback may improve future guides, but traveler learnings and pipeline/process critic findings are separate domains. Process failures do not become traveler preferences.

## Operating rules

- Use deterministic tests/state inspection before spending another full research run.
- Never rewrite frozen intake to make downstream output easier to satisfy.
- Never invent telemetry or publication state.
- Never infer one execution plane's failure from another.
- Never bypass a failing evidence gate to make a deadline or dashboard green.
- Keep V1 available until cutover is explicitly accepted.
- Keep V2 decisions aligned with `docs/pipeline v2/DECISIONS.md`.

## Current proof and next validation

Current accepted proof and remaining live-only seams are summarized in:

- `docs/handoff.md`
- `docs/pipeline v2/IMPLEMENTATION_STATE.md`
- `docs/pipeline v2/PIPELINE_VALIDATION_PACK.md`
- `docs/pipeline v2/SEPTEMBER_TRACKER.md`
