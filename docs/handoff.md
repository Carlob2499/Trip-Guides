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

## Snapshot (2026-08-13f — §C1 CLOSED: 153→29 real drift violations, five more Tier-2 gate
bugs fixed, three real CSS bugs found and fixed)

One large commit, ship-loop-clean: 1748 vitest, full 57-test `a11y.spec.ts` Playwright suite,
build/lint/typecheck/drift green. This finishes the drift-baseline paydown workstream this arc
opened several sessions ago — the four rows left in the baseline are structurally forced-literal
(`budget-sheet.css`, `og`/`recap` PNG generators), not a queue.

**`painted-atlas.css`'s 19 violations are art, not chrome — a whole-file exemption, not CSS
changes.** It's a generative painter's-sky illustration (`PaintedAtlas.astro`, "the living cover
every guide is born with"), governed by `docs/reference/motion.md` instead of the flat-chrome
rules this gate otherwise enforces. `panel-preview/` folded into the existing
`unshipped-design-study` exemption — its own comment says it's "a deliberate copy of
progress-preview's file," same "delete this whole folder with the study" class.

**Two real bugs, both found doing the mechanical pass, same pattern as every file this arc:**
`sights.css`'s `.sight-media-cap{color:#f8faf3}` was a pre-R5 stale literal (the OLD `--card`
value) never updated when the token moved — fixed to `var(--ink)`, matching the exact fix its
own neighbouring comment already describes for its sibling rules; screenshot-verified legible in
both themes. `anchors.css`'s `.ring-fill` had a dead, stale fallback (same class as
`divergences.css`'s from earlier this arc) — deleted.

**Five more Tier-2 gate bugs fixed in `scripts/drift-real.mjs`, on top of the two from earlier
sessions:** `box-shadow:none` was tripping check-drift's OWN `(?!none)` negative-lookahead rule
via regex backtracking; `isInsideComment` didn't recognize Astro's `{/* … */}` syntax, only bare
`/*`; `in-a-comment`'s category allowlist excluded SAFE-AREA/MOTION for no stated reason, so the
previous fix alone didn't help; `ring-shadow-is-not-elevation`'s extraction didn't stop at `}`,
so a `@keyframes` step's box-shadow captured garbage from the NEXT step; that same regex only
accepted a unit-bearing ring spread, not the legal bare-`0` a pulse animation's start frame uses.

**Everything else structurally forced-literal got one clean, honestly-named exemption each**
(not a blanket mute): JS reading a live CSS token with a defensive fallback (canvas/pre-paint
contexts can't hold `var()`), third-party SDK config (Google Maps), `<meta>` attribute values,
`accent-tokens.ts` (the tested derivation source `--accent-ink` itself comes from), and
`sights.css`'s legitimate photo-tuned near-white (same reasoning as the hub's pincard credit).

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

**§C1 is closed — the drift-baseline paydown workstream this arc opened is done.** The remaining
29 real violations are all in the four already-decided forced-literal files; there is no more
file-by-file queue for this workstream. The next open work is §C3 (print preview), a real
user-facing feature rather than more token hygiene.

**A pattern worth carrying into §C3/§C5:** every drift-paydown session this arc found real bugs
(contrast failures, stale literals, gate false-positives) sitting beside the mechanical fix, not
in a separate audit. The same discipline — read the whole thing, not just the flagged line —
should carry into the print-preview build and the final polish walk.

**Still needs you:** the same `eslint.config.mjs` hook-protection gap as before — the R5 bundle
ignore line still can't land there; `support.js` still carries its own `eslint-disable` header.

**Recommended next step:** §C3, the print-preview shell for issue #47. `main` is kept in sync
with this branch after every ship-loop-clean commit (explicit standing instruction) — no
separate merge step needed at session end.
