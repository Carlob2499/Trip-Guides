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
  §A/§B (fidelity audit, unshipped-material mining) are DONE; §C is IN PROGRESS at §C1 (drift
  paydown, file-by-file — `guide.css`/`divergences.css`/`flight.css`/`mobile-nav.css` done,
  others queued below). `docs/archive/PLAN_ATLAS_MIGRATION.md` is fully ticked — history only.

## Snapshot (2026-08-13d — §C1 continues: flight.css/mobile-nav.css clean; two stale-doc
corrections; B4 re-diagnosed with DesignSync actually reachable)

Three commits, ship-loop-clean each: 1748 vitest, full 57-test `a11y.spec.ts` Playwright suite,
build/lint/typecheck/drift green. Drift real count 104→100.

**`.cat-fan-img`'s decorative shadow (the chapter-opener's fanned-photo stack) is gone — no
stated functional reason, and this component predates the Atlas redesign (not in the
design-system export to check against).** Radius→`0`, shadow removed; screenshot-verified in
both themes that the existing `border:2px solid var(--card)` alone still reads clearly as
separated, overlapping photos.

**`.nav-hint` and `.botbar`'s shadows are the opposite case — kept, and formally exempted
instead.** Each carries its OWN comment stating a real functional reason (a floating,
out-of-flow element needs the shadow to read as lifted, not docked — `.botbar`'s is even scoped
to exactly the `>=600px` media query its own comment calls "a centred pill"). Extended
`overlay-shadow-is-approved` to name both rather than changing CSS against its own stated
reasoning.

**Two stale-doc corrections, found by checking the plan against actual source instead of
trusting old checkboxes:** §B1 (the `waypoint-design` skill) and every A3 FIX row were already
done — commits `e9ba8a5`/`c05fe26`/`7b4d92a` — just never ticked. And §B4 ("`shots/` triage")
was marked "blocked, DesignSync unreachable" from an earlier subagent session; re-checked live
from a main session and the tool DOES work, but this login's `list_projects` shows only two
projects and neither has the `shots/`/`HANDOFF.md` content B4 needs — corrected the note so a
future session doesn't retry the wrong blocker (it's project access, not tool access).

## Open items

- **§C1 continues, file-by-file, same cadence** (drift → fix → `--update` same commit): next up
  `intake.css`/`jetlag.css`/`map.css`/`painted-atlas.css`/`panel-preview/` RADIUS+ELEVATION, then
  the COLOUR-only files (`sights.css`, `atlas-map.js`, `firebase/styles.css`, `gmaps-render.js`,
  `PwaHead.astro`, `GuideLayout.astro`, `util.js`, `accent-tokens.ts`; `og`/`recap` pages and
  `budget-sheet.css` stay baselined — forced-literal print/image contexts, not fixable).
- **§C3/§C4/§C5** still open: the #47 print-preview shell, syncing corrected tokens back to the
  design projects (last, so they receive the final state), the final polish walk.
- **§B4 blocked on project access** (see above) — don't retry until the right design-tool
  project is reachable under this login.
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

**Keep hand-checking the whole file when a C1 chunk opens it, not just the flagged line** —
every session in this arc so far has found something the mechanical pass alone would have
missed (two contrast bugs in `divergences.css`; two stale-but-important doc checkboxes and a
wrong blocker diagnosis this round). It's cheap and it keeps paying off.

**Still needs you:** the same `eslint.config.mjs` hook-protection gap as before — the R5 bundle
ignore line still can't land there; `support.js` still carries its own `eslint-disable` header.

**Recommended next step:** keep §C1 moving — `intake.css`/`jetlag.css`/`map.css` is the next
chunk (three small files, similar shape to what's already landed). `main` is kept in sync with
this branch after every ship-loop-clean commit (explicit standing instruction) — no separate
merge step needed at session end.
