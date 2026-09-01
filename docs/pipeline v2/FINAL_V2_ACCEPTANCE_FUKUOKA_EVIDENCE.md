# Final V2 acceptance canary — Fukuoka evidence

Date: **2026-08-29**  
Canary ID: `v2-acceptance-fukuoka-20260828`  
Final verdict: **FAIL — MODEL / CONTENT; PRODUCTION CUTOVER REMAINS BLOCKED**

This is the permanent closeout record for the release-readiness V2 acceptance canary. It records what actually ran and what actually failed. It does **not** repair, rewrite, or merge the failed research branch.

## Frozen authority

- accepted base / `main`: `6fdae06af63e3890d7e147e13e08af056bb150b6`
- dispatch branch: `acceptance/v2-fukuoka-20260828`
- dispatch branch SHA used by every workflow run: `0a52ea1eb423f2d942b690942c3e9b62265b3c43`
- research branch: `research-v2/fukuoka`
- durable runId: `fukuoka-20260829-7cb4fa`
- research model: `claude-sonnet-5`, high effort
- critic model: `claude-opus-5`, high effort
- quality-attempt cap: **5**
- automatic quality-repair cap: **1**
- cap extension: **not authorized**
- publication / merge / V2 cutover: **not authorized**

The earlier canary summary omitted the final character from the dispatch SHA. The 40-character SHA above is the value reported by GitHub Actions for runs #59–#65.

## Authoritative workflow sequence

| Workflow # | Run ID | Trigger class | Result carried forward |
|---|---:|---|---|
| #59 | `33223076346` | initial manual dispatch | Pass A interrupted by a proven Claude usage limit; quality-attempt charge refunded; run stopped visibly |
| #60 | `33228350198` | manual resume | Pass A completed; Pass B returned a void artifact and failed with actionable feedback |
| #61 | `33230762432` | **single system auto-retry** | Pass B completed; Reconcile attempt 1 failed its deterministic research gate |
| #62 | `33233755036` | manual resume | Reconcile was interrupted by a second proven Claude usage limit; quality-attempt charge refunded; no auto-retry spent |
| #63 | `33241246394` | manual resume | Reconcile failed with one remaining blocking map/provenance finding |
| #64 | `33242075352` | manual resume | Reconcile failed the build/schema gate because two venue `book` values were outside the allowed enum |
| #65 | `33242953296` | manual resume | Reconcile failed on the final Showa Bus source-provenance claim; run stopped at the authorized 5/5 quality-attempt cap |

There were **seven workflow dispatches**: one initial dispatch, **five manual resumes** (#60, #62, #63, #64, #65), and **one automatic retry** (#61). Seven workflow dispatches are not seven quality attempts: the two proven usage-limit interruptions were availability failures and were refunded by the durable attempt policy.

A repeated proven usage-limit interruption may therefore be deliberately resumed after availability returns without extending the quality-attempt cap. It remains non-auto-retryable and does not mint additional authority.

## Durable terminal state

The preserved `research-v2/fukuoka` branch records:

- `status: failed`
- `attempts.total: 5`
- `attempts.cap: 5`
- `attempts.autoRetries: 1`
- `attempts.autoRetryCap: 1`
- `resume.nextStage: reconcile`
- `critic.status: queued`
- `critic.attempts: 0`
- `publication.published: false`
- `landing.outcome: pending`
- `landingGate.status: pending`

The final active validator finding is:

> The Showa Bus stop-renaming objective claim cites the operator as `access: "search-preview"`; a preview that references an official page is not evidence that the origin was actually read. Fetch the origin or record the block.

That is a substantive evidence/provenance failure in the model-produced research artifact. The pipeline correctly refused to accept it. The critic and landing stages were never reached.

## Acceptance conclusion

The final release-readiness canary **did not pass**. It therefore grants no V2 production authority.

What the run did prove:

- usage-limit interruptions stop visibly and refund quality budget;
- a void Pass-B artifact can consume the one bounded auto-repair and resume the same run;
- completed Pass A and Pass B work survives later resumes;
- reconcile repeatedly fails closed on research, schema/build, and provenance defects;
- no failed or incomplete run published;
- `main` remained unchanged by the failed canary.

What it did **not** prove:

- clean reconcile completion under the final repaired stack;
- critic completion;
- landing-gate success;
- publication parity;
- production V2 cutover readiness.

V1 therefore remains the production default / rollback path while `WAYPOINT_RESEARCH_ENGINE` is unset.

## Deterministic closeout after the canary

Independent review of the surrounding repository found two deterministic defects that are repaired separately from the frozen failed canary evidence:

1. **Claude↔Codex watcher missing-artifact fallback.** Its inline YAML `run:` scalar contained ` #`, which YAML can treat as a comment boundary before bash sees the quoted string. The no-artifact path is moved to a block scalar and regression-pinned.
2. **Autonomous evidence-owner cap extension.** `routeToEvidenceOwner()` could raise a run at its attempt cap from 5 to 6. Evidence-owner routing is autonomous bookkeeping, not spending authority; it now preserves the cap and lets `retryEligibility()` stop at 5/5 for a human decision.

The preserved Fukuoka research branch and its artifacts are intentionally untouched. No new Fable canary, publication, merge, or V2 cutover is authorized by this closeout.
