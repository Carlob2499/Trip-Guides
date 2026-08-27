# Pipeline V2 — validation synthesis and cutover recommendation

Date: 2026-08-26 · Orchestrated end-to-end under the pre-registered program (`VALIDATION_RUNBOOK.md`, `VALIDATION_TRIAL_PACKETS.md`, `V07_EVALUATION_METHOD.md`). Every consequential verdict was challenged by an independent fresh-context adversarial review before being recorded; two of those reviews changed the outcome (Run B: three provisional YELLOWs overturned to FAIL; V07: draft basis replaced).

## Recommendation

**NOT READY — REPAIR REQUIRED.**

The validation runs answered the question they were designed to answer, and the answer is asymmetric: **detection is proven, repair-to-green is unproven.** In both runs the pipeline's own fresh-context critic caught every planted-class defect — including all three immediate-FAIL facts — and publication containment held: no defective output landed or published. The deterministic gates did not, however, refuse every inconsistent intermediate state before checkpoint acceptance — Tottori's reconcile accepted checkpoint `b153af3` with a tree the critic's own build/schema gate then rejected (the R-C / W1-B gate-parity defect recorded below). But neither run reached a state that is simultaneously gate-accepted and self-consistent, and Run B's accepted reconcile checkpoint still contained three traveler-harmful facts, which the budget-capped critic subsequently detected before publication. Cutover before the repair list below would put production authority on a path whose containment works but whose completion has never once been observed.

## Scorecard

| Class | Verdict | Evidence |
|---|---|---|
| V01 (mega-city food/reservation) | **YELLOW** | `V01_RUNA_EVIDENCE.md` — all 7 pre-registered conditions PASS, no immediate-FAIL; bounded gap: no gate-accepted + self-consistent state |
| V02 (native-language/thin-English) | **FAIL** | `V0235_RUNB_EVIDENCE.md` — translated ambiguity hardened into false precision |
| V03 (fragile transport/physical transfer) | **FAIL** | same — last practical return researched against a line not serving the station; Mitokusan leg unresearched |
| V04 (future-event/disagreement) | **PASS** (done deterministically) | prior record |
| V05 (large-group/mobility) | **FAIL** | same packet — jumbo-taxi cost at the wrong tariff category (~60% understated) |
| V06 (telemetry truthfulness) | **DONE** | `V06_TELEMETRY_EVIDENCE.md` |
| V07 (efficiency) | **FAIL / ACTION** | `V07_EFFICIENCY_EVIDENCE.md` — two W1 deterministic-waste findings, control-plane fixes only |

## Repair program (pre-cutover, deterministic control plane only — no research doctrine changes)

1. **R-C / W1-B — gate parity:** run the critic's build/schema gate at reconcile acceptance so a checkpoint cannot be accepted with a tree the next stage's gate rejects (cost observed: one discarded 1 240 s critic attempt).
2. **R-A — post-critic evidence truth:** decide the owner of `evidence.v2.json` after criticism; today critic fact-corrections structurally desync it (both runs), and it is the artifact downstream evaluation reads.
3. **R-E — corroboration accounting:** dual-pass agreement on the *same number* must not count as independence when both passes lack a fetched primary source for it (Run B's 600 m figure).
4. **W1-A — id transcription:** control plane injects/auto-corrects the derived candidate id instead of spending a model attempt on it (7 instances across both runs).
5. **R-B — budget accounting:** usage-limit interruptions (an availability loss, 3 attempts across the program) should not consume the same bounded quality-retry budget as real failures — in both runs they consumed bounded attempts and contributed directly to attempt-cap exhaustion before another repair attempt could run.
6. **R-F — coverage honesty:** `coverage.v2.json` must not mark every ask covered while the guide itself declares a priority unresearched, nor cite disproven evidence ids for a BINDING ask.
7. **R-D — name contract (producer-side):** ledger candidate names must be the shipped name or carry an explicit anchor; do not loosen the anti-padding matcher.

After repairs: **re-run the Run B class** (a fresh fragile-transport/native-language/mobility scenario, fresh runId) to observe repair-to-green once, and grant or decline the stopped Tokyo run one completion dispatch to close V01's bounded gap.

## What cutover would get today (the honest positive)

Saturation-driven breadth without padding; mechanical A/B independence; party-size and mobility constraints changing real decisions; native-language discovery as a working primary channel; honest-empty telemetry; a publication boundary that held under every failure mode thrown at it; and a critic that caught 100% of the defects sampled. None of that is in question — completion under the bounded budget is.

## Boundaries unchanged

V1 remains production default/rollback; `WAYPOINT_RESEARCH_ENGINE` untouched; manual V2 dispatch stayed `landMode=pr` throughout (publication.published=false on both runs); no gate weakened; no frozen criterion, stage prompt, or research doctrine edited; the V01/V02/V03/V05 candidate remains compatibility-frozen; Uruguay Canary #4 remains draft evidence. The cutover decision itself belongs to the owner.
