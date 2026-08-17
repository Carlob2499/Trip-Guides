// PIPELINE V2 — telemetry helpers: versioned, bounded, honest.
//
// The rule (DECISIONS.md "Research visibility and cost" + the execution prompt): emit facts
// available from code/workflow boundaries FIRST — stage duration, model, effort, retries — and
// represent everything the producer cannot trust as null. Tokens and cost are never inferred
// from anything; they are recorded only when a trustworthy source (the action's own usage
// report) supplies them. The progress UI's honest empty state depends on these nulls staying
// null — an invented zero would render as a fact.

import { TELEMETRY_SCHEMA, telemetrySchema, parseOrThrow } from "./contracts.mjs";

/** A telemetry summary with every value unknown — the honest starting point. */
export function emptyTelemetry() {
  return {
    schemaVersion: TELEMETRY_SCHEMA,
    stages: {},
    counts: {
      candidatesConsidered: null,
      candidatesDeepVerified: null,
      factsVerified: null,
      disagreementInvestigations: null,
      nativeLanguageSearches: null,
    },
    totalDurationSec: null,
    tokens: null,
    costUsd: null,
  };
}

/** Stage facts the workflow boundary can always produce: wall-clock duration + model + effort.
    Anything not supplied stays null. */
export function stageFacts({ startedAt = null, endedAt = null, model = null, effort = null, retries = null } = {}) {
  let durationSec = null;
  if (startedAt && endedAt) {
    const ms = Date.parse(endedAt) - Date.parse(startedAt);
    if (Number.isFinite(ms) && ms >= 0) durationSec = Math.round(ms / 1000);
  }
  return { durationSec, model, effort, retries, toolCalls: null, searches: null, fetches: null };
}

/** Derive the count facts the evidence artifact actually proves. Null when the artifact cannot
    prove them — a missing artifact yields all-null counts, never zeros. */
export function countsFromEvidence(evidenceDoc) {
  if (!evidenceDoc) {
    return {
      candidatesConsidered: null,
      candidatesDeepVerified: null,
      factsVerified: null,
      disagreementInvestigations: null,
      nativeLanguageSearches: null,
    };
  }
  const candidates = evidenceDoc.candidates || [];
  return {
    candidatesConsidered: candidates.length,
    candidatesDeepVerified: candidates.filter((c) => c.shortlisted).length,
    factsVerified: (evidenceDoc.evidence || []).length,
    disagreementInvestigations: (evidenceDoc.disagreements || []).length,
    // Search counts are producer facts, not derivable from the artifact — used/why is recorded,
    // the number of searches is not. Unknown remains unknown.
    nativeLanguageSearches: null,
  };
}

/** Merge stage-level facts into a summary (validated on the way out). Later facts win per field
    ONLY when they are non-null — a late unknown never erases an earlier known value. */
export function mergeTelemetry(base, patch) {
  const out = structuredClone(base || emptyTelemetry());
  if (!patch) return parseOrThrow(telemetrySchema, out, { what: "telemetry summary" });
  for (const [stage, facts] of Object.entries(patch.stages || {})) {
    out.stages[stage] = out.stages[stage] || {};
    for (const [k, v] of Object.entries(facts)) {
      if (v !== null && v !== undefined) out.stages[stage][k] = v;
      else if (!(k in out.stages[stage])) out.stages[stage][k] = null;
    }
  }
  for (const [k, v] of Object.entries(patch.counts || {})) {
    if (v !== null && v !== undefined) out.counts[k] = v;
  }
  for (const k of ["totalDurationSec", "costUsd"]) {
    if (patch[k] !== null && patch[k] !== undefined) out[k] = patch[k];
  }
  if (patch.tokens) out.tokens = { ...out.tokens, ...patch.tokens };
  return parseOrThrow(telemetrySchema, out, { what: "telemetry summary" });
}
