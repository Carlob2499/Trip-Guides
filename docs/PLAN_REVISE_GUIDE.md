# PLAN — revise-guide: the MAJOR-revision pipeline

> **SHIPPED — all six phases (V1–V6). This doc is now the pipeline's SPEC, not a plan.**
> Kept in `docs/` rather than archived precisely because live code points at it:
> `revise-guide.yml`, `modify-guide.yml`, `feedback-export.yml`, `docs/PIPELINE.md` (stage 5b)
> and `scripts/feedback-signals.mjs` all cite it as the reference for behaviour they implement.
> Verified present: the three labels (`ensure-labels.yml`), the issue form + parser +
> plan validator, the four routed agents and the fork gate (`revise-guide.yml`), and the
> deterministic feedback-signal auto-file (`feedback-signals.mjs`). Read it as documentation
> of what runs today.
>
> Synthesizes two independent designs (a reuse-first lens and a failure-first lens) into one
> executable arc. Drafted 2026-07-30, session on `main`. Extends the factory the same way
> modify-guide did: verbatim reuse of `land-branch.sh`, `verify-guide.mjs`,
> `check-run-integrity.mjs`, `append-run-report.mjs`, the two-label gate, the DATA-channel
> pattern, and the claude-code-action invocation shape. **Execution model: routed per pass**
> (table below) — the first workflow in this repo to do model fallback, so that path gets a
> forced failure before anything ships on top of it. Every phase ends with the full Ship Loop
> (CLAUDE.md) and its own gate. Phases are ordered so each one protects the ones after it.

## Creator decisions already made (do not re-ask)

- **Single intake surface.** The site's "Request a change" button + modify-guide issue
  template stay the one human entry point. The OWNER triages weight at approval time via
  label: `modify-approved` = today's light edit (modify-guide.yml runs unchanged),
  `revision-approved` = this pipeline.
- **Feedback loop may auto-file.** The learnings synthesis pass AUTO-FILES a draft
  revision-request issue when divergence signals are strong; the owner's label remains the
  ONLY execution gate — auto-filed issues are inert until `revision-approved` is applied.
- **Model routing.** Plan + critic passes request claude-fable-5 with explicit fallback to
  claude-opus (Fable may be unavailable in the Actions runner); research execution on Opus;
  mechanical edits + build loop on Sonnet.
- **Pipeline shape.** (1) Fable planning pass reads current guide + request + feedback
  synthesis → structured revision plan (sections to re-research, sections to ripple-check,
  reconciliation items); (2) Opus/Sonnet execute — scoped dual-pass research on named
  sections only, reconciliation on new facts, continuity sweep; (3) Fable critic pass on the
  revision DIFF (the P5 fresh-context pattern); (4) land via existing `land-branch.sh`.
- **Not reused, deliberately:** the `<slug>.state.json` spine. Its stages are whole-guide
  booleans for a NEW guide's scaffold→verified lifecycle; reopening a graduated guide's
  cleared stages is the documented "deliberate manual act." The revision plan file (V3) is
  its own resume artifact.

## Synthesis rulings — where the designs diverged, one pick each

1. **Intake escalation** — Design A's OR-guard + Design B's parser fallback, combined: the
   job guard accepts `revision-approved` on an issue carrying EITHER `modify-request` or
   `revision-request`; the parser tries the revise body shape, then falls back to modify's —
   this is what honors the locked single-surface decision (the new template exists only as
   the auto-file/power-user body shape, never a second button).
2. **Plan validation** — B's deterministic `validate-revision-plan.mjs` over A's jq-only
   routing: "the plan names a section that doesn't exist" is exactly the seam class prompts
   and tests can't catch. A's `jq .status` route steps are kept for stage skipping.
3. **Plan file location** — A's `guides-intake/<slug>.revision-<issue#>.json`, not B's
   repo-root `revision-plan.json`: per-guide artifact convention, and concurrent revisions
   of different guides can't collide.
4. **Executor split** — B's two agents (R research / M mechanical), because the locked model
   routing (Opus research, Sonnet mechanical) cannot be honored inside A's single agent.
5. **Self-correct budget** — B's 3 rounds, not A's 6: draft-landing is the designed escape
   hatch, and rounds past 3 buy churn, not passes.
6. **Reconciliation ledger** — A's single `## Research reconciliation` table with dated
   `### Revision #<n>` subheadings, not B's table-per-issue: one append-only ledger per guide.
7. **Auto-file signals** — B's deterministic node step, not A's prompt paragraph: thresholds
   are pure logic, unit-testable, and the agent only drafts and files.
8. **Concurrency** — B's `guide-<slug>` concurrency group adopted and retro-added to
   modify-guide: A missed the modify-vs-revise same-guide race entirely.
9. **Attempt/void machinery** — A's verbatim reuse of `check-run-integrity.mjs` +
   `void_retry` + the ledger issue, capped at B's 3 attempts (each revise attempt is expensive).
10. **Critic fix rounds** — B's 2, not A's 3: the critic reviews a diff, not a guide.
11. **`revision-changes.txt`** — B's old→new token list (Agent R must emit it) adopted: it
    gives the continuity sweep and the critic mechanical grep targets instead of vibes.
12. **Pass-B blindness** — the shared prompt-level version ("search from the plan's
    questions, never from the guide's current claims"), with A's
    `<slug>.revision-<n>.passB.json` artifact so the critic's forbidden-reads list stays
    meaningful; hard context-level blindness is a later fourth-agent split if the owner ever
    wants it — flagged, not built.
13. **Resume state** — no separate state file (B's `{plan, research, sweep, critic}` json
    dropped): the plan file's own `status` field is the resume artifact (A), advancing
    `planned → researched → swept`, routed by jq exactly like research-pass's `nextStage`.

## Model routing

| Pass | Primary | Fallback | Why |
|---|---|---|---|
| Agent P — planner | claude-fable-5 | claude-opus-5 | locked; plan quality gates everything downstream |
| Agent R — scoped research + reconcile | claude-opus-5 | claude-sonnet-5 | locked (research on Opus); Sonnet fallback keeps a paid-for run alive |
| Agent M — ripple sweep + build loop | claude-sonnet-5 | — | locked; grep sweeps and build-fix rounds need no depth (modify-guide precedent) |
| Agent C — critic on the diff | claude-fable-5 | claude-opus-5 | locked; P5 fresh-context pattern |

Mechanism: `--fallback-model` in `claude_args` if the pinned action version supports it;
otherwise a 5-line preflight step (1-token probe call, `MODEL` output, fed to `--model`).
This is the arc's one genuinely net-new bit of infrastructure — smallest possible version,
and its failure path is forced once in V3 (Boundary checks, below). `workflow_dispatch`
exposes `slug`, `plan_model`, and `effort` (default `high`, creator 2026-07-30) for reruns/rescue, mirroring
research-pass.yml.

## Phases

### V1 — Labels (the substrate everything consumes)

**What.** Add `revision-request`, `revision-approved`, `revision-auto-filed`,
`needs-decision` to the existing `.github/workflows/ensure-labels.yml` list; run it once.
**Why.** GitHub happily accepts undefined label strings on `gh issue edit` — a missing label
makes the gate silently never fire or the auto-file step fail. This is the exact bug class
Boundary Check #1 exists for, and everything downstream consumes these four strings.
**Files.** `.github/workflows/ensure-labels.yml`.
**Gate:** `gh label list | grep revision` shows all four before any consumer merges.

### V2 — Template, parser, plan validator (pure logic, unit-gated)

**What.**
1. `.github/ISSUE_TEMPLATE/revise-guide.yml` — mirror of the modify template's shape:
   `title: "Revise: "`, auto-label `revision-request`; fields `slug` (required), `what-changed`
   (required textarea — why this needs re-research), `sections` (optional comma list of group
   hints), `deadline` (optional — "traveler dates changed to…"). Exists for auto-filed issues
   and power users; the human surface stays the modify template per the locked decision.
2. `scripts/parse-revise-issue.mjs` (~40 lines) — `import { field, isValidSlug } from
   './graduate-guide.mjs'; import { sanitizeSection } from './parse-modify-issue.mjs'`.
   Tries the revise field headings, falls back to modify's (so an escalated modify issue
   parses without edits). `sections` split on comma, each token through `sanitizeSection`,
   empties dropped. Output via the `GITHUB_OUTPUT` heredoc pattern; `what-changed` is
   DATA-channel only, never interpolated.
3. `scripts/validate-revision-plan.mjs` — the deterministic gate on Agent P's output:
   every `group` in `reResearch`/`rippleCheck` MUST appear in the runner-built
   `sections.json` ground truth; `reResearch` length ≤ 5 (a plan wanting more is a
   re-research — the validator's message says "route to research-pass instead");
   `budget.maxSelfCorrectRounds` ≤ 3; any `forks[].blocking == true` → a distinct exit code
   the workflow maps to the fork gate.
**Why.** All three are pure logic — existing unit-gate territory, cheap to lock before any
agent exists to feed them.
**Files.** the three above + unit tests beside `parse-modify-issue`'s (must include the
nonexistent-section and blocking-fork validator cases).
**Gate:** `npm test` green; the template can merge and accumulate issues harmlessly.

### V3 — Workflow skeleton through the planner only

**What.** `.github/workflows/revise-guide.yml`, two jobs. A tiny first `parse` job resolves
the slug (concurrency group keys can't read same-job step outputs), then the `revise` job:
`concurrency: { group: guide-<slug>, cancel-in-progress: false }`, `timeout-minutes: 120`,
branch create-or-resume `revise/<slug>-<issue#>` (new namespace beside `modify/`,
`research/`, `recert/`, `absorb/`), git identity `waypoint-revise[bot]`, permissions
`contents: write, pull-requests: write, issues: write` — setup blocks copied verbatim from
modify-guide.yml. Steps:
1. **Guard** — `github.event.label.name == 'revision-approved'` AND the issue carries
   `modify-request` OR `revision-request` (ruling 1). `modify-guide.yml`'s own trigger
   needs zero changes.
2. **Parse + existence check** — `parse-revise-issue.mjs`; then `test -d
   src/content/guides/$SLUG` — a revision of a nonexistent guide is a triage error: fail
   loudly with an issue comment, no agent spend.
3. **DATA write** — `printf '%s' "$WHAT_CHANGED" > change.txt` (modify L104–107 pattern).
4. **Deterministic context assembly** (bash, not agent) — `revision-context/`: group
   inventory (`ls`), `_guide.json`, `guides-intake/<slug>.md` and `learnings/<slug>.md` if
   present, `change.txt`, and `sections.json` — the authoritative list of real group files
   the validator checks against. No Firebase access anywhere: the pipeline consumes only the
   committed, privacy-safe synthesis artifacts, never `feedback-export.working.json`.
5. **Agent P — planner** (Fable→Opus). Reads from disk with Read/Grep, never gets the guide
   pasted; ordered: `_guide.json` + `sections.json` + `change.txt` + learnings synthesis +
   `docs/TRAVELER_PATTERNS.md` + `SKILL.md` first, individual `NN-<group>.json` files ONLY
   for groups plausibly touched (directory-per-group exists precisely so this stays bounded).
   Forbidden: any other guide, working exports, git history. Writes
   `guides-intake/<slug>.revision-<issue#>.json`, commits it, stops:

   ```json
   {
     "slug": "korea", "issue": 123,
     "status": "planned",            // planned | researched | swept — the routing field
     "summary": "one-paragraph restatement in the planner's words",
     "reResearch": [ { "group": "03-sights.json", "why": "...",
                       "questions": ["specific research questions"],
                       "passB": true, "priority": 1 } ],
     "rippleCheck": [ { "group": "01-days.json", "greps": ["÷3", "stale token"], "why": "..." } ],
     "reconcile":   [ { "item": "...", "current": "what the guide says",
                       "signal": "what feedback/request says" } ],
     "forks": [ { "question": "...", "options": ["A","B"],
                  "recommendation": "A because ...", "blocking": true } ],
     "outOfScope": ["named exclusions so the executor doesn't creep"],
     "budget": { "maxSelfCorrectRounds": 3, "expectedGroupsTouched": 4 }
   }
   ```
6. **Validate plan** — `validate-revision-plan.mjs` against `sections.json`. On failure: ONE
   re-prompt retry (second Agent P invocation with the validator errors appended), then
   draft-fail with an issue comment.
7. **Fork gate** (Clarifying-Questions Doctrine: never silently pick a fork) — on the
   validator's blocking-forks exit code, the workflow comments the questions on the issue
   (numbered, recommendations first), applies `needs-decision`, and STOPS. Owner answers in
   a comment and re-applies `revision-approved`; the re-fired run's route sees the plan
   exists and Agent R's absorb-answers preamble folds the owner's comment into the plan and
   empties `forks`. This reuses relabel-re-fires + issue comments — no new event plumbing.
**Why.** The plan file IS the interface between all four agents — get its quality right
before any expensive pass exists, and isolate the two riskiest seams (Fable availability,
planner token size) while a failed run costs one cheap invocation.
**Files.** `.github/workflows/revise-guide.yml` (through step 7 only).
**Gate:** dispatch on a real guide with a toy request; the committed plan JSON is judged
good by hand; the model fallback forced-failure has run (Boundary checks below); a blocking
fork on a test issue stops the run and the relabel resume routes past the planner.

### V4 — Execution agents + landing (draft-only first)

**What.** Two more agent invocations, routed by `jq .status` on the plan file:
1. **Agent R** (Opus→Sonnet, effort input default `high`, tools incl. WebSearch/WebFetch) —
   for each `reResearch` entry, a compressed scoped dual-pass: Pass-A-style primary-source
   verification per research-pass Agent 1's rules with its existing section-scoping sentence
   ("Scope this pass to the '<section>' section only; leave all other sections as-is"), then
   for entries with `"passB": true` a Pass-B-style local/crowd check working from the plan's
   `questions`, never from the guide's current claims (the enforceable half of blindness —
   ruling 12), appending findings to `guides-intake/<slug>.revision-<n>.passB.json` (same
   array shape as `<slug>.passB.json`). Reconcile merges passB findings + the plan's
   `reconcile` items with research-pass Agent 3's AGREE/A-only/B-only/CONFLICT semantics into
   the existing `## Research reconciliation` table under a dated `### Revision #<n>`
   subheading (create the section if the guide predates it). New facts get verification dates
   on write. Agent R MUST leave `revision-changes.txt` — an old→new token list — before
   setting `status: "researched"` and committing. Fences copied from modify-guide:
   file-as-data framing for `change.txt`; never touch any other guide.
2. **Agent M** (Sonnet) — applies `rippleCheck` plus the mandatory whole-guide grep sweep
   (modify-guide's continuity clause verbatim), seeded with the plan's `greps` AND every old
   token in `revision-changes.txt`, explicitly not limited to them. Then the self-correct
   loop: `npm run verify -- --slug <slug>` + `npm run build`, max 3 rounds; round 3 without
   PASS → commit as-is and land as draft, never a 4th round. Never silence a flag — downgrade
   to ⚠ or omit. `git fetch && git rebase origin/main`, set `status: "swept"`, push.
3. **Run-integrity + budget** — `check-run-integrity.mjs` snapshot/gate and the `void_retry`
   re-dispatch copied verbatim from research-pass.yml, attempt cap 3;
   `append-run-report.mjs` to the pinned ledger issue, tagged `revise`.
4. **Concurrency retro-fit** — the same `guide-<slug>` group added to modify-guide's job in
   this PR, so modify and revise on one guide queue against each other; land-branch's
   conflict→draft downgrade catches the residual race.
**Why.** This is where money is spent and files change — it lands draft-only (PASSED
hardcoded false for the first live run) so a bad revision is a readable PR, not a live guide.
**Files.** `revise-guide.yml` (Agents R+M, routes, integrity steps),
`.github/workflows/modify-guide.yml` (concurrency group only).
**Gate:** a full run on a low-stakes real revision lands a draft PR whose diff, ledger rows,
and `revision-changes.txt` all read correctly; a modify and a revise fired on the same slug
within a minute show the second run queued in the Actions UI.

### V5 — Critic on the diff + flip to real merge

**What.** **Agent C** (Fable→Opus, fresh context per P5), gated by a non-agent route:
`verify-guide.mjs` exit 0 AND attempt budget ok (research-pass "Route after Reconcile"
verbatim). May read: `git diff main...HEAD` (the primary review object), the finished guide
dir, the revision plan JSON, `guides-intake/<slug>.md`, `docs/GUIDE_RUBRIC.md`, the skill.
Forbidden: `change.txt`, the revision passB.json, agent transcripts, commit messages, git
history beyond the diff — fresh eyes on the result. Tasks: (a) plan conformance — every
`reResearch`/`rippleCheck`/`reconcile` item changed or explicitly declared no-change-needed;
(b) ripple audit — grep every old token in `revision-changes.txt` across the WHOLE guide dir
AND `dist/` after a build (the Ship Loop's compiled-grep, moved into CI), plus stale tokens
the critic derives itself from the diff — it doesn't trust the plan's list; (c) the bar test
on changed sections only; (d) generic-probability scan on new prose. Every finding requires a
primary-source-verified replacement applied directly — "consider" is insufficient (Agent 4
rule verbatim). ≤2 fix rounds, re-verify, then land: `npm run verify -- --slug <slug>
--markdown > /tmp/scorecard.md`, `land-branch.sh revise/<slug>-<n> main "revise(<slug>):
#<n>" /tmp/scorecard.md <PASSED>` — **no ANNOUNCE_URL** (a revision of a published guide is
not a new publication; if a revision ever flips `draft: true`, that's graduate-guide.yml's
job). `merged:<n>` → comment + close issue; `draft:<n>` → comment + keep open (modify
L173–182 verbatim).
**Why.** Diff-scoping is simultaneously the critic's token-limit guard and what makes P5's
fresh-context pattern work on an edit instead of a whole guide.
**Files.** `revise-guide.yml` (Agent C + land steps; V4's hardcoded draft flag removed).
**Gate:** end-to-end real merge on the V4 smoke revision; the critic demonstrably catches a
hand-planted stale token in a dry run (leave one old value behind on the test branch, watch
finding (b) fire).

### V6 — Feedback auto-file + docs

**What.** In `.github/workflows/feedback-export.yml`: add `issues: write`; a deterministic
node step after `summarize()` computes per-slug divergence signals — avg overall ≤ 3, avg
pacing ≤ 2, visited done/total < 60%, or any tab group with 100% of planned stops skipped
(thresholds are Q4's to confirm) — into a signals file; the synthesis agent's prompt gains
ONE paragraph: for each listed slug, dedup first (`gh issue list --label revision-request
--state open --search "in:title <slug>"` — skip on hit), then `gh issue create --title
"Revise: <slug> (feedback-driven)" --label revision-request,revision-auto-filed` with a body
matching the revise template's field headings so `parse-revise-issue.mjs` parses it
identically. Body contains ONLY aggregates and pattern summaries — **zero verbatim
freeform**; the privacy rule extends to issue bodies. No `revision-approved` is ever applied:
auto-filed issues sit inert until the owner acts. Docs: one "major revision" stage in
`docs/PIPELINE.md`, a line in `docs/HANDOFF.md`.
**Why.** Last because it's optional sugar on a working pipeline, needs the template's field
headings frozen (V2), and its smoke test is meaningless before V3–V5 exist.
**Files.** `.github/workflows/feedback-export.yml`, one new pure-logic signals module + test,
`docs/PIPELINE.md`, `docs/HANDOFF.md`.
**Gate:** the auto-file boundary check below passes — exactly one issue filed, dedup proven,
issue closed after inspection.

## Boundary checks (the seams this arc touches, per CLAUDE.md)

| Seam | Cheap check | When |
|---|---|---|
| GitHub label store | Ship V1 first, run ensure-labels, `gh label list \| grep revision` before any consumer merges | V1 |
| Actions model catalog (Fable availability) | Dispatch once with the plan model deliberately misspelled (`claude-fable-5x`); watch the fallback path *actually execute* and the step succeed — a fallback that has never run is an assumption | V3 |
| Relabel-re-fires resume (fork gate) | On a test issue: trip a blocking fork, answer in a comment, re-apply `revision-approved`; confirm the workflow re-fires and routes past the planner | V3 |
| Two workflows on one guide dir | Fire a modify and a revise on the same slug within a minute; confirm the second shows "queued" in the Actions UI | V4 |
| Auto-file → live issue tracker | Hand-plant a signals file (or temporarily lower a threshold), dispatch feedback-export, confirm ONE issue appears with both labels AND a second dispatch files nothing; close it | V6 |

Do not generalize these into more tests — the parser, validator, and signals module are pure
logic where the unit gates are the right tool. These five are the places this arc's code
meets systems it does not control.

## Clarifying questions

**ANSWERED by the creator (locked — do not re-ask):**

- **Q1 · Intake surface:** single surface — existing "Request a change" button + modify
  template; owner triages via label (`modify-approved` light / `revision-approved` heavy).
- **Q2 · Feedback loop:** synthesis may auto-file a draft revision-request issue on strong
  divergence signals; owner label approval remains the only execution gate.
- **Q3 · Model routing:** plan + critic on claude-fable-5 with explicit claude-opus fallback;
  research on Opus; mechanical edits + build loop on Sonnet.

**NEW forks this synthesis surfaced (answer before the named phase executes):**

- **Q4 · Auto-file thresholds (before V6).** Recommendation: avg overall ≤ 3, avg pacing ≤ 2,
  done/total < 60%, or any group 100%-skipped — the group-skip signal is the strongest
  "this guide's plan diverged from reality" indicator and is already computable from
  `tallySkipsByGroup`. The two designs proposed slightly different fourth signals (100%
  group skip vs ≥3 clustered skip reasons); numbers that file issues in the creator's
  tracker are the creator's to sign.
- **Q5 · Over-cap plans (before V3).** When the planner wants > 5 reResearch groups, the
  validator stops with "route to research-pass instead." Recommendation: stop-with-message
  only, owner re-routes by hand — auto-dispatching a full research pass from inside a revise
  run is a cost decision the label gate exists to keep human. Confirm, or name an auto-route.
- **Q6 · Smoke target (before V3's first dispatch).** The plan needs one real, low-stakes
  revision request to exercise V3–V5 (e.g. a dates-shift on an existing guide).
  Recommendation: korea or denmark with a toy dates-shift; the creator supplies the actual
  slug + request text — a fabricated request would test the pipeline against nothing real.

## Standing constraints

- Ship Loop after every phase; never `astro dev`; grep `dist/` (V5 moves that grep into the
  critic for revisions, but interactive sessions still run it).
- Content the agents touch obeys the waypoint-guide-author skill (verification dates on
  write, continuity sweeps, ≈/⚠ flags); no fact invented to fill any surface.
- Raw `freeform` feedback is never rendered, never pasted verbatim — including into issue
  bodies (V6) and critic inputs (V5's forbidden list).
- The `<slug>.state.json` spine stays untouched by this pipeline, per the header ruling.
- Key reused files, for the executor's orientation: `scripts/land-branch.sh`,
  `scripts/verify-guide.mjs`, `scripts/check-run-integrity.mjs`,
  `scripts/append-run-report.mjs`, `scripts/graduate-guide.mjs`
  (`field`/`isValidSlug`), `scripts/parse-modify-issue.mjs`
  (`sanitizeSection`), prompt boilerplate from
  `.github/workflows/modify-guide.yml` and
  `.github/workflows/research-pass.yml`.
