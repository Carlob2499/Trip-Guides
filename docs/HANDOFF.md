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

## Snapshot (2026-08-06, session #34 — Atlas Phase 1.2: the Panel container exists and is live)

**Issue #35 shipped (`2f6f626`, CI 4/4 green, live).** The Panel is the Atlas container —
kicker, title, drag handle, collapse toggle, body — in `src/features/panel/` (sealed silo) +
`src/components/Panel.astro`, verified on `src/pages/panel-preview/` (fixture content through
the real silo, tool chrome, `?bare=1`, `?scope=` to prove isolation). Per CONTEXT.md it is a
CONTAINER, never a content type: **no guide section moved onto it** — that is Phase 2.

**The store records decisions BOTH ways, and that was a bug first.** v1 stored only collapsed
ids, so a Panel that ships collapsed and is OPENED by the reader silently re-collapsed on every
load. Absence now means "never touched" (markup default decides); `false` is a real recorded
decision. `setCollapsed` also refuses exactly what `parseCollapsed` would drop (`MAX_ID_LEN`,
`MAX_PANELS`) — **a decision that cannot survive the round trip must never be shown as taken.**

**The HIGH the review caught: restore was ANIMATING.** Server HTML never carries
`data-collapsed` for a storage-restored Panel, so it painted open, then the unconditional 350ms
transition animated it shut on every load. Fixed with a two-stage gate — `[data-panel-ready]`
set synchronously (shut at first paint), `[data-panel-anim]` a frame later (only the reader's
own toggles animate). Gating collapse on `ready` also fixed no-JS for free: no JS → every Panel
open, no toggle drawn. **Generalisable: any CSS-transitioned state restored by script needs the
transition gated behind the first paint, or the restore is visible as motion.**

**Three defects were found only by driving the real page, none by tests.** `?scope=` was read
from `Astro.url` on a PRERENDERED route, so every URL got Scope A (query params must be
resolved client-side); a collapsed Panel measured 20px, not 0, because `0fr` floors at the
grid item's own PADDING (moved to the last child's margin); the "ships collapsed" fixture was
missing its flag. The 805-green-test lesson from #33 held again.

**Method note.** Both `_tmp-*` Playwright specs (no-animate-on-restore via `addInitScript` +
`transitionstart`; no-JS via `javaScriptEnabled:false`) passed and were then DELETED — the study
route is explicitly deletable-without-a-trace and a test bound to it is a trap. Those two
invariants are verified but UNGATED; Phase 2 should re-assert them against a real guide page.

## Open items

- **Needs the creator:** ① decide the fate of LOCAL branch `worktree-agent-a7dc7eeb397c6a368`
  (progress-study design work, `5917f8f`, unreviewed — exists nowhere else; deleting it loses
  the work). **Still the only unpruned worktree**, deliberately preserved in #33; ② sign off
  revise-guide `land` default `draft` → `auto` + V6 Q4 thresholds (overall ≤3, pacing ≤2, ≥3
  skips); ③ Cloudflare dashboard Git integration builds "tripguides" on every push and fails
  in 0s — external config noise, consider disabling (deploy-worker.yml owns the real Worker
  deploy); ④ yes/no on giving skill-evals a `push: main, paths: .claude/skills/**` trigger —
  as written (`pull_request` only) it has fired 0 times ever because skills land by direct push;
  ⑤ **NEW:** add `.claude/worktrees/**` to `eslint.config.mjs`'s `ignores` so a future agent
  worktree cannot kill lint again (see snapshot). The `config-protection` hook blocks Claude
  from editing that file — a deliberate guard, not worked around. One line, creator's hands.
- Korea 03: critic flagged a swapped 명동 label on the Gyeongbokgung map point → file its issue.
- The S1–S5 research standards + dossier contract have never met a real research pass; the next
  new guide is the calibration test (a floor firing on a legitimately thin priority is data
  about the floor, not the guide).
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.
- feedback-export's Monday cron: proven working via dispatch (PR #32, merged), but the
  2026-08-03 08:13 scheduled fire never appeared. If next Monday's is also absent, investigate
  the schedule registration.
- `.card:has(.brow)` carries a 3px coloured `border-left` (`guide.css`) — incumbent and
  deliberate-looking, flagged in #33, not touched. Revisit if the card language is ever reworked.
- **Panel, deferred by design (#35):** the drag handle is inert markup + a 44px target until the
  reorder ticket; two tabs on one scope clobber each other's state (accepted, not accidental — a
  `storage` listener closes it if it ever matters); Phase 2 must enforce the prose tag allowlist
  when guide JSON renders inside a Panel, never raw `set:html` as the fixtures do.
- Dependabot: 1 HIGH advisory open on `main` (alert 13), predates #35, untriaged.

## Where we left off

**Session #34 (2026-08-06):** built and shipped Atlas Phase 1.2 — the Panel container (issue
#35) with per-scope persisted collapse, its sealed silo, and the `panel-preview` design study.
One commit (`2f6f626`, 11 files), CI 4/4 green, route confirmed live at
`/Trip-Guides/panel-preview/`. An independent review found 1 HIGH + 6 MEDIUM + 2 LOW; 1 HIGH
and 5 MEDIUM fixed, 1 MEDIUM reframed, both LOWs closed with tests (32 model tests).

**Recommended next step:** Phase 2 (migrate a real guide section onto a Panel) — or triage the
Dependabot HIGH first, which is the only thing on `main` currently flagged.

**Re-prompt the creator with:** "The Panel exists and it's live. Three of its bugs were
invisible to the test suite and only fell out of driving the real page: `?scope=` was read from
`Astro.url` on a PRERENDERED route so every URL got Scope A; a collapsed Panel measured 20px
because `0fr` floors at the grid item's own padding, not its content; and the persistence model
could only record 'collapsed', so a Panel that ships collapsed silently re-collapsed itself
every time you opened it. That last one set the rule the store now follows: absence means never
touched, `false` is a real decision, and `setCollapsed` refuses anything `parseCollapsed` would
drop — a decision that can't survive the round trip must never be shown as taken. The review's
HIGH was the one I'd have shipped blind: the restore ANIMATED, so every collapsed Panel painted
open and slid shut over 350ms on every load. Two-stage gate fixes it — `[data-panel-ready]`
synchronously, `[data-panel-anim]` a frame later — and gating collapse on `ready` gave no-JS
readability for free. Generalise it: any script-restored CSS state needs its transition held
until after the first paint. One thing I deliberately left ungated — the two Playwright specs
proving no-animate-on-restore and the no-JS fallback passed, then I deleted them, because the
study route is meant to be deletable and a test bound to it is a trap. Phase 2 should re-assert
both against a real guide page."
