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
  §A/§B (fidelity audit, unshipped-material mining) are DONE (five commits, `e9ba8a5`…`9398694`);
  §C (theme polish) is IN PROGRESS, see below. `docs/archive/PLAN_ATLAS_MIGRATION.md` is fully
  ticked and archived — read it for history, not for what's next.

## Snapshot (2026-08-13 — design-reconciliation §C2a/§C2b: the day-chip underline + the
transit-link 44px raise)

One commit, ship-loop-clean: 1748 vitest, 18/18 `a11y.spec.ts` 44px-sweep Playwright tests,
build/lint/typecheck/drift (136 real, under the 153 baseline, unchanged by this commit) all
green. `docs/PLAN_DESIGN_RECONCILIATION.md`'s §A (fidelity audit FIX rows) and §B (mining) were
already done before this session; §C (theme polish) had not been started — this session opened
it at §C2a/§C2b, the two items CONTEXT.md had already decided (§H1/§H2), per the plan's own
execution order.

**`.dchip` (the day scrubber) is an underline now, not a filled pill** (CONTEXT.md §H2's REVISE
ruling — SPEC rule 1: evidence, not a button). `planner.css`'s `.dchip` lost border/radius/fill;
`.dchip-active`'s ground moved from `--accent` to `--sunken` with an accent `border-bottom`.
Re-derived (not just re-typed) the active numeral's ink: `--accent-ink` is base.css's own "text
on a page surface" token, already proven ≥4.5:1 against `--bg2`/`--sunken` by its own R5
derivation comment — the old 3.58:1/2.56:1 note had measured the WRONG pairing (accent-ink on an
accent FILL) and is replaced, not left stale.

**`.transit-link` clears 44px now; `.dchip`'s baseline tightens, but doesn't clear.** A real
`getBoundingClientRect()` sweep (both `TARGET_PAGES` × all nine devices, the exact harness
`a11y.spec.ts` itself uses) found `.transit-link`'s WIDTH already cleared 44px everywhere
(min 88.2px) — only height was short (30.3px), so a padding-block-only raise to `.68rem .55rem`
(measured 44.375px) reached the floor with zero width growth and no row-wrap change, the thing
the original baseline comment worried about. 0 violations, both pages, all nine devices — its
`TARGET_BASELINE` entry is REMOVED, not shrunk, so a regression here is a real test failure
again. `.scrub-fit .dchip` was re-measured per CONTEXT.md's own §H2 update note and does NOT
newly clear — the pill→underline shape touches border/fill/radius, not the
`flex:1 1 0;min-width:0` math that narrows these chips — so the density ruling (baselined,
creator's call) stands; only the ceiling itself tightened, 12→8, to the real observed max.

## Open items

- **§C1/§C3/§C4/§C5 of the theme-polish workstream, and §B4** — drift-baseline paydown (136
  real, target: 0), the #47 print-preview shell, syncing corrected tokens back to the design
  projects (last, so they receive the final state), the final 375/744/1440×day/night polish
  walk, and the `shots/` triage. All still open; `docs/PLAN_DESIGN_RECONCILIATION.md` §C/§B4 is
  the queue, not this file.
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

**Both §H1/§H2 44px-density forks CONTEXT.md recorded on 2026-08-12 are now implemented, not
just decided.** `.transit-link` is fully resolved; `.scrub-fit .dchip` is re-measured and
confirmed to stay baselined, with a tighter, real ceiling instead of a stale looser one.

**Still needs you:** the same `eslint.config.mjs` hook-protection gap as before — the R5 bundle
ignore line still can't land there; `support.js` still carries its own `eslint-disable` header.

**Recommended next step:** `docs/PLAN_DESIGN_RECONCILIATION.md` §C1 (drift-baseline paydown,
file-by-file, tighten `--update` in the same commit each time) is next in the plan's own
execution order — or §C3 (print preview, issue #47) if you'd rather ship a user-facing fix.
