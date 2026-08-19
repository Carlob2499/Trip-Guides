# Pipeline V2 — Implementation State (durable resume record)

> Maintained by the implementation agent (build prompt archived: `docs/archive/INDEX.md → FABLE_IMPLEMENTATION_PROMPT`). A resumed session
> reads THIS file, inspects `git log` on `codex/pipeline-v2` and the working diff, and continues
> from "Next action" below. Never regenerate completed work.

## Position

- **Last completed milestone:** Codex adversarial correction pass after M8
- **Current milestone:** local implementation complete; Phase 1 manual canary is next
- **Exact next action:** run the timeline's manual draft-only canary and prove the external
  boundaries listed below. Do not merge to main, switch dispatch, publish, or delete V1.

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
· begin-stage · finish-stage · fail-stage · auto-retry · prepare-passb ·
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
  and records stage telemetry (duration/model/effort + evidence-derived counts). A stage with
  problems and no diff = VOID (`void=true` output, failure class void-run) → ONE bounded
  auto-retry re-dispatch; any other agent failure = honest `agent-failure`, branch manually
  resumable (usage-limit never guessed from logs).
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
failure path — cancel an agent step and confirm fail-stage records `agent-failure` and the
branch resumes at the same stage on re-dispatch; (3) confirm `pipeline land --gate` on the
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
  guard refusing default-branch dispatch unless the `WAYPOINT_V2_ON_DEFAULT` repository
  variable is deliberately set (the cutover switch). NOTE: the squash-merge push produced no
  Actions events (platform hiccup); a whitespace nudge commit to main (`14c2411`) re-triggered
  indexing and registered the workflow.

Gates after the fixes: build ✓ · lint ✓ · typecheck ✓ · full suite 162 files / 2619 ✓ + 1 todo.

**Live canary (Phase 5):** slug `kansai-proof` (TEST DATA — Osaka+Kyoto Nov 13–17 2026,
couple, food>culture>nature, KIX evening arrival, Nara day trip, rain concern, Kiyomizu
illumination anchor conflict) scaffolded on `canary/kansai-proof` (with a copied
`src/data/destinations/kansai-proof.json`), dispatched as run **32259673565** on that ref.
Draft-only; not Carlo's real Japan guide; never merged to production.

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
