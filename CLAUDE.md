# Waypoint Travel Guides — Project Instructions

Stacks on the global `~/.claude/CLAUDE.md`. Load repository detail only when the task needs it.

---

## Core contract

Waypoint is a field-first travel command center backed by a verification pipeline. Preserve four product properties: **Verified, Personal, Actionable, Honest**. Perishable facts need primary-source evidence + verification date; unknowns stay blank rather than guessed.

Optimize for **minimum context-to-correct-change**:
- read the smallest authoritative surface that can answer the task;
- prefer deleting/reusing/consolidating over adding files, abstractions, workflows, or prose;
- one concept gets one owner; link to it instead of mirroring it;
- prefer machine-enforced invariants over permanent reminders;
- do not refactor without a reproduced defect, measurable simplification, or clear ownership win;
- keep changes small enough that another agent can review them without reconstructing the whole repo.

## Route by task

- **New guide / factual research / recertification:** use `waypoint-guide-author`. New-guide and headless research keep the full frozen research stack; narrow factual edits load only affected guide/state + verification/continuity context.
- **Astro / CSS / UI / layout:** use `waypoint-design` plus affected source files. Presentation work must not alter factual content. Load only the relevant design authority; full `/design` work may load the broader handoff/prototypes.
- **Pipeline V2 / validation / cutover:** SessionStart already injects the bounded `scripts/handoff-head.mjs` capsule. Use that first; open full `docs/handoff.md` only for deeper current evidence, then only the relevant `docs/pipeline v2/` authority. Do not load pipeline evidence for unrelated frontend work.
- **Ownership/architecture ambiguity:** read `docs/reference/repo-map.md` and then the specific subsystem reference.
- **Historical rationale:** use `CONTEXT.md` only when current code/docs do not explain the decision.

`README.md` is orientation, `PRODUCT.md` is product doctrine, and the SessionStart capsule is the compact current-state summary. Full `docs/handoff.md` is on-demand evidence, not a mandatory read.

## Protected current boundaries

- V1 remains the production default/rollback until an explicit V2 cutover decision.
- The pre-registered V01/V02/V03/V05 research candidate is compatibility-frozen. Do not change Guide Author research doctrine, V2 stage prompts/workflow, validation criteria, selector/publication authority, or the frozen candidate unless new defect evidence explicitly requires it.
- Uruguay Canary #4 remains draft evidence, not production content.
- Preserve the reciprocal Claude↔Codex reviewer trust boundary: unprivileged signal → read-only validation/agent execution → separate write-capable publish step that never executes PR-controlled code.

## Guide/content invariants

A factual edit must propagate through every affected surface; grep for old values/phrasing before calling it done. If the edit creates a genuine product fork the creator has not decided, surface that fork; do not guess.

**Sights and Food are REPOSITORIES**, not itinerary echoes. Breadth comes from research, never padding. Every visitable item should have coordinates when verifiable.

Traveler learnings and process evidence stay separate: raw traveler critiques are not rendered verbatim, and **pipeline critic findings** belong in process evidence, never traveler learnings.

## Code and ownership rules

- Shared components are global; country differences live in structured guide data.
- Reuse an existing owner before creating another. A new self-contained feature gets `src/features/<name>/` only when it has a real independent model/gateway/UI boundary; small client behavior stays in `src/scripts/`.
- Feature public surfaces go through `index.ts`; avoid cross-feature deep imports.
- Third-party SDKs stay config-gated and lazy-loaded.
- Internal base-path links use `import.meta.env.BASE_URL`.
- Variable content must not dictate page width; responsive fixes belong to the component/container that owns the constraint.
- Do not hide layout defects with page-level overflow clipping when the child owner can be corrected.
- Keep optional/unknown data honest and collapsible; do not create empty decorative shells to imply certainty.

## Decisions and execution

Ask only for genuine user/product forks. Do not ask for facts the repository can answer, routine engineering choices with one sane default, or confirmation to continue an already-authorized plan. Headless workflows use their existing issue/gate mechanisms instead of blocking on chat.

Research an unfamiliar failure class before changing architecture. Prefer a narrow reproducer or failing test first, then fix the owner, then simplify/delete the workaround that proof makes obsolete.

### Authority precedence and autonomous release loop

When repository surfaces disagree, **current `main` authority wins**: executable contracts/tests and current authority docs outrank PR bodies, issue prose, closed branches, historical canary artifacts, and old handoff text. Historical surfaces are evidence, not current instructions, unless a current authority explicitly points to them.

For September release work, use `docs/pipeline v2/SEPTEMBER_TRACKER.md` as the delivery queue. After each safe task, re-read current repository state and continue with the next unblocked deterministic milestone. Do not stop merely because a PR merged, no PR is open, or a historical canary is green. Stop only for a genuine owner/product fork, a future-dated gate, a provider/model availability boundary, or an explicitly preserved acceptance boundary.

Before spending a scarce model-backed acceptance attempt, enforce a **model-burn firewall**: freeze the exact candidate SHA; run all applicable deterministic, schema, provenance, retry/cap, build, accessibility, security, and exact-head CI checks; audit relevant control-plane drift since the candidate base; and confirm there is no known deterministic blocker. If deterministic evidence can answer the question, do not use a research/critic model to debug it.

Allocate agent effort by task, not brand: deterministic tooling first; low/medium effort for mechanical bounded fixes and documentation truth; normal/high effort for implementation and difficult failure analysis; strongest/highest-cost models only for irreducible architecture/security review or pre-registered model/content acceptance. A failed model run is evidence, not permission to extend caps or rerun until green.

## Verification

Use the smallest useful check during iteration, then the repository gates before merge:

`npm run check:fast` → relevant focused/browser/offline checks → `npm run check` or `npm run ship:check` when the change reaches that boundary.

For visual/frontend work, include the existing accessibility/resilience gate and design drift checker where applicable. CI on the exact PR head is authoritative. Never weaken a gate merely to make a branch green.

When a fix proves a contract, cash the proof back into simplicity: remove superseded overrides, duplicate docs/workflows, stale compatibility code, or debugging commentary when safe.
