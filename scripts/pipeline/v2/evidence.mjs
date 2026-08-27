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
  parseOrThrow, assertVersionCompatible, parseSchemaVersion, ContractError,
} from "./contracts.mjs";

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
    ordinary guide files with substantive factual corrections, left facts.json byte-identical,
    and the step reported "unchanged" — so evidence stayed stale while the guide moved.

    The accounting is now exhaustive and structural: every changed LEAF is a declared correction,
    proved at its exact location. There is deliberately no "editorial only" declaration — a
    critic classifying its own rewrite as fact-free is an assertion, not proof, so that portion
    fails closed. The critic still never reads evidence.v2.json. */
export async function reconcileCriticCorrections(slug, {
  fromDir, intakeDir = INTAKE_DIR, guidesDir = path.join(ROOT, "src", "content", "guides"), runId,
} = {}) {
  const before = await readGuideDocs(path.join(guidesDir, slug));
  const after = await readGuideDocs(path.join(fromDir, "src", "content", "guides", slug));
  // LOCATIONS, not files: "<file>#<pointer>" per changed leaf. That is what makes several
  // independent facts inside one item addressable, and an undeclared change impossible to hide.
  const changed = new Set([...new Set([...before.keys(), ...after.keys()])]
    .flatMap((name) => changedPointers(before.get(name), after.get(name)).map((p) => `${name}#${p}`)));
  const rel = path.join("guides-intake", slug, "critic-corrections.v2.json");
  const sourceFile = path.join(fromDir, rel);

  if (!changed.size) {
    if (existsSync(sourceFile)) {
      const raw = JSON.parse(await readFile(sourceFile, "utf8"));
      if ((raw.corrections || []).length) throw new ContractError("critic declared guide corrections but no guide value changed");
    }
    return { changed: false, targets: [] };
  }
  if (!existsSync(sourceFile)) {
    throw new ContractError(`critic changed ${[...changed].sort().join(", ")} without ${rel} — stale evidence is refused`);
  }
  const raw = JSON.parse(await readFile(sourceFile, "utf8"));
  assertVersionCompatible(raw.schemaVersion, CRITIC_CORRECTIONS_SCHEMA, { file: sourceFile });
  const correctionDoc = parseOrThrow(criticCorrectionDocSchema, raw, { file: sourceFile, what: "critic correction handoff" });
  if (correctionDoc.slug !== slug || correctionDoc.runId !== runId) {
    throw new ContractError(`critic correction identity does not match ${slug}/${runId}`);
  }

  // Declared set === changed set, both directions. This is the whole R-A repair.
  const targets = correctionDoc.corrections.map((c) => c.target);
  const declared = new Set(targets);
  if (declared.size !== targets.length) throw new ContractError(`critic correction handoff repeats a target: ${targets.join(", ")}`);
  const undeclared = [...changed].filter((t) => !declared.has(t)).sort();
  const phantom = targets.filter((t) => !changed.has(t)).sort();
  if (undeclared.length) {
    throw new ContractError(
      `critic changed ${undeclared.join(", ")} without declaring the edit in ${rel} — every changed guide value is a ` +
        `factual correction carrying its own evidence, and there is no editorial-only escape; stale evidence is refused`,
    );
  }
  if (phantom.length) throw new ContractError(`critic handoff declares ${phantom.join(", ")}, which the critic did not change`);

  const evidence = await requireEvidence(slug, { intakeDir, runId });
  const superseded = [];
  for (const correction of correctionDoc.corrections) {
    assertCorrectionProven(correction, { before, after });
    const recordId = `critic-correction-${kebab(correction.target)}`;
    evidence.evidence = evidence.evidence.filter((item) => item.id !== recordId);
    evidence.evidence.push({
      id: recordId, candidateId: null, claim: `${correction.claim}: ${correction.correctedValue}`,
      kind: "objective", origin: "critic", source: correction.source,
      verifiedOn: correction.verifiedOn, firsthand: null, freshness: correction.freshness,
    });
    // A correction retires prior evidence only where the artifact PROVES the link: the corrected
    // item stopped citing the origin, and the record rests on that origin. The critic never sees
    // evidence ids, so naming them stays the trusted plane's job.
    const dropped = retiredOrigin(correction.target, { before, after });
    const retires = dropped
      ? evidence.evidence.filter((item) => item.origin !== "critic" && item.source?.url === dropped).map((item) => item.id)
      : [];
    superseded.push(...retires);
    evidence.reconciliation = evidence.reconciliation.filter((row) => row.findingId !== recordId);
    evidence.reconciliation.push({
      findingId: recordId,
      disposition: retires.length ? "replace" : "adopt",
      note: retires.length
        ? `critic correction at ${correction.target} re-sourced the item off ${dropped}, retiring ${retires.join(", ")}`
        : `critic correction proved at ${correction.target}; the item still cites the origin its evidence rests on`,
      corroborates: { kind: "none", evidenceIds: [] },
      ...(retires.length ? { supersedes: { kind: "evidence", evidenceIds: retires } } : {}),
    });
  }

  await writeEvidence(slug, evidence, { intakeDir });
  await mkdir(path.join(intakeDir, slug), { recursive: true });
  await writeFile(path.join(intakeDir, slug, "critic-corrections.v2.json"), JSON.stringify(correctionDoc, null, 2) + "\n");
  return { changed: true, targets, superseded: [...new Set(superseded)] };
}

/** The guide directory, parsed. Parsing here makes reserialization invisible to the diff and a
    malformed guide file a blocking failure rather than a silent text comparison. */
async function readGuideDocs(dir) {
  const out = new Map();
  if (!existsSync(dir)) return out;
  for (const name of (await readdir(dir)).filter((n) => GUIDE_FILE.test(n))) {
    const file = path.join(dir, name);
    try { out.set(name, JSON.parse(await readFile(file, "utf8"))); }
    catch (err) { throw new ContractError(`guide file ${file} is not valid JSON (${err.message})`, { file }); }
  }
  return out;
}

/** Every JSON-pointer location whose leaf value differs between two parsed guide documents. */
function changedPointers(before, after, at = "") {
  const branch = (v) => v !== null && typeof v === "object";
  if (branch(before) && branch(after) && Array.isArray(before) === Array.isArray(after)) {
    return [...new Set([...Object.keys(before), ...Object.keys(after)])]
      .flatMap((key) => changedPointers(before[key], after[key], `${at}/${String(key).replace(/~/g, "~0").replace(/\//g, "~1")}`));
  }
  const encode = (v) => v === undefined ? "\u0000absent" : JSON.stringify(v);
  return encode(before) === encode(after) ? [] : [at || "/"];
}

const splitTarget = (target) => [target.slice(0, target.indexOf("#")), target.slice(target.indexOf("#") + 1)];
const pointerParts = (pointer) => pointer.split("/").slice(1).map((raw) => raw.replace(/~1/g, "/").replace(/~0/g, "~"));

/** The node a pointer path addresses, or undefined when it addresses nothing. */
function nodeAt(doc, parts) {
  let node = doc;
  for (const key of parts) {
    if (node === null || typeof node !== "object" || !(key in node)) return undefined;
    node = node[key];
  }
  return node;
}

/** The value at a JSON pointer as TEXT, or null when the pointer addresses nothing. */
function textAt(doc, pointer) {
  const node = nodeAt(doc, pointerParts(pointer));
  if (node === undefined) return null;
  return typeof node === "string" ? node : JSON.stringify(node);
}

/** The origin a proven correction RETIRES, if any: the `source_url` the corrected item cited
    BEFORE the edit and no longer cites after it. That `source_url` is the artifact's only
    machine-readable link between a guide location and the evidence behind it, so supersession
    rides on the link being dropped — never on scanning claims for a value. #107 retired every
    record whose claim CONTAINED previousValue: real Tottori evidence carries "¥800" on the Sand
    Museum's admission and on Sanbutsu-ji's waraji rental, so one transit edit retired both. */
function retiredOrigin(target, { before, after }) {
  const [file, pointer] = splitTarget(target);
  const parts = pointerParts(pointer);
  for (let depth = parts.length; depth >= 0; depth--) {
    const at = parts.slice(0, depth);
    const url = nodeAt(before.get(file), at)?.source_url;
    if (typeof url !== "string" || !url) continue;
    return nodeAt(after.get(file), at)?.source_url === url ? null : url;
  }
  return null;
}

/** Prove a declared correction at the exact addressed node. #107 asked instead whether
    previousValue/correctedValue appeared ANYWHERE in the raw file text — which a repeated string
    or a JSON-escaped quote defeats in both directions. Here the value is read, not searched. */
function assertCorrectionProven(correction, { before, after }) {
  const [file, pointer] = splitTarget(correction.target);
  const refuse = (what) => { throw new ContractError(`critic correction "${correction.target}" declares a ${what} that is not what ${file} holds there`); };
  if (textAt(after.get(file), pointer) !== correction.correctedValue) refuse("correctedValue");
  if (textAt(before.get(file), pointer) !== correction.previousValue) refuse("previousValue (before the edit)");
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

/** True once the document is written against a schema that carries the 2.3 relations. Documents
    written before them legitimately lack `corroborates`/`supersedes` and are not failed for it. */
function carriesRelations(doc) {
  const version = parseSchemaVersion(doc?.schemaVersion);
  return Boolean(version && version.name === "wp-evidence" && (version.major > 2 || (version.major === 2 && version.minor >= 3)));
}

/** The 2.3 relation rules for ONE row. Both relations are typed discriminators, and the kinds
    that name no evidence record must name none — an id is never invented to satisfy a shape. */
function relationProblems(row, evidenceIds) {
  const problems = [];
  const check = (field, relation, namingKinds) => {
    const ids = relation.evidenceIds || [];
    if (namingKinds.includes(relation.kind)) {
      if (!ids.length) problems.push(`"${row.findingId}" declares ${field} kind "${relation.kind}" but names no evidence record`);
    } else if (ids.length) {
      problems.push(`"${row.findingId}" declares ${field} kind "${relation.kind}", which names no record, yet lists ${ids.join(", ")}`);
    }
    for (const id of ids) {
      if (id === row.findingId) problems.push(`"${row.findingId}" ${field} itself`);
      else if (!evidenceIds.has(id)) problems.push(`"${row.findingId}" ${field} unknown evidence id "${id}"`);
    }
  };
  // Silence is not "nothing to declare": the historical `adopt` row whose NOTE claimed it
  // corroborated Pass A's ev-yohaijo-details had no relation at all, so nothing downstream could
  // test it. At 2.3 the row must ANSWER, and the artifact is refused until it does.
  if (!row.corroborates) {
    problems.push(
      `"${row.findingId}" does not declare what it corroborates — every 2.3 reconciliation row states a ` +
        `corroborates kind ("factual" with the records it confirms, "recommendation", or "none"); a note is not a relation`,
    );
  } else check("corroborates", row.corroborates, ["factual"]);
  if (row.disposition === "replace") {
    if (!row.supersedes) {
      problems.push(
        `"${row.findingId}" replaces prior work without declaring what — a "replace" row states a supersedes kind ` +
          `("evidence" with the records it retires, or "recommendation" when it replaces a conclusion that was never an evidence record)`,
      );
    } else check("supersedes", row.supersedes, ["evidence"]);
  } else if (row.supersedes) {
    problems.push(`"${row.findingId}" is dispositioned "${row.disposition}" but declares supersedes — only "replace" retires prior work`);
  }
  return problems;
}

/** Independent findings (Pass-B origin evidence) that lack a typed disposition, plus dispositions
    pointing at findings that do not exist, plus double dispositions — plus (2.3) the relational
    truth a reconciliation row asserts: what it corroborates and what it supersedes.

    R-F scar (Tottori, b153af3): `ev-jumbo-taxi` was dispositioned `replace` with a note saying it
    superseded "Pass A's weak taxi fallback". That fallback was a Pass-A CONCLUSION, never an
    evidence record — so the honest repair is a relation that can say so, not a required id list
    that would be satisfied by inventing one. */
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
  const relational = carriesRelations(doc);
  for (const r of doc.reconciliation) {
    if (!evidenceIds.has(r.findingId)) {
      problems.push(`disposition for "${r.findingId}" points at no evidence record — a verdict on nothing proves nothing`);
    }
    if (relational) problems.push(...relationProblems(r, evidenceIds));
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
