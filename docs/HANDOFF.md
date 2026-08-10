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
  `docs/COMPETITIVE_LANDSCAPE.md` (market parity reference) ·
  **`docs/archive/PLAN_ATLAS_MIGRATION.md`** (the current work order — its own Progress ledger is the
  source of truth for which stage is next; read that before re-deriving status from git log).

## Snapshot (2026-08-09b — making the tests readable, and proving they catch anything)

Two asks, both about trusting the suite rather than adding to it: make the tests legible to a
non-coder, and make sure each one tests something real.

**Legibility became two generated documents.** `docs/WHAT_THE_TESTS_PROTECT.md` groups all 1715
checks under the promise each keeps, sourced from a `// @protects-file` line now carried by every
one of the 145 test files; CI fails if it goes stale. Its sibling `docs/WHERE_THE_TESTS_ARE_BLIND.md`
is the honest half. The comment-density cap (22%, baseline of 16 files) came straight from the
creator's "slim down the slop" — measured, not asserted: repo average 10.8%, my own new files
30–44%.

**"Testing something real" needed evidence, not assurance, so the repo now has mutation testing.**
Stryker breaks the source on purpose — 5974 small sabotages across `src/features/*/model` and
`src/lib` — and records which ones no test noticed. 76% caught. It runs WEEKLY and does not gate:
a mutation score is a map of thin ice, not a grade, and enforcing it breeds tests that satisfy the
metric. It immediately found real gaps in the money model: the largest-remainder tie-break decides
which person pays the leftover cent and reversing it broke nothing; undo's three
member-reference branches were only ever covered as a set, so an expense mentioning the departing
person exactly once could stop generating a patch silently; and `participants.slice()` could lose
its copy, which makes undo restore an edited history while looking like it worked. Six tests,
`undo.ts` 93→98%.

**The vendored drift checker got a classifier instead of continued neglect.** `check-drift.mjs`
emits 788 hits of which 635 are documented false positives, and that ratio is exactly why two real
MOTION violations survived a whole closeout stage. `scripts/drift-real.mjs` sorts them into eight
NAMED, justified exemption classes — never a mute — leaving **153 genuine violations** now
baselined and gated against growth. Writing it produced its own lesson: check-drift truncates its
echoed source line at 100 characters, and this repo writes one-line CSS blocks, so classifying off
that echo scored ~60 compliant rules as drift. Read the file, not the report about the file.

**The boundary checks earned their keep three times in one session.** The weekly workflow failed
in 24 seconds on its first smoke run: `stryker run` takes its config file POSITIONALLY and exits 1
on `--config`, which I had written from memory (`actions/upload-artifact@v4` was two majors stale
for the same reason). Then the drift gate passed locally and failed on CI seeing 465 of 788
violations — because check-drift calls `process.exit(1)` straight after `console.error`, and a
pipe write from Node is ASYNCHRONOUS on Linux and synchronous on Windows, so exit discarded the
tail of the biggest root. It now writes to a file descriptor. Worth remembering: any tool whose
output you capture through a pipe and which exits immediately can hand you a partial answer on
Linux only, and a partial answer from a checker reads exactly like a clean result.

## Open items

- **Three paydown lists, all recorded as baselines that can only shrink** — 153 design-drift
  violations (`scripts/drift-baseline.json`), 43 prose-shape offences, 16 over-commented test
  files (`a11y.spec.ts` at 37% is the worst). Plus 1280 surviving mutants; read
  `docs/WHERE_THE_TESTS_ARE_BLIND.md` top-down, the table is sorted by where it hurts.
- **Two of the eleven are NOT done, and neither is quietly dropped.**
  · **Print preview** (part of #8). The page-print buttons hand off to the browser's own dialog,
    which HAS a preview; the budget sheet builds a document and prints it without ever showing
    it. That is the real gap and it wants a preview-then-print shell — its own change, and the
    synchronous-gesture constraint (`window.print()` must not sit behind an await) shapes it.
  · **"Is there a need for the Next Guide?"** (#11). There is no "Next Guide" anywhere in this
    codebase. Rather than delete something I have misidentified — ask what it is.
- **A visual call for the creator.** SPEC-COMPONENTS rule 1 decided two ambiguous cases the
  kit's mobile screenshots could not settle: the bottom-bar slots and day chips are full pills.
- **Airports for Sedona/Japan** — record them WHEN flights get booked. No fact yet; don't invent.
- Tools, `/about/` and `/new/` are not in the SW precache shell. Cover overlay does not trap
  focus. LOCAL branch `worktree-agent-a7dc7eeb397c6a368` (`5917f8f`) — keep or lose.
- Cloudflare dashboard Git integration still failing 0s builds on every push.
- Korea 03: critic flagged a swapped 명동 label on the Gyeongbokgung map point → file its issue.
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.

## Where we left off

The suite is now readable by someone who does not read code, and — more importantly — it can be
checked rather than trusted. Two documents say what it protects and where it is blind, and both
are generated, so neither can quietly go out of date.

The reusable lesson is that a gate nobody reads is not a gate. `check-drift.mjs` was running the
whole time and its 90% false-positive rate is precisely why two real violations lived in its
output for a stage. The fix was not a better checker; it was naming and justifying every class of
noise so what remains is short enough to read. Same shape as the mutation report: the value is
not the 76%, it is the twelve specific lines it points at.

**Recommended next step:** pay down mutation gaps in the money model first — it is the one place
in this product where a silently wrong answer costs a real person real money, and
`WHERE_THE_TESTS_ARE_BLIND.md` names 154 of them. Then the two still-open items from the eleven:
ask what "Next Guide" refers to, and build the print-preview shell for the budget sheet.

**Re-prompt the creator with:** "Your tests can now be read like a table of contents — 1715
checks, each with one plain sentence saying what breaks for a traveller if it goes red. And
there's a second document that's more useful: the repo now deliberately sabotages its own code
6000 ways a week and records which sabotages no test noticed. 76% get caught. The 24% that don't
are a map of the thin ice, and it immediately found three real holes in the shared budget —
including one where undo would happily restore a version of history that had been edited
underneath it, while looking like it worked."
