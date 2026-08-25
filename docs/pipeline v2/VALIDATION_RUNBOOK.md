# Pipeline V2 — V01–V05 Validation Runbook

Status: **READY FOR EXECUTION**  
Purpose: convert the validation risk classes in `PIPELINE_VALIDATION_PACK.md` into bounded, evidence-producing trials without wasting full research runs.

This runbook does not authorize production cutover, publication, or V1 retirement. All model-backed validation runs land as draft/PR evidence.

## Execution rule

Use the cheapest proof that can actually answer the question:

1. deterministic regression/fixture;
2. targeted research stage;
3. one combined draft research run when several risks naturally coexist;
4. manual review of the resulting evidence artifacts.

Do not run five full guides. V01–V05 are five **risk classes**, not five invoices from the token gods.

## Evidence packet required for every class

Record, in the PR/run evidence before marking a class PASS:

- exact runId / branch / head SHA;
- which risk class(es) the run intentionally exercised;
- relevant intake constraints, frozen at scaffold;
- artifact paths that prove the behavior;
- expected behavior stated before inspecting the result;
- observed behavior;
- PASS / YELLOW / FAIL with a concrete reason;
- any defect classified as deterministic pipeline, research quality, source/access, or UI/reporting;
- whether a rerun is actually necessary.

A green build alone is not validation evidence.

---

# V01 — Mega-city food / reservation / independent evidence

## Trial card

**Environment:** Tokyo-scale dense food market. 5–6 adults. Food is a top-ranked trip priority. Include one anchor dinner that materially rewards quality, one convenient but merely good option, and one exceptional option whose location or reservation friction makes it inconvenient.

**Intent constraints to freeze:**

- group of 6;
- food quality outranks shortest travel time;
- one anchor dinner is worth planning around;
- avoid turning every casual meal into a reservation project;
- preserve a genuinely exceptional inconvenient option as Worth the Effort/Detour rather than silently deleting it.

## Pre-registered expectations

PASS requires all of the following:

1. Candidate discovery expands beyond generic top-list repetition and then stops for an evidence-based reason rather than a fixed quota.
2. Copied/derivative source families do not count as independent consensus.
3. Reservation depth is concentrated on serious finalists/anchor meals; casual options remain proportionate.
4. Party-size friction is surfaced when it changes feasibility.
5. The final choice explains the tradeoff between quality, logistics, and booking friction.
6. A materially better but inconvenient option is either retained with an explicit effort label or rejected with a written reason.

## Required evidence

- saturation/candidate artifact;
- source-family / independence evidence;
- reservation dossier for finalists;
- reconciliation disposition explaining the winning decision;
- traveler-facing wording that does not overstate booking certainty.

## Immediate fail conditions

- fixed-number padding after novelty collapses;
- copied listicles treated as independent corroboration;
- fabricated reservation method or release timing;
- party of 6 recommended somewhere evidence shows cannot accommodate it;
- convenience automatically defeats materially better food with no recorded tradeoff.

## Execution shape

Use as **Combined Research Run A**. V04 may be embedded if a naturally conflicting or not-yet-announced event/operational fact is present; otherwise keep V04 deterministic/targeted.

---

# V02 — Native-language + thin-English evidence

## Trial card

**Environment:** smaller Japanese regional destination with useful local-language primary/community material and thinner English coverage than Tokyo/Kyoto/Osaka.

**Intent constraints to freeze:**

- local character matters more than checklist tourism;
- transit realities must be usable by a visitor without a car unless evidence says otherwise;
- native-language research is valuable only when it changes or strengthens a decision.

## Pre-registered expectations

PASS requires:

1. The pipeline does not infer “nothing exists” from thin English results.
2. Native/local-language queries are used when they can plausibly add evidence and skipped when they would be performative.
3. The native audit records what changed because of local-language evidence, or explicitly records that it added nothing material.
4. Small-market saturation stops honestly rather than padding distant/weak candidates.
5. Any translation uncertainty remains visible rather than silently hardened into fact.

## Required evidence

- native-language audit;
- source-role/family evidence;
- saturation record;
- at least one decision trace showing whether native evidence changed the result.

## Immediate fail conditions

- English-only search is treated as exhaustive without justification;
- machine-translated ambiguity becomes a confident operational claim;
- candidate list is padded solely to resemble a mega-city run;
- local-language research is claimed without inspectable evidence.

## Execution shape

Combine with **Research Run B** below so the same regional destination also exercises V03 and V05 where natural.

---

# V03 — Fragile transport / physical-transfer plausibility

## Trial card

**Environment:** a regional day containing at least one consequential transfer where timetable arithmetic alone is insufficient. The group carries luggage or has another movement constraint, and missing the connection creates a meaningful delay or last-return risk.

## Pre-registered expectations

PASS requires:

1. Timetable feasibility and physical transfer feasibility are treated as separate questions.
2. Research depth rises with consequence: platform/terminal movement, buffer, luggage/group friction, and next-service consequences are investigated when material.
3. A slower route may win when it is meaningfully more robust.
4. The fallback fails differently from the primary plan and is actually available after the modeled failure point.
5. Unknown station-transfer details remain uncertainty, not invented walking times.

## Required evidence

- transport risk/depth record;
- exact source/date evidence for material services;
- physical-transfer evidence or explicit unknown;
- missed-connection consequence;
- final route decision with robustness-vs-speed rationale;
- fallback.

## Immediate fail conditions

- a tight transfer is accepted solely because the timetable permits it;
- group/luggage constraint has no effect on a fragile transfer;
- fallback depends on the same missed service;
- last practical return is invented or omitted where consequence is high.

## Execution shape

Embed in **Combined Research Run B** with V02 + V05.

---

# V04 — Conflicting evidence / future-event safety

## Trial card A: deterministic future-event fixture

Provide evidence where prior-year official pages establish recurrence but the target-year date/venue/ticketing is not yet officially announced.

PASS requires:

- historical recurrence may support “likely to recur” only;
- no prior-year date is promoted to a confirmed target-year date;
- target-year date/venue/ticket claims remain explicitly unconfirmed;
- a recheck trigger/date is recorded when the fact matters to planning.

Immediate FAIL: any historical date is presented as confirmed for the future year.

## Trial card B: decision-changing disagreement

Provide an official rule plus several recent, genuinely independent firsthand reports describing a materially different practical reality.

PASS requires:

1. Official fact and experiential evidence remain separate lanes.
2. Source-family independence is considered before calling the reports consensus.
3. Extra investigation occurs because the disagreement changes a real decision.
4. Traveler-facing wording distinguishes “official rule” from “realistic planning expectation.”
5. Residual uncertainty remains visible.

Immediate FAIL:

- anecdotes overwrite the official rule;
- official copy erases credible practical evidence;
- derivative reports are counted as independent;
- the conflict disappears during reconciliation.

## Required evidence

- recurring-event deterministic test/fixture output;
- disagreement record;
- source-family classification;
- reconcile disposition;
- final traveler-facing wording.

## Execution shape

Run the future-event case deterministically first. Use targeted research or piggyback on Research Run A only if a real conflict adds evidence beyond the fixture.

---

# V05 — Large group / limited mobility

## Trial card

**Environment:** 8 adults, with at least two travelers who have low walking tolerance. Include luggage on one transfer day and at least one meal/venue where party size can change feasibility.

**Intent constraints to freeze:**

- walking burden is a planning constraint, not a footnote;
- repeated standing/transfer complexity matters;
- group seating/booking feasibility matters;
- taxis/private transport are acceptable when they materially reduce failure risk or exertion, but availability/cost cannot be invented.

## Pre-registered expectations

PASS requires at least **two material decisions** to differ from a plausible solo/fully-mobile itinerary because of group size or mobility, for example:

- a route or transfer changes;
- buffer increases for a documented reason;
- a restaurant/venue is replaced because party-size feasibility is poor;
- taxi/private transfer is recommended where evidence supports it;
- day ordering changes to reduce repeated walking/standing load.

The run must explain the causal link from intake constraint → evidence → changed recommendation.

## Required evidence

- frozen intake showing group/mobility constraints;
- at least two intake-to-decision traces;
- reservation/party-size evidence where relevant;
- walking/transfer reasoning;
- fallback appropriate to the same group.

## Immediate fail conditions

- mobility appears only as generic “allow extra time” copy;
- tiny/party-incompatible venues are recommended without caveat;
- fastest route wins despite materially higher transfer failure/exertion risk with no discussion;
- taxi certainty/cost is fabricated.

## Execution shape

Embed in **Combined Research Run B** with V02 + V03.

---

# Minimal expensive-run plan

## Combined Research Run A

Covers **V01** and, only when naturally present, the live half of **V04**.

Primary evaluation: saturation, source independence, reservation depth, disagreement handling, reconciliation quality.

## Combined Research Run B

Covers **V02 + V03 + V05** in one regional itinerary.

Primary evaluation: useful native-language evidence, small-market saturation, physical-transfer robustness, group/mobility consequences, independent fallback.

## Deterministic / targeted V04

Run before A/B. If the future-event and disagreement fixtures already prove the structural behavior, do not spend a third full research run merely to reenact them.

---

# Go / no-go before any model-backed trial

A model-backed validation run may start only when:

- current `main` deterministic CI/invariants are green;
- V1 remains available and selector state is unchanged unless cutover is separately authorized;
- the run is guaranteed draft/PR landing;
- the exact trial card and expected PASS/FAIL behavior above are copied into the run record/PR before results are inspected;
- no unresolved deterministic defect can contaminate the evidence;
- the run has a reason to add evidence that existing tests do not already provide.

If those conditions are not true, fix the deterministic problem first.

# Completion rule

Mark V01–V05 individually. A combined run may satisfy several classes, but each class receives its own evidence packet and verdict. `YELLOW` means the class produced useful evidence with a bounded unresolved gap; `FAIL` means repair before cutover. No class becomes PASS because another class happened to be green in the same run.
