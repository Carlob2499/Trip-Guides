# HANDOFF archive — superseded snapshots and re-prompts

> **Truncated 2026-08-15** (owner ruling): only the three most recent snapshots stay in the
> working tree. Every older one is in git — `git log -- docs/archive/HANDOFF_ARCHIVE.md`
> walks the history, and `git show a79d194:docs/archive/HANDOFF_ARCHIVE.md` prints the full
> 2,080-line file as it stood. Newest first, verbatim.
>
> Moved out of `docs/handoff.md` 2026-08-03 to keep it a handoff, not a chronicle
> (the ~80-line budget its own header sets is gated by
> `scripts/__tests__/docs-integrity.test.mjs`). The session-end ritual still appends here.


## Snapshot (2026-08-22 — V2 reliability repair: PR #75 built, reviewed three times, merged)

Portugal (Canary #3, #74, run `portugal-20260822-7c041e`) died three ways at once and the
workflow reported none of them: the headless reconcile printed `You've hit your session limit`
and exited nonzero while `docker run … | tee` reported tee's zero, so the step went GREEN; the
partial workspace was then verified into a misleading content-gate story; and nothing retried,
because the retry gate read one ephemeral step output (`void == 'true'`) that a deterministic
gate failure never sets. Codex had already pushed exit-integrity + bounded-warm-start work to
`fix/v2-reliability-hardening`; this session verified it (9/9 green, nothing rewritten) and
finished the runtime/orchestration half.

Landed on main as `253607a` (PR #75, 12 commits, 15 files): all four agent invocations run
through `scripts/run-logged-command.sh`; collect/verify is gated on the agent having returned
cleanly; failure classes now name a PLANE (`finish-stage` can say `void-run`/`gate-failure` and
never `agent-failure`; the process plane is classified once in `scripts/pipeline/v2/
recovery.mjs` from the step conclusion plus the CLI's own diagnostic); retry eligibility is read
from `run.v2.json` (auto-retryable class + actionable findings for the same runId/stage + both
budgets); a run that will not repair itself escalates visibly. **Caps untouched (5 attempts, 1
auto-retry) — the defect was routing, not budget.**

Three Codex review rounds, all closed: **B1** the four stage jobs' own `permissions:` blocks
omitted `issues`, which GitHub resolves to `none`, so the escalation's `gh issue comment` would
have 403'd in exactly the path it exists to make visible; **B2** an *eligible* repair whose
`gh workflow run` failed left `allowed=true`, skipping the stop while the reservation was
already spent; **B3** `failure()` and `cancelled()` are disjoint, so a cancelled run recorded
`cancelled` and then skipped both the retry decision and the escalation. Method scar worth
keeping: the first B1 regression **passed with its own fix deleted** — it was substring-matching
the explanatory comment, which contained `issues: write`. Every workflow guard since is verified
by reverting its fix and watching it go red.

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
