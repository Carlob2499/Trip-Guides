# HANDOFF archive — superseded snapshots and re-prompts

> **Truncated 2026-08-15** (owner ruling): only the three most recent snapshots stay in the
> working tree. Every older one is in git — `git log -- docs/archive/HANDOFF_ARCHIVE.md`
> walks the history, and `git show a79d194:docs/archive/HANDOFF_ARCHIVE.md` prints the full
> 2,080-line file as it stood. Newest first, verbatim.
>
> Moved out of `docs/handoff.md` 2026-08-03 to keep it a handoff, not a chronicle
> (the ~80-line budget its own header sets is gated by
> `scripts/__tests__/docs-integrity.test.mjs`). The session-end ritual still appends here.

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
