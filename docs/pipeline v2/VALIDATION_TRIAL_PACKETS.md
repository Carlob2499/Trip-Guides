# Pipeline V2 — Pre-registered model validation trial packets

Status: **READY TO DISPATCH**  
Authority: `VALIDATION_RUNBOOK.md`  
Landing rule: every trial is manual V2 `workflow_dispatch` evidence and MUST remain `landMode=pr`; no publication authority, no selector change, no V1 retirement.

These packets freeze the scenario **before** model output exists. Do not tune the constraints after seeing results. If a run exposes a deterministic defect, repair the defect and rerun only the affected stage/class where the evidence contract permits it.

---

# Combined Research Run A — V01

## Destination / slug

- Destination: **Tokyo, Japan**
- Intended slug: `tokyo`
- Trip window for planning facts: **October 16–20, 2026**
- Party: **6 adults**

If `tokyo` becomes occupied by unrelated work before dispatch, choose a different real Tokyo guide slug according to the pipeline's normal fresh-run rules; do not invent a fake destination merely to protect the label.

## Frozen intent

1. Food is the top trip priority.
2. One **Saturday anchor dinner** is worth planning the day around when the quality difference is material.
3. Food quality outranks shortest travel time, but logistics and booking friction must still be explicit.
4. Casual meals should stay low-friction; do not turn every lunch into a reservation project.
5. Party size is six. A venue whose real seating/booking rules make six implausible must be rejected or caveated.
6. Preserve a genuinely exceptional but inconvenient option as **Worth the Effort/Detour** when the evidence supports it instead of silently deleting it for convenience.
7. No cuisine or neighborhood is pre-selected merely to make the test easier. Candidate discovery must earn the shortlist.

## Pre-registered V01 PASS conditions

The run passes V01 only if all hold:

- discovery expands beyond generic English top-list repetition and stops because novelty collapses **and** unresolved evidence is unlikely to change the recommendation, not because a count was reached;
- copied/derivative source families are not counted as independent consensus;
- serious finalists/anchor dinner receive deeper reservation research than casual meals;
- party-of-six feasibility changes at least one shortlist/rejection/booking decision where evidence warrants it;
- reconciliation records the quality vs logistics vs booking-friction tradeoff;
- at least one materially better inconvenient option is retained with an effort label or rejected with a concrete evidence-based reason;
- traveler-facing wording never upgrades an unconfirmed reservation method/window into certainty.

## Immediate FAIL

- candidate padding after saturation;
- derivative listicles counted as independent corroboration;
- invented reservation release timing/method;
- knowingly party-incompatible recommendation without caveat;
- convenience beats a materially better food option with no written tradeoff.

## Required evidence packet

Record these before marking V01 PASS:

- exact runId, branch, final head SHA;
- frozen intake/scaffold artifact;
- `evidence.v2.json` candidate/saturation evidence;
- source-family independence evidence for serious finalists;
- reservation/party-size evidence for finalists and anchor dinner;
- reconciliation disposition naming the winning tradeoff;
- final traveler-facing reservation wording;
- PASS/YELLOW/FAIL with defect classification;
- telemetry fields that truly exist, preserving nulls for unavailable counters.

---

# Combined Research Run B — V02 + V03 + V05

## Destination / slug

- Destination: **Tottori Prefecture, Japan**, centered on Tottori / Kurayoshi / Misasa Onsen
- Intended slug: `tottori`
- Trip window for planning facts: **October 20–23, 2026**
- Party: **8 adults**
- Mobility: **2 travelers have low walking tolerance**; repeated standing, stairs, long station walks, and rushed transfers are material costs
- Luggage: the group carries luggage on the transfer from the Tottori side toward Kurayoshi / Misasa
- Driving: assume **no rental car** unless the research concludes that a non-car plan becomes materially worse or unrealistic and says so explicitly

If `tottori` becomes occupied by unrelated work before dispatch, select another real smaller Japanese regional destination that still satisfies all three risk classes; document the substitution before running.

## Frozen intent

1. Local character matters more than checklist tourism.
2. Thin English coverage must not be interpreted as “nothing useful exists.”
3. Japanese-language research is valuable only when it strengthens or changes a decision; performative native-language searching does not count.
4. The itinerary must include at least one consequential public-transport transfer whose **physical** feasibility matters beyond timetable arithmetic.
5. Missing that connection/service must create a meaningful delay, last-return risk, or exertion consequence.
6. Group size and mobility must change recommendations, not appear only as generic “allow extra time” prose.
7. Taxi/private transport may win when evidence supports it, but availability and cost must never be invented.
8. At least one meal/venue should require an actual party-size feasibility decision for eight adults.

## Pre-registered V02 PASS conditions

- the run does not treat English-only search as exhaustive without justification;
- Japanese/local-language queries are used where they can plausibly improve evidence and skipped where they would be cosmetic;
- the native-language audit states what changed because of local evidence, or explicitly records that it changed nothing material;
- small-market discovery stops honestly rather than padding distant/weaker options;
- translation ambiguity remains visible instead of becoming a confident operational fact.

## Pre-registered V03 PASS conditions

- timetable feasibility and physical-transfer feasibility are separate evidence questions;
- consequence drives research depth: movement between platform/stop/terminal, buffer, luggage/group friction, and next-service consequences are investigated when material;
- a slower route is allowed to beat a faster fragile one;
- the fallback fails differently from the primary plan and remains usable after the modeled failure point;
- unknown station/transfer details remain explicit unknowns rather than invented walking times.

## Pre-registered V05 PASS conditions

At least **two material decisions** must differ from a plausible solo/fully-mobile itinerary because of group size or mobility, with an inspectable causal chain from intake constraint → evidence → changed recommendation. Qualifying examples include:

- different route/transfer;
- larger evidence-backed buffer;
- different venue/restaurant due to party-size feasibility;
- evidence-backed taxi/private transfer recommendation;
- reordered day to reduce repeated walking/standing.

## Immediate FAIL

Any one of these fails the relevant class:

- English-only search treated as exhaustive without justification;
- claimed native-language research without inspectable evidence;
- translated ambiguity hardened into operational certainty;
- tight connection accepted solely because the timetable permits it;
- fallback depends on the same missed service;
- last practical return invented or omitted where consequence is high;
- mobility appears only as generic caveat prose;
- tiny/party-incompatible venue recommended without caveat;
- taxi/private-transfer certainty or price fabricated.

## Required evidence packet

Record these before marking any class PASS:

- exact runId, branch, final head SHA;
- frozen intake/scaffold artifact showing 8 adults + two low-walking-tolerance travelers + luggage constraint;
- native-language audit and decision trace for V02;
- candidate/saturation + source-role/family evidence;
- transport risk/depth record with exact source/date evidence for material services;
- physical-transfer evidence or explicit unknown;
- missed-connection consequence and independent fallback;
- at least two intake-to-decision traces for V05;
- party-size evidence for the relevant meal/venue;
- PASS/YELLOW/FAIL verdict **separately for V02, V03, and V05**;
- telemetry fields that truly exist, preserving nulls for unavailable counters.

---

# Dispatch gate

Do not start either model-backed run unless all remain true at dispatch time:

1. `main` deterministic CI/project invariants are green.
2. V1 remains present and `WAYPOINT_RESEARCH_ENGINE` remains unchanged/off unless a separate cutover decision has happened.
3. Manual V2 dispatch still derives `landMode=pr` mechanically.
4. No unresolved deterministic V2 defect can contaminate the evidence.
5. These exact frozen constraints are copied or referenced in the run's durable evidence before inspecting model output.

# Completion order

1. Dispatch **Run A** and review V01 independently.
2. Dispatch **Run B** and review V02, V03, and V05 independently even though they share one run.
3. Only after V01/V02/V03/V05 have verdicts, execute V07 using those quality outcomes plus the already-closed V06 telemetry evidence.
4. Do not run an extra V04 research guide merely to reenact deterministic properties already proven by PRs #84/#85.
