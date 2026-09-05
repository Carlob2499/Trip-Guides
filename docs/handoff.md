# HANDOFF — current operational state

> Compact warm start for the next engineering session. Durable architecture belongs in `docs/reference/`; Pipeline V2 decisions/evidence belong in `docs/pipeline v2/`. Keep this file to current truth and the immediate next action.

<!-- WARM_START_BEGIN -->
WAYPOINT / Trip-Guides — CURRENT STATE (2026-09-05)
Uruguay Canary #4 is GREEN draft-only proof; R03 escalation/cancellation seams are proven. The four research-test drafts (luxembourg, malta, portugal, uruguay) and their guides-intake state left main on 2026-09-05 at the owner's direction; their evidence stays in docs/pipeline v2 and Git history. Curated guides: korea, denmark. Reciprocal Claude↔Codex reviewer automation remains active under the revision-4 trust boundary. See `CONTEXT.md` for history.
Fukuoka `fukuoka-20260829-7cb4fa` is terminal FAIL (5/5, 1/1 auto-retry); preserve it.
Kumamoto r1/r2/r3 are stale historical preflight evidence; no model run started and none has dispatch authority. Rebuild/replay from settled current main after the routing + prose revision lands.
Fresh V2: Pass A/B = Sonnet 5 Medium; Reconcile/Critic = Opus 5 Medium. Reconcile owns fact-locked traveler-facing synthesis; Critic audits/repairs it. No fifth editorial model stage.
#130 PARTIAL: main has PR + no-FF protection/no bypass; required checks, fresh integration, deletion block and live proof remain.
NEXT: exact-head preflight + fresh drift audit on rebuilt Kumamoto, then one bounded model-backed acceptance. No cap/artifact/selector/publication/V1-retirement changes. V1 remains default; `WAYPOINT_RESEARCH_ENGINE` unset.
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
- Release-governance repository prerequisites are complete through #150. `main` now has active partial protection through `Main Protection`: PRs are required, non-fast-forward updates are blocked, and there are no bypass actors. Issue #130 remains open because the four required checks, up-to-date/merge-queue-equivalent integration enforcement, deletion protection, and zero-model protected-main live proof are not yet proven. PR #171 remains temporary observation/dispatch glue only and cannot configure the missing rules.
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
