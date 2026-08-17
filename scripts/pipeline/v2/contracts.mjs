// PIPELINE V2 — the versioned, runtime-validated contracts (M2 of docs/pipeline v2/
// FABLE_IMPLEMENTATION_PROMPT.md; semantics locked by docs/pipeline v2/DECISIONS.md).
//
// Everything the V2 control plane hands between stages is one of these documents, validated at
// every read and write. The design rules, stated once:
//
//   FAIL CLOSED   A malformed mandatory V2 artifact throws ContractError with an actionable
//                 message. It is NEVER silently treated as "no run" / "no evidence" — that
//                 conversion is how V1's regex-prose contracts let a half-written artifact pass.
//   VERSIONED     Every document carries `schemaVersion: "<name>/<major>.<minor>"`. Same major
//                 (any minor) is accepted — minor bumps are additive, and documents are parsed
//                 loose so unknown fields survive a read-modify-write round trip (forward
//                 compatibility). A different major is refused with the migration named.
//   HONEST NULLS  Telemetry and publication facts represent "unknown" as null, never as a
//                 guessed value or a fake zero. Tokens and cost are never inferred.
//
// Plain .mjs + zod (the intake-schema.mjs precedent) — the node-run scripts and workflows import
// this directly; no TS pipeline, no new packages.

import { z } from "zod";

// ── versioning ───────────────────────────────────────────────────────────────

export const RUN_SCHEMA = "wp-run/2.0";
export const EVIDENCE_SCHEMA = "wp-evidence/2.0";
export const COVERAGE_SCHEMA = "wp-coverage/2.0";
export const TELEMETRY_SCHEMA = "wp-telemetry/2.0";

/** Fail-closed contract failure: what broke, in which file, and what to do about it. */
export class ContractError extends Error {
  constructor(message, { file = null, issues = [] } = {}) {
    super(message);
    this.name = "ContractError";
    this.file = file;
    this.issues = issues;
  }
}

export function parseSchemaVersion(value) {
  const m = /^([a-z-]+)\/(\d+)\.(\d+)$/.exec(String(value ?? ""));
  if (!m) return null;
  return { name: m[1], major: Number(m[2]), minor: Number(m[3]) };
}

/** Same document family, same major → compatible (minor bumps are additive). */
export function assertVersionCompatible(actual, expected, { file = null } = {}) {
  const want = parseSchemaVersion(expected);
  const got = parseSchemaVersion(actual);
  if (!got) {
    throw new ContractError(
      `schemaVersion "${actual}" is not a valid V2 version tag (expected "${expected}" or a compatible ${want.name}/${want.major}.x). ` +
        `If this is a V1 artifact, read it through the V1 adapter — do not hand it to the V2 reader.`,
      { file },
    );
  }
  if (got.name !== want.name || got.major !== want.major) {
    throw new ContractError(
      `schemaVersion "${actual}" is not compatible with "${expected}" (need ${want.name}/${want.major}.x). ` +
        `A different major means the document needs migration, not a permissive parse.`,
      { file },
    );
  }
}

/** zod parse that fails closed with the actual field-level issues in the message. */
export function parseOrThrow(schema, doc, { file = null, what = "V2 artifact" } = {}) {
  const result = schema.safeParse(doc);
  if (result.success) return result.data;
  const issues = result.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
  throw new ContractError(
    `${what}${file ? ` at ${file}` : ""} is malformed — refusing to treat it as absent:\n` +
      issues.map((i) => `  · ${i}`).join("\n") +
      `\nFix the document (or restore it from git) before resuming; a malformed mandatory artifact is a blocking failure.`,
    { file, issues },
  );
}

// ── shared fragments ─────────────────────────────────────────────────────────

const iso = z.string().min(1);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const nullableInt = z.number().int().min(0).nullable();

export const FAILURE_CLASSES = ["usage-limit", "void-run", "agent-failure", "gate-failure", "cancelled", "unknown"];

const failure = z.object({
  class: z.enum(FAILURE_CLASSES),
  detail: z.string(),
  at: iso.optional(),
}).nullable();

// ── telemetry ────────────────────────────────────────────────────────────────
// Versioned and bounded. Facts come from code/workflow boundaries first; anything the producer
// cannot trust stays null. `tokens`/`costUsd` are ONLY ever set from a trustworthy source (the
// action's own reported usage) — never inferred from output size or guessed.

const stageTelemetry = z.looseObject({
  durationSec: z.number().min(0).nullable().default(null),
  model: z.string().nullable().default(null),
  effort: z.string().nullable().default(null),
  retries: nullableInt.default(null),
  toolCalls: nullableInt.default(null),
  searches: nullableInt.default(null),
  fetches: nullableInt.default(null),
});

export const telemetrySchema = z.looseObject({
  schemaVersion: z.string(),
  stages: z.record(z.string(), stageTelemetry).default({}),
  counts: z.looseObject({
    candidatesConsidered: nullableInt.default(null),
    candidatesDeepVerified: nullableInt.default(null),
    factsVerified: nullableInt.default(null),
    disagreementInvestigations: nullableInt.default(null),
    nativeLanguageSearches: nullableInt.default(null),
  }).default({}),
  totalDurationSec: z.number().min(0).nullable().default(null),
  tokens: z.looseObject({ input: nullableInt.default(null), output: nullableInt.default(null) }).nullable().default(null),
  costUsd: z.number().min(0).nullable().default(null),
});

// ── run state ────────────────────────────────────────────────────────────────

export const STAGE_STATUSES = ["queued", "running", "complete", "failed"];

const stageState = z.looseObject({
  status: z.enum(STAGE_STATUSES),
  startedAt: iso.nullable().default(null),
  endedAt: iso.nullable().default(null),
  attempts: z.number().int().min(0).default(0),
  model: z.string().nullable().default(null),
  effort: z.string().nullable().default(null),
  // The last commit that made this stage durable, when known. Null is honest — a stage that has
  // not committed yet has no durable commit to name.
  commit: z.string().nullable().default(null),
  failure,
});

export const runStateSchema = z.looseObject({
  schemaVersion: z.string(),
  slug: z.string().min(1),
  // Immutable per run. A resumed run keeps its runId; a fresh dispatch after completion/stuck
  // mints a new one.
  runId: z.string().min(1),
  lifecycle: z.enum(["research", "change"]),
  status: z.enum(["pending", "running", "paused", "complete", "failed", "stuck"]),
  createdAt: iso,
  updatedAt: iso,
  stageOrder: z.array(z.string().min(1)).min(1),
  stages: z.record(z.string(), stageState),
  attempts: z.looseObject({
    total: z.number().int().min(0).default(0),
    cap: z.number().int().min(1),
    autoRetries: z.number().int().min(0).default(0),
    autoRetryCap: z.number().int().min(0).default(1),
  }),
  // Where a resumed run picks up: the interrupted stage itself, never a stage ahead of it.
  resume: z.looseObject({
    nextStage: z.string().nullable(),
    action: z.string(),
  }),
  failure,
  // Publication and deployed-live are DISTINCT facts: a merge to main is not "live", and the
  // progress surface must never conflate them. null deployedLive = not yet known (honest).
  publication: z.looseObject({
    published: z.boolean().default(false),
    publishedAt: iso.nullable().default(null),
    deployedLive: z.boolean().nullable().default(null),
    deployedAt: iso.nullable().default(null),
  }),
  telemetry: telemetrySchema.nullable().default(null),
});

// ── research evidence + candidates ───────────────────────────────────────────

export const CANDIDATE_STATUSES = ["considered", "shortlisted", "shipped", "rejected", "detour"];
export const EVIDENCE_KINDS = ["objective", "experiential"];
export const SOURCE_KINDS = ["official", "operator", "firsthand", "press", "reference", "aggregator"];
export const EVIDENCE_ORIGINS = ["passA", "passB", "reconcile", "critic"];
export const DISPOSITIONS = ["agree", "adopt", "replace", "reject", "conflict-resolved", "detour"];
export const WORTH_LABELS = ["worth-the-effort", "worth-the-detour"];

const candidate = z.looseObject({
  id: z.string().min(1),
  name: z.string().min(1),
  // Exact branch/location when it matters (chains, multi-site venues). Null when it doesn't.
  branch: z.string().nullable().default(null),
  priority: z.string().nullable().default(null),
  status: z.enum(CANDIDATE_STATUSES),
  // The funnel invariant travels as data: shipped ⊆ shortlisted ⊆ considered.
  shortlisted: z.boolean().default(false),
  // Required for rejected/detour — the rejection reason IS the research evidence.
  reason: z.string().nullable().default(null),
  worth: z.enum(WORTH_LABELS).nullable().default(null),
});

const evidenceSource = z.looseObject({
  url: z.string().nullable().default(null),
  kind: z.enum(SOURCE_KINDS),
  language: z.string().nullable().default(null),
  publishedAt: z.string().nullable().default(null),
  // Source-family independence beyond raw domain counts: copied publisher/SEO families share a
  // family key; null = independence not knowable (honest, not assumed independent).
  family: z.string().nullable().default(null),
  independent: z.boolean().nullable().default(null),
});

const evidenceRecord = z.looseObject({
  id: z.string().min(1),
  candidateId: z.string().nullable().default(null),
  claim: z.string().min(1),
  kind: z.enum(EVIDENCE_KINDS),
  origin: z.enum(EVIDENCE_ORIGINS),
  source: evidenceSource,
  verifiedOn: isoDate,
  firsthand: z.boolean().nullable().default(null),
});

const reservationFinding = z.looseObject({
  candidateId: z.string().min(1),
  importance: z.enum(["casual", "important", "anchor"]),
  bookingUrl: z.string().nullable().default(null),
  releaseWindow: z.string().nullable().default(null),
  actionDate: z.string().nullable().default(null),
  partyRules: z.string().nullable().default(null),
  deposit: z.string().nullable().default(null),
  cancellation: z.string().nullable().default(null),
  foreignFriction: z.string().nullable().default(null),
  lastSeating: z.string().nullable().default(null),
  walkIn: z.string().nullable().default(null),
  // A local report that concierge/alternative booking may work, not officially confirmed. It
  // stays a labeled lead until current evidence confirms it — never silently promoted.
  leads: z.array(z.looseObject({
    claim: z.string().min(1),
    status: z.enum(["unconfirmed-lead", "confirmed"]),
    source: evidenceSource.nullable().default(null),
    verifiedOn: isoDate.nullable().default(null),
  })).default([]),
  alternatives: z.string().nullable().default(null),
  fallback: z.string().nullable().default(null),
});

const transportFinding = z.looseObject({
  id: z.string().min(1),
  route: z.string().min(1),
  risk: z.number().int().min(0).max(4),
  doorToDoor: z.string().nullable().default(null),
  transferReality: z.string().nullable().default(null),
  groupLuggageMobility: z.string().nullable().default(null),
  buffer: z.string().nullable().default(null),
  missedConnection: z.string().nullable().default(null),
  nextService: z.string().nullable().default(null),
  lastPracticalReturn: z.string().nullable().default(null),
  fallback: z.string().nullable().default(null),
});

const disagreement = z.looseObject({
  id: z.string().min(1),
  topic: z.string().min(1),
  impact: z.enum(["recommendation-changing", "minor"]),
  investigation: z.string().min(1),
  resolution: z.string().nullable().default(null),
});

// The adaptive-search stop record (replaces fixed quotas — DECISIONS.md "Research breadth").
const saturation = z.looseObject({
  stopped: z.boolean(),
  // What the last searches were producing when the run stopped (or why it hasn't stopped).
  trend: z.enum(["novel", "duplicates", "weaker"]),
  // Could unresolved evidence still change the recommendation? MUST be answered to stop.
  unresolvedCouldChange: z.boolean().nullable().default(null),
  note: z.string().min(1),
});

export const evidenceDocSchema = z.looseObject({
  schemaVersion: z.string(),
  slug: z.string().min(1),
  runId: z.string().min(1),
  candidates: z.array(candidate).default([]),
  evidence: z.array(evidenceRecord).default([]),
  reservations: z.array(reservationFinding).default([]),
  transport: z.array(transportFinding).default([]),
  disagreements: z.array(disagreement).default([]),
  saturation: saturation.nullable().default(null),
  passB: z.looseObject({
    nativeLanguage: z.looseObject({
      used: z.boolean(),
      why: z.string().nullable().default(null),
      searchClasses: z.array(z.string()).default([]),
      yield: z.string().nullable().default(null),
    }).nullable().default(null),
  }).nullable().default(null),
  // Every independent (Pass-B origin) finding gets exactly one typed disposition, linked by id.
  reconciliation: z.array(z.looseObject({
    findingId: z.string().min(1),
    disposition: z.enum(DISPOSITIONS),
    note: z.string().min(1),
  })).default([]),
});

// ── coverage ─────────────────────────────────────────────────────────────────
// Every material intake ask is either COVERED (with structured refs into the guide — a nonempty
// arbitrary string is not proof) or EXCLUDED with an honest reason.

const GROUP_REF = /^\d\d-[a-z0-9-]+\.json(#.+)?$/;

export const coverageAskSchema = z.looseObject({
  id: z.string().min(1),
  ask: z.string().min(1),
  status: z.enum(["covered", "excluded"]),
  // Required (nonempty) when covered: refs shaped like NN-<group>.json[#anchor].
  where: z.array(z.string().regex(GROUP_REF, "expected a NN-<group>.json[#anchor] ref")).default([]),
  evidenceIds: z.array(z.string()).default([]),
  // Required (nonempty) when excluded: the honest reason the ask is not covered.
  reason: z.string().nullable().default(null),
});

export const coverageDocSchema = z.looseObject({
  schemaVersion: z.string(),
  slug: z.string().min(1),
  runId: z.string().min(1),
  asks: z.array(coverageAskSchema).default([]),
});
