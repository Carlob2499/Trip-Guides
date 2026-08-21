// THE authoritative active-generation resolver (hardening pass, 2026-08-20).
//
// Progress, questions, events and answers routing all have to answer the same question — which
// pipeline generation currently OWNS this slug's research — and each used to answer it with its
// own precedence rule, so a stale research-v2/<slug> branch could win somewhere just by
// existing. This module is the ONE semantic, imported by both worlds (scripts/pipeline.mjs's
// answers routing and src/features/pipeline-progress's gateway — plain .mjs so Node and Vite
// both consume it directly, the facts.mjs precedent).
//
// The matrix, fixed:
//   · V2 branch ACTIVE  (pending/running/paused/failed/stuck)            → V2 owns the slug
//   · V1 branch ACTIVE  (stages incomplete)                              → V1 owns the slug —
//     an active V1 rollback run outranks a stale complete-but-unmerged V2 draft
//   · V2 COMPLETE-DRAFT (complete, unmerged, unpublished)                → V2 still owns its
//     answers/progress (a late answer re-opens it) — but only when nothing else is active
//   · V2 merged/published branch remnant                                 → history, never active
//   · BOTH generations genuinely active                                  → CONFLICT: an explicit
//     diagnostic, never an arbitrary precedence pick
//   · nothing on either branch                                           → none (main history)
//
// Pure and defensive: inputs are whatever the branches served (possibly raw JSON from an
// untrusted fetch), so every field access is guarded. Callers decide what "exists" means
// (a git ls-remote hit server-side, a non-404 fetch client-side).

/** V2 run statuses that mean "this run still owes work or needs a human" — active either way. */
export const V2_ACTIVE_STATUSES = ["pending", "running", "paused", "failed", "stuck"];

/** V1's research stages past scaffold — any of them incomplete means the V1 run is active. */
const V1_RESEARCH_STAGES = ["passA", "passB", "reconcile", "verified"];

export function isV2RunActive(state) {
  return Boolean(state) && V2_ACTIVE_STATUSES.includes(String(state.status));
}

/** Complete but neither merged nor published: the parked draft PR case. It still owns late
    answers (reopen-answers re-enters reconcile), so it is the CURRENT run when nothing else is
    genuinely active — but it never outranks an active run of either generation. */
export function isV2CompleteDraft(state) {
  return Boolean(state) && String(state.status) === "complete" &&
    state.landing?.outcome !== "merged" && !state.publication?.published;
}

export function isV1RunActive(state) {
  return Boolean(state) && V1_RESEARCH_STAGES.some((stage) => !state.stages?.[stage]);
}

/**
 * Resolve which generation owns the slug RIGHT NOW.
 * @param {{ v2Exists?: boolean, v2State?: unknown, v1Exists?: boolean, v1State?: unknown }} [input]
 * @returns {{ decision: "v2-active"|"v1-active"|"v2-complete-draft"|"v2-history"|"none"|"conflict",
 *             conflict: boolean }}
 *   `conflict` is true ONLY for the invalid dual-active state — both generations mid-research —
 *   which callers must surface as a diagnostic/error, never resolve by precedence.
 *   "v2-history" = a merged/published V2 branch remnant (or any terminal non-draft V2 state):
 *   readable as history, active for nothing.
 */
export function resolveActiveGeneration({ v2Exists = false, v2State = null, v1Exists = false, v1State = null } = {}) {
  const v2Active = v2Exists && isV2RunActive(v2State);
  const v2Draft = v2Exists && isV2CompleteDraft(v2State);
  const v1Active = v1Exists && isV1RunActive(v1State);
  if (v2Active && v1Active) return { decision: "conflict", conflict: true };
  if (v2Active) return { decision: "v2-active", conflict: false };
  if (v1Active) return { decision: "v1-active", conflict: false };
  if (v2Draft) return { decision: "v2-complete-draft", conflict: false };
  if (v2Exists && v2State) return { decision: "v2-history", conflict: false };
  return { decision: "none", conflict: false };
}
