# Waypoint documentation

This tree contains only documentation that helps Waypoint operate, recover or improve now. Completed plans, superseded handoffs, old design packets, cleanup ledgers and review transcripts belong in Git history.

## Read by task

Do not preload the documentation tree. Agent SessionStart already injects the bounded current-state capsule from `scripts/handoff-head.mjs`.

- **Current state / next work:** use the SessionStart capsule; open full `handoff.md` only when deeper current evidence is needed.
- **Code ownership / boundaries:** `reference/repo-map.md`, then the affected subsystem reference.
- **Pipeline V2 / validation / release-readiness ratification:** start from the SessionStart capsule, then read only the relevant file in `pipeline v2/`.
- **Design/UI:** route through the current design authority; `reference/design-system.md` is the **sole human-readable design authority**. `reference/component-registry.json` is machine-facing implementation inventory, not a second authority. `mockups/` contains subordinate visual-reference/compare evidence only; it does not override the design authority or creator judgment.
- **Historical rationale:** `../CONTEXT.md` only when current code/docs do not explain a non-design decision. Historical design rationale stays in Git history and must not override the current design authority.
- **Product doctrine:** `../PRODUCT.md`.

## Ownership

| Path | Owns |
| --- | --- |
| `handoff.md` | Full current operational evidence; its bounded capsule is the default warm start |
| `reference/` | How Waypoint works now, including the one human-readable design authority |
| `mockups/` | Subordinate visual-reference and compare-sheet evidence bound by the design authority |
| `standards/` | Durable quality bars/templates |
| `evidence/` | Durable product/research evidence |
| `generated/` | Script-generated reports; do not hand-edit |
| `pipeline v2/` | Locked V2 decisions, implementation/proof state, validation and September execution status |

There is intentionally **no live competing design-handoff or alternate design-authority tree**. Prior visual iterations and superseded design doctrine stay in Git history. The live `mockups/` directory is evidence, not authority.

## Rules

- Current truth wins; update or remove documentation for behavior that no longer exists.
- One concept gets one authority. Link to the owner instead of mirroring it.
- Do not create another status or design file when an existing authority owns the subject.
- Machine enforcement is preferred to permanent prose when it can encode the same invariant.
- Completed plans and review transcripts belong in Git history, not the active read path.
- Historical evidence may preserve the state that was true when a run happened; current authority must clearly supersede it rather than rewriting history.
- Unknown stays unknown; never fill evidence/status gaps for presentation.
- Root convention files keep conventional names; ordinary docs use lowercase kebab-case.
