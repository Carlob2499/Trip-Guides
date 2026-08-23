# Waypoint documentation

This directory contains only documentation that helps Waypoint operate, recover, or improve now. Completed plans, superseded handoffs, cleanup ledgers, and review transcripts belong in Git history rather than competing with current instructions.

## Start here

For a fresh engineering session, read in this order:

1. `../README.md` — what Waypoint is and where things live.
2. `../PRODUCT.md` — product doctrine and non-negotiables.
3. `handoff.md` — current operational state and the next engineering surface.
4. `reference/repo-map.md` — code ownership and subsystem boundaries.
5. The relevant document under `reference/` for the subsystem being changed.

If the work touches Pipeline V2, also read:

- `pipeline v2/DECISIONS.md` — locked product/architecture decisions.
- `pipeline v2/IMPLEMENTATION_STATE.md` — current durable implementation/proof state.
- `pipeline v2/PIPELINE_VALIDATION_PACK.md` — validation scenarios that still need evidence.
- `pipeline v2/SEPTEMBER_TRACKER.md` — delivery/cutover status and deadlines.

## What each documentation area owns

| Path | Owns | Rule |
| --- | --- | --- |
| `handoff.md` | Current operational state and next work | Keep compact and current. No session diary. |
| `reference/` | How Waypoint works today | Update when behavior or architecture changes. |
| `standards/` | Durable quality bars and templates | Change deliberately because future work inherits them. |
| `evidence/` | Durable product/research evidence | Preserve facts and provenance; do not mix traveler evidence with pipeline-process evidence. |
| `generated/` | Script-generated reports | Do not hand-edit. Regenerate with the owning script. |
| `design-handoff/` | Future Atlas design authority and machine-checkable design gates | Preserve until the redesign is implemented and formally retired. |
| `pipeline v2/` | Locked V2 decisions, current implementation/proof state, validation pack, and delivery tracker | Do not add another parallel status document. |
| `mockups/` | Supporting implementation fixtures/prototypes that are still referenced by active design work | Not architectural authority unless another current doc explicitly says so. |

## Documentation rules

- **Current truth wins.** If a document describes behavior that no longer exists, update or remove it.
- **Do not create a new status file when an existing authority owns that information.** Update the owner instead.
- **Do not keep completed plans in the live tree for nostalgia.** Git history already preserves them.
- **Do not make tests depend on historical prose.** Tests should protect current behavior and current authority.
- **Do not duplicate architecture across multiple docs.** Link to the owner.
- **Unknown stays unknown.** Never fill an evidence/status gap merely to make a dashboard look complete.

## Naming

Use lowercase kebab-case for ordinary files under `docs/`. Root convention files such as `README.md`, `PRODUCT.md`, `AGENTS.md`, `CLAUDE.md`, and `SECURITY.md` keep their conventional names because tooling and humans expect them there.
