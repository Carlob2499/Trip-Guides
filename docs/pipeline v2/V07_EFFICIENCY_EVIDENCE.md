# V07 — efficiency evaluation evidence packet

Status: **FAIL / ACTION — repeated deterministic waste with bounded control-plane corrections; no research-behavior change authorized**
Authority: frozen method `V07_EVALUATION_METHOD.md` (pre-registered 2026-08-23) applied to the Run A/B quality verdicts (`V01_RUNA_EVIDENCE.md`, `V0235_RUNB_EVIDENCE.md`) and durable `run.v2.json` telemetry.
Verdict process: orchestrator draft, then a fresh-context adversarial review that **overturned the draft's basis while confirming the verdict letter**; the recorded basis below is the reviewed one, with every disputed claim re-verified against the artifacts.

## Inputs used (and their limits)

Only durable facts: stage attempt histories, failure classes, durations, validator findings, and the reconcile-time counts in `run.v2.json` telemetry. `toolCalls`, `searches`, `fetches`, `nativeLanguageSearches`, `tokens`, `costUsd` are null in both runs and were not inferred; the telemetry `stages` block omits the critic stage entirely in both runs (an absence, not a preserved null). **W3/W5 are therefore unmeasurable on this instrument, not proven absent.** `attempts.total` (5/5 both runs) counts workflow dispatches, while stage attempts sum to 9 per run with no recorded attempt→dispatch mapping — so all cost claims below are attempt- and seconds-scoped, never cap-scoped.

## Per-run facts

- **Tokyo** `tokyo-20260826-41ae82` (V01 YELLOW): passA 756 s usage-limit + 2 354 s; passB 744 s; reconcile 637/1 214/853 s (findings 26→18→0); critic 199 s usage-limit + 1 701 s gate-failure. 62 candidates, 25 deep-verified, 58 facts, 2 disagreement investigations. State-file elapsed 19 887 s (see semantics note below).
- **Tottori** `tottori-20260826-e29ab7` (V02/V03/V05 FAIL): passA 1 315 s; passB 1 294 s; reconcile 1 984/476/192 s (10→1→0); critic 1 240 s gate-failure + 592 s usage-limit + 1 219 s gate-failure. 29 candidates, 22 deep-verified, 43 facts, 3 disagreement investigations. State-file elapsed 6 229 s (see semantics note below).
- **`totalDurationSec` semantics** (producer: `scripts/pipeline-v2.mjs`): the value is `state.updatedAt − state.createdAt`, and it is persisted only when a stage completes successfully — so it is run wall-clock elapsed through the last successfully recorded checkpoint, **not** a sum of model attempt durations and not a "total model work" metric. Tottori shows the gap directly: its printed attempt durations alone sum to ~8 312 s against a recorded 6 229 s, because the critic stage never completed and its wall time never persisted. The per-attempt durations above are the W1 basis; these elapsed figures are cross-run comparable only loosely (idle/queue time between stages is included, unpersisted trailing failures are not). No replacement total is invented; tool/search/fetch/token/cost metrics remain null as recorded.
- Per the method, the cheap Tottori run earns **no efficiency credit**: its quality classes FAILed, and a failed verdict is not aggregated away.

## Waste findings — the verdict basis

### W1-A — candidate-id contract mismatch (repeated, both runs)

Model stages were re-run to type strings the deterministic control plane had already computed. Tottori reconcile a2's feedback contains **exactly one** finding — `"San'in Matsushima Sightseeing Cruise"` id `c-sanin-…` vs the derived `c-san-in-…` — and a3 (192 s, zero research change) exists only to apply it. Tokyo's reconcile validator-fix pass records **6 candidate ids** failing the same name+branch derivation (`ledger.md`, item 1). Two destinations, 7 instances, two trigger characters: a deterministic structural defect **and** repeated evidence — both anti-overfitting limbs satisfied. Measured cost: 192 s Sonnet-5-high + one reconcile stage attempt (Tottori); an unisolable share of Tokyo's repair attempt. **Bounded fix:** the producer emits (or the control plane injects/auto-corrects) the derived id instead of burning a model attempt on transcription. No research behavior touched.

### W1-B — reconcile/critic gate-parity defect (R-C)

Tottori critic a1's feedback is **solely** an `npm run build` schema failure (`sections.1`/`sections.15` `verified_on` under `provenance:"strict"`) present in the tree reconcile had already gate-accepted at `b153af3`. A 1 240 s Opus-5 critic attempt was discarded (`commit: null`) and the stage repeated, because a deterministic schema check sits on the wrong side of a checkpoint. Mechanically reproducible; **bounded fix:** run the same build/schema gate at reconcile acceptance. Honest counterfactual: the saving is substitution of a cheaper, earlier reconcile rejection for a discarded Opus attempt, not the full 1 240 s.

## Recorded as `not proven waste` (burden of proof unmet)

- **Matcher false positives (R-D):** the Tottori "Camel commute" finding is critic a3's *output*, created at a3's end beside two independent failing categories (P0 blocking, P6 voice) — it consumed no budget and could not have changed a3's outcome. The three historical instances are three distinct defects: canary qualifier-mismatch (already fixed + regression-pinned in `check-candidates.mjs`), Tokyo markdown-bold (repaired producer-side in-run), Tottori descriptive-name ("Camel commute" is a description, not a shipped name). Loosening the matcher would weaken the anti-padding gate — disqualifying under the FAIL definition — so the repair stays producer-side (ledger name contract) on the R-D repair-list entry, outside V07's basis.
- **Usage-limit interruptions (R-B):** 3 stage attempts lost (756+199+592 = 1 547 s) are an availability loss, not work the pipeline performed — no W1–W5 class fits, and the method bars reasoning from subscription limits. Remains a deterministic repair-list item (budget accounting), not V07 waste.
- **W3 (600 m figure / R-E):** Pass B's platform corroboration added material facts (telescopes, exact parking counts, official wording) — protected work. The shared-wrong-number independence accounting is a structural defect owned by the V02/V03/V05 repair list, not a resource finding.
- **W4:** deep-verification ratios (25/62, 22/29) trace to evidence-backed dispositions; the dune-parking effort under the no-car intake produced a correction.
- **W5:** unmeasurable (nulls above).

## Protected work reaffirmed

Reconcile retries repairing real findings (26→18→0; 10→1), the critic's provenance/honesty corrections, dual-pass independence, native-language discovery, reservation depth, and the 62-vs-29 adaptive breadth difference are quality work, not waste. **No research prompt, doctrine, saturation rule, or frozen criterion changes under this verdict.**

## Verdict

**FAIL / ACTION** on W1-A + W1-B: repeated, measurable, mechanically reproducible waste, each with a bounded control-plane-only correction that weakens no research correctness, source independence, adaptive breadth, conflict handling, or traveler constraint. Had W1-A's Tokyo half and W1-B not existed, the correct verdict would have been YELLOW.
