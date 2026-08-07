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

## Snapshot (2026-08-07, session #38 — denmark/Plan on Panels; migration is now provably one line)

**One commit (`02ffb9e`), live-verified.** The korea template held exactly as promised: denmark's
Plan group (9 homogeneous `panel` sections) migrated with ONE line of guide meta
(`"panelGroups": ["Plan"]`); the schema superRefine carried the whole contract. Gates green
(build · lint · typecheck · 1464 unit), dist + LIVE both serve `data-panel-scope="denmark:Plan"`,
korea:Essentials regression-checked. Preview-verified at 375px dark + desktop: collapse persists
across reload under `tg-panelcollapse-denmarkplan`; ready gate lands on `<html>`, not the grid
(worth remembering when probing). Deploy run 31179859022: build/deploy/verify-live all success.

**Panel-eligibility survey (full table in session transcript / scratchpad `classify.mjs`).**
Every group in all four guides classified. Remaining ELIGIBLE: korea/Pokémon GO (15 sections,
all carded — the big win), Transit in japan+korea+us, denmark/Essentials + japan/us Money & budget
(each carries the fullWidth `budget`), and four 1-section Sources/Health/Etiquette groups (a
1-panel grid may be design noise — creator call). No title blockers anywhere; EVERY blocked group
fails purely on non-carded types: `sights`/`venues` (the dominant blocker, the per-item-card
case), `days` (all four guides), `holidays` (all four Plan groups), `weather` (japan/us),
`divergences` (japan). Blocked-group migration = Phase 2 renderer work, not meta edits.

**Housekeeping:** stale `claude/phase-2-*` remote branch deleted (plus two orphaned git lock
files it left). GitHub reported 4 Dependabot vulns (3 high) on push — likely overlaps the
pending `pdfjs-dist` bump; untriaged.

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
- **Phase 2 remainder (the guide sheet, per design-handoff PROMPT.md):** the other 15 section
  renderers across the other guides/groups (days/sights/venues are the hard per-item-card case),
  masthead plate, graticule off photography, notation layer. korea/Essentials is the proven
  template: declare `panelGroups` in guide meta, schema gates the rest.
- Open Panels are TALL towers in narrow columns (~1.4–2k px; measured, accepted — collapse is the
  mitigation). If reading pain shows up, the fallback options from the grilling were: keep the
  inner lead/More-detail fold, or single-column panel groups.
- `.claude/launch.json` gained `astro-preview-alt` (:4323) because another session held :4322 — remove
  if it reads as debris; :4322 stays the canonical ship-loop surface.

## Where we left off

**Session #38 (2026-08-07):** the sanctioned second migration executed autonomously —
denmark/Plan onto Panels as `02ffb9e`, full ship loop green, live curl-confirmed, stale
phase-2 branch deleted. Then a survey pass classified every remaining group: 8 eligible
(meta-only migrations), the rest blocked solely on non-carded types. Mechanical work ran on
Sonnet subagents (gates, deploy watch, survey); no forks were taken silently.

**Recommended next step (forks for the creator, in order):** (1) batch-migrate the eligible
Transit + Money & budget groups (meta-only, korea pattern) — decide whether 1-section groups
(Sources ×4, Health, Etiquette) belong on a grid at all; (2) korea/Pokémon GO — 15 sections,
eligible but the tall-towers concern applies at that count; (3) start the blocked-type renderer
work (`sights`/`venues` per-item cards are the Phase 2 hard case; `holidays`/`weather`/`days`
next), or the masthead plate / notation layer per design-handoff PROMPT.md.

**Re-prompt the creator with:** "Denmark's Plan group is on Panels and live — and it cost
exactly what session #37 promised: one line of guide meta; the schema held everything else.
The full eligibility map now exists: eight more groups are one-line migrations (Transit
everywhere, the Money & budget pairs, Pokémon GO's fifteen), and everything else is blocked on
precisely the renderer work Phase 2 always owed — sights and venues as per-item cards. The
open forks are yours: whether one-section groups deserve a grid, whether Pokémon GO's tower
height is acceptable, and which blocked renderer to take first."
