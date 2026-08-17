# Branch Review: codex/pipeline-v2 — Pipeline V2 (M0–M8 + adversarial hardening)

**Reviewed**: 2026-08-17
**Scope**: `main (9f1599b) ... ba1d5de` — 66 files, ~6.2k insertions (Fable M0–M8 + Codex hardening `ba1d5de`)
**Branch**: codex/pipeline-v2 → main (no PR yet — local review; Codex gates the merge)
**Decision**: APPROVE with comments — zero CRITICAL, zero open HIGH; canary must prove the external boundaries

## Summary

The V2 control plane is implemented per DECISIONS.md with fail-closed contracts, mechanical
stage isolation, and truthful progress reporting; the adversarial hardening pass (`ba1d5de`)
additionally sandboxed every agent (pinned Docker + pinned CLI, no Bash, path-scoped tools,
scrubbed credentials, sandboxed git history), scoped every stage commit to an allowlist, and
threaded run identity through every artifact. The one HIGH defect found during review (the
passB job's `setup-node` cache resolving against a lockfile-less workspace root) is already
fixed in `ba1d5de`. Everything below is observation-grade: nothing blocks the Codex review or
the manual canary.

## Findings

### CRITICAL
None.

### HIGH
None open. (Found during review, already fixed in `ba1d5de`: passB job `setup-node` used
`cache: npm` with its first checkout at `path: .control`, so no root `package-lock.json`
existed and the cache resolver would have failed the job on first dispatch.)

### MEDIUM
1. **Void classification narrows when collection itself throws** —
   `.github/workflows/research-pass-v2.yml` (passA/reconcile/critic jobs): `collect-stage`
   runs inside the same `-e` shell as `finish-stage`; if it throws (only possible when
   scaffold-guaranteed paths are absent — rare), `finish-stage` never runs, so the failure is
   recorded as `gate-failure` and the bounded void auto-retry never fires. Safety holds
   (honest failure, branch resumable); only the automatic remediation degrades.
2. **Critic fetch policy is closed-world** — `criticFetchTools` permits WebFetch only to
   domains already present in the guide/ledger, so a critic researching a REPLACEMENT can
   verify it only through WebSearch previews, never a fresh primary fetch. Deliberate
   hardening trade; watch on the first canary whether critic-introduced facts suffer.
3. **One durable V2 run per guide** — `initRunV2` refuses to mint a new run over a
   complete/stuck record without `--force`, which no workflow passes. Correct for the canary
   phase (a baseline containing prior evidence must not be reused silently), but a documented
   manual procedure for "second V2 research pass on the same guide" is needed before any
   cutover decision.
4. **Progress page can freeze on "Merged — deploy not confirmed"** —
   `src/features/pipeline-progress/ui/progress.js` stops polling at page state `done`; if the
   Pages deploy lands after the final poll, the line never upgrades to "Live on the site."
   Honest (never overclaims) but stale; belongs to the October UI pass.

### LOW
5. `adaptV2Snapshot` (`model/progress.ts`) maps a complete stage whose `endedAt` is null to
   not-done (`"" `is falsy). Unreachable in practice — `stageComplete` always writes
   `endedAt` — and it understates rather than overclaims.
6. `forbiddenForPassB` covers V2 artifacts only: a V2 RE-research of a previously published
   guide would expose the prior merged ledger/guide to Pass B at baseline. Out of canary
   scope (fresh scaffolds); revisit before V2 becomes the default for re-research.
7. `gatePreflight` commit message still reads `chore(intake): …` while committing the ledger
   file. Cosmetic.

## Validation Results

| Check | Result |
|---|---|
| Typecheck (`astro check`) | Pass — 0 errors, 21 pre-existing-class hints |
| Lint (`eslint .`) | Pass — 0 errors, 0 warnings |
| Tests (`vitest run`) | Pass — 2579 + 1 todo |
| Build (`astro build` + gates) | Pass — 9 pages, search index + SW precache regenerated |
| Offline verify (published guides) | PASS ×2, legacy `n/a` rows intact |
| dist/ stale-string grep | Clean |

## Not verifiable from this session (canary must prove)

Docker sandbox + pinned `@anthropic-ai/claude-code@2.1.233` CLI flags, pinned action SHAs,
job chaining/`needs` conditions, the three-checkout passB job, credential scrub steps, the
answers→redispatch loop against a live branch, `isLive` against the deployed site. All named
in `docs/pipeline v2/IMPLEMENTATION_STATE.md` § Final handoff, with the canary command.

## Files Reviewed

All 66 changed files (M0–M8 authored and re-read this session; `ba1d5de`'s hardening reviewed
via full diff: workflow rework, run-state invariants, identity threading, coverage context
checks, research-rule extensions, worker/new-guide gates, prompt updates, test updates).
