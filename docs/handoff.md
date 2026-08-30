# HANDOFF — current operational state

> Compact warm start for the next engineering session. Durable architecture belongs in `docs/reference/`; Pipeline V2 decisions/evidence belong in `docs/pipeline v2/`. Keep this file to current truth and the immediate next action.

<!-- WARM_START_BEGIN -->
WAYPOINT / Trip-Guides — CURRENT STATE (2026-08-29)
Uruguay Canary #4 remains GREEN historical proof of the V2 draft-only path. R03 is fully accepted: escalation and cancellation are proven.
Fukuoka `fukuoka-20260829-7cb4fa` is terminal FAIL — MODEL / CONTENT at Reconcile (5/5 attempts, 1/1 auto-retry); critic/landing never ran; publication false. Preserve `research-v2/fukuoka`; never continue or repair-merge it.
PRs #116/#117/#122 are merged. #122 changed deterministic evidence handling and invalidated the first Kumamoto candidate for dispatch.
Current Kumamoto authority: `acceptance/v2-kumamoto-20260902-r2` @ `621dd43238d18b2b918827a9dca2268cd6f28c56`, based on `a171af0988a49e6f18f4c5e312c46b9a674ed189`. Closed-unmerged PR #123 exact-head preflight GREEN: Tests `33252721880`, Accessibility `33252721875`, CodeQL/actions/JS-TS PASS. No model-backed Kumamoto run has started.
NEXT: Sep 2 dispatch `research-pass-v2.yml` exactly from that frozen r2 ref for `kumamoto`, Sonnet 5/high + Opus 5/high critic. Never dispatch superseded `acceptance/v2-kumamoto-20260902`; no cap extension, artifact edits, production repair inside run, selector change, publication, or canary merge.
V1 remains default/rollback; `WAYPOINT_RESEARCH_ENGINE` stays unset. Reciprocal Claude↔Codex reviewer automation remains active with the revision-4 trust boundary.
Durable shared decisions: `CONTEXT.md`.
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
- Release governance is not mechanically closed: `main` remains unprotected, required checks are not enforceable by repository settings, and no ruleset targets `main`. Issue #130 is the current owner. Protection must preserve the intended trusted automated write paths; a no-Claude compatibility proof is required before this is treated as closed.
- The failed Fukuoka evidence remains frozen. A separately justified post-Fukuoka remediation is merged, and the fresh Kumamoto acceptance is authorized only on rebuilt preflight-green candidate `acceptance/v2-kumamoto-20260902-r2` at `621dd43238d18b2b918827a9dca2268cd6f28c56`; do not repurpose this authority into any other canary and do not dispatch the superseded candidate.

## Pipeline status preserved

- Uruguay Canary #4 remains a GREEN draft product-path proof; it does not authorize production cutover.
- PRs #106, #107, #109, and #111 are merged. The bounded deterministic repair program is closed.
- Yamagata Run-B remains durable evidence at 11/11 attempts and is frozen; do not grant another retry or repeat the historical validation campaign.
- Attempt 6 corrected the prior five critic enum findings but cannot serve as repair-to-green proof because the run resumed with stale control-plane code; PR #111 deterministically repairs that version-skew seam.
- V1 remains the production default/rollback while `WAYPOINT_RESEARCH_ENGINE` is unset.
- Final Fukuoka acceptance `fukuoka-20260829-7cb4fa` FAILED at reconcile on an unfetched official-source claim. Durable state is 5/5 quality attempts, 1/1 auto-retries, critic queued/0 attempts, publication false, landing pending.
- V2 production cutover remains pending and unauthorized. The failed Fukuoka branch is evidence, not content to repair-and-merge.
- Fresh Kumamoto acceptance is separately authorized under `FINAL_V2_ACCEPTANCE_KUMAMOTO.md`; it is not a continuation of Fukuoka and may not inherit or extend Fukuoka's attempt authority. Current authority is rebuilt candidate `acceptance/v2-kumamoto-20260902-r2` at `621dd43238d18b2b918827a9dca2268cd6f28c56`, exact-head green in closed-unmerged PR #123.
- DS1 remains separate design/UI work. PR #115 is closed/deferred and is not production-cutover evidence.
- The reciprocal Claude↔Codex reviewer automation remains active with the revision-4 trust boundary.