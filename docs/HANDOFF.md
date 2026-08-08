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

## Snapshot (2026-08-08 — Atlas migration Stage C, items 1–9 of 11 shipped)

**Prior sessions shipped Stages A+B and Stage C items 1–6** (archive has full detail): feature
silo, atlas-map port, server-rendered table view, world view + pin-card solver, cover + iris —
all live-verified, `1e2c350`.

**This session: items 9 (Chrome), 7 (view transitions), 8 (mobile) — Stage C is now content-
complete**, only the flip (10) and checkpoint (11) remain. `675fb67` → `84b1cde` →
(item 8, uncommitted at summary time — commit next). Highlights:
- **9 Chrome**: header actions cluster (TOOLS → quick-card's tools tab, ＋ New guide, theme
  toggle via shared `initDarkToggle`), OG/description meta (no `og:image` — no hub-level OG
  asset exists, honest omission), About link relocated to a `.atlas-foot` in the table view.
- **7 View transitions (D22)**: imported `transitions.css` (supplies the calm 420ms named-group
  morph timing — `navigation:auto` itself was already live site-wide via `base.css`). Pin-card
  cover images now carry `view-transition-name:cover-<slug>`, matching the guide masthead.
- **8 Mobile (<760px, D5)**: new `atlas-mobile.css` + `world-view.js` additions. Bare pings (no
  floating pincard on mobile — `runSolve` gates on live `matchMedia`), a bottom ping sheet on
  pin tap (mobile) vs direct navigate (desktop, unchanged), a 52px FAB ☰ menu carrying the
  desktop rail's own actions (fly to a sheet, fit world, pause spin, tools, ＋ new guide), and
  header collapse (TOOLS + "New guide" label hide under 759px). Corrected a phrasing bug from
  an earlier HANDOFF draft along the way: Stage D's `mobile-nav` models are the GUIDE page's
  mobile chrome, unrelated to this item.

All three: ship loop green (build/lint/typecheck/1560 tests, unchanged count throughout — no
new pure logic, only composition/DOM-wiring of already-tested pieces), live-verified in
`astro preview` (desktop + 375px, dark theme), dist grepped for every new artifact. No
screenshot capability this session (frame-compositing tooling limit) — verified via
`getBoundingClientRect`/`getComputedStyle`/synthetic-event dispatch instead throughout.

**Scope note flagged, not resolved:** README describes a standalone cross-trip "Tools" screen
with its own trip picker (§5), but it is NOT one of Stage C's 11 numbered plan items — every
TOOLS entry point built this stage (table row, header button, mobile FAB menu) links into the
quick-card guide's own existing tools tab instead (`/guides/<slug>/#gtab-split`). Raise this
explicitly at the item-11 checkpoint.

## Open items

- **Needs the creator, at Stage C's item-11 checkpoint (not before):** (1) screenshot sign-off
  desktop+mobile, light+dark; (2) Sedona/Japan departure-airport confirmation (D14/Clarifying
  #1); (3) the Tools-screen scope note above — build the full README §5 screen later, or keep
  the guide-tab-tab-link shortcut; (4) explicit GO before the flip commit ships.
- LOCAL branch `worktree-agent-a7dc7eeb397c6a368` (progress-study, `5917f8f`, exists nowhere
  else) — keep or lose.
- Cloudflare dashboard Git integration still failing 0s builds on every push — consider disabling.
- Korea 03: critic flagged a swapped 명동 label on the Gyeongbokgung map point → file its issue.
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.

## Where we left off

**This session:** Stage C item 9 (Chrome) shipped and verified. Items 7, 8, 10, 11 remain:
view transitions (D22), mobile <760px (wire to existing `mobile-nav` models, and actually
give WORLD|TABLE a responsive treatment), the flip commit itself (not pushed until item 11's
GO), and the item-11 creator checkpoint.

**Recommended next step:** continue Stage C at item 8 (mobile) — the one substantial item
left before the flip. Item 7 (view transitions) is small and can slot in wherever convenient,
before or after 8. Save the flip (10) and checkpoint (11) for last, once everything else is
verified.

**Re-prompt the creator with:** "Stage C of the Atlas migration is under way — the globe, table
view, pin-card solver, cover/iris intro, and now the full header chrome are built, tested, and
live at `/atlas/` (not yet linked from the real nav). Remaining: mobile layout, view
transitions, and then the flip itself — which needs your explicit go-ahead before it ships,
plus your call on Sedona/Japan's departure airports and whether the Tools screen gets built
this round or later."
