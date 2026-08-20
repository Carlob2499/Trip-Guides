# HANDOFF archive — superseded snapshots and re-prompts

> **Truncated 2026-08-15** (owner ruling): only the three most recent snapshots stay in the
> working tree. Every older one is in git — `git log -- docs/archive/HANDOFF_ARCHIVE.md`
> walks the history, and `git show a79d194:docs/archive/HANDOFF_ARCHIVE.md` prints the full
> 2,080-line file as it stood. Newest first, verbatim.
>
> Moved out of `docs/handoff.md` 2026-08-03 to keep it a handoff, not a chronicle
> (the ~80-line budget its own header sets is gated by
> `scripts/__tests__/docs-integrity.test.mjs`). The session-end ritual still appends here.

## Snapshot (2026-08-20 — Integration week I01–I06 executed; draft PR #67-adjacent integration PR up)

Carlo directed "merge PR #63 and re-run the mission" — the P13 go made operationally. PR #63
squash-merged as `be9c535`; branch `fable/pipeline-v2-integration` carries I01–I06. Delivered:
durable `issue` + immutable `landMode` in run.v2.json (resumes inherit both; escalation/strip
refused); deterministic `land-mode` decision + `recordProductLanding` (pre-merge record, fails
closed on incomplete); questions job (always(), dedup); Progress reads real events with a main
fallback for merged runs. **Two live defects found+fixed on main:** `/new` scaffold lost its
issue (`get("issue")`/ISSUE_NUM seam — `062d3ad`) and change.yml's answers re-dispatch 403
(missing `actions: write` — `2d39b2c`); the M6 answers path had NEVER run live before.
**Andorra fixture (#64) proved the lifecycle live:** selector OFF→V1 / ON→V2-from-main /
restored→V1; issue threading; interruption after passA → resume skipped it; reconcile failed
offline verify twice and the 1B feedback retry converged (7→6→0); geocode+critic+land green;
`landing mode pr` → real gate exit 0 → **draft PR #67, published:false, deployedLive:null,
attempts 5/5**. Full gates green. Evidence: IMPLEMENTATION_STATE "Integration week session".

## Snapshot (2026-08-20 — P13.1: premature GREEN retracted, R3 fixture bus-exclusivity fixed)

The first P13 review returned GREEN on `88d16fe` and was **retracted the same day**: Codex's
re-inspection caught that the P12.1 fixture rewrite had itself promoted the sourced walking
prohibition into **bus exclusivity** ("the bus is a required segment"; missed bus ⇒ automatic
failed same-night arrival) — while the fetched japan-guide page says Kōyasan Station "is a ten
minute **bus or taxi** ride from Koyasan's town center" (re-verified this pass). The review had
verified every SUPPORTS line affirmatively but never asked the source the adversarial question
— what does the page say that CONTRADICTS the framing — the lesson is recorded in §P13.1.
**The correction (one file, `pipeline-v2-transport-r3-proof.test.mjs`):** final leg reworded
everywhere to "motorized (bus or taxi)"; `missedConnection` made conditional (on-foot recovery
impossible is sourced; failure only IF the day's motorized options exhaust; taxi asserted
neither available nor unavailable); taxi recovery added to the REQUIRED RE-CHECK list;
`risk: 3` re-evaluated and honestly retained on the remaining fragility stack; mapping updated
(source 2 now DOES-NOT-PROVE bus exclusivity); new scar pins the exclusivity wording out.
Suite 12/12; validator returns `[]`; Gap-1 probe proof and all gate/invariant findings from the
retracted review still stand. Records: IMPLEMENTATION_STATE §P13 (retraction banner) + §P13.1.

## Snapshot (2026-08-20 — P13 independent review: P13_GREEN on PR #63 head `88d16fe` — RETRACTED same day, see the P13.1 snapshot)

The P13 go/no-go review ran fully independently — every P12.1 claim re-verified from primary
evidence, none accepted on faith. **Gap 1 re-verified:** the `probe/environ` workflow at
`c12d736` was read line-by-line and its container digest / CLI `@2.1.233` /
`--safe-mode --no-session-persistence` / `WP_TOOLS` / `WP_DENY` confirmed byte-identical to the
PR's Pass A agent step; the scorer's semantics (success ⇒ breach, refusal ⇒ INCONCLUSIVE, PASS
only on attempted+denied for all three tools) confirmed in source; the raw log of run
`32348279562` / job `96361626055` shows all three DENIED lines and no SUCCEEDED/NOT-ATTEMPTED
line. **Gap 2 re-verified:** the transport fixture was read in full and all four cited URLs
re-fetched this review — japan-guide e4904 and the three Nankai pages each support exactly the
SUPPORTS lines (incl. the twice-stated walking prohibition and rapi:t "34 minutes the fastest");
the seven negative controls trace to distinct rule paths in `research-rules.mjs`; targeted
suite 11/11. **Gates rerun on `88d16fe`: all green** (build 9 pages · lint 0/0 · typecheck
0 errors · **163 files, 2651 passed + 1 todo**). Invariants held: no repo variable set, PR #61
open/draft, canary + probe branches present, `PLACES_API_KEY` confined to non-agent steps.
Verdict recorded in `docs/pipeline v2/IMPLEMENTATION_STATE.md` → "P13 independent go/no-go
review" and the tracker's P13 row. Nothing merged, published, cut over, or deleted.
[Retraction note, added when archiving: the Gap-2 re-verification checked SUPPORTS lines
affirmatively but missed that the same page documents "bus or taxi" — the fixture's
bus-exclusivity framing was unsupported. Verdict withdrawn; see IMPLEMENTATION_STATE §P13.1.]
