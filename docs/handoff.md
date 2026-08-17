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

## Snapshot (2026-08-17 — Pipeline V2 backend implemented end to end, M0–M8 on `codex/pipeline-v2`)

**Eight milestones, one commit each, all pushed.** `docs/pipeline v2/IMPLEMENTATION_STATE.md`
is the durable per-milestone record (baseline → publication-safety fixes → fail-closed V2
contracts → adaptive doctrine → job-per-stage V2 workflow with mechanical Pass-B isolation →
research rules → lifecycle correctness → honest progress adapters). Authority chain honored:
DECISIONS.md → FABLE_IMPLEMENTATION_PROMPT.md → repo behavior.

**What V1 gained immediately (shared code):** landing now runs the REAL evidence gate (build +
networked verify — it ran verify alone and asserted the pass); compose/integrity/artifacts run
BEFORE landing and downgrade it to a draft PR; the contradiction preflight commits the ledger
it writes (was intake.md — findings were lost with the runner); change attempts are run-scoped
(3 successful runs no longer trip the breaker for the 4th); research+change share one
`guide-<slug>` concurrency group; mid-run answers route onto the active research branch's
ledger; pretrip watches `change/<slug>-*` (the dead `recert/<slug>` check detected nothing);
recert partial-dispatch failures exit red.

**What V2 adds beside V1 (manual, draft-only):** `research-pass-v2.yml` (job-per-stage; Pass B
runs in a baseline checkout that mechanically excludes Pass A; the critic gets depth-1 history
and a working tree stripped of evidence/run-state; the workflow — never the agent — validates,
commits and checkpoints every stage; one bounded void auto-retry; landing is ALWAYS a draft
PR). Contracts under `scripts/pipeline/v2/` fail closed (`wp-run/2.0` · `wp-evidence/2.0` ·
`wp-coverage/2.0` · telemetry with honest nulls). Quota floors are GONE repo-wide — the earned
saturation stop replaced them (DECISIONS "Research breadth").

## Where we left off

**Branch `codex/pipeline-v2`, all gates green, everything pushed.** Build 9 pages · lint 0 ·
typecheck 0 errors/19 hints · 165 test files, 2566 + 1 todo · offline verify PASS on both
published guides with legacy `n/a` rows intact · preview checked at 375px + desktop + dark ·
dist grep clean (old "live on the site" label gone; V2 adapters compiled in).

**Codex reviews next — do NOT merge to main, switch dispatch, publish, or delete V1.** The
final-handoff section of IMPLEMENTATION_STATE.md carries the manual canary command, required
secrets, and every unverified external boundary (Actions dispatch paths, gh/worker calls, the
claude-code-action jobs — none exercised from here).
