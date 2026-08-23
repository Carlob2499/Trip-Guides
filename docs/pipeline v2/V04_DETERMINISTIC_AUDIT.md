# V04 deterministic audit — conflicting evidence / future-event safety

Status: **PASS — DETERMINISTIC V04 COMPLETE**  
Date: 2026-08-23

This audit applies the cheapest-proof-first rule from `PIPELINE_VALIDATION_PACK.md` and the pre-registered V04 card in `VALIDATION_RUNBOOK.md`. It did not dispatch research and did not change publication/cutover state.

## Future-event half — PASS

The recurring-event fabrication risk is mechanically enforced by `scripts/pipeline/v2/research-rules.mjs::yearSafetyProblems()` and covered by `scripts/__tests__/pipeline-v2-research-rules.test.mjs`.

The deterministic contract proves:

- an objective claim naming a future year fails when the cited source predates that season and does not explicitly declare `appliesToYears` for it;
- an undated source cannot confirm a future season merely because an event recurs;
- a current official advance announcement may support a future season only when that applicability is explicit;
- event-date claims using `appliesToYears` must come from a source whose origin was actually fetched, not a search preview;
- perishable objective evidence carries a future recheck date and bounded shelf-life window.

This directly protects the V04 immediate-fail case: last year's recurring-event date cannot silently become this year's confirmed date.

## Conflicting-evidence half — PASS

PR #83 found a real deterministic gap: `disagreementProblems()` previously checked only that a recommendation-changing disagreement had prose in `resolution`, while the schema could not prove which evidence records actually conflicted.

PR #84 closed that gap and merged on exact head `8af5d3a049609b715d2fc9851a9baa66273a941d` after **Tests/coverage ✅ · Project invariants ✅ · lint ✅ · typecheck ✅ · Accessibility ✅ · Vercel ✅**.

The strengthened contract now proves:

1. `wp-evidence` is additively versioned at **2.2**.
2. `disagreements[].evidenceIds` names the concrete evidence records whose claims disagree.
3. Historical 2.0/2.1-shaped artifacts remain parseable because the new field defaults to `[]`; accepted historical evidence is not rewritten to manufacture modern proof.
4. A **recommendation-changing** disagreement must cite at least two **distinct** evidence ids.
5. Every cited id must resolve to a real record in the same evidence document.
6. A prose-only investigation/resolution cannot manufacture conflict proof.
7. Existing source-role, freshness, corroboration, and access rules remain the authority for the linked evidence itself; the disagreement rule does not fork those policies.
8. Both agent skill homes require this linkage, preserving instruction parity.

Focused regression coverage in `scripts/__tests__/pipeline-v2-disagreement-evidence.test.mjs` proves the schema bump, historical compatibility, typed ids, duplicate/unknown-id rejection, prose-only failure, and the valid linked case.

## V04 verdict

- **Future-event safety:** PASS deterministically.
- **Conflicting-evidence accountability:** PASS deterministically.
- **Full V04:** **PASS** for the pre-registered risk class by the cheapest sufficient proof.
- **Expensive research run needed for V04:** no. A later live run may incidentally exercise these rules, but it is not required to re-prove the deterministic contract.
- **Production/cutover effect:** none. `WAYPOINT_RESEARCH_ENGINE` remains off/unset; no guide was published by this hardening.
