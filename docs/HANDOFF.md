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

## Snapshot (2026-08-08 — Atlas migration **Stage D COMPLETE**; C+D both shipped)

Two stages closed this session. **Stage C (the flip, `cd94ab5`+`93e1657`)**: `atlas.astro`
became `index.astro`, so the Atlas hub (cover, globe, server-rendered table, mobile FAB +
ping sheet) is what the live site now serves; `/atlas/` is gone and the old hub is deleted
(overture.js, hub-live-cards.js, hub.css, hub-cards.css, hub-motion.css, `features/hub`'s
index.js + ui/hub.js). `gsap-hero.js`/`hero-parallax.js` were KEPT against the plan's own
item-10 wording — `GuideLayout.astro` imports both for the guide masthead; only the HUB's use
of them died. Details in the archive.

**Stage D (`60d9da2`) — audited first, per the creator's audit-then-rebuild call.** The
`src/features/mobile-nav/` models were already 100% on-spec (every constant matched: yield
80/24/6/140, gesture 24/0.3/0.5, track 0.9, rubber-band 0.28 capped 56, slotLabel 9), with
swipe, day-scrub, overlay stand-down and resume lines correctly wired to them — so **nothing
there was rebuilt.** The defect was elsewhere:

- **`viewport-fit=cover` was missing from every page**, so `env(safe-area-inset-*)` always
  reported 0 and the ENTIRE cutout layer — including Stage C's own hub FAB/menu/ping-sheet
  insets — had shipped inert, undetectably (a device with no notch and a page missing the
  meta look identical). Added to all four pages; 5 bare `env()` sites converted to
  `max(reserved, var(--safe-*))`; guard added where there was none (topbar incl. landscape
  sides, toast, field toast, Today chip, SOS button, spine rail); `body.chrome-yield .topbar`
  no longer drops the inset while compacting.
- **Two PRE-EXISTING bugs** fixed en route, both confirmed pre-existing by re-running the
  gates on a stashed build (I first misread one as my own regression): the colophon sits
  AFTER `.content`, so that element's 6rem bar clearance never covered it and the fixed
  bottom bar made the footer's "Request a change" pill unclickable at phone width; and
  `panels.spec.ts` counted `[data-panel-grid] [data-panel]` page-wide against a hard 9 —
  correct only when Essentials was korea's sole panel group, but korea now declares 11, so
  the gate was failing on content growth rather than any Panel regression.
- Groups sheet gained the README's per-section **card count** (derived from the guide's own
  buckets; numeral aria-hidden with a spoken equivalent beside it).
- **NEW GATE `tests/visual/safe-area.spec.ts`** — asserts every page carries
  viewport-fit=cover AND that chrome actually moves under injected insets (a page could carry
  the meta and still hard-code padding). Verified it FAILS when viewport-fit is removed.

Gates on all three commits: build · lint · typecheck 0 errors · 1560 unit · 102/102 Playwright
(incl. 21 a11y) · perf budget OK (d3/topojson still lazy) · zero `src/content/guides/` diffs.
All CI workflows green, deploy confirmed live.

**Decision CLOSED (do not re-ask):** Sedona/Japan airports — no such fact exists; neither
trip has booked flights. Creator expects the NYC area and will say when scheduling happens.
**NOT closed, despite an earlier draft of this file claiming it was:** the Tools-screen
question was PUT to the creator and DISMISSED, never answered — their "we don't need those"
referred to the airports. Today's per-guide tools-tab shortcut is simply what happens to be
built; treat it as an open question for Stage E, not a ruling.

## Open items

- **Hub visual fidelity — OPEN.** The flip shipped with gaps the creator can see and this
  assistant has not enumerated. Not scheduled against Stage D either way; ask which to do
  first rather than assuming. `docs/design-handoff/enforcement/` + CLAUDE.md's "Design
  Fidelity" section carry the authority order and the kit's known false positives.
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

**This session:** Stages C and D both closed — Atlas is the live hub and the mobile cutout
layer actually works now. All gates green, deploy live.

**TWO THINGS WAITING ON THE CREATOR:**
1. **The bottom bar is an unresolved A/B.** The design README specs four slots (two content
   groups, ALL, TOOLS); the shipped bar has five and replaced the second group with the tool
   slot on the creator's own 2026-07-30 ruling. Rebuilding to spec would have silently
   reversed that, so BOTH ship: `?bar=spec` and `?bar=app` switch the running site per device,
   default unchanged. The creator wants to compare on a phone. **Ask which wins, then delete
   the loser** — an A/B left in place indefinitely is drift, not a feature.
2. **Hub visual fidelity is still OPEN** (see Open items). Unenumerated; the creator can see
   gaps this assistant has not catalogued.

**Recommended next step:** **Stage E — Tools (Phase 5)**, per
`docs/PLAN_ATLAS_MIGRATION.md`. The README's standalone cross-trip Tools screen was never
built and its fate was never decided — every TOOLS entry point currently links into that
guide's own tools tab. **Stage E must ASK first**, not inherit that as settled. After E: Stage F (the twelve features), then G (closeout).

**Re-prompt the creator with:** "Stages C and D are done — Atlas is the live hub and the
notch/home-indicator handling now actually works (it was silently dead before). Two things
need you: which bottom bar wins (open your phone on any guide, compare `?bar=app` vs
`?bar=spec`), and whether Stage E should build the standalone Tools screen or keep today's
shortcut. Also still open whenever you want it: the hub visual gaps you spotted."
