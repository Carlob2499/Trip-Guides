# HANDOFF — current operational state

> Compact warm start for the next engineering session. Durable architecture belongs in `docs/reference/`; Pipeline V2 decisions/evidence belong in `docs/pipeline v2/`. Keep this file to current truth and the immediate next action.

<!-- WARM_START_BEGIN -->
WAYPOINT / Trip-Guides — CURRENT STATE (2026-08-25)
Offline shared-add browser proof is complete on `codex/offline-write-reconnect-proof`, based exactly on `origin/main` `b656db630baafbcf1b6ebaafda2a9db699719cc1` in a clean dedicated worktree.
The proof exercises the real `sync.js` outbox and error classifier with only the Firebase client/transport substituted. Focused Playwright is 4/4 and the full Playwright suite is 69/69.
A real defect was fixed: Learnings `addAsync` promised device durability but bypassed `tg-outbox`; its first red expected one durable entry and received zero. Durable shared-add records now remain queued until server acknowledgment, and stable keys prevent replay duplication.
The bounded branch changes five implementation/test/CI files. No Pipeline V2 research behavior, DS1 visual decision, guide content, Firebase rule, room-ID semantic, production navigation, or unrelated architecture changed.
Canary #4 (Uruguay) remains GREEN for the V2 draft-only product path. V1 remains the production default/rollback while `WAYPOINT_RESEARCH_ENGINE` is unset. R03 is fully accepted: authenticated issue escalation and the cancellation chain are proven. The reciprocal Claude↔Codex reviewer automation remains active with the revision-4 trust boundary. Production cutover remains pending. Durable decisions live in `CONTEXT.md`.
Next: review PR #100; do not merge in this session. The remaining live boundary is the real Firebase SDK/auth, deployed rules, and real-network delivery path.
<!-- WARM_START_END -->

## Snapshot

### Offline shared-add contract

- `collection.add` (used by Trip Split and reminder additions) and `addAsync` (Learnings feedback) use the local durable outbox.
- An outbox entry is removed only after server acknowledgment. `addAsync` settles only on that acknowledgment.
- Transient and permanent transport failures leave the local record queued/pending and emit a classified `tg:sync-error`; an unverified write never becomes apparent success.
- A permanently rejected record may retry and log again on a later join. This bounded task adds no traveler-facing dead-letter or status UI.
- Non-add collection operations and document `set`/`update`/`remove` were traced but do not receive this durable-outbox contract here.

### Browser proof

The deterministic browser harness uses the production sync/outbox/error-classification implementation and substitutes only the external Firebase client/transport boundary. It proves:

- offline local visibility and a persisted `tg-outbox` entry;
- persistence after page/tab recreation;
- normal reconnect replay, server acknowledgment, and outbox removal after success;
- stable-key idempotence across later reload/reconnect;
- preservation of the complete payload;
- classified failure integrity without silent discard or false success;
- a second browser context reading the resulting canonical state.

This does **not** prove the Firebase SDK, authentication, deployed security rules, or a real network/backend exchange. Those remain live/environment proof.

### Defect and bounded files

The first Learnings browser test failed with “expected 1 durable entry, received 0,” proving `addAsync` bypassed the outbox. The smallest fix routes it through the same durable shared-add lifecycle without refactoring adjacent Firebase architecture.

Five implementation/test/CI files are in scope:

- `.github/workflows/a11y.yml`
- `src/features/firebase/sync.js`
- `tests/visual/fixtures/sync-proof-bundle.ts`
- `tests/visual/offline-sync.playwright.config.ts`
- `tests/visual/offline-sync.spec.ts`

## Verification

- Project invariants: 55 passed.
- Targeted Firebase units: 36 passed.
- Lint: passed.
- Typecheck: clean, 0 errors.
- Full unit suite: 3,041 passed, 1 todo.
- Production build: 13 pages, passed.
- Focused offline Playwright: 4/4 passed.
- Full Playwright: 69/69 passed.
- Independent review: APPROVE.

## Pipeline status preserved

- Uruguay Canary #4 remains a GREEN draft product-path proof; it does not authorize production cutover.
- R03 is fully accepted. Authenticated issue escalation and post-cancellation escalation have targeted live proof.
- V1 remains the production default/rollback while `WAYPOINT_RESEARCH_ENGINE` is unset.
- V01 and combined V02/V03/V05 remain the model-backed Run A/B validation work. V04 and V06 are DONE; V07 waits for Run A/B.
- The reciprocal Claude↔Codex reviewer automation remains active with the revision-4 trust boundary.

## Where we left off

All requested local verification and review are green. PR #100 is open from `codex/offline-write-reconnect-proof` and remains unmerged. Its report distinguishes the deterministic browser proof from the remaining live Firebase SDK/auth/rules/network proof.
