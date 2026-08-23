# V04 deterministic audit — conflicting evidence / future-event safety

Status: **PARTIAL PASS / DETERMINISTIC GAP IDENTIFIED**  
Date: 2026-08-23

This audit applies the cheapest-proof-first rule from `PIPELINE_VALIDATION_PACK.md` and the pre-registered V04 card in `VALIDATION_RUNBOOK.md`. It does not dispatch research and does not change publication/cutover state.

## Future-event half — PASS

The recurring-event fabrication risk is already mechanically enforced by `scripts/pipeline/v2/research-rules.mjs::yearSafetyProblems()` and covered by `scripts/__tests__/pipeline-v2-research-rules.test.mjs`.

The current deterministic contract proves:

- an objective claim naming a future year fails when the cited source predates that season and does not explicitly declare `appliesToYears` for it;
- an undated source cannot confirm a future season merely because an event recurs;
- a current official advance announcement may support a future season only when that applicability is explicit;
- event-date claims using `appliesToYears` must come from a source whose origin was actually fetched, not a search preview;
- perishable objective evidence carries a future recheck date and bounded shelf-life window.

This directly protects the V04 immediate-fail case: last year's recurring-event date cannot silently become this year's confirmed date.

## Conflicting-evidence half — deterministic gap

The building blocks exist:

- objective facts and experiential claims have different allowed source roles;
- shipped experiential claims require two independent firsthand source families;
- recommendation-changing disagreements cannot finish with a blank `resolution`.

But `disagreementProblems()` currently checks only:

> recommendation-changing disagreement + blank resolution → fail

The disagreement schema contains `id`, `topic`, `impact`, `investigation`, and `resolution`, but no evidence-record linkage. Therefore a syntactically valid disagreement can say it was investigated/resolved without machine-verifiable proof of **which** evidence records disagreed.

That is weaker than the V04 pre-registered contract, which requires the official fact and practical/experiential evidence to remain distinct, independently sourced lanes whose conflict survives into reconciliation.

## Required hardening before V04 can earn a deterministic PASS

Add evidence linkage to recommendation-changing disagreements and enforce it without breaking historical evidence:

1. extend the disagreement contract with typed evidence identifiers (backward-compatible at parse time);
2. require a recommendation-changing disagreement to cite enough existing evidence records to substantiate the conflict;
3. reject unknown evidence ids;
4. prove the linked records are not merely duplicate copies of one source family when independence matters;
5. keep source-role enforcement delegated to the existing objective/experiential rules rather than duplicating those rules;
6. add regression fixtures showing that a prose-only `resolution` cannot manufacture a disagreement proof;
7. migrate current accepted evidence records only where necessary and preserve historical RED canary evidence as history rather than rewriting it into a fake PASS.

## V04 verdict

- **Future-event safety:** PASS deterministically.
- **Conflicting-evidence accountability:** YELLOW; schema/rule linkage gap identified.
- **Full V04:** not yet PASS.
- **Expensive research run needed now:** no. Fix the deterministic evidence-link gap first, then use targeted/live evidence only if it can prove something the strengthened fixture cannot.
