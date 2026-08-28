# HANDOFF — current operational state

> Compact warm start for the next engineering session. Durable architecture belongs in `docs/reference/`; Pipeline V2 decisions/evidence belong in `docs/pipeline v2/`. Keep this file to current truth and the immediate next action.

<!-- WARM_START_BEGIN -->
WAYPOINT / Trip-Guides — CURRENT STATE (2026-08-28)
Deterministic browser-level shared-add/offline proof remains complete. It covers production sync/outbox/error-classifier behavior with only the Firebase client/transport substituted; real Firebase/auth/deployed-rules/two-physical-client convergence remain live-environment work.
Uruguay Canary #4 remains GREEN for the V2 draft-only product path, and R03's authenticated escalation/cancellation seams remain proven.
Pipeline V2's original pre-registered validation verdict remains V01 YELLOW, V02/V03/V05 FAIL, V07 FAIL/ACTION, overall NOT READY. The full deterministic repair stack is now merged: PRs #106/#107 repaired the post-#105 contract defects; PR #109 added the three defects exposed by the fresh repaired-class Yamagata Run-B; PR #111 fixed the final resume-version-skew defect that caused an old research branch to execute stale pre-#109 control-plane code.
The Yamagata repaired-class Run-B (`yamagata-20260828-73821a`) is CLOSED at 11/11 total attempts / 6 critic attempts. Critic attempt 6 corrected the five remaining `source.kind` enum errors, but its terminal gate ran stale branch code, so it is not valid repair-to-green proof. Do not extend Yamagata and do not start another Run-B as part of this repair cycle.
V2 remains NOT READY FOR PRODUCTION CUTOVER. V1 remains the production default/rollback while `WAYPOINT_RESEARCH_ENGINE` is unset.
The deterministic repair treadmill is frozen. The next phase is release-readiness/stabilization and an explicit cutover decision. Any future live V2 acceptance canary is a separately authorized release-readiness action, not a continuation of Yamagata.
DS1 remains calibration/candidate work, not a production-cutover decision. The reciprocal Claude↔Codex reviewer automation remains active with the revision-4 trust boundary.
Durable shared-add decisions live in `CONTEXT.md`; repaired-class Run-B evidence lives in `docs/pipeline v2/RUNB2_YAMAGATA_EVIDENCE.md`.
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
- Remaining stabilization work is traveler-facing: S02 mobile critical path, S03 offline/poor-network critical path, and S04 manual accessibility/interaction confirmation.
- Do not spend Claude/Fable on S01/S05/S06; those are closed deterministic work.

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
