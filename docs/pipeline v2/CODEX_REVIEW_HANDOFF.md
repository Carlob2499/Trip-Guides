# Codex review handoff — validation verdicts V01/V02/V03/V05/V07 + synthesis

Requested by the owner. Scope: **independent review of the five recorded verdicts and the synthesis recommendation** (`V2_VALIDATION_SYNTHESIS.md`: NOT READY — REPAIR REQUIRED). This is a read-only validation task under the revision-4 trust boundary: findings are filed as review output, never as edits to evidence packets, frozen criteria, run branches, or guide content. Nothing here authorizes publication, cutover, `WAYPOINT_RESEARCH_ENGINE`, or re-dispatch.

## What to review, and what would falsify it

Judge each verdict only against its pre-registered criteria (`VALIDATION_RUNBOOK.md` class sections, frozen scenarios in `VALIDATION_TRIAL_PACKETS.md`, method in `V07_EVALUATION_METHOD.md`). A verdict is wrong if a cited fact is not in the artifact cited, if a pre-registered condition was scored against evidence that doesn't support it, or if an immediate-FAIL trigger was missed or misapplied.

1. **V01 = YELLOW** (`V01_RUNA_EVIDENCE.md`). Check the seven condition claims against `research-v2/tokyo` at checkpoint `b13e4c7` and HEAD `21fba55` (evidence/ledger under `guides-intake/tokyo/`, guide under `src/content/guides/tokyo/`). The YELLOW hinges on one claim: no state exists that is both gate-accepted and self-consistent. Falsify it by finding one.
2. **V02/V03/V05 = FAIL** (`V0235_RUNB_EVIDENCE.md`), branch `research-v2/tottori`, checkpoint `b153af3`, HEAD `28337c9`. Each class fails on one immediate-FAIL trigger. Two are internally provable and worth re-deriving from scratch:
   - `guides-intake/tottori/evidence.v2.json` → `ev-matsuba-gani-season`: the claim asserts "opens November 6, 2026" while its own quoted source text says "early November" (source: torican.jp only).
   - `ev-jumbo-taxi` records regular-car vs large-car tariffs; `transport[0].fallback` prices the 9-seat jumbo at the regular-car tariff.
   The V03 trigger (last practical return researched against a bus line not serving Kurayoshi Station; Mitokusan leg unresearched) rests on the run's own critic finding plus route evidence — verify the citation chain, and treat any independent transport re-research you do as review evidence, not guide content.
3. **V07 = FAIL / ACTION** (`V07_EFFICIENCY_EVIDENCE.md`). The basis is deliberately narrow: two W1s only. Check that `guides-intake/tottori/feedback.v2.json` reconcile-attempt-2 truly contains exactly one finding (the id derivation) and that critic-attempt-1 fails solely on the `npm run build` schema error; check `guides-intake/tokyo/ledger.md` (validator-fix pass, item 1) for the six Tokyo id mismatches. Also audit the negative space: the packet strikes the matcher false positive and usage-limit budget burn as not-proven-waste — dispute that if the artifacts support a cost.
4. **Synthesis** (`V2_VALIDATION_SYNTHESIS.md`). The load-bearing asymmetry is "detection proven, repair-to-green unproven." Falsify by finding one observed instance of a critic-detected defect repaired to a gate-accepted state, or by showing a repair-list item mischaracterized.

## Ground truth locations

- Run identity/attempts/telemetry: `guides-intake/<slug>/run.v2.json` on each research branch (immutable runIds `tokyo-20260826-41ae82`, `tottori-20260826-e29ab7`; `attempts.total` counts **workflow dispatches** (5), stage attempts sum to 9 — do not conflate).
- Dispatches: Actions runs 32950852089→32995615329 (tokyo), 33000323043→33020508988 (tottori); all `workflow_dispatch` from `claude/new-session-eeqncm`, all `landMode=pr`, `publication.published=false`.
- Deltas between accepted checkpoint and HEAD are the critic's corrections; the packets score both states (two-state protocol, `V01_RUNA_EVIDENCE.md` §Rerun necessity).

## Known caveats the review should not re-discover as fresh defects

- **R-A:** `evidence.v2.json` is never re-emitted after the critic, so at HEAD it contradicts critic-corrected guide facts on both runs. This is a recorded defect; it also means evidence-artifact reads at HEAD are stale where the critic intervened.
- Telemetry omits the critic stage entirely (absence, not null) and all count-style fields are null; the V07 packet already forbids inferring them.
- `SEPTEMBER_TRACKER.md`/`IMPLEMENTATION_STATE.md` summaries are derived; the evidence packets are authoritative on conflict.

## Output

File concur/dissent per verdict with exact artifact citations, plus any missed immediate-FAIL or misapplied condition, through the normal review channel. Dissents supported by artifacts will be re-verified and adopted the same way the two in-program adversarial overturns were.
