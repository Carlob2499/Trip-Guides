# HANDOFF — current operational state

> Compact warm start for the next engineering session. Durable architecture belongs in `docs/reference/`; Pipeline V2 decisions/evidence belong in `docs/pipeline v2/`. Keep this file to current truth and the immediate next action.

<!-- WARM_START_BEGIN -->
WAYPOINT / Trip-Guides — CURRENT STATE (2026-08-25)
Deterministic browser-level shared-add/offline proof is complete. It executes the production sync, outbox, and error-classifier paths with only the Firebase client/transport substituted.
The proof covers local durability, recreation, reconnect replay, stable-key idempotence, server acknowledgment, complete-payload preservation, permanent-rejection isolation, and canonical-state visibility in a second browser context.
It does not prove the real Firebase SDK or authentication, deployed rules, a real network/server acknowledgment, or convergence between two physical clients. Those remain live-environment work.
Canary #4 (Uruguay) remains GREEN for the V2 draft-only product path. R03 is fully accepted: authenticated issue escalation and the cancellation chain are proven.
V1 remains the production default/rollback while `WAYPOINT_RESEARCH_ENGINE` is unset. V2 production cutover remains pending. The next research sequence remains Run A → Run B → V07. DS1 remains calibration/candidate work, not a production-cutover decision.
The reciprocal Claude↔Codex reviewer automation remains active with the revision-4 trust boundary.
Durable shared-add decisions live in `CONTEXT.md`.
<!-- WARM_START_END -->

## Shared-add contract

- `collection.add` (used by Trip Split and reminder additions) and `addAsync` (Learnings feedback) use the local durable outbox.
- Server acknowledgment removes the active outbox entry and resolves `addAsync`.
- Offline or transient failures remain in the active durable retry outbox; `addAsync` may remain pending.
- Confirmed permanent rejection preserves the full payload in a separate durable rejected/dead-letter bucket, removes it from active capacity and replay, and rejects `addAsync` with the original or classified error.
- Rejected records do not retry on every room join. No traveler-facing dead-letter management UI is included.
- This contract applies only to collection additions, not `set`, `update`, or `remove`.

## Pipeline status preserved

- Uruguay Canary #4 remains a GREEN draft product-path proof; it does not authorize production cutover.
- V1 remains the production default/rollback while `WAYPOINT_RESEARCH_ENGINE` is unset.
- V2 production cutover remains pending.
- Run A → Run B → V07 remains the next research sequence.
- DS1 remains calibration/candidate work, not production cutover.
- The reciprocal Claude↔Codex reviewer automation remains active with the revision-4 trust boundary.
