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

## Snapshot (2026-08-06, session #37 — first real guide group on Panels; deploy fix PROVEN)

**Two commits (`cb5f88d` #40, `f20dcda` #41), both issues closed, live-verified.** Design tree
settled by a grilling round first (creator picked korea/02-essentials + persist-collapse; fold and
fullWidth forks closed on recommendation), then full-authority execution: issues filed by a Haiku
subagent, two-axis review before push.

**#40 — the allowlist has one home.** `findUnsafeHtml`/`ALLOWED_TAGS` extracted to
`src/lib/prose-html.ts`; the schema imports it and `prose-html.test.ts` walks every panel-preview
fixture body through the SAME check (the one HTML surface the collection schema never saw). Forced
failure proven.

**#41 — korea/Essentials = 9 Panels.** The Panel ABSORBS the block identity (anchor id, data-cat,
provenance attrs, # chip) — reorder moves grid.children, so a wrapper is structurally impossible.
Bodies whole (`whole` prop skips splitLead; one disclosure per card). `panelGroups` is guide meta,
schema-gated: group exists, all carded, all titled, titles unique (the title IS the storage id).
budget is the one fullWidth type — `src/lib/section-types.ts` is shared by renderer + schema so they
can't drift. Scope `korea:Essentials` per GROUP. Deep links force-open without persisting (toggle
reads the DOM, not the store, so the next click stays honest). Reset control is the guide surface's,
drawn only while a custom order exists. `.catblock:has(.pnl-grid)` opts out of desktop masonry.

**The gates' honest finding.** Headless Chromium does not paint before the silo's boot task, so a
boot-restored Panel can NEVER animate in the harness — the no-animate-on-restore outcome assertion
was green even with the stagger deliberately collapsed. The gate now pins the MECHANISM
(`data-panel-anim` must land a MutationObserver batch after `data-panel-ready`; same-task writes
share a batch) and THAT failed correctly when forced. Lesson for the book: when the outcome is
unobservable in your harness, gate the mechanism — and only a forced failure tells you which one
you have.

**Review earned its pass: 6 findings, all fixed.** HIGH: progress rings froze at 0/N inside Panels
(`anchors.js` `.closest(".card")` → `.card, .pnl`). MED: palette jumps now set the hash so a hit
inside a collapsed Panel opens it; hash navigation re-scrolls after the resort (the opened Panel
moves up-band, stranding the viewport); schema rejects duplicate titles per group. LOW: scrollspy
sorts by visual order after reorder; a vacuous spec assertion made real.

**Deploy fix (#36) PROVEN.** `f20dcda` was the first real-content push since `661b5a7`:
build/deploy/verify-live ALL green — verify-live actually ran, and the live korea page serves the
Panel grid (curl-confirmed `data-panel-scope="korea:Essentials"`). All four workflows green.

## Open items

- **Needs the creator:** (1) LOCAL branch `worktree-agent-a7dc7eeb397c6a368` (progress-study,
  `5917f8f`, exists nowhere else) — keep or lose; (2) sign off revise-guide `land` default `draft` →
  `auto` + V6 Q4 thresholds; (3) Cloudflare dashboard Git integration still failing 0s builds on every
  push — consider disabling; (4) skill-evals `push` trigger yes/no (fired 0 times as
  `pull_request`-only).
- Branch `claude/phase-2-design-implementation-2ydnnn` on the remote carries nothing main lacks;
  deploy fix now proven — safe to delete.
- `pdfjs-dist` 6.1.200 → 6.2.108 pending (triaged session #36, archive has detail; not urgent).
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

**Session #37 (2026-08-06):** Phase 2 opened for real. A grilling round settled the design tree
(korea/02-essentials first, persist-collapse accepted, bodies whole, budget-only fullWidth), then
full authority: #40 (allowlist → `src/lib/prose-html.ts`, fixtures gated) and #41 (Essentials → 9
Panels) shipped as `cb5f88d` + `f20dcda`, two-axis reviewed (6 findings, 1 HIGH, all fixed),
full ship loop green (1464 unit · 99 e2e incl. 3 new Panel gates · axe 23 · live curl-confirmed).
Both issues closed. The #36 deploy fix proved out on this push — verify-live ran and passed.

**Recommended next step:** extend `panelGroups` to a second group/guide (denmark/01-plan is 9
homogeneous panel sections — the low-risk second step), or start the guide-sheet remainder
(masthead plate / notation layer). Delete the stale `claude/phase-2-*` remote branch.

**Re-prompt the creator with:** "The first real guide content is living on Panels — korea's
Essentials: nine sections, collapse and order persisting per reader, budget spanning the row,
deep links that open what they point at. The pattern that earned its keep this session: every
gate was forced to fail before it counted, and one refused — headless Chromium cannot animate a
boot restore at all, so the no-animate gate was quietly proving nothing. It now pins the
mechanism (anim lands a task after ready) and THAT fails when broken. The review pass also paid
for itself: the checklist progress ring on Panel-hosted cards shipped frozen at 0/N and no test
or visual pass could see it — `.closest('.card')` simply missed `.pnl`. Migration for the next
group is now one line of guide meta plus the schema holding the rest."
