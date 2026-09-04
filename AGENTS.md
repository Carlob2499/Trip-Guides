# Waypoint Travel Guides — Project Instructions

Stacks on the global `~/.Codex/AGENTS.md`. Load repository detail only when the task needs it.

---

## D6 frontend implementation freeze — September 2026

Before any visual/frontend edit, read `docs/design-handoff/final-2026-09-03/FABLE5_IMPLEMENTATION_PROMPT.md` and follow its authority order; D6 decisions are frozen for implementation.

Mockups are never feature truth. Open visual references only through `docs/design-handoff/final-2026-09-03/MOCKUP_MANIFEST.json`. Historical handoffs, prototypes, screenshots and unlisted mockups never override `PRODUCT.md`, `docs/reference/design-system.md`, the token system, or the final D6 handoff.

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

- **New guide / factual research / recertification:** `waypoint-guide-author`. Narrow factual edits load only the affected guide/state + verification context.
- **Astro / CSS / UI / layout:** `waypoint-design` + affected source. Facts never change. `docs/reference/design-system.md` is authority; motion/registry subordinate; handoffs/prototypes are history except the frozen 2026-09-03 package above, itself subordinate to those authorities.
- **Pipeline V2 / validation / cutover:** start from the SessionStart `scripts/handoff-head.mjs` capsule; open `docs/handoff.md` and the relevant `docs/pipeline v2/` authority only for deeper evidence. Never load pipeline evidence for frontend work.
- **Ownership/architecture ambiguity:** `docs/reference/repo-map.md`, then the subsystem reference.
- **Historical rationale:** `CONTEXT.md` only when current code/docs do not explain the decision.

`README.md` is orientation, `PRODUCT.md` is product doctrine; full `docs/handoff.md` is on-demand evidence.

## Protected current boundaries

- V1 remains the production default/rollback until an explicit V2 cutover decision.
- The pre-registered V01/V02/V03/V05 research candidate is compatibility-frozen. Do not change Guide Author research doctrine, V2 stage prompts/workflow, validation criteria, selector/publication authority, or the frozen candidate unless new defect evidence explicitly requires it.
- Uruguay Canary #4 remains draft evidence, not production content.
- Preserve the reciprocal Claude↔Codex reviewer trust boundary: unprivileged signal → read-only validation → separate write-capable publish step that never executes PR-controlled code.

## Guide/content invariants

A factual edit must propagate through every affected surface; grep for old values before calling it done. Surface a genuine undecided product fork; do not guess.

**Sights and Food are REPOSITORIES**, not itinerary echoes. Breadth comes from research, never padding. Every visitable item should have coordinates when verifiable.

Traveler learnings and process evidence stay separate: raw traveler critiques are not rendered verbatim, and **pipeline critic findings** belong in process evidence, never traveler learnings.

## Code and ownership rules

- Shared components are global; country differences live in structured guide data.
- Reuse an existing owner before creating another. `src/features/<name>/` only for a real independent model/gateway/UI boundary; small client behavior stays in `src/scripts/`.
- Feature public surfaces go through `index.ts`; avoid cross-feature deep imports.
- Third-party SDKs stay config-gated and lazy-loaded.
- Internal base-path links use `import.meta.env.BASE_URL`.
- Variable content must not dictate page width; responsive fixes belong to the component/container that owns the constraint.
- Do not hide layout defects with page-level overflow clipping when the child owner can be corrected.
- Keep optional/unknown data honest and collapsible; do not create empty decorative shells to imply certainty.

## Decisions and execution

Ask only for genuine user/product forks, never for facts the repository can answer, routine choices with one sane default, or permission to continue an authorized plan. Headless workflows use their issue/gate mechanisms instead of chat.

Research an unfamiliar failure class before changing architecture: narrow reproducer or failing test first, fix the owner, then delete the workaround the proof makes obsolete.

### Release execution

Current `main` contracts/tests and authority docs outrank PRs, issues, closed branches, and history. History is evidence unless authority cites it.

For September, `docs/pipeline v2/SEPTEMBER_TRACKER.md` is the queue: re-audit after each safe task and continue the next unblocked deterministic milestone; stop only at a real owner, future, provider/model, or acceptance boundary.

Before model acceptance: freeze the exact SHA; make deterministic/schema/provenance/retry-cap/build/a11y/security/exact-head CI green; audit control-plane drift; confirm no deterministic blocker. Never use research/critic models to debug deterministic failure.

Effort follows task: tooling first; low/medium for mechanical/docs; normal/high for implementation/debug; strongest only for irreducible architecture/security or pre-registered acceptance. Failure never authorizes cap extension or green-chasing.

## Verification

Smallest useful check while iterating, then the repository gates before merge: `npm run check:fast` → focused/browser/offline checks → `npm run check` / `npm run ship:check` at that boundary. Frontend work includes the a11y/resilience gate and drift checker. CI on the exact PR head is authoritative. Never weaken a gate to make a branch green.

When a fix proves a contract, cash the proof into simplicity: remove superseded overrides, duplicate docs/workflows, stale compatibility code, debugging commentary.
