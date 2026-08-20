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

## Snapshot (2026-08-20 — P13 independent review: **P13_GREEN** on PR #63 head `88d16fe`)

The P13 go/no-go review ran fully independently — every P12.1 claim re-verified from primary
evidence, none accepted on faith. **Gap 1 re-verified:** the `probe/environ` workflow at
`c12d736` was read line-by-line and its container digest / CLI `@2.1.233` /
`--safe-mode --no-session-persistence` / `WP_TOOLS` / `WP_DENY` confirmed byte-identical to the
PR's Pass A agent step; the scorer's semantics (success ⇒ breach, refusal ⇒ INCONCLUSIVE, PASS
only on attempted+denied for all three tools) confirmed in source; the raw log of run
`32348279562` / job `96361626055` shows all three DENIED lines and no SUCCEEDED/NOT-ATTEMPTED
line. **Gap 2 re-verified:** the transport fixture was read in full and all four cited URLs
re-fetched this review — japan-guide e4904 and the three Nankai pages each support exactly the
SUPPORTS lines (incl. the twice-stated walking prohibition and rapi:t "34 minutes the fastest");
the seven negative controls trace to distinct rule paths in `research-rules.mjs`; targeted
suite 11/11. **Gates rerun on `88d16fe`: all green** (build 9 pages · lint 0/0 · typecheck
0 errors · **163 files, 2651 passed + 1 todo**). Invariants held: no repo variable set, PR #61
open/draft, canary + probe branches present, `PLACES_API_KEY` confined to non-agent steps.
Verdict recorded in `docs/pipeline v2/IMPLEMENTATION_STATE.md` → "P13 independent go/no-go
review" and the tracker's P13 row. Nothing merged, published, cut over, or deleted.

## Where we left off

**P13_GREEN returned — the core engine is proven in isolation; the decision now sits with
Carlo.** Per the tracker P13 row ("Yes — Carlo accepts go/no-go"), the verdict is a
recommendation until Carlo accepts it. On acceptance, integration week I01+ begins: connect
`/new` dispatch to the proven V2 path behind a safe cutover plan (I01), then the full
end-to-end publish-boundary proof (I02–I05).

**Until acceptance, nothing moves:** do not merge PR #63 or #61, set `WAYPOINT_RESEARCH_ENGINE`,
publish the canary, or delete V1 / `canary/kansai-proof` / `research-v2/kansai-proof` /
`probe/environ`. Cutover stays OFF (variable unset ⇒ /new dispatches V1). Known non-blockers
deferred to I01/I02 by prior ruling: live Worker answer routing, `/new` V2 notification
threading, `GOOGLE_ROUTES_KEY` unset, seven honest unresolved geocodes, Progress-UI manual
proof. Main's stale `WAYPOINT_V2_ON_DEFAULT` stub comment stays LOW / moot-at-merge.
