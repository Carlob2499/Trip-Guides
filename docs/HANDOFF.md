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

## Snapshot (updated 2026-07-26, session close #9 — M0 diagnosis + M1/M2/M3/M4-item-6 shipped)

**The agent pipeline's root cause is KNOWN (confirmed from a live dispatch's actual API
response), and M1/M2/M3 plus M4's creator-priority item are DONE.** Branch
`claude/waypoint-audit-modernize-tne4ce`. Full audit + executor program in
`docs/PLAN_MODERNIZE.md` — read that file for the complete record; this is a summary. Build
clean, **854** tests, lint 0, `astro check` 0 errors.

- **M0 (blocked on the creator): `CLAUDE_CODE_OAUTH_TOKEN` is expired/revoked** — confirmed via a
  live dispatch: `401 OAuth access token is invalid`, not the "cosmetic" misdiagnosis from July
  20. **Owner action next session:** `claude setup-token` locally → repo secret → re-run Token
  canary (closes issue #22) → then the W6 end-to-end proof (a real `zz-` throwaway guide through
  the whole chain) runs for the first time ever, same session. Independent-of-token M0 fixes
  already shipped: `allowed_bots` on research-pass's agent step, `GH_TOKEN` job-level env on
  three agent workflows, new-guide's concurrency race fixed, circuit-breaker message fixed.
- **M1 (CI efficiency) shipped:** paths-ignore + concurrency + Playwright browser cache on
  test.yml/a11y.yml, cache:npm on the two workflows that needed it, a stale-fixture bug fixed in
  the skill-evals script.
- **M2 (CLS) shipped:** nav-hint now overlays instead of pushing content (the CLS 0.244's most
  reliable contributor), `.guide-stats` changed from wrap to scroll (pill-append could no longer
  shift height), hero srcset/sizes on both heroes, and `check-perf-budget.mjs` now derives a real
  per-page first-paint budget from the built artifact's actual script/import graph (measured:
  worst page 124 KB / 200 KB) instead of one 900 KB total that was ~78% lazy chunks.
- **M3 (design tokens) shipped, scoped to zero-visual-change + two real bugs:** z-index scale
  named in base.css; fixed the confirmed bug (skip-link painted UNDER story-mode, now explicitly
  above it) and a 9000-vs-everything-else-900s outlier; `--text-h1` token added at `.cat-title`'s
  EXACT existing size (caught and corrected a draft that would have silently enlarged it — verify
  the px math before landing a "zero visual change" claim, don't just assert it); a dead duplicate
  `font-weight` declaration removed; two stale hub-motion.css comments fixed. Spacing-scale sweep
  and `.day`'s two-file styling are real but deferred — 15+ files, needs its own pass.
- **M4 item 6 (More detail v2) shipped — creator's explicit priority.** `.card-more-sum` is now a
  real chip (fill/border/hover/focus-visible/chevron); `moreLabel` is a real schema field with an
  honest computed-count fallback; the split refuses to fold a `⚠` or `<ul>/<ol>` remainder (shows
  everything rather than hide a warning); a masked fade-out preview renders above the closed chip;
  the open animates via `@supports`-gated CSS (`::details-content`/`interpolate-size`), snap
  fallback everywhere unsupported. Verified live in `dist/`. **A11y investigation note:** manually
  ran the full a11y gate (this sandbox has no `playwright install` path, so via a temp local
  config against the pre-installed Chromium); found and fixed one real issue from the M2
  `.guide-stats` change (`tabindex="0"`, scrollable-region-focusable), and bisected a 4-test
  `bgOverlap` failure all the way to the pre-session commit — it reproduces on fully-stashed code,
  so it's environment/font-stack drift the test's own comments already document, not a
  regression. M4 items 1–5 (icon language, editorial hub, tab strategy, onboarding choreography,
  colophon footer) are unstarted — larger, more visually pervasive, deserve the Opus-spec +
  creator-review pass the plan calls for rather than a rushed extension of this session.
- **Session #8 also fixed:** a live Trip Split desktop misalignment, dead `.se-drag`/`.imgfail`
  CSS, stray `mexico.json` + root `wrangler.jsonc`, stale flat-`<slug>.json` references.

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
a live dispatch — then spent the wait on everything else the plan could reach without the token:
CI efficiency, the CLS root causes, the type-scale/z-index foundation, and the creator's specific
priority (More detail v2). One real a11y bug was caught and fixed along the way (a scrollable
region needed `tabindex`); one apparent a11y regression was investigated to ground and proven to
be pre-existing environment drift, not a session-created bug — both documented in the plan rather
than either ignored or wrongly "fixed."

**Re-prompt the creator with:** "M0's diagnosis is done: `CLAUDE_CODE_OAUTH_TOKEN` is expired —
confirmed from the actual API response (401 OAuth access token is invalid), not inferred. Rotate
it (`claude setup-token` → repo secret → re-run Token canary) and I'll immediately run the
pipeline's first-ever real end-to-end proof: a throwaway guide through scaffold → research →
verify → auto-graduate → land → live. While waiting on that, I finished M1 (CI efficiency), M2
(the CLS 0.244's root causes — nav-hint, guide-stats, a real per-page perf budget), M3 (z-index
scale, the skip-link/story-mode bug, a dead CSS declaration), and M4's centerpiece — the 'More
detail' redesign you specifically asked for: it's now a real chip control, refuses to fold
warnings, shows a fade preview of what's hidden, and animates open. 854 tests green. Full detail,
including an a11y investigation that found one real bug and ruled out a false one, in
`docs/PLAN_MODERNIZE.md`. Remaining M4 items (icon language, hub layout, onboarding
choreography, footer) are next, sized for their own Opus-spec pass."
