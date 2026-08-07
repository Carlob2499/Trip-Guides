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

## Snapshot (2026-08-07, session #38 — 2 → 22 groups on Panels; weather/holidays hostable)

**Three commits (`02ffb9e`, `a54f5e2`, `a13e76e`), each full-ship-loop green and live-verified.**
Creator granted mid-session judgment authority ("pick, judge, iterate — migrate before deciding").
Course: denmark/Plan first (the sanctioned step), then a survey classified every group, then ALL
14 eligible groups migrated meta-only, then the first blocked-type renderer work landed.

**`a13e76e` — the pattern for hostable-but-not-carded types.** `PANEL_HOSTABLE_TYPES`
(section-types.ts) = CARDED + `weather` + `holidays`. They render `bare` inside a Panel (the
Panel draws the title) and KEEP their hide-on-empty wrapper; the silo hides the whole Panel
around it (`.pnl:has(.wx-wrap[hidden])` — live CSS because weather unhides client-side on fetch
success). Honest-blank preserved, no orphaned heading either way. Forced both directions in
preview (unhide → Panel appears → re-hide). This unblocked Plan ×4 + denmark/Transit. NOTE:
japan holidays data file absent at build → hidden Panel (pre-existing legacy behavior, now
consistent); korea's renders the reassuring no-holiday state.

**Polish found by preview judgment:** 1-panel grids drew a dead reorder grip — hidden via
`:only-child` (self-revives when a group grows). Scope keys distinct incl. non-ASCII
(`koreapokmongo`); ready gate lands on `<html>`, not the grid (remember when probing);
Astro INLINES panel CSS per-page — grep dist HTML, not `_astro/*.css`.

**Remaining blocked = the true renderer phases:** `sights`/`venues` (per-item-card hard case),
`days` (all guides), `divergences` (japan, moot — its group also has sights). Plus masthead
plate, graticule, notation layer per design-handoff PROMPT.md. No meta edits left to make.

**Housekeeping:** stale `claude/phase-2-*` remote branch deleted (plus two orphaned git lock
files). GitHub reports 4 Dependabot vulns (3 high) on every push — likely overlaps the pending
`pdfjs-dist` bump; untriaged.

## Open items

- **Needs the creator:** (1) LOCAL branch `worktree-agent-a7dc7eeb397c6a368` (progress-study,
  `5917f8f`, exists nowhere else) — keep or lose; (2) sign off revise-guide `land` default `draft` →
  `auto` + V6 Q4 thresholds; (3) Cloudflare dashboard Git integration still failing 0s builds on every
  push — consider disabling; (4) skill-evals `push` trigger yes/no (fired 0 times as
  `pull_request`-only).
- `pdfjs-dist` 6.1.200 → 6.2.108 pending (triaged session #36, archive has detail; not urgent).
  Cross-check against the 4 Dependabot vulns (3 high) GitHub flagged on the 2026-08-07 push.
- Korea 03: critic flagged a swapped 명동 label on the Gyeongbokgung map point → file its issue.
- S1–S5 research standards + dossier contract still await their first real research pass.
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.
- feedback-export Monday cron: if 2026-08-10's scheduled fire is also absent, investigate.
- `.card:has(.brow)` 3px `border-left` — incumbent, revisit only if card language reworked.
- **Panel, still deferred by design:** two tabs on one scope clobber each other's collapse state
  (accepted); story-mode's accent mixes ride a fixed dark ground with no contrast gate (residual
  risk, #38). The #35-era items (allowlist gate, no-JS/no-animate gates, reset control) shipped
  this session — #40/#41.
- **Phase 2 remainder (the guide sheet, per design-handoff PROMPT.md):** only the hard
  renderers remain — `sights`/`venues` per-item cards, `days`, plus masthead plate, graticule
  off photography, notation layer. Every meta-only migration is done (22 groups live).
- Open Panels are TALL towers in narrow columns (~1.4–2k px; measured, accepted — collapse is the
  mitigation). If reading pain shows up, the fallback options from the grilling were: keep the
  inner lead/More-detail fold, or single-column panel groups.
- `.claude/launch.json` gained `astro-preview-alt` (:4323) because another session held :4322 — remove
  if it reads as debris; :4322 stays the canonical ship-loop surface.

## Where we left off

**Session #38 (2026-08-07):** creator granted judgment authority mid-session; the whole
migratable surface shipped in three live-verified commits — denmark/Plan (`02ffb9e`), all 14
survey-eligible groups + dead-grip fix (`a54f5e2`), weather/holidays hostable + Plan ×4 +
denmark/Transit (`a13e76e`). 22 groups on Panels, 1465 tests, every deploy verify-live green.
Mechanical work ran on Sonnet subagents (4 gates runs, 3 deploy watches, survey); judgment
calls (1-section groups migrate for uniformity, Pokémon GO ships at 15 with collapse as the
mitigation, empty-Panel semantics) taken and documented, none silently.

**Recommended next step:** the `sights`/`venues` per-item-card renderer — the Phase 2 hard
case, deliberately left for a fresh session. Open with the design questions: does each
sight/venue item become its own Panel (title = storage id per item), or does the SECTION
become one Panel hosting its item cards whole? How do per-item `map`/`place_id`/checklist
interactions survive reorder? Alternatively: masthead plate / notation layer (independent,
smaller). Also due: triage the 4 Dependabot vulns against the pdfjs-dist bump.

**Re-prompt the creator with:** "Everything migratable is on Panels — twenty-two groups
across all four guides, up from two this morning. The day's pattern: your 'migrate first,
decide later' was right — the one-panel-group question dissolved once a dead grip was the
only real cost, and Pokémon GO's fifteen panels read fine with collapse doing its job.
Weather and holidays crossed over too, with their honest-blank contract intact: an empty
panel hides whole, title and all, live. What remains is the work that was always the hard
part — sights and venues as per-item cards — and that starts with a design decision, not a
meta line: is the ITEM the Panel, or the section?"
