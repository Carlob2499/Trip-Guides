// POST-#105 CONTRACT REPAIR — the three residual defects an independent post-merge diff review
// found after PR #105 landed, each pinned against the PRESERVED Tottori validation branch rather
// than a synthetic restatement (see scripts/__tests__/fixtures/tottori-scar.mjs for provenance).
//
//   R-A  post-critic evidence truth covered only facts.json, while the critic's real authority is
//        the whole guide directory. Tottori b153af3 → b7fadad changed six ordinary guide files and
//        left facts.json byte-identical, so the reconcile step reported "nothing changed" and
//        evidence.v2.json stayed stale against the guide.
//   R-E  reconcile counted Pass A + Pass B converging on the same misattributed 600 m figure as
//        independent corroboration. The two records are worded differently and hang off different
//        candidates, so #105's normalized-claim-text grouping never even compares them.
//   R-F  a `replace` disposition said, in prose, that it superseded "Pass A's weak taxi fallback"
//        and named no record, so coverage could not tell the current replacement from the stale
//        evidence it replaced.
//
// Every test here asserts BOTH halves: the pre-repair behaviour missed the historical case, and
// the repaired contract fails closed on it.

// @protects-file Critic corrections, cross-pass corroboration and supersession stay machine-truth.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { EVIDENCE_SCHEMA } from "../pipeline/v2/contracts.mjs";
import { reconcileCriticCorrections, writeEvidence, dispositionProblems } from "../pipeline/v2/evidence.mjs";
import { independentAgreementProblems } from "../pipeline/v2/research-rules.mjs";
import { coverageProblems } from "../pipeline/v2/coverage.mjs";
import {
  TOTTORI_FACTS, TOTTORI_TRANSIT_BEFORE, TOTTORI_TRANSIT_AFTER,
  tottoriEvidenceRecords, tottoriReconciliationRows, tottoriCandidates, tottoriConstraintsAsk,
} from "./fixtures/tottori-scar.mjs";

let dir;
beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), "waypoint-post105-")); });
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

const RUN_ID = "tottori-20260826-e29ab7";
const byId = (records) => new Map(records.map((r) => [r.id, r]));

const evidenceDoc = (overrides = {}) => ({
  schemaVersion: EVIDENCE_SCHEMA,
  slug: "tottori", runId: RUN_ID,
  candidates: tottoriCandidates(),
  evidence: tottoriEvidenceRecords(),
  reconciliation: tottoriReconciliationRows(),
  ...overrides,
});

// ── R-A ──────────────────────────────────────────────────────────────────────

describe("R-A — critic corrections outside facts.json reach authoritative evidence", () => {
  /** The exact historical shape: one ordinary guide file rewritten by the critic, facts.json
      untouched, and no correction handoff anywhere. */
  async function tottoriCriticScar({ handoff = false } = {}) {
    const guidesDir = path.join(dir, "guides");
    const fromDir = path.join(dir, "critic");
    await mkdir(path.join(guidesDir, "tottori"), { recursive: true });
    await mkdir(path.join(fromDir, "src", "content", "guides", "tottori"), { recursive: true });
    await mkdir(path.join(fromDir, "guides-intake", "tottori"), { recursive: true });
    await writeFile(path.join(guidesDir, "tottori", "facts.json"), TOTTORI_FACTS);
    await writeFile(path.join(fromDir, "src", "content", "guides", "tottori", "facts.json"), TOTTORI_FACTS);
    await writeFile(path.join(guidesDir, "tottori", "05-transit.json"), TOTTORI_TRANSIT_BEFORE);
    await writeFile(path.join(fromDir, "src", "content", "guides", "tottori", "05-transit.json"), TOTTORI_TRANSIT_AFTER);
    await writeEvidence("tottori", evidenceDoc(), { intakeDir: dir });
    if (handoff) {
      await writeFile(path.join(fromDir, "guides-intake", "tottori", "critic-corrections.v2.json"), JSON.stringify({
        schemaVersion: "wp-critic-corrections/2.0", slug: "tottori", runId: RUN_ID,
        corrections: [], editorialOnly: [{ file: "05-transit.json", note: "re-fetched the operator timetable and rewrote the transfer" }],
      }));
    }
    return { guidesDir, fromDir };
  }

  it("PRE-REPAIR: the historical critic pass moved the guide while facts.json stayed identical", () => {
    // The fixture carries ONE facts.json because b153af3 and b7fadad hold the same bytes — that
    // identity is the whole defect: #105's detector read only this file and returned changed:false.
    expect(TOTTORI_FACTS).not.toContain("70/71");
    expect(TOTTORI_TRANSIT_AFTER).not.toBe(TOTTORI_TRANSIT_BEFORE);
    expect(TOTTORI_TRANSIT_AFTER).toContain("70/71"); // the corrected bus line the critic proved
    expect(TOTTORI_TRANSIT_BEFORE).toContain("19:08"); // the misattributed last departure it replaced
  });

  it("REPAIRED: an undeclared ordinary-guide-file edit fails the stage closed", async () => {
    const fixture = await tottoriCriticScar();
    await expect(reconcileCriticCorrections("tottori", { ...fixture, intakeDir: dir, runId: RUN_ID }))
      .rejects.toThrow(/05-transit\.json without \S*critic-corrections\.v2\.json — stale evidence is refused/);
  });

  it("REPAIRED: the same edit passes once it is declared, and only then", async () => {
    const fixture = await tottoriCriticScar({ handoff: true });
    await expect(reconcileCriticCorrections("tottori", { ...fixture, intakeDir: dir, runId: RUN_ID }))
      .resolves.toMatchObject({ changed: true, targets: [] });
  });
});

// ── R-E ──────────────────────────────────────────────────────────────────────

describe("R-E — Pass A + Pass B convergence is not independent corroboration", () => {
  const A = "ev-yohaijo-details";      // passA, family "misasa-town"
  const B = "ev-nageiredo-viewing-platform"; // passB, family "misasaonsen-official"

  it("PRE-REPAIR: normalized claim text never groups the historical pair", () => {
    const records = byId(tottoriEvidenceRecords());
    const normalize = (r) => String(r.claim).toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    // #105 grouped on `${candidateId}\0${normalizedClaim}`. Both halves of that key differ here,
    // even though both records assert the same ~600 m proposition about the same platform.
    expect(normalize(records.get(A))).not.toBe(normalize(records.get(B)));
    expect(records.get(A).candidateId).not.toBe(records.get(B).candidateId);
    expect(records.get(A).claim).toContain("600m");
    expect(records.get(B).claim).toContain("600m");
    // …so with no declared relation the rule finds nothing to check.
    expect(independentAgreementProblems(evidenceDoc({ reconciliation: [] }))).toEqual([]);
  });

  it("REPAIRED: the declared relation is checked, and unproven independence fails closed", () => {
    const reconciliation = tottoriReconciliationRows().map((row) =>
      row.findingId === B ? { ...row, corroborates: [A] } : row);
    const problems = independentAgreementProblems(evidenceDoc({ reconciliation })).join("\n");
    expect(problems).toMatch(/Pass A and Pass B converging is not itself independent corroboration/);
    expect(problems).toMatch(/established independence/);
  });

  it("REPAIRED: two sources whose independence IS established still corroborate", () => {
    const establish = (record) => ({ ...record, source: { ...record.source, independent: true } });
    const evidence = tottoriEvidenceRecords().map((r) => ([A, B].includes(r.id) ? establish(r) : r));
    const reconciliation = tottoriReconciliationRows().map((row) =>
      row.findingId === B ? { ...row, corroborates: [A] } : row);
    expect(independentAgreementProblems(evidenceDoc({ evidence, reconciliation }))).toEqual([]);
  });
});

// ── R-F ──────────────────────────────────────────────────────────────────────

describe("R-F — supersession is machine-identified, not asserted in a note", () => {
  const SUPERSEDED = ["ev-yohaijo-details", "ev-nageiredo-viewing-platform"];
  const CORRECTION = "critic-correction-05-transit-json-key-transit-routes";

  /** The critic's proven correction, folded in exactly as reconcileCriticCorrections folds it. */
  const correctionRecord = () => ({
    id: CORRECTION, candidateId: null,
    claim: "Kurayoshi Station↔Misasa is Hinomaru routes 70/71: 1.2 km-equivalent viewing distance corrected",
    kind: "objective", origin: "critic",
    source: {
      url: "https://hinomarubus.co.jp/rosen/", kind: "operator", access: "fetched", language: "ja",
      publishedAt: null, family: "hinomarubus", independent: true, appliesToYears: [],
    },
    verifiedOn: "2026-08-26", firsthand: null,
    freshness: { perishable: true, shelfLife: "transit", recheckOn: "2026-10-26" },
  });

  const withCorrection = ({ named = true } = {}) => evidenceDoc({
    evidence: [...tottoriEvidenceRecords(), correctionRecord()],
    reconciliation: [
      ...tottoriReconciliationRows(),
      {
        findingId: CORRECTION, disposition: "replace",
        note: "critic re-fetch disproved the 600 m viewing distance carried by both passes",
        corroborates: [], supersedes: named ? SUPERSEDED : [],
      },
    ],
  });

  it("PRE-REPAIR: the historical replace row named its victim only in prose", () => {
    const row = tottoriReconciliationRows().find((r) => r.disposition === "replace");
    expect(row.findingId).toBe("ev-jumbo-taxi");
    expect(row.note).toMatch(/Supersedes Pass A's weak taxi fallback/);
    expect(row.supersedes).toBeUndefined();
  });

  it("REPAIRED: a replace that names no superseded record is refused", () => {
    const problems = dispositionProblems(withCorrection({ named: false })).join("\n");
    expect(problems).toMatch(/replaces prior evidence without naming it in supersedes/);
  });

  it("REPAIRED: supersedes is referentially validated and legal only on replace", () => {
    const ghost = withCorrection();
    ghost.reconciliation.at(-1).supersedes = ["ev-does-not-exist"];
    expect(dispositionProblems(ghost).join()).toMatch(/supersedes unknown evidence id/);

    const wrongDisposition = withCorrection();
    wrongDisposition.reconciliation.at(-1).disposition = "adopt";
    expect(dispositionProblems(wrongDisposition).join()).toMatch(/only "replace" retires prior evidence/);
  });

  it("REPAIRED: coverage resting only on superseded evidence stops counting as covered", () => {
    const ask = { ...tottoriConstraintsAsk(), evidenceIds: SUPERSEDED };
    const doc = { schemaVersion: "wp-coverage/2.0", slug: "tottori", runId: RUN_ID, asks: [ask] };
    const binding = { bindingAskIds: new Set(["constraints"]) };

    // PRE-REPAIR: with no machine relation, both superseded records still read as current.
    expect(coverageProblems(doc, { evidenceDoc: withCorrection({ named: false }), ...binding })).toEqual([]);

    const problems = coverageProblems(doc, { evidenceDoc: withCorrection(), ...binding }).join("\n");
    expect(problems).toMatch(/all cited evidence is disproven or superseded/);
    expect(problems).toMatch(/BINDING ask "constraints" has no qualifying current evidence/);
  });

  it("REPAIRED: the replacement itself stays current and can carry the same ask", () => {
    const ask = { ...tottoriConstraintsAsk(), evidenceIds: [...SUPERSEDED, CORRECTION] };
    const doc = { schemaVersion: "wp-coverage/2.0", slug: "tottori", runId: RUN_ID, asks: [ask] };
    expect(coverageProblems(doc, { evidenceDoc: withCorrection(), bindingAskIds: new Set(["constraints"]) })).toEqual([]);
  });
});

// ── the BINDING row the coverage rule is pinned to ───────────────────────────

describe("BINDING coverage detection stays pinned to the intake's only binding row", () => {
  it("scaffold-guide renders exactly one BINDING ask, and it is `constraints`", async () => {
    const source = await readFile(new URL("../scaffold-guide.mjs", import.meta.url), "utf8");
    const binding = source.split("\n").filter((line) => line.includes("BINDING"));
    expect(binding).toHaveLength(1);
    expect(binding[0]).toContain("answers.constraints");
    expect(source).toContain('add("constraints"');
  });
});
