# Waypoint documentation

This tree contains only documentation that helps Waypoint operate, recover or improve now. Completed plans, superseded handoffs, old design packets/mockups, cleanup ledgers and review transcripts belong in Git history.

## Read by task

Do not preload the documentation tree. Agent SessionStart already injects the bounded current-state capsule from `scripts/handoff-head.mjs`.

- **Current state / next work:** use the SessionStart capsule; open full `handoff.md` only when deeper current evidence is needed.
- **Code ownership / boundaries:** `reference/repo-map.md`, then the affected subsystem reference.
- **Pipeline V2 / validation / cutover:** start from the SessionStart capsule, then read only the relevant file in `pipeline v2/`.
- **Design/UI:** route through `waypoint-design`; `reference/design-system.md` is the **sole human-readable design authority**. `reference/component-registry.json` is machine-facing implementation inventory, not a second authority.
- **Historical rationale:** `../CONTEXT.md` only when current code/docs do not explain a non-design decision. Historical design rationale stays in Git history and must not override the current design authority.
- **Product doctrine:** `../PRODUCT.md`.

## Ownership

| Path | Owns |
| --- | --- |
| `handoff.md` | Full current operational evidence; its bounded capsule is the default warm start |
| `reference/` | How Waypoint works now, including the one design authority |
| `standards/` | Durable quality bars/templates |
| `evidence/` | Durable product/research evidence |
| `generated/` | Script-generated reports; do not hand-edit |
| `pipeline v2/` | Locked V2 decisions, implementation/proof state, validation and schedule |

There is intentionally **no live design-handoff or mockups directory**. Git history is the archive for prior visual iterations.

## Rules

- Current truth wins; update or remove documentation for behavior that no longer exists.
- One concept gets one authority. Link to the owner instead of mirroring it.
- Do not create another status or design file when an existing authority owns the subject.
- Machine enforcement is preferred to permanent prose when it can encode the same invariant.
- Completed plans and review transcripts belong in Git history, not the active read path.
- Unknown stays unknown; never fill evidence/status gaps for presentation.
- Root convention files keep conventional names; ordinary docs use lowercase kebab-case.
