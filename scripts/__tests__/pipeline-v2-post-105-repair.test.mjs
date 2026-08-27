// POST-#105 CONTRACT REPAIR — the residual defects an independent post-merge diff review found
// after PR #105 landed, driven end to end against the PRESERVED Tottori validation branch rather
// than a synthetic restatement (see scripts/__tests__/fixtures/tottori-scar.mjs for provenance).
//
// The R-A path here is the real one: the critic's real transit rewrite (last weekday departure
// 19:08 → 19:25) at the real coverage-referenced anchor, retiring the real Pass-A record that
// still carries 19:08, which the real BINDING coverage ask cites. R-F is that same path's tail —
// supersession is what lets coverage tell a replacement from what it replaced.
//
// Two rules PR #107's first revision asserted are deliberately absent, because the historical
// artifacts disprove them; both are pinned below so they cannot come back:
//   · a `replace` may retire nothing — `ev-jumbo-taxi` replaced a guide recommendation that has
//     no evidence record, and demanding an id would only teach the reconciler to invent one;
//   · an `agree` may name no corroboration — accepted Uruguay evidence uses `agree` for
//     concurrence with Pass B's own shortlist call on deliberately single-sourced leads.

// @protects-file Critic corrections, cross-pass corroboration and supersession stay machine-truth.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { EVIDENCE_SCHEMA, COVERAGE_SCHEMA } from "../pipeline/v2/contracts.mjs";
import { reconcileCriticCorrections, writeEvidence, dispositionProblems } from "../pipeline/v2/evidence.mjs";
import { independentAgreementProblems } from "../pipeline/v2/research-rules.mjs";
import { coverageProblems, writeCoverage } from "../pipeline/v2/coverage.mjs";
import {
  TOTTORI_FACTS, TOTTORI_TRANSIT_BEFORE, TOTTORI_TRANSIT_AFTER,
  tottoriEvidenceRecords, tottoriReconciliationRows, tottoriCandidates, tottoriCoverageAsks,
} from "./fixtures/tottori-scar.mjs";

let dir;
beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), "waypoint-post105-")); });
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

const RUN_ID = "tottori-20260826-e29ab7";
const byId = (records) => new Map(records.map((r) => [r.id, r]));

const evidenceDoc = (overrides = {}) => ({
  schemaVersion: EVIDENCE_SCHEMA, slug: "tottori", runId: RUN_ID,
  candidates: tottoriCandidates(), evidence: tottoriEvidenceRecords(),
  reconciliation: tottoriReconciliationRows(), ...overrides,
});
const coverageDoc = (asks = tottoriCoverageAsks()) => ({
  schemaVersion: COVERAGE_SCHEMA, slug: "tottori", runId: RUN_ID, asks,
});

// The real correction the critic made, expressed in the repaired handoff contract.
const TARGET = "05-transit.json#key-transit-routes";
const source = {
  url: "https://hinomarubus.co.jp/timetable_route/3454/?tab=2", kind: "operator", access: "fetched",
  language: "ja", publishedAt: null, family: "hinomarubus", independent: true, appliesToYears: [],
};
const freshness = { perishable: true, shelfLife: "transit", recheckOn: "2026-10-26" };
const lastDeparture = {
  target: TARGET, previousValue: "19:08", correctedValue: "19:25",
  claim: "Last weekday departure from Kurayoshi Station on the Misasa line", source, verifiedOn: "2026-08-26", freshness,
};
const routeIdentity = {
  target: TARGET, previousValue: null, correctedValue: "70/71",
  claim: "The Kurayoshi Station↔Misasa service is Hinomaru's 上井三朝線", source, verifiedOn: "2026-08-26", freshness,
};

// ── R-A ──────────────────────────────────────────────────────────────────────

describe("R-A — critic corrections outside facts.json reach authoritative evidence", () => {
  async function tottoriCriticScar({ corrections = null, coverage = tottoriCoverageAsks() } = {}) {
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
    if (coverage) await writeCoverage("tottori", coverageDoc(coverage), { intakeDir: dir });
    if (corrections) {
      await writeFile(path.join(fromDir, "guides-intake", "tottori", "critic-corrections.v2.json"), JSON.stringify({
        schemaVersion: "wp-critic-corrections/2.0", slug: "tottori", runId: RUN_ID, corrections,
      }));
    }
    return { guidesDir, fromDir };
  }
  const run = (fixture) => reconcileCriticCorrections("tottori", { ...fixture, intakeDir: dir, runId: RUN_ID });

  it("PRE-REPAIR: the historical critic pass moved the guide while facts.json stayed identical", () => {
    // #105's detector read ONLY facts.json, which is byte-identical at both states, so it returned
    // changed:false from exactly this input and left evidence.v2.json stale against the guide.
    expect(TOTTORI_FACTS).not.toContain("19:25");
    expect(TOTTORI_TRANSIT_BEFORE).toContain("19:08");
    expect(TOTTORI_TRANSIT_AFTER).not.toContain("19:08");
    expect(TOTTORI_TRANSIT_AFTER).toContain("19:25");
  });

  it("REPAIRED: an undeclared ordinary-guide-file edit fails the stage closed", async () => {
    await expect(run(await tottoriCriticScar())).rejects.toThrow(/05-transit\.json without .*stale evidence is refused/);
  });

  it("REPAIRED: there is no editorial exemption — an edited file owes a proven correction", async () => {
    // The historical rewrite IS substantive. Nothing in the guide contract lets the pipeline tell a
    // silent fact change from a rewording, so an agent saying "no fact moved" is refused outright:
    // the only way past this step is a correction whose before/after the pipeline itself proves.
    const fixture = await tottoriCriticScar({ corrections: [] });
    await expect(run(fixture)).rejects.toThrow(/owes at least one correction carrying its before\/after value and source/);
  });

  it("REPAIRED: one target carries SEVERAL independent corrections", async () => {
    // The real transit item moved route identity AND last departure, each with its own claim.
    const fixture = await tottoriCriticScar({ corrections: [lastDeparture, routeIdentity] });
    const result = await run(fixture);
    expect(result.targets).toEqual([TARGET, TARGET]);
    const doc = JSON.parse(await readFile(path.join(dir, "tottori", "evidence.v2.json"), "utf8"));
    const critic = doc.evidence.filter((e) => e.origin === "critic");
    expect(critic).toHaveLength(2);
    expect(new Set(critic.map((e) => e.id)).size).toBe(2); // ids are target + claim, never target alone
    expect(critic.map((e) => e.claim)).toContain("Last weekday departure from Kurayoshi Station on the Misasa line: 19:25");
  });

  it("REPAIRED: a repeated target + claim pair is refused, and a phantom file is refused", async () => {
    await expect(run(await tottoriCriticScar({ corrections: [lastDeparture, { ...lastDeparture }] })))
      .rejects.toThrow(/repeats a target \+ claim pair/);
    await expect(run(await tottoriCriticScar({ corrections: [lastDeparture, { ...lastDeparture, target: "09-sources.json#x" }] })))
      .rejects.toThrow(/declares 09-sources\.json, which the critic did not change/);
  });

  it("REPAIRED: a target anchor must be the SLUGIFIED address coverage refs use", async () => {
    // The capsule used to say "the item's exact title/name/label" while the validator compared a
    // slug — prompt and validator disagreeing. Both non-slug spellings now fail closed.
    const spaced = { ...lastDeparture, target: "05-transit.json#Key transit routes" };
    await expect(run(await tottoriCriticScar({ corrections: [spaced] })))
      .rejects.toThrow(/expected "<guide file>#<fact row id, slugified anchor or key>"/);
    const camel = { ...lastDeparture, target: "05-transit.json#KeyTransitRoutes" };
    await expect(run(await tottoriCriticScar({ corrections: [camel] })))
      .rejects.toThrow(/names no slugified title\/name\/label or top-level key/);
  });

  it("REPAIRED: the declared before/after must survive the real diff", async () => {
    const wrong = { ...lastDeparture, correctedValue: "20:40" };
    await expect(run(await tottoriCriticScar({ corrections: [wrong] })))
      .rejects.toThrow(/claims a corrected value that does not appear in the edited 05-transit\.json/);
  });
});

// ── R-A supersession scope ───────────────────────────────────────────────────

describe("R-A — supersession is scoped by declared structure, never by a value scan", () => {
  async function reconcile({ corrections = [lastDeparture] } = {}) {
    const guidesDir = path.join(dir, "guides");
    const fromDir = path.join(dir, "critic");
    await mkdir(path.join(guidesDir, "tottori"), { recursive: true });
    await mkdir(path.join(fromDir, "src", "content", "guides", "tottori"), { recursive: true });
    await mkdir(path.join(fromDir, "guides-intake", "tottori"), { recursive: true });
    await writeFile(path.join(guidesDir, "tottori", "05-transit.json"), TOTTORI_TRANSIT_BEFORE);
    await writeFile(path.join(fromDir, "src", "content", "guides", "tottori", "05-transit.json"), TOTTORI_TRANSIT_AFTER);
    await writeEvidence("tottori", evidenceDoc(), { intakeDir: dir });
    await writeFile(path.join(fromDir, "guides-intake", "tottori", "critic-corrections.v2.json"), JSON.stringify({
      schemaVersion: "wp-critic-corrections/2.0", slug: "tottori", runId: RUN_ID, corrections,
    }));
    return reconcileCriticCorrections("tottori", { guidesDir, fromDir, intakeDir: dir, runId: RUN_ID });
  }

  it("retires the record citing the corrected item's own origin and still asserting the old value", async () => {
    // The transit item cites hinomarubus timetable_route/3455. Two records cite that same origin;
    // only one of them still says 19:08 — so only that one is retired.
    const sameOrigin = tottoriEvidenceRecords().filter((e) => e.source.url === "https://hinomarubus.co.jp/timetable_route/3455/?tab=2");
    expect(sameOrigin.map((e) => e.id)).toEqual(["ev-bus-route-exists", "ev-bus-downbound-schedule"]);
    const result = await reconcile();
    expect(result.superseded).toEqual(["ev-bus-downbound-schedule"]);
    const doc = JSON.parse(await readFile(path.join(dir, "tottori", "evidence.v2.json"), "utf8"));
    const row = doc.reconciliation.find((r) => r.findingId.startsWith("critic-correction-"));
    expect(row.disposition).toBe("replace");
    expect(row.supersedes).toEqual(["ev-bus-downbound-schedule"]);
  });

  it("a value that collides across unrelated entities retires nothing it does not own", async () => {
    // ¥800 is Sanbutsu-ji's waraji rental AND the Sand Museum's admission. A bare substring scan —
    // what PR #107's first revision did — would have retired both from a transit correction. So
    // would a join through coverage: the BINDING `constraints` ask points at BOTH the transit ref
    // and Sanbutsu-ji, and cites the waraji record.
    const constraints = tottoriCoverageAsks().find((a) => a.id === "constraints");
    expect(constraints.where).toContain(TARGET);
    expect(constraints.evidenceIds).toContain("ev-mitokusan-nageiredo-rules");

    const collision = { ...lastDeparture, previousValue: "¥800", correctedValue: "19:25" };
    const guidesDir = path.join(dir, "guides");
    const fromDir = path.join(dir, "critic");
    await mkdir(path.join(guidesDir, "tottori"), { recursive: true });
    await mkdir(path.join(fromDir, "src", "content", "guides", "tottori"), { recursive: true });
    await mkdir(path.join(fromDir, "guides-intake", "tottori"), { recursive: true });
    await writeFile(path.join(guidesDir, "tottori", "05-transit.json"), TOTTORI_TRANSIT_BEFORE.replace("19:08", "¥800"));
    await writeFile(path.join(fromDir, "src", "content", "guides", "tottori", "05-transit.json"), TOTTORI_TRANSIT_AFTER);
    await writeEvidence("tottori", evidenceDoc(), { intakeDir: dir });
    await writeFile(path.join(fromDir, "guides-intake", "tottori", "critic-corrections.v2.json"), JSON.stringify({
      schemaVersion: "wp-critic-corrections/2.0", slug: "tottori", runId: RUN_ID, corrections: [collision],
    }));
    const result = await reconcileCriticCorrections("tottori", { guidesDir, fromDir, intakeDir: dir, runId: RUN_ID });
    const carriers = tottoriEvidenceRecords().filter((e) => e.claim.includes("¥800")).map((e) => e.id);
    expect(carriers).toEqual(expect.arrayContaining(["ev-sand-museum-hours-price", "ev-mitokusan-nageiredo-rules"]));
    expect(result.superseded).toEqual([]); // neither cites the transit item's origin
  });

  it("when no record cites the corrected item's origin the answer is honestly nothing", async () => {
    const elsewhere = { ...lastDeparture, previousValue: "20 minutes", correctedValue: "19:25" };
    const result = await reconcile({ corrections: [elsewhere] }).catch((err) => err);
    // "20 minutes" is not in the before file, so the proof fails before supersession is reached —
    // the pipeline never guesses from a value it cannot place.
    expect(String(result)).toMatch(/claims a previous value that 05-transit\.json never contained/);
  });
});

// ── R-E ──────────────────────────────────────────────────────────────────────

describe("R-E — Pass A + Pass B convergence is not independent corroboration", () => {
  const A = "ev-yohaijo-details";              // passA, family "misasa-town"
  const B = "ev-nageiredo-viewing-platform";   // passB, family "misasaonsen-official"

  it("PRE-REPAIR: normalized claim text never groups the historical pair", () => {
    const records = byId(tottoriEvidenceRecords());
    const normalize = (r) => String(r.claim).toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    // #105 grouped on `${candidateId}\0${normalizedClaim}`. Both halves of that key differ here,
    // even though both records assert the same ~600 m proposition about the same platform.
    expect(normalize(records.get(A))).not.toBe(normalize(records.get(B)));
    expect(records.get(A).candidateId).not.toBe(records.get(B).candidateId);
    expect(records.get(A).claim).toContain("600m");
    expect(records.get(B).claim).toContain("600m");
  });

  it("STATED GAP: the historical row asserts corroboration only in prose, and is NOT caught", () => {
    // The real row is `adopt` with "Corroborates Pass A's ev-yohaijo-details" in `note`. The
    // evidence artifact carries no proposition identity, so two differently worded records are
    // linkable only through free text — and reading that text is the similarity heuristic this
    // repair is forbidden to add. This assertion exists so the gap cannot be quietly claimed shut:
    // it fails the day the artifact gains a proposition key and the rule can be made to fire.
    const row = tottoriReconciliationRows().find((r) => r.findingId === B);
    expect(row.disposition).toBe("adopt");
    expect(row.corroborates).toBeUndefined();
    expect(row.note).toMatch(/Corroborates Pass A's ev-yohaijo-details/);
    expect(independentAgreementProblems(evidenceDoc())).toEqual([]);
  });

  it("REPAIRED: declared as the contract now requires, unproven independence fails closed", () => {
    const reconciliation = tottoriReconciliationRows().map((row) =>
      row.findingId === B ? { ...row, disposition: "agree", corroborates: [A] } : row);
    const problems = independentAgreementProblems(evidenceDoc({ reconciliation })).join("\n");
    expect(problems).toMatch(/Pass A and Pass B converging is not itself independent corroboration/);
    expect(problems).toMatch(/established independence/);
  });

  it("REPAIRED: two sources whose independence IS established still corroborate", () => {
    const establish = (r) => ({ ...r, source: { ...r.source, independent: true } });
    const evidence = tottoriEvidenceRecords().map((r) => ([A, B].includes(r.id) ? establish(r) : r));
    const reconciliation = tottoriReconciliationRows().map((row) =>
      row.findingId === B ? { ...row, disposition: "agree", corroborates: [A] } : row);
    expect(independentAgreementProblems(evidenceDoc({ evidence, reconciliation }))).toEqual([]);
  });

  it("an `agree` that names no corroboration stays legal — Uruguay's accepted semantics", () => {
    // Uruguay's `agree` rows record concurrence with Pass B's own shortlist call on deliberately
    // single-sourced leads. Demanding a corroboration list there would manufacture support.
    const reconciliation = tottoriReconciliationRows().map((row) =>
      row.findingId === B ? { ...row, disposition: "agree" } : row);
    expect(dispositionProblems(evidenceDoc({ reconciliation }))).toEqual([]);
  });
});

// ── R-F ──────────────────────────────────────────────────────────────────────

describe("R-F — supersession is machine-identified, not asserted in a note", () => {
  const RETIRED = "ev-bus-downbound-schedule";
  const CORRECTION = "critic-correction-x";
  const correctionRecord = () => ({
    id: CORRECTION, candidateId: null,
    claim: "Last weekday departure from Kurayoshi Station on the Misasa line: 19:25",
    kind: "objective", origin: "critic", source, verifiedOn: "2026-08-26", firsthand: null, freshness,
  });
  const withCorrection = ({ named = true } = {}) => evidenceDoc({
    evidence: [...tottoriEvidenceRecords(), correctionRecord()],
    reconciliation: [...tottoriReconciliationRows(), {
      findingId: CORRECTION, disposition: "replace",
      note: "critic re-fetch disproved the 19:08 last departure", corroborates: [], supersedes: named ? [RETIRED] : [],
    }],
  });

  it("PRE-REPAIR: the historical replace row named its victim only in prose", () => {
    const row = tottoriReconciliationRows().find((r) => r.disposition === "replace");
    expect(row.findingId).toBe("ev-jumbo-taxi");
    expect(row.note).toMatch(/Supersedes Pass A's weak taxi fallback/);
    expect(row.supersedes).toBeUndefined();
  });

  it("a `replace` may retire nothing — the historical row's victim is not an evidence record", () => {
    // No Pass-A taxi record exists in the artifact; ev-jumbo-taxi replaced a guide recommendation.
    // A rule demanding an id here would have taught the reconciler to invent one.
    expect(tottoriEvidenceRecords().filter((e) => e.origin === "passA" && /taxi/i.test(e.claim))).toEqual([]);
    expect(dispositionProblems(evidenceDoc())).toEqual([]);
  });

  it("supersedes is referentially validated and legal only on replace", () => {
    const ghost = withCorrection();
    ghost.reconciliation.at(-1).supersedes = ["ev-does-not-exist"];
    expect(dispositionProblems(ghost).join()).toMatch(/supersedes unknown evidence id/);

    const wrongDisposition = withCorrection();
    wrongDisposition.reconciliation.at(-1).disposition = "adopt";
    expect(dispositionProblems(wrongDisposition).join()).toMatch(/only "replace" retires prior evidence/);

    const selfRef = withCorrection();
    selfRef.reconciliation.at(-1).supersedes = [CORRECTION];
    expect(dispositionProblems(selfRef).join()).toMatch(/supersedes itself/);
  });

  it("coverage resting only on superseded evidence stops counting as covered", () => {
    const ask = { ...tottoriCoverageAsks().find((a) => a.id === "constraints"), evidenceIds: [RETIRED] };
    const doc = coverageDoc([ask]);
    const binding = { bindingAskIds: new Set(["constraints"]) };

    // PRE-REPAIR: with no machine relation, the retired record still reads as current.
    expect(coverageProblems(doc, { evidenceDoc: withCorrection({ named: false }), ...binding })).toEqual([]);

    const problems = coverageProblems(doc, { evidenceDoc: withCorrection(), ...binding }).join("\n");
    expect(problems).toMatch(/all cited evidence is disproven or superseded/);
    expect(problems).toMatch(/BINDING ask "constraints" has no qualifying current evidence/);
  });

  it("the replacement itself stays current and can carry the same ask", () => {
    const ask = { ...tottoriCoverageAsks().find((a) => a.id === "constraints"), evidenceIds: [RETIRED, CORRECTION] };
    expect(coverageProblems(coverageDoc([ask]), {
      evidenceDoc: withCorrection(), bindingAskIds: new Set(["constraints"]),
    })).toEqual([]);
  });
});

// ── the BINDING row the coverage rule is pinned to ───────────────────────────

describe("BINDING coverage detection stays pinned to the intake's only binding row", () => {
  it("scaffold-guide renders exactly one BINDING ask, and it is `constraints`", async () => {
    const src = await readFile(new URL("../scaffold-guide.mjs", import.meta.url), "utf8");
    const binding = src.split("\n").filter((line) => line.includes("BINDING"));
    expect(binding).toHaveLength(1);
    expect(binding[0]).toContain("answers.constraints");
    expect(src).toContain('add("constraints"');
  });
});
