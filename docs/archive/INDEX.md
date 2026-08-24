# docs/archive/ — the index

Finished plans and reports whose **bodies live in Git, not in the working tree**. Each heading is a stable lookup anchor used by current code/docs comments. To recover a body, run its `git show` command; use `git log -- <path>` for earlier versions.

`visual-redesign-history.md` is the only full historical body intentionally kept here because current reference/test comments still cite its R6 ledger by name.

---

### HANDOFF_ARCHIVE.md — superseded operational snapshots

Historical handoff snapshots moved out of `docs/handoff.md` to keep current operational context bounded. The append ritual is retired; SessionStart now injects the bounded handoff capsule and superseded snapshots stay in Git history. Final working-tree body contained the Aug 20 release-candidate/integration-hardening snapshots and the Aug 22 PR #75 reliability-repair snapshot.
`git show 011c22fd58c7bb4c871336c6656600b455dbbd0f:docs/archive/HANDOFF_ARCHIVE.md`

### FABLE_IMPLEMENTATION_PROMPT.md — Pipeline V2 build prompt (M0–M8)

Executed 2026-08-17 through the V2 core build and Codex correction pass; current milestone truth lives in `docs/pipeline v2/IMPLEMENTATION_STATE.md`.
`git show 9f1599b:"docs/pipeline v2/FABLE_IMPLEMENTATION_PROMPT.md"`

### PLAN_EVIDENCE_FIRST.md — evidence first, guide second

Executed 2026-08-12–13. Established the fact/evidence-first architecture, regression fixture, risk/evidence gates, contradiction checks and destination-knowledge flow; current decisions live in `CONTEXT.md` and code.
`git show c507b91:docs/PLAN_EVIDENCE_FIRST.md`

### PLAN_PIPELINE_SURFACES.md — pipeline product surfaces

Executed and retired 2026-08-16. Shipped Progress, intake preflight, requester change view and owner triage; current behavior lives in `docs/reference/pipeline.md` and implementation.
`git show 8961b91:PLAN_PIPELINE_SURFACES.md`
`git show 8961b91:design_handoff_pipeline_and_intake/README.md`

### revise-guide.md — MAJOR-revision pipeline (V1–V6)

Retired 2026-08-15 after its useful contracts were absorbed into the change lifecycle: bounded groups, DATA channel, exact guide concurrency, fork gate and fresh-context critic.
`git show c507b91:docs/reference/revise-guide.md`

### PLAN_DESIGN_RECONCILIATION.md — design projects vs shipped site

Closed 2026-08-13 after fidelity/drift reconciliation, touch-target correction and design-project token sync.
`git show 59352c2:docs/archive/PLAN_DESIGN_RECONCILIATION.md`

### pipeline-history.md — path to the current pipeline architecture

Historical P-series/W-series/critic-merge narrative split from live pipeline policy so current authority could describe contracts without chronology.
`git show f3f4578:docs/archive/pipeline-history.md`

### CHANGELOG.md — structural story, 2026-06-05 → 2026-07-16

Frozen structural history from static HTML through Astro, authoring, design identity, Firebase, sealed feature ownership and Learnings. Later durable decisions live in `CONTEXT.md`.
`git show 8ecdfdd:docs/archive/CHANGELOG.md`

### PLAN_ATLAS_MIGRATION.md — Atlas hub migration

Executed 2026-08-07–09. Shipped the Atlas data/hub migration, mobile/tools work and unspecced-feature redesigns; stage/decision names remain historical anchors in code comments.
`git show 8b5a690:docs/archive/PLAN_ATLAS_MIGRATION.md`

### PLAN_FACTORY_V2.md — pipeline contract hardening

Executed 2026-07-29 from the first unattended Japan-run QA. Shipped run-integrity, A-blind Pass B, intake coverage, fresh-context critic, Progress/question channel, venues and voice gates.
`git show 8b5a690:docs/archive/PLAN_FACTORY_V2.md`

### PLAN_MOBILE_NAV.md — “feels like an app” navigation

Executed 2026-07-30. Shipped mobile bottom navigation, groups sheet, tab swipes, yielding chrome, day scrubber and sheet physics; current behavior is implementation + tests.
`git show 26560e2:docs/archive/PLAN_MOBILE_NAV.md`

### QA_RESEARCH_TRIAL_JAPAN.md — first unattended-run QA

Adversarial review of Japan PR #26. Its findings drove `PLAN_FACTORY_V2.md`; retained only as historical evidence of the defects that motivated those contracts.
`git show 8b5a690:docs/archive/QA_RESEARCH_TRIAL_JAPAN.md`

### PLAN_VISUAL_OVERHAUL.md — “The Overture & the Atlas”

Executed 2026-07-20–23. Shipped the original animated hub/masthead/palette work before Atlas superseded the hub; surviving motion doctrine lives in `docs/reference/motion.md`.
`git show 2c59768:docs/archive/PLAN_VISUAL_OVERHAUL.md`

### PLAN_FIELD_REPORT_FIXES.md — field-report execution queue

Executed July 2026 except the intentionally deferred real-trip E2 run. Shipped network publication gating, undated-figure safety, provenance backfills, entry/phrase content and route optimization.
`git show 2c59768:docs/archive/PLAN_FIELD_REPORT_FIXES.md`

### PLAN_TRAVELER_FEATURES.md — traveler feature plan

July 2026 benefit/cost plan. Shipped booking deadlines, budget pact, packing strip, offline confidence and pre-trip recert; remaining items were absorbed by later plans or evidence gates.
`git show 2c59768:docs/archive/PLAN_TRAVELER_FEATURES.md`

### FEATURES.md — researched feature backlog

2026-07-18 researched/approved feature set. The approved wave shipped; historical numbering remains cited by some code comments.
`git show 8b5a690:docs/archive/FEATURES.md`

### DENMARK_UPLIFT.md — concluded Denmark-trip lessons

2026-07-17 evaluation, never scheduled as a rebuild. Useful traveler lessons were promoted into `docs/evidence/traveler-patterns.md`.
`git show 2c59768:docs/archive/DENMARK_UPLIFT.md`
