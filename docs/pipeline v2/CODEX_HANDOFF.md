# Codex Handoff — Pipeline V2

Read this file after `docs/pipeline v2/DECISIONS.md`.

The repo-wide audit requested below is complete. This file now records the verified dependency contract; do not repeat the audit.

Implement Pipeline V2 only through the bounded Codex-authored execution prompt in this directory.

The creator decisions in DECISIONS.md are authoritative.

## What you need to answer

We want to know:

**Can the current research pipeline be cleaned up safely, or is a simpler Pipeline V2 replacement the better option?**

Do not answer from theory. Trace the actual code first.

## Current known pipeline

The current research flow is approximately:

Intake → Pass A → Pass B → Reconcile → Critic → Verify → Publish

Claude is currently the research backbone.

The Guide Author skill is the main research rulebook:
`.claude/skills/waypoint-guide-author/SKILL.md`

Supporting rules:
`.claude/skills/waypoint-guide-author/references/`

Research prompts:
`prompts/`

Pipeline code:
`scripts/pipeline.mjs`
`scripts/pipeline/`

Progress UI:
`src/features/pipeline-progress/`

Do not assume this list is complete. Find every real dependency.

## Important current behaviors to preserve unless deliberately replaced

- frozen original intake
- separate research ledger/state
- Pass A / Pass B independence
- primary-source verification of operational facts
- explicit uncertainty instead of guessing
- verification dates
- candidate rejection history
- Pass B reconciliation accountability
- resumable research runs
- attempt limits / stuck-run protection
- fresh-context criticism
- deterministic verification before publishing
- network checks before publication
- change continuity checks
- pre-trip / recert behavior
- real regression tests from past failures
- honest-empty Pipeline UI behavior

If you recommend removing one of these, explain what replaces its protection.

## Known places where the new decisions may conflict with current code

### Pass B quotas

The current system has hard minimum counts for Pass B findings.

The creator has decided research should use adaptive saturation instead.

Find every prompt, gate, test, and UI assumption tied to the old numeric floors.

### Pass B evidence

The current Pass B format appears built around one source URL and primary-source verification.

The new rules distinguish objective facts from experiential evidence.

Find everything that would need to change if experiential findings may use multiple independent firsthand sources.

### Research stages

Current state/checkpoint code assumes the existing stage sequence.

Do not add, merge, or remove stages without identifying everything that depends on stage names and ordering.

### Telemetry

The Pipeline UI already has a run-events model, but the backend reportedly does not emit the data yet.

Inspect this before creating a second telemetry system.

Future telemetry should include token/time/search/retry/research counts where practical.

### Guide Author

Do not simply make SKILL.md longer.

Inspect whether it should stay a smaller core rulebook with domain-specific references such as food, reservations, native-language research, transport, and events/attractions.

Only recommend this if it actually helps token use and maintainability.

## What to inspect

Follow the real data flow from `/new` through:

- intake
- scaffold
- guides-intake
- research branch
- Pass A
- Pass B
- reconcile
- critic
- verification
- compose
- publish
- guide UI
- progress UI
- change workflow
- recert
- pretrip
- feedback/learnings

For every important step, identify:
- who starts it
- what it reads
- what it writes
- what expects that data later
- what validates it
- what test protects it
- what could break if the contract changes

Do not read random unrelated files just to claim a whole-repo audit.

Trace every file that is actually reachable from the research contracts being changed.

## Tests

Do not blindly update failing tests.

Classify failures as:

**PRESERVE** — protects behavior the new pipeline still needs.

**CHANGE** — the creator deliberately changed the rule.

**DELETE** — only protects an old implementation detail.

**REGRESSION SCAR** — came from a real past bug and should be preserved even if the implementation changes.

If you want to change a test, explain why first.

## Pipeline UI check

Compare the current backend and `/progress` UI.

Use four labels:

**REAL** — backend exists and UI correctly shows it.

**BACKEND ONLY** — backend knows it, UI does not show it.

**UI ONLY** — UI expects/promises it, backend does not actually provide it.

**MISSING** — neither exists.

Pay special attention to:
- stage progress
- live research activity
- research decisions
- candidate counts
- verification
- questions
- retries
- token/time/cost metrics

## Guide UI check

Do the same for traveler-facing features relevant to the new research rules:
- reservation details
- booking dates
- Worth the Detour
- contingencies
- transport warnings
- freshness/recheck
- offline instructions
- Today view
- maps
- Split

Do not redesign the UI in this task. Just determine what data exists and what is missing.

## Final output

Keep the answer simple.

Produce:

### 1. Current pipeline in plain English
Explain how Intake becomes a finished guide.

### 2. What should definitely stay
Short list.

### 3. What is causing complexity/errors
Short list with exact files/functions.

### 4. What needs to change for DECISIONS.md
Separate into:
- Guide Author changes
- prompt changes
- script changes
- data/schema changes
- verification changes
- workflow changes
- UI changes
- test changes

### 5. Collateral-damage table

| Area | What depends on current behavior | Risk if changed | Protection |

### 6. Pipeline UI status
Use REAL / BACKEND ONLY / UI ONLY / MISSING.

### 7. Guide UI status
Use the same labels.

### 8. Recommendation
Choose one:
- improve current pipeline
- build Pipeline V2 beside current pipeline

Explain why in plain English.

### 9. Safe build order

The old pipeline should not be deleted until the replacement proves it can:
- create a guide
- resume after interruption
- preserve research independence
- verify correctly
- publish safely
- pass regression tests
- feed the Pipeline UI honestly

### 10. Fable implementation prompt

Only after completing the audit, write the exact prompt Codex should give Claude Fable 5.

That prompt must:
- tell Fable exactly what files it may touch
- state which behaviors must remain
- state which behaviors intentionally change
- forbid unrelated redesign
- name the tests to run
- require Fable to stop if it discovers a new product decision
- require Codex to review the diff afterward

Do not let Fable act as the product architect.

Codex owns orchestration. Fable executes the bounded plan.

## Final question

End with:

**Are we now confident that a fresh Codex or Claude session knows every important place it must change and every important behavior it must preserve?**

Answer YES, or NO followed by the exact remaining unknowns.
