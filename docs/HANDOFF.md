# HANDOFF — read this first, then re-prompt the creator

> **Ritual (binding):** at SESSION START, read this file INSTEAD of re-deriving history from
> the conversation, memory sprawl, or git log — it is the single warm-start context. Then
> greet the creator with the **"Where we left off"** line below and the recommended next step.
> At SESSION END, rewrite the Snapshot + Where-we-left-off sections (keep this header), commit.
> Keep it under ~80 lines — a handoff, not a chronicle. Deep context lives in the north-star
> docs it links; only follow those when the task actually needs them.

## Operating rules (stable — rarely change)

- **Model economy:** research/recert/fact edits + mechanical builds run on **Sonnet**; **Opus**
  for design sessions and judgment/first-run-triage work. Every grand-plan session below lists
  its own model — remind the creator to `/model`-switch at session start.
- **Never number guides as milestones** — the product is the backbone; a new guide is the
  backbone exercising.
- Ship loop on every change: build → test → `astro preview` :4322 (never `astro dev`) →
  grep `dist/` → commit → push to `main` (the only branch — `verify-live` guards every deploy).
- North stars: `docs/PIPELINE.md` (generation/maintenance) · `docs/MOTION.md`
  (presentation/motion) · `docs/GUIDE_RUBRIC.md` (quality bar) ·
  `docs/COMPETITIVE_LANDSCAPE.md` (market parity reference).

## Snapshot (updated 2026-07-30, session #17 — everything on main, branches cleared)

**Main is fully current.** Two feature branches merged and marked for deletion:

- **`claude/website-visual-redesign-upnl05`** (merged session #15) — Living Atlas R1–R6:
  Quiet Edition type, mobile journey bar, desktop horizon, Painted Atlas + living covers,
  interior atlas (anchors, descriptors, facets, cartographic neatline), Composer. Icon.astro
  replaced all emoji chrome. Hub editorial layout. Pipeline congruence (compose inside the
  done gate, Living Atlas pass in research prompt + scaffold). 925 tests at merge.
- **`claude/research-trial-results-h32hlk`** (merged session #17) — Japan research trial
  (PR #26, full pipeline PASS, auto-graduated) + adversarial QA (`docs/QA_RESEARCH_TRIAL_JAPAN.md`,
  F1–F14/U1–U7/R1–R20) + Factory v2 (`docs/PLAN_FACTORY_V2.md`, P1–P6 all shipped):
  harness-enforced checkpoints, A-blind Pass B, intake-coverage matrix, fresh-context critic,
  traveler progress page with question cards, `venues` block (all 4 guides migrated),
  voice gate (14 banned patterns), budget closure, fold fixes (U4/U5/U6). 980 tests at merge.

**Test count on main: 980.** Lint 0, build clean. Four guides live: Korea, Denmark, US, Japan.

## Left to do

1. **Delete remote branches** — creator must do this from GitHub UI (git proxy blocks
   deletion pushes): `claude/research-trial-results-h32hlk` and
   `claude/website-visual-redesign-upnl05`. Both fully merged, zero unmerged commits.
2. **Japan cover (Q4):** present 2–3 validated Commons koyo candidates (Naruko Gorge, Zao,
   Jozankei, Hokkaido color) + the optional two-half north/south split-cover variant (needs
   a small cover-schema + masthead change). Creator signs the final choice.
3. **Rotate `CLAUDE_CODE_OAUTH_TOKEN`** — still blocks the pipeline's first end-to-end proof
   (M0). `claude setup-token` → repo secret → re-run Token canary → throwaway guide test.
4. **P7 (differentiation surfaces)** — deferred to its own product-focused session. Spec in
   `docs/PLAN_FACTORY_V2.md`: ledger-backed "How we know this" popover, "What generic guides
   get wrong" block, calendar-truth badge, self-updating-guide framing.
5. **A11y baselines** will re-record on CI's first main run — watch for green. If red, likely
   the tab-icon pattern (inline SVG defeats axe's stacking-order check, per session #15 lesson).
6. **`no-explicit-any` debt** — 118 remaining `any`s behind a 33-path exception list. Biggest
   files: `GuideLayout.astro` (28), `exports.ts` (14), `map-pins.ts` (14), `content.config.ts` (12).
7. **Room codes** committed to a public repo (all guides). `#room=` fragment override exists
   as the private alternative. `budgetLock` defaults off.

## Owner tasks (need the creator, not the agent)

1. **Delete the two remote branches** from GitHub (see Left to do #1).
2. **Sign the Japan cover** — Commons candidates will be presented next session.
3. **Rotate `CLAUDE_CODE_OAUTH_TOKEN`** — `claude setup-token` → repo secret → re-run canary.

## Where we left off

**Session #17 (2026-07-30):** Merged `claude/research-trial-results-h32hlk` to main
(fast-forward, 185 files). Deleted the local branch. Remote deletion blocked by the git
proxy — both stale remote branches (`research-trial-results` + `website-visual-redesign`)
are fully merged and flagged for creator deletion from GitHub UI. Main pushed and current.

**Re-prompt the creator with:** "Everything is on main — both feature branches merged, 980
tests green. Two remote branches need you to delete from GitHub UI (both fully merged, zero
risk): `claude/research-trial-results-h32hlk` and `claude/website-visual-redesign-upnl05`.
Next session options: (1) Japan cover sign-off — I'll research Commons koyo candidates +
the split-cover variant, (2) rotate the OAuth token for the pipeline's first real end-to-end
proof, or (3) P7 differentiation surfaces if you want to push the product layer forward."
