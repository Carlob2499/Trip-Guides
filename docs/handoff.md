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

## Snapshot (2026-08-20 — Codex re-review corrections on PR #68: 3 blockers + recovery truth)

Codex's independent re-review of the R1–R13 head confirmed four remaining defects; all four are
fixed on the branch with real-seam behavioral proofs (new suite
`pipeline-v2-release-blockers.test.mjs`: real git repos + bare origins, gh mocked only at the
process seam). (1) Answers routing resolves ACTIVE research ownership BEFORE historical slug
publication — `resolveAnswerRouting` (questions.mjs, injectable) inspects both branch
namespaces unconditionally, so a published Run A never steals active Run B's answer;
`routeAnswers` precedence flipped to match. (2) `verifyMergedPr` now proves the RUN, not the
branch name: GitHub must name the merge commit, and its tree's own `run.v2.json` must carry the
`expectedRunId` (mandatory) — Run A's old merged PR can no longer finalize Run B on the reused
branch. (3) The landing transaction moved to `scripts/pipeline/landing.mjs` (`executeLanding`)
with `quarantineRemoteBranch`: EVERY non-merged auto landing restores `draft:true` and pushes
it to origin (conflict fallback AND hard failure); an unpushable restore is a BLOCKED landing —
failed, exit 1, never "safely draft". (4) `finalize-landing` announcement truth fails closed:
no durable fact + no `--announced ok|failed|skipped` = refusal; the printed retry command
always carries the flag. A 12-step FINAL test walks publish-A → research-B → real routing →
quarantine → merge → refuse-A's-PR → recover-with-B's-PR → B published. Records:
IMPLEMENTATION_STATE "Codex re-review corrections" + a new CONTEXT decision.

## Where we left off

**PR #68 (fable/pipeline-v2-integration → main) is back to READY_FOR_CODEX_REVIEW — do not
merge it from a session, do not set the selector, do not run the live canary.** The four
Codex defects (answers-route precedence, run-identity finalization proof, remote quarantine
invariant, announcement fail-closed) are fixed and behaviorally proven; the PR body's
acceptance matrix has one row per defect with the exact proving tests. Full gates re-run green
on the final tree. Live-only proofs unchanged (product auto-merge via real /new; Worker
/answer hop). Selector ABSENT (untouched this pass). V1 present + dispatchable. Cleanup queue
unchanged: PR #67 closed as evidence; andorra removed on the branch; P10–P13 evidence
untouched pending sign-off.
