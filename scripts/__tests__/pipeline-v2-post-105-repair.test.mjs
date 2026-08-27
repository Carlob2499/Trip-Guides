// POST-#105 CONTRACT REPAIR — the residual defects an independent post-merge review found after
// PR #105 landed, and the second adversarial review (#107 review 5040372804) found still open.
// Each is pinned against the PRESERVED Tottori validation branch and the ACCEPTED Uruguay
// evidence, never a synthetic restatement (provenance: fixtures/tottori-scar.mjs).
//
//   R-A  post-critic evidence truth covered only facts.json, while the critic's real authority is
//        the whole guide directory. Tottori b153af3 → b7fadad rewrote ordinary guide files with
//        substantive factual corrections and left facts.json byte-identical.
//   R-E  reconcile counted Pass A + Pass B converging on the same misattributed 600 m figure as
//        independent corroboration, asserting the relation only in a disposition NOTE.
//   R-F  a `replace` disposition said in prose that it superseded "Pass A's weak taxi fallback"
//        — a Pass-A conclusion that was never an evidence record at all.
//
// The historical artifacts are used UNMODIFIED where the defect is about them. Where a test must
// show the repaired representation, it constructs it only AFTER the untouched shape has been
// shown to fail closed.

// @protects-file Critic corrections, cross-pass corroboration and supersession stay machine-truth.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { EVIDENCE_SCHEMA, CRITIC_CORRECTIONS_SCHEMA, CRITIC_TARGET, criticCorrectionDocSchema, supersededEvidenceIds } from "../pipeline/v2/contracts.mjs";
import { reconcileCriticCorrections, writeEvidence, requireEvidence, dispositionProblems } from "../pipeline/v2/evidence.mjs";
import { independentAgreementProblems } from "../pipeline/v2/research-rules.mjs";
import { coverageProblems } from "../pipeline/v2/coverage.mjs";
import { generateContractCapsule } from "../pipeline/v2/contract-capsule.mjs";
import {
  TOTTORI_FACTS, TOTTORI_TRANSIT_BEFORE, TOTTORI_TRANSIT_AFTER, TOTTORI_ADMISSION_FACTS,
  tottoriEvidenceRecords, tottoriReconciliationRows, tottoriCandidates, tottoriConstraintsAsk,
  tottoriRepeatedValueRecords, tottoriBusOriginRecords,
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

/** A fetched operator source, shaped like the ones the critic really cites. */
const SOURCE = {
  url: "https://hinomarubus.co.jp/timetable_route/3450/?tab=2", kind: "operator", access: "fetched",
  language: "ja", publishedAt: null, family: "hinomarubus", independent: true, appliesToYears: [],
};
const FRESHNESS = { perishable: true, shelfLife: "transit", recheckOn: "2026-10-26" };

const valueAt = (doc, pointer) => pointer.split("/").slice(1)
  .reduce((node, raw) => node?.[raw.replace(/~1/g, "/").replace(/~0/g, "~")], doc);
const asText = (value) => typeof value === "string" ? value : JSON.stringify(value);

/** Declare one correction from what the two historical workspaces ACTUALLY hold at `pointer` —
    the handoff a critic that told the truth would have written, derived, never invented. */
const declare = (file, pointer, before, after, claim) => ({
  target: `${file}#${pointer}`,
  previousValue: valueAt(before, pointer) === undefined ? null : asText(valueAt(before, pointer)),
  correctedValue: asText(valueAt(after, pointer)),
  claim, source: SOURCE, verifiedOn: "2026-08-26", freshness: FRESHNESS,
});

// ── R-A ──────────────────────────────────────────────────────────────────────

const TRANSIT = "05-transit.json";
const before = JSON.parse(TOTTORI_TRANSIT_BEFORE);
const after = JSON.parse(TOTTORI_TRANSIT_AFTER);
/** The ten locations the historical critic pass really moved. Seven of them are inside ONE
    guide item — the `Key transit routes` anchor — which is the whole of blocker 2. */
const HISTORICAL = [
  "/0/source_url", "/0/steps/2", "/0/steps/3", "/0/steps/4", "/0/steps/5", "/0/steps/6", "/0/steps/7",
  "/1/center/lat", "/1/center/lng", "/1/span",
];
const declareHistorical = () => HISTORICAL.map((p) => declare(TRANSIT, p, before, after, `Tottori transfer fact at ${p}`));

/** The exact historical shape: 05-transit.json rewritten by the critic, facts.json untouched. */
async function tottoriCriticScar(handoff = null, evidence = evidenceDoc()) {
  const guidesDir = path.join(dir, "guides");
  const fromDir = path.join(dir, "critic");
  await mkdir(path.join(guidesDir, "tottori"), { recursive: true });
  await mkdir(path.join(fromDir, "src", "content", "guides", "tottori"), { recursive: true });
  await mkdir(path.join(fromDir, "guides-intake", "tottori"), { recursive: true });
  await writeFile(path.join(guidesDir, "tottori", "facts.json"), TOTTORI_FACTS);
  await writeFile(path.join(fromDir, "src", "content", "guides", "tottori", "facts.json"), TOTTORI_FACTS);
  await writeFile(path.join(guidesDir, "tottori", TRANSIT), TOTTORI_TRANSIT_BEFORE);
  await writeFile(path.join(fromDir, "src", "content", "guides", "tottori", TRANSIT), TOTTORI_TRANSIT_AFTER);
  await writeEvidence("tottori", evidence, { intakeDir: dir });
  if (handoff) {
    await writeFile(path.join(fromDir, "guides-intake", "tottori", "critic-corrections.v2.json"),
      JSON.stringify({ schemaVersion: CRITIC_CORRECTIONS_SCHEMA, slug: "tottori", runId: RUN_ID, ...handoff }));
  }
  return { guidesDir, fromDir };
}
const reconcile = (fixture) => reconcileCriticCorrections("tottori", { ...fixture, intakeDir: dir, runId: RUN_ID });

describe("R-A — every changed guide value reaches authoritative evidence, or the stage fails closed", () => {
  const IN_KEY_TRANSIT_ROUTES = HISTORICAL.filter((p) => p.startsWith("/0/"));

  it("PRE-REPAIR: the historical critic pass moved the guide while facts.json stayed identical", () => {
    // b153af3 and b7fadad hold the SAME facts.json bytes — that identity is the whole defect:
    // #105's detector read only this file and returned changed:false.
    expect(TOTTORI_FACTS).not.toContain("70/71");
    expect(TOTTORI_TRANSIT_BEFORE).toContain("route 72/73");   // the misattributed line…
    expect(TOTTORI_TRANSIT_AFTER).toContain("routes 70/71");   // …and the one the critic proved
    expect(TOTTORI_TRANSIT_BEFORE).toContain("19:08");         // the misattributed last departure
    expect(TOTTORI_TRANSIT_AFTER).toContain("19:25");          // the corrected one
    expect(TOTTORI_TRANSIT_AFTER).toContain("13:20 → 14:40");  // the corrected service gap
    expect(TOTTORI_TRANSIT_AFTER).toContain("三徳山駐車場");      // the new Mitokusan service
  });

  it("RED-BEFORE: an `editorialOnly` declaration cannot buy the historical rewrite a pass", async () => {
    // #107 accepted exactly this handoff for exactly this file. A critic asserting "no fact
    // moved" over a rewrite that re-fetched the operator timetable is not deterministic proof,
    // so the contract carries no such field and the undeclared values still fail the stage.
    const fixture = await tottoriCriticScar({
      corrections: [],
      editorialOnly: [{ file: TRANSIT, note: "re-fetched the operator timetable and rewrote the transfer" }],
    });
    await expect(reconcile(fixture)).rejects.toThrow(/there is no editorial-only escape/);
    expect(criticCorrectionDocSchema.safeParse({
      schemaVersion: CRITIC_CORRECTIONS_SCHEMA, slug: "tottori", runId: RUN_ID,
      corrections: [], editorialOnly: [{ file: TRANSIT, note: "rephrased only, no fact moved" }],
    }).data?.editorialOnly).toBeUndefined();
  });

  it("REPAIRED: an undeclared edit with no handoff at all fails the stage closed", async () => {
    await expect(reconcile(await tottoriCriticScar()))
      .rejects.toThrow(/05-transit\.json#\/0\/steps\/2.*without \S*critic-corrections\.v2\.json/s);
  });

  it("REPAIRED: declaring only SOME of the changed values still fails — nothing hides behind a sibling", async () => {
    const fixture = await tottoriCriticScar({
      corrections: [declare(TRANSIT, "/0/steps/2", before, after, "Kurayoshi–Misasa is Hinomaru routes 70/71, last departure 19:25")],
    });
    // The map recentre and the other six corrected steps are real factual movements.
    await expect(reconcile(fixture)).rejects.toThrow(/without declaring the edit/);
    await expect(reconcile(fixture)).rejects.toThrow(/\/1\/center\/lat/);
  });

  it("REPAIRED: ONE guide item carries SEVEN independent corrections, each with its own identity", async () => {
    const fixture = await tottoriCriticScar({
      corrections: declareHistorical(),
    });
    const result = await reconcile(fixture);
    expect(result.changed).toBe(true);
    expect(result.targets).toHaveLength(HISTORICAL.length);

    const evidence = await requireEvidence("tottori", { intakeDir: dir, runId: RUN_ID });
    const critic = evidence.evidence.filter((r) => r.origin === "critic");
    expect(critic).toHaveLength(HISTORICAL.length);
    // Distinct, deterministic ids — the defect was deriving identity from the anchor, which the
    // seven `Key transit routes` corrections all share.
    expect(new Set(critic.map((r) => r.id)).size).toBe(HISTORICAL.length);
    expect(IN_KEY_TRANSIT_ROUTES).toHaveLength(7);
    expect(critic.map((r) => r.id)).toContain("critic-correction-05-transit-json-0-steps-2");
    expect(critic.map((r) => r.id)).toContain("critic-correction-05-transit-json-0-steps-7");
    // The corrected route identity and last departure really did enter authoritative evidence.
    expect(critic.some((r) => r.claim.includes("routes 70/71"))).toBe(true);
    expect(critic.some((r) => r.claim.includes("19:25"))).toBe(true);
  });

  it("REPAIRED: the value is READ at the pointer, not searched for in the file text", async () => {
    // #107 asked whether correctedValue appeared ANYWHERE in the raw file and whether
    // previousValue appeared nowhere. "19:25" occurs in three separate steps of the rewritten
    // file, so a correction pointed at the WRONG step passed that substring test.
    expect(TOTTORI_TRANSIT_AFTER.split("19:25").length - 1).toBeGreaterThan(1);
    const corrections = declareHistorical();
    const misaddressed = corrections.map((c) => c.target === `${TRANSIT}#/0/steps/5`
      ? { ...c, correctedValue: valueAt(after, "/0/steps/2") } : c);
    await expect(reconcile(await tottoriCriticScar({ corrections: misaddressed })))
      .rejects.toThrow(/declares a correctedValue that is not what 05-transit\.json holds there/);

    const wrongBefore = corrections.map((c) => c.target === `${TRANSIT}#/1/span` ? { ...c, previousValue: "0.21" } : c);
    await expect(reconcile(await tottoriCriticScar({ corrections: wrongBefore })))
      .rejects.toThrow(/declares a previousValue \(before the edit\) that is not what 05-transit\.json holds there/);
  });

  it("REPAIRED: a declared target the critic did not actually change is refused", async () => {
    const corrections = [
      ...declareHistorical(),
      { ...declare(TRANSIT, "/0/title", before, after, "phantom"), previousValue: "Key transit routes", correctedValue: "Key transit routes" },
    ];
    await expect(reconcile(await tottoriCriticScar({ corrections })))
      .rejects.toThrow(/declares 05-transit\.json#\/0\/title, which the critic did not change/);
  });

  it("REPAIRED: a guide file the critic RENAMED or deleted is refused, not silently accepted", async () => {
    // The real critic pass renamed 05-transit.json → 03-transit.json (composition renumbers).
    // A dropped file reads as the whole document changing at `#/`, and a correction cannot
    // declare that (its correctedValue would have to be absent), so the stage fails closed —
    // renaming a guide file is not the critic's to do, and the refusal says so rather than
    // letting an unaccounted rename through.
    const guidesDir = path.join(dir, "guides");
    const fromDir = path.join(dir, "critic");
    await mkdir(path.join(guidesDir, "tottori"), { recursive: true });
    await mkdir(path.join(fromDir, "src", "content", "guides", "tottori"), { recursive: true });
    await writeFile(path.join(guidesDir, "tottori", TRANSIT), TOTTORI_TRANSIT_BEFORE);
    await writeFile(path.join(fromDir, "src", "content", "guides", "tottori", "03-transit.json"), TOTTORI_TRANSIT_BEFORE);
    await writeEvidence("tottori", evidenceDoc(), { intakeDir: dir });
    await expect(reconcile({ guidesDir, fromDir }))
      .rejects.toThrow(/critic changed 03-transit\.json#\/, 05-transit\.json#\/ without/);
  });

  it("REPAIRED: a critic pass that changed no guide value stays unchanged", async () => {
    const guidesDir = path.join(dir, "guides");
    const fromDir = path.join(dir, "critic");
    for (const root of [path.join(guidesDir, "tottori"), path.join(fromDir, "src", "content", "guides", "tottori")]) {
      await mkdir(root, { recursive: true });
      await writeFile(path.join(root, TRANSIT), TOTTORI_TRANSIT_BEFORE);
    }
    await writeEvidence("tottori", evidenceDoc(), { intakeDir: dir });
    await expect(reconcile({ guidesDir, fromDir })).resolves.toMatchObject({ changed: false, targets: [] });
  });
});

describe("R-A — a correction retires evidence only where the mapping is unambiguous", () => {
  const DROPPED = "https://hinomarubus.co.jp/timetable_route/3455/?tab=2";
  const MUSEUM = "https://www.sand-museum.jp/information/";
  const busEvidence = () => evidenceDoc({
    candidates: [],
    evidence: [...tottoriBusOriginRecords(), ...tottoriRepeatedValueRecords()],
    reconciliation: [{
      findingId: "ev-mitokusan-nageiredo-rules", disposition: "adopt",
      note: "historical row, relation declared", corroborates: { kind: "none", evidenceIds: [] },
    }],
  });

  it("PRE-REPAIR: the historical transit item's origin carries TWO records asserting different things", () => {
    // The link is in the artifact, not in a note: 05-transit.json#/0 cited this exact URL before
    // the rewrite. But two Pass-A records rest on it, asserting different propositions — the
    // route's identity and its timetable. Nothing in the artifact says which one a given
    // correction invalidated.
    expect(before[0].source_url).toBe(DROPPED);
    expect(after[0].source_url).not.toBe(DROPPED);
    const resting = tottoriBusOriginRecords().filter((r) => r.source.url === DROPPED);
    expect(resting.map((r) => r.id)).toEqual(["ev-bus-route-exists", "ev-bus-downbound-schedule"]);
    expect(resting[0].claim).toContain("(72)(73)");   // route identity
    expect(resting[1].claim).toContain("19:08");      // timetable
    // …and a third record cites the OTHER tab of the same timetable: a different origin entirely.
    expect(tottoriBusOriginRecords().find((r) => r.id === "ev-bus-upbound-last").source.url).not.toBe(DROPPED);
  });

  it("REPAIRED: a shared origin retires NOTHING and is reported unresolved", async () => {
    // Retiring the whole origin would invent coverage gaps for the proposition the correction did
    // not touch; picking one would be the claim-text similarity this repair exists to avoid. So
    // the decision fails closed and says so, and every record stays current.
    const fixture = await tottoriCriticScar({ corrections: declareHistorical() }, busEvidence());
    const result = await reconcile(fixture);
    expect(result.superseded).toEqual([]);
    expect(result.unresolved.join("\n")).toMatch(/stopped citing .*3455.*which 2 evidence records rest on/);
    expect(result.unresolved.join("\n")).toMatch(/ev-bus-route-exists, ev-bus-downbound-schedule/);
    expect(result.unresolved.join("\n")).toMatch(/none is retired/);

    const evidence = await requireEvidence("tottori", { intakeDir: dir, runId: RUN_ID });
    expect(dispositionProblems(evidence)).toEqual([]);
    expect(supersededEvidenceIds(evidence).size).toBe(0);
    expect(evidence.reconciliation.filter((r) => r.disposition === "replace")).toEqual([]);
  });

  it("REPAIRED: an unrelated record sharing the origin of a corrected one stays current", async () => {
    // The reviewer's case, on real records: `ev-bus-route-exists` (route identity) and
    // `ev-bus-downbound-schedule` (timetable) share one URL. Whichever the rewrite disproved, the
    // other is untouched — and coverage resting on either still counts.
    const fixture = await tottoriCriticScar({ corrections: declareHistorical() }, busEvidence());
    await reconcile(fixture);
    const evidence = await requireEvidence("tottori", { intakeDir: dir, runId: RUN_ID });
    const ask = (ids) => ({ schemaVersion: "wp-coverage/2.0", slug: "tottori", runId: RUN_ID, asks: [{ ...tottoriConstraintsAsk(), evidenceIds: ids }] });
    const binding = { evidenceDoc: evidence, bindingAskIds: new Set(["constraints"]) };
    expect(coverageProblems(ask(["ev-bus-route-exists"]), binding)).toEqual([]);
    expect(coverageProblems(ask(["ev-bus-downbound-schedule"]), binding)).toEqual([]);
  });

  /** One fact row, re-sourced. Exactly one evidence record rests on the origin it dropped, so
      "the evidence this item stopped resting on" names one record and no judgement is involved. */
  async function reSourcedFactRow(from, to) {
    const guidesDir = path.join(dir, "guides");
    const fromDir = path.join(dir, "critic");
    await mkdir(path.join(guidesDir, "tottori"), { recursive: true });
    await mkdir(path.join(fromDir, "src", "content", "guides", "tottori"), { recursive: true });
    await mkdir(path.join(fromDir, "guides-intake", "tottori"), { recursive: true });
    const row = (value, url) => JSON.stringify({ "sand-museum-admission": {
      claim: "Sand Museum adult admission", value, source_url: url,
      verified_on: "2026-08-26", shelf_life: "venue", state: "exact", tier: "primary",
    } }, null, 2) + "\n";
    await writeFile(path.join(guidesDir, "tottori", "facts.json"), row("¥800", from));
    await writeFile(path.join(fromDir, "src", "content", "guides", "tottori", "facts.json"), row("¥900", to));
    await writeEvidence("tottori", busEvidence(), { intakeDir: dir });
    const declareRow = (pointer, previousValue, correctedValue) => ({
      target: `facts.json#${pointer}`, previousValue, correctedValue, claim: "Sand Museum adult admission",
      source: { ...SOURCE, url: to, kind: "official", family: "sand-museum" },
      verifiedOn: "2026-08-27", freshness: { perishable: true, shelfLife: "venue", recheckOn: "2026-10-27" },
    });
    const corrections = [declareRow("/sand-museum-admission/value", "¥800", "¥900")];
    if (from !== to) corrections.push(declareRow("/sand-museum-admission/source_url", from, to));
    await writeFile(path.join(fromDir, "guides-intake", "tottori", "critic-corrections.v2.json"), JSON.stringify({
      schemaVersion: CRITIC_CORRECTIONS_SCHEMA, slug: "tottori", runId: RUN_ID, corrections,
    }));
    return reconcileCriticCorrections("tottori", { guidesDir, fromDir, intakeDir: dir, runId: RUN_ID });
  }

  it("REPAIRED: a SINGLE record on the dropped origin is retired, and coverage on it fails closed", async () => {
    const result = await reSourcedFactRow(MUSEUM, "https://www.sand-museum.jp/2026/admission/");
    expect(result.superseded).toEqual(["ev-sand-museum-hours-price"]);
    expect(result.unresolved).toEqual([]);

    const evidence = await requireEvidence("tottori", { intakeDir: dir, runId: RUN_ID });
    expect(dispositionProblems(evidence)).toEqual([]);
    const row = evidence.reconciliation.find((r) => r.disposition === "replace");
    expect(row.supersedes).toEqual({ kind: "evidence", evidenceIds: ["ev-sand-museum-hours-price"] });
    // Unrelated entities are untouched, including the other ¥800 record a value scan would take.
    expect(supersededEvidenceIds(evidence).has("ev-mitokusan-nageiredo-rules")).toBe(false);

    const doc = { schemaVersion: "wp-coverage/2.0", slug: "tottori", runId: RUN_ID, asks: [{ ...tottoriConstraintsAsk(), evidenceIds: ["ev-sand-museum-hours-price"] }] };
    const problems = coverageProblems(doc, { evidenceDoc: evidence, bindingAskIds: new Set(["constraints"]) }).join("\n");
    expect(problems).toMatch(/all cited evidence is disproven or superseded/);
    expect(problems).toMatch(/BINDING ask "constraints" has no qualifying current evidence/);
  });

  it("REPAIRED: an item that still cites its origin retires nothing, however the value moved", async () => {
    // The ¥800 admission edit alone does not re-source the row, so the link its evidence rests on
    // is intact and nothing is retired — the value itself is never scanned for.
    const result = await reSourcedFactRow(MUSEUM, MUSEUM);
    expect(result.superseded).toEqual([]);
    expect(result.unresolved).toEqual([]);
    const evidence = await requireEvidence("tottori", { intakeDir: dir, runId: RUN_ID });
    expect(evidence.reconciliation.filter((r) => r.disposition === "replace")).toEqual([]);
  });
});

describe("R-A — a repeated ordinary value never retires unrelated evidence", () => {
  const ADMISSION = "ev-sand-museum-hours-price";
  const PERMIT = "ev-mitokusan-nageiredo-rules";

  it("PRE-REPAIR: real Tottori evidence carries ¥800 on two unrelated entities", () => {
    const records = byId(tottoriRepeatedValueRecords());
    expect(records.get(ADMISSION).claim).toContain("¥800");   // Sand Museum adult admission
    expect(records.get(PERMIT).claim).toContain("¥800");      // Mitokusan climbing permit + waraji
    expect(records.get(ADMISSION).candidateId).not.toBe(records.get(PERMIT).candidateId);
    // #107 retired every non-critic record whose claim CONTAINED the corrected previousValue.
    const wouldRetire = tottoriRepeatedValueRecords()
      .filter((r) => r.origin !== "critic" && r.claim.includes("¥800")).map((r) => r.id);
    expect(wouldRetire).toEqual([ADMISSION, PERMIT]);
  });

  it("REPAIRED: correcting the Sand Museum admission retires neither record", async () => {
    const guidesDir = path.join(dir, "guides");
    const fromDir = path.join(dir, "critic");
    await mkdir(path.join(guidesDir, "tottori"), { recursive: true });
    await mkdir(path.join(fromDir, "src", "content", "guides", "tottori"), { recursive: true });
    await mkdir(path.join(fromDir, "guides-intake", "tottori"), { recursive: true });
    await writeFile(path.join(guidesDir, "tottori", "facts.json"), TOTTORI_ADMISSION_FACTS("¥800"));
    await writeFile(path.join(fromDir, "src", "content", "guides", "tottori", "facts.json"), TOTTORI_ADMISSION_FACTS("¥900"));
    await writeEvidence("tottori", evidenceDoc({
      candidates: [], evidence: tottoriRepeatedValueRecords(),
      reconciliation: [{
        findingId: PERMIT, disposition: "adopt", note: "historical row",
        corroborates: { kind: "none", evidenceIds: [] },
      }],
    }), { intakeDir: dir });
    await writeFile(path.join(fromDir, "guides-intake", "tottori", "critic-corrections.v2.json"), JSON.stringify({
      schemaVersion: CRITIC_CORRECTIONS_SCHEMA, slug: "tottori", runId: RUN_ID,
      corrections: [{
        target: "facts.json#/sand-museum-admission/value", previousValue: "¥800", correctedValue: "¥900",
        claim: "Sand Museum adult admission", source: { ...SOURCE, url: "https://www.sand-museum.jp/information/", kind: "official", family: "sand-museum" },
        verifiedOn: "2026-08-27", freshness: { perishable: true, shelfLife: "venue", recheckOn: "2026-10-27" },
      }],
    }));

    const result = await reconcileCriticCorrections("tottori", { guidesDir, fromDir, intakeDir: dir, runId: RUN_ID });
    expect(result).toMatchObject({ changed: true, targets: ["facts.json#/sand-museum-admission/value"] });
    const evidence = await requireEvidence("tottori", { intakeDir: dir, runId: RUN_ID });
    // Nothing at all is retired: not the Mitokusan permit (a different entity that merely shares
    // the string) and not the admission record either (no relation identifies it).
    const replaces = evidence.reconciliation.filter((row) => row.disposition === "replace");
    expect(replaces).toEqual([]);
    expect(evidence.reconciliation.find((r) => r.findingId.startsWith("critic-correction-")))
      .toMatchObject({ disposition: "adopt", corroborates: { kind: "none", evidenceIds: [] } });
    expect(dispositionProblems(evidence)).toEqual([]);
  });
});

describe("R-A — the generated critic instruction and the validator share one target grammar", () => {
  it("every target the capsule shows the critic is a target the validator accepts", async () => {
    const capsule = await generateContractCapsule("critic", { slug: "tottori", runId: RUN_ID });
    const examples = [...capsule.matchAll(/`((?:facts|_guide|\d\d-[a-z0-9-]+)\.json#[^`]+)`/g)].map((m) => m[1]);
    expect(examples.length).toBeGreaterThanOrEqual(3);
    for (const example of examples) expect(example).toMatch(CRITIC_TARGET);
    // …and the grammar it states is the pointer, explicitly NOT the slug/title shape #107's
    // prompt asked for while its validator compared against slugified anchors.
    expect(capsule).toContain("RFC 6901 JSON pointer");
    expect(capsule).toMatch(/NOT\s+a title, name, label or slug/);
    expect(capsule).not.toContain("editorialOnly");
  });

  it("the slugified-anchor grammar #107 generated is refused by the schema", () => {
    for (const target of ["05-transit.json#key-transit-routes", "05-transit.json#Key transit routes", "05-transit.json#"]) {
      expect(target).not.toMatch(CRITIC_TARGET);
    }
    expect("05-transit.json#/0/steps/2").toMatch(CRITIC_TARGET);
  });
});

// ── R-E ──────────────────────────────────────────────────────────────────────

describe("R-E — Pass A + Pass B convergence is not independent corroboration", () => {
  const A = "ev-yohaijo-details";              // passA, family "misasa-town", independent: null
  const B = "ev-nageiredo-viewing-platform";   // passB, family "misasaonsen-official", independent: null

  it("PRE-REPAIR: the historical row asserts corroboration in a NOTE and normalized text never groups the pair", () => {
    const records = byId(tottoriEvidenceRecords());
    const row = tottoriReconciliationRows().find((r) => r.findingId === B);
    expect(row.disposition).toBe("adopt");                       // not `agree`
    expect(row.note).toMatch(/Corroborates Pass A's ev-yohaijo-details/);
    expect(row.corroborates).toBeUndefined();                     // no relation exists at all
    // #105 grouped on `${candidateId}\0${normalizedClaim}`; both halves differ here even though
    // both records assert the same ~600 m proposition about the same platform.
    const normalize = (r) => String(r.claim).toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    expect(normalize(records.get(A))).not.toBe(normalize(records.get(B)));
    expect(records.get(A).candidateId).not.toBe(records.get(B).candidateId);
    expect(records.get(A).claim).toContain("600m");
    expect(records.get(B).claim).toContain("600m");
  });

  it("RED-BEFORE: the UNTOUCHED historical artifact is refused until the relation is supplied", () => {
    // Nothing is inserted before the validator runs. The rows are exactly as reconcile wrote
    // them, at 2.3 — and silence is refused, so the note's claim can never pass unexamined.
    const problems = dispositionProblems(evidenceDoc()).join("\n");
    expect(problems).toMatch(/"ev-nageiredo-viewing-platform" does not declare what it corroborates/);
    expect(problems).toMatch(/a note is not a relation/);
    // The convergence rule genuinely has nothing to inspect on the untouched shape — which is
    // exactly why the refusal above, not that rule, is what closes the historical case.
    expect(independentAgreementProblems(evidenceDoc())).toEqual([]);
  });

  it("REPAIRED: once the relation is declared, unproven independence fails closed", () => {
    const reconciliation = tottoriReconciliationRows().map((row) => row.findingId === B
      ? { ...row, corroborates: { kind: "factual", evidenceIds: [A] } }
      : { ...row, corroborates: { kind: "none", evidenceIds: [] }, ...(row.disposition === "replace" ? { supersedes: { kind: "recommendation", evidenceIds: [] } } : {}) });
    const problems = independentAgreementProblems(evidenceDoc({ reconciliation })).join("\n");
    expect(problems).toMatch(/Pass A and Pass B converging is not itself independent corroboration/);
    expect(problems).toMatch(/established independence/);
  });

  it("REPAIRED: two sources whose independence IS established still corroborate", () => {
    const establish = (record) => ({ ...record, source: { ...record.source, independent: true } });
    const evidence = tottoriEvidenceRecords().map((r) => ([A, B].includes(r.id) ? establish(r) : r));
    const reconciliation = [{ findingId: B, disposition: "adopt", note: "corroborated", corroborates: { kind: "factual", evidenceIds: [A] } }];
    expect(independentAgreementProblems(evidenceDoc({ evidence, reconciliation }))).toEqual([]);
  });

  it("REPAIRED: accepted Uruguay `agree` semantics survive — recommendation agreement needs no factual corroboration", () => {
    // Uruguay's accepted artifact uses `agree` for concurrence with Pass B's own shortlist call
    // ("recorded as a future-trip lead only"), deliberately single-sourced. Requiring factual
    // corroboration on every `agree` would have invalidated it; the typed kind does not.
    const lead = {
      id: "ev-la-pedrera-single", candidateId: null,
      claim: "Single-sourced La Pedrera read, recorded as a future-trip lead only",
      kind: "objective", origin: "passB",
      source: { url: "https://ohlala.example/la-pedrera", kind: "editorial", access: "fetched", language: "es", publishedAt: "2025-02-01", family: "ohlala", independent: null, appliesToYears: [] },
      verifiedOn: "2026-08-26", firsthand: null, freshness: { perishable: false, shelfLife: null, recheckOn: null },
    };
    const doc = evidenceDoc({
      candidates: [], evidence: [lead],
      reconciliation: [{
        findingId: lead.id, disposition: "agree",
        note: "Concurs with Pass B's own 'considered', not shipped, call — a future-trip lead, not woven into the guide.",
        corroborates: { kind: "recommendation", evidenceIds: [] },
      }],
    });
    expect(dispositionProblems(doc)).toEqual([]);
    expect(independentAgreementProblems(doc)).toEqual([]);
  });

  it("REPAIRED: a factual corroboration kind must name records, a recommendation kind must not", () => {
    const row = (corroborates) => evidenceDoc({
      candidates: [], evidence: tottoriEvidenceRecords().filter((r) => [A, B].includes(r.id)),
      reconciliation: [{ findingId: B, disposition: "agree", note: "n", corroborates }],
    });
    expect(dispositionProblems(row({ kind: "factual", evidenceIds: [] })).join())
      .toMatch(/declares corroborates kind "factual" but names no evidence record/);
    expect(dispositionProblems(row({ kind: "recommendation", evidenceIds: [A] })).join())
      .toMatch(/declares corroborates kind "recommendation", which names no record, yet lists/);
    expect(dispositionProblems(row({ kind: "factual", evidenceIds: ["ev-does-not-exist"] })).join())
      .toMatch(/corroborates unknown evidence id/);
  });
});

// ── R-F ──────────────────────────────────────────────────────────────────────

describe("R-F — supersession is machine-identified, and never invents a record that never existed", () => {
  const TAXI = "ev-jumbo-taxi";
  const relate = (extra = {}) => (row) => ({
    ...row, corroborates: { kind: "none", evidenceIds: [] }, ...(extra[row.findingId] || {}),
  });

  it("PRE-REPAIR: the historical replace row names its victim only in prose, and that victim is not evidence", () => {
    const row = tottoriReconciliationRows().find((r) => r.disposition === "replace");
    expect(row.findingId).toBe(TAXI);
    expect(row.note).toMatch(/Supersedes Pass A's weak taxi fallback/);
    expect(row.supersedes).toBeUndefined();
    // The thing it replaced is a Pass-A CONCLUSION. No evidence record carries it, so a contract
    // demanding an evidence id here can only be satisfied by fabricating one.
    expect(tottoriEvidenceRecords().some((r) => /Nikko|Chuo Taxi/i.test(r.claim))).toBe(false);
  });

  it("RED-BEFORE: the UNTOUCHED historical replace row is refused until it declares what it replaced", () => {
    const problems = dispositionProblems(evidenceDoc()).join("\n");
    expect(problems).toMatch(/"ev-jumbo-taxi" replaces prior work without declaring what/);
  });

  it("REPAIRED (2): the historical case is representable truthfully, with no invented id", () => {
    const reconciliation = tottoriReconciliationRows().map(relate({
      [TAXI]: { supersedes: { kind: "recommendation", evidenceIds: [] } },
    }));
    expect(dispositionProblems(evidenceDoc({ reconciliation }))).toEqual([]);
    // A `recommendation` replacement retires no evidence record — it never had one to retire.
    const superseded = tottoriEvidenceRecords()
      .filter((r) => coverageProblems(
        { schemaVersion: "wp-coverage/2.0", slug: "tottori", runId: RUN_ID, asks: [{ ...tottoriConstraintsAsk(), evidenceIds: [r.id], where: ["05-transit.json#key-transit-routes"] }] },
        { evidenceDoc: evidenceDoc({ reconciliation }) },
      ).some((p) => /disproven or superseded/.test(p)));
    expect(superseded).toEqual([]);
  });

  it("REPAIRED (2, 5): a recommendation replacement does not invalidate coverage", () => {
    const reconciliation = tottoriReconciliationRows().map(relate({
      [TAXI]: { supersedes: { kind: "recommendation", evidenceIds: [] } },
    }));
    const ask = { ...tottoriConstraintsAsk(), evidenceIds: ["ev-yohaijo-details", "ev-nageiredo-viewing-platform", TAXI] };
    const doc = { schemaVersion: "wp-coverage/2.0", slug: "tottori", runId: RUN_ID, asks: [ask] };
    expect(coverageProblems(doc, { evidenceDoc: evidenceDoc({ reconciliation }), bindingAskIds: new Set(["constraints"]) })).toEqual([]);
  });

  it("REPAIRED (1, 3): replacing a REAL older record retires it while the replacement stays current", () => {
    // The relation, demonstrated on a real record: when a `replace` genuinely retires evidence,
    // `kind: "evidence"` names it and coverage stops counting it. (The historical jumbo-taxi row
    // retired no record at all — that case is the `recommendation` kind above.)
    const reconciliation = tottoriReconciliationRows().map(relate({
      [TAXI]: { supersedes: { kind: "evidence", evidenceIds: ["ev-kurayoshi-station-accessible"] } },
    }));
    const evidenceState = evidenceDoc({ reconciliation });
    expect(dispositionProblems(evidenceState)).toEqual([]);

    const askOn = (ids) => ({ schemaVersion: "wp-coverage/2.0", slug: "tottori", runId: RUN_ID, asks: [{ ...tottoriConstraintsAsk(), evidenceIds: ids }] });
    const binding = { bindingAskIds: new Set(["constraints"]) };
    // (4) coverage backed SOLELY by the superseded record fails closed…
    const problems = coverageProblems(askOn(["ev-kurayoshi-station-accessible"]), { evidenceDoc: evidenceState, ...binding }).join("\n");
    expect(problems).toMatch(/all cited evidence is disproven or superseded/);
    expect(problems).toMatch(/BINDING ask "constraints" has no qualifying current evidence/);
    // (3) …while the replacement finding itself remains current and can carry the same ask.
    expect(coverageProblems(askOn([TAXI]), { evidenceDoc: evidenceState, ...binding })).toEqual([]);
  });

  it("REPAIRED: supersedes is referentially validated and legal only on `replace`", () => {
    const ghost = tottoriReconciliationRows().map(relate({ [TAXI]: { supersedes: { kind: "evidence", evidenceIds: ["ev-does-not-exist"] } } }));
    expect(dispositionProblems(evidenceDoc({ reconciliation: ghost })).join()).toMatch(/supersedes unknown evidence id/);

    const empty = tottoriReconciliationRows().map(relate({ [TAXI]: { supersedes: { kind: "evidence", evidenceIds: [] } } }));
    expect(dispositionProblems(evidenceDoc({ reconciliation: empty })).join()).toMatch(/declares supersedes kind "evidence" but names no evidence record/);

    const misplaced = tottoriReconciliationRows()
      .map(relate({ [TAXI]: { supersedes: { kind: "recommendation", evidenceIds: [] } } }))
      .map((row) => row.findingId === "ev-nageiredo-viewing-platform"
        ? { ...row, supersedes: { kind: "evidence", evidenceIds: [TAXI] } } : row);
    expect(dispositionProblems(evidenceDoc({ reconciliation: misplaced })).join())
      .toMatch(/is dispositioned "adopt" but declares supersedes — only "replace" retires prior work/);
  });

  it("historical artifacts written before 2.3 are not failed for lacking the relations", () => {
    const legacy = { ...evidenceDoc(), schemaVersion: "wp-evidence/2.1" };
    expect(dispositionProblems(legacy)).toEqual([]);
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
