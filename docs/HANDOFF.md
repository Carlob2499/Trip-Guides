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

## Snapshot (updated 2026-07-24, session close #6)

**Everything open at close #5 is now closed, plus a CI red that close #5 created.** Six commits,
all pushed, all three CI workflows green.

- **The 3 Playwright failures are FIXED** — all were test bugs. `field-tools.spec.ts` seeded the
  pre-R8 title-derived key (`tg-split-southkorea`) while the page reads the SLUG-derived one; both
  keys now derive from one `SLUG` const that also builds the URL, so a rename moves them together.
  `sos.spec.ts` pressed `count+1` Tabs when focus already starts on the first focusable. **e2e is
  41/41 for the first time** (was 38/3).
- **The Accessibility workflow was red, and it was our own gate's fault.** Baselines were pinned to
  counts observed on ONE machine, but a colour-contrast `incomplete` count tracks TEXT REFLOW — axe
  flags one node per text node under a sizeable ancestor pseudo-element. Measured, same build, only
  the viewport differing: **28 nodes at 1280px, 30 at 1100px**; CI's Linux fonts land on 29.
  Colour-contrast keys now carry a documented ±3 tolerance (`LAYOUT_JITTER`), everything else stays
  exact, and both failure branches were deliberately triggered to prove it still bites. The
  zero-tolerance novelty check — the part that catches real bugs — is untouched.
- **Type scale: 60 → 360 of 388 declarations tokenized (93%), in three widening passes**, and now
  GUARDED — `src/styles/type-scale.test.ts` fails the build on a new bare literal, so the number
  can't quietly slide back. The unlock: the scale only named PROSE roles, so every button/tab/pill
  invented its own size — 27 declarations at `.72rem`, 26 at `.82rem`, both in GAPS between steps.
  Added `--text-control-sm` (.72), `--text-control` (.82), `--text-h4` (1.3); **naming those three
  turned 79 declarations from "must shift size" into "already exact."** A later pass added
  `--text-nano` (.6) for 12 credits/badges/numerals sitting below the old floor. Largest size
  change on the whole site across all three passes: 7.7%. Verified rendered, not computed.
  Side effect worth knowing: `.cur-in`/`.hub-search` crossed 16px, so iOS stops auto-zooming those
  inputs on focus.
- **Four sites are hard-skipped and must stay so:** two `summary::before` rules (font-size there
  sizes `content:"▶"`, a glyph) and `.day-num`'s desktop AND mobile rules, contrast-gated at axe's
  bold-large-text cutoff — its mobile `1.2rem` is only 4.3% from `--text-lead`, so a looser
  tolerance would have silently broken contrast. Skips match by line CONTENT, which caught a second
  `summary::before` that line numbers would have missed.

## How the current state was reached (closes #2–#5, compressed)

The a11y arc: **#2** fixed all 78 measured contrast violations and added `--on-accent` +
`readableOnAll()`/`mix()`. **#3** made the gate honest — dark mode, every tab panel, and a verified
`incomplete` allowlist — which surfaced a real bug (lazy sight photos never load on a blocked
network, so `.media-fail`'s `onerror` never fired; fixed with an opt-in `.media-ok`). **#4** unified
the uppercase micro-label role across 48 rules/18 files, rebuilt the font specimen from verified
candidates, and fixed both credit-badge contrasts — then left its whole 35-file diff uncommitted
while claiming a clean tree. **#5** shipped that diff as 7 ordered commits and diagnosed the 3
Playwright failures as test bugs. **#6** fixed them and the CI red #3's gate design had created.

The durable lesson from #3 and #6 together, worth not relearning: **a gate calibrated on one
machine is not a gate.** #3 correctly insisted an unproven `incomplete` node must fail — that part
catches real bugs and stays at zero tolerance. But pinning the COUNTS to locally-observed numbers
made CI fail on font metrics, which teaches everyone to ignore a red a11y workflow.

## Left to do

1. **Form inputs are split across two sizes, and it's a real iOS bug** — `.cur-in` and
   `.hub-search` are now ≥16px so Safari no longer auto-zooms on focus, but `.ng-field input`,
   `.tk-entry-select` and `.rm-in` sit at 14.08px and still trigger it. Making them all
   `--text-body` fixes the zoom-jump but visibly enlarges those fields, so it wants a decision
   rather than a codemod.
2. **Fluid type for the heading band** (the ~1.3–1.6rem sizes) is the open architectural idea —
   phone-vs-desktop is currently handled by hand-written breakpoints. Body/UI text should stay
   fixed (a phone is held closer; shrinking body text hurts). Two cautions live in
   `base.css`'s comment and `.day-num`: fluid sizes cross axe's 18.7px large-text threshold
   continuously, at widths nobody tests, silently changing which contrast bar applies.
3. **The type scale is otherwise closed and now self-defending** — 360/388 tokenized, with
   `src/styles/type-scale.test.ts` failing the build on any new bare literal. To add a legitimate
   exception, extend its ALLOWED list with a reason; the list is closed on purpose.

## Owner tasks (unchanged, still outstanding)

1. **Revoke** the old GROQ key at the Groq console (out of `.env`, not revoked).
2. **W5 label-free test — approved but NEVER RUN.** `GH_TOKEN` is on the Worker; the plan was to
   disable `New guide scaffold`, POST a real payload, confirm the issue files, delete it, re-enable.
   The permission classifier blocks the workflow toggle, so the creator must flip it.
3. **W2:** mint a read-only Firebase RTDB service account → repo secret `FIREBASE_SERVICE_ACCOUNT`.
4. Delete merged remote branch `claude/test-coverage-analysis-siftjs` (sandbox 403s on ref deletion).
5. Commit `eae5573`'s subject line is a literal `@` (PowerShell here-string leaked into Bash); the
   body is intact. The Fact-Forcing Gate blocks `--amend`, so repairing it needs the guard off.

**W6 (real end-to-end pipeline proof) stays deferred, gated on an actual trip** — creator's choice.
Prior W0–W5 arc (token canary, pre-trip auto-recert, LEARN loop, IMPROVE loop, PDF intake,
zero-click Worker) is complete and live; detail in `docs/PIPELINE.md` and the git log.

## Where we left off

Everything open at close #5 is closed (details in Snapshot). The through-line: the type-scale
migration was a NAMING problem, not a sizing problem — name the roles the codebase is already
using and most of the "migration" becomes exact matches. It ended at 93% with a drift guard
holding it there, because adoption is a state you hold, not one you reach.

Still deliberately untouched: `git stash list` holds `stash@{0}: WIP on main: 541b755 …`, based on
a commit far behind `main`.

**Re-prompt the creator with:** "Everything from last session is closed. The 3 Playwright failures
are fixed — all three were test bugs, not source bugs, so e2e is 41/41 for the first time. I also
found and fixed a CI red we'd caused ourselves: the a11y gate was pinning its baselines to whatever
machine last ran the suite, so CI's Linux fonts made it fail on a push with no a11y change in it;
it now has a measured tolerance, and I deliberately failed both of its branches to confirm it still
catches real growth. The type scale is done and defended: 93% tokenized (60 → 360 of 388), with a
guard that fails the build on any new stray size. The reason it got that far is worth knowing — the
scale only ever named prose roles, so every button, tab and pill had invented its own size, 47 of
them clustered in the gaps between steps. Naming those control sizes turned 79 declarations from
'must shift' into 'already exact', so the biggest change anywhere on the site was 7.7%. Two things
left on my list, both needing you rather than a codemod: some form inputs are still under 16px and
will make iOS zoom when tapped, and fluid sizing for the heading band is an open idea. Where next?"
