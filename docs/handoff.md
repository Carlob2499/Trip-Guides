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
  §A/§B (fidelity audit, unshipped-material mining) are DONE; §C is IN PROGRESS at §C1
  (drift paydown, file-by-file — `guide.css` and `divergences.css` done, others queued below).
  `docs/archive/PLAN_ATLAS_MIGRATION.md` is fully ticked and archived — read for history only.

## Snapshot (2026-08-13c — §C1 continues: divergences.css clean, and two real
accent-contrast bugs found doing the cleanup, not caused by it)

One commit, ship-loop-clean: 1748 vitest, full 57-test `a11y.spec.ts` Playwright suite
(axe scans on every guide, both themes), build/lint/typecheck/drift green. Drift real count
109→104.

**`divergences.css`'s 5 COLOUR violations were dead code, not live drift.** Its
`var(--accent, #a6721b)`-style fallbacks can never actually resolve — the file only ever renders
inside `GuideLayout.astro`, where base.css's tokens are always defined — and the fallback hexes
themselves were stale pre-R2 placeholders nobody had touched since. Deleted outright rather than
"fixed" to a new value.

**Deleting one dead fallback exposed a real bug the gate's own regex couldn't see through the
two-argument `var()` call:** `.divergence-source{color:var(--accent, …)}` was raw `--accent` as
text — the exact "occurrence 1" class `accent-ink-contract.test.mjs` exists to catch — invisible
to it only because the fallback comma broke the gate's pattern match. Fixed to `--accent-ink`.

**Checking the file's other accent-as-text pairing by hand (not caught by any gate) found a
worse, second bug:** `.divergence-cat{background:var(--accent);color:var(--bg)}` measures 5.13:1
in light mode but **2.90:1 in dark** — under even the 3:1 large-text floor — because `--bg`
doesn't remap alongside `--accent` the way `--on-accent` is derived to. Every other
`background:var(--accent)` pairing in the codebase (nine of them) already uses `--on-accent`;
this was the one outlier, now fixed to match (4.52:1, the same floor `--on-accent` holds
everywhere else).

**`budget-sheet.css` stays baselined, deliberately not touched:** its literals are
`@media print`-forced-light values that must render on white paper regardless of the reader's
live theme, so `var()` is structurally wrong there — the same accepted-debt class as the
`og`/`recap` PNG generators already sitting unexempted in this same baseline.

## Open items

- **§C1 continues, file-by-file, same cadence** (drift → fix → `--update` same commit): next up
  `flight.css`/`mobile-nav.css` RADIUS+ELEVATION, `intake.css`/`jetlag.css`/`map.css`/
  `painted-atlas.css`/`panel-preview/` RADIUS+ELEVATION, then the COLOUR-only files (`sights.css`,
  `atlas-map.js`, `firebase/styles.css`, `gmaps-render.js`, `PwaHead.astro`, `GuideLayout.astro`,
  `util.js`, `accent-tokens.ts`; `og`/`recap` pages stay baselined like `budget-sheet.css`).
- **§C3/§C4/§C5, and §B4** still open: the #47 print-preview shell, syncing corrected tokens
  back to the design projects (last, so they receive the final state), the final polish walk,
  and the `shots/` triage. `docs/PLAN_DESIGN_RECONCILIATION.md` §C/§B4 is the queue.
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

**A pattern worth repeating each C1 file:** the mechanical part (converting one hardcoded value
to its token) is cheap, but it's worth a beat to hand-check the FILE's other uses of the same
token family while it's open — both bugs found this round (`--accent`-as-text, `--bg`-as-
on-accent-ink) were sitting right beside the literal that brought the file into scope, invisible
to any existing gate, and would have shipped past a purely mechanical "swap the hex for var()"
pass.

**Still needs you:** the same `eslint.config.mjs` hook-protection gap as before — the R5 bundle
ignore line still can't land there; `support.js` still carries its own `eslint-disable` header.

**Recommended next step:** keep §C1 moving — `flight.css`/`mobile-nav.css` RADIUS+ELEVATION is
the next chunk (both already touched this arc for other reasons, so context is warm). `main` is
kept in sync with this branch after every ship-loop-clean commit (explicit standing instruction)
— no separate merge step needed at session end.
