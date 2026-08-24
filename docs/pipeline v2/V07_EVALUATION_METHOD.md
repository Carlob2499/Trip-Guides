# Pipeline V2 — V07 pre-registered efficiency evaluation method

Status: **READY AFTER V01/V02/V03/V05 VERDICTS**  
Pre-registered: **2026-08-23**, before Combined Research Runs A/B produced model output  
Authority: `VALIDATION_RUNBOOK.md`, `VALIDATION_TRIAL_PACKETS.md`, `V06_TELEMETRY_EVIDENCE.md`

## Purpose

V07 asks whether the validated research quality required avoidable resource use. It does **not** reward fewer searches, fewer sources, or shorter runs by themselves. Independent corroboration, decision-changing investigation, native-language research, reservation verification, and high-risk transport verification are legitimate work when they improve or protect the recommendation.

V07 must be evaluated only after V01 plus V02/V03/V05 receive their own quality verdicts. Resource use without a quality result is not efficiency evidence.

## Inputs allowed

Use only facts the repository can prove from durable run/evidence artifacts:

- stage model and effort;
- stage attempts and retry history;
- successful, failed-attempt, cumulative, and total durations where recorded;
- failure class and validator findings;
- candidates considered;
- candidates deep-verified;
- evidence/fact count;
- disagreement investigation count;
- stage execution/re-execution identity;
- the V01/V02/V03/V05 evidence packets and verdicts.

The following remain unavailable unless a future trustworthy producer actually records them:

- tool-call counts;
- search counts;
- fetch counts;
- native-language search counts;
- input/output tokens;
- dollar cost.

Do not infer those values from prose, wall time, output size, model name, subscription limits, or candidate counts.

## Pre-registered waste classes

A resource use is evidence of **observed waste** only when the run artifacts show both the repeated/avoidable work and the lack of a corresponding quality/evidence benefit.

### W1 — deterministic-infrastructure retry

A model stage had to run again because of a deterministic orchestration/schema/control-plane defect rather than new research uncertainty.

This is high-confidence waste when the defect can be reproduced mechanically. Fix the deterministic defect rather than teaching the research agent to compensate for broken infrastructure.

### W2 — repeated stage with no evidence gain

A repeated research stage produces no material new candidate, evidence, disagreement resolution, reservation/transport answer, or corrected recommendation compared with the prior valid attempt.

A retry that repairs validator findings or materially improves evidence is **not** automatically waste.

### W3 — derivative-source repetition without independence gain

Repeated evidence comes from the same copied/derivative source family and adds neither new factual support nor genuine independent corroboration.

Two genuinely independent sources supporting an experiential claim are required quality work, not duplication.

### W4 — deep verification after decisive elimination

The run spends deep-verification effort on an option that was already eliminated by a decisive, durable constraint and the extra verification cannot plausibly change its disposition or provide a useful fallback/detour comparison.

Do not classify verification as waste merely because a candidate is eventually rejected; evidence-backed rejection is part of research quality.

### W5 — repeated evidence acquisition without confidence or decision gain

Additional evidence is materially redundant: it adds no source independence, freshness, conflict resolution, operational detail, fallback robustness, or recommendation change.

The burden of proof is on the waste finding. Unclear benefit means **not proven waste**, not an invitation to guess.

## Non-waste protections

Do not classify these as waste merely because they consume time or evidence rows:

- independent firsthand corroboration;
- primary-source verification of objective facts;
- local/native-language research that strengthens or changes a decision;
- explicit proof that native-language research added nothing material;
- investigation of recommendation-changing disagreement;
- reservation depth for serious finalists/anchors;
- party-size feasibility checks;
- high-risk transport physical-transfer and missed-connection research;
- evidence-backed fallback research;
- adaptive discovery while novelty remains material or unresolved evidence could still change the recommendation;
- a retry that fixes specific validator findings and produces a materially better accepted artifact.

## Per-run evaluation

For each Combined Research Run, record:

1. exact runId, branch, final head SHA;
2. V01/V02/V03/V05 verdict(s) from that run;
3. stage attempt/retry/duration facts that truly exist;
4. candidate/evidence/disagreement counts that truly exist;
5. each alleged waste observation with artifact references;
6. whether the observation changed quality, confidence, or a recommendation;
7. waste class W1–W5, or `not proven waste`;
8. whether a deterministic repair is justified.

Do not aggregate away a failed quality verdict. A cheap bad run is not efficient.

## Verdicts

### PASS — no meaningful observed waste

Use when the validated runs show no repeated resource pattern with evidence strong enough to justify a deterministic change.

### YELLOW — bounded inefficiency, no general repair yet

Use when one or more inefficiencies are observed but they are isolated, destination-specific, measurement-limited, or do not yet justify changing general research behavior.

### FAIL / ACTION — repeated measurable waste with a deterministic correction

Use only when evidence shows a repeatable waste pattern and a bounded implementation correction can remove it without weakening research correctness, source independence, adaptive breadth, conflict handling, or traveler constraints.

## Anti-overfitting rule

Do not change permanent research behavior because one Tokyo restaurant, one Tottori bus, or one unusual source behaved oddly.

A permanent optimization requires either:

- a deterministic structural defect; or
- repeated evidence across the validation runs strong enough to support a general rule.

When evidence is insufficient, preserve the current research behavior and record the uncertainty.

## Completion

V07 is not executed by this document. After V01/V02/V03/V05 have actual model-backed verdicts, apply this frozen method to those results plus V06 telemetry. Record PASS/YELLOW/FAIL with exact evidence and make no optimization that the observed data cannot justify.
