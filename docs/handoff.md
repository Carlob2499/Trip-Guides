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
  Lint and typecheck are not optional.
- North stars: `docs/reference/pipeline.md` (generation/maintenance) · `docs/reference/motion.md`
  (presentation/motion) · `docs/standards/guide-rubric.md` (quality bar) ·
  `docs/evidence/competitive-landscape.md` (market parity reference) ·
  `docs/design-handoff/` + its `enforcement/` (the design system's own authority — read BOTH
  before any hub/guide visual work).
- **No live design work order.** PLAN_PIPELINE_SURFACES and the prior design plans are complete
  and indexed in `docs/archive/INDEX.md`; their durable rules live in the reference documents.
- **Implementation coordination:** Codex scopes and independently reviews bounded packages;
  Claude Code implements them. `docs/reference/decision-register.md`,
  `implementation-roadmap.md`, and `run-metrics.md` — not chat memory — bridge the two.

## Open items

- **§B4 blocked on project access**, not tool access (`DesignSync` works from a main session;
  this login's `list_projects` does not show the right one) — do not retry until it does.
- **Held, not open:** the route-order picker's home (Tools station vs. itinerary mount) needs
  both surfaces reviewed together.
- The gap block and "no cover" plate have never rendered on a real guide, by design (CONTEXT.md
  §H3) — proof-of-life is an isolated test fixture, not a staged guide edit.
- `/about/` + `/new/` are not in the SW precache shell; the cover overlay does not trap focus;
  Cloudflare dashboard Git integration still fails 0s builds.
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.
- The remote branch list is clean (`main` only). Five obsolete remote labels remain as manual
  housekeeping: `graduate-request`, `graduate-approved`, `modify-approved`, `revision-approved`,
  and `token-canary`. None is recreated by `ensure-labels.yml`; delete only after explicit owner
  approval.
- Package 1 is doctrine alignment. Keep the four research roles during this package; adaptive
  native escalation, two evidence lanes, reservation/concierge depth, Worth the Effort output,
  fragile transit, and stop reasons are the bounded scope. Do not start issue #56 in isolation.

## Snapshot (2026-08-17 — Set 1 alignment contract complete locally)

**The local branch now includes the creator's `18020d4` baseline.** The Codex/Claude instruction
trees, existing cleanup edits, and current pipeline/UI audit are reconciled without a conflict.

**The durable bridge now exists.** `decision-register.md` records the earlier product contract and
R1–R61, honestly marking R23 and unanswered R42–R48 provisional. `implementation-roadmap.md`
defines the freeze sequence and model routing. `run-metrics.md` defines truthful
Intake-to-Finished stage, token, time, attempt, gate, and cost measurement.

**No pipeline or UI behavior changed in Set 1.** The next bounded implementation is Package 1
doctrine alignment, followed by truthful run state/metrics. Research and engineering still freeze
September 30; UI finalization remains October 1–7.

## Where we left off

**Local branch `cleanup/pre-implementation` contains the corrected issue forms, refreshed handoff,
and Set 1 reference contracts.** It is not committed or pushed.

**Next:** review and land Set 1, then hand Package 1 from `implementation-roadmap.md` to Claude
Opus 5 at high effort for the doctrine-heavy first pass. Codex GPT-5.6 Sol at high effort performs
the independent review; routine fixes and verification return to Sonnet.
