# HANDOFF — the warm-start context

> **Ritual (binding):** this file auto-loads at session start via the SessionStart hook
> (`scripts/handoff-head.mjs`) — do not Read it again. Greet the creator with the
> **"Where we left off"** line below and the recommended next step. At SESSION END, rewrite
> the Snapshot + Where-we-left-off sections, move the PREVIOUS snapshot to
> `docs/archive/HANDOFF_ARCHIVE.md`, and commit. The ≤120-line budget is gated by
> `scripts/__tests__/docs-integrity.test.mjs`; deep context lives in the north-star docs.

## Operating rules (stable — rarely change)

- **Model economy:** research/recert/fact edits + mechanical builds run on **Sonnet**; **Opus**
  for design sessions and judgment/first-run-triage work. Remind the creator to
  `/model`-switch at session start.
- **Never number guides as milestones** — the product is the backbone; a new guide is the
  backbone exercising.
- Ship loop on every change: build → **lint** → **typecheck** → test → `astro preview` :4322 →
  grep `dist/` → commit → push (this branch — `verify-live` guards every deploy to `main`).
  Lint and typecheck are not optional: CI runs all three and session #20 pushed red twice by
  treating build+test as the whole gate.
- North stars: `docs/reference/pipeline.md` (generation/maintenance) · `docs/reference/motion.md`
  (presentation/motion) · `docs/standards/guide-rubric.md` (quality bar) ·
  `docs/evidence/competitive-landscape.md` (market parity reference) ·
  `docs/design-handoff/` + its `enforcement/` (the design system's own authority — read BOTH
  before any hub/guide visual work). PLAN_DESIGN_RECONCILIATION and PLAN_ATLAS_MIGRATION are both
  fully ticked and archived (`docs/archive/INDEX.md` → `git show` line).
- **No live design work order.** PLAN_PIPELINE_SURFACES joined the other three in
  `docs/archive/INDEX.md` on 2026-08-16 — its bundle deleted, its durable half folded into
  `docs/reference/pipeline.md` and `motion.md`.

## Open items

- **§B4 blocked on project access**, not tool access (`DesignSync` works from a main session;
  this login's `list_projects` doesn't show the right one) — don't retry until it does.
- **Held, not open:** the route-order picker's home (Tools station vs. itinerary mount) — needs both surfaces reviewed together.
- The gap block and "no cover" plate have never rendered on a real guide, by design (CONTEXT.md
  §H3) — proof-of-life is an isolated test fixture, not a staged guide edit.
- `/about/` + `/new/` not in the SW precache shell; cover overlay does not trap focus; Cloudflare dashboard Git integration still failing 0s builds.
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.
- **ALL FOUR remote branches are now safe to delete — and none can be deleted from a container
  session.** `pipeline-changes-plan-752kra`, `a11y-landmark-fix-v2` and `recert/japan` are merged
  into main; `claude/design-fixes-continuation-wi920k` is **superseded, never to be merged** — it
  carries the same a11y commit in an older/smaller form plus doc state main moved past, so merging
  it would restore PLAN_DESIGN_RECONCILIATION (now indexed, not stored) and revert `handoff.md`.
  Every delete route
  is closed here: `git push --delete` 403s at the egress proxy, the REST API 403s ("GitHub access
  is not enabled for this session"), the GitHub MCP surface has `create_branch` but no delete, and
  `merge_pull_request` takes no delete-branch flag. One pass at
  github.com/Carlob2499/Trip-Guides/branches clears all four.

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

## Where we left off

**PR #68 (fable/pipeline-v2-integration → main) is READY_FOR_CODEX_REVIEW — do not merge it
from a session, do not set the selector, do not run the live canary.** All thirteen hardening
requirements fixed and behaviorally proven; full suite 168 files / 2,776 tests green + build + lint
+ typecheck + axe a11y (55/55). The only remaining proofs are live-only by construction: the
default-branch product auto-merge via a real /new (needs this code ON main + selector ON,
observing the workflow_call provenance end-to-end), and the Worker /answer hop (no owner key
in sessions). First post-merge action: one selector-ON /new canary observing the two-phase
landing + safety notice + trusted-invocation authority live. Selector ABSENT (untouched this
pass). V1 present + dispatchable. Cleanup queue unchanged: PR #67 closed as evidence;
andorra removed on the branch; P10–P13 evidence untouched pending sign-off.
