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

## Snapshot (2026-08-20 — Pipeline V2 finalization: canary GREEN, census clean, cutover switch built)

The Fable finalization session fixed all four Core Proof blockers (generated machine-contract
capsule · durable per-stage retry feedback · V2 coverage consumed by the real verifier ·
deterministic geocoding in-pipeline), added source-access classes with a proxy refusal, per-attempt
retry telemetry, and a truthful Progress event emitter. The V2 workflow was registered via an inert
main stub (PR #59, the one authorized early merge) and the REAL pipeline ran end-to-end on GitHub
Actions: Pass A → Pass B → Reconcile → geocode → Critic → **draft PR #61**, landing gate PASSED
honestly (build + networked verify, 0 dead links), guide still `draft: true`, publication false.
Eleven dispatches; every failure deterministic, regression-tested, and resumed at the failed stage
— including a real usage-limit interruption and two live trips of the attempt-cap breaker (stuck
issues #60/#62, resolved by documented operator resets). The repository-wide legacy census found
ZERO dead code files; its five findings (template blurbs, motion.md rows, a silo deep-import, an
archived build prompt, three dead labels) are all resolved — `docs/LEGACY_ERADICATION.md` is the
ledger. `/new` now carries the cutover switch: `WAYPOINT_RESEARCH_ENGINE=v2` routes to V2; unset
means V1, unconditionally. An independent code review of the session's diff found one HIGH (clean
first-try runs crashed their completion checkpoint on the absent feedback pathspec), one MEDIUM
(comma-hostname injection into the critic's --allowedTools) and one LOW — all fixed same-session
with pinning tests. Durable record: `docs/pipeline v2/IMPLEMENTATION_STATE.md` (18-point proof).

## Where we left off

**Branch `fable/pipeline-v2-finalize`; the finalization draft PR to main is the handoff point.**
All gates green (build · lint · typecheck · 2,637 tests). Canary evidence: runs
32305376180→32328254329, draft PR #61 (never merge it — test data), stuck issues #60/#62 closed
with rationale.

**Next: independent Codex review (tracker P11), then Carlo's go/no-go (P13).** Cutover stays OFF
(`WAYPOINT_RESEARCH_ENGINE` unset ⇒ /new dispatches V1). Do not merge the finalization PR, set the
cutover variable, publish the canary, or delete V1 until review acceptance. After acceptance:
delete the canary branches (`canary/kansai-proof`, `research-v2/kansai-proof`), close PR #61
unmerged, and remove the kansai-proof scaffold/destination copies with them.
