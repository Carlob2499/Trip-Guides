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
complete**, only the flip (10) and checkpoint (11) remain.
`675fb67` (9) → `84b1cde` (7) → `ae26480` (8). Highlights:
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

**This session:** Stage C items 7, 8, 9 all shipped and verified — Stage C is now
content-complete. Only 10 (the flip) and 11 (the checkpoint) remain, and 10 is explicitly
gated on 11's creator GO.

**Recommended next step:** item 11, the end-of-stage checkpoint — screenshot desktop+mobile,
light+dark to the creator; ask the Sedona/Japan departure-airport question (D14/Clarifying
#1); surface the Tools-screen scope note (full README §5 screen later, or keep today's
guide-tab-link shortcut); get explicit GO. This needs the creator directly — it's not
something to keep pushing through solo. Once GO lands, item 10 (the flip) is comparatively
mechanical: `index.astro` becomes the hub in one commit, delete the old hub code/CSS, update
the tests that reference it.

**Re-prompt the creator with:** "Stage C of the Atlas migration is content-complete — the
globe, table view, cover/iris intro, full header chrome, view transitions, and mobile surfaces
are all built, tested, and live at `/atlas/` (not yet linked from the real nav). Before I flip
it to be the real hub: can you look at desktop + mobile screenshots, confirm Sedona/Japan's
departure airports, and say whether the Tools screen should get its own full build this round
or stay as today's shortcut into each guide's tools tab?"
