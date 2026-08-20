# Pipeline V2 — Implementation State (durable resume record)

> Maintained by the implementation agent (build prompt archived: `docs/archive/INDEX.md → FABLE_IMPLEMENTATION_PROMPT`). A resumed session
> reads THIS file, inspects `git log` on `codex/pipeline-v2` and the working diff, and continues
> from "Next action" below. Never regenerate completed work.

## Position

- **Last completed milestone:** P12.1 targeted correction pass — the two HIGH acceptance-proof
  gaps from the RECOMMEND_P13_YELLOW review closed: `/proc` containment proven for Grep+Glob
  (not just Read) at the tool layer, and the R3+ transport fixture re-researched so every
  claimed consequence maps to a fetched source (see the **P12.1 correction pass** section below)
- **Current milestone:** P13 — independent go/no-go on `fable/pipeline-v2-finalize` → main (PR #63)
- **Exact next action:** Codex inspects the P12 + P12.1 evidence and PR #63's new head, then
  makes the P13 call. Cutover stays OFF (WAYPOINT_RESEARCH_ENGINE unset ⇒ /new dispatches V1).
  Do not merge, publish, or delete V1 without acceptance.

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
