// Pipeline V3 artifact compiler.
//
// Models own research judgments: names, claims, sources, dispositions and prose. The trusted
// control plane owns deterministic transport metadata: artifact identity, schema versions,
// candidate ids and stage origin. Frozen intake still owns the exact coverage registry; the
// compiler only normalizes noncanonical row labels before that registry is validated. Keeping
// that distinction in one deep module
// prevents paid research turns from being spent repairing bookkeeping the workflow already knows.

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  EVIDENCE_SCHEMA,
  COVERAGE_SCHEMA,
  CRITIC_CORRECTIONS_SCHEMA,
  evidenceDocSchema,
  coverageDocSchema,
  criticCorrectionDocSchema,
  parseOrThrow,
  ContractError,
} from "../v2/contracts.mjs";
import { normalizeCandidateIds } from "../v2/evidence.mjs";
import { readRunStateV2 } from "../v2/run-state.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const INTAKE_DIR = path.join(ROOT, "guides-intake");

const kebab = (value) => String(value).toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

function stablePart(value) {
  const ascii = kebab(value);
  if (ascii) return ascii;
  return `u-${createHash("sha256").update(String(value).normalize("NFKC")).digest("hex").slice(0, 10)}`;
}

function requireIdentity({ slug, runId } = {}) {
  if (!slug || !runId) throw new ContractError("V3 compilation requires trusted slug and runId metadata");
  return { slug, runId };
}

/** Compile a Pass A, Pass B, or merged evidence envelope into the proven V2 evidence contract. */
export function compileEvidenceEnvelope(raw, { slug, runId, origin = null } = {}) {
  requireIdentity({ slug, runId });
  const evidence = (raw?.evidence || []).map((record) => origin ? { ...record, origin } : { ...record });
  const controlled = {
    ...raw,
    schemaVersion: EVIDENCE_SCHEMA,
    slug,
    runId,
    evidence,
  };
  const normalized = normalizeCandidateIds(controlled).doc;
  return parseOrThrow(evidenceDocSchema, normalized, { what: "V3 compiled evidence artifact" });
}

/** Normalize noncanonical coverage labels; the later gate enforces frozen-intake registry ids. */
export function compileCoverageEnvelope(raw, { slug, runId } = {}) {
  requireIdentity({ slug, runId });
  const owners = new Map();
  const asks = (raw?.asks || []).map((ask) => {
    // Intake-generated ids (for example `constraints`) are already control-plane values and
    // remain stable across stages. Human/model labels containing spaces or punctuation are
    // normalized from the ask text instead of becoming a second identity system.
    const id = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(ask.id || ""))
      ? ask.id
      : `ask-${stablePart(ask.ask)}`;
    const owner = owners.get(id);
    if (owner && owner !== ask.ask) {
      throw new ContractError(`coverage ask identity collision: "${owner}" and "${ask.ask}" both derive "${id}"`);
    }
    owners.set(id, ask.ask);
    return { ...ask, id };
  });
  return parseOrThrow(coverageDocSchema, {
    ...raw,
    schemaVersion: COVERAGE_SCHEMA,
    slug,
    runId,
    asks,
  }, { what: "V3 compiled coverage artifact" });
}

/** The critic owns the correction facts; the control plane owns the handoff identity. */
export function compileCriticCorrectionEnvelope(raw, { slug, runId } = {}) {
  requireIdentity({ slug, runId });
  return parseOrThrow(criticCorrectionDocSchema, {
    ...raw,
    schemaVersion: CRITIC_CORRECTIONS_SCHEMA,
    slug,
    runId,
  }, { what: "V3 compiled critic correction artifact" });
}

async function readRaw(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (err) {
    throw new ContractError(`V3 cannot compile ${file}: ${err.message}`, { file });
  }
}

async function compileFile(file, compile) {
  if (!existsSync(file)) return false;
  const doc = compile(await readRaw(file));
  await writeFile(file, JSON.stringify(doc, null, 2) + "\n");
  return true;
}

/**
 * Compile every model-owned envelope owed by a stage before the existing validators see it.
 * Missing files remain missing so the stage validator—not this compiler—reports the owed-output
 * failure through the normal durable feedback path.
 */
export async function compileStageArtifacts(slug, stage, {
  intakeDir = INTAKE_DIR,
  fromDir = null,
} = {}) {
  const state = await readRunStateV2(slug, { intakeDir });
  if (!state) throw new ContractError(`V3 cannot compile ${slug}: no durable run state exists`);
  if (state.engine !== "v3") {
    throw new ContractError(`V3 compiler refuses run ${state.runId}: durable engine is "${state.engine}"`);
  }
  const identity = { slug, runId: state.runId };
  const runDir = path.join(intakeDir, slug);
  // collect-stage compiles inside the untrusted agent workspace BEFORE the proven V2
  // projection parser sees the artifact. finish-stage omits fromDir and recompiles the
  // trusted checkout defensively. The durable run identity always comes from intakeDir.
  const artifactRunDir = fromDir ? path.join(fromDir, "guides-intake", slug) : runDir;
  const compiled = [];
  const add = async (name, file, compile) => {
    if (await compileFile(file, compile)) compiled.push(name);
  };

  if (stage === "passA") {
    await add("evidence.v2.json", path.join(artifactRunDir, "evidence.v2.json"),
      (raw) => compileEvidenceEnvelope(raw, { ...identity, origin: "passA" }));
  } else if (stage === "passB") {
    if (!fromDir) throw new ContractError("V3 Pass B compilation requires its isolated workspace");
    const file = path.join(artifactRunDir, "passB.v2.json");
    await add("passB.v2.json", file,
      (raw) => compileEvidenceEnvelope(raw, { ...identity, origin: "passB" }));
  } else if (stage === "reconcile") {
    await add("evidence.v2.json", path.join(artifactRunDir, "evidence.v2.json"),
      (raw) => compileEvidenceEnvelope(raw, identity));
    await add("coverage.v2.json", path.join(artifactRunDir, "coverage.v2.json"),
      (raw) => compileCoverageEnvelope(raw, identity));
  } else if (stage === "critic") {
    if (!fromDir) throw new ContractError("V3 critic compilation requires its isolated workspace");
    const file = path.join(artifactRunDir, "critic-corrections.v2.json");
    await add("critic-corrections.v2.json", file,
      (raw) => compileCriticCorrectionEnvelope(raw, identity));
  } else if (stage !== "scaffold") {
    throw new ContractError(`V3 compiler does not know stage "${stage}"`);
  }

  return { runId: state.runId, stage, compiled };
}
