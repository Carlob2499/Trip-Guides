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
  `docs/design-handoff/` + its `enforcement/` (the design system's own authority — read BOTH
  before any hub/guide visual work). **There is no live design work order:**
  `docs/archive/PLAN_DESIGN_RECONCILIATION.md` is fully ticked and archived alongside
  `PLAN_ATLAS_MIGRATION.md` — history only, referenced when asked, never re-read by default.

## Open items

- **Dark-mode focus-ring contrast, system-wide** — `--accent` (`#646b2e`) does NOT flip with the
  theme (only `--accent-ink` does), so the ~15 `outline:2px solid var(--accent)` rings measure
  ≈2.85:1 against a dark `.day` card, under WCAG 1.4.11's 3:1. `--accent-ink` would fix dark and
  break light (≈2.70:1), so the fix is a theme-aware ring token — a design-system fork for the
  creator, not a session call. axe has no focus-ring-contrast rule, which is why nothing caught it.
- **The rate fallback drops the currency converter** — the converter hangs off `#liveRatePill`,
  which `applyFallback()` deliberately never un-hides, so a traveller whose rate fetch fails loses
  it entirely even though `curFallbackRate` is in hand. A feature decision, not a bug fix.
- **§B4 blocked on project access**, not tool access (`DesignSync` works from a main session;
  this login's `list_projects` doesn't show the right one) — don't retry until it does.
- **Held, not open:** the route-order picker's home (Tools station vs. itinerary mount) — needs both surfaces reviewed together.
- The gap block and "no cover" plate have never rendered on a real guide, by design (CONTEXT.md
  §H3) — proof-of-life is an isolated test fixture, not a staged guide edit.
- Airports for Sedona/Japan — record them WHEN flights get booked. No fact yet; don't invent.
- `/about/` + `/new/` not in the SW precache shell; cover overlay does not trap focus; Cloudflare dashboard Git integration still failing 0s builds.
- Korea 03: critic flagged a swapped 명동 label on the Gyeongbokgung map point → file its issue.
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.

## Snapshot (2026-08-13h — the design-reconciliation plan is DONE and ARCHIVED)

**§C5 closed the last box, and the plan is archived** to `docs/archive/`. A read-only verifier
walked all four guides + hub at 375/744/1440, day+night, reduced-motion, keyboard-only — 30
combinations, **0 overflow escapes, 0 closed-sheet focus leaks, 0 keyboard traps.** The ≥44px
half found six real regressions the automated gate **structurally could not see**, which is the
part worth remembering.

**Four touch targets.** `.jl-toggle` (34.9px) and the `.guide-stats` tiles carrying
`#liveRatePill` (86.7x36.0) RAISED height-only — the §C2b `.transit-link` shape, width already
cleared. The stat-tile floor went on EVERY tile, not just the rate one, because the pills are
JS-injected and the rate arrives last: flooring it alone would have grown the row after the
countdown painted it, a second CLS shift. `.mast-credit` was NOT padded — CONTEXT.md's
2026-08-11 ruling names "a photo credit" as notation, and `.imgcredit` (literally the same
component) was already excluded; it joined that list. `.spine-tick` BASELINED (`max: 13`) on a
measurement, not a preference: at its own 1100px activation width the content column starts at
17.6px against the rail's 14.4–21.4px, so the gutter is *negative* — any 44px hit area would eat
clicks meant for the page — and vertically, 44px targets on a 37.2px pitch would overlap
neighbours and manufacture wrong-destination misclicks.

**Two focus gaps.** `.addr-copy`/`.stop-num` collapsed hover and focus into one rule ending
`outline:none`, so Tab-reachable controls had no ring. Split; verified under a *real* Tab press
(programmatic `.focus()` never triggers `:focus-visible` — worth knowing for the next audit).

**The durable half — three gate blind spots.** Each regression hid for a different structural
reason, so the gate was widened at each: the network-blocked env forced rate.js's fallback (the
one path that never un-hides the pill) → `prep()` now serves the rate endpoint and asserts the
pill un-hides; korea's trip is in the past so it never renders the jetlag toggle → **japan**
joined `TARGET_PAGES` as the only upcoming-trip page; the device list topped out at 1024px so
nothing behind a desktop breakpoint was reachable → **Desktop 1280** joined it. That last one
paid immediately, surfacing a seventh never-audited control (`.divergence-source`, 1151x21,
japan-only content) — raised, not baselined. The canned rate had to be derived from the product's
own `SANITY` band, because a flat value passed korea and was correctly rejected on japan.
`a11y.spec.ts` **57 → 69 tests**, all green; drift unchanged at 341/435/37/18/4.

**One deviation, recorded not taken:** the brief called `applyFallback()` not un-hiding the pill a
bug. It isn't — the markup says "injected when fetch succeeds" and the stats bar's rule is that
only self-changing facts belong there. Un-hiding a build-time seed rate would show a stale number
as live on every failed fetch. Shipped behaviour left alone; the gate fixed instead.

## Where we left off

**Both big plans are now fully executed** — `PLAN_EVIDENCE_FIRST.md` and, as of today,
`PLAN_DESIGN_RECONCILIATION.md` (archived). There is no live work order; the next design change
is governed by `docs/design-handoff/` + `enforcement/` directly.

**Still needs you — four pipeline items, none of them plan packets:** (1) **the
batched-checkpoint bug** — `pipeline.mjs` writes checkpoints in one burst at the end, so no
guide's state file can evidence Pass A/B independence, the property the two-pass design rests on;
DETECTED but not FIXED. (2) Two `us` content findings for a guide-author pass: the unsupported
`$300` lodging figure, and three rows sharing one byte-identical claim with three different values
(D4 reproducing on `us`). (3) Live Routes verification needs legs structured as origin→destination
pairs against the guide's `map` points. (4) `skill-evals.yml`'s live-agent gate could not be run
locally at any point — the D2 skill rewrite needs one real CI run to confirm it passes.

**Recommended next step — the batched-checkpoint fix.** Small, and it makes an architectural
guarantee true rather than merely observable. The design side has no queued work; the two items
it left are creator forks (the theme-aware focus-ring token, the fallback converter), both in
Open items above — neither should be settled by a session alone.
