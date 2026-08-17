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

## Snapshot (2026-08-17 — Pipeline V2 implementation adversarially audited and hardened)

Fable's M0–M8 implementation was reviewed from fixed base `9f1599b` by independent code,
specification, and security lanes, then corrected to convergence. The durable technical record
is `docs/pipeline v2/IMPLEMENTATION_STATE.md`. Delivery timeline:
`docs/pipeline v2/IMPLEMENTATION_PLAN.md` — Claude must read and follow it for sequencing,
kill dates, freezes, and Codex/Fable roles.

V2 remains manual, draft-only, and beside V1. Agents now execute in pinned Docker/Claude CLI
boundaries with workspace-only filesystem tools, explicit system-path denials, no host token,
no runner command files, no git remote/history, and canonical path-scoped artifact collection.
Pass B remains baseline-isolated; critic source fetches are restricted to pre-verified domains.
Run scope/model settings are durable across resumes; usage/void retries are bounded; stuck state
cannot reset itself; malformed artifacts/state fail closed; intake coverage is relational and
includes constraints, traveler count, and departure airport; the real landing gate is durable
and is the only event that clears the UI's Verify station.

V1's numeric breadth safeguards remain intact only for V1. V2 explicitly selects adaptive mode,
where the typed earned-saturation gate replaces quotas while structural anti-padding checks stay.
Critic findings now produce validated, provenance-complete newest-first process-memory rows.
Answers route atomically back to active or complete-unmerged research branches with the original
run inputs. Public issue spend and short owner keys fail closed.

## Where we left off

**Branch `codex/pipeline-v2`; final audited commit is the handoff point.** Local gates are green:
all workflow YAML parses; build, lint, typecheck and full tests pass; targeted V2/progress suites
pass; production preview was checked desktop plus 375px dark/reduced-motion with no overflow or
browser errors; compiled output carries `landingGate` and no synthetic live-publication copy.

**Next: the Phase 1 manual canary in IMPLEMENTATION_PLAN — not cutover.** First canary must prove
the live Docker permission denial (`Read /proc/self/environ`), cancellation/resume, configured
Places/Routes gate, draft-PR-only landing, Worker answer routing, and branch protection. Do not
merge V2 to main, switch `/new`, publish, delete V1, or begin the secondary UI/UX pass until its
timeline gate explicitly allows it.
