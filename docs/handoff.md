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

## Snapshot (2026-08-13g — §C3 shipped: the budget sheet previews before it prints, issue #47)

One commit, ship-loop-clean: 1748 vitest, full 57-test `a11y.spec.ts` Playwright suite, a fully
rewritten 9-test `budget-sheet.spec.ts`, build/lint/typecheck/drift green.

**Built against the actual GitHub issue, fetched via `issue_read` before writing any code** —
the plan doc's own `[data-fold]`/`[data-noprint]` language for this row didn't correspond to
anything in the ticket or in the sheet's markup (it has no folds; every figure already renders
unconditionally), so it was ignored rather than built to.

**Clicking "Save summary as PDF" now opens a visible on-screen preview** (`.bsp-modal`, reusing
`.share-modal`'s established pattern — border, no shadow, `border-radius:0` — and the shared
`trapFocus` utility rather than a third hand-rolled focus trap) built from the SAME `.bsheet`
element that later prints, not a copy. Only the preview's own Print button calls
`window.print()`, synchronously inside its own click — the popup-blocker-class constraint the
issue itself calls out still holds, it just moved from the trigger's click to the preview's.

**The CSS restructure this required is the more interesting part:** `.bs-*` styling used to live
entirely inside `@media print` — meaning before this fix, there was no way to show the document
on screen even if something HAD called `display:block` on it, because none of its actual design
(fonts, colours, spacing) existed outside print media. Moved unconditional: screen preview and
paper render identically now, because it's one document, not a screen variant and a print
variant. `@media print` is now thin — only what actually differs on paper (hide the preview
chrome, unwrap the modal back to normal flow, `@page` size).

**The existing Playwright suite encoded the pre-fix behavior as correct** (immediate print,
`display:none` sheet) and needed deliberate rewriting, not just new assertions — all 9 tests
updated, plus the print-media test the plan doc's row asked for
(`page.emulateMedia({media:'print'})` asserting the chrome hides and the modal unwraps to
`position:static`). Screenshot-verified both themes + 375px mobile: the preview UI follows the
reader's live theme; the sheet itself stays fixed white paper regardless, same call print.css
already makes for the guide itself.

## Open items

- **§C4** — sync corrected tokens back to the two Claude Design projects — must go LAST, after
  everything else lands, so the projects receive the final state.
- **§C5** — final 375/744/1440 × day/night × keyboard-only polish walk across all four guides.
  This is the last row in the whole design-reconciliation plan.
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

**§A/§B/§C1/§C3 are all closed now — only §C4 (project sync) and §C5 (final polish walk) are
left in the whole design-reconciliation plan.** §C4 explicitly goes last by its own row's design
(it pushes the FINAL state back to the projects), so §C5 is the more useful next move even
though it's numbered after C4 in the doc.

**A pattern worth carrying into §C5:** every workstream this arc found real bugs by reading the
whole surface, not just what a mechanical pass flagged — two contrast bugs in `divergences.css`,
a stale token in `sights.css`, an entire CSS scoping bug in `budget-sheet.css` that made an
on-screen preview structurally impossible until restructured. The polish walk should read that
way too: actually look at each guide, not just check boxes off a list.

**Still needs you:** the same `eslint.config.mjs` hook-protection gap as before — the R5 bundle
ignore line still can't land there; `support.js` still carries its own `eslint-disable` header.

**Recommended next step:** §C5, the final polish walk. `main` is kept in sync with this branch
after every ship-loop-clean commit (explicit standing instruction) — no separate merge step
needed at session end.
