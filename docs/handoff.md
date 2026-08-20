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

## Snapshot (2026-08-20 — P12 finalization: PR #63 merge-ready, CodeQL clean, /proc + R3 proven)

The Fable P12 pass made PR #63 (`fable/pipeline-v2-finalize` → main) genuinely reviewable and
boring. **Merge conflict resolved** — merged current main (`8a591e8`); the only conflict was main's
whitespace nudge vs. the full V2 workflow, resolved `--ours`; PR #63 is now `MERGEABLE`, 0 behind,
all four `docker run` agent steps + the default-branch dispatch guard intact, `/new` still V1 when
the cutover var is unset. **4 CodeQL findings fixed at one root cause** — all traced to a single
test-code regex (`pipeline-v2-finalize.test.mjs`) with incomplete dot-only escaping; `isProxyHost`
matches by exact string comparison (never a regex) so the runtime deny set never changed; full
metacharacter escape added + a lookalike/suffix-attack regression test; **CodeQL PR-head re-scan
PASS, 0 open alerts**. **`/proc/self/environ` denial PROVEN live** — a push-triggered probe on the
throwaway `probe/environ` branch, replicating the exact production agent config, showed the Read
tool BLOCKED on the benign `/proc/version` (`CHECK1_BLOCKED` — the `Read(//proc/**)` rule is
effective across the subtree, so environ is denied) while the model independently refused environ
as a secret (defense in depth); sentinel never leaked. **Run `32340406684`, job `96338191848`.**
**R3+ transport PROVEN** — a controlled KIX→Kōyasan fragile-transfer artifact (single-mode mountain
access, overnight cable-car cutoff, missed connection = no bed), sourced from two pages fetched this
pass, is schema-valid and accepted by the real `researchRuleProblems`; seven negative controls prove
the acceptance is earned. Full P12 record: `docs/pipeline v2/IMPLEMENTATION_STATE.md` → "P12
finalization".

## Where we left off

**Branch `fable/pipeline-v2-finalize`, head `61816fe`; PR #63 is the handoff point — MERGEABLE,
CodeQL clean.** All four gates green on the final head (build 9 pages · lint 0/0 · typecheck 0
errors/21 pre-existing hints · **163 files, 2649 tests + 1 todo**). Probe branch `probe/environ`
is a throwaway proof surface (run 32340406684 PASS) — never merge it. Nothing was merged, published,
cut over, or deleted this pass; main untouched.

**Next: P13 — independent go/no-go (reviewer / Carlo).** Not self-declared; recommendation is
GREEN. Cutover stays OFF (`WAYPOINT_RESEARCH_ENGINE` unset ⇒ /new dispatches V1). Do not merge
PR #63, set the cutover variable, publish the canary, or delete V1 until acceptance. PR #61 and the
canary branches (`canary/kansai-proof`, `research-v2/kansai-proof`) remain quarantined until then.
Remaining known gaps (I01/I02 integration week): live Worker answer routing, `/new` V2
notification threading, `GOOGLE_ROUTES_KEY` unset, Progress-UI manual proof.
