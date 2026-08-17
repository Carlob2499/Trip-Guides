// PIPELINE V2 — intake-ask coverage: every material ask is validated into the guide, or excluded
// honestly with a reason. A nonempty arbitrary string is not proof of coverage — a covered ask
// must point at real group-file refs, and an excluded one must say why.
//
// File: guides-intake/<slug>/coverage.v2.json (beside V1's coverage.json, never replacing it).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  COVERAGE_SCHEMA, coverageDocSchema, parseOrThrow, assertVersionCompatible, ContractError,
} from "./contracts.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const INTAKE_DIR = path.join(ROOT, "guides-intake");

export function coveragePath(slug, intakeDir = INTAKE_DIR) {
  return path.join(intakeDir, slug, "coverage.v2.json");
}

/** Fail-closed read. Returns null ONLY when the file does not exist. */
export async function readCoverage(slug, { intakeDir = INTAKE_DIR } = {}) {
  const file = coveragePath(slug, intakeDir);
  if (!existsSync(file)) return null;
  let raw;
  try {
    raw = JSON.parse(await readFile(file, "utf8"));
  } catch (err) {
    throw new ContractError(
      `coverage artifact at ${file} is not valid JSON (${err.message}) — a malformed required ` +
        `artifact is a blocking failure, never "no coverage". Restore or fix it.`,
      { file },
    );
  }
  assertVersionCompatible(raw.schemaVersion, COVERAGE_SCHEMA, { file });
  return parseOrThrow(coverageDocSchema, raw, { file, what: "V2 coverage artifact" });
}

export async function requireCoverage(slug, { intakeDir = INTAKE_DIR } = {}) {
  const doc = await readCoverage(slug, { intakeDir });
  if (!doc) {
    throw new ContractError(
      `required coverage artifact ${coveragePath(slug, intakeDir)} does not exist — coverage was ` +
        `never recorded. This is a blocking failure, not "everything covered".`,
      { file: coveragePath(slug, intakeDir) },
    );
  }
  return doc;
}

export async function writeCoverage(slug, doc, { intakeDir = INTAKE_DIR } = {}) {
  const validated = parseOrThrow(coverageDocSchema, { schemaVersion: COVERAGE_SCHEMA, ...doc }, {
    file: coveragePath(slug, intakeDir), what: "V2 coverage artifact (on write)",
  });
  await mkdir(path.join(intakeDir, slug), { recursive: true });
  await writeFile(coveragePath(slug, intakeDir), JSON.stringify(validated, null, 2) + "\n");
  return validated;
}

// ── validation (pure) ────────────────────────────────────────────────────────

/** Coverage problems: a covered ask with no structured refs, an excluded ask with no reason,
    refs into groups the guide doesn't have, duplicate ask ids. `groups` = the guide's real
    NN-<group>.json filenames (pass null to skip existence checking). */
export function coverageProblems(doc, { groups = null } = {}) {
  const problems = [];
  const seen = new Set();
  for (const ask of doc.asks) {
    if (seen.has(ask.id)) problems.push(`duplicate ask id "${ask.id}"`);
    seen.add(ask.id);
    if (ask.status === "covered") {
      if (!ask.where.length) {
        problems.push(`ask "${ask.id}" (${ask.ask.slice(0, 60)}) claims covered with no group refs — a claim of coverage is not proof of coverage`);
      } else if (groups) {
        for (const ref of ask.where) {
          const file = ref.split("#")[0];
          if (!groups.includes(file)) {
            problems.push(`ask "${ask.id}" points at ${file}, which is not a group file of this guide (${groups.join(", ") || "none"})`);
          }
        }
      }
    }
    if (ask.status === "excluded" && !(ask.reason && ask.reason.trim())) {
      problems.push(`ask "${ask.id}" (${ask.ask.slice(0, 60)}) is excluded with no reason — an honest exclusion names why`);
    }
  }
  if (!doc.asks.length) problems.push("coverage document lists no asks — the intake's material asks were never enumerated");
  return problems;
}
