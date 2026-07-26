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

## Snapshot (updated 2026-07-26, session close #9 — M0, the pipeline diagnosis)

**The agent pipeline's root cause is now KNOWN, not guessed — confirmed from a live dispatch's
actual API response.** Branch `claude/waypoint-audit-modernize-tne4ce`. Full audit + executor
program in `docs/PLAN_MODERNIZE.md`. Build clean, 848 tests, lint 0, `astro check` 0 errors.

- **`CLAUDE_CODE_OAUTH_TOKEN` is expired or revoked.** Dispatched `token-canary.yml` live with
  `show_full_output: true` temporarily added (reverted after reading it): the real SDK response
  is `error_status: 401, error: "authentication_failed", result: "Failed to authenticate. API
  Error: 401 OAuth access token is invalid."` — two retries, both 401, then the SDK synthesizes
  the misleading `is_error:true / $0 / 1 turn` envelope that made the July 20 recert failure look
  cosmetic. It wasn't. The canary's own alert logic is fine — it correctly went red and updated
  tracking issue #22 with the right fix instructions.
- **⚠ OWNER ACTION, next session: rotate the token.** Run `claude setup-token` locally (needs the
  creator's own Max login — no agent session can do this) → paste into the `CLAUDE_CODE_OAUTH_TOKEN`
  repo secret → re-run **Actions → Token canary** to confirm green (auto-closes #22). Once green,
  M0 continues immediately: the W6 end-to-end proof (a real `zz-` throwaway guide through the
  whole scaffold → research → verify → graduate → land chain, gated cleanup pre-approved) has
  never fired even once and is the very next step, same session.
- **Fixed this session, independent of the token:** `allowed_bots: "github-actions[bot]"` on
  research-pass's agent step (confirmed via the live dispatch's own `ALL_INPUTS` dump that this
  input is real — B2 was a genuine gap) · `GH_TOKEN` job-level env added to research-pass,
  modify-guide, and recert so their agents' Bash-tool `gh` calls have a credential (B3) ·
  new-guide's concurrency key changed from per-issue to a single global lock (two different
  issues for the same country could race an add/add conflict — B7) · research-pass gained its own
  `research-<slug>` concurrency group · circuit-breaker message fixed to say "exceeds cap of 5."
- **Previous session (#8) also fixed:** a live Trip Split desktop misalignment (5-col grid for a
  drag handle the JS no longer renders), dead `.se-drag`/`.imgfail` CSS, stray `mexico.json` +
  root `wrangler.jsonc`, stale flat-`<slug>.json` references across three workflows.
- **Measured baseline (details in the plan):** first-paint JS lean (~35 KB gz guide), CLS 0.244
  with cause identified (4 post-paint injected strips + 0/21 images with dimensions), no
  `--space-*`/z-index scales (skip-link paints under story mode), 111 `: any`, dist 3.95 MB (42%
  on-demand pdfjs, NOT in the SW precache).

Standing context from session #7 (detail in git history / `git show 3dc5349:docs/HANDOFF.md`):
every guide is a directory and a test enforces it · Mexico/Portugal retired (their researched
`countries.mjs` rows deliberately kept) · served `.gpx`/`.ics` spec-tested · ESLint 277→0 and a
CI gate · CodeQL's 4 real alerts fixed · Trip Split room codes real + sync failures surfaced,
confirmed live by the creator.

## Left to do

1. **Korea's live budget was recovered, and the recovery is the lesson.** Its 3 members and 23
   expenses ($4,293.09) were at `trips/southkorea` — the title-derived room from before the slug
   change, writable back then because the 16-char rule did not yet exist. Copied to
   `trips/0286df0ea411ae7e`; the old node is UNTOUCHED as a backup. `_guide.json` records
   `roomMigratedFrom: "southkorea"`. Guard added: `model/room.ts` (no storeKey fallback, ever) +
   `scripts/__tests__/guide-room-id.test.mjs`. Both were deliberately failed before being trusted.
2. **The `no-explicit-any` debt** (Snapshot above). The unlock is typing the guide-JSON walkers
   against `CollectionEntry<"guides">["data"]` and the section union, then turning the rule back on.
   Biggest single files: `exports.ts` (14), `map-pins.ts` (14), `content.config.ts` (12),
   `GuideLayout.astro` (28).
2. **Room codes are committed to a PUBLIC repo** (all three guides). Deliberate — the creator
   chose zero-setup sync for three travellers over secrecy — but anyone reading the repo can read
   and write those budgets. The alternative, a `#room=` fragment shared privately, stays open.
3. **The room guard cannot check whether an old room is POPULATED** — no credentials, no network
   to the DB at build time, and a build that depends on a live datastore is its own hazard. The
   historical half of `guide-room-id.test.mjs` compares working tree vs HEAD, which catches the
   mistake at the moment it is made and is a no-op in CI. The valid + unique checks are the
   unconditional ones. Stated in the test itself, not hidden.
4. **Dead-file audit: mechanical half done, judgment half open.** All 289 source files under
   `src/ scripts/ worker/` were scanned — **zero dead modules**; the only unreferenced files are
   tests (nothing imports a test) and `src/env.d.ts` (ambient). What remains is a call only the
   creator can make: ~~six completed-work docs~~ — RESOLVED 2026-07-26: archived to
   `docs/archive/`, references repointed.
5. Not built: the PostToolUse typecheck hook in `.claude/settings.json`, and trimming `CLAUDE.md`
   toward 200 lines (it grew this session).
6. **Unverified:** `scaffold-guide.mjs`'s new end-to-end directory path. Creating a throwaway guide
   would leave artifacts the destructive-op guard prevents cleaning up.

## Owner tasks (need the creator, not the agent)

1. **Rotate `CLAUDE_CODE_OAUTH_TOKEN` — blocks M0 from finishing.** `claude setup-token` locally →
   repo secret → re-run Token canary. See Snapshot above; this is the only thing standing between
   here and the pipeline's first-ever real end-to-end run.
2. **Re-enable the `config-protection` hook** if it is still off (`~/.claude/settings.json` line
   53) — the agent cannot; the permission classifier refuses edits to `~/.claude/`.
3. Commit `eae5573`'s subject line is a literal `@` (PowerShell here-string leaked into Bash); the
   body is intact. The Fact-Forcing Gate blocks `--amend`.
4. **Shell reminder:** commands in this repo's docs are Git Bash — `rm -rf` / `git show … > file`
   in PowerShell fails or writes UTF-16.

**W6 (real end-to-end pipeline proof)** is no longer deferred — it's the next concrete step, once
the token is rotated. Detail in `docs/PIPELINE.md` and `docs/PLAN_MODERNIZE.md`'s M0.

## Where we left off

Two sessions ago the audit's lesson was: every green gate here measures the artifact, not the
factory. This session answered *why* the factory never ran — not a guess, a 401 read straight off
a live dispatch. The fix is now a five-minute human action away, not a mystery.

**Re-prompt the creator with:** "M0's diagnosis is done: `CLAUDE_CODE_OAUTH_TOKEN` is expired —
confirmed from the actual API response (401 OAuth access token is invalid), not inferred. Rotate
it (`claude setup-token` → repo secret → re-run Token canary) and I'll immediately run the
pipeline's first-ever real end-to-end proof: a throwaway guide through scaffold → research →
verify → auto-graduate → land → live. Already fixed on the branch while waiting on that: the
bot-actor gate, `gh` auth inside the agents' Bash tool, a real race condition in new-guide's
concurrency, and the circuit-breaker's off-by-one message. Full detail in
`docs/PLAN_MODERNIZE.md`'s M0."
