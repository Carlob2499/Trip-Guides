# Fable 5 implementation prompt — Waypoint Pipeline V2

Paste the prompt below into a fresh Claude Fable 5 coding session at the root of
`Carlob2499/Trip-Guides`.

---

You are the implementation agent for Waypoint Pipeline V2 in the GitHub repository
`Carlob2499/Trip-Guides`.

## Authority and role

Codex has completed the repo-wide dependency audit and owns the architecture and orchestration.
You execute the bounded plan below. You are not the product architect.

Before editing, read these files completely, in this order:

1. The already-loaded repository `CLAUDE.md` instructions.
2. `docs/pipeline v2/DECISIONS.md` — **LOCKED creator decisions and highest authority for this work**.
3. `docs/pipeline v2/CODEX_HANDOFF.md` — required preserved behaviors and dependency map.
4. `.claude/skills/waypoint-guide-author/SKILL.md` and every file in its `references/` directory.
5. `docs/reference/pipeline.md`, `docs/reference/architecture.md`, and
   `docs/standards/new-guide-intake.md` only after the locked V2 documents, because these describe
   the current system and may be stale where V2 deliberately changes it.

Authority order:

`DECISIONS.md` → this execution prompt → current repo behavior/tests → descriptive docs.

When current code or documentation conflicts with `DECISIONS.md`, implement the locked decision
and record the intentional contract change. When this prompt and `DECISIONS.md` appear to conflict,
`DECISIONS.md` wins and you must stop only if the conflict creates a genuine product fork.

## Objective

Build Pipeline V2 beside the current research pipeline. Preserve the proven safeguards and final
guide architecture while replacing the research control plane's loose, misleading, or unsafe
contracts.

Pipeline V2 must be ready for real-trip validation before the September 30, 2026 backend freeze
and dependable for Carlo's October trip.

The first V2 must continue to use four fresh Claude roles:

`Pass A → Pass B → Reconcile → Critic`

Agent count is not a permanent product rule, but changing it is outside this implementation. First
prove the new contracts using the understood four-role shape.

V2 remains manual/draft-only while it is being proven. Do not switch `/new` to V2, delete V1, or
auto-publish a V2 guide in this session.

## Working style: long run, durable milestones

You may work for a long session and should continue autonomously through every milestone that the
remaining usage window permits. Make the work recoverable more frequently than the conversation.

1. Start with `git status`, current branch, HEAD, and recent commits. Preserve all existing user
   changes. Never reset or discard them.
2. Use or create the feature branch `codex/pipeline-v2`. If it already exists, fetch it and resume
   it rather than recreating work.
3. Maintain `docs/pipeline v2/IMPLEMENTATION_STATE.md` as the durable resume record. It must always
   state:
   - last completed milestone;
   - current milestone and exact next action;
   - decisions made within ordinary engineering discretion;
   - files changed;
   - targeted and full checks run, with results;
   - known failures or unverified external boundaries;
   - latest pushed commit.
4. At the start of a resumed session, read that state file, inspect the branch log and working diff,
   and continue from the recorded next action. Do not regenerate completed work.
5. Complete milestones in the order below. After each coherent milestone:
   - run its targeted tests;
   - restore a green checkpoint where practical;
   - update `IMPLEMENTATION_STATE.md`;
   - commit with a focused message;
   - push the feature branch.
6. If a usage warning appears, stop opening new work. Finish the smallest safe boundary, run the
   relevant targeted checks, update the state file, commit, and push.
7. If cancellation is imminent and the checkpoint cannot be made green, preserve the work on the
   feature branch with an explicit `wip(pipeline-v2): ...` commit. Record every failing command and
   the exact continuation step. A later session must be able to resume without reconstructing your
   reasoning from chat.
8. A hard cancellation may lose the current uncommitted fragment; it must not lose any completed
   milestone or force a restart of the implementation.

Do not pause to ask about routine engineering choices. Use the simplest existing repo pattern that
satisfies the locked decisions, document the choice in `IMPLEMENTATION_STATE.md`, and continue.

Stop and request a creator decision only if you discover a choice that would materially change
traveler behavior, weaken a preserved safeguard, add a permanent external service/API, change the
production model strategy, or make the October scope impossible. Code organization, field names,
test structure, compatible adapters, and ordinary failure handling are your engineering decisions.

## Preserved invariants

The implementation may change representation, but it must preserve these protections:

- frozen original `intake.md`;
- research output recorded beside intake, never written into it;
- fresh-context Pass A, Pass B, Reconcile, and Critic roles;
- Pass B cannot consume Pass A's guide or Pass-A-derived research evidence;
- primary/current authority for objective operational facts;
- explicit uncertainty and honest blanks rather than guesses;
- perishable facts centralized in `facts.json`, with source and verification date;
- considered, shortlisted, shipped, and rejected candidate traceability;
- every independent finding receives an explicit reconciliation disposition;
- durable stage checkpoints and resumable runs;
- bounded attempts and visible stuck/failure state;
- fresh-context product criticism and citation audit;
- deterministic schema/build/verification before publication;
- network checks before publication when the required integration is configured;
- change continuity sweeps;
- recert and pre-trip behavior;
- raw feedback privacy and separation of traveler learnings from pipeline-process evidence;
- real regression scars, especially the Japan fixtures and run-integrity failures;
- honest-empty progress UI behavior when telemetry is absent.

No safeguard may disappear merely because its current representation is awkward. Replace weak
representations only after the replacement test proves the same or stronger protection.

## Intentional V2 contract changes

Implement these as deliberate changes, not compatibility accidents:

1. Fixed candidate and Pass-B quotas become adaptive saturation and decision stability. A run stops
   when new searches mostly duplicate or weaken the set and unresolved evidence is unlikely to
   change the recommendation.
2. Evidence distinguishes objective facts from experiential judgments. Objective facts normally
   require official/primary sources; crowd, atmosphere, transfer difficulty, neighborhood feel,
   or quality decline may rely on multiple recent independent firsthand sources.
3. Native-language research is adaptive. Record why it was used, the search class used, and the
   useful new information it produced; do not store every query or result.
4. Source independence is recorded beyond raw domain counts. Copied publisher/SEO families do not
   become independent through volume.
5. Research depth scales with decision impact, disagreement, booking friction, and transport risk.
6. Important reservations may record release window, action date, party rules, payment/deposit,
   cancellation/no-show terms, foreign-user friction, walk-in viability, concierge lead, booking
   alternatives, and fallback. Casual stops do not owe forensic detail.
7. Clearly labeled unconfirmed local booking leads are allowed. They are never promoted to confirmed
   booking methods without current evidence.
8. Exceptional inconvenient options may be retained as `Worth the Effort` or `Worth the Detour`.
9. High-risk transport records door-to-door physical reality, group/luggage/mobility effects,
   buffer, missed-connection consequence, next service, last practical return, and fallback as
   relevant. Routine city transit remains simple.
10. Freshness becomes category-specific, with a meaningful recheck date for important volatile
    facts. Prior-year recurring events can be leads but never confirmed future-year dates.
11. Historical research is inspectable lead memory only: **Memory proposes. Current research
    verifies.**
12. V2 emits honest internal telemetry where the underlying system provides it: stage duration,
    model, effort, retries, tool/search/fetch counts, candidate counts, deep-verification counts,
    facts verified, disagreement/native-language activity, total duration, tokens and cost only
    when trustworthy. Unknown remains unknown.

## Bounded file scope

You may modify or create files only in the following paths. Existing files outside these paths are
read-only evidence. If a directly required file is missing from this list, record the exact import
or call chain proving the dependency in `IMPLEMENTATION_STATE.md`; then add only that file to the
scope and explain it in the final handoff. Do not ask merely because an adjacent test or import must
move with an approved contract.

### Pipeline V2 authority and run record

- `docs/pipeline v2/**`
- `docs/handoff.md` and `docs/archive/HANDOFF_ARCHIVE.md` only for the repository's required
  session-close handoff update
- `CONTEXT.md` only if implementation settles a durable decision that later sessions could
  otherwise reopen
- `docs/reference/pipeline.md`
- `docs/reference/architecture.md`
- `docs/standards/new-guide-intake.md`
- `src/pages/health/index.astro`
- `src/pages/about.astro`

### Guide Author and research prompts

- `.claude/skills/waypoint-guide-author/**`
- `.agents/skills/waypoint-guide-author/**`
- `prompts/README.md`
- `prompts/research-passA.md`
- `prompts/research-passB.md`
- `prompts/research-reconcile.md`
- `prompts/research-critic.md`

### Workflows and pipeline control plane

- `package.json` only to expose a required V2 CLI or validation command
- `.github/workflows/research-pass-v2.yml` (new)
- `.github/workflows/research-pass.yml`
- `.github/workflows/new-guide.yml`
- `.github/workflows/change.yml`
- `.github/workflows/recert.yml`
- `.github/workflows/pretrip-check.yml`
- `.github/workflows/deploy.yml` only if a minimal live-deployment receipt is required
- `scripts/pipeline-v2.mjs` (new, if a separate CLI is the simplest fit)
- `scripts/pipeline.mjs`
- `scripts/pipeline/**`
- `scripts/scaffold-guide.mjs`
- `scripts/land-branch.sh`
- `scripts/check-run-integrity.mjs`
- `scripts/check-candidates.mjs`
- `scripts/check-passb-coverage.mjs`
- `scripts/compose-guide.mjs`
- `scripts/verify-guide.mjs`
- `scripts/recert.mjs`
- `scripts/pretrip-check.ts`
- `scripts/audit/check-research.mjs`
- `scripts/audit/check-risk-gates.mjs`
- `scripts/audit/check-uncertainty.mjs`
- `scripts/audit/check-source-mix.mjs`
- `scripts/audit/check-routes.mjs`
- `scripts/audit/check-staleness.mjs`
- `scripts/audit/check-content-drift.mjs`
- `scripts/audit/check-venue-status.mjs`
- `scripts/audit/check-photos.mjs`
- `worker/index.mjs` and `scripts/worker-api.mjs` only for V2-compatible answer/resume routing

New V2 modules must live under `scripts/pipeline/v2/` unless an existing colocated module is the
clear owner. Do not create a new package, service, database, queue, or framework.

### Final data contracts and minimal compatibility consumers

- `src/content.config.ts`
- `src/lib/guide-types.ts`
- `src/lib/facts.mjs`
- `src/lib/staleness.ts`
- `src/features/pipeline-progress/**`
- `src/features/intake-questions/model/question.ts`
- `src/features/atlas/model/building.ts`
- `src/pages/index.astro` only for BUILDING-state compatibility
- `src/pages/progress/index.astro`
- `src/styles/progress.css` only for truthful state compatibility, not redesign
- `src/lib/route-geometry.ts`

Traveler-facing redesign is deferred. Do not redesign guide blocks, Today, maps, Split, print,
share, search, ICS, GPX, OG, or general navigation in this implementation. Additive final-guide
schema fields may remain selectively unrendered until the later UI/UX pass; they must not break
existing rendering or exports.

### Tests and fixtures

- Existing tests corresponding to every approved file above
- `scripts/__tests__/pipeline-v2-*.test.mjs` (new)
- `src/features/pipeline-progress/**/*.test.ts`
- `src/features/atlas/model/building.test.ts`
- Existing Japan regression fixtures and manifests are read-only inputs; update their harness only
  if representation changes, never their historical facts to make a test pass.

## Required V2 artifacts

Use versioned, runtime-validated contracts. Exact field names are an engineering choice, but the
following semantics are mandatory.

### Run state

The durable run state must carry:

- schema version, slug, immutable run ID, lifecycle and overall status;
- created/updated timestamps;
- each stage's status (`queued`, `running`, `complete`, `failed`), start/end time, attempt count,
  model and effort;
- last durable commit when available;
- failure classification and resumable next stage/action;
- bounded total attempts and automatic retries;
- publication and deployed-live states as distinct facts;
- telemetry summary with unknown values represented honestly.

Malformed mandatory V2 state fails closed with an actionable error. It must never be silently
treated as “no run.” Keep a V1 reader/adapter while V1 exists; do not bulk-rewrite historical guide
data merely to satisfy V2.

### Research evidence and candidates

Use stable IDs. The structured contract must represent:

- candidate identity and exact branch/location where relevant;
- considered → shortlisted → shipped/rejected/detour status;
- rejection or placement reason;
- evidence records with claim, evidence kind, URL/source, verified date, language, recency,
  firsthand/official character, and source-family independence where knowable;
- reservation and transport-risk findings where relevant;
- disagreement investigations and decision impact;
- adaptive-search stop record: duplicate/weaker evidence and whether unresolved evidence could
  still change the recommendation;
- Pass-B native-language audit summary;
- a typed reconciliation disposition for every independent finding, linked by stable ID.

The human ledger remains useful and inspectable, but regex prose is not the sole V2 machine
contract. A missing or malformed required evidence artifact is a blocking failure.

### Coverage and telemetry

Coverage must validate every material intake ask or record an explicit honest exclusion with a
reason. A nonempty arbitrary string is not proof of coverage.

Telemetry must be versioned and bounded. Emit facts available from code/workflow boundaries first.
Do not infer tokens or cost. Preserve the progress UI's honest empty state when the producer has no
trustworthy value.

## Mechanical independence

Separate Claude invocations alone are insufficient.

Pass B's actual input checkout/workspace must not contain Pass A's completed guide or Pass-A-derived
research ledger/evidence. Pass B may receive frozen intake, destination configuration, the Guide
Author rules relevant to its task, and a clean output location. The workflow—not Pass B—must commit
and transfer the resulting artifact to reconciliation.

Prefer a clean branch/worktree derived from the scaffold commit and a reduced tool set over a prose
promise. Pass B must not need Bash merely to checkpoint itself; the workflow can validate, commit,
and push its output after the agent returns. Add a deterministic test proving the prepared Pass-B
input excludes Pass-A outputs.

Critic blindness is product blindness, not an incoherent file ban. It may read the finished guide,
frozen intake, Guide Author, rubric, and existing human ledger required to append its audit. It may
not read the independent raw evidence artifact, V2 run state, or prior git history. Enforce and test
the prepared input boundary where practical.

## Recovery and attempts

- Checkpoint stage start before invoking Claude.
- Validate, commit, and push stage completion before routing forward.
- Record failed/cancelled action status and the same stage as the resume point.
- A resumed run repeats only the interrupted stage; it never skips ahead based on uncommitted work.
- Preserve the current total research attempt cap of five for initial V2 compatibility.
- Permit one automatic redispatch for a recognized usage/capacity interruption or a proven void
  run. Do not create an unbounded retry loop.
- If the action does not expose enough information to identify a usage-limit failure reliably,
  record an honest generic agent failure and leave the branch manually resumable. Do not parse
  brittle human log prose as a permanent protocol.
- Attempt counters are scoped to a run. Successful change runs do not consume a guide's lifetime
  allowance.
- Research and change for the same slug must share an exclusion boundary so they cannot land
  concurrently.

## Publication order

Before any V2 guide can lose `draft` or merge as published, code—not agent testimony—must prove:

1. required V2 artifacts validate;
2. every independent finding has a typed disposition;
3. candidate saturation/decision-stability contract passes;
4. guide content schema and `npm run build` pass;
5. offline verification passes;
6. configured network verification passes or returns an explicit policy-blocking “not verified”
   state for a high-risk dependency;
7. composition passes;
8. run-integrity/durability passes;
9. no unresolved blocking fork remains.

Only then may publication remove `draft` and land. Deployed-live confirmation is a separate later
state. The progress UI must not call a main-branch merge “live.”

Apply the existing safety correction to V1/shared landing code as the first milestone: automated
landing must run the real build-plus-network evidence gate, and integrity/compose must run before
landing in both research and change workflows.

## Milestones

### M0 — Baseline and resume spine

- Establish the feature branch and clean baseline.
- Run the current targeted pipeline tests plus build, lint, typecheck, and full test suite.
- Create `IMPLEMENTATION_STATE.md`.
- Record baseline failures without repairing unrelated code.

Completion: baseline and exact next milestone are durably committed and pushed.

### M1 — Repair current publication safety

- Make automated landing invoke the real build-plus-network evidence gate.
- Reorder research and change so artifacts, compose and integrity can block landing.
- Fix contradiction preflight to commit the ledger file it actually writes.
- Add tests proving order and failure behavior.

Completion: no current lifecycle can publish before build, compose, integrity and required evidence
pass; targeted tests are green.

### M2 — Versioned V2 contracts

- Implement runtime-validated run state, research/evidence, coverage, reconciliation and telemetry
  contracts under `scripts/pipeline/v2/`.
- Implement V1 compatibility readers where an existing consumer needs them.
- Make malformed mandatory V2 artifacts fail closed.
- Add stable IDs, typed dispositions and adaptive saturation records.

Completion: contract tests cover valid, missing, malformed, legacy and forward-compatible input.

### M3 — Guide Author and prompt contracts

- Update the canonical Claude Guide Author and references for the locked decisions without turning
  `SKILL.md` into a duplicate schema manual.
- Keep `.agents` aligned through generation or a parity test.
- Update the four prompts to use the V2 artifacts and coherent read/write boundaries.
- Remove fixed floors and misleading “structural” claims not enforced by code.

Completion: doctrine has one source per rule, prompt contracts match code, and parity/prompt tests
are green.

### M4 — V2 orchestration and isolation

- Add the manual `research-pass-v2.yml` workflow and V2 CLI/control modules.
- Prepare mechanically separate Pass-B input.
- Add durable stage start/complete/failure checkpoints and bounded resume/retry behavior.
- Keep Claude/Sonnet production assumptions; do not add GPT.
- Keep V1 dispatch untouched.

Completion: zero-network workflow/orchestration tests demonstrate routing, isolation, stage failure,
resume and attempt caps.

### M5 — V2 verification and research rules

- Replace quota checks with adaptive saturation/decision-stability validation.
- Enforce typed evidence/dispositions, objective-versus-experiential rules, source independence,
  recurring-event year safety, category freshness, reservation depth by importance, and high-risk
  transport robustness.
- Preserve existing anti-hallucination and Japan regression classes.

Completion: new-rule fixtures pass, old regression scars pass, and no safeguard was weakened
without a named replacement test.

### M6 — Connected lifecycle correctness

- Scope attempts per run.
- Prevent same-slug research/change races.
- Route answers for active research back to that run; retain change behavior for published-guide
  changes.
- Fix pretrip/recert in-flight detection and partial-dispatch failure reporting.

Completion: tests cover answer routing, concurrency keys, attempt reset, current branch conventions,
and recert/pretrip acting paths.

### M7 — Honest progress compatibility and telemetry

- Add V1/V2 run-state adapters to `pipeline-progress` and the Atlas BUILDING consumer.
- Distinguish non-blocking questions from blocking forks.
- Use real running/failed/heartbeat state rather than a 20-minute stage-boundary guess.
- Continue looking for late telemetry while a run is active.
- Keep unavailable metrics visibly empty.
- Distinguish merged/published from deployed live.

This is a compatibility/truthfulness pass, not the later UI/UX redesign.

Completion: progress model/gateway tests cover V1, V2, blocking questions, long healthy stages,
late telemetry, failure, publication and live deployment truth.

### M8 — Full verification and handoff

- Run targeted suites after each prior milestone, then the full Ship Loop:
  - `npm run build`
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
- Run offline verification against current published guides and record legacy `n/a` behavior rather
  than rewriting their evidence.
- Run production-preview checks at mobile 375px and desktop for the minimally changed progress/hub
  states, including dark and reduced motion.
- Grep compiled `dist/` for stale stage labels/paths.
- Do not run a live V2 research job, switch dispatch, publish, delete V1, or claim deployed proof.
  Prepare the exact manual canary command and list required secrets/boundary checks for Codex.

Completion: branch is green, pushed, implementation state is final, and the handoff names every
unverified external boundary.

## Required tests and regression posture

Preserve or migrate the invariant behind these suites:

- `scripts/__tests__/pipeline.test.mjs`
- `scripts/__tests__/pipeline-orchestration.test.mjs`
- `scripts/__tests__/pipeline-publish.test.mjs`
- `scripts/__tests__/check-run-integrity.test.mjs`
- `scripts/__tests__/check-passb-coverage.test.mjs`
- `scripts/__tests__/check-candidates.test.mjs`
- `scripts/__tests__/check-intake-contradictions.test.mjs`
- `scripts/__tests__/check-risk-gates.test.mjs`
- `scripts/__tests__/check-source-mix.test.mjs`
- `scripts/__tests__/check-routes.test.mjs`
- `scripts/__tests__/check-uncertainty.test.mjs`
- `scripts/__tests__/check-content-drift.test.mjs`
- `scripts/__tests__/check-venue-status.test.mjs`
- `scripts/__tests__/verify-guide.test.mjs`
- `scripts/__tests__/scaffold-guide.test.mjs`
- `scripts/__tests__/recert.test.mjs`
- `scripts/__tests__/pretrip-check.test.mjs`
- `scripts/__tests__/prompt-contract.test.mjs`
- `scripts/__tests__/worker-api.test.mjs`
- `scripts/__tests__/worker-index.test.mjs`
- `scripts/__tests__/japan-regression.test.mjs`
- `scripts/__tests__/japan-regression-fixture.test.mjs`
- `src/content.config.test.ts`
- `src/features/pipeline-progress/gateway.test.ts`
- `src/features/pipeline-progress/model/progress.test.ts`
- `src/features/pipeline-progress/model/run-events.test.ts`
- `src/features/atlas/model/building.test.ts`

Classify each affected assertion before changing it:

- **PRESERVE** — invariant V2 still needs;
- **CHANGE** — locked decision intentionally changed the contract;
- **DELETE** — only an obsolete implementation detail, with no lost protection;
- **REGRESSION SCAR** — historical failure whose defect class must remain covered.

Do not edit fixtures or expected output merely to make a red test green. State why the contract
changed and add the V2 assertion first.

## Non-goals

Keep attention on the V2 control plane. The following are outside this implementation:

- traveler-facing visual redesign;
- mixed-model production or GPT integration;
- NAVER, Resy, or other new permanent APIs/MCPs;
- a database, event service, queue, workflow framework, or generic evidence platform;
- opaque cross-trip preference scoring;
- exhaustive transport detail for low-risk routine transit;
- full historical artifact migration;
- automatic cutover, V1 deletion, or live publication;
- unrelated cleanup, dependency upgrades, style refactors, or guide-content rewrites.

## Final handoff to Codex

When the implementation is complete—or when the usage window requires a durable pause—report:

1. completed milestones and pushed commits;
2. exact files changed and why;
3. preserved safeguards and their tests;
4. intentionally changed contracts and their tests;
5. schema/version and V1 compatibility behavior;
6. stage isolation and recovery behavior;
7. all commands run and exact results;
8. external boundaries not yet proven;
9. manual V2 canary command and prerequisites;
10. the next exact action Codex should take.

Codex will review the diff, run independent checks, and decide whether another implementation pass
or a manual canary is allowed. Do not merge to `main`, switch production dispatch, publish a guide,
or delete V1 yourself.

Begin now with M0. Continue through the milestones autonomously, using durable checkpoints so a
fresh Fable 5 session can resume after any usage-limit cancellation.

---
