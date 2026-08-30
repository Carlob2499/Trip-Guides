# HANDOFF — current operational state

> Compact warm start for the next engineering session. Durable architecture belongs in `docs/reference/`; Pipeline V2 decisions/evidence belong in `docs/pipeline v2/`. Keep this file to current truth and the immediate next action.

<!-- WARM_START_BEGIN -->
WAYPOINT / Trip-Guides — CURRENT STATE (2026-08-30)
Uruguay Canary #4 remains GREEN draft-only proof; R03 escalation/cancellation seams are proven. Reciprocal Claude↔Codex reviewer automation remains active under the revision-4 trust boundary. See `CONTEXT.md` for history.
V3 is the single replacement route: V1 remains default/rollback fallback; V2 is historical evidence; fresh V3 acceptance is pending.
Fukuoka `fukuoka-20260829-7cb4fa` is terminal FAIL (5/5); preserve `research-v2/fukuoka`. Frozen V2 Kumamoto candidate is evidence only.
Governance is implemented through #150; #130 still needs owner/tooling branch-protection settings and live proof. Frontend migration remains due Sep 19–30.
NEXT: finish deterministic V3 scar and integration proof, then run one fresh V3 Kumamoto acceptance from a new V3 candidate (draft/PR-only). Do not repurpose the frozen V2 Kumamoto candidate, extend caps, hand-edit artifacts, publish, merge, or change the selector before that acceptance is green. If V3 misses acceptance, keep V1 as the trip-safe production route.
No cap extension, artifact edits, selector change, publication, cutover, V1 retirement, or canary merge. `WAYPOINT_RESEARCH_ENGINE` stays unset.
Local proof: 198/198 passed for V3 integration and 307 broader focused tests passed; lint, typecheck, invariants, and build are green. Reserve adversarial reviewers remain usage-blocked and uncounted.
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
- U01 is IN PROGRESS. PR #153 merged the traveler-destination model foundation; #155 merged the separate traveler-station contract; #156 merged primary-route-aware rail compatibility. The live GuideLayout/router/mobile-navigation switch is intentionally still pending so the migration can land atomically rather than as incompatible half-steps.

## Pipeline status preserved

- Uruguay Canary #4 remains a GREEN draft product-path proof; it does not authorize production cutover.
- PRs #106, #107, #109, and #111 are merged. The bounded deterministic repair program is closed.
- Yamagata Run-B remains durable evidence at 11/11 attempts and is frozen; do not grant another retry or repeat the historical validation campaign.
- Attempt 6 corrected the prior five critic enum findings but cannot serve as repair-to-green proof because the run resumed with stale control-plane code; PR #111 deterministically repairs that version-skew seam.
- V1 remains the production default/rollback while `WAYPOINT_RESEARCH_ENGINE` is unset.
- Final Fukuoka acceptance `fukuoka-20260829-7cb4fa` FAILED at reconcile on an unfetched official-source claim. Durable state is 5/5 quality attempts, 1/1 auto-retries, critic queued/0 attempts, publication false, landing pending.
- V3 production cutover remains pending and unauthorized. V1 stays the production default until one fresh V3 draft-only acceptance is green.
- The failed Fukuoka branch remains preserved V2 evidence, not content to repair-and-merge.
- The frozen Kumamoto branch remains V2 historical evidence only; the next acceptance must be a new V3 candidate and may not inherit or extend Fukuoka's attempt authority.
- The adversarial and careful-engineer reviewer calls were retried but remained usage-blocked; no external review is claimed.
- The reciprocal Claude↔Codex reviewer automation remains active with the revision-4 trust boundary.
