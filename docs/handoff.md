# HANDOFF — current operational state

> Compact warm start for the next engineering session. Durable architecture belongs in `docs/reference/`; Pipeline V2 decisions/evidence belong in `docs/pipeline v2/`. Keep this file to current truth and the immediate next action.

<!-- WARM_START_BEGIN -->
WAYPOINT / Trip-Guides — CURRENT STATE (2026-08-30)
Uruguay Canary #4 is GREEN draft-only product-path proof; R03 escalation/cancellation seams are proven. The reciprocal Claude↔Codex reviewer automation remains active with the revision-4 trust boundary. See `CONTEXT.md` for deeper history.
Fukuoka `fukuoka-20260829-7cb4fa` is terminal FAIL at Reconcile (5/5, 1/1 auto-retry); preserve `research-v2/fukuoka` and never continue or repair-merge it.
Kumamoto authority is only frozen `acceptance/v2-kumamoto-20260902-r2` @ `621dd43238d18b2b918827a9dca2268cd6f28c56`; no model run has started.
Release governance is implemented through #150; #130 awaits owner/tooling settings and the protected-main proof: gates/current integration, no force-push/deletion, no broad Actions bypass.
PR #143 puts U01/U02 by Sep 19, U03 by Sep 26, and handoff Sep 30; October is content/reverification/field bugs. #151 begins U02 truthfulness cleanup. #153 begins U01: the traveler-destination model preserves authored sections/legacy anchors and routes side-trip/event food to Explore; rendering/navigation are unstarted.
NEXT: selectively wire the proven U01 projection into the traveler-first guide hierarchy, retaining product IA, secondary routes, and legacy links; complete protected-main settings/proof; then Sep 2 dispatch `research-pass-v2.yml` from r2 for `kumamoto` (Sonnet 5/high, Opus 5/high critic). No cap extension, artifact edits, selector change, publication, cutover, V1 retirement, or canary merge.
V1 remains default/rollback; `WAYPOINT_RESEARCH_ENGINE` stays unset.
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
- S04 accessibility: automated portion PASS after PR #114 exposed and repaired progress status contrast and undersized controls; one physical-device interaction spot check remains as a traveler/UI check, not as retroactive authority for the already-run Fukuoka acceptance canary.
- R03 is fully accepted: targeted escalation and cancellation failure-only seams are closed/proven; Uruguay Canary #4 remains GREEN draft-only evidence, not production-cutover authority.
- Release-governance repository prerequisites are complete through #150. `main` still reports unprotected with no required-status enforcement/ruleset, so issue #130 is now only the final owner/tooling settings mutation and post-settings verification.
- The failed Fukuoka evidence remains frozen. A separately justified post-Fukuoka remediation is merged, and the fresh Kumamoto acceptance is authorized only on rebuilt preflight-green candidate `acceptance/v2-kumamoto-20260902-r2` at `621dd43238d18b2b918827a9dca2268cd6f28c56`; do not repurpose this authority into any other canary and do not dispatch the superseded candidate.
- September engineering completion now includes frontend: U01/U02 target Sep 19, U03 Sep 26, and final engineering handoff Sep 30. PR #115 remains historical/deferred implementation evidence, not a branch to merge wholesale onto current main. PR #151 is the first merged U02 truthfulness cleanup.
- PR #153 is the merged U01 model foundation. Its exact reviewed head `3f37c85a4607cc24c89b68571901ec4ab94ea24d` passed Required Gate, freeze policy, and both CodeQL analyses before merge; main `1fe293c06c6a728b17ed4664f922f1aed2c6ff1f` then passed deployment, worker, CodeQL, and the 93-test accessibility/resilience/offline browser suite.

## Pipeline status preserved

- Uruguay Canary #4 remains a GREEN draft product-path proof; it does not authorize production cutover.
- PRs #106, #107, #109, and #111 are merged. The bounded deterministic repair program is closed.
- Yamagata Run-B remains durable evidence at 11/11 attempts and is frozen; do not grant another retry or repeat the historical validation campaign.
- Attempt 6 corrected the prior five critic enum findings but cannot serve as repair-to-green proof because the run resumed with stale control-plane code; PR #111 deterministically repairs that version-skew seam.
- V1 remains the production default/rollback while `WAYPOINT_RESEARCH_ENGINE` is unset.
- Final Fukuoka acceptance `fukuoka-20260829-7cb4fa` FAILED at reconcile on an unfetched official-source claim. Durable state is 5/5 quality attempts, 1/1 auto-retries, critic queued/0 attempts, publication false, landing pending.
- V2 production cutover remains pending and unauthorized. The failed Fukuoka branch is evidence, not content to repair-and-merge.
- Fresh Kumamoto acceptance is separately authorized under `FINAL_V2_ACCEPTANCE_KUMAMOTO.md`; it is not a continuation of Fukuoka and may not inherit or extend Fukuoka's attempt authority. Current authority is rebuilt candidate `acceptance/v2-kumamoto-20260902-r2` at `621dd43238d18b2b918827a9dca2268cd6f28c56`, exact-head green in closed-unmerged PR #123.
- The reciprocal Claude↔Codex reviewer automation remains active with the revision-4 trust boundary.
