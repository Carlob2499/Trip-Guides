# HANDOFF archive — superseded snapshots and re-prompts

> **Truncated 2026-08-15** (owner ruling): only the three most recent snapshots stay in the
> working tree. Every older one is in git — `git log -- docs/archive/HANDOFF_ARCHIVE.md`
> walks the history, and `git show a79d194:docs/archive/HANDOFF_ARCHIVE.md` prints the full
> 2,080-line file as it stood. Newest first, verbatim.
>
> Moved out of `docs/handoff.md` 2026-08-03 to keep it a handoff, not a chronicle
> (the ~80-line budget its own header sets is gated by
> `scripts/__tests__/docs-integrity.test.mjs`). The session-end ritual still appends here.

## Snapshot (2026-08-20 — P12.1 targeted correction: the review's two HIGH proof gaps closed)

The independent P11/P12 review returned **RECOMMEND_P13_YELLOW** (architecture ACCEPTED) with
exactly two HIGH acceptance-proof gaps; this bounded pass closed both and stopped. **Gap 1 —
`/proc` containment now proven for Grep and Glob, not just Read:** the `probe/environ` workflow
(commit `c12d736`) reruns the agent under the UNCHANGED production config with
`--output-format stream-json --verbose`, and a scorer requires an observed `tool_use` on `/proc`
AND a paired tool-layer denial for EACH of Read/Grep/Glob — a model refusal scores INCONCLUSIVE,
never PASS. **Run `32348279562`, job `96361626055`: all three tools attempted `/proc/version`
(harmless) and were DENIED at the tool layer**; sentinel never obtained via any agent tool. New
scar pins `--safe-mode`+`--no-session-persistence` on all four agent steps (the flag set the
proof ran under). **Gap 2 — the R3+ transport fixture re-researched:** the overstatements the
review flagged ("only way up", "no parallel road", "no bed on the mountain") are GONE; the
KIX→Kōyasan scenario stays, now justified only by fetched-source claims (4 sources re-fetched
this pass: 3 Nankai operator pages + japan-guide e4904, full source-to-claim mapping in the test
header), with the strongest sourced fragility fact being japan-guide's twice-stated rule that
walking from the cable-car station into town is not permitted — the final bus is mandatory. All
exact last-service times are explicit traveler re-checks; a new scar regex-pins that no `HH:MM`
time and none of the three overstated phrases can return. Validator returns `[]`; all seven
distinct negative controls preserved. Full record: `docs/pipeline v2/IMPLEMENTATION_STATE.md` →
"P12.1 correction pass".

## Snapshot (2026-08-20 — P12 finalization: PR #63 merge-ready, CodeQL clean, /proc + R3 proven)

The Fable P12 pass made PR #63 (`fable/pipeline-v2-finalize` → main) genuinely reviewable and
boring. **Merge conflict resolved** — merged current main (`8a591e8`); the only conflict was main's
whitespace nudge vs. the full V2 workflow, resolved `--ours`; PR #63 is now `MERGEABLE`, 0 behind,
all four `docker run` agent steps + the default-branch dispatch guard intact, `/new` still V1 when
the cutover var is unset. **4 CodeQL findings fixed at one root cause** — all traced to a single
test-code regex (`pipeline-v2-finalize.test.mjs`) with incomplete dot-only escaping; `isProxyHost`
matches by exact string comparison (never a regex) so the runtime deny set never changed; full
metacharacter escape added + a lookalike/suffix-attack regression test; **CodeQL PR-head re-scan
PASS, 0 open alerts**. **`/proc/self/environ` denial PROVEN live** — a push-triggered probe on the
throwaway `probe/environ` branch, replicating the exact production agent config, showed the Read
tool BLOCKED on the benign `/proc/version` (`CHECK1_BLOCKED` — the `Read(//proc/**)` rule is
effective across the subtree, so environ is denied) while the model independently refused environ
as a secret (defense in depth); sentinel never leaked. **Run `32340406684`, job `96338191848`.**
**R3+ transport PROVEN** — a controlled KIX→Kōyasan fragile-transfer artifact (single-mode mountain
access, overnight cable-car cutoff, missed connection = no bed), sourced from two pages fetched this
pass, is schema-valid and accepted by the real `researchRuleProblems`; seven negative controls prove
the acceptance is earned. Full P12 record: `docs/pipeline v2/IMPLEMENTATION_STATE.md` → "P12
finalization".

## Snapshot (2026-08-20 — Pipeline V2 finalization: canary GREEN, census clean, cutover switch built)

The Fable finalization session fixed all four Core Proof blockers (generated machine-contract
capsule · durable per-stage retry feedback · V2 coverage consumed by the real verifier ·
deterministic geocoding in-pipeline), added source-access classes with a proxy refusal, per-attempt
retry telemetry, and a truthful Progress event emitter. The V2 workflow was registered via an inert
main stub (PR #59, the one authorized early merge) and the REAL pipeline ran end-to-end on GitHub
Actions: Pass A → Pass B → Reconcile → geocode → Critic → **draft PR #61**, landing gate PASSED
honestly (build + networked verify, 0 dead links), guide still `draft: true`, publication false.
Eleven dispatches; every failure deterministic, regression-tested, and resumed at the failed stage
— including a real usage-limit interruption and two live trips of the attempt-cap breaker (stuck
issues #60/#62, resolved by documented operator resets). The repository-wide legacy census found
ZERO dead code files; its five findings (template blurbs, motion.md rows, a silo deep-import, an
archived build prompt, three dead labels) are all resolved — `docs/LEGACY_ERADICATION.md` is the
ledger. `/new` now carries the cutover switch: `WAYPOINT_RESEARCH_ENGINE=v2` routes to V2; unset
means V1, unconditionally. An independent code review of the session's diff found one HIGH (clean
first-try runs crashed their completion checkpoint on the absent feedback pathspec), one MEDIUM
(comma-hostname injection into the critic's --allowedTools) and one LOW — all fixed same-session
with pinning tests. Durable record: `docs/pipeline v2/IMPLEMENTATION_STATE.md` (18-point proof).

