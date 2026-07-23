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

## Snapshot (updated 2026-07-23, session close)

**The skill-loop optimization arc (W-series) shipped this session — W0–W5 done, committed, all
verified (build clean · 805 tests green · typecheck 0 · perf budget OK).** Plan doc:
`~/.claude/plans/twinkling-orbiting-whisper.md`. What landed:
- **W0 hardening** — killed the flaky screenshot-diff gate (kept axe as slim `a11y.yml`), added
  the OAuth-**token canary** (`token-canary.yml` — the agent pipeline's silent single point of
  failure), sanitized the modify-guide `section` injection surface, removed the orphan GROQ key
  from `.env` (revoke still owed — see below), fixed a non-hermetic `fmtClock` test.
- **W1** — `pretrip-check.ts` auto-dispatches `recert.yml` for T-7 guides with stale facts.
- **W2** — LEARN loop automated: `feedback-export.yml` drafts the synthesis as a review PR.
- **W3** — IMPROVE loop: run-ledger issue + monthly skill-retro + wired `skill-evals.yml`.
- **W4** — the intake wizard parses **PDF** booking confirmations client-side (ephemeral).
- **W5** — **zero-click intake**: a Cloudflare Worker (`worker/`) files the issue for anonymous
  visitors; the site stays on Pages; wizard falls back to the GitHub path when unconfigured.

**W6 (the real end-to-end E2 proof) is the one deferred item — gated on a real trip to plan**
(creator's explicit choice). When a trip exists, run it through the by-then-current front door and
write `docs/E2_FIELD_REPORT.md` (it also becomes ledger run #1 + the C2 critic evidence).

**Owner tasks to activate the inert pieces (each guided; the code is done and self-deploys):**
1. **Revoke** the old GROQ key at the Groq console (it's out of `.env` but not revoked).
2. **W2:** mint a read-only Firebase RTDB service account → repo secret `FIREBASE_SERVICE_ACCOUNT`.
3. **W5:** free Cloudflare account → `CLOUDFLARE_API_TOKEN` repo secret + a fine-grained PAT
   (`wrangler secret put GH_TOKEN`); then paste the deployed URL into `intake-proxy-config.js`.
   Optional: Turnstile keys + a KV namespace for the rate cap. Full steps in `worker/README.md`.

**Secret status:** `CLAUDE_CODE_OAUTH_TOKEN` valid (2026-07-20; the canary now watches it).
**Housekeeping still open:** creator deletes merged remote branch
`claude/test-coverage-analysis-siftjs` via GitHub UI (sandbox 403s on ref deletion).

## Where we left off

The W-series arc is complete and pushed. Every phase carries its own tests and the pieces that
need owner secrets (W2 Firebase, W5 Cloudflare) are inert-until-configured — they don't break
anything while unset. The three prior standing plans (field-report fixes, traveler features,
visual overhaul) remain fully cleared. The only substantive work left anywhere is **W6** (prove
the pipeline end-to-end on a real trip) and, downstream of it, the critic **C2/C3** upgrades that
need evidence from two real research passes.

**Re-prompt the creator with:** "The skill-loop optimization arc is done and live — hardening +
the token canary (W0), pre-trip auto-recert (W1), the automated learnings loop (W2), the
self-improvement loop of run-ledger + skill-retro + wired evals (W3), PDF booking parsing (W4),
and the zero-click Cloudflare intake proxy (W5). Three things are waiting on you: revoke the old
GROQ key, and — whenever you want to switch the automated learnings loop and the zero-click intake
on — add the Firebase service-account and Cloudflare secrets (guided, ~5 min each; `worker/README.md`
has the steps). The one piece of the plan left to prove is the real end-to-end run (W6), which just
needs an actual trip to plan. What would you like to do next?"
