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
