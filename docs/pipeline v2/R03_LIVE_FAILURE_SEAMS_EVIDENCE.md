# Pipeline V2 — R03 live failure-only seam evidence

Status: **PASS**  
Recorded: **2026-08-23**  
Purpose: close the two GitHub-platform reliability seams that Uruguay Canary #4 could not naturally exercise, without spending another model-backed research run.

## Scope

Uruguay Canary #4 proved the ordinary fresh-run and bounded recovery path but never entered two failure-only branches:

1. a real authenticated escalation comment to an intake issue;
2. post-cancellation control-plane recovery and escalation inside GitHub Actions' cancellation grace window.

Existing deterministic tests already covered the state/retry/publication semantics. These targeted platform proofs answer only the remaining live-boundary questions.

No Claude/Fable research model was invoked for either proof. Neither proof branch was merged. `WAYPOINT_RESEARCH_ENGINE` was not changed and no production publication authority was exercised.

## Seam 1 — authenticated issue escalation

**Verdict: PASS.**

Evidence surface:

- checkpoint issue: **#90**;
- disposable proof PR: **#91**, closed unmerged;
- branch: `proof/z03-escalation-boundary`;
- external witness comment posted by `github-actions[bot]` with marker `<!-- waypoint-v2-stop:z03-boundary-proof -->`.

The disposable Actions proof used the same external boundary the V2 stop path relies on:

- `github.token` with `issues: write`;
- `gh issue view` to inspect existing comments;
- marker lookup before notification;
- `gh issue comment` for the visible stop notice;
- a repeated observation that left exactly one marker-bearing comment.

This proves that the repository's Actions token can cross the real GitHub issue read/write boundary and that the marker-based deduplication strategy works against a real issue. Existing reliability tests continue to prove the V2-specific durable retry/escalation decision that leads to this boundary.

## Seam 2 — cancellation grace-window chain

**Verdict: PASS.**

Evidence surface:

- checkpoint issue: **#90**;
- disposable proof PR: **#92**, closed unmerged;
- branch: `proof/z06-cancellation-grace`;
- real GitHub Actions Tests workflow run: **32680115285**.

Observed job sequence in the real run:

1. proof-start witness posted successfully;
2. simulated agent step requested cancellation and finished with conclusion **`cancelled`**;
3. a subsequent `if: always()` control-plane step completed **successfully** after cancellation;
4. a subsequent `if: cancelled()` escalation step completed **successfully**;
5. the escalation step posted the external witness comment to issue #90 as `github-actions[bot]`.

The proof intentionally kept the simulated agent active after requesting cancellation so GitHub had to exercise its actual cancellation behavior rather than merely evaluating a pre-cancelled fixture.

This is the live platform fact that the deterministic B3 tests could not prove: GitHub's cancellation handling gives the post-agent control plane enough execution opportunity for an `always()` recovery step and a later `cancelled()` escalation step to run.

The permanent V2 workflow already wires its four model stages with the corresponding control-plane sequence: always-checkout, durable failure recording on `failure() || cancelled()`, retry decision, and visible escalation when repair is not allowed. The existing reliability tests prove that a `cancelled` durable state is not auto-repairable, resumes at the interrupted stage, and cannot advance publication.

## Acceptance conclusion

R03's two previously outstanding live-only reliability seams are now closed:

- **real issue-comment / authenticated `gh` boundary: PASS**;
- **real cancellation grace-window control-plane chain: PASS**.

No additional full research canary is justified solely to reenact these failure paths.

This does **not** authorize V2 production cutover, V1 retirement, or publication. Those remain separate acceptance/operations decisions.
