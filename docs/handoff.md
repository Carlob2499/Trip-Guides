# HANDOFF — current operational state

> Compact warm start for the next engineering session. Durable architecture belongs in `docs/reference/`; Pipeline V2 decisions/evidence belong in `docs/pipeline v2/`. Keep this file to current truth and the immediate next action.

<!-- WARM_START_BEGIN -->
WAYPOINT / Trip-Guides — CURRENT STATE (2026-08-25)
Deterministic browser-level shared-add/offline proof is complete. It executes the production sync, outbox, and error-classifier paths with only the Firebase client/transport substituted.
The proof covers local durability, recreation, reconnect replay, stable-key idempotence, server acknowledgment, complete-payload preservation, permanent-rejection isolation, and canonical-state visibility in a second browser context.
It does not prove the real Firebase SDK or authentication, deployed rules, a real network/server acknowledgment, or convergence between two physical clients. Those remain live-environment work.
Canary #4 (Uruguay) remains GREEN for the V2 draft-only product path. R03 is fully accepted: authenticated issue escalation and the cancellation chain are proven.
V1 remains the production default/rollback while `WAYPOINT_RESEARCH_ENGINE` is unset. V2 production cutover remains pending. The pre-registered Run A/Run B/V07 program is complete with V01 YELLOW, V02/V03/V05 FAIL, V07 FAIL/ACTION and overall NOT READY. PR #105 merged the first R-A–R-F/W1 repair implementation before its independent diff review; the post-merge review found residual R-A/R-E/R-F defects. Draft PR #106 carries the mechanically safe corrections. Do not launch the fresh repaired-class Run-B scenario until the remaining focused contract repair is independently reviewed and green. DS1 remains calibration/candidate work, not a production-cutover decision.
The reciprocal Claude↔Codex reviewer automation remains active with the revision-4 trust boundary.
Durable shared-add decisions live in `CONTEXT.md`.
<!-- WARM_START_END -->

## Shared-add contract

- `collection.add` (used by Trip Split and reminder additions) and `addAsync` (Learnings feedback) use the local durable outbox.
- Server acknowledgment removes the active outbox entry and resolves `addAsync`.
- Offline or transient failures remain in the active durable retry outbox; `addAsync` may remain pending.
- Confirmed permanent rejection normally preserves the full payload in a separate durable rejected/dead-letter bucket, removes it from active capacity and replay, and rejects `addAsync` with the original or classified error.
- If rejected-bucket storage fails while active storage remains writable, the ordinary stable-path payload stays inside `tg-outbox` and reserved system metadata in the same atomic write marks it terminal, excluded from replay and the active 50-entry capacity.
- If neither terminal representation can be persisted, the full original active payload remains and the caller receives an explicit `WaypointSyncDurabilityError`; retry suppression is then physically unprovable.
- Rejected records do not retry on every room join. No traveler-facing dead-letter management UI is included.
- This contract applies only to collection additions, not `set`, `update`, or `remove`.

## Pipeline status preserved

- Uruguay Canary #4 remains a GREEN draft product-path proof; it does not authorize production cutover.
- V1 remains the production default/rollback while `WAYPOINT_RESEARCH_ENGINE` is unset.
- V2 production cutover remains pending.
- Do not rerun the historical validation sequence. Finish the residual R-A/R-E/R-F contract repair and review the stacked repair diffs first; only after those repairs merge run one fresh repaired-class Run-B scenario.
- DS1 remains calibration/candidate work, not production cutover.
- The reciprocal Claude↔Codex reviewer automation remains active with the revision-4 trust boundary.
