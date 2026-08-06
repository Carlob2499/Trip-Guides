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
  `docs/COMPETITIVE_LANDSCAPE.md` (market parity reference).

## Snapshot (2026-08-06, session #35 — Panel primitive COMPLETE + two platform gates)

**Four issues shipped, four commits, each reviewed (2-axis) then pushed:** #36 grid
(`43a05fa`), #37 reorder (`f2f7fad`), #38 accent-ink (`ba50b3d`), #39 lint/CI scope
(`5f3e52f`). All closed. Phase 2 onward is now "move this section onto a Panel", never
"invent another container".

**#36 — the grid.** Pure sort model (`model/sort.ts`): full-width band first, open before
collapsed, tie-break = declared order; rules COMPOSE (a collapsed full-width Panel stays in
its band). ui/grid.js moves REAL DOM nodes so tab/reading order match the screen; resort
waits for the collapse transition (immediate when transitions are off = reduced motion).
Caught live, not by tests: `grid-column-end:-1` PINS the last Panel to the final column and
strands the hole mid-row — the last-row fill is a measured span, recomputed on resort/resize.

**#37 — reorder.** `model/order.ts` (move/clamp/no-op; saved order reconciled: stale ids
drop, NEW ids append at the end, never shuffled into the reader's arrangement). Drag = live
node moves, drop commits, cancel reverts, a drag that never moved records NOTHING; keyboard
arrows/Home/End on the grip button; live region announces where the Panel actually LANDED —
"stays at position N" when the bands refuse. Per-scope key `tg-panelorder-*`; reset via
`[data-panel-order-reset]` (hidden until wired). Grip drawn only under `[data-panel-reorder]`.

**#38 — the cascade lesson.** A custom property substitutes its var()s on the element that
DECLARES it — :root's `--accent-ink:var(--accent-ink-light)` resolved once at :root and every
hub card inherited the HOUSE ink while its own inline candidates sat unread. Fix: carrier
rules (`[style*="--accent-ink-light"]` re-declares locally + dark partners). Gates (both past
occurrences covered): rendered per-carrier check hub+guide/both themes (forced-failure
proven), and a source denylist (accent text never from --accent raw/color-mix/candidate).
**The source gate's FIRST run found occurrences 3+4:** change-request micro text painted raw
--accent (fixed), story-mode's fixed-dark overlay (allowlisted with reasoning + staleness
check). Gates that fire on their first run are the ones earning their place.

**#39 — same lesson, meta.** The new divergence gate (lint scope ⊆ CI scope, read from
test.yml itself) ALSO fired on first run: docs/mockups/*.mjs are deliberately linted but
docs/** pushes skipped CI. CI now follows lint (docs/** out of paths-ignore; md-only commits
still skip). The creator's 82ed519 had already applied the immediate unblock.

## Open items

- **Needs the creator:** ① LOCAL branch `worktree-agent-a7dc7eeb397c6a368` (progress-study,
  `5917f8f`, exists nowhere else) — keep or lose; ② sign off revise-guide `land` default
  `draft` → `auto` + V6 Q4 thresholds; ③ Cloudflare dashboard Git integration still failing
  0s builds on every push — consider disabling; ④ skill-evals `push` trigger yes/no (fired 0
  times as `pull_request`-only). (Old ⑤ eslint worktrees ignore: DONE by creator in 82ed519.)
- Korea 03: critic flagged a swapped 명동 label on the Gyeongbokgung map point → file its issue.
- S1–S5 research standards + dossier contract still await their first real research pass.
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.
- feedback-export Monday cron: if 2026-08-10's scheduled fire is also absent, investigate.
- `.card:has(.brow)` 3px `border-left` — incumbent, revisit only if card language reworked.
- **Panel, deferred by design:** two tabs on one scope clobber each other's collapse state
  (accepted); Phase 2 must enforce the prose tag allowlist inside Panels (fixtures use raw
  `set:html`); Phase 2 should re-assert no-animate-on-restore + no-JS against a real guide
  page (verified, deleted with the `_tmp-*` specs, still ungated); guide surfaces must render
  their own reset-order control — the Panel component deliberately carries none; story-mode's
  accent mixes ride a fixed dark ground with no contrast gate (recorded residual risk, #38).
- Dependabot: 1 HIGH advisory open on `main` (alert 13), predates #35, untriaged.
- `.claude/launch.json` gained `astro-preview-alt` (:4323) because another session held :4322
  — remove if it reads as debris; :4322 stays the canonical ship-loop surface.

## Where we left off

**Session #35 (2026-08-06):** shipped issues #36+#37 (the Panel grid + reorder — the Panel
primitive is COMPLETE) and #38+#39 (accent-ink carrier fix + lint/CI divergence gate). Four
commits (`43a05fa`, `f2f7fad`, `ba50b3d`, `5f3e52f`), each two-axis reviewed before push;
1447 tests green; all four issues closed. PC shut down on creator's request after the final
push — CI for `5f3e52f` was in progress (Tests/A11y/Deploy) and unverified-live; check it
first thing.

**Recommended next step:** confirm `5f3e52f`'s CI went green + site live, then Phase 2
(migrate the first real guide section onto a Panel) — or triage the Dependabot HIGH.

**Re-prompt the creator with:** "The Panel primitive is complete — grid, collapse, reorder,
persistence — and the pattern that kept repeating this session is worth naming: three gates
fired on their FIRST run. The accent gate found two more live accent-as-text improvisations
the moment it existed; the lint-scope gate found docs/mockups already diverged; and the
forced-failure pass proved the rendered gate actually fails when the fix is removed. The
doctrine held: a gate that has never failed is an assumption, not a gate. Two cascade rules
also joined the permanent lesson book: a custom property resolves its var()s on the element
that DECLARES it (so inline candidates need carrier re-resolution rules), and
`grid-column-end:-1` pins rather than spans (so the no-dead-space fill must be measured in
JS). Phase 2's list is stacked in Open items — the tag allowlist inside Panels is the one
with teeth."
