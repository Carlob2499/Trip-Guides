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

## Snapshot (2026-08-08 — Atlas migration Stage C started, items 1–5 of 11 shipped)

**Prior session shipped Stages A+B** (archive has full detail): Stage A closed all 11
guide-sheet gaps (flag chips, gap state, masthead plate number, popover conformance, day-scrub
sticky fix, closed-days, venues grid, collapse-all, hash auto-expand). Stage B built the
invisible data layer Stage C needed: airport gazetteer, the reserved `traveler-origin` fact row
(D14/ADR 0003), tz backfill, per-guide atlas record derivation, vendored world TopoJSON, the
search-index build step. A same-session Fable-5 review caught and fixed the D6 180-day
plate-renumbering time bomb, a popover order regression, and a missing viewport clamp (`c872ec3`).

**This session: Stage C — the hub, items 1–5 of 11**, `65e2561`. Built ASIDE at
`src/pages/atlas.astro` (dev-only, unlinked from live nav — `index.astro` untouched, D1 intact):
pin-card collision solver (`src/features/atlas/model/solver.ts`, ported from the design-handoff
prototype, 9 tests); `<atlas-map>` globe element ported with the required D19/D21 changes
(guides/anchors/origins now arrive via a `.guides` property, never module constants; route arcs
are per-guide from that guide's own confirmed origin — the prototype's single shared "home base"
is gone; reduced-motion is live-listened; d3/topojson-client load via lazy `import()`); the
server-rendered table view (D4 — search, quick card, sheet list, all live-verified in-browser);
world-view assembly (globe mounts, pins solve with zero overlaps, zoom/fit/pause/toast/mode-toggle
all verified via direct DOM/JS invocation — this session's browser pane couldn't composite frames
for screenshots/rAF, a tooling limit, not a code defect). Found and fixed a real load-bearing gap
along the way: `content.config.ts`'s guideLoader interpolated `facts.json` into prose but then
DISCARDED the registry, so nothing downstream of `getCollection` could ever read a fact's own
state — Stage B's `traveler-origin` arcs were unreachable until now. Also hardened
`check-perf-budget.mjs`'s on-demand-chunk detection from a fragile `pdf`-only name regex to a
structural "absent from every page's first-paint closure" check (d3's Rollup output has no
stable name to match). Ship loop fully green (build/lint/typecheck/1560 tests/perf-budget);
content-preservation gate clean (zero `src/content/guides/` diffs); CI confirms live
(Tests/Deploy/Accessibility 23/23 all passed on `65e2561`).

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

**This session:** Stage C items 1–5 (feature silo, atlas-map port, table view, world view +
solver) shipped and verified, `65e2561`, live. Items 6–11 remain: cover + iris (D21), view
transitions (D22), mobile <760px (wire to existing `mobile-nav` models), chrome (hub header/OG/
skip-link — resolve the Tools-scope note here), the flip commit itself (not pushed until item
11's GO), and the item-11 creator checkpoint.

**Recommended next step:** continue Stage C at item 6 (cover + iris) — it's self-contained and
doesn't depend on anything not yet built. Items 8 (mobile) and 9 (chrome) are the next-largest;
save the flip (10) and checkpoint (11) for last, once everything else is verified.

**Re-prompt the creator with:** "Stage C of the Atlas migration is under way — the globe, table
view, and pin-card solver are built, tested, and live at `/atlas/` (not yet linked from the real
nav). Found and fixed a real bug along the way: the traveler-origin data from Stage B couldn't
actually reach anything downstream, so the globe's route arcs would have silently never drawn.
Remaining: the cover/iris intro, mobile layout, the hub header, and then the flip itself — which
needs your explicit go-ahead before it ships, plus your call on Sedona/Japan's departure
airports and whether the Tools screen gets built this round or later."
