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

## Where we left off

**The draft integration PR (fable/pipeline-v2-integration → main) awaits independent Codex
review — do not merge it here.** Verdict INTEGRATION_YELLOW for exactly one recorded gap: the
live product-mode auto-merge is unprovable pre-merge (branch-ref dispatch would side-door the
integration code into main). First post-merge action: one selector-ON `/new` canary observed
end-to-end. Selector restored to ABSENT and verified. V1 present + dispatchable. Evidence kept
for review: intake #64 (closed), branch `research-v2/andorra`, draft PR #67, andorra scaffold
on main (draft-quarantined) — remove after review. Routing fixtures (san-marino,
liechtenstein) already cleaned; stub branches deleted. Pre-existing canary artifacts (PR #61,
`canary/kansai-proof`, `research-v2/kansai-proof`, `probe/environ`, stray `environ-probe`
workflow id 338376924) untouched — P10–P13 evidence, their cleanup is a post-acceptance call.
