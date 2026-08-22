# Pipeline V2 — Implementation State (durable resume record)

> Maintained by the implementation agent (build prompt archived: `docs/archive/INDEX.md → FABLE_IMPLEMENTATION_PROMPT`). A resumed session
> reads THIS file, inspects `git log` on `codex/pipeline-v2` and the working diff, and continues
> from "Next action" below. Never regenerate completed work.

## Position

- **Last completed milestone:** P13.1 correction — the R3+ fixture's residual bus-exclusivity
  overstatement fixed (japan-guide documents "bus or taxi"; walking prohibition ⇒ motorized
  transfer required, not bus required) and the premature P13_GREEN retracted (see §P13.1)
- **Current milestone:** P13 — independent go/no-go, pending again on the corrected head
- **Exact next action:** Codex re-reviews the corrected fixture + this record and returns the
  P13 verdict; Carlo accepts. Cutover stays OFF (WAYPOINT_RESEARCH_ENGINE unset ⇒ /new
  dispatches V1). Do not merge, publish, or delete V1 without acceptance.

**Mid-session external event (08:09):** `docs/pipeline v2/IMPLEMENTATION_PLAN.md` (Carlo's
delivery-cadence plan) appeared untracked while M4 was underway — authored outside this session,
read in full, no conflicts with the executed plan (it confirms build-beside-V1, manual proving,
UI deferred). Committed with M4 to preserve it durably; not modified.

## Branch

- Feature branch: `codex/pipeline-v2`, forked from `main` @ `9f1599b` (docs: add Pipeline V2
  Fable execution prompt). Working tree was clean at fork; no user changes at risk.
- Latest pushed commit: (M0 commit — see `git log`)

## Baseline (recorded 2026-08-17, M0)

All four gates green on `main` @ 9f1599b before any V2 work:

| Check | Command | Result |
|---|---|---|
| Full test suite | `npm test` | 155 files, 2400 passed, 1 todo — exit 0 |
| Build | `npm run build` | 9 pages, schema clean — exit 0 |
| Lint | `npm run lint` | 0 errors, 0 warnings — exit 0 |
| Typecheck | `npm run typecheck` | 0 errors, 0 warnings, 19 pre-existing hints — exit 0 |

**Baseline failures:** none. The 19 typecheck hints are pre-existing informational notices
(deprecated `document.execCommand`, async-conversion suggestions) — not repaired, out of scope.

## M1 worklist (verified against current code during M0 survey)

1. **Landing gate is not the real evidence gate.** `scripts/pipeline.mjs` `land --gate` runs only
   `npm run verify -- --slug <s> --markdown --network`, never `npm run build`, then calls
   `publishGuide(slug, { gatePassed: true })` — asserting a gate that `evidenceGate()`
   (`scripts/pipeline/publish.mjs`) defines as build **plus** networked verify. Fix: `land --gate`
   must run the real `evidenceGate` (build + networked verify) and base `passed` on it.
2. **Order: compose + integrity run AFTER landing.** `research-pass.yml`: "Land the branch" (step)
   precedes "Run-integrity gate", "Compose check", and "Enforce run integrity". `change.yml`:
   "Land the branch" precedes "Run-integrity gate". A void/burst run or a compose error cannot
   block a merge it should block. Fix: reorder so artifacts, compose and integrity all gate landing
   in both workflows (void remediation still runs; landing is skipped on a failed gate).
3. **Contradiction preflight commits the wrong file.** `applyContradictions()`
   (`scripts/audit/check-intake-contradictions.mjs`) writes `guides-intake/<slug>/ledger.md`;
   `gatePreflight` (`scripts/pipeline/gate.mjs`) stages/commits `guides-intake/<slug>/intake.md`
   only — the written findings are never committed. Fix: commit the ledger file (keep intake in the
   pathspec only if it can legitimately change — it cannot; intake is frozen).

## M1 — done (all three fixes + tests)

1. `landingGate()` added to `scripts/pipeline/publish.mjs`: build → networked markdown verify,
   short-circuit, captured output as scorecard. `pipeline land --gate` now calls it (the bare
   verify-only `execSync` is gone), so `publishGuide(slug, {gatePassed: true})` is an earned claim.
2. `research-pass.yml`: Run-integrity gate (report-only) + void remediation + Compose check
   (now `continue-on-error`) moved BEFORE "Land the branch"; the landing step computes
   `LAND=auto|pr` from `VOID`/`VIOLATIONS`/`COMPOSE_OUTCOME` so any failed gate downgrades the
   landing to a draft PR (human-triage surface preserved, auto-merge blocked). "Enforce run
   integrity" stays last and now also reds the run on `--compose failure` (gateEnforce learned
   `compose`). `change.yml`: Run-integrity gate (`--enforce`, always()) moved BEFORE landing —
   a void change run can no longer open or merge anything.
3. `gatePreflight` commits `preflightCommitPath(slug)` = `guides-intake/<slug>/ledger.md` — the
   file `applyContradictions` actually writes (was intake.md, which is frozen and never written,
   so findings were lost with the runner). new-guide.yml's scaffold path was already correct
   (`landScaffold` adds all of guides-intake/).
- Tests: `scripts/__tests__/pipeline-v2-safety.test.mjs` (13) — landingGate order/short-circuit/
  scorecard/slug-refusal + CLI-seam wiring, preflight write-vs-commit contract (fixture-driven),
  workflow step-order and downgrade-guard text checks for both workflows, enforce wiring.
- Checks: targeted 6 suites (153 ✓) · full `npm test` 156 files / 2413 ✓ · eslint clean on
  changed files.

## M2 — done (contracts + tests)

New: `scripts/pipeline/v2/{contracts,run-state,evidence,coverage,telemetry}.mjs` +
`scripts/__tests__/pipeline-v2-contracts.test.mjs` (41 tests).

- **Versioning:** `wp-run/2.0`, `wp-evidence/2.0`, `wp-coverage/2.0`, `wp-telemetry/2.0`. Same
  major (any minor) accepted; documents parsed loose (zod `looseObject`) so unknown fields
  survive round trips (forward-compatible); different major refused with migration named.
- **Fail closed:** `ContractError` with file + field-level issues. A malformed mandatory artifact
  throws; ONLY a missing file reads as absent, and `require*` makes even absence blocking.
- **Run state** (`guides-intake/<slug>/run.v2.json`): immutable runId, lifecycle, per-stage
  status/start/end/attempts/model/effort/commit/failure-class, bounded attempts (cap 5 preserved)
  + one auto-retry, resume points at the interrupted stage (never skips ahead), publication vs
  deployed-live as distinct facts (deployedLive null = unknown), telemetry summary. V2 research
  stages: scaffold→passA→passB→reconcile→critic (verification is the landing gate's job, not a
  pseudo-stage; V1's `verified` remains in the V1 spine untouched).
- **V1 adapter:** `adaptV1RunState`/`readAnyRunState` — view-only, never rewrites state.json.
- **Evidence** (`evidence.v2.json`): stable candidate ids (`candidateId()` deterministic), funnel
  invariant shipped⊆shortlisted, rejection reasons required, typed dispositions
  (agree/adopt/replace/reject/conflict-resolved/detour) required for every passB-origin finding,
  adaptive saturation record must EARN a stop (duplicates/weaker trend + unresolvedCouldChange
  answered false), reservations (with labeled unconfirmed leads), transport risk 0–4,
  disagreements w/ impact, Pass-B native-language audit summary.
- **Coverage** (`coverage.v2.json`): covered ⇒ structured `NN-<group>.json[#anchor]` refs
  (schema-enforced — arbitrary strings rejected); excluded ⇒ honest reason.
- **Telemetry:** all-null empty state, stage facts from workflow boundaries, counts derived only
  from what the evidence artifact proves, tokens/cost never inferred, merge never lets a late
  unknown erase a known value.

## M3 — done (doctrine + parity; V2 prompt files deferred into M4 deliberately)

- `verification-rules.md` §3: objective-vs-experiential evidence classes (official/primary for
  objective; ≥2 recent independent firsthand for experiential; "official URL on a subjective
  claim = fabricated citation") + source independence as FAMILIES (copied/SEO families count
  once; unknowable independence stated, not assumed).
- `research-efficiency.md`: the S2/S3 fixed candidate floors (16/10/6) replaced by the adaptive
  stopping rule (duplicates/weaker trend + unresolved-evidence answer, recorded in the V2
  saturation record).
- NEW `references/research-depth.md`: decision-impact scaling — disagreement investigation,
  reservation depth by importance + labeled `unconfirmed-lead` booking leads, Worth the
  Effort/Detour retention, transport robustness by risk (door-to-door reality, group/luggage,
  last practical return, fallback), contingencies fail-differently rule, category freshness +
  recheck dates + recurring-event year safety, research memory ("memory proposes, current
  research verifies").
- `SKILL.md`: Read-first gains research-depth.md (items renumbered); candidates section floors
  → adaptive saturation (Pass B owes coverage, not a find-count; funnel invariant kept);
  Pass B section gains the claim-dependent bar + adaptive native-language with light audit
  trail; "Independence is structural" reworded honestly (V1 = enforced contract, V2 =
  mechanically prepared input).
- `.agents` mirror REGENERATED from canonical (CLAUDE.md→AGENTS.md transform + verbatim
  references) — parity now gated by `scripts/__tests__/pipeline-v2-skill-parity.test.mjs` (14
  tests, whitespace-normalized doctrine assertions).
- V1 prompts: `research-passB.md` overclaim removed ("STRUCTURALLY INDEPENDENT" → honest
  contract wording + V2 contrast) and its verification bullet updated to the claim-dependent
  bar. Other V1 prompts carried no floors/misleading claims.
- **Deferred to M4 by design:** the four `-v2` prompt files land WITH `research-pass-v2.yml`,
  because `prompt-contract.test.mjs` fails any prompt no workflow composes — the V2 prompts and
  their workflow are one commit. (Updating the V1 prompts to V2 artifacts in place was rejected:
  it would convert every `/new` dispatch into an unproven hybrid, violating "V2 stays
  manual/draft-only"; recorded as the M3/M4 boundary decision.)
- Checks: parity suite 14 ✓ · full `npm test` 158 files / 2468 ✓.

## M4 — done (orchestration + mechanical isolation)

New: `scripts/pipeline/v2/workspace.mjs`, `scripts/pipeline-v2.mjs` (CLI: init · route · budget
· begin-stage · finish-stage · fail-stage · record-agent-failure · auto-retry · escalate · prepare-passb ·
verify-passb-workspace · collect-passb · prepare-critic · restore-critic · validate),
`prompts/research-{passA,passB,reconcile,critic}-v2.md`, `.github/workflows/
research-pass-v2.yml`, `scripts/__tests__/pipeline-v2-orchestration.test.mjs` (24 tests),
prompts/README.md V1-vs-V2 section.

- **Job-per-stage workflow**, manual dispatch only, draft-only landing (`--land pr`, no
  announce, `pipeline-v2 validate` fail-closed before `land --gate`). Same concurrency group as
  V1 research (`research-<slug>`) so V1/V2 runs on one slug queue. V1 dispatch untouched
  (new-guide.yml still starts research-pass.yml — pinned by test).
- **Durability contract:** begin-stage checkpoints START (committed+pushed) before each agent;
  finish-stage VALIDATES the stage's owed artifact (`validateStageOutput`: scaffold files,
  passA-origin evidence, passB artifact, dispositions+coverage at reconcile, critic ledger
  artifacts), commits the work (the workflow commits, never the agent), checkpoints completion,
  and records stage telemetry (duration/model/effort + evidence-derived counts).
- **Failure classes name a PLANE** (reliability pass, 2026-08-22 — the Portugal scar, run
  `portugal-20260822-7c041e`). Every agent invocation runs through
  `scripts/run-logged-command.sh`, so a nonzero Claude process is a nonzero STEP while
  `agent-output.log` still holds the complete combined stdout/stderr; the previous `| tee`
  wrapper reported tee's status and recorded a session-limited reconcile GREEN. A failed agent
  process therefore never reaches the normal collect/verify path (its workspace is partial
  attempt evidence), and `record-agent-failure` classifies it from the step conclusion plus the
  CLI's own printed diagnostic — `usage-limit` (diagnostic AND nonzero process, never one alone)
  / `cancelled` / `agent-failure` / `unknown`. `finish-stage` judges only output from a process
  that RETURNED, so it says `void-run` (nothing produced) or `gate-failure` (invalid or
  scope-invalid output) and can never say `agent-failure`. An already-recorded gate verdict is
  never overwritten by the coarser process-plane observation.
- **Automatic repair is decided by DURABLE state** (same pass). The gate used to read one
  ephemeral step output (`void == 'true'`), so ordinary deterministic gate failures — the
  commonest repairable failure — never reached the retry command at all. `run.v2.json` now
  decides: an auto-retryable class (`gate-failure`/`void-run` only), actionable validator
  findings for the same runId/stage, and room in BOTH the attempt cap (5) and the auto-retry cap
  (1) — caps unchanged. Budget is spent only on a yes. A repair re-dispatch carries the same
  slug, so the same runId, branch, intake and landMode resume and completed stages are skipped.
  `void_retry` survives as a workflow input for in-flight compatibility and decides nothing.
- **A run that stops is VISIBLE** (same pass): `pipeline-v2.mjs escalate` emits an Actions error
  and, when the run records an intake issue, files ONE marker-deduped comment naming the stage,
  class, finding count, why no retry happened and the exact safe recovery action.
- **Pass-B isolation:** the passB job's agent world is a checkout of the run's recorded
  BASELINE commit at fetch-depth 1 (Pass-A outputs absent from tree AND history); the
  control-plane checkout used for begin-stage is `rm -rf`'d before the agent; collection is a
  separate post-agent checkout where `collect-passb` schema-validates the artifact, refuses
  foreign-origin records and premature reconciliation, and transfers it. Local/test mechanism
  (`preparePassBWorkspace` worktree) proves the same exclusion against a real git repo,
  fail-closed via `verifyPassBWorkspace` (also run in CI on the prepared checkout).
- **Critic blindness:** fetch-depth 1 (no prior history) + `prepare-critic` deletes
  evidence/run-state/coverage artifacts (V2 AND V1 forms) from the working tree pre-agent;
  `restore-critic` restores tracked ones after; palette+compose moved from the critic prompt to
  deterministic workflow steps. Known limit (documented): a Bash-equipped agent could dig
  current-commit blobs out of git plumbing — boundary enforced "where practical" per the
  execution prompt, plus the prompt contract.
- Checks: orchestration 24 ✓ · prompt-contract green with the four new prompts wired · full
  `npm test` 159 files / 2512 ✓ · eslint clean.

## M5 — done (quota checks → adaptive; research rules enforced)

- `check-candidates.mjs`: DEFAULT_FLOORS + `researchFloors` plumbing DELETED (CHANGE —
  DECISIONS "Research breadth"); PRESERVED: n/a posture, empty-table/section failure (now also
  per-priority empty tables), shipped-name cross-check, shipped⊆shortlist funnel, legacy
  2-column tolerance. Replacement protection: the V2 saturation gate (earned-stop rule,
  M2-tested). `verify-guide.mjs` no longer threads researchFloors.
- `check-passb-coverage.mjs`: `checkFloors`/`PASSB_FLOORS` (≥8/≥3/≥2) → `checkSubstance`
  (CHANGE): a FULL pass must exist and be non-empty; category counts print, never gate.
  STRENGTHENED: an absent passB.json on a full pass now FAILS (it previously exited 0).
  Flag renamed `--floors` → `--full-pass` at the script; `gate coverage` translates.
- NEW `scripts/pipeline/v2/research-rules.mjs` (+ 21-test suite), wired into
  `pipeline-v2 validate` and reconcile stage validation: objective↔source-kind law
  (official/operator/reference), experiential-official = fabricated citation, ≥2
  distinct-family firsthand corroboration on shipped candidates, recurring-event year safety
  (claim year > publish year fails), experiential freshness (24-month window; unknown dates
  never judged), reservation depth by importance (casual owes nothing; important owes a
  booking answer; anchor owes when + fallback; confirmed leads owe current evidence),
  R3+ transport robustness (fallback + missed-connection + buffer/next/last-return).
- Doctrine sync: `docs/standards/guide-rubric.md` rows 8 + 12 updated (SCOPE ADDITION,
  justified: M3/M5 mandate removing floors the rubric verbatim asserts; leaving them would
  make the quality bar contradict the gates). `content.config.ts` researchFloors field
  deleted (no guide ever declared it) + its tests; scaffold ledger blurb updated.
- Japan regression suites + full suite green throughout (160 files / 2526 + new).

## M6 — done (connected lifecycle correctness)

- **Run-scoped attempts:** `bumpChangeAttempt` takes `runKey` (the change branch suffix —
  issue number or dispatch run id). Same key ⇒ counts up (retries of stuck work still cap at
  3); new key ⇒ resets to 1 (three successful runs no longer consume the guide's lifetime
  allowance — the 4th request used to trip the breaker). `gate budget --run-key` wired;
  change.yml passes `issue || run_id`. Legacy no-key callers keep monotonic V1 semantics.
  V2 research attempts were already per-run by construction (run.v2.json).
- **Same-slug exclusion:** research-pass.yml + research-pass-v2.yml concurrency groups renamed
  `research-<slug>` → `guide-<slug>`, matching change.yml's — any two runs on one guide now
  queue (research⇄change can no longer land concurrently). docs/reference/pipeline.md updated.
- **Answer routing:** new `pipeline answers-route` (reads committed state via readAnyRunState +
  the draft flag; emits target=research|change + the research branch found on origin) and
  `pipeline answers-apply` (deterministic: `applyAnswers` marks ledger cards `- **A:** …` /
  `Status: answered` — the exact shape `plan.mjs answeredQuestions()` reads back — idempotent,
  missing ids red the step, commit+push on the research branch). change.yml routes BEFORE
  branch/budget, so a research-routed answer spends no change machinery and pushes no stray
  change branch; published guides keep the change-run path untouched.
- **Pretrip in-flight detection:** `hasRecertInFlight` watched `recert/<slug>` — a namespace
  that stopped existing when recert's acting half moved to change.yml — so it detected NOTHING.
  Now watches `change/<slug>-*` (pure helpers `inFlightBranchPattern`/`hasInFlightFromRefs`,
  exported + tested); a failed lookup never blocks a dispatch.
- **Recert partial-dispatch reporting:** `--dispatch` used to exit 0 unless EVERY dispatch
  failed; a partial failure now exits 1 naming the count (dispatches that succeeded still went
  out; the run just stops lying about completeness).
- Tests: `pipeline-v2-lifecycle.test.mjs` (17) — run-key scoping, routing decisions,
  applyAnswers (incl. the answeredQuestions round-trip contract, idempotence, missing ids,
  multi-line flattening), pretrip namespace, recert exit, change.yml wiring. Orchestration test
  updated for the group rename. Full suite 162 files / 2543 ✓ · lint ✓ · typecheck ✓.

## M7 — done (honest progress compatibility)

- **V2 adapter:** `adaptV2Snapshot` (model/progress.ts) maps run.v2.json → the page's station
  view (critic → the verify station), carrying the REAL facts V1 never had: runStatus,
  failureClass, publication.deployedLive. Fail-closed at the reading edge: a V2 file that
  exists but isn't a run comes back `malformed: true` → page state "stalled", never "no run".
  `gateway.fetchRun` reads research-v2/<slug> run.v2.json first, falls back to the V1 chain
  through one `RunSnapshot` shape (V1's runStatus honestly null).
- **Blocking vs non-blocking:** `derivePageState` takes `blockingForks` separately — only a
  fork pauses the page. An open question no longer produces the false "Paused / Waiting on
  you" claim (V1 research proceeds on its assumption); `deriveNotePanel` now offers the REAL
  answer control while running with open questions (the endpoint exists — M6 routes mid-run
  answers onto the research branch).
- **Real running/failed state:** with a V2 runStatus present the 20-minute clock guess is not
  used at all — a 3-hour healthy Pass A stays "running"; a recorded failure/stuck is stalled
  immediately with pill "Failed" and a failure line. V1 keeps its labeled clock heuristic
  (nothing better exists there; documented in STUCK_THRESHOLD_MS's comment).
- **Merged ≠ live:** STAGE_LABEL.published now says "merged"; the done line says "Live on the
  site." ONLY when deployedLive === true, else "Merged — the site deploy that carries it
  hasn't been confirmed yet." Deploy truth: the V2 record's own fact, else `gateway.isLive`
  (the deployed site's own search-index.json — rebuilt per deploy, drafts excluded; null =
  unknown, and unknown never renders "live").
- **Late telemetry:** `probeEventsThisTick` (pure, tested) — every tick for the first 3
  misses, then every 4th tick WHILE the run is active, always once seen, never after done.
  fetchRunEvents tries both generations' branches. Events panels stay honest-empty (V2's
  run-state telemetry is not force-mapped into the V1 events shape — deferred to the UI pass).
- **Atlas BUILDING:** building.ts prefers a landed V2 run record — a complete V2 run on a
  still-draft guide reads as WITHHELD, not building (the Japan case, V2 form). index.astro
  reads run.v2.json beside state.json.
- Tests: progress/gateway/run-events/building suites extended (feature suites 933 ✓ total);
  full `npm test` 164 files / 2566 ✓ · build ✓ · lint ✓ · typecheck ✓.

## Decisions made within engineering discretion

- (M0) Task tracking via harness task list mirrors the milestones; this file remains the durable
  cross-session record.

## Files changed so far

- `docs/pipeline v2/IMPLEMENTATION_STATE.md` (new — this file)

## Checks run

- M0 baseline: full suite + build + lint + typecheck (results above).

## M8 — done (full verification)

- Fresh Ship Loop on the branch tip: `npm run build` (9 pages) ✓ · `npm run lint` (0/0) ✓ ·
  `npm run typecheck` (0 errors, 19 pre-existing hints) ✓ · `npm test` 165 files / 2566 ✓ + 1 todo.
- `npm run verify` (offline, both published guides): **PASS**, legacy behavior recorded as-is —
  korea/denmark report `candidates · n/a — pre-standard ledger` and `coverage · n/a — pre-P3
  guide`; no historical evidence rewritten. Advisory rows (routes, uncertainty) unchanged.
- `astro preview` :4322 (production build): `/progress/?slug=…` at 375px and desktop, dark
  scheme — page renders honest empty state, new "Published — merged to the site" label, no
  horizontal scroll, dark tokens paint (body rgb(15,19,23)); hub renders with no BUILDING rows
  (no drafts exist — honest). Reduced-motion: NO code on the motion path changed this arc
  (M7 touched derivations, not the rAF loop); existing behavior stands, not re-verified
  visually because the Browser pane could not composite screenshots in this session
  (structural checks via computed styles/read_page used instead).
- `dist/` grep: old "Published — live on the site" string GONE; `merged to the site`,
  `blockingForks`, `run.v2.json` present in the compiled progress chunk; no `researchFloors`,
  no `recert/<slug>` branch strings.
- `.claude/launch.json` added (preview server config for the harness browser — dev tooling).

## Final handoff to Codex

**Completed milestones / pushed commits** (branch `codex/pipeline-v2`, forked from `9f1599b`):
M0 `8ca2f7d` · M1 `896cbce` · M2 `54087fd` · M3 `a292d79` · M4 `59001c5` · M5 `785b4e9` ·
M6 `3351644` · M7 `71e8671` · M8 (this commit). Each milestone section above lists exact files,
reasons, preserved-vs-changed contracts, and the tests that pin them.

**Manual V2 canary (when Codex allows it):**
```
gh workflow run research-pass-v2.yml -f slug=<slug> \
  -f model=claude-sonnet-5 -f effort=high -f critic_model=claude-opus-5
```
Prerequisites: the slug must already be scaffolded on main (file a /new intake or run
`node scripts/scaffold-guide.mjs` first — V2 refuses to scaffold); repo secrets
`CLAUDE_CODE_OAUTH_TOKEN` (required), `PLACES_API_KEY` (venue checks; optional but wanted),
`GOOGLE_ROUTES_KEY` (optional). The run lands a DRAFT PR only. Boundary checks to run on the
first canary (Boundary Checks doctrine): (1) confirm the passB job's baseline checkout really
lacks Pass-A files on the runner (the verify-passb-workspace step prints it); (2) force one
failure path — cancel an agent step and confirm `record-agent-failure` records `cancelled` (and
a session-limited step records `usage-limit`) and the branch resumes at the same stage on
re-dispatch; (3) confirm `pipeline land --gate` on the
runner produces the build+verify scorecard as the PR body.

**Unverified external boundaries (none exercised from this session — no Actions run, no gh
write, no Worker call was made):**
- All GitHub Actions YAML paths: job chaining/`needs` conditions in research-pass-v2.yml, the
  three-checkout passB job, depth-1 critic push, `gh workflow run` re-dispatch, concurrency
  queueing across the renamed `guide-<slug>` groups.
- The claude-code-action agent steps (V2 prompts have never driven a live agent).
- change.yml's new answers-route path against a LIVE research branch (unit-tested pure logic
  only), and the run-key budget behavior across real dispatches.
- Worker endpoints (unchanged in code this arc — but the answers flow's end-to-end behavior
  with routing is new).
- recert/pretrip: the new `change/<slug>-*` in-flight lookup against the real remote.
- `isLive` search-index probe against the real deployed Pages site.

**Schema/versioning:** `wp-run/2.0` · `wp-evidence/2.0` · `wp-coverage/2.0` · `wp-telemetry/2.0`;
same-major-any-minor accepted, loose parse preserves unknown fields, different major refused
naming migration; malformed mandatory artifacts throw `ContractError` (fail closed). V1
compatibility: `readAnyRunState` adapter (view-only), V1 state.json/passB.json/ledger untouched,
no historical guide data rewritten.

**Non-goals honored:** no UI redesign, no GPT, no new APIs/DBs/queues, no cutover, no V1
deletion, no live publication, no live V2 run.

## Finalization session (2026-08-19, Fable) — Core Proof blocker remediation

Branch `fable/pipeline-v2-finalize`, forked from `codex/pipeline-v2` @ `775b420`, merged with
`origin/main` @ `d0118d3` (clean merge — two doc files). Baseline before any change: build 9
pages ✓ · lint 0/0 ✓ · typecheck 0 errors + 21 pre-existing hints ✓ · tests 161 files /
2579 ✓ + 1 todo. No failures to classify.

**Blocker fixes (each with regression tests in `pipeline-v2-finalize.test.mjs`, 46 tests):**

- **1A generated machine contract** — `scripts/pipeline/v2/contract-capsule.mjs` derives a
  stage-relevant capsule AT RUN TIME from the same modules that validate (enum vocabulary,
  canonical candidate-id rule with computed examples, freshness caps from the exported
  `OBJECTIVE_RECHECK_MAX_DAYS` map, zod-introspected field vocabulary, dynamically derived
  coverage ask ids + real group anchors for reconcile, minimal valid skeletons that the tests
  parse against the live schemas). Injected as `{{contract}}` via `pipeline-v2 contract`.
- **1B validator feedback on retry** — `scripts/pipeline/v2/feedback.mjs`
  (`guides-intake/<slug>/feedback.v2.json`, `wp-feedback/2.0`): findings persist per
  runId/stage/attempt, committed with run state (survive interruption/resume); ONLY the owed
  stage's active findings feed its retry (`pipeline-v2 stage-feedback` → `{{feedback}}`),
  wrapped as labeled VALIDATOR DATA; success retires (audit history kept). finish-stage now
  also retains the failed attempt's IN-SCOPE output on the run branch (commit marked INVALID)
  so a contract repair does not re-spend web research; every downstream gate still fails closed.
- **1C V2 coverage in the real verifier** — `verify-guide.mjs` `checkCoverage` consumes
  `coverage.v2.json` as authoritative when present (fail-closed: malformed/missing-ask/bad
  ref/bad anchor all FAIL), V1 `coveredBy` semantics untouched otherwise.
- **1D deterministic geocoding** — new `geocode` job between reconcile and critic:
  `geocode-venues.mjs --write --report guides-intake/<slug>/geocode.v2.json`. PLACES_API_KEY
  scoped to that single step (test-pinned: never in any agent step); refusal-to-guess
  preserved; the report distinguishes attempted-but-unresolved from never-attempted (absent
  report = never attempted; no sentinel ever enters guide content).
- **P2 evidence trust** — `source.access` (fetched | search-preview | blocked | unknown,
  `wp-evidence/2.1` additive). Rules: official/operator objective citations must be fetched or
  recorded blocked; `appliesToYears` event dates must be fetched; anchor/important reservation
  mechanics need a fetched origin or recorded block; R3+ transport names `evidenceIds` with ≥1
  fetched. Proxy policy: `PROXY_HOSTS` (r.jina.ai, Google cache, cachedview, 12ft.io,
  web.archive.org, translate proxy) are never the origin — rule-enforced, denied in the three
  research agents' WP_DENY, filtered out of the critic's fetch allowlist, stated in prompts.
- **P3 retry-aware telemetry** — per-attempt `history` on every stage (`wp-run/2.1`
  additive): attempt/start/end/status/failureClass/duration; `stageAttemptStats` yields
  successful/failed/cumulative seconds into telemetry (`failedDurationSec`,
  `cumulativeDurationSec`, `wp-telemetry/2.1`); old 2.0 documents parse with empty history.
- **P4 workflow_dispatch registration** — verified empirically: dispatch 404s until the path
  exists on the default branch. Bootstrap PR #59 (inert stub, `permissions: {}`, spends
  nothing, exits green) merged to main — the one authorized early merge; inert proof run
  32259552278 (7s, success, zero side effects). The real workflow gained a first-step runtime
  guard refusing default-branch dispatch unless the `WAYPOINT_RESEARCH_ENGINE` repository
  variable is deliberately set to `v2` (the cutover switch). NOTE: the squash-merge push produced no
  Actions events (platform hiccup); a whitespace nudge commit to main (`14c2411`) re-triggered
  indexing and registered the workflow.

Gates after the fixes: build ✓ · lint ✓ · typecheck ✓ · full suite 162 files / 2619 ✓ + 1 todo.

**Live canary (Phase 5):** slug `kansai-proof` (TEST DATA — Osaka+Kyoto Nov 13–17 2026,
couple, food>culture>nature, KIX evening arrival, Nara day trip, rain concern, Kiyomizu
illumination anchor conflict) scaffolded on `canary/kansai-proof` (with a copied
`src/data/destinations/kansai-proof.json`), dispatched as run **32259673565** on that ref.
Draft-only; not Carlo's real Japan guide; never merged to production.

**Canary scars fixed (each dispatch found a real boundary defect; every fix carries a
regression test):**

1. **Run 32259673565 — `gate preflight` deadlocked its own module graph** (Node exit 13):
   pipeline.mjs's CLI used top-level await while gate.mjs statically imports pipeline.mjs back;
   the dynamic import waited forever on the suspended evaluation. Reproduced locally, fixed by
   running both CLIs through a non-TLA `cliMain()`; regression spawns the real CLI through the
   real cycle. Also fixed: the `land` job ran on a failed setup (outputs of failed jobs stay
   readable) — it now requires `needs.setup.result == 'success'`.
2. **Run 32260514104 — every agent file-write denied.** The pinned claude-code CLI treats a
   single-leading-slash rule path as settings-relative, and Write()/Glob()/Grep() path rules
   are accepted but never consulted (verified against code.claude.com/docs/en/permissions).
   `Edit(/workspace/**)` never matched `/workspace`. Fixed to `Read(//workspace/**)`,
   `Edit(//workspace/**)` (+ absolute `//proc`/`//sys`/`//dev` denials) in all four agent
   steps and in the critic's generated fetch policy. The agent's own honest refusal to
   fabricate completion is itself a positive observation. Also fixed: the bounded re-dispatch
   ran where the sandbox had deleted `.git` (gh could not resolve the repo) and omitted
   `--ref`, which would have dispatched the default branch's inert stub.
3. **Run 32262892232 — Pass A WROTE its artifact (permissions proven) but it failed schema
   validation** (`appliesToYears` as strings; `disagreements[]` missing id/topic/investigation)
   — and the step aborted before finish-stage, leaving the stage "running" and the recorded
   feedback unpushed. Fixed: collection failures still reach finish-stage (stage failure +
   field-level findings recorded and pushed as retry feedback); finish-stage preserves
   ContractError issues instead of flattening to one line; the capsule now carries JSON type
   hints ("array of numbers, not strings") and the previously-missing disagreement vocabulary;
   interrupted attempts close honestly in the history.

**Positive canary observations (attempt 2, before the write failures):** the T0-first anchor
rule fired live — Pass A fetched kiyomizudera.or.jp directly, found the 2026 illumination runs
Nov 21–30 (trip is Nov 13–17 — the intake's anchor assumption does not hold), rejected a stale
2025 aggregator, recorded fetched/blocked/search-preview access states, and refused to fake
completion when writes were denied.

## Live canary — GREEN (2026-08-20, runs 32305376180 → 32328254329)

**Canary verdict: READY_FOR_INTEGRATION.** The full V2 path ran on real GitHub Actions —
Pass A → Pass B → Reconcile → deterministic geocode → Critic → V2 validation → build →
networked landing gate → **draft PR #61** — ending status `complete`, landingGate
`passed` (earned: build exit 0 + networked verify PASS, 0 dead links), publication
honestly `false`, guide still `draft: true`. Eleven dispatches total across two run
generations; every failure was deterministic, produced a regression test, and the run
resumed at the failed stage without re-spending completed research.

**The 18 proof points:**

1. **Generated machine contract** — after the capsule carried the exact vocabulary (incl. the
   type hints, leads sub-shape and evidence-kind law it initially lacked — each gap found by a
   live failure and closed), Pass A's repair attempt produced a fully valid artifact in 2m19s.
2. **Validator feedback reaches the retry** — proven repeatedly: the 2m19s Pass-A repair (vs
   27m for the failed attempt), reconcile fixing all P0 research findings on its first
   feedback-guided retry, the critic clearing its last finding the same way. feedback.v2.json
   on the branch shows the full recorded→superseded→retired lifecycle.
3. **Pass B isolation on Actions** — the passB job ran on the baseline checkout (fetch-depth 1),
   verify-passb-workspace green; collect-passb validated and transferred passB.v2.json; 14
   independent findings later dispositioned (2 agree · 4 reject · 8 adopt).
4. **Critic blindness** — prepare-critic deleted the evidence/state/feedback/geocode files;
   fetch policy generated from the guide's own cited domains only; critic ran 4 attempts blind
   and caught real defects (double-`≈` decoration C14, voice leaks, an unregistered forecast).
5. **Container/system-path isolation** — agents ran in the pinned node container with absolute
   `//proc`/`//sys`/`//dev` denials (rule syntax verified against the CLI's own docs after the
   first canary proved the old form never matched).
6. **Repository credential isolation** — credentials removed before every agent; the agent
   sandbox has no remotes (proven by the re-dispatch step failing for exactly that reason
   until it was moved to the trusted checkout).
7. **Direct-fetch evidence rule** — live: Pass A recorded fetched/blocked/search-preview access
   states; reconcile climbed ekitan/JR sources; the rules rejected aggregator-cited objective
   claims until real authorities were cited.
8. **Proxy rule** — proxy domains denied in agent tool policy, filtered from the critic
   allowlist, rejected by the evidence rules (rule-level tests; no proxy URL appears in the
   final artifact).
9. **V2 coverage** — `checkCoverage` consumed coverage.v2.json live ("P0 coverage · PASS — V2
   coverage artifact"); stale refs after composition failed closed, then remapped
   deterministically (same-suffix rename + unique-anchor + loud corroborating-ref drop).
10. **Deterministic geocoding** — geocode job ran post-reconcile/pre-critic, PLACES key scoped
    to the one step; report committed.
11. **Unresolved-geocode honesty** — geocode.v2.json: 7 pending, 0 resolved, every refusal
    carrying its reason; no sentinel, no invented coordinates.
12. **Real network landing verification** — `land --gate` ran build + `verify --network`; it
    caught a genuinely dead link (Kasuga Taisha's moved English page) and blocked until fixed.
13. **Draft-only landing** — every landing produced/updated DRAFT PR #61; auto-merge never
    fired; `_guide.json` still carries `draft: true`.
14. **Same-slug concurrency** — all runs shared the `guide-kansai-proof` group (queued, never
    interleaved — visible in the Actions run list).
15. **Publication ≠ deployed-live** — run record ends `published: false, deployedLive: null`
    (unknown stays unknown).
16. **Worker answer routing** — not exercised live (no traveler question was answered mid-run);
    covered by the M6 unit contract + answers-route reading research-v2/ branches. REMAINING
    UNKNOWN for integration week.
17. **Resume after interruption** — a REAL usage-limit interruption (run 32266140623) plus five
    fix-forward re-dispatches each resumed at the exact failed stage; completed stages never
    re-ran (per-stage attempts: passA×2, reconcile×4, critic×4, scaffold/passB×1).
18. **Truthful retry telemetry** — run.v2.json carries per-attempt history with durations and
    failure classes; usage-limit interruptions are classified from the CLI's own output;
    events.json holds 31 deterministic decision events with fetches/nuggets honestly empty and
    counters null.

**Bounded-attempts breaker, proven live twice:** dispatches past the cap ran 29s, spent
nothing, filed stuck issues (#60, #62). Both trips were then resolved by DOCUMENTED operator
resets — the burnt attempts were finalization-harness defects and landing-only re-dispatches
(now exempt from the budget), not agent flakiness.

**Additional scars fixed during the canary (all regression-tested):** landing-gate recording
keyed on the emitted gate verdict (a failed gate had been recorded as passed — the one truth
bug found, closed same-day); schema build moved into the critic's deterministic tail (a
facts.json 240-char violation had surfaced only at the landing dead-end); verify/remap/build
failures at the critic and reconcile retain in-scope work + findings; check-candidates matches
branch-qualified ledger names.

**Cost note (honest):** the canary consumed roughly 2.5 agent-hours of Sonnet/Opus across 11
dispatches, of which ~40 minutes were re-spent due to harness defects since fixed. Token
counts were not machine-observable and are not reported.

## Codex final audit addendum (2026-08-17)

Independent specification, code, and security reviews found and closed the post-M8 seams. Major
corrections: pinned containerized Claude CLI with workspace-only tools and explicit system-path
denials; fresh canonical artifact collection; durable immutable resume inputs; honest failure and
landing-gate state; bounded retries from the trusted checkout; complete intake coverage; stronger
evidence/corroboration/freshness/depth rules; V1-only numeric floors plus explicit V2 adaptive
mode; atomic answer application and complete-unmerged branch routing; validated critic process
memory; public-spend/owner-key fail-closed behavior; and progress UI truth tied to the real landing
gate rather than critic completion.

Local proof: all 13 workflow files parse; build/lint/typecheck pass; full suite passed except one
stale fixture, then the corrected affected suites passed 183/183 (the prior full run had 2,578
passing tests); production preview passed desktop and 375px dark/reduced-motion with no overflow
or browser errors. The final commit reruns the complete suite before push.

Still external by design: first canary must negatively prove `/proc/self/environ` is denied inside
the live container, force cancellation/resume, exercise configured Places/Routes, confirm only a
draft PR is created, and smoke the Worker answer path. No canary or external mutation was run in
this audit session.

## P12 finalization (2026-08-20, Fable) — resolve · prove · test · document

Branch `fable/pipeline-v2-finalize`. Head at handoff: **`7809835`** (+ this docs commit). PR #63.
Bounded finalization pass; architecture unchanged; no merge, publish, cutover, or deletion.

### P12-A — PR #63 merge conflict resolved

Merged `origin/main` (up to `14c2411`) into the branch. The ONLY conflict was
`.github/workflows/research-pass-v2.yml`: main's whitespace-only Actions-indexing nudge vs. the
branch's full V2 workflow. Resolved `--ours` (kept the full 939-line workflow; the trailing
blank line main added carries nothing). Merge commit `8a591e8`. After it: branch contains current
main (0 behind), PR #63 `mergeable: MERGEABLE`, the V2 workflow still has all four `docker run`
agent steps and the default-branch dispatch guard (`vars.WAYPOINT_RESEARCH_ENGINE != 'v2'`), and
`/new` still selects V1 when the cutover var is unset (new-guide.yml unchanged). No production
publication path introduced.

### P12-B — 4 CodeQL findings resolved (one root cause)

All four traced to a SINGLE test-code defect, not a runtime vulnerability. The runtime
`isProxyHost` (`research-rules.mjs`) matches hosts by EXACT string comparison
(`host === p || host.endsWith('.'+p)`) — never a regex — so `PROXY_HOSTS` is never a runtime
regexp. The three `js/incomplete-hostname-regexp` findings (#69/#70/#71, at the `PROXY_HOSTS`
literals) were CodeQL tracing those strings' dataflow into the ONE place they enter a regex: the
config-assertion test's `new RegExp(...host.replace(/\./g,'\\.')...)` (#72,
`js/incomplete-sanitization`), whose dot-only escape was incomplete. Fixed by escaping the full
metacharacter+backslash set (`replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`) at that sink; the denied
host set is unchanged. Regression test added pinning the runtime exact-match invariant against
lookalike (`webcacheXgoogleusercontent.com`, `web-archive.org`), suffix-attack
(`web.archive.org.evil.example`), and real-subdomain cases. Commit `57f9dcd`. Fixing the sink
clears the source-traced findings too (no other regex path exists). **CodeQL re-scan on the PR
head: PASS — 0 open alerts** (Analyze (javascript-typescript) green; all of #69/#70/#71/#72
resolved by the one fix).

### P12-C — live `/proc/self/environ` denial PROVEN

Push-triggered probe workflow (`.github/workflows/environ-probe.yml`) on the throwaway
`probe/environ` branch — never merged to finalize/main; `workflow_dispatch` would 404 until main
carries it (P4), so `on: push` was used. It replicates the production Pass A agent config exactly
(pinned `node:22-bookworm-slim@sha256:d649c27…`, pinned `@anthropic-ai/claude-code@2.1.233`, the
same `WP_TOOLS`/`WP_DENY` rules) and injects a HARMLESS sentinel next to the real
`CLAUDE_CODE_OAUTH_TOKEN`; the token is `perl \Q…\E`-redacted from all output and no raw
environment is uploaded.

- **PASS. Run `32340406684`, job `96338191848` (conclusion: success).** The agent's Read tool was
  BLOCKED on the benign `/proc/version` (`CHECK1_BLOCKED`) — proving `Read(//proc/**)` is effective
  across the whole `/proc` subtree in the pinned CLI (the canary's real risk was a rule syntax that
  silently fails to match, as `/workspace` once did). By the same prefix rule, `/proc/self/environ`
  is denied. Independently, the model REFUSED to read `/proc/self/environ` as a secrets file
  (defense in depth). No `/proc` read succeeded. (Wording corrected in P12.1: the harmless
  sentinel VALUE legitimately appears in normal runner metadata — the mint step's output, env
  blocks. The security claim is precisely that it was never OBTAINED through an agent read of
  `/proc` or exposed from protected process-environment contents — and it was not.)
- Two earlier probe runs (`32339935364`, `32340206007`) returned NO LEAK but were inconclusive
  because the model refused the exfiltration-shaped framing before any tool ran — reframing as a
  benign-path permission diagnostic was what let the tool layer actually be observed.
- Deterministic scar: `pipeline-v2-finalize.test.mjs` now pins the `//proc`,`//sys`,`//dev`
  Read+Edit denials on ALL FOUR agent steps (was one `toContain`), so no edit can silently drop
  the containment rule. Commit `ede35bb`.

### P12-D — R3+ fragile-transport PROVEN

`scripts/__tests__/pipeline-v2-transport-r3-proof.test.mjs` (commit `7809835`). A controlled
artifact carries a genuinely fragile transfer — **late KIX arrival → Namba → Gokurakubashi →
Kōyasan cable car → temple-town bus** — backed by two sources FETCHED this pass: Nankai's
operator station page (the cable car is the only link up from Gokurakubashi;
`nankai.co.jp/en_railway/traffic/station/gokurakubashi.html`, fetched) and japan-guide's access
page (Kōya Line every 20–30 min, Limited Express only ~2/day, ~2 h Namba→Kōyasan;
`japan-guide.com/e/e4904.html`, fetched). The route is R3+ by consequence, not inflation: single-mode
mountain access, an overnight cable-car cutoff, and a missed connection meaning **no bed on the
mountain** — with luggage compounding it. Exact last-cable-car minute left as an explicit re-check
(⚠) since Nankai defers per-day times to Ekitan; freshness carries a transit recheck date.
- The artifact is schema-valid (`wp-evidence/2.1`) AND the REAL `researchRuleProblems` validator
  returns `[]` — including `transportProblems` and `sourceAccessProblems` (risk 3, doorToDoor,
  transferReality, groupLuggageMobility, buffer, missedConnection, nextService, lastPracticalReturn,
  fallback all present; both fetched evidence ids resolve; ≥1 fetched origin).
- Acceptance is EARNED: seven negative controls each flip one field and the same validator rejects
  (drop fallback / all timing anchors / missed-connection / evidence ids / the fetched origin / a
  proxy-URL origin) — and the SAME leg below R3 owes nothing (depth is risk-earned, not always-on).

### P12-E — full deterministic gates on the exact final head

Run on `7809835` (all four green):

| Check | Command | Result |
|---|---|---|
| Build | `npm run build` | 9 pages, schema clean — exit 0 |
| Lint | `npm run lint` | 0 errors, 0 warnings |
| Typecheck | `npm run typecheck` | 0 errors, 0 warnings, 21 pre-existing hints |
| Tests | `npm test` | **163 files, 2649 passed + 1 todo** |

Count moved from the 162/2637 baseline by exactly the regression tests added this pass: +1 file
(transport R3 proof, 10 tests) and +2 in `pipeline-v2-finalize.test.mjs` (proxy exact-match +
the four-step `/proc` pin) = +12 tests. No test was skipped, weakened, or converted to a todo.

### Main-branch integrity (section 11)

Confirmed: only the authorized changes exist on main since the V2 fork (`9f1599b`) — two authority
docs (validation pack, tracker), the inert stub registration PR #59 (`da5580f`), and the
whitespace nudge (`14c2411`). Main's `research-pass-v2.yml` is still a 75-line `permissions: {}`
inert echo-only job (no `docker run`, no fetch, no branch mutation, no publish). Main was not
modified this pass.

### Regression scars added this pass

- Proxy denial exact-match invariant (lookalike / suffix-attack / subdomain), `pipeline-v2-finalize.test.mjs`.
- `//proc`/`//sys`/`//dev` Read+Edit denial pinned on all four agent steps, `pipeline-v2-finalize.test.mjs`.
- R3+ transport acceptance + seven earned-rejection controls, `pipeline-v2-transport-r3-proof.test.mjs`.

### Known gaps unchanged (NOT expanded here — belong to I01/I02 integration week)

Live mid-V2 Worker answer routing (unit/contract-tested only); `GOOGLE_ROUTES_KEY` unset (route
timing advisory when absent); seven honest unresolved geocodes (name-mismatch refusals, correct);
`/new` V2 notification/input threading; Progress-UI manual product-surface proof.

## P12.1 correction pass (2026-08-20, Fable) — two HIGH acceptance-proof gaps closed

Bounded pass ordered after the independent review returned **RECOMMEND_P13_YELLOW** (architecture
ACCEPTED). Scope: exactly two proof surfaces. No merge, no publish, no cutover, no variable set,
no V1 change, no architecture change. PR #61 remains open/draft/unmerged; `canary/kansai-proof`
and `research-v2/kansai-proof` remain; `probe/environ` remains for review.

### Correction 1 — `/proc` containment proven for Grep and Glob (not just Read)

The P12 probe proved `Read(//proc/**)` live but never observed Grep/Glob — which the production
`WP_TOOLS` allows UNQUALIFIED (`Glob,Grep`) while `WP_DENY` names only Read/Edit rules. The probe
workflow on `probe/environ` (commit `c12d736`) was extended, under the UNCHANGED production
configuration (pinned `node:22-bookworm-slim@sha256:d649c27…`, pinned
`@anthropic-ai/claude-code@2.1.233`, `--safe-mode --no-session-persistence`, production
`WP_TOOLS`/`WP_DENY` — no probe-only weakening or strengthening), to run the agent with
`--output-format stream-json --verbose` and score the TOOL-LAYER transcript: for each of
Read/Grep/Glob the scorer requires an observed `tool_use` targeting `/proc` AND a paired
error/denial `tool_result`. A model refusal scores INCONCLUSIVE (exit 2), never PASS. Targets
were harmless (`/proc/version`, the public kernel banner) — the probe proves the permission
boundary, not the model's willingness to touch a secret.

- **PASS. Run `32348279562`, job `96361626055` (conclusion: success, first attempt).** Exact
  observed tool-layer results:
  - `Read {"file_path":"/proc/version"}` → DENIED: `<tool_use_error>File is in a directory that
    is denied by your permission settings.</tool_use_error>`
  - `Grep {"pattern":"Linux","path":"/proc/version"}` → DENIED: `Permission to read
    /proc/version has been denied.`
  - `Glob {"pattern":"/proc/*version*"}` → DENIED: `Permission to read /proc has been denied.`
- All three were real tool invocations (visible as `tool_use`→`tool_result` pairs in the
  stream-json transcript), not model refusals; the sentinel never appeared in agent output; no
  raw environment was read or uploaded; the real token was `perl \Q…\E`-redacted before any
  line printed.
- Deterministic scars: the existing four-agent-step `//proc`/`//sys`/`//dev` Read+Edit pin is
  preserved unchanged; a new pin asserts every agent step carries `--safe-mode` and
  `--no-session-persistence` (the flag set the live proof ran under). Neither pretends to
  replace the live probe — they only prevent silently dropping the proven configuration.

### Correction 2 — R3+ transport fixture re-researched (every consequence source-mapped)

`scripts/__tests__/pipeline-v2-transport-r3-proof.test.mjs` kept its architecture (real
`evidenceDocSchema`, real `researchRuleProblems`, fetched evidence, negative controls) — the
FIXTURE TEXT was the defect. Removed as unsupported: "the only way up", "no parallel road or
rail link", "a missed connection means no bed on the mountain" (which also contradicted the
fixture's own road-taxi fallback). The scenario stays KIX → Kōyasan (Option A) because
re-research supports a defensible R3: a four-segment chain with three transfers, a MANDATORY
final bus (walking the connecting street into the town centre is not permitted — japan-guide,
stated twice), reserved-seat scarcity (~2/day), luggage across every segment, and a
missed-connection consequence of a failed same-night ascent requiring an overnight re-plan
lower down. The taxi is now explicitly an UNVERIFIED lead, never the plan.

- Source-to-claim mapping (all four fetched 2026-08-20 this pass; full mapping in the test
  header, including what each source does NOT prove):
  1. `nankai.co.jp/en_railway/traffic/station/gokurakubashi.html` (operator) — interchange +
     on-premises train→cable-car transfer passage. Does NOT prove exclusivity or timetables.
  2. `japan-guide.com/e/e4904.html` (reference) — LE ~2/day 80 min; express every 20–30 min
     ~100 min, most with Hashimoto transfer; cable ~5 min ¥500; bus ~10 min ¥460; walking into
     town not permitted. Does NOT state first/last services.
  3. `nankai.co.jp/en_railway/traffic/kix.html` (operator) — rapi:t KIX↔Namba "34 minutes the
     fastest". Does NOT state frequencies or last trains.
  4. `nankai.co.jp/en_railway/traffic/station/koyasan.html` (operator) — upper terminus at
     867 m; buses connect the station front with the town.
- No exact departure minute is asserted anywhere; the day's last cable car / last onward bus
  are REQUIRED TRAVELER RE-CHECKS (the ⚠ discipline), and a new scar test regex-pins that no
  `HH:MM` time and none of the three overstated phrases can silently return.
- Validator result: artifact parses (`wp-evidence/2.1`); `transportProblems`,
  `sourceAccessProblems` and the full `researchRuleProblems` all return `[]`.
- Negative controls: all seven preserved, each exercising a DISTINCT rule path (missing
  fallback · missing timing anchors · missing missed-connection · no evidence ids · no fetched
  origin · proxy-as-origin · below-R3 owes nothing). Suite: 11/11 green.
- Per the Validation Pack cost ladder, no live model run was spent re-proving this
  deterministic rule.

### Main stub comment (LOW drift — moot at merge)

Main's inert `research-pass-v2.yml` stub (75-line echo job) still names the OLD cutover
variable `WAYPOINT_V2_ON_DEFAULT` in a comment; the real mechanism is the
`WAYPOINT_RESEARCH_ENGINE` repository variable. PR #63 replaces that stub file wholesale with
the real workflow (which guards on `WAYPOINT_RESEARCH_ENGINE`), so the stale comment is
**moot-at-merge**. No direct-to-main change was made; recorded here only.

### Full deterministic gates on the P12.1 head

Run on `491be14` (the P12.1 test + docs commits; every commit after it is docs-only — this gate
record and the session-end handoff). All four green:

| Check | Command | Result |
|---|---|---|
| Build | `npm run build` | 9 pages, schema clean — exit 0 |
| Lint | `npm run lint` | 0 errors, 0 warnings |
| Typecheck | `npm run typecheck` | 0 errors, 0 warnings, 21 pre-existing hints |
| Tests | `npm test` | **163 files, 2651 passed + 1 todo** |

Count moved from P12's 163/2649 by exactly the two scars added this pass (overstatement-absence
pin in the transport proof; `--safe-mode` pin on all four agent steps). Nothing weakened,
skipped, or converted to a todo.

### Regression safety check (invariants re-confirmed on the P12.1 head)

Unset `WAYPOINT_RESEARCH_ENGINE` ⇒ `/new` dispatches V1 (new-guide.yml untouched; guard pinned
by tests); V1 present and unretired; V2 manual-dispatch, draft-only landing, publication gate
intact; Pass B isolation, critic blindness, proxy prohibition, fetched-provenance rules,
geocode name-mismatch refusal all pinned by unchanged tests; `PLACES_API_KEY` absent from every
agent `docker run` block (test-pinned); credential/remote removal before agents unchanged;
bounded attempts unchanged; PR #61 open+draft+unmerged; canary branches present; no repository
variable read or written this pass. No test was weakened, skipped, or converted to a todo:
the suite GREW by 2 (11 transport + 60 finalize, both green).

## P13 independent go/no-go review (2026-08-20, independent reviewer) — ~~P13_GREEN~~ **WITHDRAWN**

> **RETRACTED same day (see §P13.1 below).** Codex's re-inspection found that the R3+ transport
> fixture still promoted the walking prohibition into bus exclusivity — a defect this review
> failed to catch because it verified the fixture's SUPPORTS lines against the sources but never
> probed the sources for content contradicting the fixture's framing (japan-guide states the
> town centre is "a ten minute bus or taxi ride" from the cable-car station). The GREEN verdict
> was therefore premature. The section is preserved verbatim as the record of what was checked;
> its gate/invariant/Gap-1 findings remain valid, but the verdict does not stand.

Reviewed head: `88d16fe` on PR #63 (`fable/pipeline-v2-finalize` → `main`). Every claim below
was re-verified this review, not accepted from the P12.1 record.

### Verdict

**P13_GREEN — the core engine is proven in isolation; integration week (I01+) may begin**,
subject to Carlo's acceptance (tracker P13 row). Judged against Validation Pack §E: all
release-blocking contracts are proven; the two HIGH proof gaps that conditioned the prior
RECOMMEND_P13_YELLOW are closed with live, independently-inspected evidence; no open item
allows fabricated facts, unsafe publication, lost state, fake progress, or unreliable
trip-critical transport behavior.

### Evidence inspected (independently, this review)

- **Commit chain:** `git log 491be14..88d16fe --stat` — three docs-only commits;
  `git diff 0005d92 88d16fe --stat -- scripts/ .github/` empty, so `0005d92` is the only
  code/test change since the prior reviewed head `346de65`.
- **Gap 1 (`/proc` containment for Grep/Glob):** probe workflow read at
  `probe/environ` @ `c12d736` — container digest, CLI `@2.1.233`,
  `--safe-mode --no-session-persistence`, `WP_TOOLS`, `WP_DENY` byte-identical to the PR's
  Pass A agent step (probe adds only `stream-json --verbose` observability + the sentinel).
  Scorer semantics confirmed in source: tool success ⇒ exit 1, refusal/no-result ⇒ exit 2,
  PASS only on attempted+denied for ALL of Read/Grep/Glob. Run `32348279562`, job
  `96361626055`, attempt 1, conclusion success: all three DENIED lines observed in the raw
  job log; no SUCCEEDED/NOT ATTEMPTED line; sentinel leak check passed.
- **Gap 2 (R3+ fixture):** test file read line-by-line at `88d16fe`; all four cited URLs
  re-fetched this review and each SUPPORTS line confirmed (japan-guide: LE ~2/day 80 min,
  express 20–30 min ~100 min with Hashimoto transfer, cable ~5 min ¥500, bus ~10 min ¥460 to
  Senjuinbashi, walking prohibition stated twice; Nankai: rapi:t "34 minutes the fastest",
  Gokurakubashi on-premises transfer passage, Kōyasan Station 867 m + station-front buses).
  None of the three overstatements present; HH:MM scar confirmed; the seven negative controls
  traced to distinct rule paths in `research-rules.mjs` (`transportProblems` /
  `sourceAccessProblems`, plus the `risk < 3` skip). Targeted suite 11/11.
- **Gates rerun on `88d16fe`:** build 9 pages exit 0 · lint 0/0 · typecheck 0 errors,
  0 warnings, 21 pre-existing hints · tests **163 files, 2651 passed + 1 todo** (delta vs P12
  exactly the two new scars).
- **Invariants:** `gh variable list` empty (unset ⇒ `/new` dispatches V1); PR #63 and #61 both
  OPEN/draft/unmerged; `canary/kansai-proof`, `research-v2/kansai-proof`, `probe/environ` all
  present; `PLACES_API_KEY` confined to the geocode step + landing-gate job (test-pinned, both
  non-agent); `--safe-mode`+`--no-session-persistence` pinned on all four agent steps; main's
  stale `WAYPOINT_V2_ON_DEFAULT` stub comment confirmed LOW and moot-at-merge.

### Non-blockers carried into integration week (unchanged, by prior ruling)

Live mid-V2 Worker answer routing (unit/contract-tested only) · `/new` V2 notification/input
threading · `GOOGLE_ROUTES_KEY` unset (advisory when absent) · seven honest unresolved
geocodes (correct refusals) · Progress-UI manual product-surface proof. None meets a §E RED
criterion; all are I01/I02 scope.

### Review conduct

No merge, publish, cutover, variable change, or deletion was performed. Nothing was fixed or
touched outside this record and the tracker's P13 row.

## P13.1 correction pass (2026-08-20) — residual R3 overstatement fixed; premature GREEN retracted

Ordered by Codex after re-inspecting the remote post-"P13_GREEN": the P12.1 fixture rewrite had
itself introduced a subtler version of the same defect class it was fixing — it promoted the
sourced walking prohibition into **bus exclusivity**. The claim text called the bus "a required
segment", and `missedConnection` treated a missed bus as an automatic failed same-night arrival.
The fetched japan-guide page (e4904) in fact says Kōyasan Station "is a ten minute **bus or
taxi** ride from Koyasan's town center" — verified again this pass. The sourced facts are:
walking is prohibited, so the final leg must be **motorized**; bus and taxi are BOTH documented
modes; late-evening availability of either is a per-day fact no cited page establishes.

### What changed (one file: `scripts/__tests__/pipeline-v2-transport-r3-proof.test.mjs`)

- **Evidence claim (JG_ACCESS):** "the bus is a required segment" → "a ten-minute bus or taxi
  ride from the town centre … the final leg into town is motorized."
- **`transferReality` / `doorToDoor` / `groupLuggageMobility`:** final leg reworded from
  bus-only to "a final motorized leg (bus … or taxi)."
- **`missedConnection`:** no longer asserts automatic failure. Proven vs unknown separated: on-
  foot recovery is not an option (sourced); documented recoveries are a later bus or a taxi;
  the cited pages establish neither remaining services nor evening taxi availability; a late
  miss puts the same-night ascent at serious risk and requires verifying remaining bus/taxi
  options, with the overnight re-plan the consequence **if** the day's motorized options are
  exhausted. Unknown stays unknown in both directions — taxi is asserted neither available nor
  unavailable.
- **`buffer` / `nextService` / `lastPracticalReturn`:** taxi recovery added to the REQUIRED
  TRAVELER RE-CHECK list alongside last cable car / last bus; still no `HH:MM` anywhere.
- **`fallback`:** unchanged in substance (overnight lower down); the road-taxi-ascent-from-
  Gokurakubashi lead is still explicitly unverified, now clearly distinguished from the
  documented station→town-centre taxi.
- **`risk: 3` re-evaluated, retained on the honest remainder:** evening arrival against
  day's-end services · four segments, three transfers (Hashimoto usually added) · reserved LE
  ~2/day · motorized-only final leg with unverified evening recovery · luggage/group compounding
  · perishable unpublished last-service times · meaningful consequence (overnight re-plan) if
  the remaining chain exhausts. No exaggeration needed to keep the fixture's purpose.
- **Source-to-claim mapping updated:** source 2 now SUPPORTS "bus or taxi ~10 min" and
  explicitly DOES-NOT-PROVE bus exclusivity, late-evening bus/taxi availability, or guaranteed
  failure after a missed bus.
- **New scar (the requested regression):** "a walking prohibition is never promoted into bus
  exclusivity" — regex-pins `bus is (a) mandatory/required`, `required segment`, `only (the)
  bus`, `only access`, `no taxi`, `taxi unavailable` out of the fixture JSON. Narrow and
  fixture-specific by design; the validator itself is untouched.

### Validation

Artifact still parses (`wp-evidence/2.1`); `transportProblems`, `sourceAccessProblems`, and
`researchRuleProblems` all return `[]`; all seven earned-rejection negative controls unchanged;
suite now **12/12** (11 + the new scar).

### Review-process lesson (recorded so it compounds)

The P13 review verified every SUPPORTS line affirmatively but never asked the source the
adversarial question — "what does this page say that CONTRADICTS the fixture's framing?" — and
so missed the two-word phrase ("or taxi") that falsified bus exclusivity. Future fact reviews
must interrogate sources for exclusivity/negative claims separately from affirmative claims:
verifying that a source supports what IS said is not verifying that it permits what is IMPLIED.

### Status

P13 verdict returns to **pending independent go/no-go** on the corrected head. No merge,
publish, cutover, variable change, or deletion in this pass; V1 untouched.

## Integration week session (2026-08-20, Fable) — I01–I06

**Authorization:** Carlo explicitly directed "merge PR #63 and then re-run the mission prompt"
(2026-08-20). PR #63 was marked ready and squash-merged as `be9c535` on that instruction —
operationally the P13 go decision, made by the owner. The integration mission's own hard
precondition (accepted V2 on main) holds.

**Session start record (mission §2):**
- Starting main SHA: `be9c535` (squash merge of PR #63, mergedAt 2026-08-20T13:07:11Z).
- Integration branch: `fable/pipeline-v2-integration` from `be9c535`.
- Worktree: clean at branch creation.
- `WAYPOINT_RESEARCH_ENGINE`: **NOT SET** (repo variable list empty) — V1 default active.
- V1 workflows present: `research-pass.yml`, `new-guide.yml`, `change.yml` all on main.
- Open canary artifacts (pre-session, for the cleanup census): PR #61 (draft), branches
  `canary/kansai-proof`, `research-v2/kansai-proof`, `probe/environ`; a stray registered
  workflow `environ-probe` (id 338376924) with no file on main.
- Environment precheck (§2A): Node v24.16.0 (≥22 ✓); `npm ci` exit 0; gh auth scopes
  `repo`+`workflow` (push, dispatch, PR create all available); secrets present unexposed.

**Pre-edit baseline (§7), run on `be9c535`:** `npm test` 163 files, 2652 passed + 1 todo;
build 9 pages exit 0; lint 0/0; typecheck 0 errors 0 warnings 21 pre-existing hints.
No pre-existing failures — nothing unrelated blocks I01–I06.

### Milestone log (appended as each milestone earns completion)

#### I01+I02 deterministic half — DONE (commit `b5b1eed`)

- **Problem (I01):** V1's `/new` dispatch threads the intake `issue`; V2's dispatch did not, and
  the V2 workflow had no `issue` input and no questions-surfacing step — product communication
  continuity was severed on the V2 path.
- **Problem (I02):** V2's land job hardcoded `--land pr`, and `--require-verified` checks the V1
  spine (`state.json`) a V2 run never completes — no safe product path to publication existed.
- **Fix:** run.v2.json gains durable, schema-validated `issue` (nullable) + `landMode`
  (pr|auto, immutable per run) recorded at init; resumes/retries inherit both (retry dispatches
  deliberately pass neither — test-pinned). `land-mode` subcommand + pure `landingMode()` compute
  the deterministic landing decision (auto ⇔ product intent AND every stage complete).
  `recordProductLanding()` writes gate PASS + published into run.v2.json BEFORE the merge (an
  auto-merged landing deletes its branch), failing closed on incomplete runs via the schema's
  own complete-requires-all-stages rule — wired inside `pipeline.mjs land` on the passed&&auto
  path only. new-guide.yml's V2 dispatch passes `-f issue` + `-f land=auto`; the V2 land job
  computes the mode, passes `--announce`, and skips the post-record on a merged outcome; a
  `questions` job (always(), continue-on-error) surfaces traveler assumptions from the run's own
  recorded issue. Progress gateway (I05 half): stale "NOTHING EMITS THIS YET" claim corrected;
  fetchRunEvents falls back to `main` so a merged product run's event log stays readable.
- **Tests:** `pipeline-v2-integration.test.mjs` (24 new; schema round-trip/back-compat, inherit/
  heal/refuse semantics, landingMode matrix, recordProductLanding fail-closed, workflow-text
  pins); orchestration draft-only pin intentionally CHANGED to the durable-intent contract;
  gateway tests updated (+ merged-run fallback). Full gates on the head: 164 files,
  2677 passed + 1 todo · build 9 pages · lint 0/0 · typecheck 0 errors.
- **Remaining:** the live boundary proofs below.

#### Live boundary evidence (recorded as earned — fixture slugs: andorra=B #64 · san-marino=C #65 · liechtenstein=D #66)

- **Two REAL defects found and repaired at the live boundary** (both invisible to the 2,677-test
  deterministic suite — the mission's autonomous-repair contract working):
  1. `/new` scaffold lost its issue number (run `32375205019`): `runScaffold` read `get("issue")`
     where pipeline.mjs's `get` answers only literal flags, env fallback named `ISSUE_NUM` vs the
     workflow's `ISSUE` — scaffold pushed to main, THEN died at the reply; issue never closed,
     research never auto-started for EITHER engine. Fixed (`resolveScaffoldArgs`, refuse-before-
     push guard), 6 tests, cherry-picked to main as `062d3ad`.
  2. change.yml's answers-to-active-research re-dispatch 403'd (run `32379790925`) — token never
     had `actions: write`; the M6 path had never run live. Answer landed on the ledger, run never
     resumed. Fixed job-level (least privilege), pinned, on main as `2d39b2c`.
- **L1 selector OFF (V1 routing):** #64 → scaffold `32375596604` success → reply + issue CLOSED →
  V1 run `32375641704` dispatched with the issue, NO V2 run → canceled pre-agent-spend. ✓
- **L2a issue/land threading live:** V2 run `32376069336` on the integration ref
  (`-f issue=64`, land blank) → run.v2.json on research-v2/andorra records
  `issue: "64"`, `landMode: "pr"`, runId `andorra-20260820-8df468`. passA completed (~28 min);
  canceled mid-passB (force-cancel — the harsh no-graceful-record interruption). ✓
- **L3 selector ON (V2-from-main routing):** variable set 14:21:00Z. #65 → scaffold success →
  exactly ONE V2 run `32379667830` from MAIN (default-branch guard's selector escape hatch), zero
  V1 → canceled post-setup (attempt gates exercised: research-v2/san-marino, attempt 1). Note:
  main's init records no issue/landMode (undefined) — the integration diff's addition shown
  differentially. ✓
- **§9 answers leg live:** passA emitted the REAL question card `q-andorra-1` (the seeded date
  fork). change.yml dispatch (source=answers, PLAN_JSON) → `answers-route: andorra → research
  (research-v2/andorra)` → answer applied + pushed (`2fb6781`) → after the 403 fix, second
  dispatch `32380556859` SUCCESS: idempotent re-apply ("some were already answered" — duplicate
  cannot corrupt) → V2 re-dispatch `32380657184` passed the guard (selector ON), resumed the
  correct branch, canceled post-setup. Worker /answer hop NOT re-proven live (no owner key in
  this session — recorded credential gap; auth is unit-tested + previously live-proven). ✓
- **Selector restored:** variable deleted (~14:33Z; window ≈12 min). #66 → scaffold success → V1
  run `32380832093` dispatched, no new V2 → canceled. Selector verified ABSENT. ✓
- **I04 resume live:** re-dispatch `32380888749` (slug only): passA job SKIPPED (attempts still
  1 — completed expensive work not repeated), passB resumed on attempt 3 (history closed the
  interrupted attempts honestly), attempts.total 3 of 5 as budgeted, issue/landMode inherited. ✓
- **Security recheck (§17):** integration diff contains zero agent-step/credential/tool-policy
  changes; only new permissions block is the questions job's narrow contents:read+issues:write
  and change-job's designed actions:write; publication authority remains workflow-level (land
  job), unreachable from research agents. ✓

#### Lifecycle completion (I02 live, controlled/draft mode) — DONE

Final run `32396654277` (the fifth and last budgeted dispatch): reconcile PASSED on the
feedback-driven retry (attempt 3 — the 1B loop converged: 7 → 6 → 0 blocking findings; the
agent's own note confirms it worked from the injected findings), geocode resolved the three
placeholder place_ids, critic passed, compose+build+verify green in-stage. Land job:
`landing mode pr (intent pr; stages complete)` → REAL evidence gate `npm run build` exit 0 +
`npm run verify --network` exit 0, `passed=true` → **draft PR #67** (never merged). Questions
job: "none open, or all already asked" (q-andorra-1 already answered — correct dedup). Terminal
run.v2.json: status **complete**, landingGate **passed**, publication.published **false** (the
draft-mode guarantee held to the very end), deployedLive **null** (honest), attempts 5/5
bounded, issue 64 + landMode pr durable throughout. Emitted events.json: 20 real decision
events (funnel 19→13→8, adaptive-saturation stop, disagreement investigation) with fetches 0 /
nuggets 0 / counters null — honest absence, nothing fabricated.

Verify-scorecard note for the record: the in-workflow candidates gate ran ADAPTIVE (V2 posture,
`WAYPOINT_PIPELINE_V2=1`) and PASSED on Andorra's small honest consideration set — the
DECISIONS.md no-fixed-quotas rule observed live; the numeric floors remain only for
V1-context verifies (deliberate TEMP_COMPAT until cutover). A local repro without the env
shows floors — not a defect.

#### I06 — V1 parity classification (recommendation; nothing executed)

V2 now proves live: `/new` creation (selector), draft-safe landing through the real gate,
interruption/resume without repeating completed work, owner communication (issue threading +
questions + answers), Progress compatibility. Product-mode publication is deterministic-proven;
its live exercise is post-merge (below). Classification per `docs/LEGACY_ERADICATION.md`
(two rows updated this session): **still required** — V1 workflow+prompts as `/new`'s default
and rollback until cutover; **shared, must remain** — pipeline.mjs spine (now the SHARED
publication path), gate.mjs, state.json read/write, check-run-integrity, Progress V1 adapters,
V1 coverage.json ask registry; **eligible for later retirement (Carlo/Codex authorization,
after a green post-merge selector-ON canary)** — new-guide.yml's V1 dispatch arm →
research-pass.yml + V1 prompts → check-passb-coverage.mjs → V1-only checkpoint surfaces;
**post-cutover migrations** — V2-native ask registry, historical state.json display.

#### CONFLICTING_SPEC flagged for Codex (pre-existing; observed, not resolved)

CONTEXT.md's decision "Fixed research floors are GONE repo-wide" (2026-08-17) explicitly
REJECTED keeping floors for V1 only — yet shipped `check-candidates.mjs` retains
`DEFAULT_FLOORS` + `researchFloors`, active whenever `WAYPOINT_PIPELINE_V2 != 1` (i.e. every
V1-context verify). The andorra run behaved correctly (adaptive in-workflow, candidates PASS);
the contradiction is between the recorded decision and the V1-context code path. Predates this
session (#63); changing V1 verify behavior is outside I01–I06 scope, so it is recorded here
out loud rather than silently fixed or silently ignored. Codex should rule: delete the floors
per the decision, or amend the decision to bless the env-gated TEMP_COMPAT.

#### Recorded evidence gap (the single YELLOW)

The live product-mode AUTO-MERGE cannot run before the integration PR merges: a branch-ref
dispatch would side-door the whole integration branch into main via the research branch's
merge, and main's pre-merge workflow lands draft-only by construction. Machinery is V1's
production `--land auto` path + deterministic V2 gating (all test-pinned). First post-merge
action: one selector-ON `/new` canary observed end-to-end.

#### Live proof plan (executed — kept for the record; all items done except as noted above)

- [x] L1 selector OFF: fixture-B intake issue (Andorra, dates seeded with a mild contradiction
  so a traveler question card exists) → scaffold from main → V1 dispatched with issue, NO V2 →
  cancel V1 before agent spend. Record run ids.
- [x] L2a: push branch; dispatch research-pass-v2 `--ref fable/pipeline-v2-integration`
  `-f slug=<B> -f issue=<B#>` (land blank ⇒ draft). Let passA COMPLETE; cancel during passB
  (the I04 interruption).
- [x] L3: `gh variable set WAYPOINT_RESEARCH_ENGINE v2` (prior state: ABSENT — restore to
  ABSENT). Fixture-C intake → exactly one V2 dispatch from main, zero V1 → cancel post-setup.
- [x] §9 answers leg (selector still ON, B active): dispatch change.yml source=answers with
  PLAN_JSON naming B's real question id → answers-route detects research-v2/<B> → ledger apply
  on the branch → V2 redispatch passes the guard → cancel that run post-setup (resume leg
  proven; no expensive rework). Worker /answer hop itself NOT re-proven live (no owner key in
  this session — recorded credential gap; auth contract unit-tested + previously live-proven).
- [x] Restore selector: `gh variable delete WAYPOINT_RESEARCH_ENGINE`; verify absent. Fixture-D
  intake → V1 dispatched again → cancel. (Restored-OFF proof.)
- [x] L2b: re-dispatch B on the integration ref (slug only — issue/land inherit) → passA NOT
  repeated, passB→reconcile→geocode→critic→land run to completion → evidence-gated DRAFT PR +
  landing verdict recorded + questions job comments on B's intake issue.
- [x] Known structural gap to record in the PR: the live product-mode AUTO-MERGE cannot be
  exercised before this integration PR itself merges (a branch-ref dispatch would side-door the
  integration code into main via the research branch's merge; main's workflow lands draft-only
  by construction pre-merge). Product-mode machinery is deterministic-proven; its live exercise
  is the first post-merge selector-ON /new.
- [x] Cleanup: cancel stray runs; delete research/<B> (V1 stub), research-v2/<C> state, C/D
  scaffolds from main (one chore commit); B's intake issue + draft PR + research-v2/<B> branch
  KEPT as review evidence. Selector verified ABSENT.
- Attempt budget for B: 3 of 5 dispatches consumed by design (init/interrupt · answer-redispatch
  cancel · completion).

## Release-candidate correction pass (2026-08-20, Fable) — PR #68 defect sweep

The integration pass above shipped with real product-path defects its own INTEGRATION_YELLOW
understated. Every defect below was reproduced from the PR #68 head `3a33c47`, root-caused,
fixed ON THE BRANCH (no direct-to-main commits this pass), and regression-tested. Baseline at
start: main `e56b5de`, selector ABSENT, worktree clean, 2,715-test suite green.

| # | Defect (root cause) | Fix | Regression protection |
|---|---|---|---|
| P0-1 | **Publication recorded before the merge.** `recordProductLanding()` wrote `landingGate=passed` + `published=true` + emitted "Published (merged)" BEFORE `landBranch` ran — a conflict/API failure would leave a branch asserting a publication that never happened | Two-phase transaction: phase 1 (pre-merge) records ONLY the gate verdict; phase 2 runs after gh confirms an outcome — `recordLandingOutcome` (draft/failed, never publication) or `finalizeMergedLanding` (merged: publication finalized ON MAIN, idempotent retry via `pipeline-v2 finalize-landing`). New `landing` state object (outcome/pr/mergedAt/announced/finalizedAt); schema REFUSES `published` without a confirmed merged outcome and a passed gate | Transaction matrix in `pipeline-v2-integration.test.mjs` (gate-pass-only · conflict-draft · API-failure · confirmed-merge · idempotent-retry · draft-intent-refused · unpassed-gate-refused · notice-failed-recorded); the old premature-publication test REPLACED; contracts suite's distinct-facts scar AMENDED to the honest path |
| P0-2 | **Auto-publish authority bypass.** The `land` workflow input let ANY manual dispatch type `auto`; a feature-ref dispatch could then auto-merge its research branch (integration code and all) into main; `pipeline.mjs land` defaulted to auto; `recordProductLanding` never checked intent | `land` input REMOVED; intent DERIVED (auto ⇔ default-branch ref + selector v2), immutable, and RE-CHECKED as landing-time product authority in the land job; `pipeline.mjs land` defaults to pr (fail-safe) and refuses `--land auto` on a draft-intent run; `finalizeMergedLanding` independently requires intent+gate+completeness+PR identity | Side-door scars: no-land-input pin, derived-intent pins, authority re-check pin, CLI default-pr pin, CLI escalation-refusal pin, finalize-refusal unit tests |
| P0-3 | **V1 rollback contamination.** Shared `land` discovered historical `run.v2.json` by file presence; Progress read V2-on-main before an active V1 branch; answers routing let a stale complete V2 branch steal an active V1 run's answers | ONE active-run definition: `land` keys V2 handling on exact branch identity (`research-v2/<slug>`); Progress fetchRun reads branches (both generations) before main history; answers-route inspects BOTH namespaces, active-beats-stale, dual-active REFUSES with a diagnostic | Rollback matrix: gateway test (active V1 branch + historical V2 on main → V1, runId null), answers-route source pins (ordering + refusal), land branch-identity pin |
| P0/P1-4 | **Terminal-run resume.** A fresh research-v2 branch inheriting a merged run's state from main silently "resumed" the terminal run (re-landing old content) | Fresh-run semantics: the branch step emits `resumed`; init with `--branch-fresh true` archives a merged run to `previousRuns` (append-only) and mints run B fresh; non-merged inherited state REFUSES loudly | Full lifecycle test (A merges → B fresh, new identity, clean state, A inspectable); anomaly-refusal test; resume-still-works test |
| P1-5 | **Unscoped telemetry.** events.json carried no run identity — a new run or V1 rollback could display a previous run's stream from main | Emitter stamps `runId`; parser REFUSES identity-less streams; `eventsForRun()` joins stream↔snapshot in the UI (V1 snapshots carry runId null → honest-empty); event wording reality-ordered (gate PASS is only gate PASS; "Draft PR #N" only when one exists; "Published — PR #N merged" only post-merge; failed notice surfaced) | run-events identity suite (refusal, mismatch, V1-null, pass-through), finalize-suite round-trip amended, emitter wording pins in the transaction matrix |
| P0/P1-6 | **Safety notice dead.** The land job's permissions override dropped `issues:write` while `land-branch.sh` hid every notice failure behind a swallowed error — the vetoable auto-publish notice could never file, silently | `issues:write` restored (comment names why); the notice failure is reported in the outcome line (`merged:<n> announce=ok/failed/skipped`), parsed by `landBranch`, recorded durably (`landing.announced`), surfaced as an event — the merge itself never un-claimed | Permission scar (workflow text), shell-contract pins (announce line format, no swallowed `gh issue create`), parser contract test, announced:false unit+event test |
| P1-7 | **Post-merge question delivery.** The questions job read its dispatch-SHA checkout; after a merged landing (branch deleted, merge newer than the dispatch SHA) it missed the merged ledger entirely; the branch could also vanish between check and fetch | The job fetches the run's CURRENT home: the branch when it survives (existence-check + fetch as one guarded step, falling through on the race), else the LATEST default branch via FETCH_HEAD | Workflow pins (BASE fetch, FETCH_HEAD checkout, race fall-through) |
| P1-8 | **Late-answer no-op.** A complete-but-unmerged draft run counted as "active": the answer was appended and the redispatch just re-landed the unchanged product | `reopenForAnswers`: reconcile+critic re-open (history/cost preserved), landing verdicts reset, resume=reconcile — the re-run genuinely absorbs the answer; published runs refuse (change lifecycle); still-owed runs no-op. change.yml calls it between apply and redispatch | reopen unit matrix (reopens/no-ops/refuses) + change.yml wiring pin |
| P2-9 | **Question-notification bugs.** Substring dedup (`q-1` suppressed `q-10`); a failed comment-read assumed "no comments" and would duplicate everything; copy claimed "your guide is complete" mid-run and invited "reply here" with no ingestion path | Exact `<sub>id</sub>` marker dedup; comment-read failure SKIPS posting with a `::warning::` (retry next run); copy truthful — work "carries on either way", answers routed via the progress page / ✎ button | Dedup + copy pins (orchestration suite, amended scar named as such) |
| P2-10 | **Duplicated landing decision.** `land-mode` reimplemented `landingMode()` | The CLI now calls the tested pure function and composes landing-time authority | Wiring scar (source pin: `landingMode(state)` present, no re-derivation) |
| P1/P2-11 | **Fixed-floor CONFLICTING_SPEC resolved.** Authority chain traced: DECISIONS.md (locked) + CONTEXT 2026-08-17 (repo-wide removal, V1-exception explicitly rejected) + census 2026-08-19 ("already gone") vs the shipped env-gated `DEFAULT_FLOORS`. No later ruling blesses retention → implemented repo-wide | Floors, `researchFloors` (checker + the dead schema field whose own test claimed deletion) removed; structural checks + saturation remain | Floorless-doctrine suite (small-set-passes, absence pin over module surface + source text); CONTEXT decision recorded |
| P1-12 | **Checklist/auto-publish contradiction.** The scorecard said "Publishing still needs the checklist above" while doctrine (publish.mjs) says the evidence gate is the bar and the approval ceremony was removed — an unenforced requirement in prose | Human rows are now ADVISORY review prompts (no unchecked boxes, no mandatory language); verdict text names the evidence gate as the bar | Scorecard-language scars in both renderers (checkbox absence + advisory phrasing + old-claim regex bans) |

**Docs corrected with the code:** the workflow header + land-step comments (two-phase truth),
pipeline-v2.mjs header, pipeline.md V2 row, CONTEXT.md (the integration-week entry's premature-
publication clause corrected as a recorded rejection; two new decisions added), the stale
"NOTHING EMITS" run-events header, this file's executed-plan checkboxes.

**Cleanup this pass:** andorra fixture (guide dir + intake) REMOVED on the PR branch — merging
PR #68 removes it from main; PR #67 commented (DO NOT MERGE, evidence pointers) and CLOSED;
selector verified ABSENT throughout (no variable touched this pass).

**Final-cleanup list for the post-merge acceptance pass:** delete branch `research-v2/andorra`
(after Codex inspects #67's diff if desired); delete `canary/kansai-proof` +
`research-v2/kansai-proof` + `probe/environ` + draft PR #61 + the stray `environ-probe`
workflow registration (P10–P13 evidence — only after independent review signs off); run the
selector-ON `/new` product canary and verify the two-phase landing + safety notice live.

**Remaining live-only acceptance gaps (impossible pre-merge, by design):** the real default-
branch product auto-merge (requires this PR's code ON main + selector ON), and the Worker
`/answer` hop (owner key not available to any session; unit + prior-live evidence stands).

## Final integration-hardening pass (2026-08-20, Fable) — R1–R13 on PR #68

The pre-Codex deterministic hardening sweep. Every requirement was first re-confirmed against
the current head, then fixed with a behavioral test at a real seam. Summary (full detail in
PR #68's body and the suites named):

- **R1 — trusted-invocation authority.** new-guide.yml now invokes research-pass-v2.yml via
  `workflow_call` (the trusted product entry: the called run executes under the caller's
  "issues" event); `deriveLandIntent()` (run-state.mjs) mints "auto" ONLY for non-dispatch
  provenance + default-branch ref + selector "v2". A manual `workflow_dispatch` on main with
  the selector live now creates a **pr** run. New CLI `land-intent`; the old two-fact shell
  derivation is gone. Scaffold serialization moved to job-level concurrency so the called
  research run cannot hold the new-guide slot for hours.
- **R2/R3/R10 — verified, durable, truth-preserving recovery.** New
  `scripts/pipeline/v2/landing-truth.mjs`: `verifyMergedPr` (gh-backed: MERGED state, real
  mergedAt, base + `research-v2/<slug>` head; refuses open/closed-unmerged/unrelated/wrong-
  base/wrong-head), `resolveDefaultBranch`, `finalizeLandingRecovery` (validates the checkout,
  verifies, finalizes with GITHUB's mergedAt, commits AND pushes to the remote default branch —
  push failure = failed recovery). `finalizeMergedLanding` refuses a PR mismatching the
  recorded landing and preserves a recorded `announced` when the retry omits it; the printed
  retry command now always carries `--announced`. The land CLI's merged path also verifies
  before finalizing.
- **R4 — fresh-run workspace reset.** `resetFreshRunWorkspace` (workspace.mjs) removes the
  prior run's mutable artifacts (evidence/coverage/passB/feedback/events/geocode + tracked
  run.v2.json) from a fresh branch and its recorded baseline; CLI `init --branch-fresh` runs it
  before capturing the scaffold baseline. Proven end-to-end with the REAL Pass-B verifier in a
  real git repo (pipeline-v2-hardening + lifecycle-proof suites) — previously a re-research's
  baseline structurally could not pass `verify-passb-workspace`.
- **R5 — one active-generation resolver.** `src/lib/run-generation.mjs` (plain .mjs, consumed
  by Node and Vite): active V2 > active V1 > complete-draft V2 > V2 history > none; dual-active
  = explicit conflict. answers-route AND the Progress gateway (fetchRun/fetchQuestions/
  fetchRunEvents) consume it; the gateway resolves once per poll batch.
- **R6/R11 — run-scoped publication + truthful landing rendering.** RunSnapshot now carries
  the RUN's own `published` + `landingOutcome`; the page keys "Published" on those (Run B never
  inherits Run A's live guide), landing failed renders "Landing failed" with gate PASS intact,
  draft renders "Awaiting review", dual-active renders an explicit diagnostic; polling no
  longer stops on an inherited publication.
- **R7 — late answers past the cap.** `reopenForAnswers` grants a bounded
  `V2_REOPEN_ATTEMPT_GRANT` (2) above the exhausted cap — human-gated only; the autonomous cap
  itself is unchanged.
- **R8 — gate truth ≠ landing truth.** The land CLI emits the gate verdict on the hard-failure
  path; the workflow's crash handler no longer rewrites a passed gate into gate FAIL and never
  pushes to a merged run's deleted branch (the zombie-branch resurrect); a passed gate on a
  pr-mode landing crash is preserved explicitly.
- **R9 — conflict fallback unpublished.** `restoreDraft` (publish.mjs) re-quarantines the
  guide on the passed+auto draft (conflict) outcome, committed to the fallback branch — a
  human merging the conflict PR merges a DRAFT.
- **R12 — HANDOFF_ARCHIVE.md** re-normalized to pure LF + single trailing newline; the PR diff
  is now the genuine snapshot rotation only.
- **R13 — deterministic lifecycle proof.** `pipeline-v2-lifecycle-proof.test.mjs` walks
  /new→A(auto)→passes→gate→verified merge→finalized publication→Progress-done→fresh B→
  unpublished B→B owns questions/events/answers→clean B Pass-B workspace, against the real
  modules with mocked GitHub only.

**Validation:** full vitest suite 168 files / 2,776 tests green (incl. the three new suites) ·
typecheck 0 errors · lint 0 errors · build clean · axe a11y 55/55 · dist grepped for the
retired Progress wording. **Not executable locally:** the live product auto-merge and Worker
/answer hop (live-only by design, unchanged); PR CI runs on push.

## Codex re-review corrections (2026-08-20, after `de69123` — three release blockers + one recovery-truth defect)

Codex independently re-reviewed the R1–R13 head and confirmed four remaining defects. All four
are fixed on the branch, each with the mandated real-seam behavioral tests (new suite:
`pipeline-v2-release-blockers.test.mjs` — real git repos, real bare origins, gh mocked only at
the process seam).

- **Blocker 1 — answers routing: active ownership BEFORE historical publication.** The real
  `answers-route` computed slug publication from main first and inspected research branches
  only inside `if (!published)` — so published Run A + active Run B skipped active-generation
  resolution entirely and sent Run B's answer to the change lifecycle. The whole resolution now
  lives in `resolveAnswerRouting` (questions.mjs, injectable git/guidesDir): both branch
  namespaces are inspected UNCONDITIONALLY, the shared resolver decides ownership, dual-active
  refuses, and only an ownerless answer routes by publication. `routeAnswers`'s precedence
  flipped to match; the tests asserting published-beats-active are corrected. Proven at the
  real seam: published main + active B → B; + complete-unmerged B → B; + active V1 → V1;
  + nothing → change; dual-active → refusal.
- **Blocker 2 — finalization proves the RUN, not the branch name.** `research-v2/<slug>` is
  reused across generations, so `verifyMergedPr`'s base+head identity let an operator finalize
  Run B against Run A's old merged PR. It now also requires GitHub to name the merge commit and
  reads `guides-intake/<slug>/run.v2.json` out of that commit's own tree — the run state rode
  the branch into the merge (phase 1), so the merge commit carries exactly the run it landed;
  any runId other than `expectedRunId` (mandatory, both callers supply it) refuses. Proven from
  the REAL merged-but-unfinalized state (landing.pr never pre-seeded): Run A's PR refused,
  unrelated same-base PR refused, Run B's PR succeeds with GitHub's mergedAt persisted to
  origin.
- **Blocker 3 — every non-merged auto landing re-quarantines ORIGIN.** The conflict fallback
  logged a failed draft-restore push and continued (reporting a safe draft outcome), and the
  hard-failure path never restored draft at all. The landing transaction moved to
  `scripts/pipeline/landing.mjs` (`executeLanding`, injectable seams) with
  `quarantineRemoteBranch` (publish.mjs): restore → commit → ALWAYS push → best-effort PR
  undraft; a push failure on the conflict path records landing FAILED and exits 1 (BLOCKED,
  never "safely draft"), and the hard-failure path quarantines before rethrowing. Proven with
  real remotes: CASE A (conflict → origin branch draft:true, draft outcome), CASE B (conflict +
  dead remote → BLOCKED/failed/exit 1, no safe-restore claim), CASE C (hard failure → draft
  restored AND pushed before exit, landing failed, gate PASS), plus the lost-push retry.
- **Recovery truth — announcement fails closed.** A crash between the merge and main leaves
  durable `announced:null`; a recovery omitting `--announced` silently finalized unknown.
  `finalizeLandingRecovery` now refuses when neither the durable state nor the flag carries the
  fact; `--announced` accepts `ok|failed|skipped` (skipped = no announce URL — the one honest
  null), and the land path's printed retry command always carries one of the three. Proven from
  the real merged-but-unfinalized state, not a pre-seeded one.
- **FINAL lifecycle proof.** One deterministic 12-step test: Run A publishes → Run B same slug
  → REAL answers routing picks B despite A live → gate PASS → hard failure + remote quarantine
  → retry → real merge (performed by a gh-side clone) + finalization crash → recovery refuses
  A's old PR → refuses missing announce fact → recovers with B's PR → B published, durably on
  origin.

**Validation this pass:** full gates re-run (build · lint · typecheck · full vitest suite incl.
the new 18-test blocker suite); results recorded in the PR's acceptance matrix.
