// The authoritative active-generation resolver.
//
// Progress, questions, events and answers routing all have to answer the same question: which
// research generation currently OWNS this slug? That used to diverge by caller, so stale branch
// remnants could win just by existing. This module is the shared semantic for Node and Vite.
//
// The matrix:
//   · V3 branch ACTIVE  (pending/running/paused/failed/stuck)            → V3 owns the slug
//   · V2 branch ACTIVE  (historical/manual only)                         → V2 owns the slug
//   · V1 branch ACTIVE  (stages incomplete)                              → V1 owns the slug
//   · V3 COMPLETE-DRAFT (complete, unmerged, unpublished)                → V3 still owns late
//     answers/progress when nothing else is active
//   · V2 COMPLETE-DRAFT (historical/manual only)                         → same, but historical
//   · merged/published branch remnant                                    → history, never active
//   · multiple active generations                                        → CONFLICT, never guess
//   · nothing on any branch                                              → none (main history)
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

/** The V2-shaped record is shared for compatibility, but its branch namespace is not.
    Missing `engine` means historical V2; V3 always requires its explicit stamp. */
export function generationEngineMatches(state, expectedEngine) {
  if (!state || typeof state !== "object") return false;
  return (state.engine ?? "v2") === expectedEngine;
}

export function isV1RunActive(state) {
  return Boolean(state) && V1_RESEARCH_STAGES.some((stage) => !state.stages?.[stage]);
}

/**
 * Resolve which generation owns the slug RIGHT NOW.
 * @param {{ v3Exists?: boolean, v3State?: unknown, v2Exists?: boolean, v2State?: unknown, v1Exists?: boolean, v1State?: unknown }} [input]
 * @returns {{ decision: "v3-active"|"v3-complete-draft"|"v3-history"|"v2-active"|"v1-active"|"v2-complete-draft"|"v2-history"|"none"|"conflict",
 *             conflict: boolean }}
 *   `conflict` is true ONLY for the invalid dual-active state — both generations mid-research —
 *   which callers must surface as a diagnostic/error, never resolve by precedence.
 *   "v2-history" = a merged/published V2 branch remnant (or any terminal non-draft V2 state):
 *   readable as history, active for nothing.
 */
export function resolveActiveGeneration({ v3Exists = false, v3State = null, v2Exists = false, v2State = null, v1Exists = false, v1State = null } = {}) {
  // V3 uses the same durable run shape while it is the selected route. Keep the resolver's
  // historical V2 fields for compatibility, but give V3 an explicit owner so progress and
  // answer routing never mistake a V3 branch for an old V2 run.
  const v3Active = v3Exists && isV2RunActive(v3State);
  const v3Draft = v3Exists && isV2CompleteDraft(v3State);
  const v2Active = v2Exists && isV2RunActive(v2State);
  const v2Draft = v2Exists && isV2CompleteDraft(v2State);
  const v1Active = v1Exists && isV1RunActive(v1State);
  if ((v3Active && (v2Active || v1Active)) || (v2Active && v1Active)) return { decision: "conflict", conflict: true };
  if (v3Active) return { decision: "v3-active", conflict: false };
  if (v2Active) return { decision: "v2-active", conflict: false };
  if (v1Active) return { decision: "v1-active", conflict: false };
  if (v3Draft) return { decision: "v3-complete-draft", conflict: false };
  if (v2Draft) return { decision: "v2-complete-draft", conflict: false };
  if (v3Exists && v3State) return { decision: "v3-history", conflict: false };
  if (v2Exists && v2State) return { decision: "v2-history", conflict: false };
  return { decision: "none", conflict: false };
}
