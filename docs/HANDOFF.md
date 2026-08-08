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
  grep `dist/` → commit → push to `main` (the only branch — `verify-live` guards every deploy).
  Lint and typecheck are not optional: CI runs all three and session #20 pushed red twice by
  treating build+test as the whole gate.
- North stars: `docs/PIPELINE.md` (generation/maintenance) · `docs/MOTION.md`
  (presentation/motion) · `docs/GUIDE_RUBRIC.md` (quality bar) ·
  `docs/COMPETITIVE_LANDSCAPE.md` (market parity reference) ·
  **`docs/PLAN_ATLAS_MIGRATION.md`** (the current work order — its own Progress ledger is the
  source of truth for which stage is next; read that before re-deriving status from git log).

## Snapshot (2026-08-08 — Atlas migration **Stage C COMPLETE**; Atlas is the live hub)

**The flip shipped.** `src/pages/atlas.astro` became `src/pages/index.astro` (`cd94ab5`) —
the Atlas hub (cover, globe/world view, server-rendered table view, mobile FAB + ping sheet)
is now what `https://carlob2499.github.io/Trip-Guides/` serves, verified live. The `/atlas/`
route is gone; the old hub is deleted (overture.js, hub-live-cards.js, hub.css, hub-cards.css,
hub-motion.css, `features/hub`'s index.js + ui/hub.js), and dead `.hubcard` selectors were
swept from touch.css / scroll-motion.css / reveal.js / type-scale's allowlist.
**Kept deliberately, against the plan's own item-10 wording:** `gsap-hero.js` +
`hero-parallax.js` — `GuideLayout.astro` imports both for the guide masthead; only the HUB's
use of them died. PaintedAtlas kept per D3; `features/hub/ui/intake-flow.js` kept (/new uses it).

**Earlier in the session** (before the flip): the guide-page button-chrome fix (`7ac154a` —
`appearance:none` moved to base.css after finding an earlier hub-only fix had missed every
guide page, incl. the mobile bottom nav bar), and three real globe pin-card bugs (`f80dcdb`):
guides with no explicit `cover` showed NO photo (atlas.astro now runs the same
cover→first-sight-photo fallback GuideLayout's masthead does), pin-card titles rendered in
browser default link-blue, and the local-time clock sat on a placeholder dash for up to 30s.

**`93e1657` — what the a11y gate caught the moment this page entered its scan list** (it was
never scanned at `/atlas/`). Two REAL defects, fixed: (1) the cover and globe were bare
`<div>`s outside any landmark → both are named `<section>`s now; (2) **"Skip to guides"
pointed at `#atlasTable` while the JS default WORLD mode sets that wrapper to `display:none`
— the skip link jumped to a hidden element and did nothing.** It now switches to table mode
on activation (verified end-to-end: focus → Enter → mode flips, wrapper goes none→block,
target has real geometry, hash lands). Three "couldn't resolve" cases were baselined only
after measuring: worst pair 4.67:1, all ≥4.5 (numbers recorded in `a11y.spec.ts`).

Gates on both flip commits: build · lint · typecheck 0 errors · 1560 unit tests · **21/21
a11y** · 3/3 new `atlas-hub.spec.ts` · perf budget OK (d3/topojson still lazy) · zero
`src/content/guides/` diffs. All four CI workflows green; deploy confirmed live.

**Decisions CLOSED this session (do not re-ask):** Sedona/Japan departure airports —
**no such fact exists**; neither trip has booked flights, so nothing gets recorded. The
creator expects the NYC area and will say when scheduling happens. Tools screen — today's
per-guide tools-tab shortcut STAYS; no standalone README §5 screen this round.

**Hub visuals — UNRESOLVED.** What the creator actually said, verbatim: "so many things look
off — but this isn't necessarily the fault of the screenshots. We can iterate later but we
need to move on and integrate all the features." That is the whole of it. They did NOT rule
that visual work is closed, deprioritised, or off-limits — an earlier draft of this file said
they had, which was this assistant inventing a decision and attributing it to them. The
specific gaps were never enumerated, so they are not written down anywhere yet; getting that
list is the first step whenever this is picked up.

## Open items

- **Hub visual fidelity — OPEN.** The flip shipped with gaps the creator can see and this
  assistant has not enumerated. Not scheduled against Stage D either way; ask which to do
  first rather than assuming. `docs/design-handoff/enforcement/` + CLAUDE.md's "Design
  Fidelity" section carry
  the authority order and the kit's known false positives.
- **Airports for Sedona/Japan** — record them WHEN flights get booked (creator expects the NYC
  area). Until then there is no fact; do not invent or re-ask.
- Cover overlay does not trap focus: with the cover open, Tab moves into the page behind it
  (found 2026-08-08 while probing the skip link; the cover still dismisses on any key, so it
  is a papercut, not a trap). Worth a focus-trap pass whenever the cover is next touched.
- LOCAL branch `worktree-agent-a7dc7eeb397c6a368` (progress-study, `5917f8f`, exists nowhere
  else) — keep or lose.
- Cloudflare dashboard Git integration still failing 0s builds on every push — consider disabling.
- Korea 03: critic flagged a swapped 명동 label on the Gyeongbokgung map point → file its issue.
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.

## Where we left off

**This session:** Stage C is DONE — Atlas is the live hub, all gates green, deploy confirmed.
Hub visual fidelity is still imperfect and still open (see Open items) — no decision has been
made about when it gets done, so ask before assuming an order.

**One candidate next step:** **Stage D — Mobile (Phase 4)**, per
`docs/PLAN_ATLAS_MIGRATION.md`. Note the scope boundary that has now bitten twice: the hub's
OWN mobile surfaces (segmented switch, ping sheet, FAB menu) shipped in Stage C per D5 —
Stage D is the GUIDE PAGES' mobile chrome, wired to the EXISTING `src/features/mobile-nav/`
models (rank/gesture/scrub/yield; botbar, swipe-tabs, day-scrub), whose constants the
creator's handoff prompt says to keep exactly. After D: Stage E (Tools) and Stage F (the
twelve features).

**Re-prompt the creator with:** "Atlas is live as the real hub and Stage C is closed. Next up
is Stage D — the guide pages' mobile chrome (bottom bar, swipe between groups, day scrubber,
yielding chrome), built on the mobile-nav models already in the repo. Want me to start there,
or would you rather do a visual-polish pass on the hub first?"
