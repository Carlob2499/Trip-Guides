# Waypoint documentation

This tree contains only documentation that helps Waypoint operate, recover or improve now. Completed plans, superseded handoffs, cleanup ledgers and review transcripts belong in Git history.

## Read by task

Do not preload the documentation tree.

- **Current state / next work:** `handoff.md`.
- **Code ownership / boundaries:** `reference/repo-map.md`, then the affected subsystem reference.
- **Pipeline V2 / validation / cutover:** start with `handoff.md`, then read only the relevant file in `pipeline v2/`.
- **Design/UI:** route through `waypoint-design`; load only the relevant design authority. Full `/design` work may use the broader handoff/prototypes.
- **Historical rationale:** `../CONTEXT.md` only when current code/docs do not explain the decision.
- **Product doctrine:** `../PRODUCT.md`.

## Ownership

| Path | Owns |
| --- | --- |
| `handoff.md` | Compact current operational state and next work |
| `reference/` | How Waypoint works now |
| `standards/` | Durable quality bars/templates |
| `evidence/` | Durable product/research evidence |
| `generated/` | Script-generated reports; do not hand-edit |
| `design-handoff/` | Atlas visual authority, references and machine gates |
| `pipeline v2/` | Locked V2 decisions, implementation/proof state, validation and schedule |
| `mockups/` | Supporting fixtures/prototypes; not authority unless a current doc says otherwise |

## Rules

- Current truth wins; update or remove documentation for behavior that no longer exists.
- One concept gets one authority. Link to the owner instead of mirroring it.
- Do not create another status file when an existing authority owns the state.
- Machine enforcement is preferred to permanent prose when it can encode the same invariant.
- Completed plans and review transcripts belong in Git history, not the active read path.
- Unknown stays unknown; never fill evidence/status gaps for presentation.
- Root convention files keep conventional names; ordinary docs use lowercase kebab-case.
