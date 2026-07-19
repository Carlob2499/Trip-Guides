# HANDOFF — read this first, then re-prompt the creator

> **Ritual (binding):** at SESSION START, read this file INSTEAD of re-deriving history from
> the conversation, memory sprawl, or git log — it is the single warm-start context. Then
> greet the creator with the **"Where we left off"** line below and the recommended next step.
> At SESSION END, rewrite the Snapshot + Where-we-left-off sections (keep this header), commit.
> Keep it under ~80 lines — a handoff, not a chronicle. Deep context lives in the north-star
> docs it links; only follow those when the task actually needs them.

## Operating rules (stable — rarely change)

- **Model economy:** research/recert/fact edits run on **Sonnet** (light Opus only for a
  contested reconcile). Fable/Opus = design sessions only, on exception. Binding detail:
  `.claude/skills/waypoint-guide-author/references/research-efficiency.md`.
- **Never number guides as milestones** — the product is the backbone; a new guide is the
  backbone exercising.
- Ship loop on every change: build → test → `astro preview` :4322 (never `astro dev`) →
  grep `dist/` → commit → push.
- North stars: `docs/PIPELINE.md` (generation/maintenance) · `docs/VISUAL_COVERS.md` +
  `docs/MOTION.md` (presentation/motion) · `docs/GUIDE_RUBRIC.md` (quality bar).

## Snapshot (updated 2026-07-19, session close)

**The pipeline is now fully autonomous end-to-end, with live progress tracking.** Explicit
goal this session: an end-user inputs trip info and sees a finished guide with no other
input — no approval step in between — plus a timer and tangible viewing progress. 603
tests, all on `main`.

- **Auto-graduation (the core unlock):** `research-pass.yml`'s self-correction loop now
  calls `node scripts/graduate-guide.mjs --slug <slug>` (new direct-slug CLI mode,
  alongside the original ISSUE_BODY mode) the MOMENT its own verify PASS lands — same
  commit that checkpoints `verified`. `draft: true` comes off right there and the branch
  merges straight to `main`; it's live on the next Pages deploy with zero human touch.
  `graduate-guide.yml` (the label-gated flow) is demoted to a manual OVERRIDE/rescue path
  — still there for a draft finished/fixed by hand, still gates on build+verify. The
  honest tradeoff (documented in `docs/PIPELINE.md`'s PUBLISH section): the HUMAN-judged
  rubric rows (anchor quality, party fit, authenticity) no longer block publication, only
  get printed for visibility — a deliberate policy call per the explicit "no other input"
  ask, mitigated by the Learnings loop + `modify-guide.yml` catching a bad call after.
- **Live progress tracker (the "tangible viewing progress" ask):** new
  `src/features/pipeline-progress/` silo — reads the SAME git-tracked checkpoint state
  `scripts/pipeline.mjs` already writes (`guides-intake/<slug>.state.json`, on the
  `research/<slug>` branch while it's live, falling back to `main`) via
  raw.githubusercontent.com, no new backend/secrets/Firebase. Renders a live elapsed timer
  + step checklist (scaffold → Pass A → Pass B → reconcile → verify → published — the last
  derived from whether the guide's own `main` JSON still has `draft:true`), with an honest
  "taking longer than usual" note if `updatedAt` goes stale before done. New page
  `src/pages/progress/` (slug from `?slug=` client-side — a static site can't
  `getStaticPaths` something that doesn't exist yet). Wired from three places: the hub
  wizard's submit handler redirects THIS tab there right after opening the GitHub issue
  tab (slug predicted client-side, self-corrects via a manual-paste fallback if the guess
  is wrong); `new-guide.yml`'s confirmation comment links the REAL slug; a draft guide's
  own page (`GuideLayout.astro`) now also links it, for anyone who bookmarks the guide URL
  directly instead of the issue.
- **Docs brought current:** `docs/PIPELINE.md`'s lifecycle diagram + PUBLISH section +
  exit criteria, `docs/GUIDE_RUBRIC.md`'s intro — all rewritten to describe auto-graduate
  as the happy path, not the old label-gated one.
- Everything from here down is prior-session history, kept for context: Sedona (`/guides/
  us/`) shipped via the OLD manual-graduate flow — issue #11 (graduate-request) is still
  open under that flow and still works exactly as before (auto-graduation doesn't touch
  guides that predate it). Time zone resolves from a guide's own coordinates
  (`scripts/lookup-tz.mjs` + `geo-tz`), not a country table — fixed at the root after the
  Hawaii→Sedona pivot exposed the bug. Pipeline P0–P4 + visual/motion + `docs/FEATURES.md`
  wave were already complete before this session.

**Known waits:** the fully-autonomous chain (scaffold → research → auto-publish → live) is
STILL unproven end-to-end with a REAL Claude Max run — every prior bug found was
config/wiring the agent never got past, not a content bug, and this session's changes are
build/typecheck/test-verified + visually verified (mocked network) but not exercised by an
actual `research-pass.yml` run yet. That still waits on the creator's `CLAUDE_CODE_OAUTH_TOKEN`
secret. TRAVELER_PATTERNS still has only 2 data points.

## Where we left off

**Ready for the creator right now:**

1. **Once `CLAUDE_CODE_OAUTH_TOKEN` exists, file a fresh New-guide issue** — this is now
   the real first end-to-end proof of BOTH the automated chain AND the new auto-graduate +
   live-progress work in the same run. Watch the progress page in the bot's confirmation
   comment; if it reaches verify PASS, the guide should go live with no further clicks.
2. **Issue #11 (graduate: us/Sedona)** is still open under the old manual flow — apply
   `graduate-approved` whenever it holds up; unaffected by this session's changes.

**Re-prompt the creator with:** "The New Guide pipeline is now fully autonomous — file the
issue form, and if research reaches a verify PASS it graduates and publishes itself, no
label click needed. There's also a live progress page now (timer + step checklist) linked
from the bot's confirmation comment and from any draft guide's own page. Once you've added
the OAuth secret, want to file a fresh guide and watch the whole thing run for real?"
