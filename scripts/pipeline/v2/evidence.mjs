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

    R-A scar (Tottori, b153af3 → b7fadad): the first version of this step diffed ONLY facts.json,
    while the critic's real authority covers every file in `src/content/guides/<slug>/`. That run
    rewrote 02-sights/03-transit/04-days/05-food-and-shopping/06-money-and-budget/_guide with
    substantive factual corrections, left facts.json byte-identical, and this step reported
    "unchanged" — so evidence.v2.json stayed stale while the guide moved. Now EVERY changed guide
    file must be accounted for: a factual edit as a `corrections` target whose before/after this
    step proves against the two workspaces, anything else as an explicit `editorialOnly`
    declaration. An undeclared edit fails the stage closed. The critic still never reads
    evidence.v2.json; naming the superseded records is this trusted plane's job, not its. */
export async function reconcileCriticCorrections(slug, {
  fromDir, intakeDir = INTAKE_DIR, guidesDir = path.join(ROOT, "src", "content", "guides"), runId,
} = {}) {
  const beforeDir = path.join(guidesDir, slug);
  const afterDir = path.join(fromDir, "src", "content", "guides", slug);
  const before = await readGuideFiles(beforeDir);
  const after = await readGuideFiles(afterDir);
  const changedFiles = [...new Set([...before.keys(), ...after.keys()])]
    .filter((name) => canonicalJson(before.get(name)) !== canonicalJson(after.get(name))).sort();
  const rel = path.join("guides-intake", slug, "critic-corrections.v2.json");
  const sourceFile = path.join(fromDir, rel);

  if (!changedFiles.length) {
    if (existsSync(sourceFile)) {
      const raw = JSON.parse(await readFile(sourceFile, "utf8"));
      if ((raw.corrections || []).length || (raw.editorialOnly || []).length) {
        throw new ContractError("critic declared guide corrections but no guide file changed");
      }
    }
    return { changed: false, targets: [] };
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
  // correction the critic made but did not declare is exactly an undeclared file.
  const factualFiles = new Set(correctionDoc.corrections.map((c) => targetFile(c.target)));
  const editorialFiles = new Set(correctionDoc.editorialOnly.map((e) => e.file));
  const both = [...factualFiles].filter((f) => editorialFiles.has(f));
  if (both.length) throw new ContractError(`critic handoff declares ${both.join(", ")} as both a factual correction and editorial-only`);
  const declared = new Set([...factualFiles, ...editorialFiles]);
  const undeclared = changedFiles.filter((f) => !declared.has(f));
  const phantom = [...declared].filter((f) => !changedFiles.includes(f)).sort();
  if (undeclared.length) {
    throw new ContractError(
      `critic changed ${undeclared.join(", ")} without declaring the edit in ${rel} — every edited guide file is ` +
        `either a factual correction (with its evidence) or an explicit editorial-only declaration; stale evidence is refused`,
    );
  }
  if (phantom.length) throw new ContractError(`critic handoff declares ${phantom.join(", ")}, which the critic did not change`);

  const targets = correctionDoc.corrections.map((c) => c.target);
  if (new Set(targets).size !== targets.length) throw new ContractError(`critic correction handoff repeats a target: ${targets.join(", ")}`);

  const evidence = await requireEvidence(slug, { intakeDir, runId });
  const superseded = [];
  for (const correction of correctionDoc.corrections) {
    assertCorrectionProven(correction, { before, after, slug });
    const recordId = `critic-correction-${kebab(correction.target)}`;
    const record = {
      id: recordId, candidateId: null, claim: `${correction.claim}: ${correction.correctedValue}`,
      kind: "objective", origin: "critic", source: correction.source,
      verifiedOn: correction.verifiedOn, firsthand: null, freshness: correction.freshness,
    };
    evidence.evidence = evidence.evidence.filter((item) => item.id !== recordId);
    evidence.evidence.push(record);
    // R-A, second half: appending the correction while the disproven record stays CURRENT is the
    // same desync in a new shape. The critic cannot name evidence ids (it never sees them), so
    // the trusted plane resolves them: any non-critic record still asserting the exact
    // previousValue the critic just corrected is superseded, explicitly, in machine state.
    const retires = correction.previousValue && correction.previousValue.trim().length >= 2
      ? evidence.evidence.filter((item) => item.origin !== "critic" && item.claim.includes(correction.previousValue)).map((item) => item.id)
      : [];
    evidence.reconciliation = evidence.reconciliation.filter((row) => row.findingId !== recordId);
    evidence.reconciliation.push({
      findingId: recordId,
      disposition: retires.length ? "replace" : "adopt",
      note: retires.length
        ? `critic correction at ${correction.target} supersedes ${retires.join(", ")}, which still asserted "${correction.previousValue}"`
        : `critic correction at ${correction.target}; no prior evidence record asserted the corrected value`,
      corroborates: [],
      supersedes: retires,
    });
    superseded.push(...retires);
  }

  await writeEvidence(slug, evidence, { intakeDir });
  await mkdir(path.join(intakeDir, slug), { recursive: true });
  await writeFile(path.join(intakeDir, slug, "critic-corrections.v2.json"), JSON.stringify(correctionDoc, null, 2) + "\n");
  return { changed: true, targets, superseded: [...new Set(superseded)] };
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
    gone, at an address that really exists in the edited file. */
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
      `critic correction "${correction.target}" names no title/name/label/key that exists in ${slug}'s ${file} after the edit`,
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

/** True once the document is written against a schema that carries the 2.3 relations. Documents
    written before them legitimately lack `corroborates`/`supersedes` and are not failed for it. */
function carriesRelations(doc) {
  const version = parseSchemaVersion(doc?.schemaVersion);
  return Boolean(version && version.name === "wp-evidence" && (version.major > 2 || (version.major === 2 && version.minor >= 3)));
}

/** Independent findings (Pass-B origin evidence) that lack a typed disposition, plus dispositions
    pointing at findings that do not exist, plus double dispositions — plus (2.3) the relational
    truth a reconciliation row asserts: what it corroborates and what it supersedes.

    R-F scar (Tottori, b153af3): `ev-jumbo-taxi` was dispositioned `replace` with a note saying it
    superseded "Pass A's weak taxi fallback". Nothing machine-readable named that record, so
    coverage could not tell the current replacement from the stale evidence it replaced. */
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
    const supersedes = r.supersedes || [];
    const corroborates = r.corroborates || [];
    if (supersedes.length && r.disposition !== "replace") {
      problems.push(`"${r.findingId}" is dispositioned "${r.disposition}" but names superseded evidence — only "replace" retires prior evidence`);
    }
    if (relational && r.disposition === "replace" && !supersedes.length) {
      problems.push(
        `"${r.findingId}" replaces prior evidence without naming it in supersedes — ` +
          `coverage cannot tell the replacement from what it replaced, so the replacement is refused`,
      );
    }
    if (relational && r.disposition === "agree" && !corroborates.length) {
      problems.push(
        `"${r.findingId}" is dispositioned "agree" without naming what it agrees with in corroborates — ` +
          `cross-pass agreement must be explicit before it can be checked for real independence`,
      );
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
