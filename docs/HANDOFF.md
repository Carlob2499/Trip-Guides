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

## Snapshot (updated 2026-07-20, session close)

**This session: an adversarial audit of the whole workflow, then acted on its findings.** The
audit (delivered as a visual HTML artifact) checked the automation against GitHub's real run
history and found the core gap isn't the design — it's that most automation has never completed
a real run, and finished work had recently sat invisible because nothing confirmed it reached the
live site. Fixes shipped this session (on `claude/test-coverage-analysis-siftjs`, 621 tests):

- **`scripts/verify-live.mjs` (the "did it actually land?" gate)** — discovers every non-draft
  guide in the repo, fetches the REAL production site, and confirms each is both reachable at its
  URL AND linked from the homepage (the exact two-part check whose absence let Sedona sit invisible
  for a day). Pure core (`discoverPublishedSlugs`, `diagnose`) unit-tested; shell retries for CDN
  lag. Wired into `deploy.yml` as a post-deploy job that turns the run red + files a
  `deploy-verification` issue on a real miss. Runnable by hand: `npm run verify-live`.
- **Auto-publish probation** — `land-branch.sh` now takes an optional live-URL 6th arg; on a real
  auto-publish merge it files a vetoable "🚀 Auto-published" issue with a one-line rollback path,
  so a silent self-publish becomes one a human can still catch. `research-pass.yml` passes the URL.
- **`/health/` — the Pipeline Health page (audit Fix #4, "make the track record visible")** — a
  maker-facing page showing every workflow's LIVE status via GitHub badges (zero backend), split
  proven / not-proven-yet / plumbing, each with an honest role + caveat note ("green ≠ did its
  job"). New `src/pages/health/` + `src/styles/health.css`, styled through base.css tokens.

**Prior session (kept for context): the pipeline was made fully autonomous end-to-end with live
progress tracking** — an end-user inputs trip info and sees a finished guide with no approval step,
plus a timer and tangible viewing progress.

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

**Audit-remediation work is on `claude/test-coverage-analysis-siftjs`, ready to merge to `main`.**
`verify-live` was run against the REAL production site and confirmed all three guides (denmark,
korea, us) live and linked — so the gate is proven against reality, not just unit tests. Build
clean, 621 tests green, both themes of `/health/` visually verified at mobile + desktop. Live
badges on `/health/` render as broken images only in the sandbox (no github.com egress there);
they'll be real status pills on the deployed site.

**Still the #1 open item (unchanged, and the audit's top finding):** the fully-autonomous chain
(scaffold → research → auto-publish → live) has NEVER completed a real end-to-end run — it's been
triggered a couple of times and never got past config/wiring. It still waits on the creator's
`CLAUDE_CODE_OAUTH_TOKEN` secret. Everything built since is test/visually verified, not
run-for-real. Proving this out is the highest-value next step.

**Update (2026-07-20, later):** audit fixes MERGED to `main` and verified live — verify-live ran
green in real CI (deploy run 29716361601), `/health/` is live. Feature branch deleted locally;
remote deletion is 403-blocked from the sandbox (relay forbids ref deletion) — **creator deletes
`claude/test-coverage-analysis-siftjs` via GitHub UI**. Two GRAND PLANS added (research-grounded,
session-by-session, each with its own ritual + clarifying questions):

- `docs/PLAN_TRAVELER_FEATURES.md` — F0 (prove pipeline E2E, the gate) → F1 prep timeline →
  F2 budget pact → F3 populate dormant entry/phrases/env tags → F4 packing strip → F5 offline
  confidence → F6 pre-trip auto-recert → F7 the Critic (own plan:
  `docs/PLAN_PIPELINE_CRITIC.md`, staged C1 prompt-lens → C2 evidence gate → C3 full stage) →
  F8 day-route optimizer (free what Wanderlog Pro charges for). Parity matrix + full
  competitor sweep (incl. served-code inspection of Wanderlog/Mindtrip):
  `docs/COMPETITIVE_LANDSCAPE.md`.
- `docs/PLAN_VISUAL_OVERHAUL.md` — "The Overture & the Atlas": V1 foundation → V2 full-viewport
  intro hero before the guide grid (the creator's explicit ask) → V3 palette-tinted Atlas grid →
  V4 interior depth → V5 morph continuity → V6 QA/perf. Doctrine-bound to MOTION.md.

**Ready for the creator right now:**

1. **Pick a plan and start its next session** (F0 needs `CLAUDE_CODE_OAUTH_TOKEN` — `claude
   setup-token` → repo secret; V1 needs nothing). Every session opens by asking the creator its
   clarifying questions and closes by rewriting this file.
2. **Delete the leftover remote branch** (GitHub UI → branches → 🗑) so only `main` exists.

**Re-prompt the creator with:** "Both grand plans are in the repo and every session is designed
to start by asking you its clarifying questions. Want to open with V1 (visual foundation — no
prerequisites) or F0 (prove the pipeline for real — needs the OAuth secret first)?"
