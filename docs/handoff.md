# HANDOFF — current operational state

> Compact warm start for the next engineering session. Durable architecture belongs in `docs/reference/`; Pipeline V2 decisions/evidence belong in `docs/pipeline v2/`. Keep this file to current truth and the immediate next action.

<!-- WARM_START_BEGIN -->
WAYPOINT / Trip-Guides — CURRENT STATE (2026-08-28)
Uruguay Canary #4 remains GREEN for the V2 draft-only product path. R03 is fully accepted: authenticated escalation and the cancellation chain are proven.
The deterministic V2 repair stack is merged through PR #111. Yamagata Run-B `yamagata-20260828-73821a` is CLOSED at 11/11 attempts; its last critic output fixed the remaining enum findings, but stale research-branch control-plane code invalidated that attempt as repair-to-green proof. PR #111 regression-pins the version-skew repair. Do not extend Yamagata or repeat Run-B.
V2 is still the target but remains NOT READY FOR PRODUCTION CUTOVER. V1 stays the default/rollback while `WAYPOINT_RESEARCH_ENGINE` is unset.
Current phase: release-readiness. S01/S02/S03/S05/S06 are closed and S04's automated gate is green after PR #114 found/fixed progress contrast + target-size defects. Only a brief physical-device interaction spot check remains before a separately authorized clean V2 acceptance canary.
The reciprocal Claude↔Codex reviewer automation remains active with the revision-4 trust boundary.
Durable shared-add decisions: `CONTEXT.md`. Run-B evidence: `docs/pipeline v2/RUNB2_YAMAGATA_EVIDENCE.md`.
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

## Stabilization status

- S01 adversarial invalid-state testing: DONE from existing fail-closed regression coverage + PR #111 full Tests/coverage pass.
- S05 blocked/bad-source behavior: DONE; search previews cannot masquerade as reads, mirrors/proxies are refused, blocked origins stay honestly typed, and R3+ transport requires fetched evidence.
- S06 historical regression suite: DONE on PR #111 exact code head, including Tottori/Portugal/Luxembourg/Yamagata scars.
- S02 mobile critical path: DONE by PR #114 browser proof across /new, /progress, and a finished guide.
- S03 offline/poor-network traveler path: DONE by PR #114's fresh-page offline service-worker read plus the existing durable sync/replay suite.
- S04 accessibility: automated portion PASS after PR #114 exposed and repaired progress status contrast and undersized controls; one physical-device interaction spot check remains.
- Do not spend Claude/Fable on stabilization; the next model-owned work is the clean V2 acceptance canary after the physical spot check.

## Pipeline status preserved

- Uruguay Canary #4 remains a GREEN draft product-path proof; it does not authorize production cutover.
- PRs #106, #107, #109, and #111 are merged. The bounded deterministic repair program is closed.
- Yamagata Run-B remains durable evidence at 11/11 attempts and is frozen; do not grant another retry or repeat the historical validation campaign.
- Attempt 6 corrected the prior five critic enum findings but cannot serve as repair-to-green proof because the run resumed with stale control-plane code; PR #111 deterministically repairs that version-skew seam.
- V1 remains the production default/rollback while `WAYPOINT_RESEARCH_ENGINE` is unset.
- V2 production cutover remains pending and unauthorized.
- The next engineering phase is release-readiness/stabilization. A future V2 acceptance canary, if authorized, is a new release-readiness proof rather than another Yamagata repair attempt.
- DS1 remains calibration/candidate work, not production cutover.
- The reciprocal Claude↔Codex reviewer automation remains active with the revision-4 trust boundary.
