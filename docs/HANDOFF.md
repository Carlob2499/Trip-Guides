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

## Snapshot (2026-08-08 — Atlas migration Stage C, items 1–6, 9 of 11 shipped)

**Prior sessions shipped Stages A+B and Stage C items 1–6** (archive has full detail): feature
silo, atlas-map port, server-rendered table view, world view + pin-card solver, cover + iris —
all live-verified, `1e2c350`.

**This session: Stage C item 9 — Chrome.** Grew the item-6 `.atlas-header` shell with an
actions cluster: TOOLS (links into the quick-card guide's own tools tab, `#gtab-split` — no
standalone Tools screen this stage, see scope note below), ＋ New guide (`/new/`), theme
toggle (shared `initDarkToggle("btnDark")` from `src/scripts/theme.js`, same implementation
every other page uses). Added OG/description meta the hub page never had (no `og:image` — no
hub-level OG asset exists, omitted rather than fabricated). Relocated the old hub-foot's About
link into a new `.atlas-foot` at the bottom of the table view. **Deliberately not done:**
moving the WORLD|TABLE toggle bar into the header — the plan's item 9 line never asked for
it, and moving it would touch the already-verified `--hdr-h`-minus-44px globe height math;
that's item 8's (mobile) job to actually resolve. Ship loop green (build/lint/typecheck/1560
tests, unchanged count — composes already-tested shared pieces). Live-verified in
`astro preview`: correct TOOLS target (Sedona), theme toggle syncs `data-theme` +
`theme-color`, footer renders only in table mode, header wraps with zero overflow at 375px
(no screenshot — same frame-compositing tooling limit as item 6; confirmed via
`getBoundingClientRect`/`scrollWidth`). Grepped compiled `dist/atlas/index.html` for all of
the above.

**Scope note flagged, not resolved:** README describes a standalone cross-trip "Tools" screen
with its own trip picker (§5), but it is NOT one of Stage C's 11 numbered plan items — table
view's TRIP TOOLS row and the header's new TOOLS button both link into the quick-card guide's
own existing tools tab instead (`/guides/<slug>/#gtab-split`). Raise this explicitly at the
item-11 checkpoint.

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
