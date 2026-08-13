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
  **`docs/PLAN_DESIGN_RECONCILIATION.md`** is the live work order for design/theme work — its
  §A/§B/§C1/§C3 are ALL DONE now. §C is at §C4/§C5 (project sync, final polish walk), see below.
  `docs/archive/PLAN_ATLAS_MIGRATION.md` is fully ticked — history only.

## Snapshot (2026-08-13g — two arcs closed: §C3 print preview shipped, PLAN_EVIDENCE_FIRST done)

### §C3 — the budget sheet previews before it prints (issue #47)

Ship-loop-clean; rewritten 9-test `budget-sheet.spec.ts`. Built against the ACTUAL GitHub issue
(fetched via `issue_read` first) — the plan doc's `[data-fold]`/`[data-noprint]` language for this
row matched nothing in the ticket or the markup, so it was ignored rather than built to.

"Save summary as PDF" now opens a visible preview (`.bsp-modal`, reusing `.share-modal`'s pattern
and the shared `trapFocus`), built from the SAME `.bsheet` that later prints; only the preview's
Print button calls `window.print()`, synchronously in its own click, so the popup-blocker
constraint still holds. **The CSS restructure is the more interesting part:** `.bs-*` styling used
to live entirely inside `@media print`, so nothing could show it on screen even at
`display:block`. Now unconditional — screen and paper render identically because it is one
document. The Playwright suite encoded the pre-fix behaviour as correct and needed deliberate
rewriting, not just new assertions.

### PLAN_EVIDENCE_FIRST — complete, H1 at 12/12

A1 · B1–B4 · C1–C2 · D1–D3 · E1–E3 · F1–F2 · H1, each with a STATUS block in the plan. Two
rulings shaped it, both CONTEXT.md Decisions: **detection is decoupled from
`risk`/`evidence`/`tier`** (a corpus audit found ZERO rows carry any of them, so the gates as
specified would have fired on nothing, forever), and **warn-first** — findings BLOCK on drafts,
advise on published, making `graduate-guide.yml` the publication chokepoint.

**Real defects found on live guides, not fixtures:** five malformed values were reaching readers
(the swallowed characters were sentence punctuation, so the repair MOVED them into the prose);
`us`'s `budget-daily-costs-300` cites a page that does not contain 300 while three siblings from
that page verify; a real **Coconino National Forest closure order** (Jul 13–Sep 30 2026) covers
two trails that guide recommends, with no fact row to notice a rescission.

**The finding that shaped all of Phase E.** E1/E2/E3 were specified around `risk`/`evidence`/
`tier` — and a corpus audit found **zero rows carry any of them** (korea 83, denmark 27, us 10,
japan 25, fixture 25). Specified literally, all three would have fired on nothing, forever, since
the A1 fixture can never be re-annotated. Creator's ruling: **decouple detection** — every gate
works on the artifacts as they are, risk-keyed logic written but dormant until D2-generated guides
arrive. Second: **warn-first** — findings BLOCK on drafts, advise on published, making
`graduate-guide.yml` the publication chokepoint. Both are CONTEXT.md Decisions.

**Real defects found on live guides, not fixtures.** Five malformed values were rendering to
readers (fixed — the swallowed characters were load-bearing sentence punctuation, so the repair
MOVED them into the prose). `us`'s `budget-daily-costs-300` cites a page that does not contain
300 while its three siblings from that page verify. A real **Coconino National Forest closure
order** (Jul 13–Sep 30 2026) covers Devil's Bridge and West Fork Trail — both recommended by that
guide — with no fact row to notice a rescission. And **case 8 is systemic**: every guide the
pipeline has produced has batched checkpoints, so Pass A/B independence has never been evidenced
by its own artifacts.

**H1 reached 12/12** after first landing at 10/12. Case 3 needed scoping, not a better regex —
archived guides are exempt (a concluded trip's unknowns are historical), plus announcement-class
vocabulary only. Case 11 ships as an ADVISORY by the MANIFEST's own instruction; its live Routes
half is gated and inert, and the blocker there is structural, not credential-shaped.
## Open items

- **§C4** — sync corrected tokens back to the two Claude Design projects; goes LAST so they receive the final state.
- **§C5** — final 375/744/1440 × day/night × keyboard-only polish walk, all four guides. Last row
  in the design-reconciliation plan.
- **§B4 blocked on project access**, not tool access (`DesignSync` works from a main session;
  this login's `list_projects` doesn't show the right one) — don't retry until it does.
- **Held, not open:** the route-order picker's home (Tools station vs. itinerary mount) — needs both surfaces reviewed together.
- The gap block and "no cover" plate have never rendered on a real guide, by design (CONTEXT.md
  §H3) — proof-of-life is an isolated test fixture, not a staged guide edit.
- Airports for Sedona/Japan — record them WHEN flights get booked. No fact yet; don't invent.
- `/about/` + `/new/` not in the SW precache shell; cover overlay does not trap focus; Cloudflare dashboard Git integration still failing 0s builds.
- Korea 03: critic flagged a swapped 명동 label on the Gyeongbokgung map point → file its issue.
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.

## Where we left off

**`docs/PLAN_EVIDENCE_FIRST.md` is fully executed.** Every packet has a STATUS block in the plan
recording what shipped and, where reality contradicted the spec, what changed and why.

**§A/§B/§C1/§C3 are all closed — only §C4 (project sync) and §C5 (polish walk) remain in the
design-reconciliation plan.** §C4 goes last by its own row's design (it pushes the FINAL state to
the projects), so §C5 is the more useful next move despite the numbering.

**A pattern worth carrying into §C5:** every workstream this arc found real bugs by reading the
whole surface, not just what a mechanical pass flagged — contrast bugs in `divergences.css`, a
stale token in `sights.css`, a CSS scoping bug in `budget-sheet.css`.

**Still needs you — four pipeline items, none of them plan packets:** (1) **the
batched-checkpoint bug** — `pipeline.mjs` writes checkpoints in one burst at the end, so no
guide's state file can evidence Pass A/B independence, the property the two-pass design rests on;
DETECTED but not FIXED. (2) Two `us` content findings for a guide-author pass: the unsupported
`$300` lodging figure, and three rows sharing one byte-identical claim with three different values
(D4 reproducing on `us`). (3) Live Routes verification needs legs structured as origin→destination
pairs against the guide's `map` points. (4) `skill-evals.yml`'s live-agent gate could not be run
locally at any point — the D2 skill rewrite needs one real CI run to confirm it passes.

**Recommended next step — two arcs.** Design: **§C5**, the final polish walk (§C4 goes last by
its own row's design). Pipeline: **the batched-checkpoint fix** — small, and it makes an
architectural guarantee true rather than merely observable.
