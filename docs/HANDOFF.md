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

## Snapshot (updated 2026-07-26, session close #8 — the audit session)

**A full adversarial audit ran (3 parallel passes: design/frontend, CI + live run history,
build/perf) and its findings + executor program live in `docs/PLAN_MODERNIZE.md` — read that
file, it is this session's real output.** Branch `claude/waypoint-audit-modernize-tne4ce`.
Build clean, **848** unit tests, lint 0, `astro check` 0 errors.

- **The finding that matters: the agent half of the pipeline has NEVER run.** research-pass: 2
  runs, both died pre-work (org typo; missing token). recert: 1 run, first model call errored
  (`is_error`, 1 turn, $0) — the "cosmetic" diagnosis in 389b229 is contradicted by that shape.
  The `us` guide was researched interactively (state stamps 80 ms apart, attempts 0). Three
  untested seams stacked behind it: the action's human-actor gate vs the bot auto-dispatch,
  `gh` auth inside the agent's Bash, and token-canary alerting "rotate" on any `is_error`.
  M0 in PLAN_MODERNIZE is the resuscitation session — it gates everything else.
- **Fixed this session:** Trip Split desktop rows were misaligned (5-col grid for a drag handle
  the JS no longer renders — payer select crammed into a 1.3rem column; CSS-only fix, no data
  touched) · dead `.se-drag`/`.imgfail` rules removed · root `mexico.json` (UTF-16 mojibake
  stray) and root `wrangler.jsonc` (the Boundary-Check-#1 footgun) deleted · every stale flat
  `<slug>.json` reference in new-guide/graduate-guide/research-pass fixed (the scaffold comment
  404'd for every future guide; the research prompt could have induced an agent to CREATE a
  shadowing flat file).
- **Measured baseline (details in the plan):** first-paint JS lean (~35 KB gz guide), CLS 0.244
  with cause identified (4 post-paint injected strips + 0/21 images with dimensions), zero
  modulepreload/font preloads, no `--space-*`/z-index scales (skip-link paints under story
  mode), 111 `: any`, dist 3.95 MB (42% on-demand pdfjs, NOT in the SW precache).

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

1. **Re-enable the `config-protection` hook** if it is still off. It was disabled at
   `~/.claude/settings.json` line 53 to let the ESLint config be fixed; that work is done. The
   agent cannot restore it — the permission classifier refuses edits to `~/.claude/`.
2. Commit `eae5573`'s subject line is a literal `@` (PowerShell here-string leaked into Bash); the
   body is intact. The Fact-Forcing Gate blocks `--amend`.
3. **Shell reminder:** commands in this repo's docs are Git Bash. Running `rm -rf` or
   `git show … > file` in PowerShell fails or writes UTF-16 — both happened this session.

**Closed this session:** GROQ key revoked · `FIREBASE_SERVICE_ACCOUNT` minted · merged remote
branches deleted (`origin` is `main`-only) · **W5 label-free test RUN and CONFIRMED**, so the
zero-click intake path is proven end to end for the first time · retired guides permanently deleted.

**W6 (real end-to-end pipeline proof) stays deferred, gated on an actual trip** — creator's choice.
The W0–W5 arc is complete and live; detail in `docs/PIPELINE.md` and the git log.

## Where we left off

The lesson of the audit: **every green gate this repo owns measures the artifact; none of them
measure the factory.** 848 tests, lint 0, typecheck 0, 248 green deploys — and the agent layer
of the pipeline has still never executed one research stage, because run *history* was the gate
nobody read. The `us` guide passing every check made the pipeline look proven while proving only
that a human can do the pipeline's job.

**Re-prompt the creator with:** "The full adversarial audit is done — findings and the M0–M6
executor program are in `docs/PLAN_MODERNIZE.md` on branch
`claude/waypoint-audit-modernize-tne4ce`. Headline: the agent half of the new-guide pipeline has
never run (both research-pass runs died pre-work, recert's one run errored on its first model
call, and Sedona was researched by hand) — M0 resuscitates and proves it end to end, and it
gates everything else. Already fixed on the branch: a live Trip Split desktop misalignment, the
dead drag/imgfail CSS, the stray mexico.json and root wrangler.jsonc, and the flat-path 404s in
three workflows. Five clarifying questions are at the bottom of the plan (throwaway-guide
cleanup, backend stance, room-code privacy, the six record-or-relic docs, and the M4 visual
direction). Answer those, then M0 on Sonnet?"
