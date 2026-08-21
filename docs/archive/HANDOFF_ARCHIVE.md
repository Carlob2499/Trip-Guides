# HANDOFF archive — superseded snapshots and re-prompts

> **Truncated 2026-08-15** (owner ruling): only the three most recent snapshots stay in the
> working tree. Every older one is in git — `git log -- docs/archive/HANDOFF_ARCHIVE.md`
> walks the history, and `git show a79d194:docs/archive/HANDOFF_ARCHIVE.md` prints the full
> 2,080-line file as it stood. Newest first, verbatim.
>
> Moved out of `docs/handoff.md` 2026-08-03 to keep it a handoff, not a chronicle
> (the ~80-line budget its own header sets is gated by
> `scripts/__tests__/docs-integrity.test.mjs`). The session-end ritual still appends here.


## Snapshot (2026-08-20 — FINAL integration-hardening pass on PR #68, R1–R13)

The deterministic pre-Codex hardening pass closed thirteen requirements on the PR branch, each
behaviorally tested. Authority: only the trusted /new flow mints auto intent — new-guide.yml
now CALLS research-pass-v2.yml (workflow_call; the called run carries the caller's "issues"
event), and `deriveLandIntent` refuses `workflow_dispatch` outright, so a manual dispatch on
main with the selector live is still a pr run. Recovery: `finalize-landing` now PROVES the
merge against GitHub (state/base/head/mergedAt via `landing-truth.mjs`), records GitHub's own
mergedAt, refuses open/unmerged/unrelated/mismatched PRs, and must push to the remote default
branch or fail (`finalizeLandingRecovery`, tested against a real bare origin). Fresh runs:
`resetFreshRunWorkspace` strips the prior run's mutable artifacts from a fresh branch and the
recorded baseline, proven with the REAL Pass-B verifier. One active-generation resolver
(`src/lib/run-generation.mjs`) now serves answers routing AND the Progress gateway (run state,
questions, events) — stale V2 never outranks active V1, dual-active is an explicit conflict.
Progress keys "Published" on the RUN's own publication (Run B never inherits Run A's), and
renders landing failed/draft truthfully (gate PASS survives; "Landing failed"/"Awaiting
review"). Late answers extend the exhausted cap by a bounded reopen grant. The land crash
handler no longer rewrites a passed gate or resurrects merged branches; the conflict fallback
restores `draft:true`; announced survives retries; HANDOFF_ARCHIVE re-normalized to LF. New
suites: pipeline-v2-hardening, run-generation, pipeline-v2-lifecycle-proof (the full A→B
deterministic lifecycle). Record: IMPLEMENTATION_STATE "Final integration-hardening pass".

## Snapshot (2026-08-20 — Release-candidate correction pass on PR #68)

The integration pass's INTEGRATION_YELLOW understated real product-path defects; the
correction pass reproduced, fixed and scar-tested every one ON the PR branch (no
direct-to-main commits). The big four: (1) publication was recorded BEFORE the merge — now a
two-phase landing transaction (gate verdict pre-merge; `finalizeMergedLanding` writes
published only after gh CONFIRMS the merge, on main, idempotently; the schema refuses
published without a merged outcome); (2) the `land` workflow input was an auto-publish
side-door — REMOVED, intent now derived (default-branch ref + selector) and re-checked at
landing time, land CLI defaults to pr and refuses escalation; (3) V1 rollback could mutate or
display historical V2 state — landing keys on exact branch identity, Progress and answers
routing read active branches before main history, dual-active refuses; (4) a fresh branch over
merged history silently resumed the terminal run — fresh-run semantics (new runId, prior run
archived to previousRuns). Also: run-scoped telemetry (runId-stamped events, identity join in
the UI), safety-notice permission + announce=ok/failed contract, post-merge questions fetch,
late-answer reopen (reconcile+critic re-open), exact question-ID dedup + truthful copy, one
landingMode implementation, floors removed repo-wide (CONFLICTING_SPEC resolved per the
2026-08-17 decision), scorecard human rows now advisory. Full record: IMPLEMENTATION_STATE
"Release-candidate correction pass".

## Snapshot (2026-08-20 — Integration week I01–I06 executed; draft PR #67-adjacent integration PR up)

Carlo directed "merge PR #63 and re-run the mission" — the P13 go made operationally. PR #63
squash-merged as `be9c535`; branch `fable/pipeline-v2-integration` carries I01–I06. Delivered:
durable `issue` + immutable `landMode` in run.v2.json (resumes inherit both; escalation/strip
refused); deterministic `land-mode` decision + `recordProductLanding` (pre-merge record, fails
closed on incomplete); questions job (always(), dedup); Progress reads real events with a main
fallback for merged runs. **Two live defects found+fixed on main:** `/new` scaffold lost its
issue (`get("issue")`/ISSUE_NUM seam — `062d3ad`) and change.yml's answers re-dispatch 403
(missing `actions: write` — `2d39b2c`); the M6 answers path had NEVER run live before.
**Andorra fixture (#64) proved the lifecycle live:** selector OFF→V1 / ON→V2-from-main /
restored→V1; issue threading; interruption after passA → resume skipped it; reconcile failed
offline verify twice and the 1B feedback retry converged (7→6→0); geocode+critic+land green;
`landing mode pr` → real gate exit 0 → **draft PR #67, published:false, deployedLive:null,
attempts 5/5**. Full gates green. Evidence: IMPLEMENTATION_STATE "Integration week session".

