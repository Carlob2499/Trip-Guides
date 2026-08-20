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

## Snapshot (2026-08-20 — P13.1: premature GREEN retracted, R3 fixture bus-exclusivity fixed)

The first P13 review returned GREEN on `88d16fe` and was **retracted the same day**: Codex's
re-inspection caught that the P12.1 fixture rewrite had itself promoted the sourced walking
prohibition into **bus exclusivity** ("the bus is a required segment"; missed bus ⇒ automatic
failed same-night arrival) — while the fetched japan-guide page says Kōyasan Station "is a ten
minute **bus or taxi** ride from Koyasan's town center" (re-verified this pass). The review had
verified every SUPPORTS line affirmatively but never asked the source the adversarial question
— what does the page say that CONTRADICTS the framing — the lesson is recorded in §P13.1.
**The correction (one file, `pipeline-v2-transport-r3-proof.test.mjs`):** final leg reworded
everywhere to "motorized (bus or taxi)"; `missedConnection` made conditional (on-foot recovery
impossible is sourced; failure only IF the day's motorized options exhaust; taxi asserted
neither available nor unavailable); taxi recovery added to the REQUIRED RE-CHECK list;
`risk: 3` re-evaluated and honestly retained on the remaining fragility stack; mapping updated
(source 2 now DOES-NOT-PROVE bus exclusivity); new scar pins the exclusivity wording out.
Suite 12/12; validator returns `[]`; Gap-1 probe proof and all gate/invariant findings from the
retracted review still stand. Records: IMPLEMENTATION_STATE §P13 (retraction banner) + §P13.1.

## Where we left off

**P13 is pending again — Codex re-reviews the corrected head.** The verdict record, tracker
P13 row, and this fixture are the review surface; the ask to Codex is a fresh go/no-go on the
correction commit (diff vs `88d16fe` is the fixture fix + the retraction/correction docs).
On a sustained GREEN plus Carlo's acceptance, integration week I01+ begins.

**Until acceptance, nothing moves:** do not merge PR #63 or #61, set `WAYPOINT_RESEARCH_ENGINE`,
publish the canary, or delete V1 / `canary/kansai-proof` / `research-v2/kansai-proof` /
`probe/environ`. Cutover stays OFF (variable unset ⇒ /new dispatches V1). Known non-blockers
deferred to I01/I02 by prior ruling: live Worker answer routing, `/new` V2 notification
threading, `GOOGLE_ROUTES_KEY` unset, seven honest unresolved geocodes, Progress-UI manual
proof. Main's stale `WAYPOINT_V2_ON_DEFAULT` stub comment stays LOW / moot-at-merge.
