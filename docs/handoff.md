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
  paydown, file-by-file — `guide.css`/`divergences.css`/`flight.css`/`mobile-nav.css`/
  `intake.css`/`jetlag.css`/`map.css` done, others queued below).
  `docs/archive/PLAN_ATLAS_MIGRATION.md` is fully ticked — history only.

## Snapshot (2026-08-13e — §C1 continues: intake.css/jetlag.css/map.css clean; a new,
honestly-scoped exemption for map markers over tile imagery)

One commit, ship-loop-clean: 1748 vitest, full 57-test `a11y.spec.ts` Playwright suite (axe
scans on every guide, both themes), build/lint/typecheck/drift green. Drift real count 100→91.

**Six radii converted, all to precedent already established elsewhere this arc.**
`.itk-wordmark:focus-visible`'s `border-radius:6px` was the ONLY `outline` + `border-radius`
pairing anywhere in the codebase — every other text-link focus ring is plain outline — dropped as
an unexplained outlier. `.itk-blank` → `0` (matches the day-chip underline treatment).
`.jl-toggle` → `999px` (matches `.card-more-sum`'s identical full-width-disclosure-row shape).
`.jl-select`/`.jl-output`/`.itin-map` → `0` (form-control/content-callout/map-embed patterns
already established). `.ng-form`'s shadow removed too — no stated reason, ordinary page content,
border already there.

**`.map-chip`/`.map-cluster`'s shadows are kept, under a NEW exemption rather than stretched
into the existing overlay one.** They aren't floating page chrome like `.nav-hint`/`.botbar` —
they're markers painting OVER live map tiles (unpredictable colour, not the site's own
controlled page background). That's the same separation need `pincard-credit-sits-on-a-
photograph` already recognizes for the hub's globe, one component category over — named
`map-marker-sits-on-tile-imagery` rather than folded into a reasoning that doesn't actually fit,
per this arc's own standard of naming exemptions honestly rather than as a mute button.

## Open items

- **§C1 continues, file-by-file, same cadence** (drift → fix → `--update` same commit): next up
  `painted-atlas.css`/`panel-preview/` RADIUS+ELEVATION, then the COLOUR-only files (`sights.css`,
  `atlas-map.js`, `firebase/styles.css`, `gmaps-render.js`, `PwaHead.astro`, `GuideLayout.astro`,
  `util.js`, `accent-tokens.ts`; `og`/`recap` pages and `budget-sheet.css` stay baselined —
  forced-literal print/image contexts, not fixable).
- **§C3/§C4/§C5** still open: the #47 print-preview shell, syncing corrected tokens back to the
  design projects (last, so they receive the final state), the final polish walk.
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

**Painted-atlas.css is next and is a bigger chunk than anything landed so far** (15 COLOUR + 4
ELEVATION + 1 RADIUS, per the baseline) — budget more than one file's usual attention for it, and
expect it to need the same "hand-check the whole file, not just the flagged line" pass that's
paid off every time this arc: real bugs have been sitting beside the flagged literal in three of
the last four files, not in it.

**Still needs you:** the same `eslint.config.mjs` hook-protection gap as before — the R5 bundle
ignore line still can't land there; `support.js` still carries its own `eslint-disable` header.

**Recommended next step:** `painted-atlas.css` RADIUS+ELEVATION, then `panel-preview/` to close
out the RADIUS+ELEVATION half of §C1 before starting the COLOUR-only files. `main` is kept in
sync with this branch after every ship-loop-clean commit (explicit standing instruction) — no
separate merge step needed at session end.
