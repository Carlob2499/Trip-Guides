# HANDOFF — current operational state

> Compact warm start for the next engineering session. Durable architecture belongs in `docs/reference/`; Pipeline V2 decisions/evidence belong in `docs/pipeline v2/`. Keep this file to current truth and the immediate next action.

<!-- WARM_START_BEGIN -->
WAYPOINT / Trip-Guides — CURRENT STATE (2026-09-01)
Uruguay Canary #4 is GREEN draft-only proof; R03 escalation/cancellation seams are proven. Reciprocal Claude↔Codex reviewer automation remains active under the revision-4 trust boundary. See `CONTEXT.md` for history.
Fukuoka `fukuoka-20260829-7cb4fa` is terminal FAIL (5/5, 1/1 auto-retry); preserve `research-v2/fukuoka`.
Kumamoto r2/r3 are preserved stale evidence only. r3 `acceptance/v2-kumamoto-20260902-r3` @ `56e513000792bc71bf4e18c0a0909724fe5cebac` was preflight-green on accepted base `57e320535d1cb6e861a5001f8c26cc718dcfd93d`, but current main has acceptance-sensitive drift including V2 orchestration/resume/protected-landing/required-gate/September-watch changes; the pending role-based model/effort routing revision adds another acceptance-sensitive change. No model run started; r3 has no dispatch authority.
Fresh-run routing is now role-based: Sonnet 5 Medium for Pass A/B, Opus 5 Medium for Reconcile/Critic, with an optional independent judgment-effort override; historical runs retain their durable inputs.
#130 owner/tooling branch protection + live proof remain pending; no broad Actions bypass. `main` remains unprotected and no rulesets are configured.
Frontend U01/U02 DONE; U03 deterministic engineering DONE / YELLOW via #162. Physical-device spot check remains manual; reopen only for a reproduced defect.
NEXT: do not dispatch r2/r3. Rebuild/replay the exact Kumamoto candidate from settled current main, run exact-head deterministic preflight, then perform a fresh accepted-base drift audit before any Sep 2+ model dispatch.
No cap extension, artifact hand-edit, selector/cutover/publication changes, V1 retirement, or canary merge. V1 remains default; `WAYPOINT_RESEARCH_ENGINE` unset.
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
- Release-governance repository prerequisites are complete through #150. `main` still reports unprotected with no required-status enforcement/ruleset, so issue #130 is now only the final owner/tooling settings mutation and post-settings verification. PR #171 adds temporary hourly observation/dispatch glue only: it cannot configure protection, and it removes no owner boundary.
- The failed Fukuoka evidence remains frozen. Post-Fukuoka remediation is merged. Kumamoto r2 remains stale historical evidence after PR #149. Rebuilt r3 `acceptance/v2-kumamoto-20260902-r3` at `56e513000792bc71bf4e18c0a0909724fe5cebac` is also stale for dispatch: current `main` is 20 commits beyond its accepted base and includes acceptance-sensitive V2 workflow/state/retry/landing/required-gate changes. A fresh rebuilt/replayed exact candidate is required before any new model-backed acceptance.
- September engineering completion now includes frontend: U01/U02 target Sep 19, U03 Sep 26, and final engineering handoff Sep 30. PR #115 remains historical/deferred implementation evidence, not a branch to merge wholesale onto current main.
- U01/U02 are DONE through PR #160. U03 deterministic engineering is DONE / YELLOW: PR #162 aligned the phone bottom-nav DOM/focus order with its visual order and exact-head Required Gate `33352620168` passed invariants, lint, typecheck, unit/coverage, production build, and Accessibility/resilience. PR #164 closed the deterministic frontend authority; the physical-device spot check remains honestly pending and may reopen U03 only if it reproduces a real defect.

## Pipeline status preserved

- Uruguay Canary #4 remains a GREEN draft product-path proof; it does not authorize production cutover.
- PRs #106, #107, #109, and #111 are merged. The bounded deterministic repair program is closed.
- Yamagata Run-B remains durable evidence at 11/11 attempts and is frozen; do not grant another retry or repeat the historical validation campaign.
- Attempt 6 corrected the prior five critic enum findings but cannot serve as repair-to-green proof because the run resumed with stale control-plane code; PR #111 deterministically repairs that version-skew seam.
- V1 remains the production default/rollback while `WAYPOINT_RESEARCH_ENGINE` is unset.
- Final Fukuoka acceptance `fukuoka-20260829-7cb4fa` FAILED at reconcile on an unfetched official-source claim. Durable state is 5/5 quality attempts, 1/1 auto-retries, critic queued/0 attempts, publication false, landing pending.
- V2 production cutover remains pending and unauthorized. The failed Fukuoka branch is evidence, not content to repair-and-merge.
- Kumamoto r2 and r3 remain preserved historical preflight evidence only. r3's accepted base is `57e320535d1cb6e861a5001f8c26cc718dcfd93d`; current `main` has acceptance-sensitive drift, so neither stale candidate may be dispatched. Build/replay a fresh exact candidate from settled current main, prove that exact head, then re-audit drift before dispatch.
- The reciprocal Claude↔Codex reviewer automation remains active with the revision-4 trust boundary.
