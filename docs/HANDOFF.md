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

## Snapshot (updated 2026-07-30, session #19 — skill = single source of truth; vibe chain; About page)

**Skill modernization SHIPPED (creator GO on all 4 parts):**
- `waypoint-guide-author` is now the **single source of truth**: all six `research-pass.yml`
  agent prompts are POINTERS (stage I/O contract only; ~150 duplicated lines deleted; the vibe
  pair's "PROMPT SYNC" burden is gone). New `references/pipeline-roles.md` = stage-role law
  (traveler-question emitter, vibe lens + exact sentinel, executor rules, critic protocol).
- **Hard gates:** new done-gate #3 **citation audit** (sample ≥5 perishable facts, fetch each
  `source_url`, confirm the page still supports the value → `## Citation audit` table) and a
  workflow **"Critic artifact gate"** that FAILS any run whose critic ends without
  `## Critic findings` + `## Citation audit` (alarm after landing, never a barrier).
- `social-leads.md` merged into `research-efficiency.md`; SKILL.md slimmed (schema-detail →
  block-types.md). **Research-skill discovery layer**: interactive sessions may open each pass
  with ONE Standard-mode `Research` call (leads only, T0 bar unchanged, NEVER in CI).

**Six-agent research pipeline** (this session + parallel #18b work): A (model input) → B
(pinned Sonnet, A-blind) → Reconcile (stops pre-graduation) → Vibe critic (pinned **Fable**,
continue-on-error; **Opus 5 fallback on failure** — degrade the model, never the pass) →
Vibe executor (Opus, only if findings) → Rubric critic (`critic_model`, default Opus, owns
graduation). Fable's headless availability is STILL UNPROVEN — first real dispatch answers it.

**Also this session:** `/about` page shipped (token-styled, journey-line, real build-counted
stats; hub footer links it) · dead deps removed (dotenv, 2 retired mockup fonts, redundant
astro-eslint-parser) · consultant plan rejected (`docs/archive/CONSULTANT_PLAN_REJECTION.md`).

**1009 tests green, build + YAML clean, all pushed to main.**

## Pending from session #18b (revise pipeline — still open)

- Review/merge **draft PR #28** (korea smoke revision); then flip `revise-guide.yml` `land`
  default `draft` → `auto`; sign off V6 Q4 thresholds (overall ≤3, pacing ≤2, ≥3 skips).
- Critic flagged the swapped 명동 label on korea 03's Gyeongbokgung map point → own issue.
- ⚠ Cloudflare dashboard Git integration builds "tripguides" on every push and fails in 0s —
  external config noise; consider disabling (deploy-worker.yml owns the real Worker deploy).

## Owner tasks (need the creator, not the agent)

1. **Enable Settings → Actions → General → "Allow GitHub Actions to create and approve pull
   requests"** — land-branch.sh cannot open draft PRs without it (proven in the #18b smoke).
2. Review/merge draft PR #28.
3. Delete merged remote branch `claude/website-visual-redesign-upnl05`.

## Where we left off

**Session #19 (2026-07-30):** adversarial critique of the guide-author skill → creator GO →
shipped all four modernization parts (commits `8ddfd14`, `6729d61`). The skill now IS the
pipeline's law; prompts can't rot; judgment leaves required artifacts or the run fails.

**Re-prompt the creator with:** "The modernized six-agent chain has never run end-to-end.
Dispatch Actions → Research pass → japan (or a fresh slug) as the live proof: it answers
whether `claude-fable-5` works headless (vibe step's first 30s), exercises the skill-pointer
prompts for real, and trips the new critic artifact gate if any judgment step skips its
artifacts. Watch the run; triage from the run report."
