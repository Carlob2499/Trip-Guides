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
  §A/§B (fidelity audit, unshipped-material mining) are DONE; §C (theme polish) is IN PROGRESS,
  now at §C1 (drift paydown, file-by-file — `guide.css` done, others queued), see below.
  `docs/archive/PLAN_ATLAS_MIGRATION.md` is fully ticked and archived — read for history only.

## Snapshot (2026-08-13 — design-reconciliation §C2a/§C2b shipped, §C1 opened: guide.css's
drift fully paid down, plus two Tier-2 gate bugs found doing it)

Two commits, ship-loop-clean each: 1748 vitest, full `a11y.spec.ts` Playwright suite (57 tests,
not just the 44px sweep — axe scans on every guide, both themes), build/lint/typecheck/drift all
green.

**§C2a/§C2b (first commit):** `.dchip` (day scrubber) is an underline now, not a filled pill
(CONTEXT.md §H2) — ground moves `--accent`→`--sunken`, active ink re-derived to `--accent-ink`
(the "text on a page surface" token, already proven ≥4.5:1 against `--bg2` by its own base.css
derivation comment) rather than the old, wrong `--on-accent`-on-a-fill pairing. `.transit-link`
clears 44px for real — a `getBoundingClientRect()` sweep found only height was short, so a
padding-only raise reached the floor with zero width growth; its `TARGET_BASELINE` exception is
REMOVED, not shrunk. `.scrub-fit .dchip` re-measured, confirmed unchanged by the shape fix,
ceiling tightened 12→8.

**§C1 opened (second commit): `guide.css`, the plan's own named first target, is DONE** —
RADIUS 26→0 (21 literals converted: pill/circle/badge/button → `999px`, matching the codebase's
own unbroken convention on every other `*-chip`/`*-pill`/`*-badge`/`cursor:pointer` selector,
verified against each one's actual template markup, not guessed from the CSS alone; content
container → `0`), ELEVATION 6→0 (three real box-shadows removed — `.cat-title`'s decorative
double-line, `.card`'s resting shadow, `.card:hover`'s lift-shadow; the border already carries
the edge). **Two Tier-2 gate bugs found and fixed along the way** (`scripts/drift-real.mjs`):
`radius-brace-capture`'s exemption regex accepted ANY trailing text after one valid token,
silently hiding a real violation (`.day-planb`'s `0 6px 6px 0` — now `0`); the single-selector
`station-dot-ring-is-not-elevation` exemption is generalized to `ring-shadow-is-not-elevation`, a
structural check (zero offset AND zero blur on every layer = a ring, not a drop shadow) — found
the identical unexempted pattern in `guide.css`'s `.day-today` and `mobile-nav.css`'s
`.bslot-mark`/`.sheet-cat.active::before`. Re-running `--update` after both fixes also correctly
picked up several categories other sessions had already fixed in CSS or that the pre-existing
`overlay-shadow-is-approved`/`drag` keyword already covered, but nobody had re-tightened for:
real count 153→109 baseline-wide, not just guide.css's slice.

## Open items

- **§C1 continues, file-by-file, same cadence** (drift → fix → `--update` same commit): next up
  `budget-sheet.css`/`divergences.css` COLOUR, `flight.css`/`mobile-nav.css` RADIUS+ELEVATION,
  `intake.css`/`jetlag.css`/`map.css`/`painted-atlas.css`/`panel-preview/` RADIUS+ELEVATION, then
  the COLOUR-only files (`sights.css`, `atlas-map.js`, `firebase/styles.css`, `gmaps-render.js`,
  `PwaHead.astro`, `GuideLayout.astro`, `og`/`recap` pages, `util.js`, `accent-tokens.ts`).
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

**Both §H1/§H2 44px-density forks are implemented, not just decided** (see above), and
`guide.css` — the plan's own first C1 target — is fully clean on RADIUS and ELEVATION, with the
gate itself hardened in the process rather than worked around.

**Still needs you:** the same `eslint.config.mjs` hook-protection gap as before — the R5 bundle
ignore line still can't land there; `support.js` still carries its own `eslint-disable` header.

**Recommended next step:** keep §C1 moving — `budget-sheet.css`/`divergences.css` COLOUR (11
literals between them) is the next-cheapest file-by-file chunk before the bigger RADIUS/ELEVATION
files. `main` is kept in sync with this branch after every ship-loop-clean commit (explicit
standing instruction) — no separate merge step needed at session end.
