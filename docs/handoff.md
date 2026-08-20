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

## Where we left off

**PR #68 (fable/pipeline-v2-integration → main) is READY_FOR_CODEX_REVIEW — do not merge it
from a session.** Verdict PREMERGE_CODE_GREEN / INTEGRATION_YELLOW: zero known code blockers;
the only remaining gaps are live-only by construction — the default-branch product auto-merge
(needs this code ON main + selector ON) and the Worker /answer hop (no owner key in sessions).
First post-merge action: one selector-ON /new canary observing the two-phase landing + safety
notice live. Selector ABSENT (verified; untouched this pass). V1 present + dispatchable, now
with the rollback matrix tested. Cleanup: andorra fixture REMOVED on the branch (merge removes
it from main); PR #67 closed as marked test evidence (its branch research-v2/andorra stays for
review, then dies in post-merge cleanup); P10–P13 evidence (PR #61, canary/kansai-proof,
research-v2/kansai-proof, probe/environ, stray environ-probe workflow id 338376924) untouched
pending sign-off. Full suite 165 files / 2,7xx green + build/lint/typecheck — exact counts in
PR #68's correction report.
