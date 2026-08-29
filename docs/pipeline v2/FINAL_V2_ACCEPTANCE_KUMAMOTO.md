# Pipeline V2 — Kumamoto Release-Readiness Acceptance

Status: PRE-REGISTERED — CRITERIA FROZEN BEFORE DISPATCH

Canary ID: v2-acceptance-kumamoto-20260902
Slug: kumamoto
Dispatch branch: acceptance/v2-kumamoto-20260902
Accepted base: d1f62fc0aa5fc2730a7fc01c8120a9cdd696eaca

Purpose:
One fresh post-Fukuoka, post-remediation Pipeline V2 acceptance canary before
production cutover review. This is not a continuation or repair of Fukuoka,
Yamagata, or any V01–V07 validation branch.

Frozen traveler scenario:
- Japan: Kumamoto, Aso, and Kurokawa Onsen
- 2026-11-09 through 2026-11-13
- 8 adults; public transit; moderate walking
- one traveler needs alternatives to sustained stairs where verifiable
- verify group capacity/reservations, transfers, last practical service, luggage
  friction, accessibility, and onsen policy rather than assuming

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
8. WAYPOINT_RESEARCH_ENGINE remains absent throughout the acceptance run.
9. V1 remains available and dispatchable.
10. No manual edit to model-owned research/critic output is used to create the pass.
11. No Pipeline V2 production-code repair occurs inside the acceptance run.
12. Total quality attempts remain within the existing cap of 5 and auto-retries within 1.
13. Any completed expensive stage is skipped on resume rather than repeated.

FAIL — MODEL/CONTENT:
The normal bounded run exhausts its existing cap on genuine research/critic/gate
findings without evidence of a deterministic implementation defect.

FAIL — DETERMINISTIC:
A pipeline/orchestration/contract/state bug contaminates the acceptance evidence.
Preserve the run, repair the owner separately with a regression, and start a new
frozen run rather than laundering this one.

INCONCLUSIVE — INFRASTRUCTURE:
External usage/service/cancellation failure prevents adjudication under the
bounded infrastructure-resume rule.

Forbidden:
- no cap extension;
- no continuation or mutation of Fukuoka;
- no manual artifact correction to force green;
- no evidence/critic contract weakening;
- no V2 production selector change during acceptance;
- no V1 retirement;
- no publication;
- no canary PR merge;
- no broad refactor.

The acceptance result will be recorded separately after the run. These criteria
must not be rewritten after observing model output.
