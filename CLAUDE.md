# Waypoint Travel Guides — Project Instructions

Stacks on the global `~/.claude/CLAUDE.md`. Load repository detail only when the task needs it.

## Core contract

Waypoint is a field-first travel command center backed by a verification pipeline. Preserve **Verified · Personal · Actionable · Honest**. Perishable facts need real evidence + verification date; unknowns stay blank rather than guessed.

Optimize for minimum context-to-correct-change: one concept gets one owner; prefer reuse/deletion/consolidation over new layers; do not refactor without a reproduced defect, measurable simplification, or clear ownership win.

## Route by task

- **Visual/frontend/UI/CSS/layout:** read `docs/reference/design-system.md` first. It is the **sole human-readable design authority**. Then read `waypoint-design`, affected source, and affected gates. Do not look for alternate design authority in Git history, old handoffs, prototypes, screenshots, research packets, PRs, or issues.
- **New guide / factual research / recertification:** use `waypoint-guide-author`; presentation work never alters factual truth.
- **Pipeline V2 / validation / cutover:** start from the SessionStart capsule, `docs/handoff.md`, and only the relevant `docs/pipeline v2/` authority. Never load pipeline evidence for frontend work.
- **Ownership/architecture ambiguity:** `docs/reference/repo-map.md`, then the owning subsystem.
- **Historical rationale:** `CONTEXT.md` only when current authority/code cannot answer the question.

`PRODUCT.md` owns product purpose/capabilities. `docs/reference/component-registry.json` is a machine-facing shipped-component inventory, **not design authority**.

## September design execution

PR #186 is an engineering foundation, not creator-accepted visual completion. Preserve its working architecture unless a real defect requires change. The next visual pass is fidelity/convergence, not another redesign or feature round.

Before a broad visual sweep, follow the two-surface canary in `docs/reference/design-system.md`: South Korea active Trip mobile + Itinerary desktop workbench. Functional green does not imply visual green. Creator visual acceptance precedes final screenshot-baseline regeneration.

## Protected current boundaries

- V1 remains production default/rollback until explicit V2 cutover acceptance.
- Do not dispatch stale Kumamoto r1/r2/r3; rebuild the final acceptance candidate from settled `main` only after acceptance-sensitive work is stable.
- Never use research/critic models to debug deterministic failures.
- Preserve reciprocal Claude↔Codex reviewer trust boundaries and exact-head protected landing semantics.
- Failure never authorizes attempt-cap extension or gate weakening.

## Guide/content invariants

A factual edit must propagate through every affected surface; grep old values before calling it done. Sights and Food are repositories, not itinerary echoes. Every visitable item should have coordinates when verifiable. Traveler learnings and pipeline critic findings never mix.

## Code and ownership

- Shared components are global; destination differences live in structured guide data.
- Reuse an existing owner before creating another feature silo.
- Feature public surfaces go through `index.ts`; avoid cross-feature deep imports.
- Third-party SDKs stay config-gated and lazy-loaded.
- Internal base-path links use `import.meta.env.BASE_URL`.
- Responsive defects belong to the component/container that owns the constraint; do not hide them with page-level overflow clipping.
- Optional/unknown data stays honest and collapsible; never create decorative shells to imply certainty.

## Decisions and execution

Ask only for genuine user/product forks, never for facts the repository can answer or routine choices with one sane default. For current design, only questions explicitly listed open in `docs/reference/design-system.md` are creator forks unless new evidence demonstrates a real conflict.

For September, issue #187 is the single project critical path; `docs/pipeline v2/SEPTEMBER_TRACKER.md` remains the Pipeline V2 execution tracker. Do not spend model usage on a candidate that later `main` changes will invalidate.

## Verification

Use the smallest useful check while iterating, then repository gates at merge boundaries: `npm run check:fast` → focused browser/offline checks → `npm run check` / `npm run ship:check`. Frontend work includes accessibility/resilience and drift checks. Exact-head CI is authoritative. Never regenerate a visual baseline to conceal an unaccepted design change.
