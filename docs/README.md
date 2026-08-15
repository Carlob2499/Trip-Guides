# docs/ — sorted by how long a document lives

Filenames are lowercase kebab-case. The folder tells you what you're allowed to do with the
file before you open it, which is the question that actually matters when you land here cold.

| Folder | What's in it | Can I edit it? |
| --- | --- | --- |
| `handoff.md` *(no folder)* | Where the last session stopped. Auto-loads at session start beside `CONTEXT.md`. | **Rewritten every session** — that's the ritual. ≤120 lines, gated. |
| `reference/` | How the system works **today**: architecture, the two pipeline lifecycles (research and change), motion doctrine, the visual-redesign spec, issue-tracker conventions. | Yes — and you must, when behaviour changes. A stale reference doc is worse than none. |
| `standards/` | The bar work is held to: the guide rubric, the new-guide intake template. | Rarely, and deliberately. Changing a standard changes every future guide. |
| `evidence/` | What we learned, accumulated over time: traveller patterns, pipeline patterns, the competitive landscape. | Append, don't rewrite. These are records, and the two `*-patterns` files must never mix — one asserts lived experience, the other is process evidence from before anyone travelled. |
| `generated/` | Written by scripts: `where-the-tests-are-blind.md`, the mutation run's roll-up. | **No.** Hand-edits are overwritten on the next run, and CI fails if these go stale. |
| `archive/` | `INDEX.md` — one entry per finished plan or superseded snapshot, saying how it ended and printing the `git show` line for its body. Bodies live in git; the only files still kept whole are `HANDOFF_ARCHIVE.md` and `visual-redesign-history.md`. | No. History, kept honest — it may cite paths that no longer resolve, which is why the integrity gate skips it. |
| `design-handoff/` | Design-tool exports: the Atlas system (`DESIGN.md` — R4 with the R5 guide-UI revision folded in, the single written design authority), machine-checkable gates in `enforcement/`, prototype bundles. | Only `DESIGN.md` and this bundle's own README. The rest is vendored output. |

**Naming rules.** Lowercase kebab-case, no underscores, no `SCREAMING_CASE` — that convention
belongs to the repo root (`README`, `CLAUDE`, `SECURITY`), where tooling looks for
those exact names. No live document takes an exception any more — the last one,
`PLAN_EVIDENCE_FIRST.md`, retired on 2026-08-15. `SCREAMING_CASE` survives only as the
heading of an `archive/INDEX.md` entry, which is the name ~35 code comments cite it by.
