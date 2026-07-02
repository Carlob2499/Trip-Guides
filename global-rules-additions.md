# Additions to ~/.claude/CLAUDE.md — accuracy rules 11–13

> **How to apply:** paste the three rules below at the end of your existing
> "Accuracy & anti-hallucination standards" section, after rule 10. Your
> current rules 1–10 stay exactly as written — nothing is rephrased,
> reordered, or renumbered. These fill the three gaps your draft-review
> surfaced that rules 1–10 don't already cover.
>
> **Bonus:** adding exactly three lands the section at **13 rules**, which
> retroactively makes the `(global rules 1–13)` cross-reference in your
> project `CLAUDE.md` correct. (Fix it there anyway if you'd rather it read
> `1–13` deliberately than by coincidence — see the note at the bottom.)

---

### 11. External interfaces — verify against current docs, never memory

When writing or reviewing code, treat every external interface — API field
names, function signatures, endpoint shapes, library versions, CLI flags,
config keys — as unverified until checked against its current documentation. A
remembered interface is a hypothesis, not a fact, and it is the most common
source of code that looks correct, reads as internally consistent, and fails in
reality. Look it up fresh even when you are confident. *(This generalizes the
`⚠ VERIFY input names — do not trust from memory` rule already in the repo's
`research-guide.yml` CI template.)*

### 12. Read before you edit — never regenerate from memory

When the real file, dataset, or record is available, read it and change only
what needs changing. Never reconstruct an existing artifact from memory and
present it as the current version — recalled content silently drops or alters
details the original contained. Read the actual state first; edit in place.

### 13. Verify the output, not just the intent

"It should work" is not "I checked that it works." Whenever the result can be
checked — a build that must pass, a test suite, a recomputation, a re-read
against the source — run the check before declaring the work done. Verifying
your reasoning validates the plan; only running it validates the result.

---

## Optional one-line strengthening of your existing rule 4

Your rule 4 already names the failure ("disguised invention"). If you want the
*inventing-to-fill* variant called out as explicitly as the *hedged-guess*
variant, append one sentence to rule 4:

> Likewise, never fabricate a specific to look complete — a citation, quote,
> statistic, or identifier (a name, number, address, or filename). If a real
> one can't be found, omit it and say so; an invented specific is the same
> error wearing different clothes.

*(Left as optional, not a 14th rule — it's the same principle as rule 4, just a
different disguise. Your call whether it earns its own sentence.)*

---

## Changelog — what this merge did

- **Kept, untouched:** your rules 1–10, verbatim. They already cover draft
  tenets on training-data-as-starting-point (1), plausible-but-wrong (2),
  source hierarchy (3), `≈` semantics (4), compound claims (5), omission (6),
  internal consistency (7), recency (8), prominent uncertainty (9), and
  confirmation bias (10).
- **Added:** rules 11–13 — the three gaps (interface-from-docs, read-before-edit,
  verify-the-output) that 1–10 didn't cover.
- **Not merged in (deliberately):** the T0/T1/T2 source-tier ladder, the
  verification ledger, and the adversarial-disprove tactic live in
  `research-protocol.md` instead — they're *method*, not *standard*, and your
  rules 3 and 10 already state the principles they operationalize. Keeping them
  in the protocol file avoids bloating the global standard.
- **Not merged in (deliberately):** the "four properties" and "autogeneration
  test" stay in your project `CLAUDE.md` — they're the definition of a finished
  *guide*, which is travel-specific. Promote a generalized version to the
  global file only if you want every project judged by them.

## Separate repo fix (not a global-file change)

In the project `CLAUDE.md`, the Order-of-Operations step 3 reads
"Verify every fact against a primary source (global rules 1–13)." Before this
merge that was wrong (the global file had 10). After adding rules 11–13 it is
correct — but if you want it correct by intent rather than coincidence, that's
the one line to confirm when you next touch the repo.
