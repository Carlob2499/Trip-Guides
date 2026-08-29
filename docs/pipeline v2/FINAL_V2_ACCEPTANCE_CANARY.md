# Pipeline V2 — Final Release-Acceptance Canary

Status: PRE-REGISTERED — CRITERIA FROZEN BEFORE DISPATCH

Canary ID: v2-acceptance-fukuoka-20260828
Slug: fukuoka
Dispatch branch: acceptance/v2-fukuoka-20260828
Accepted base: 6fdae06af63e3890d7e147e13e08af056bb150b6

Purpose:
One fresh post-repair, post-stabilization Pipeline V2 acceptance canary before
production-cutover review. This is not a continuation of Yamagata and is not
another V01–V07 validation campaign.

Frozen model candidate:
- Pass A / reconcile: claude-sonnet-5, high
- Pass B: workflow-frozen Sonnet
- Critic: claude-opus-5, high

Normal bounded recovery:
- run attempt cap: 5
- auto-retry cap: 1
- no owner cap extension authorized

PASS requires:
1. One durable runId from init through terminal completion.
2. Scaffold, Pass A, Pass B, Reconcile, and Critic all complete.
3. Existing deterministic gates accept the final artifacts without contract weakening.
4. landingGate.status == passed.
5. landMode == pr.
6. landing.outcome == draft and a real draft PR exists.
7. publication.published == false.
8. WAYPOINT_RESEARCH_ENGINE remains unchanged.
9. V1 remains available.
10. No manual edit to model-owned research/critic output is used to create the pass.
11. No Pipeline V2 production-code repair occurs inside the acceptance run.
12. Total attempts remain within the existing cap of 5.
13. Any completed expensive stage is skipped on resume rather than repeated.

FAIL — MODEL/CONTENT:
The normal bounded run exhausts its existing cap on genuine research/critic/gate
findings without evidence of a deterministic implementation defect.

FAIL — DETERMINISTIC:
A pipeline/orchestration/contract/state bug contaminates the acceptance evidence.

INCONCLUSIVE — INFRASTRUCTURE:
External usage/service/cancellation failure prevents a valid adjudication under
the bounded infrastructure-resume rule.

Forbidden:
- no cap extension;
- no Yamagata resume;
- no manual artifact correction to force green;
- no evidence/critic contract weakening;
- no V2 production selector change;
- no V1 retirement;
- no publication;
- no canary PR merge;
- no broad refactor.

The acceptance result will be recorded separately after the run. These criteria
must not be rewritten after observing model output.
