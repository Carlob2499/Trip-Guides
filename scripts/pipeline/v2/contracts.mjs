// PIPELINE V2 — the versioned, runtime-validated contracts (M2 of the archived build prompt,
// docs/archive/INDEX.md → FABLE_IMPLEMENTATION_PROMPT; semantics locked by docs/pipeline v2/DECISIONS.md).
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

export const RUN_SCHEMA = "wp-run/2.2"; // 2.2: optional independent judgment effort for reconcile/critic (additive)
export const EVIDENCE_SCHEMA = "wp-evidence/2.3"; // 2.3: reconciliation rows name what they corroborate/supersede (additive)
export const COVERAGE_SCHEMA = "wp-coverage/2.0";
export const TELEMETRY_SCHEMA = "wp-telemetry/2.1"; // 2.1: cumulative/failed attempt durations (additive)
export const FEEDBACK_SCHEMA = "wp-feedback/2.0";
export const CRITIC_CORRECTIONS_SCHEMA = "wp-critic-corrections/2.1"; // 2.1: corrections address an exact JSON-pointer location, and every changed leaf is declared

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

const iso = z.string().datetime({ offset: true });
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

const stageTelemetry = z.object({
  // durationSec is the SUCCESSFUL attempt's duration (compat: the 2.0 meaning preserved).
  durationSec: z.number().min(0).nullable().default(null),
  // 2.1 (additive): what retries actually cost — failed-attempt time and the cumulative total.
  failedDurationSec: z.number().min(0).nullable().default(null),
  cumulativeDurationSec: z.number().min(0).nullable().default(null),
  model: z.string().nullable().default(null),
  effort: z.string().nullable().default(null),
  retries: nullableInt.default(null),
  toolCalls: nullableInt.default(null),
  searches: nullableInt.default(null),
  fetches: nullableInt.default(null),
});

export const telemetrySchema = z.object({
  schemaVersion: z.string(),
  stages: z.record(z.string(), stageTelemetry).default({}),
  counts: z.object({
    candidatesConsidered: nullableInt.default(null),
    candidatesDeepVerified: nullableInt.default(null),
    factsVerified: nullableInt.default(null),
    disagreementInvestigations: nullableInt.default(null),
    nativeLanguageSearches: nullableInt.default(null),
  }).default({}),
  totalDurationSec: z.number().min(0).nullable().default(null),
  tokens: z.object({ input: nullableInt.default(null), output: nullableInt.default(null) }).nullable().default(null),
  costUsd: z.number().min(0).nullable().default(null),
});

// ── run state ────────────────────────────────────────────────────────────────

export const STAGE_STATUSES = ["queued", "running", "complete", "failed"];

// Per-attempt history (2.1, additive): a retried stage's real cost is visible instead of the
// last attempt's timestamps silently overwriting the first's. Old 2.0 documents parse with an
// empty history — absence is honest, never backfilled.
const attemptRecord = z.object({
  attempt: z.number().int().min(1),
  startedAt: iso,
  endedAt: iso.nullable().default(null),
  status: z.enum(["running", "complete", "failed"]),
  failureClass: z.enum(FAILURE_CLASSES).nullable().default(null),
  durationSec: z.number().min(0).nullable().default(null),
});

const stageState = z.object({
  status: z.enum(STAGE_STATUSES),
  startedAt: iso.nullable().default(null),
  endedAt: iso.nullable().default(null),
  attempts: z.number().int().min(0).default(0),
  model: z.string().nullable().default(null),
  effort: z.string().nullable().default(null),
  // The last commit that made this stage durable, when known. Null is honest — a stage that has
  // not committed yet has no durable commit to name.
  commit: z.string().regex(/^[0-9a-f]{40}$/i, "expected a full 40-character git commit SHA").nullable().default(null),
  // The tree this stage was HANDED when it began — pinned at begin-stage, and deliberately kept
  // across a same-tail re-open so a stage that is re-run to repair its own output still compares
  // against what it originally received, not against its own retained work.
  baseline: z.string().regex(/^[0-9a-f]{40}$/i, "expected a full 40-character git commit SHA").nullable().default(null),
  // The next dispatch of this stage REVALIDATES retained work deterministically instead of
  // invoking the model. Set only by the evidence-owner route, spent by the stage that consumes
  // it. Explicit because file existence cannot tell the two retries apart: an ordinary critic
  // gate failure also leaves retained guide/handoff bytes on the branch.
  replay: z.boolean().default(false),
  history: z.array(attemptRecord).default([]),
  failure,
}).superRefine((stage, ctx) => {
  if (stage.status === "queued" && (stage.startedAt || stage.endedAt)) {
    ctx.addIssue({ code: "custom", message: "a queued stage cannot have start/end timestamps" });
  }
  if (["running", "complete", "failed"].includes(stage.status) && !stage.startedAt) {
    ctx.addIssue({ code: "custom", message: `${stage.status} stage requires startedAt` });
  }
  if (["complete", "failed"].includes(stage.status) && !stage.endedAt) {
    ctx.addIssue({ code: "custom", message: `${stage.status} stage requires endedAt` });
  }
  if (stage.status === "failed" && !stage.failure) {
    ctx.addIssue({ code: "custom", message: "failed stage requires failure detail" });
  }
});

export const runStateSchema = z.looseObject({
  schemaVersion: z.string(),
  slug: z.string().min(1),
  // Immutable per run. Ordinary redispatch always keeps it; a deliberately forced new run is a
  // separate operator decision with a fresh branch.
  runId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*-\d{8}-[0-9a-f]{6}$/, "expected canonical <slug>-YYYYMMDD-<hex> run id"),
  lifecycle: z.enum(["research", "change"]),
  inputs: z.object({
    section: z.string().max(200),
    model: z.string().min(1),
    effort: z.string().min(1),
    criticModel: z.string().min(1),
    // 2.2 additive: null preserves historical/global-effort runs; fresh policy may set this
    // independently so judgment can escalate without making Pass A/B expensive too.
    criticEffort: z.string().min(1).nullable().default(null),
  }),
  // Product-communication continuity (I01): the intake issue this run reports back to. Recorded
  // once at init from /new's dispatch and carried durably, so a resume/redispatch (which has no
  // issue input) still surfaces traveler questions on the right thread. Null = manual run.
  issue: z.string().regex(/^\d+$/, "expected a GitHub issue number").nullable().default(null),
  // Landing intent (I02), immutable per run: "pr" is the controlled/draft mode (canaries, tests —
  // can never publish); "auto" is the accepted product mode, which still publishes only through
  // the full evidence gate. Recorded at init; a redispatch inherits it from here.
  landMode: z.enum(["pr", "auto"]).default("pr"),
  status: z.enum(["pending", "running", "paused", "complete", "failed", "stuck"]),
  createdAt: iso,
  updatedAt: iso,
  stageOrder: z.array(z.string().min(1)).min(1),
  stages: z.record(z.string(), stageState),
  attempts: z.object({
    total: z.number().int().min(0).default(0),
    cap: z.number().int().min(1),
    autoRetries: z.number().int().min(0).default(0),
    autoRetryCap: z.number().int().min(0).default(1),
  }),
  // Where a resumed run picks up: the interrupted stage itself, never a stage ahead of it.
  resume: z.object({
    nextStage: z.string().nullable(),
    action: z.string(),
  }),
  failure,
  // Publication and deployed-live are DISTINCT facts: a merge to main is not "live", and the
  // progress surface must never conflate them. null deployedLive = not yet known (honest).
  publication: z.object({
    published: z.boolean().default(false),
    publishedAt: iso.nullable().default(null),
    deployedLive: z.boolean().nullable().default(null),
    deployedAt: iso.nullable().default(null),
  }),
  // THE LANDING TRANSACTION (correction pass, 2026-08-20): gate PASS and merge success are
  // SEPARATE facts. `landingGate` says what the evidence gate found; `landing` says what GitHub
  // actually did with the branch. `pending` until an outcome exists; "merged" is written only
  // AFTER gh confirms the merge — the schema below refuses `published: true` on anything else.
  // `announced` records whether the auto-publish safety notice was actually filed (null =
  // not applicable/not attempted; false = merge succeeded but the notice API call failed — a
  // durable fact someone must act on, never a reason to pretend the merge failed).
  landing: z.object({
    outcome: z.enum(["pending", "merged", "draft", "failed"]).default("pending"),
    pr: z.number().int().min(1).nullable().default(null),
    mergedAt: iso.nullable().default(null),
    announced: z.boolean().nullable().default(null),
    finalizedAt: iso.nullable().default(null),
    detail: z.string().nullable().default(null),
  }).superRefine((l, ctx) => {
    if (l.outcome === "merged" && (!l.pr || !l.mergedAt)) ctx.addIssue({ code: "custom", message: "a merged landing requires pr and mergedAt" });
    if (l.outcome === "pending" && (l.pr || l.mergedAt || l.finalizedAt)) ctx.addIssue({ code: "custom", message: "a pending landing cannot carry outcome fields" });
    if (l.outcome === "draft" && !l.pr) ctx.addIssue({ code: "custom", message: "a draft landing names its PR" });
  }).default({ outcome: "pending", pr: null, mergedAt: null, announced: null, finalizedAt: null, detail: null }),
  // Prior runs of this slug (fresh-run semantics): compact, append-only history — a re-research
  // never silently destroys the record of what shipped before it.
  previousRuns: z.array(z.looseObject({
    runId: z.string().min(1),
    status: z.string().min(1),
    endedAt: iso.nullable().default(null),
    publishedAt: iso.nullable().default(null),
    mergedPr: z.number().int().min(1).nullable().default(null),
  })).default([]),
  landingGate: z.object({
    status: z.enum(["pending", "passed", "failed"]),
    checkedAt: iso.nullable().default(null),
    failure: z.string().nullable().default(null),
  }).superRefine((gate, ctx) => {
    if (gate.status === "pending" && (gate.checkedAt || gate.failure)) ctx.addIssue({ code: "custom", message: "pending landing gate cannot have result fields" });
    if (gate.status === "passed" && (!gate.checkedAt || gate.failure)) ctx.addIssue({ code: "custom", message: "passed landing gate requires checkedAt and no failure" });
    if (gate.status === "failed" && (!gate.checkedAt || !gate.failure?.trim())) ctx.addIssue({ code: "custom", message: "failed landing gate requires checkedAt and failure" });
  }).default({ status: "pending", checkedAt: null, failure: null }),
  telemetry: telemetrySchema.nullable().default(null),
}).superRefine((state, ctx) => {
  if (!state.runId.startsWith(`${state.slug}-`)) ctx.addIssue({ code: "custom", message: "runId must be prefixed by slug" });
  const statuses = state.stageOrder.map((stage) => state.stages[stage]?.status);
  if (state.status === "complete" && statuses.some((s) => s !== "complete")) ctx.addIssue({ code: "custom", message: "complete run requires every stage complete" });
  if (state.status === "failed" && !state.failure) ctx.addIssue({ code: "custom", message: "failed run requires failure detail" });
  if (state.publication.published !== Boolean(state.publication.publishedAt)) ctx.addIssue({ code: "custom", message: "published and publishedAt must agree" });
  if (state.publication.deployedLive === true && !state.publication.deployedAt) ctx.addIssue({ code: "custom", message: "deployedLive requires deployedAt" });
  // NO STATE GETS AHEAD OF REALITY (correction pass): "published" is a claim about a CONFIRMED
  // GitHub merge — it is schema-invalid without one, and schema-invalid on a failed gate. These
  // are the invariants the retired recordProductLanding() violated by writing published before
  // landBranch ran.
  if (state.publication.published && state.landing?.outcome !== "merged") {
    ctx.addIssue({ code: "custom", message: "published requires a CONFIRMED merged landing outcome — a gate pass is not a merge" });
  }
  if (state.publication.published && state.landingGate?.status !== "passed") {
    ctx.addIssue({ code: "custom", message: "published requires a passed landing gate" });
  }
  if (state.landing?.outcome === "merged" && state.landingGate?.status !== "passed") {
    ctx.addIssue({ code: "custom", message: "a merged landing without a passed gate is not a state this pipeline can produce" });
  }
});

// ── research evidence + candidates ───────────────────────────────────────────

export const CANDIDATE_STATUSES = ["considered", "shortlisted", "shipped", "rejected", "detour"];
export const EVIDENCE_KINDS = ["objective", "experiential"];
export const SOURCE_KINDS = ["official", "operator", "firsthand", "press", "reference", "aggregator"];
export const EVIDENCE_ORIGINS = ["passA", "passB", "reconcile", "critic"];
export const DISPOSITIONS = ["agree", "adopt", "replace", "reject", "conflict-resolved", "detour"];
export const WORTH_LABELS = ["worth-the-effort", "worth-the-detour"];
// 2.1 (additive): HOW the source was reached. A search-result preview referencing a page is
// discovery, not a read of that page; "fetched" means the origin content itself was retrieved.
export const SOURCE_ACCESS = ["fetched", "search-preview", "blocked", "unknown"];

export const candidateSchema = z.looseObject({
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

export const evidenceSourceSchema = z.object({
  url: z.string().url().refine((url) => /^https?:\/\//i.test(url), "expected an http(s) source URL"),
  kind: z.enum(SOURCE_KINDS),
  // Default "unknown" keeps 2.0 documents parsing; the research rules demand an explicit
  // answer where the claim is critical (see sourceAccessProblems).
  access: z.enum(SOURCE_ACCESS).default("unknown"),
  language: z.string().nullable().default(null),
  publishedAt: z.string().nullable().default(null),
  // Source-family independence beyond raw domain counts: copied publisher/SEO families share a
  // family key; null = independence not knowable (honest, not assumed independent).
  family: z.string().nullable().default(null),
  independent: z.boolean().nullable().default(null),
  // For recurring events, this is the explicit season/year the current source actually
  // announces. Publication year alone cannot distinguish a valid advance announcement from
  // last year's schedule being extrapolated.
  appliesToYears: z.array(z.number().int().min(2000).max(2200)).default([]),
});

export const evidenceRecordSchema = z.object({
  id: z.string().min(1),
  candidateId: z.string().nullable().default(null),
  claim: z.string().min(1),
  kind: z.enum(EVIDENCE_KINDS),
  origin: z.enum(EVIDENCE_ORIGINS),
  source: evidenceSourceSchema,
  verifiedOn: isoDate,
  firsthand: z.boolean().nullable().default(null),
  freshness: z.object({
    perishable: z.boolean(),
    shelfLife: z.enum(["fx", "transit", "hours", "venue", "default"]).nullable().default(null),
    recheckOn: isoDate.nullable().default(null),
  }).nullable().default(null),
});

// The blind critic never owns evidence.v2.json. When it changes ANY canonical guide file it emits
// only this narrow handoff, and the trusted plane proves each declared movement at its exact
// location. EVERY changed leaf must be declared — "that rewrite was only editorial" is the
// critic's own assertion, so there is no editorial escape and an unaccounted change fails closed.
export const GUIDE_FILE = /^(?:facts\.json|_guide\.json|\d\d-[a-z0-9-]+\.json)$/;
// "<guide file>#<RFC 6901 JSON pointer>": one exact location, so several independent facts inside
// one item address distinctly and each correction keeps its own stable identity.
export const CRITIC_TARGET = /^(?:facts\.json|_guide\.json|\d\d-[a-z0-9-]+\.json)#(?:\/(?:[^/~]|~[01])*)+$/;

export const criticCorrectionDocSchema = z.object({
  schemaVersion: z.string(),
  slug: z.string().min(1),
  runId: z.string().min(1),
  corrections: z.array(z.object({
    target: z.string().regex(CRITIC_TARGET, 'expected "<guide file>#<JSON pointer>", e.g. "03-transit.json#/0/steps/2"'),
    previousValue: z.string().nullable(),
    correctedValue: z.string().min(1),
    claim: z.string().min(1),
    source: evidenceSourceSchema,
    verifiedOn: isoDate,
    freshness: z.object({
      perishable: z.boolean(),
      shelfLife: z.enum(["fx", "transit", "hours", "venue", "default"]).nullable().default(null),
      recheckOn: isoDate.nullable().default(null),
    }),
  })).default([]),
});

export const reservationFindingSchema = z.object({
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
  leads: z.array(z.object({
    claim: z.string().min(1),
    status: z.enum(["unconfirmed-lead", "confirmed"]),
    source: evidenceSourceSchema.nullable().default(null),
    verifiedOn: isoDate.nullable().default(null),
  })).default([]),
  alternatives: z.string().nullable().default(null),
  fallback: z.string().nullable().default(null),
});

export const transportFindingSchema = z.object({
  id: z.string().min(1),
  route: z.string().min(1),
  risk: z.number().int().min(0).max(4),
  // 2.1 (additive): the evidence records this route's facts rest on. Required for high-risk
  // routes (R3+) so the access rule can demand a genuinely fetched source behind them.
  evidenceIds: z.array(z.string()).default([]),
  doorToDoor: z.string().nullable().default(null),
  transferReality: z.string().nullable().default(null),
  groupLuggageMobility: z.string().nullable().default(null),
  buffer: z.string().nullable().default(null),
  missedConnection: z.string().nullable().default(null),
  nextService: z.string().nullable().default(null),
  lastPracticalReturn: z.string().nullable().default(null),
  fallback: z.string().nullable().default(null),
});

export const disagreementSchema = z.object({
  id: z.string().min(1),
  topic: z.string().min(1),
  impact: z.enum(["recommendation-changing", "minor"]),
  // 2.2 (additive): exact evidence records whose claims disagree. Default [] keeps historical
  // 2.0/2.1 documents readable; the research rule makes linkage mandatory only when impact
  // is recommendation-changing.
  evidenceIds: z.array(z.string().min(1)).default([]),
  investigation: z.string().min(1),
  resolution: z.string().nullable().default(null),
});

// The adaptive-search stop record (replaces fixed quotas — DECISIONS.md "Research breadth").
export const saturationSchema = z.object({
  stopped: z.boolean(),
  // What the last searches were producing when the run stopped (or why it hasn't stopped).
  trend: z.enum(["novel", "duplicates", "weaker"]),
  // Could unresolved evidence still change the recommendation? MUST be answered to stop.
  unresolvedCouldChange: z.boolean().nullable().default(null),
  note: z.string().min(1),
});

/** A typed relation from one reconciliation row to prior work: WHAT KIND of relation it is,
    plus the evidence ids it names (empty for the kinds that name no record). */
const evidenceRelationSchema = (kinds) => z.object({
  kind: z.enum(kinds),
  evidenceIds: z.array(z.string().min(1)).default([]),
});

export const evidenceDocSchema = z.looseObject({
  schemaVersion: z.string(),
  slug: z.string().min(1),
  runId: z.string().min(1),
  candidates: z.array(candidateSchema).default([]),
  evidence: z.array(evidenceRecordSchema).default([]),
  reservations: z.array(reservationFindingSchema).default([]),
  transport: z.array(transportFindingSchema).default([]),
  disagreements: z.array(disagreementSchema).default([]),
  depth: z.object({
    reservations: z.object({
      requiredCandidateIds: z.array(z.string().min(1)).default([]),
      notApplicableReason: z.string().min(20).nullable().default(null),
    }),
    transport: z.object({
      requiredRouteIds: z.array(z.string().min(1)).default([]),
      notApplicableReason: z.string().min(20).nullable().default(null),
    }),
  }).nullable().default(null),
  saturation: saturationSchema.nullable().default(null),
  passB: z.object({
    nativeLanguage: z.object({
      used: z.boolean(),
      why: z.string().nullable().default(null),
      searchClasses: z.array(z.string()).default([]),
      yield: z.string().nullable().default(null),
    }).nullable().default(null),
    noYieldReason: z.string().nullable().default(null),
  }).nullable().default(null),
  // Every independent (Pass-B origin) finding gets exactly one typed disposition, linked by id.
  // 2.3 (additive): relations reconcile used to assert only in `note` prose. Typed DISCRIMINATORS,
  // not bare id lists, because the historical rows prove both have a second legitimate meaning:
  // Uruguay's single-sourced `agree` corroborates a RECOMMENDATION, and Tottori's ev-jumbo-taxi
  // supersedes "Pass A's weak taxi fallback" — never a record — so no id is ever invented.
  // Optional here, required by dispositionProblems at ≥2.3: older artifacts stay valid, a 2.3 row
  // cannot stay silent. Limit: `kind: "none"` is still the reconciler's own assertion. Better than
  // silence (machine-readable, and `factual` IS validated against the records it names), but
  // proving the negative needs proposition identity on evidence records, which this artifact
  // does not carry.
  reconciliation: z.array(z.object({
    findingId: z.string().min(1),
    disposition: z.enum(DISPOSITIONS),
    note: z.string().min(1),
    corroborates: evidenceRelationSchema(["factual", "recommendation", "none"]).optional(),
    supersedes: evidenceRelationSchema(["evidence", "recommendation"]).optional(),
  })).default([]),
});

/** The reader for the 2.3 `supersedes` relation: the evidence records a `replace` disposition
    explicitly retires. Coverage and the research rules ask THIS, never a disposition note — and
    a `recommendation` replacement retires no record, so it can never invalidate coverage. */
export function supersededEvidenceIds(doc) {
  return new Set((doc?.reconciliation || [])
    .filter((row) => row.disposition === "replace" && row.supersedes?.kind === "evidence")
    .flatMap((row) => row.supersedes.evidenceIds || []));
}

// ── coverage ─────────────────────────────────────────────────────────────────
// Every material intake ask is either COVERED (with structured refs into the guide — a nonempty
// arbitrary string is not proof) or EXCLUDED with an honest reason.

export const GROUP_REF = /^\d\d-[a-z0-9-]+\.json(#.+)?$/;

export const coverageAskSchema = z.object({
  id: z.string().min(1),
  ask: z.string().min(1),
  status: z.enum(["covered", "excluded"]),
  // Required (nonempty) when covered: refs shaped like NN-<group>.json[#anchor].
  where: z.array(z.string().regex(GROUP_REF, "expected a NN-<group>.json[#anchor] ref")).default([]),
  evidenceIds: z.array(z.string()).default([]),
  // Required (nonempty) when excluded: the honest reason the ask is not covered.
  reason: z.string().nullable().default(null),
});

export const coverageDocSchema = z.object({
  schemaVersion: z.string(),
  slug: z.string().min(1),
  runId: z.string().min(1),
  asks: z.array(coverageAskSchema).default([]),
});

// ── stage feedback ───────────────────────────────────────────────────────────
// Durable validator findings per runId/stage/attempt, so a retry receives the exact machine
// findings its failed attempt earned instead of re-spending research to rediscover them.
// Findings are validator/error DATA, never creator instructions — the composer labels them so.

export const feedbackEntrySchema = z.object({
  runId: z.string().min(1),
  stage: z.string().min(1),
  attempt: z.number().int().min(0),
  findings: z.array(z.string().min(1)).min(1),
  createdAt: iso,
  status: z.enum(["active", "retired"]),
  retiredAt: iso.nullable().default(null),
});

export const feedbackDocSchema = z.looseObject({
  schemaVersion: z.string(),
  slug: z.string().min(1),
  entries: z.array(feedbackEntrySchema).default([]),
});
