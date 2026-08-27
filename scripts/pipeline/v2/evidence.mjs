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

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  EVIDENCE_SCHEMA, CRITIC_CORRECTIONS_SCHEMA, GUIDE_FILE, evidenceDocSchema, criticCorrectionDocSchema,
  parseOrThrow, assertVersionCompatible, ContractError,
} from "./contracts.mjs";
import { collectAnchors } from "./coverage.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const INTAKE_DIR = path.join(ROOT, "guides-intake");

export function evidencePath(slug, intakeDir = INTAKE_DIR) {
  return path.join(intakeDir, slug, "evidence.v2.json");
}

/** One kebab rule for every derived id in this module (candidate ids, critic-record ids). */
const kebab = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Stable, deterministic candidate id from identity — same candidate, same id, across runs. */
export function candidateId(name, branch = null) {
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

/** Reconcile a blind critic's guide edits into the existing evidence owner.

    R-A scar (Tottori, b153af3 → b7fadad): this step used to diff ONLY facts.json, while the
    critic's authority covers every file in `src/content/guides/<slug>/`. That run rewrote six
    ordinary guide files with substantive corrections, left facts.json byte-identical, reported
    "unchanged", and evidence.v2.json stayed stale against the guide.

    Every changed guide file now owes at least one `corrections` row this step proves against the
    two workspaces. There is no editorial exemption — see contracts.mjs for why the guide contract
    cannot prove "I only reworded it". The critic never reads evidence.v2.json; naming the records
    a correction retires is this trusted plane's job. */
export async function reconcileCriticCorrections(slug, {
  fromDir, intakeDir = INTAKE_DIR, guidesDir = path.join(ROOT, "src", "content", "guides"), runId,
} = {}) {
  const before = await readGuideFiles(path.join(guidesDir, slug));
  const after = await readGuideFiles(path.join(fromDir, "src", "content", "guides", slug));
  const changedFiles = [...new Set([...before.keys(), ...after.keys()])]
    .filter((name) => canonicalJson(before.get(name)) !== canonicalJson(after.get(name))).sort();
  const rel = path.join("guides-intake", slug, "critic-corrections.v2.json");
  const sourceFile = path.join(fromDir, rel);

  if (!changedFiles.length) {
    if (existsSync(sourceFile)) {
      const raw = JSON.parse(await readFile(sourceFile, "utf8"));
      if ((raw.corrections || []).length) throw new ContractError("critic declared guide corrections but no guide file changed");
    }
    return { changed: false, targets: [], superseded: [] };
  }
  if (!existsSync(sourceFile)) {
    throw new ContractError(`critic changed ${changedFiles.join(", ")} without ${rel} — stale evidence is refused`);
  }
  const raw = JSON.parse(await readFile(sourceFile, "utf8"));
  assertVersionCompatible(raw.schemaVersion, CRITIC_CORRECTIONS_SCHEMA, { file: sourceFile });
  const correctionDoc = parseOrThrow(criticCorrectionDocSchema, raw, { file: sourceFile, what: "critic correction handoff" });
  if (correctionDoc.slug !== slug || correctionDoc.runId !== runId) {
    throw new ContractError(`critic correction identity does not match ${slug}/${runId}`);
  }

  // Declared set === changed set, both directions. This is the whole R-A repair: a factual
  // correction the critic made but did not declare is exactly an unaccounted-for file.
  const declared = new Set(correctionDoc.corrections.map((c) => targetFile(c.target)));
  const undeclared = changedFiles.filter((f) => !declared.has(f));
  const phantom = [...declared].filter((f) => !changedFiles.includes(f)).sort();
  if (undeclared.length) {
    throw new ContractError(
      `critic changed ${undeclared.join(", ")} without a proven correction in ${rel} — every edited guide file owes ` +
        `at least one correction carrying its before/after value and source; stale evidence is refused`,
    );
  }
  if (phantom.length) throw new ContractError(`critic handoff declares ${phantom.join(", ")}, which the critic did not change`);

  const keys = correctionDoc.corrections.map((c) => `${c.target}\u0000${c.claim}`);
  if (new Set(keys).size !== keys.length) throw new ContractError("critic correction handoff repeats a target + claim pair");

  const evidence = await requireEvidence(slug, { intakeDir, runId });
  const superseded = [];
  for (const correction of correctionDoc.corrections) {
    assertCorrectionProven(correction, { before, after, slug });
    const recordId = criticRecordId(correction);
    // A correction can retire prior evidence, but only where the artifact PROVES the link: the
    // record cites the same origin the corrected item cites, AND still asserts the value the
    // critic removed. A bare value scan is not scope — Tottori alone carries "¥800" in the Sand
    // Museum's admission and in Sanbutsu-ji's waraji rental, two unrelated entities.
    const retires = supersededByCorrection(correction, { evidence, before });
    evidence.evidence = evidence.evidence.filter((item) => item.id !== recordId);
    evidence.evidence.push({
      id: recordId, candidateId: null, claim: `${correction.claim}: ${correction.correctedValue}`,
      kind: "objective", origin: "critic", source: correction.source,
      verifiedOn: correction.verifiedOn, firsthand: null, freshness: correction.freshness,
    });
    evidence.reconciliation = evidence.reconciliation.filter((row) => row.findingId !== recordId);
    evidence.reconciliation.push({
      findingId: recordId,
      disposition: retires.length ? "replace" : "adopt",
      note: retires.length
        ? `critic correction at ${correction.target} supersedes ${retires.join(", ")}: same cited origin, still asserting "${correction.previousValue}"`
        : `critic correction at ${correction.target}; no evidence record both cites this item's origin and still asserts the value it replaced`,
      corroborates: [],
      supersedes: retires,
    });
    superseded.push(...retires);
  }

  await writeEvidence(slug, evidence, { intakeDir });
  await mkdir(path.join(intakeDir, slug), { recursive: true });
  await writeFile(path.join(intakeDir, slug, "critic-corrections.v2.json"), JSON.stringify(correctionDoc, null, 2) + "\n");
  return { changed: true, targets: correctionDoc.corrections.map((c) => c.target), superseded: [...new Set(superseded)] };
}

/** Stable per-correction id. Several corrections legitimately share one target — the historical
    Tottori transit item moved route identity, last departure and service gap independently — so
    identity is target + claim, never target alone. */
function criticRecordId(correction) {
  const digest = createHash("sha256").update(correction.claim.normalize("NFKC")).digest("hex").slice(0, 8);
  return `critic-correction-${kebab(correction.target)}-${digest}`;
}

/** The records a correction provably retires: records citing the SAME ORIGIN the corrected guide
    item itself cites, which still assert the exact value the critic removed. Both halves are
    per-record structure, so nothing is retired by resemblance.

    Coverage's ask→ref and ask→evidence links look like the same thing and are not: an ask spans
    several refs, so joining through it retires evidence belonging to the ask's OTHER locations.
    Proven on the real artifact — Tottori's BINDING `constraints` ask points at both the transit
    ref and Sanbutsu-ji, so a transit correction would have retired the ¥800 waraji record. */
function supersededByCorrection(correction, { evidence, before }) {
  if (!correction.previousValue?.trim()) return [];
  const origins = correctedOrigins(correction, before);
  if (!origins.size) return [];
  return evidence.evidence
    .filter((record) => record.origin !== "critic" && origins.has(record.source?.url) &&
      record.claim.includes(correction.previousValue))
    .map((record) => record.id);
}

/** The source URLs the corrected item cited BEFORE the edit: the fact row's for facts.json,
    otherwise every `source_url` under the node the anchor addresses. */
function correctedOrigins(correction, before) {
  const file = targetFile(correction.target);
  const key = targetKey(correction.target);
  const text = before.get(file);
  if (text === undefined) return new Set();
  const doc = JSON.parse(text);
  if (file === "facts.json") return new Set([doc[key]?.source_url].filter(Boolean));
  return originsAt(doc, key) ?? sourceUrls(doc[key] ?? null);
}

const ANCHOR_KEYS = ["id", "title", "name", "label", "heading", "day"];

/** Origins under the node whose id/title/name/label/heading/day slugifies to `anchor`; null when
    no node does. Same address rule as coverage refs — one anchor grammar, not two. */
function originsAt(value, anchor) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const hit = originsAt(item, anchor);
      if (hit) return hit;
    }
    return null;
  }
  if (!value || typeof value !== "object") return null;
  if (Object.entries(value).some(([k, v]) => ANCHOR_KEYS.includes(k) && typeof v === "string" && kebab(v) === anchor)) {
    return sourceUrls(value);
  }
  for (const item of Object.values(value)) {
    const hit = originsAt(item, anchor);
    if (hit) return hit;
  }
  return null;
}

function sourceUrls(value, out = new Set()) {
  if (Array.isArray(value)) for (const item of value) sourceUrls(item, out);
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (k === "source_url" && typeof v === "string") out.add(v);
      sourceUrls(v, out);
    }
  }
  return out;
}

async function readGuideFiles(dir) {
  const out = new Map();
  if (!existsSync(dir)) return out;
  for (const name of await readdir(dir)) {
    if (GUIDE_FILE.test(name)) out.set(name, await readFile(path.join(dir, name), "utf8"));
  }
  return out;
}

/** Formatting-insensitive comparison: a reserialized critic file is not a content change. */
function canonicalJson(text) {
  if (text === undefined) return undefined;
  try { return JSON.stringify(JSON.parse(text)); } catch { return text; }
}

const targetFile = (target) => target.slice(0, target.indexOf("#"));
const targetKey = (target) => target.slice(target.indexOf("#") + 1);

/** Prove a declared correction against the two workspaces. facts.json rows are canonical fact
    objects and keep the exact row-level proof; every other guide file is proved the only way a
    free-form document can be: the corrected value is present after and the value it replaced is
    gone, at a SLUGIFIED anchor (coverage's addressing rule, one owner) that exists after the edit. */
function assertCorrectionProven(correction, { before, after, slug }) {
  const file = targetFile(correction.target);
  const key = targetKey(correction.target);
  const afterText = after.get(file);
  if (afterText === undefined) throw new ContractError(`critic correction "${correction.target}" names a file this guide does not have`);
  if (file === "facts.json") {
    const beforeRow = JSON.parse(before.get(file) ?? "{}")[key] || null;
    const afterRow = JSON.parse(afterText)[key] || null;
    if (!afterRow || correction.previousValue !== (beforeRow?.value ?? null) || correction.correctedValue !== afterRow.value ||
        correction.claim !== afterRow.claim || correction.source.url !== afterRow.source_url || correction.verifiedOn !== afterRow.verified_on) {
      throw new ContractError(`critic correction "${correction.target}" does not match the actual facts.json before/after/source truth`);
    }
    return;
  }
  const afterDoc = JSON.parse(afterText);
  const addresses = collectAnchors(afterDoc);
  for (const name of Object.keys(afterDoc)) addresses.add(name);
  if (!addresses.has(key)) {
    throw new ContractError(
      `critic correction "${correction.target}" names no slugified title/name/label or top-level key that exists in ` +
        `${slug}'s ${file} after the edit — legal anchors are the same ones coverage refs use`,
    );
  }
  if (!afterText.includes(correction.correctedValue)) {
    throw new ContractError(`critic correction "${correction.target}" claims a corrected value that does not appear in the edited ${file}`);
  }
  if (correction.previousValue !== null) {
    const beforeText = before.get(file);
    if (beforeText === undefined || !beforeText.includes(correction.previousValue)) {
      throw new ContractError(`critic correction "${correction.target}" claims a previous value that ${file} never contained`);
    }
    if (afterText.includes(correction.previousValue)) {
      throw new ContractError(`critic correction "${correction.target}" claims to have replaced a value that is still present in ${file}`);
    }
  }
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

/** Independent findings (Pass-B origin evidence) that lack a typed disposition, dispositions
    pointing at findings that do not exist, double dispositions — plus (2.3) the relations a row
    asserts: `corroborates` and `supersedes`, referentially validated.

    R-F scar (Tottori, b153af3): `ev-jumbo-taxi` was dispositioned `replace` with the record it
    retired named only in `note`, so coverage could not tell replacement from replaced. Neither
    relation is ever DEMANDED, because the artifacts disprove both would-be rules: that same row
    retires nothing recorded (the Pass-A taxi fallback has no evidence record, so requiring an id
    only teaches the reconciler to invent one), and Uruguay uses `agree` for concurrence with Pass
    B's own shortlist call on deliberately single-sourced leads. */
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
    const supersedes = r.supersedes || [];
    const corroborates = r.corroborates || [];
    if (supersedes.length && r.disposition !== "replace") {
      problems.push(`"${r.findingId}" is dispositioned "${r.disposition}" but names superseded evidence — only "replace" retires prior evidence`);
    }
    for (const [field, ids] of [["supersedes", supersedes], ["corroborates", corroborates]]) {
      for (const id of ids) {
        if (id === r.findingId) problems.push(`"${r.findingId}" ${field} itself`);
        else if (!evidenceIds.has(id)) problems.push(`"${r.findingId}" ${field} unknown evidence id "${id}"`);
      }
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
