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

## Snapshot (2026-08-08 — Atlas migration Stage C, items 1–6 of 11 shipped)

**Prior sessions shipped Stages A+B and Stage C items 1–5** (archive has full detail):
feature silo, atlas-map port, server-rendered table view, world view + pin-card solver, all
live-verified, `65e2561`.

**This session: Stage C item 6 — cover + iris (D21)**. `src/features/atlas/ui/cover.js`
(`initCover`) + `src/styles/atlas-cover.css`: fade/FLIP/iris dismiss sequence ported from the
prototype for timings, plus `reducedMotion()`-gated single-cut and real keyboard/focus support
the prototype lacked. Discovered mid-item that the FLIP needs a header wordmark to FLIP into,
and Stage C hadn't built one yet (that's item 9's job) — built the minimal `.atlas-header`
shell (brand mark + wordmark only) as a genuine dependency, not scope creep; item 9 adds the
rest of the row around it. Its height now feeds `--hdr-h` via a small `ResizeObserver`. No-JS
safety (D4): `.atlas-cover` is `display:none` by default, `[data-open]` only after JS confirms
`sessionStorage` hasn't seen it this session — confirmed in the compiled `dist/` CSS, not just
source. `flyIn` targets the same relevance-ordered "quick" trip the table view's quick card
already uses (content is king). Ship loop green (build/lint/typecheck/1560 tests); the closed
type-scale test caught 4 literal font-sizes, fixed to existing tokens. Live-verified in
`astro preview`: fade + FLIP transform (against real measured rects), dark theme, mobile
375px, and the sessionStorage gate all correct. Not directly observed: the iris mask's own
`requestAnimationFrame` loop — same frame-compositing tooling limit the prior session hit,
verified by code review instead (unmodified port of the prototype's own formula).

**Scope note flagged, not resolved:** README describes a standalone cross-trip "Tools" screen
with its own trip picker (§5), but it is NOT one of Stage C's 11 numbered plan items — table
view's TRIP TOOLS row links into the quick-card guide's own existing tools tab instead
(`/guides/<slug>/#gtab-split`). Raise this explicitly at the item-11 checkpoint.

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

**This session:** Stage C item 6 (cover + iris) shipped and verified. Items 7–11 remain: view
transitions (D22), mobile <760px (wire to existing `mobile-nav` models), chrome (hub header/OG/
skip-link — grow the item-6 header shell into the full row here; resolve the Tools-scope note),
the flip commit itself (not pushed until item 11's GO), and the item-11 creator checkpoint.

**Recommended next step:** continue Stage C at item 8 (mobile) or item 9 (chrome) — either is
self-contained; item 9 naturally extends the header shell item 6 already built. Item 7 (view
transitions) is small and can slot in wherever convenient. Save the flip (10) and checkpoint
(11) for last, once everything else is verified.

**Re-prompt the creator with:** "Stage C of the Atlas migration is under way — the globe, table
view, pin-card solver, and now the cover/iris intro are built, tested, and live at `/atlas/`
(not yet linked from the real nav). Remaining: mobile layout, the full hub header, and then the
flip itself — which needs your explicit go-ahead before it ships, plus your call on Sedona/
Japan's departure airports and whether the Tools screen gets built this round or later."
