# HANDOFF — current operational state

> Compact warm start for the next engineering session. Durable architecture belongs in `docs/reference/`; Pipeline V2 decisions/evidence belong in `docs/pipeline v2/`. Historical evidence stays historical; this file records only current truth and the immediate next path.

<!-- WARM_START_BEGIN -->
WAYPOINT / Trip-Guides — CURRENT STATE (2026-09-05)
V2 is the selected product research engine through `WAYPOINT_RESEARCH_ENGINE=v2`; V1 remains the rollback/compatibility path. Final V2 release-readiness ratification is still pending.
Uruguay Canary #4 is GREEN draft-product/reliability proof; R03 escalation and cancellation failure-only seams are closed/proven. R03 is fully accepted. Fukuoka `fukuoka-20260829-7cb4fa` remains terminal FAIL evidence and must not be continued.
Kumamoto r1/r2/r3 are stale historical preflight evidence only. The next Kumamoto must be rebuilt/replayed from settled current `main`, exact-head proven, freshly drift-audited, then explicitly owner-authorized before any Claude/model burn. It ratifies the already-selected V2 path; it does not first enable V2.
D7's ten-surface transplant and product frame are on `main`; creator-directed fidelity corrections are currently being handled separately and creator visual acceptance remains pending. Do not start D8 or overwrite active design work.
PR #210 provider-neutral runtime integrations are on `main` (runtime routes/matrix, reviewed Places state, severe weather, AQI/UV, geolocation hooks, freshness/offline semantics). Deterministic product-completeness/runtime hardening remains part of September closure.
#130 PARTIAL: `main` has PR + no-fast-forward protection/no broad bypass; final required checks, fresh-integration enforcement, deletion protection, and protected-landing proof under the final ruleset remain.
The reciprocal Claude↔Codex reviewer is retired. The September completion watcher is retired. LEARN feedback synthesis is manual-only so Claude Pro usage is conserved for Kumamoto.
NEXT: finish continuity + creator-directed D7 fidelity/acceptance + deterministic closure + #130; settle `main`; then one fresh Kumamoto release-readiness ratification. Preserve Sep 20 feature freeze, Sep 27 code freeze, Sep 30 engineering-complete target.
<!-- WARM_START_END -->

## Current product/release boundaries

- `/new` selects V2 when the repository selector is `v2`; the owner has selected that state.
- Manual V2 dispatch remains PR/draft authority and cannot become product publication authority by itself.
- V1 remains available as rollback; retirement is a separate bounded decision after fresh V2 ratification, not part of continuity cleanup.
- Never use research/critic models to debug deterministic code, probe availability, or compensate for a failing gate.
- No stale acceptance candidate may be dispatched after acceptance-sensitive `main` changes.
- Attempt caps, evidence integrity, publication authority, and exact-head landing semantics are not negotiable to obtain a green result.

## September closure path

1. **Continuity/current-state reconciliation** — retire obsolete transition automation and make docs/tests/workflows agree with current V2-selected reality.
2. **D7 fidelity + creator acceptance** — active creator-directed visual corrections are separate; after they land, rebase concurrent work and run exact-head visual/resilience gates. Final accepted baselines only after creator approval.
3. **Deterministic product hardening** — current P0 review includes the Guide Completeness contract, runtime travel-mode fidelity, honest >8-stop matrix behavior, and moving performance-budget enforcement into the premerge authority where appropriate.
4. **Release governance #130** — require the concrete checks, fresh integration/up-to-date proof, deletion protection, no broad bypass, and re-prove protected landing under the final rules.
5. **Fresh Kumamoto** — rebuild from settled current `main`; deterministic preflight + fresh drift audit; one bounded model-backed release-readiness ratification only after explicit owner authorization.
6. **Field/adversarial closeout** — phone/intermediate/desktop, light/dark, long/CJK text, 200% text, reduced motion, image/map/provider failures, offline/poor network, geolocation denial, runtime staleness, group/mobility constraints, Split/SOS/Learnings.

Feature freeze: **2026-09-20**. Code freeze: **2026-09-27**. Engineering-complete target: **2026-09-30**.

## Stabilization evidence preserved

- S01 adversarial invalid-state testing: DONE from fail-closed regression coverage + PR #111.
- S05 blocked/bad-source behavior: DONE; search previews cannot masquerade as reads, blocked origins remain honestly typed, and evidence requirements stay strict.
- S06 historical regression suite: DONE on PR #111, including Tottori/Portugal/Luxembourg/Yamagata scars.
- S02 mobile critical path: DONE by PR #114 browser proof across `/new`, `/progress`, and a finished guide.
- S03 offline/poor-network traveler path: DONE by PR #114 plus durable sync/replay coverage.
- S04 automated accessibility: PASS; physical-device interaction remains a final traveler/UI check.
- R03 escalation/cancellation seams: DONE / accepted through targeted live proof.
- Uruguay Canary #4: accepted GREEN draft/reliability evidence, not final release-readiness proof.
- Fukuoka: terminal failed release-readiness evidence; frozen.
- Historical Kumamoto r1/r2/r3: preflight evidence only; stale for dispatch.

## Shared-add contract

- `collection.add` (Trip Split/reminder additions) and `addAsync` (Learnings feedback) use the local durable outbox.
- Server acknowledgment removes the active outbox entry and resolves `addAsync`.
- Offline/transient failures remain in the durable retry outbox.
- Confirmed permanent rejection preserves the payload in a rejected/dead-letter representation when possible, removes it from active replay/capacity, and rejects `addAsync` with the classified error.
- If terminal-state persistence cannot be proven, the full original active payload remains and the caller receives explicit durability failure; retry suppression must never be fabricated.
- Rejected records do not retry on every room join. No traveler-facing dead-letter management UI is included.
- This contract applies only to collection additions, not `set`, `update`, or `remove`.

## Model/resource policy

Fresh V2 role routing remains:
- Pass A/B: Claude Sonnet 5, Medium.
- Reconcile/Critic: Claude Opus 5, Medium.
- Reconcile owns fact-locked traveler-facing synthesis; Critic audits/repairs it; no fifth editorial model stage.

Those models are reserved for the authorized V2 research lifecycle. The retired reciprocal reviewer and retired September watcher must not return. Scheduled LEARN synthesis is disabled; manual LEARN export remains available when the owner intentionally chooses to spend that model usage.
