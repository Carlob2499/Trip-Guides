# Repaired-class Combined Research Run B #2 (Yamagata) — evidence packet

Status: **RUN-B BLOCKED — REPAIR SURFACE EXCEEDS BOUNDED VALIDATION**
Authority: `VALIDATION_RUNBOOK.md` §V02/§V03/§V05 · frozen scenario `VALIDATION_TRIAL_PACKETS.md` §"Combined Research Run B" · post-#106/#107 repaired-class authorization (`docs/handoff.md`)
Bounded self-repair budget: one fresh Run-B, at most two deterministic repair cycles. Both cycles were spent on real defects; a third independent defect stops the pass by rule.

## Run identity

- Slug `yamagata` (substituted: `tottori` is occupied by the prior Run-B's durable state on `research-v2/tottori`; per the packet's occupancy rule, Yamagata Prefecture — Yamagata / Yamadera / Ginzan Onsen — satisfies all three risk classes; substitution documented in the frozen intake before dispatch)
- runId `yamagata-20260828-73821a` · branch `research-v2/yamagata` · scaffold/dispatch head `b28e741`
- Frozen candidate exactly: Sonnet 5 high (A + B + reconcile), Opus 5 critic · `landMode: pr` · publication boundary held throughout
- Attempts: 9 of an original cap 5, extended twice by documented hand decisions on the run branch (`399599e` 5→8, `c650abd` 8→10) after deterministic — not research — failures; auto-retry 1/1; counters truthful at every step

## Stage history

| Stage | Attempts | Outcome |
|---|---|---|
| Pass A | 1 | complete first try |
| Pass B | 1 | complete first try |
| Reconcile | 5 | findings converged 11→5 blocking → build-gate catch → artifact-truth catch → complete at a5 |
| Critic | 4 | all four attempts refused by offline verify; run left `failed`, resume=critic |

## What the live run PROVED (the repaired contracts working)

- **R-C repaired, observed live:** reconcile attempt 3 was refused because the composed tree fails `npm run build` (a `≈` panel without `verified_on`) — the exact defect class the old gate silently accepted at Tottori's `b153af3`. The gate now runs the build and fails closed.
- **R-E repaired, observed live:** reconcile attempt 4 was refused for crowd/atmosphere claims resting on a single experiential source set (copied families counted once), worth-labels on non-retained candidates, and a dishonest saturation claim. Convergence no longer buys independence.
- **Critic baseline pinning, observed live:** `stages.critic.baseline` pinned once at the pre-critic geocode commit and never rewritten across four attempts.
- **Retained critic output, observed live:** every refused critic attempt's in-scope work was committed (`… retained for repair`) and survived the workflow boundary into the next dispatch's fresh checkout.
- **Fail-closed corrections accounting, observed live:** an undeclared changed leaf, a wrong envelope key, and string-shaped `source`/`freshness` were each refused with exact machine findings; no critic assertion was ever accepted as proof.
- **Attempt accounting, observed live:** the run went honestly `stuck` at its cap ("no agent spend"), and each hand extension is a visible commit on the run branch. Nothing was silently retried.
- **Resumption, observed live:** every re-dispatch continued the same runId at the recorded resume stage; nothing restarted or skipped ahead.

Not exercised live (covered deterministically by the 137-test prerequisite suites, all green at dispatch): evidence-owner routing to reconcile, routed replay with zero critic invocations, supersession decisions, coverage against superseded evidence, landing.

## Deterministic defects found (the reason for BLOCKED)

1. **REPAIRED (cycle 1) — capsule/validator corrections-handoff mismatch.** The critic capsule said 'write … with schema `wp-critic-corrections/2.1`' and listed `source`/`freshness` as bare names; the validator reads `schemaVersion` and requires objects. Critic attempts 1–2 were refused on exactly those two faces. Fixed in `contract-capsule.mjs` (keys and object shapes stated verbatim); red-first regression pins every schema key and both "never a …" guardrails into the generated capsule.
2. **REPAIRED (cycle 2) — retained declarations lost across repair attempts.** Whole-stage leaf accounting spans pinned-baseline→final tree, but each blind repair attempt declares only its own edits and its raw workspace doc clobbers the retained one (attempt 2 replaced attempt 1's complete 45-target handoff with 6 malformed rows; attempts 3–4 could never satisfy accounting again). `reconcile-critic-truth` now supplements the current doc with row-valid declarations from the stage's earlier retained docs (newest first, current attempt winning per target, rows for no-longer-changed leaves dropped, never phantom). Red-first regression drives the exact scar shape.
3. **OPEN (defect #3, out of budget) — retry feedback truncation starves multi-location contract findings.** `feedback.mjs` caps every stored finding line at `FINDING_MAX_CHARS = 400`, and `stage-feedback` feeds the retry from that store. The corrections contract failure is ONE line enumerating every undeclared pointer (42 of them, ~2.5KB); the retrying critic received ~8 pointers and structurally could not comply — observed on critic attempts 3 and 4, which each declared only the few edits they could see. Additionally, attempt 1's rows carried string `source`/`freshness` (pre-cycle-1 capsule), so the cycle-2 merge cannot honestly resurrect the 42 leaf declarations — the run cannot reach green without either the truncation fix plus a fresh critic attempt, or re-research.

## Recommended next engineering pass

One bounded repair: feedback storage/rendering must preserve contract findings' full location lists (per-pointer findings or a per-entry rather than per-line cap), red-first against the yamagata attempt-3/4 scar, then ONE further critic-owned attempt on this same run (resume=critic is intact and all retained work is durable). No new architecture is required; no research doctrine changes.

## Repository state

- Repairs + this packet: branch `claude/pipeline-v2-run-b-validation-9faans` (PR to `main`, review-gated)
- Run state: `research-v2/yamagata` at `0734c1b`+, `failed`, resume=critic, 9/10 attempts
- `main` untouched; nothing merged; no publication; V1 remains production default
