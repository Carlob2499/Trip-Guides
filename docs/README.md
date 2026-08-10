# docs/ — sorted by how long a document lives

Filenames are lowercase kebab-case. The folder tells you what you're allowed to do with the
file before you open it, which is the question that actually matters when you land here cold.

| Folder | What's in it | Can I edit it? |
| --- | --- | --- |
| `handoff.md` *(no folder)* | Where the last session stopped. Auto-loads at session start beside `CONTEXT.md`. | **Rewritten every session** — that's the ritual. ≤120 lines, gated. |
| `reference/` | How the system works **today**: architecture, the research pipeline, motion doctrine, the revise-guide and visual-redesign specs, issue-tracker conventions. | Yes — and you must, when behaviour changes. A stale reference doc is worse than none. |
| `standards/` | The bar work is held to: the guide rubric, the new-guide intake template. | Rarely, and deliberately. Changing a standard changes every future guide. |
| `evidence/` | What we learned, accumulated over time: traveller patterns, pipeline patterns, the competitive landscape. | Append, don't rewrite. These are records, and the two `*-patterns` files must never mix — one asserts lived experience, the other is process evidence from before anyone travelled. |
| `generated/` | Written by scripts: what the tests protect, where they're blind, telemetry roll-ups. | **No.** Hand-edits are overwritten on the next run, and CI fails if these go stale. |
| `archive/` | Finished plans and superseded snapshots. | No. History, kept honest — it may cite paths that no longer resolve, which is why the integrity gate skips it. |
| `design-handoff/` | Design-tool exports: the Atlas system (`DESIGN.md` R4), machine-checkable gates in `enforcement/`, prototype bundles. | Only `DESIGN.md` and this bundle's own README. The rest is vendored output. |

**Naming rules.** Lowercase kebab-case, no underscores, no `SCREAMING_CASE` — that convention
belongs to the repo root (`README`, `CLAUDE`, `CHANGELOG`, `SECURITY`), where tooling looks for
those exact names. A `plan-` prefix would mean *not built yet*; nothing carries one right now,
because every plan in this repo has either shipped or been archived.
