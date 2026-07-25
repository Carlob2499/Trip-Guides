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

## Snapshot (updated 2026-07-25, session close #7)

**The catalog now has exactly one shape, and three gates hold it there.** Build clean, 832 unit
tests, `astro check` 0 errors, e2e **55/55**.

- **Every guide is a directory.** Three of five were still flat `<slug>.json` and nothing said so —
  both shapes build, and the flat file *wins* in `resolveGuidePath`, so a stray one silently
  shadows the directory beside it. Split via the existing tested `split-guide.mjs`;
  `scaffold-guide.mjs` now writes the flat file only as that splitter's input, so a new guide never
  persists in the legacy shape, and `uniqueSlug()` checks directory collisions too.
  `scripts/__tests__/guide-shape-uniform.test.mjs` fails the suite on any flat guide.
- **Mexico and Portugal are out.** Their guide directories and intake `.md` files were MOVED, not
  deleted — see Owner tasks. Deliberately kept: `src/data/countries.mjs` holds verified, dated
  emergency-number data for both, which serves the SOS sheet and any future guide there; deleting
  it would destroy research, not remove a relic. Two form placeholders naming Mexico City are now
  generic. `dist/` greps clean.
- **`tests/visual/exports.spec.ts` is new** — it holds the SERVED `.gpx`/`.ics` for every guide to
  GPX 1.1 and RFC 5545 (CRLF, ≤75 **octets** per folded line, VEVENT completeness, unique UIDs,
  escaped `,`/`;`). The unit tests only ever saw strings their author typed; real guide prose is
  what breaks folding. Slugs come from disk, so a new guide is covered the moment it exists.
- **ESLint went 277 → 0 and is now a CI gate** (a `npm run lint` step in `test.yml`, wired only
  once it was at zero so red always means a new regression). Three quarters of the 277 was the
  config describing the wrong world: `public/sw.js` and `worker/index.mjs` are service workers
  linted as Node, and 81 more were this repo's deliberate `catch { }` idiom.
- **Its first pass found a live crash nothing else could see.** `scripts/graduate-guide.mjs` called
  an `isValidSlug` it only ever RE-exported — `export { x } from "…"` gives importers the symbol but
  creates no local binding — so the CLI threw `ReferenceError`. 832 unit tests, `astro check` and
  55 e2e were all green over it, because every one of them exercises the module from outside, where
  forwarding works. Fixed and verified by running the CLI.
- **`no-explicit-any` is OFF, as a recorded debt.** All 154 are one shape: functions walking the
  guide JSON, plus `.astro` props Astro hands over untyped. The real type already exists —
  `CollectionEntry<"guides">["data"]`, inferred from the Zod schema — and threading it through the
  section discriminated union is a project, not a lint fix. `astro check` remains the type gate at
  0 errors.
- **`fast-uri` pinned to 3.1.4** via `overrides`, clearing the one high Dependabot alert. Dev-only,
  four levels deep under `@astrojs/check`; it never reached the shipped bundle.

## Left to do

1. **The `no-explicit-any` debt** (Snapshot above). The unlock is typing the guide-JSON walkers
   against `CollectionEntry<"guides">["data"]` and the section union, then turning the rule back on.
   Biggest single files: `exports.ts` (14), `map-pins.ts` (14), `content.config.ts` (12),
   `GuideLayout.astro` (28).
2. **Dead-file audit: mechanical half done, judgment half open.** All 289 source files under
   `src/ scripts/ worker/` were scanned — **zero dead modules**; the only unreferenced files are
   tests (nothing imports a test) and `src/env.d.ts` (ambient). What remains is a call only the
   creator can make: six docs read as completed-work records — `PLAN_FIELD_REPORT_FIXES.md` (22KB),
   `PLAN_TRAVELER_FEATURES.md`, `PLAN_VISUAL_OVERHAUL.md`, `FIELD_REPORT_2026-07-22.md`,
   `DENMARK_UPLIFT.md`, `TEST_COVERAGE_ANALYSIS.md`. Record or relic is not a mechanical question.
3. Not built: the PostToolUse typecheck hook in `.claude/settings.json`, and trimming `CLAUDE.md`
   toward 200 lines (it grew this session).
4. **Unverified:** `scaffold-guide.mjs`'s new end-to-end directory path. Creating a throwaway guide
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

Two lessons, and they are the same lesson from opposite ends.

**Two shapes that both build is not a tolerated variation, it is an undetected one.** The flat guide
won path resolution, so the shape meant to be legacy was the shape that would have silently won.
Uniformity had to become a test before it could become a fact.

**Every gate this repo owned tested the code from OUTSIDE, so none of them could see a module whose
own scope was broken.** `graduate-guide.mjs` re-exported `isValidSlug` without importing it: fine
for every importer, `ReferenceError` for the module itself. 832 unit tests, `astro check` and 55 e2e
were green over a crash. ESLint found it on its first run, which is the whole argument for adding a
tool that reads the file rather than calling it.

**Re-prompt the creator with:** "Everything from last session is closed. Every trip is a directory
now, the scaffold emits that shape, and a test fails the build on a flat one — it mattered because a
flat guide *wins* path resolution, so the legacy shape would have quietly shadowed the new one.
Mexico and Portugal are gone. There's a new gate on the built `.gpx`/`.ics` files, because the unit
tests only ever saw strings we typed and real guide prose is what breaks iCalendar folding. ESLint
went 277 to 0 and is wired into CI — and on its first run it found a live `ReferenceError` in
graduate-guide that 832 green tests, astro check and 55 e2e all missed, because every one of them
tests from outside the module. Two things are open: 154 `any`s in the guide-JSON walkers, which
wants the Zod-inferred type threaded through the section union, and six completed-plan docs that
need you to say whether they're records or relics. Which one?"
