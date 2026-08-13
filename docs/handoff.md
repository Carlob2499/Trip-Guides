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
  §A/§B/§C1 are ALL DONE now. §C is at §C3/§C4/§C5 (print preview, project sync, final polish
  walk), see below. `docs/archive/PLAN_ATLAS_MIGRATION.md` is fully ticked — history only.

## Snapshot (2026-08-13 — two parallel arcs landed: §C1 drift paydown, and PLAN_EVIDENCE_FIRST end to end)

Two independent workstreams closed the same day. Ship-loop-clean on both: 2006 vitest + 1 todo,
full `a11y.spec.ts` suite, build/lint/typecheck/drift green.

### §C1 — drift-baseline paydown CLOSED (153 → 29 real violations)

Finishes the workstream this arc opened. The four rows left are structurally forced-literal, not a
queue; `painted-atlas.css`'s 19 are art, not chrome — a whole-file exemption under
`docs/reference/motion.md`. Two real bugs surfaced beside the mechanical pass: `sights.css`'s
`.sight-media-cap` was a pre-R5 stale literal (the OLD `--card` value) → `var(--ink)`;
`anchors.css`'s `.ring-fill` had a dead stale fallback → deleted. Five more Tier-2 gate bugs fixed
in `scripts/drift-real.mjs` (regex backtracking defeating its own `(?!none)`, Astro `{/* … */}`
comments unrecognised, a category allowlist gap, `@keyframes` extraction not stopping at `}`).

### PLAN_EVIDENCE_FIRST — complete, H1 at 12/12

A1 · B1–B4 · C1–C2 · D1–D3 · E1–E3 · F1–F2 · H1, each with a STATUS block in the plan.

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

- **§C3** — the #47 print-preview shell (budget sheet prints straight to the OS dialog, no
  preview).
- **§C4** — sync corrected tokens back to the two Claude Design projects — must go LAST, after
  everything else lands, so the projects receive the final state.
- **§C5** — final 375/744/1440 × day/night × keyboard-only polish walk across all four guides.
- **§B4 blocked on project access**, not tool access (`DesignSync` works from a main session;
  this login's `list_projects` just doesn't show the right one) — don't retry until it does.
- **Held, not open:** the route-order interactive picker's home (Tools station vs. itinerary
  mount) — needs both surfaces reviewed together, CONTEXT.md Decisions.
- The gap block and the "no cover" plate have still never rendered on a real guide, by design
  (CONTEXT.md §H3) — their proof-of-life is an isolated test fixture, not a staged guide edit.
- Airports for Sedona/Japan — record them WHEN flights get booked. No fact yet; don't invent.
- `/about/` and `/new/` are not in the SW precache shell. Cover overlay does not trap focus.
- Cloudflare dashboard Git integration still failing 0s builds on every push.
- Korea 03: critic flagged a swapped 명동 label on the Gyeongbokgung map point → file its issue.
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.

## Where we left off

**`docs/PLAN_EVIDENCE_FIRST.md` is fully executed.** Every packet has a STATUS block in the plan
recording what shipped and, where reality contradicted the spec, what changed and why.

**§C1 is closed — the drift-baseline paydown workstream this arc opened is done.** The remaining
29 real violations are all in the four already-decided forced-literal files; there is no more
file-by-file queue for this workstream. The next open work is §C3 (print preview), a real
user-facing feature rather than more token hygiene.

**A pattern worth carrying into §C3/§C5:** every drift-paydown session this arc found real bugs
(contrast failures, stale literals, gate false-positives) sitting beside the mechanical fix, not
in a separate audit. The same discipline — read the whole thing, not just the flagged line —
should carry into the print-preview build and the final polish walk.

**Still needs you — four items, none of them plan packets:**
1. **The batched-checkpoint bug** (case 8, systemic). `pipeline.mjs` checkpoints are written in
   one burst at the end of a run, so no guide's state file can evidence that Pass A and Pass B
   ran independently — the property the whole two-pass design rests on. Now DETECTED but not
   FIXED; the fix belongs in how research-pass writes checkpoints.
2. **Two `us` content findings** for a guide-author pass: the unsupported `$300` lodging figure,
   and three rows sharing the byte-identical claim `Budget & daily costs → Lodging, per night
   (Sedona, 3★ average)` with three different values (defect D4 reproducing on `us`).
3. **Live Routes verification** — needs legs structured as origin→destination pairs against the
   guide's `map` points before a key can be useful.
4. `skill-evals.yml`'s live-agent gate could not be run locally at any point this session; the
   D2 skill rewrite needs one real CI run to confirm it still passes.

**Recommended next step — two arcs, pick by appetite.** Design: **§C3**, the print-preview
shell for issue #47, a real user-facing feature rather than more token hygiene. Pipeline: **the
batched-checkpoint fix**, which is small and makes an architectural guarantee true rather than
merely observable. `main` is kept in sync after every ship-loop-clean commit (standing
instruction) — no separate merge step at session end.
