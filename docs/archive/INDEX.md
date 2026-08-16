# docs/archive/ — the index

Finished plans and reports whose **bodies live in git, not in the working tree** (owner ruling,
2026-08-15). Each entry below says what the document was, when it ran, and how it ended. To read
one in full: `git show <commit>:docs/archive/<file>` prints its final state, and
`git log -- docs/archive/<file>` walks its whole history.

Code comments and docs cite these as `docs/archive/INDEX.md → <NAME>`; the name is the heading
to look for here. Two files in this folder are **not** indexed, because they still exist:
`HANDOFF_ARCHIVE.md` (the session-end ritual keeps appending to it) and
`visual-redesign-history.md` (live test comments cite its R6 ledger by name).

---

### PLAN_EVIDENCE_FIRST.md — evidence first, guide second

Written 2026-08-12 against the creator's master-orchestrator mandate, executed 2026-08-13, retired
2026-08-15. Its principle holds and is now just how the repo works: `facts.json` is the canonical
fact layer and prose is presentation — no parallel evidence store was ever created. Shipped: the
frozen Japan regression fixture (A1) and the 12/12 detection harness that closes the program (H1);
`risk`/`entity`/`evidence` on the fact schema (B1); the migrate-facts value fix and dedup (B2); the
facts-hygiene, risk-gate, uncertainty, drift and routes checkers wired into `npm run verify`
(B3/E1/E2/E3); intake certainty states and the contradiction gate (C1/C2); destination knowledge as
data (D1); entity-batched, risk-scaled research in the skill (D2); the candidate shortlist stage
(D3). Packet G1 (remove autonomous publication) was **struck by the creator** — see `CONTEXT.md`.
`git show c507b91:docs/PLAN_EVIDENCE_FIRST.md`

**Parked items** — everything not carried into the current architecture:

- **F4, the prose-reduction ledger, was never recorded** and its 2026-08-12 baseline no longer
  exists: the 2026-08-15 refactor moved every workflow prompt into `prompts/` and rewrote
  `pipeline.md`, so a before/after `wc -l` against that baseline would measure two different repos.
  Definition-of-done #5 retires with it. Nothing depends on the number.
- **The risk-keyed half of E1/E2/E3 is still dormant** — no fact row in the corpus carries
  `risk`/`tier`/`entity`/`evidence`, so each defect class ships a risk-INDEPENDENT detector and
  `risk` only escalates where a research pass supplies it. That is a recorded state, not a task:
  `CONTEXT.md`, "Evidence-gate detection is DECOUPLED from `risk`/`evidence`/`tier`".
- **Japan's three malformed fact values survive** (`$16.50,` · `$1,` · `$80,` in
  `src/content/guides/japan/facts.json`). B2 fixed the regex that produced them, never the rows,
  and hand-patching Japan is forbidden — the guide is `draft: true` and will be regenerated. The
  five equivalents on published guides are gone: korea's four were repaired, `us` was deleted.
- **Definition-of-done #7 ("`pipeline.mjs` and `land-branch.sh` diff-clean") is superseded**, not
  broken. It bound *this* program's packets; the 2026-08-15 architecture refactor rewrote the spine
  under its own creator approval.

### PLAN_PIPELINE_SURFACES.md — the pipeline's three surfaces get designed

Written 2026-08-15 as the execution contract for the `design_handoff_pipeline_and_intake/` bundle,
executed and retired 2026-08-16 on branch `design/pipeline-surfaces`. Landed in five commits: the
progress cockpit with its route map (`0d6aae0`), the intake preflight checklist (`f9b333a`), the
change-request requester view (`544cc95`), the owner triage queue at `/progress/triage/`
(`63a63ff`), and this retirement. Its deferred hub fork closed separately in `e119f2a`. Five
Reconciliations corrected the bundle where the same morning's architecture refactor had made it
stale — the ones still worth knowing are recorded as Decisions in `CONTEXT.md`. What survives in the
working tree: the note-panel/stalled/route-map rules in `docs/reference/pipeline.md`, eight rows in
`docs/reference/motion.md`'s inventory, and the code itself. The bundle was **deleted, not moved** —
an inline-styled prototype drifts from the implementation within a release, and a stale reference is
worse than none. `git show 8961b91:PLAN_PIPELINE_SURFACES.md` ·
`git show 8961b91:design_handoff_pipeline_and_intake/README.md` (the spec, its verifier checklist
and its 30 captioned frames' index).

### revise-guide.md — the MAJOR-revision pipeline (V1–V6)

Drafted 2026-07-30 as a plan, kept in `docs/reference/` as the shipped pipeline's spec, retired
2026-08-15 when the change lifecycle absorbed it. It synthesized two independent designs into one
arc and shipped all six phases: the label substrate, the issue template + parser + plan validator,
a four-agent chain (plan → scoped re-research → ripple sweep → fresh-context critic on the diff)
with model fallback, and the feedback-driven auto-file. What survived the merge into `change.yml`
is in `docs/reference/pipeline.md`: the ≤5-group cap that separates a change from a re-research,
the DATA channel for a requester's own words, the `guide-<slug>` concurrency group, the fork gate,
the critic-on-the-diff, and "nobody asked for it, so a human signs it off". What did not: the
approval labels, the planner agent, and the persisted revision plan with its status machine.
`git show c507b91:docs/reference/revise-guide.md`

### PLAN_DESIGN_RECONCILIATION.md — the three Claude Design projects vs. the shipped site

Written 2026-08-12, closed 2026-08-13. A fidelity audit (§A) of hub, guide, tools, notation and
tablet against P1/P2/P3's own screenshots, then the polish it earned (§C): the drift baseline
paid down 153 → 29 real violations, the day chip's pill → underline fix, the 44px decision, the
print-preview shell, and the token sync back to the design projects. Every box ticked; §C5's
final walk found six 44px regressions the a11y gate structurally could not see and widened it.
`git show 59352c2:docs/archive/PLAN_DESIGN_RECONCILIATION.md`

### pipeline-history.md — how the current pipeline architecture was reached

A record, never a work order, split out of `docs/reference/pipeline.md` on 2026-08-13 so the
live policy doc could state the contract without the story. Covers the P-series (P0 verify
roll-up → P4 auto-graduate on evidence), the W-series skill-loop arc of 2026-07-23 (zero-click
intake Worker, automated learnings PR, pre-trip recert dispatch, the self-improvement loop), and
the 2026-08-02 critic merge that folded three agents into one.
`git show f3f4578:docs/archive/pipeline-history.md`

### CHANGELOG.md — the structural story, 2026-06-05 → 2026-07-16

Not every commit: the shifts that changed how the thing is built — static HTML → Astro with
typed content collections, the authoring pipeline and the guide-author skill, the design
identity pass, Firebase live group sync, the convergence merge into sealed silos, and the
Learnings loop. Frozen at 2026-07-16 and moved out of the repo root on 2026-08-14 (owner
ruling); everything after it is recorded in `CONTEXT.md` and the plans indexed here.
`git show 8ecdfdd:docs/archive/CHANGELOG.md`

### PLAN_ATLAS_MIGRATION.md — the Atlas hub, end to end

Produced 2026-08-07 with 22 settled decisions (D1–D22), executed 2026-08-07 → 2026-08-09 across
stages A–G: the guide-sheet delta, the Atlas data layer, the hub flip (`atlas.astro` became
`index.astro`, the old hub deleted in one commit), mobile, the Tools screen, then full redesigns
of the twelve unspecced features and a closeout. Its stage and decision numbers are still cited
from code comments — Stage A.3 `closed_days`, Stage B.6 the search index, D6 the sheet ordinal.
`git show 8b5a690:docs/archive/PLAN_ATLAS_MIGRATION.md`

### PLAN_FACTORY_V2.md — the pipeline earns its contracts

Drafted 2026-07-29 to execute the Japan QA report's findings; P1–P6 shipped the same day, P7's
status corrected 2026-08-02. Landed the run-integrity gate (a checkpoint whose predecessor is
not committed is refused; a zero-output run is declared void), Pass B as its own A-blind agent,
the intake-coverage matrix, the fresh-context critic, the traveler progress page and question
channel, the `venues` block type, and the voice gate. R13/R14 were left unbuilt.
`git show 8b5a690:docs/archive/PLAN_FACTORY_V2.md`

### PLAN_MOBILE_NAV.md — "feels like an app"

Briefed and shipped 2026-07-30, all three phases (`da19002`, `90ba636`, `d3a3660`). Bottom tab
bar plus groups sheet as mobile's primary navigation, swipe between tabs, yielding chrome, day
scrubber, sheet physics. Its "As built" section is the durable half: telemetry ranking was not
buildable (ranking became per-device localStorage), the bar is deliberately not a `tablist`, the
scrubber reused the existing day rail, and two bugs only running it could find are now tests.
`git show 26560e2:docs/archive/PLAN_MOBILE_NAV.md`

### QA_RESEARCH_TRIAL_JAPAN.md — QA of the first unattended pipeline run

Adversarial evaluation of the 2026-07-29 Japan run (PR #26), written with commit hashes and grep
counts rather than from memory. Verdict: the factory works and the guide clears the generic-AI
bar, but the run violated three of its own contracts. F1–F14 findings, R1–R20 recommendations
and a readability addendum (R20, the `venues` block) — the input PLAN_FACTORY_V2 then executed.
`git show 8b5a690:docs/archive/QA_RESEARCH_TRIAL_JAPAN.md`

### PLAN_VISUAL_OVERHAUL.md — "The Overture & the Atlas"

Sessions V1–V4 done 2026-07-20, V5–V6 done 2026-07-23. The full-viewport hub intro (deterministic
contours, kinetic headline, real counted stats), per-guide palette tinting on hub cards, the
masthead contour overlay, and the accent morph that carries a trip's colour from hub card into
guide masthead. V6's QA numbers and the honest "what was deferred" list live in
`docs/reference/motion.md`, which is the doctrine's live home. Superseded by the Atlas hub.
`git show 2c59768:docs/archive/PLAN_VISUAL_OVERHAUL.md`

### PLAN_FIELD_REPORT_FIXES.md — the field report's execution queue

Eight sessions E1–E8 against the 2026-07-22 field report (itself since deleted), all
complete (E8's last item settled 2026-07-23) **except E2**, the real end-to-end pipeline run,
deferred by the creator until a real trip exists to plan. Shipped the fail-closed `--network`
publish gate, the strict undated-figure gate, Korea and Denmark provenance backfills to
`provenance: "strict"`, entry/phrase content, and the tap-to-apply day-route optimizer (E7).
`git show 2c59768:docs/archive/PLAN_FIELD_REPORT_FIXES.md`

### PLAN_TRAVELER_FEATURES.md — traveler features, research-prioritized

July 2026 plan of eight self-contained sessions ordered by traveler benefit ÷ build cost. F1
(book-by deadlines), F2 (budget pact — shipped deviating from its own spec, because the intake's
budget string never reaches a guide as structured data), F4 (packing strip), F5 (offline
confidence) and F6 (pre-trip auto-recert) shipped; F0/F3/F8 moved into PLAN_FIELD_REPORT_FIXES;
F7's critic reached C1 only, with C2/C3 gated on two real research passes.
`git show 2c59768:docs/archive/PLAN_TRAVELER_FEATURES.md`

### FEATURES.md — the researched feature backlog

Ten features derived from 2026-07-18 market and group-travel research, scored and creator-
approved, all $0-API by rule. The approved wave shipped in full (transit deep-links, arrival
autopilot, phrase cards, entry-requirements card, sun strip, advisory pill, recap card); the two
held items later shipped as well; the reservation vault was dropped. Its numbering (#1, #5–#10)
is still cited from code comments as the reason a feature exists.
`git show 8b5a690:docs/archive/FEATURES.md`

### DENMARK_UPLIFT.md — verdict and lessons on the concluded Denmark trip

Measured 2026-07-17, never scheduled: Denmark stays an archive by the maker's call. Its finding
was that the two features asked for by name were not gaps at all — the scrolling itinerary
already renders, and a forecast is permanently impossible on a concluded trip — while the real
miss was `energy` tags on 0 of 9 days. The lessons belong to future guides, and the evidence has
already paid out in `docs/evidence/traveler-patterns.md`.
`git show 2c59768:docs/archive/DENMARK_UPLIFT.md`
