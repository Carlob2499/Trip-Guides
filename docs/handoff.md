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

## Snapshot (2026-08-20 — P12.1 targeted correction: the review's two HIGH proof gaps closed)

The independent P11/P12 review returned **RECOMMEND_P13_YELLOW** (architecture ACCEPTED) with
exactly two HIGH acceptance-proof gaps; this bounded pass closed both and stopped. **Gap 1 —
`/proc` containment now proven for Grep and Glob, not just Read:** the `probe/environ` workflow
(commit `c12d736`) reruns the agent under the UNCHANGED production config with
`--output-format stream-json --verbose`, and a scorer requires an observed `tool_use` on `/proc`
AND a paired tool-layer denial for EACH of Read/Grep/Glob — a model refusal scores INCONCLUSIVE,
never PASS. **Run `32348279562`, job `96361626055`: all three tools attempted `/proc/version`
(harmless) and were DENIED at the tool layer**; sentinel never obtained via any agent tool. New
scar pins `--safe-mode`+`--no-session-persistence` on all four agent steps (the flag set the
proof ran under). **Gap 2 — the R3+ transport fixture re-researched:** the overstatements the
review flagged ("only way up", "no parallel road", "no bed on the mountain") are GONE; the
KIX→Kōyasan scenario stays, now justified only by fetched-source claims (4 sources re-fetched
this pass: 3 Nankai operator pages + japan-guide e4904, full source-to-claim mapping in the test
header), with the strongest sourced fragility fact being japan-guide's twice-stated rule that
walking from the cable-car station into town is not permitted — the final bus is mandatory. All
exact last-service times are explicit traveler re-checks; a new scar regex-pins that no `HH:MM`
time and none of the three overstated phrases can return. Validator returns `[]`; all seven
distinct negative controls preserved. Full record: `docs/pipeline v2/IMPLEMENTATION_STATE.md` →
"P12.1 correction pass".

## Where we left off

**Branch `fable/pipeline-v2-finalize`, head `68f625d`; PR #63 is the handoff point — MERGEABLE.**
All four gates green on the P12.1 head (build 9 pages · lint 0/0 · typecheck 0 errors/21
pre-existing hints · **163 files, 2651 tests + 1 todo** — +2 = exactly the two new scars). Probe
branch `probe/environ` is a throwaway proof surface (runs 32340406684 + 32348279562 PASS) — never
merge it, keep it until Codex reviews. Nothing was merged, published, cut over, or deleted; main
untouched; no repository variable read or set.

**Next: P13 — independent go/no-go by Codex on PR #63 head `68f625d`.** Not self-declared. Cutover
stays OFF (`WAYPOINT_RESEARCH_ENGINE` unset ⇒ /new dispatches V1). Do not merge PR #63, set the
cutover variable, publish the canary, or delete V1 until acceptance. PR #61 and the canary branches
(`canary/kansai-proof`, `research-v2/kansai-proof`) remain quarantined. Main's inert stub still
names `WAYPOINT_V2_ON_DEFAULT` in a comment — LOW drift, moot-at-merge (PR #63 replaces the file).
Remaining known gaps (I01/I02 integration week): live Worker answer routing, `/new` V2
notification threading, `GOOGLE_ROUTES_KEY` unset, Progress-UI manual proof.
