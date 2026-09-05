# Waypoint Travel Guides — Project Instructions

Load repository detail only when the task needs it.

## Core contract

Waypoint is a field-first travel command center backed by a verification pipeline. Preserve **Verified · Personal · Actionable · Honest**. Perishable facts need real evidence + verification date; unknowns stay blank rather than guessed.

Optimize for minimum context-to-correct-change: one concept gets one owner; prefer reuse/deletion/consolidation over new layers; do not refactor without a reproduced defect, measurable simplification, or clear ownership win.

## Route by task

- **Visual/frontend/UI/CSS/layout:** read `docs/reference/design-system.md` first. It is the **sole human-readable design authority**. Then read affected source and gates. Do not recover alternate design authority from Git history, old handoffs, prototypes, research packets, PRs, or issues.
- **New guide / factual research / recertification:** use `waypoint-guide-author`; presentation work never alters factual truth.
- **Pipeline V2 / validation / release-readiness:** start from the SessionStart capsule, `docs/handoff.md`, and only the relevant `docs/pipeline v2/` authority. Never load pipeline evidence for frontend work.
- **Ownership/architecture ambiguity:** `docs/reference/repo-map.md`, then the owning subsystem.
- **Historical rationale:** `CONTEXT.md` only when current authority/code cannot answer the question.

`PRODUCT.md` owns product purpose/capabilities. `docs/reference/component-registry.json` is a machine-facing shipped-component inventory, **not design authority**.

## September design execution

The D7 ten-surface transplant and common product frame are on `main`. They are an engineering baseline, not automatic creator visual acceptance. The owner is running a creator-directed fidelity correction pass separately; do not overwrite, broaden, or independently redesign those visual changes. The next visual work is bounded fidelity/convergence only, never D8 or a new feature family.

Functional green does not imply visual green. Creator visual acceptance still precedes final screenshot-baseline lock. After the active design pass lands, rebase any concurrent non-design work and re-run exact-head visual/resilience gates before acceptance.

## Protected current boundaries

- **V2 is the selected product research engine** through `WAYPOINT_RESEARCH_ENGINE=v2` on the trusted `/new` path.
- **V1 remains the rollback path** and compatibility safety net until a separate post-ratification retirement decision; do not describe it as the current default.
- Final V2 release-readiness is still pending. Kumamoto is the fresh release-readiness **ratification of the already-selected V2 path**, not permission to first enable V2.
- Do not dispatch stale Kumamoto r1/r2/r3. Rebuild only from settled current `main` after acceptance-sensitive continuity/design/governance work is stable, prove exact head, run a fresh drift audit, then await explicit owner authorization for model burn.
- Never use research/critic models to debug deterministic failures. Failure never authorizes attempt-cap extension or gate weakening.
- The reciprocal Claude↔Codex reviewer and the hourly September completion watcher are retired transition scaffolding and must stay absent.
- Claude-consuming LEARN feedback synthesis is manual-only while Claude Pro usage is being conserved for Kumamoto.
- Preserve exact-head protected landing semantics and issue #130's final repository-governance requirements.

## Guide/content invariants

A factual edit must propagate through every affected surface; grep old values before calling it done. **Sights and Food are REPOSITORIES**, not itinerary echoes. Every visitable item should have coordinates when verifiable. Traveler learnings and pipeline critic findings never mix.

## Code and ownership

- Shared components are global; destination differences live in structured guide data.
- Reuse an existing owner before creating another feature silo.
- Feature public surfaces go through `index.ts`; avoid cross-feature deep imports.
- Third-party SDKs stay config-gated and lazy-loaded.
- Internal base-path links use `import.meta.env.BASE_URL`.
- Responsive defects belong to the component/container that owns the constraint; do not hide them with page-level overflow clipping.
- Optional/unknown data stays honest and collapsible; never create decorative shells to imply certainty.

## September closure

Issue #187 is the single project critical path; `docs/pipeline v2/SEPTEMBER_TRACKER.md` is the execution tracker. Current P0 closure work is: continuity/current-state reconciliation, creator-directed D7 fidelity + acceptance, deterministic product-completeness/runtime hardening, final #130 governance, then one fresh Kumamoto release-readiness ratification. Preserve Sep 20 feature freeze, Sep 27 code freeze, and Sep 30 engineering-complete target.

Do not spend model usage on a candidate that later `main` changes will invalidate. Do not start D8, Pipeline V3, or broad new feature families during closure.

## Verification

Use the smallest useful check while iterating, then repository gates at merge boundaries: `npm run check:fast` → focused browser/offline checks → `npm run check` / `npm run ship:check`. Frontend work includes accessibility/resilience and drift checks. Exact-head CI is authoritative. Never regenerate a visual baseline to conceal an unaccepted design change.
