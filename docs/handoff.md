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
- **Two GitHub issue templates still promise a dead label.** `.github/ISSUE_TEMPLATE/
  modify-guide.yml` and `revise-guide.yml` tell the filer that nothing runs "until the owner
  applies `modify-approved` / `revision-approved`" — those labels stopped doing anything when the
  owner key replaced them, yet still exist on the remote (`gh label list`) because only
  `ensure-labels.yml` was updated. Live copy instructing a real person to do a no-op; found during
  the Commit E sweep, left alone as out of that commit's scope.
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

## Snapshot (2026-08-16 — PLAN_PIPELINE_SURFACES executed end to end; the bundle is retired)

**Five commits on `design/pipeline-surfaces`, each through the full ship loop.** The progress
cockpit with its frame-by-frame route map (`0d6aae0`), the intake preflight checklist (`f9b333a`),
the change-request requester view (`544cc95`), the owner triage queue at `/progress/triage/`
(`63a63ff`), and this retirement. The plan's one deferred fork closed on the way (`e119f2a` — the
hub now stamps a guide that is BUILDING, deliberately not the `ongoing` "trip happening now"
class).

**Three things the design asked for were NOT built, on purpose, and each is recorded as a
Decision in CONTEXT.md.** Triage's Quick fix / Full re-check go through the owner-keyed Worker
rather than the deleted `*-approved` labels; the feedback-proposals panel moved off `/progress/`
into triage; and the live-event panels (sources · decisions · nuggets · counters) ship with the
full layout and honestly empty boxes, because nothing in the pipeline emits per-event data yet.
Emission is issue **#56** — the gateway, types, mocks and tests are already there for it to drop
into. The bundle's "Watch a demo run" button was never built for the same reason.

**Retirement, per the bundle's own instructions.** `design_handoff_pipeline_and_intake/` (39
files) and `PLAN_PIPELINE_SURFACES.md` are DELETED, not moved — an inline-styled prototype drifts
from the implementation within a release. What survives: one section in
`docs/reference/pipeline.md` (note-panel colours · the stalled-run rule · the route map's
frame-by-frame requirement), eight rows in `docs/reference/motion.md`'s inventory, and a closure
entry in `docs/archive/INDEX.md` carrying the `git show` paths to both. Four code comments that
cited the plan by filename now cite the archive heading instead.

## Where we left off

**This commit is LOCAL and unpushed — deliberately.** The creator verifies it, pushes, and opens
the single PR for the whole branch (title: `feat: pipeline surfaces — progress cockpit, intake
checklist, change + triage`). Everything before it is already pushed.

**All gates green, and lint is now genuinely clean.** Build 9 pages · lint 0 (the 176 errors this
file used to carry were all in the deleted bundle's `support.js`, so they left with it) ·
typecheck 0 errors / 19 hints · 2400 tests + 1 todo across 155 files · coverage gate passes ·
`/progress/`, `/progress/triage/`, `/change/` and `/new/` re-checked in `astro preview` after the
deletion · dist grep clean of every prototype string.

**Next after the PR merges:** nothing is queued. Issue #56 (pipeline run events) is the natural
follow-on and is fully specced; the two stale issue templates in Open items are a smaller,
unrelated fix.
