// PIPELINE V2 — intake-ask coverage: every material ask is validated into the guide, or excluded
// honestly with a reason. A nonempty arbitrary string is not proof of coverage — a covered ask
// must point at real group-file refs, and an excluded one must say why.
//
// File: guides-intake/<slug>/coverage.v2.json (beside V1's coverage.json, never replacing it).

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  COVERAGE_SCHEMA, coverageDocSchema, parseOrThrow, assertVersionCompatible, supersededEvidenceIds, ContractError,
} from "./contracts.mjs";
import { qualifyingEvidence } from "./research-rules.mjs";

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
  const doc = parseOrThrow(coverageDocSchema, raw, { file, what: "V2 coverage artifact" });
  if (doc.slug !== slug) throw new ContractError(`coverage artifact at ${file} belongs to "${doc.slug}", not "${slug}"`, { file });
  return doc;
}

export async function requireCoverage(slug, { intakeDir = INTAKE_DIR, runId = null } = {}) {
  const doc = await readCoverage(slug, { intakeDir });
  if (!doc) {
    throw new ContractError(
      `required coverage artifact ${coveragePath(slug, intakeDir)} does not exist — coverage was ` +
        `never recorded. This is a blocking failure, not "everything covered".`,
      { file: coveragePath(slug, intakeDir) },
    );
  }
  if (doc.slug !== slug) throw new ContractError(`coverage artifact belongs to "${doc.slug}", not "${slug}"`);
  if (runId && doc.runId !== runId) throw new ContractError(`coverage artifact for ${slug} belongs to run ${doc.runId}, not active run ${runId}`);
  return doc;
}

export async function writeCoverage(slug, doc, { intakeDir = INTAKE_DIR } = {}) {
  const validated = parseOrThrow(coverageDocSchema, { schemaVersion: COVERAGE_SCHEMA, ...doc }, {
    file: coveragePath(slug, intakeDir), what: "V2 coverage artifact (on write)",
  });
  if (validated.slug !== slug) throw new ContractError(`refusing to write ${validated.slug} coverage into ${slug}'s run directory`);
  await mkdir(path.join(intakeDir, slug), { recursive: true });
  await writeFile(coveragePath(slug, intakeDir), JSON.stringify(validated, null, 2) + "\n");
  return validated;
}

// ── validation (pure) ────────────────────────────────────────────────────────

/** Coverage problems: a covered ask with no structured refs, an excluded ask with no reason,
    refs into groups the guide doesn't have, duplicate ask ids. `groups` = the guide's real
    NN-<group>.json filenames (pass null to skip existence checking). */
export function coverageProblems(doc, {
  groups = null, groupAnchors = null, expectedAskIds = null, evidenceIds = null,
  evidenceDoc = null, bindingAskIds = new Set(),
} = {}) {
  const problems = [];
  const seen = new Set();
  const allEvidenceIds = evidenceDoc
    ? new Set((evidenceDoc.evidence || []).map((record) => record.id))
    : evidenceIds;
  const dispositions = new Map((evidenceDoc?.reconciliation || []).map((row) => [row.findingId, row.disposition]));
  // Current = neither disproven (`reject`) nor explicitly retired by a `replace` that named it.
  // The REPLACEMENT finding itself stays current; the record it superseded does not (R-F).
  const superseded = supersededEvidenceIds(evidenceDoc);
  const currentEvidence = evidenceDoc ? new Set((evidenceDoc.evidence || [])
    .filter((record) => dispositions.get(record.id) !== "reject" && !superseded.has(record.id))
    .map((record) => record.id)) : null;
  const qualifyingSupport = evidenceDoc ? new Set((evidenceDoc.evidence || [])
    .filter((record) => qualifyingEvidence(record))
    .filter((record) => currentEvidence.has(record.id))
    .map((record) => record.id)) : null;
  for (const ask of doc.asks) {
    if (seen.has(ask.id)) problems.push(`duplicate ask id "${ask.id}"`);
    seen.add(ask.id);
    if (ask.status === "covered") {
      if (/\b(unresearched|not researched|not adequately researched|unresolved|disproven|superseded)\b/i.test(ask.reason || "")) {
        problems.push(`ask "${ask.id}" claims covered while its own reason says the support is unresolved or invalid`);
      }
      if (!ask.where.length) {
        problems.push(`ask "${ask.id}" (${ask.ask.slice(0, 60)}) claims covered with no group refs — a claim of coverage is not proof of coverage`);
      } else if (groups) {
        for (const ref of ask.where) {
          const [file, anchor] = ref.split("#");
          if (!groups.includes(file)) {
            problems.push(`ask "${ask.id}" points at ${file}, which is not a group file of this guide (${groups.join(", ") || "none"})`);
          } else if (!anchor) {
            problems.push(`ask "${ask.id}" points only at ${file} — coverage needs a #slugified-title anchor inside the file`);
          } else if (groupAnchors && !groupAnchors.get(file)?.has(anchor)) {
            problems.push(`ask "${ask.id}" points at ${file}#${anchor}, but that anchor does not identify any title/name/label in the file`);
          }
        }
      }
      if (allEvidenceIds) {
        for (const id of ask.evidenceIds) if (!allEvidenceIds.has(id)) problems.push(`ask "${ask.id}" cites unknown evidence id "${id}"`);
      }
      if (currentEvidence && ask.evidenceIds.length && !ask.evidenceIds.some((id) => currentEvidence.has(id))) {
        problems.push(`ask "${ask.id}" claims covered but all cited evidence is disproven or superseded`);
      }
      if (qualifyingSupport && bindingAskIds.has(ask.id) && !ask.evidenceIds.some((id) => qualifyingSupport.has(id))) {
        problems.push(`BINDING ask "${ask.id}" has no qualifying current evidence and must fail closed`);
      }
    }
    if (ask.status === "excluded" && !(ask.reason && ask.reason.trim())) {
      problems.push(`ask "${ask.id}" (${ask.ask.slice(0, 60)}) is excluded with no reason — an honest exclusion names why`);
    }
  }
  if (expectedAskIds) {
    for (const id of expectedAskIds) if (!seen.has(id)) problems.push(`material intake ask "${id}" is missing from coverage`);
  }
  if (!doc.asks.length) problems.push("coverage document lists no asks — the intake's material asks were never enumerated");
  return problems;
}

function slugifyAnchor(value) {
  return String(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function collectAnchors(value, out = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectAnchors(item, out);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (["id", "title", "name", "label", "heading", "day"].includes(key) && typeof item === "string") {
        const anchor = slugifyAnchor(item);
        if (anchor) out.add(anchor);
      }
      collectAnchors(item, out);
    }
  }
  return out;
}

/** Deterministic ref remap after composition (canary scar): `compose-guide --write` merges and
    RENUMBERS group files under the tab budget, stranding coverage refs written before it ran.
    Anchors are the identity; filenames are layout — a ref whose file is gone follows its anchor
    to the file that now holds it. Same-suffix renames win first (06-days → 04-days); otherwise
    the anchor must live in exactly ONE group file. Anything unresolvable fails closed. */
export async function remapCoverageRefs(slug, { intakeDir = INTAKE_DIR, guidesDir = path.join(ROOT, "src", "content", "guides") } = {}) {
  const doc = await requireCoverage(slug, { intakeDir });
  const { groups, groupAnchors } = await loadCoverageContext(slug, { intakeDir, guidesDir });
  const problems = [];
  const dropped = [];
  let changed = false;
  for (const ask of doc.asks) {
    const kept = [];
    const stale = [];
    for (const ref of ask.where) {
      const [file, anchor] = ref.split("#");
      if ((groups.includes(file) && anchor && groupAnchors.get(file)?.has(anchor)) || !anchor) {
        kept.push(ref); // valid, or a missing-anchor shape the validator owns
        continue;
      }
      const suffix = file.replace(/^\d\d-/, "");
      const sameSuffix = groups.find((g) => g.replace(/^\d\d-/, "") === suffix && groupAnchors.get(g)?.has(anchor));
      const target = sameSuffix || (() => {
        const homes = groups.filter((g) => groupAnchors.get(g)?.has(anchor));
        return homes.length === 1 ? homes[0] : null;
      })();
      if (target) { changed = true; kept.push(`${target}#${anchor}`); continue; }
      stale.push(ref);
    }
    // An anchor that exists NOWHERE any more is an identity change (the critic renamed the
    // item), not a layout rename. Coverage stays proven while at least one valid ref remains:
    // drop the stale corroborating ref OUT LOUD. Only losing the ask's LAST proof fails closed.
    if (stale.length && kept.some((r) => r.includes("#"))) {
      changed = true;
      dropped.push(...stale.map((r) => `ask "${ask.id}": dropped stale corroborating ref ${r} (its anchor no longer exists; ${kept.length} valid ref(s) remain)`));
    } else if (stale.length) {
      problems.push(...stale.map((r) => `ask "${ask.id}": ${r} — its anchor exists in no group file after composition and it was the ask's only proof`));
      kept.push(...stale);
    }
    ask.where = kept;
  }
  for (const note of dropped) console.log(`[remap-coverage] ${note}`);
  if (problems.length) {
    throw new ContractError(
      `coverage refs could not be remapped after composition:\n` + problems.map((p) => `  · ${p}`).join("\n"),
      { file: coveragePath(slug, intakeDir) },
    );
  }
  if (changed) await writeCoverage(slug, doc, { intakeDir });
  return { changed, dropped };
}

/** Build the real relational context used by reconcile/landing. */
export async function loadCoverageContext(slug, { intakeDir = INTAKE_DIR, guidesDir = path.join(ROOT, "src", "content", "guides") } = {}) {
  const guideDir = path.join(guidesDir, slug);
  const groups = (await readdir(guideDir)).filter((name) => /^\d\d-[a-z0-9-]+\.json$/.test(name)).sort();
  const groupAnchors = new Map();
  for (const name of groups) {
    const doc = JSON.parse(await readFile(path.join(guideDir, name), "utf8"));
    groupAnchors.set(name, collectAnchors(doc));
  }
  let expectedAskIds = null;
  const bindingAskIds = new Set();
  try {
    const legacy = JSON.parse(await readFile(path.join(intakeDir, slug, "coverage.json"), "utf8"));
    expectedAskIds = new Set((legacy.asks || []).map((ask) => ask.id).filter(Boolean));
    // The intake contract has exactly ONE binding row: scaffold-guide.mjs renders
    // "Constraints (mobility · dietary · sensory) — BINDING" from `answers.constraints` and
    // registers it as the `constraints` ask. Generalizing beyond that id would invent asks the
    // intake cannot produce, so this stays pinned to the canonical row (see the parity test).
    for (const ask of legacy.asks || []) {
      if (ask.id === "constraints" && String(ask.value || "").trim()) bindingAskIds.add(ask.id);
    }
  } catch { /* older manually-created scaffold: the V2 document still cannot be empty */ }
  return { groups, groupAnchors, expectedAskIds, bindingAskIds };
}
