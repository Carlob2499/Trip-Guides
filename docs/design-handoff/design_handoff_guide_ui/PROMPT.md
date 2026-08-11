# The prompt — paste this into Claude Code as your first message

Copy everything between the rules, verbatim.

---

You are implementing a completed design revision into this repository. The full specification is
in `design_handoff_guide_ui/` at the repo root.

**Read `design_handoff_guide_ui/00-START-HERE.md` first, completely, before writing any code.**
It gives the reading order, the precedence rules, and the glossary. Then read
`SUPERSEDES.md` — the repo contains an earlier design revision (R4) and parts of it are now
wrong; that file names exactly which parts, and those amendments ship in the same PR.

Ground rules, all non-negotiable:

1. **Read before you write.** If you are about to write a colour, a spacing value, a component
   layout, an icon or a constant that you cannot point to in a file in this bundle or in the
   repo, stop and go read. Your memory of what this product looks like ranks below every
   document in the bundle.
2. **Stack:** Astro + plain CSS in `src/styles/` + vanilla JS in `src/scripts/` + self-contained
   features in `src/features/<name>/` behind a single `index.ts`. No React, no Vue, no Tailwind,
   no new npm dependency. The prototypes render in a React-flavoured design runtime; that is an
   artefact of the design tool, not a requirement.
3. **Zero content edits.** Nothing under `src/content/guides/` changes, and neither does
   `src/content.config.ts`. If a design appears to need a new field, stop and raise it.
4. **Derive, do not restate.** Any count, total or width that appears in copy must be computed at
   runtime or must not appear. `TESTS.md` §5 exists because hand-maintained figures drifted and
   contradicted the screen they sat on.
5. **Build the absent states.** They are specified in `FALLBACKS.md` §1 and are not optional
   polish — they are the first state a new guide is in, and they are what the product's claim
   rests on.
6. **Do not re-derive anything marked DO-NOT-DERIVE** in `BEHAVIOR.md` §1. Those constants have
   model tests behind them and each exists because of a real bug.

Work in this order — `BUILD_ORDER.md` has the detail, and steps 1–3 are independently shippable:

1. Tokens and the container-query scaffold
2. The spine rail, the pill row and the day scrubber
3. The day station: day card, the line, folds, gap blocks, checks
4. Tools as the last station, with Trip Split's empty state and the add-expense form
5. Field log as a station, drawn only when the guide has a `learnings` record
6. The absent states, then the gates, then the axe run, then fix what they find

Before opening the PR, every box in `ACCEPTANCE.md` must be ticked and demonstrable, and every
new test in `TESTS.md` must exist and pass. Amend `docs/design-handoff/DESIGN.md` in the same PR.

When something in the bundle is ambiguous, contradictory, or appears to require one of the scope
guards in `FALLBACKS.md` §4 — **stop and ask me** rather than choosing. A wrong guess here is
more expensive than a question.

---
