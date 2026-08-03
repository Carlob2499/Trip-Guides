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

## Snapshot (2026-08-03, session #32 — scar-tissue ablation; checks promoted to gates)

**CLAUDE.md was ablated per the scaffolding-decay rule:** war-story prose whose rule is now
enforced by a gate was trimmed to the rule (guide-shape history, continuity gate enumeration,
connector rationale, stale sights/food counts). The Clarifying-Questions Doctrine was scoped:
interactive sessions use `AskUserQuestion`; headless surfaces use their built mechanisms
(revise-guide's fork gate pauses via issue comment; new-guide posts traveler questions
non-blocking) — never a chat prompt in CI. The obsolete cloud-sync stale-CSS caveat was
removed everywhere (the repo no longer lives under that sync folder); `astro preview` stays
the verification surface because it serves the real production build.

**Four checks became gates** (`scripts/__tests__/docs-integrity.test.mjs`): HANDOFF ≤120
lines · every `docs/*.md` path cited from workflows/scripts/CLAUDE.md/docs exists (the
`E2_FIELD_REPORT` failure class) · the obsolete cloud-sync caveat stays out (archive-only) ·
internal
`href="/…"` in `.astro` without `BASE_URL` fails. A SessionStart hook
(`.claude/settings.json` → `scripts/handoff-head.mjs`) now injects this file automatically.
HANDOFF's 800 lines of history moved to `docs/archive/HANDOFF_ARCHIVE.md`;
`PLAN_MOBILE_NAV.md` and `TRIP_SPLIT_V2.md` (shipped, cited only by docs) moved to archive.

## Open items

- **Needs the creator:** ① delete merged remote branch `claude/website-visual-redesign-upnl05`;
  ② decide the fate of branch `worktree-agent-a7dc7eeb397c6a368` (progress-study design work,
  `5917f8f`, unreviewed); ③ sign off revise-guide `land` default `draft` → `auto` + V6 Q4
  thresholds (overall ≤3, pacing ≤2, ≥3 skips); ④ Cloudflare dashboard Git integration builds
  "tripguides" on every push and fails in 0s — external config noise, consider disabling
  (deploy-worker.yml owns the real Worker deploy).
- Korea 03: critic flagged a swapped 명동 label on the Gyeongbokgung map point → file its issue.
- The S1–S5 research standards + dossier contract have never met a real research pass; the next
  new guide is the calibration test (a floor firing on a legitimately thin priority is data
  about the floor, not the guide).
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.

## Where we left off

**Session #32 (2026-08-03):** separated scar tissue from doctrine across CLAUDE.md and the
repo — trimmed what gates already enforce, promoted four ungated checks into a docs-integrity
test, hooked HANDOFF auto-load, retired the cloud-sync caveat, archived shipped plan docs and 800 lines of
HANDOFF history.

**Re-prompt the creator with:** "The scar-tissue audit is applied. The rule I used: if a gate
or test now enforces it, the prose war-story went to the archive; if prose was the only
enforcement, it stayed (boundary checks stayed whole — they're invoked by number in four
recent sessions). Clarifying questions stay for interactive sessions but the doctrine now
names the headless path explicitly — CI never blocks on a chat prompt; revise-guide's fork
gate and new-guide's issue comments already do that job. The stale-CSS cloud-sync caveat is
gone everywhere except the archive, and four things that were 'checks' are now tests that
fail the suite: HANDOFF's line budget, doc-reference existence, the cloud-sync ban, and
BASE_URL on internal hrefs.
HANDOFF itself auto-loads via a SessionStart hook now, so sessions warm-start without a Read."
