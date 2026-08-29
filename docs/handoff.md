# HANDOFF — current operational state

> Compact warm start for the next engineering session. Durable architecture belongs in `docs/reference/`; Pipeline V2 decisions/evidence belong in `docs/pipeline v2/`. Keep this file to current truth and the immediate next action.

<!-- WARM_START_BEGIN -->
WAYPOINT / Trip-Guides — CURRENT STATE (2026-08-29)
Uruguay Canary #4 remains GREEN as historical proof of the V2 draft-only product path. R03 remains accepted.
The separately authorized final release-readiness acceptance canary, Fukuoka `fukuoka-20260829-7cb4fa`, ran against accepted main `6fdae06af63e3890d7e147e13e08af056bb150b6` and **FAILED at Reconcile on model/content evidence provenance**. It ended at 5/5 quality attempts with the single auto-retry spent; critic and landing were never reached; publication remained false; main was unchanged.
The authoritative run/accounting record is `docs/pipeline v2/FINAL_V2_ACCEPTANCE_FUKUOKA_EVIDENCE.md`. It corrects the dispatch SHA to `0a52ea1eb423f2d942b690942c3e9b62265b3c43` and records five manual resumes plus one system auto-retry across Actions #59–#65.
The post-canary deterministic closeout fixes two independent defects without altering the failed research evidence: the watcher no-artifact YAML command is block-scalar safe, and autonomous evidence-owner routing may no longer extend the 5-attempt cap.
V2 remains NOT READY FOR PRODUCTION CUTOVER. V1 stays the default/rollback while `WAYPOINT_RESEARCH_ENGINE` is unset. Do not launch another Fable acceptance canary, publish, merge the failed Fukuoka research branch, or enable V2 from this closeout.
PR #115 remains a separate traveler-navigation/UI cleanup and is intentionally outside this backend repair.
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
- Do not spend Claude/Fable on another full acceptance run from this closeout. The failed Fukuoka evidence is frozen until a separately justified model/content remediation and new acceptance authorization exist.

## Pipeline status preserved

- Uruguay Canary #4 remains a GREEN draft product-path proof; it does not authorize production cutover.
- PRs #106, #107, #109, and #111 are merged. The bounded deterministic repair program is closed.
- Yamagata Run-B remains durable evidence at 11/11 attempts and is frozen; do not grant another retry or repeat the historical validation campaign.
- Attempt 6 corrected the prior five critic enum findings but cannot serve as repair-to-green proof because the run resumed with stale control-plane code; PR #111 deterministically repairs that version-skew seam.
- V1 remains the production default/rollback while `WAYPOINT_RESEARCH_ENGINE` is unset.
- Final Fukuoka acceptance `fukuoka-20260829-7cb4fa` FAILED at reconcile on an unfetched official-source claim. Durable state is 5/5 quality attempts, 1/1 auto-retries, critic queued/0 attempts, publication false, landing pending.
- V2 production cutover remains pending and unauthorized. The failed Fukuoka branch is evidence, not content to repair-and-merge.
- No new acceptance canary is authorized by the deterministic closeout. Any future model-backed run must follow a separately justified remediation/acceptance decision rather than continuing Fukuoka past its cap.
- DS1 and PR #115 remain separate design/UI work, not production cutover.
- The reciprocal Claude↔Codex reviewer automation remains active with the revision-4 trust boundary.
