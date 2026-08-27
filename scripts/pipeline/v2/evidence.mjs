// PIPELINE V2 — the research evidence + candidates artifact and its structural rules.
//
// File: guides-intake/<slug>/evidence.v2.json. The human ledger (ledger.md) stays useful and
// inspectable, but regex prose is no longer the machine contract — this document is, and a
// missing or malformed one is a BLOCKING failure where the pipeline requires it.
//
// Structural rules enforced here (M2); the research-quality rules (objective-vs-experiential
// sourcing, freshness classes, reservation depth) layer on in the M5 verifier:
//   · shipped ⊆ shortlisted — a shipped candidate that never passed the shortlist is a side door.
//   · rejected/detour candidates carry a reason — the rejection IS the evidence.
//   · every independent (Pass-B origin) finding has exactly one typed disposition, linked by id.
//   · the adaptive-search stop record must EARN a stop: mostly duplicate/weaker novelty AND
//     unresolved evidence answered "could not change the recommendation".

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  EVIDENCE_SCHEMA, evidenceDocSchema, parseOrThrow, assertVersionCompatible, ContractError,
} from "./contracts.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const INTAKE_DIR = path.join(ROOT, "guides-intake");

export function evidencePath(slug, intakeDir = INTAKE_DIR) {
  return path.join(intakeDir, slug, "evidence.v2.json");
}

/** Stable, deterministic candidate id from identity — same candidate, same id, across runs. */
export function candidateId(name, branch = null) {
  const kebab = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const stablePart = (value) => {
    const ascii = kebab(value);
    if (ascii) return ascii;
    return `u-${createHash("sha256").update(String(value).normalize("NFKC")).digest("hex").slice(0, 10)}`;
  };
  return `c-${stablePart(name)}${branch ? `--${stablePart(branch)}` : ""}`;
}

/** Make the control plane, not a model, own exact candidate-id transcription. Identity still
    comes only from name + branch; every relational reference follows the same canonical id.
    A semantic collision fails closed instead of merging two candidates. */
export function normalizeCandidateIds(doc) {
  const candidates = doc.candidates || [];
  const byOld = new Map();
  const owners = new Map();
  for (const candidate of candidates) {
    if (byOld.has(candidate.id)) {
      throw new ContractError(`duplicate candidate id "${candidate.id}" cannot be normalized safely`);
    }
    const canonical = candidateId(candidate.name, candidate.branch);
    const owner = owners.get(canonical);
    if (owner) {
      throw new ContractError(
        `candidate identity collision: "${owner.name}" and "${candidate.name}" both derive "${canonical}" — ` +
          `disambiguate the real branch/location; uniqueness cannot be repaired by guessing`,
      );
    }
    owners.set(canonical, candidate);
    byOld.set(candidate.id, canonical);
  }
  const ref = (id) => id == null ? id : (byOld.get(id) || id);
  const normalized = {
    ...doc,
    candidates: candidates.map((candidate) => ({ ...candidate, id: byOld.get(candidate.id) })),
    evidence: (doc.evidence || []).map((record) => ({ ...record, candidateId: ref(record.candidateId) })),
    reservations: (doc.reservations || []).map((record) => ({ ...record, candidateId: ref(record.candidateId) })),
    depth: doc.depth ? {
      ...doc.depth,
      reservations: {
        ...doc.depth.reservations,
        requiredCandidateIds: (doc.depth.reservations?.requiredCandidateIds || []).map(ref),
      },
    } : doc.depth,
  };
  return {
    doc: normalized,
    changed: candidates.some((candidate) => candidate.id !== byOld.get(candidate.id)),
  };
}

/** Fail-closed read. Returns null ONLY when the file does not exist. */
export async function readEvidence(slug, { intakeDir = INTAKE_DIR } = {}) {
  const file = evidencePath(slug, intakeDir);
  if (!existsSync(file)) return null;
  let raw;
  try {
    raw = JSON.parse(await readFile(file, "utf8"));
  } catch (err) {
    throw new ContractError(
      `evidence artifact at ${file} is not valid JSON (${err.message}) — a malformed required ` +
        `evidence artifact is a blocking failure, never "no evidence". Restore or fix it.`,
      { file },
    );
  }
  assertVersionCompatible(raw.schemaVersion, EVIDENCE_SCHEMA, { file });
  const doc = parseOrThrow(evidenceDocSchema, raw, { file, what: "V2 evidence artifact" });
  if (doc.slug !== slug) throw new ContractError(`evidence artifact at ${file} belongs to "${doc.slug}", not "${slug}"`, { file });
  return doc;
}

/** The blocking form: the artifact must exist AND validate. */
export async function requireEvidence(slug, { intakeDir = INTAKE_DIR, runId = null } = {}) {
  const doc = await readEvidence(slug, { intakeDir });
  if (!doc) {
    throw new ContractError(
      `required evidence artifact ${evidencePath(slug, intakeDir)} does not exist — the stage that ` +
        `owed it did not produce it. This is a blocking failure, not an empty result.`,
      { file: evidencePath(slug, intakeDir) },
    );
  }
  if (runId && doc.runId !== runId) {
    throw new ContractError(`evidence artifact for ${slug} belongs to run ${doc.runId}, not active run ${runId}`);
  }
  return doc;
}

export async function writeEvidence(slug, doc, { intakeDir = INTAKE_DIR } = {}) {
  const normalized = normalizeCandidateIds({ schemaVersion: EVIDENCE_SCHEMA, ...doc }).doc;
  const validated = parseOrThrow(evidenceDocSchema, normalized, {
    file: evidencePath(slug, intakeDir), what: "V2 evidence artifact (on write)",
  });
  if (validated.slug !== slug) throw new ContractError(`refusing to write ${validated.slug} evidence into ${slug}'s run directory`);
  await mkdir(path.join(intakeDir, slug), { recursive: true });
  await writeFile(evidencePath(slug, intakeDir), JSON.stringify(validated, null, 2) + "\n");
  return validated;
}

// ── structural validation (pure) ─────────────────────────────────────────────

/** Candidate-funnel violations: shipped-not-shortlisted, rejection without a reason, duplicate
    ids. Returns human-readable problems; empty = clean. */
export function candidateProblems(doc) {
  const problems = [];
  const seen = new Set();
  for (const c of doc.candidates) {
    if (seen.has(c.id)) problems.push(`duplicate candidate id "${c.id}"`);
    seen.add(c.id);
    const expectedId = candidateId(c.name, c.branch);
    if (c.id !== expectedId) problems.push(`candidate "${c.name}" has unstable id "${c.id}" — expected "${expectedId}" from name + branch`);
    if (c.status === "shortlisted" && !c.shortlisted) {
      problems.push(`"${c.name}" (${c.id}) has status shortlisted but shortlisted=false`);
    }
    if (c.status === "shipped" && !c.shortlisted) {
      problems.push(`"${c.name}" (${c.id}) is shipped but never shortlisted — shipped is not a side door around the shortlist stage`);
    }
    if ((c.status === "rejected" || c.status === "detour") && !c.reason) {
      problems.push(`"${c.name}" (${c.id}) is ${c.status} with no reason — the reason is the research evidence`);
    }
    if (c.worth && c.status !== "shipped" && c.status !== "detour") {
      problems.push(`"${c.name}" (${c.id}) carries "${c.worth}" but is ${c.status} — Worth labels belong to retained options`);
    }
  }
  return problems;
}

/** Independent findings (Pass-B origin evidence) that lack a typed disposition, plus dispositions
    pointing at findings that do not exist, plus double dispositions. */
export function dispositionProblems(doc) {
  const problems = [];
  const independent = doc.evidence.filter((e) => e.origin === "passB");
  const byFinding = new Map();
  for (const r of doc.reconciliation) {
    if (byFinding.has(r.findingId)) problems.push(`finding "${r.findingId}" has more than one disposition`);
    byFinding.set(r.findingId, r);
  }
  for (const e of independent) {
    if (!byFinding.has(e.id)) {
      problems.push(`independent finding "${e.id}" (${e.claim.slice(0, 60)}) has no reconciliation disposition — a silently dropped find fails the run`);
    }
  }
  const evidenceIds = new Set(doc.evidence.map((e) => e.id));
  for (const r of doc.reconciliation) {
    if (!evidenceIds.has(r.findingId)) {
      problems.push(`disposition for "${r.findingId}" points at no evidence record — a verdict on nothing proves nothing`);
    }
  }
  return problems;
}

/** Evidence records must be unique and relationally attached to real candidates. */
export function evidenceRecordProblems(doc) {
  const problems = [];
  const evidenceIds = new Set();
  const candidateIds = new Set(doc.candidates.map((c) => c.id));
  for (const e of doc.evidence) {
    if (evidenceIds.has(e.id)) problems.push(`duplicate evidence id "${e.id}"`);
    evidenceIds.add(e.id);
    if (e.candidateId && !candidateIds.has(e.candidateId)) {
      problems.push(`evidence "${e.id}" points at unknown candidate "${e.candidateId}"`);
    }
  }
  const reservationIds = new Set();
  for (const r of doc.reservations) {
    if (!candidateIds.has(r.candidateId)) problems.push(`reservation points at unknown candidate "${r.candidateId}"`);
    if (reservationIds.has(r.candidateId)) problems.push(`duplicate reservation record for "${r.candidateId}"`);
    reservationIds.add(r.candidateId);
  }
  return problems;
}

/** The adaptive stop record must EARN its stop (DECISIONS.md "Research breadth"): stopped=true
    requires (1) trend duplicates|weaker, and (2) unresolvedCouldChange answered false. A run
    still searching (stopped=false) owes nothing further. Also: a full pass owes the record. */
export function saturationProblems(doc, { fullPass = true } = {}) {
  const problems = [];
  const s = doc.saturation;
  if (!s) {
    if (fullPass) problems.push("no adaptive-search stop record — a full pass must record why searching stopped (or why it hasn't)");
    return problems;
  }
  if (fullPass && !s.stopped) {
    problems.push("full-pass research is explicitly still searching — final reconciliation cannot complete until saturation is earned");
  }
  if (s.stopped) {
    if (s.trend === "novel") {
      problems.push('saturation claims "stopped" while the trend is still "novel" — new searches were still producing new options; the stop was not earned');
    }
    if (s.unresolvedCouldChange !== false) {
      problems.push(
        s.unresolvedCouldChange === true
          ? "saturation claims \"stopped\" while unresolved evidence could still change the recommendation — investigate it or keep searching"
          : 'saturation claims "stopped" without answering whether unresolved evidence could change the recommendation — that question must be answered to stop',
      );
    }
  }
  return problems;
}

/** All structural problems in one list — the gate's single call. */
export function evidenceProblems(doc, { fullPass = true } = {}) {
  return [
    ...candidateProblems(doc),
    ...evidenceRecordProblems(doc),
    ...dispositionProblems(doc),
    ...saturationProblems(doc, { fullPass }),
  ];
}
