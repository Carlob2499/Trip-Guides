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
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { EVIDENCE_SCHEMA, CRITIC_CORRECTIONS_SCHEMA, CRITIC_TARGET, criticCorrectionDocSchema, supersededEvidenceIds } from "../pipeline/v2/contracts.mjs";
import { reconcileCriticCorrections, writeEvidence, requireEvidence, dispositionProblems } from "../pipeline/v2/evidence.mjs";
import { independentAgreementProblems } from "../pipeline/v2/research-rules.mjs";
import { coverageProblems } from "../pipeline/v2/coverage.mjs";
import { generateContractCapsule } from "../pipeline/v2/contract-capsule.mjs";
import { requireCriticBaseline } from "../pipeline-v2.mjs";
import {
  initRunV2, readRunStateV2, stageStart, stageComplete, stageFail, reopenForAnswers, routeToEvidenceOwner,
} from "../pipeline/v2/run-state.mjs";
import { retryEligibility } from "../pipeline/v2/recovery.mjs";
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

describe("R-A — an unresolvable supersession fails the stage, it is not logged and waved through", () => {
  const DROPPED = "https://hinomarubus.co.jp/timetable_route/3455/?tab=2";
  const busEvidence = (evidence) => evidenceDoc({
    candidates: [], evidence,
    reconciliation: evidence.filter((r) => r.origin === "passB").map((r) => ({
      findingId: r.id, disposition: "adopt", note: "historical row, relation declared",
      corroborates: { kind: "none", evidenceIds: [] },
    })),
  });

  it("PRE-REPAIR: the historical transit item's origin carries records asserting different things", () => {
    expect(before[0].source_url).toBe(DROPPED);
    expect(after[0].source_url).not.toBe(DROPPED);
    const resting = tottoriBusOriginRecords().filter((r) => r.source.url === DROPPED);
    expect(resting.map((r) => r.id)).toEqual(["ev-bus-route-exists", "ev-bus-downbound-schedule"]);
    expect(resting[0].claim).toContain("(72)(73)");   // route identity
    expect(resting[1].claim).toContain("19:08");      // timetable
    // A third record cites the OTHER tab of the same timetable: a different origin entirely.
    expect(tottoriBusOriginRecords().find((r) => r.id === "ev-bus-upbound-last").source.url).not.toBe(DROPPED);
  });

  it("REPAIRED: re-sourcing an item off an origin evidence rests on is REFUSED, and ROUTED to the owner", async () => {
    // Not retired (that invents coverage gaps), not guessed (that is claim-text similarity), and
    // not logged-and-continued (that leaves disproven evidence eligible for coverage).
    const fixture = await tottoriCriticScar({ corrections: declareHistorical() },
      busEvidence([...tottoriBusOriginRecords(), ...tottoriRepeatedValueRecords()]));
    const err = await reconcile(fixture).catch((e) => e);
    expect(err.message).toMatch(/EVIDENCE OWNER \(reconcile\) resolves this; the blind critic cannot/);
    expect(err.message).toMatch(/still resting: ev-bus-route-exists, ev-bus-downbound-schedule/);
    expect(err.message).toMatch(/evidence records carry no proposition identity/);
    // Typed, so the CLI can ROUTE it rather than auto-retrying a stage that cannot comply.
    expect(err.needsEvidenceReconciliation).toHaveLength(1);
    expect(err.needsEvidenceReconciliation[0]).toMatchObject({
      correction: `${TRANSIT}#/0/source_url`, recordId: "critic-correction-05-transit-json-0-source-url",
    });

    // …and the proven corrections ARE already in authoritative evidence, which is both the R-A
    // requirement and what gives the owner real finding ids to declare `supersedes` against.
    const evidence = await requireEvidence("tottori", { intakeDir: dir, runId: RUN_ID });
    expect(evidence.evidence.filter((r) => r.origin === "critic")).toHaveLength(10);
    expect(evidence.evidence.some((r) => r.id === err.needsEvidenceReconciliation[0].recordId)).toBe(true);
  });

  it("REPAIRED: ONE record on the dropped origin is still refused — cardinality is not proposition identity", async () => {
    // A page can carry several facts while the artifact happens to hold one record from it, so
    // "the only record from that URL" proves nothing about which proposition moved.
    const only = tottoriBusOriginRecords().filter((r) => r.id === "ev-bus-downbound-schedule");
    const fixture = await tottoriCriticScar({ corrections: declareHistorical() }, busEvidence(only));
    const err = await reconcile(fixture).catch((e) => e);
    expect(err.needsEvidenceReconciliation[0].records).toEqual(["ev-bus-downbound-schedule"]);
  });

  it("REPAIRED: once the OWNER declares the relation, the same correction passes — repair to green", async () => {
    // The historical class now has a path to green: reconcile declares supersedes on the
    // critic-correction finding, and the identical critic output is re-validated and accepted.
    const CORRECTION = "critic-correction-05-transit-json-0-source-url";
    const RETIRED = ["ev-bus-route-exists", "ev-bus-downbound-schedule"];
    const repaired = busEvidence([...tottoriBusOriginRecords(), ...tottoriRepeatedValueRecords()]);
    repaired.evidence.push({
      id: CORRECTION, candidateId: null, claim: "Tottori transfer fact at /0/source_url: " + after[0].source_url,
      kind: "objective", origin: "critic", source: SOURCE, verifiedOn: "2026-08-26", firsthand: null, freshness: FRESHNESS,
    });
    repaired.reconciliation.push({
      findingId: CORRECTION, disposition: "replace",
      note: "the critic re-fetched the operator timetable; these rest on the timetable the item no longer cites",
      corroborates: { kind: "none", evidenceIds: [] },
      supersedes: { kind: "evidence", evidenceIds: RETIRED },
    });
    const fixture = await tottoriCriticScar({ corrections: declareHistorical() }, repaired);
    await expect(reconcile(fixture)).resolves.toMatchObject({ changed: true });

    const evidence = await requireEvidence("tottori", { intakeDir: dir, runId: RUN_ID });
    expect(dispositionProblems(evidence)).toEqual([]);
    // The disproven records are retired, so a BINDING ask resting only on them fails closed…
    const ask = (ids) => ({ schemaVersion: "wp-coverage/2.0", slug: "tottori", runId: RUN_ID, asks: [{ ...tottoriConstraintsAsk(), evidenceIds: ids }] });
    const binding = { evidenceDoc: evidence, bindingAskIds: new Set(["constraints"]) };
    expect(coverageProblems(ask(RETIRED), binding).join("\n")).toMatch(/all cited evidence is disproven or superseded/);
    // …while the correction that replaced them stays current and carries the ask.
    expect(coverageProblems(ask([CORRECTION]), binding)).toEqual([]);
  });

  it("REPAIRED: a correction that does not re-source its item passes, and retires nothing", async () => {
    // The ¥800 admission edit leaves the row's source_url intact, so no link is dropped and the
    // value itself is never scanned for — the unrelated ¥800 entity is untouched either way.
    const guidesDir = path.join(dir, "guides");
    const fromDir = path.join(dir, "critic");
    await mkdir(path.join(guidesDir, "tottori"), { recursive: true });
    await mkdir(path.join(fromDir, "src", "content", "guides", "tottori"), { recursive: true });
    await mkdir(path.join(fromDir, "guides-intake", "tottori"), { recursive: true });
    await writeFile(path.join(guidesDir, "tottori", "facts.json"), TOTTORI_ADMISSION_FACTS("¥800"));
    await writeFile(path.join(fromDir, "src", "content", "guides", "tottori", "facts.json"), TOTTORI_ADMISSION_FACTS("¥900"));
    await writeEvidence("tottori", busEvidence(tottoriRepeatedValueRecords()), { intakeDir: dir });
    await writeFile(path.join(fromDir, "guides-intake", "tottori", "critic-corrections.v2.json"), JSON.stringify({
      schemaVersion: CRITIC_CORRECTIONS_SCHEMA, slug: "tottori", runId: RUN_ID,
      corrections: [{
        target: "facts.json#/sand-museum-admission/value", previousValue: "¥800", correctedValue: "¥900",
        claim: "Sand Museum adult admission",
        source: { ...SOURCE, url: "https://www.sand-museum.jp/information/", kind: "official", family: "sand-museum" },
        verifiedOn: "2026-08-27", freshness: { perishable: true, shelfLife: "venue", recheckOn: "2026-10-27" },
      }],
    }));
    const result = await reconcileCriticCorrections("tottori", { guidesDir, fromDir, intakeDir: dir, runId: RUN_ID });
    expect(result).toEqual({ changed: true, targets: ["facts.json#/sand-museum-admission/value"] });
    const evidence = await requireEvidence("tottori", { intakeDir: dir, runId: RUN_ID });
    expect(evidence.reconciliation.filter((r) => r.disposition === "replace")).toEqual([]);
    expect(supersededEvidenceIds(evidence).size).toBe(0);
    expect(dispositionProblems(evidence)).toEqual([]);
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

// ── R-A: the pinned baseline, and the retry that repairs only the handoff ────

describe("R-A — the pre-critic baseline is a REQUIREMENT, and the retry repairs the handoff alone", () => {
  let repo;
  const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();

  beforeEach(async () => {
    repo = await mkdtemp(path.join(tmpdir(), "waypoint-baseline-"));
    execFileSync("git", ["init", "-q", "-b", "main"], { cwd: repo });
    git("config", "user.name", "test");
    git("config", "user.email", "test@example.com");
    await mkdir(path.join(repo, "src", "content", "guides", "tottori"), { recursive: true });
    await writeFile(path.join(repo, "src", "content", "guides", "tottori", TRANSIT), TOTTORI_TRANSIT_BEFORE);
    await writeFile(path.join(repo, "src", "content", "guides", "tottori", "facts.json"), TOTTORI_FACTS);
    git("add", "-A");
    git("commit", "-q", "-m", "reconcile");
  });
  afterEach(async () => { await rm(repo, { recursive: true, force: true }); });

  const stateWith = (baseline, reconcileStatus = "complete") =>
    ({ stages: { reconcile: { status: reconcileStatus, commit: baseline }, critic: { baseline } } });

  it("REPAIRED: a missing reconcile commit REFUSES the gate — the working tree is not a fallback", () => {
    expect(() => requireCriticBaseline(stateWith(null), "tottori", { cwd: repo }))
      .toThrow(/recorded no baseline when it began/);
    expect(() => requireCriticBaseline(stateWith(undefined), "tottori", { cwd: repo }))
      .toThrow(/working tree is NOT a fallback/);
    // …and a reconcile that is not recorded complete is refused too, however good the SHA.
    expect(() => requireCriticBaseline(stateWith("0".repeat(40), "failed"), "tottori", { cwd: repo }))
      .toThrow(/`reconcile` is not recorded complete/);
  });

  it("REPAIRED: an unreadable baseline REFUSES the gate, even with retained edits sitting in the tree", async () => {
    // The retained corrected guide is present — exactly the state that made a silent fallback
    // dangerous, because diffing it against itself shows no change.
    await writeFile(path.join(repo, "src", "content", "guides", "tottori", TRANSIT), TOTTORI_TRANSIT_AFTER);
    expect(() => requireCriticBaseline(stateWith("0".repeat(40)), "tottori", { cwd: repo }))
      .toThrow(/working tree is NOT a fallback/);
    // …and a baseline that exists but is not readable whole is refused too, not half-read.
    git("rm", "-q", "--cached", `src/content/guides/tottori/${TRANSIT}`);
    await writeFile(path.join(repo, "src", "content", "guides", "tottori", TRANSIT), "{ not json");
    git("add", "-A"); git("commit", "-q", "-m", "broken");
    expect(() => requireCriticBaseline(stateWith(git("rev-parse", "HEAD")), "tottori", { cwd: repo }))
      .toThrow(/missing, incomplete or not valid JSON/);
  });

  it("REPAIRED: attempt 2 repairs ONLY the handoff — the retained guide edits are never regenerated", async () => {
    const reconcileSha = git("rev-parse", "HEAD");           // the tree the critic was handed
    const baselineDocs = () => requireCriticBaseline(stateWith(reconcileSha), "tottori", { cwd: repo });
    const fromDir = path.join(dir, "critic");
    await mkdir(path.join(fromDir, "src", "content", "guides", "tottori"), { recursive: true });
    await mkdir(path.join(fromDir, "guides-intake", "tottori"), { recursive: true });
    const handoffFile = path.join(fromDir, "guides-intake", "tottori", "critic-corrections.v2.json");
    const writeHandoff = (corrections) => writeFile(handoffFile, JSON.stringify({
      schemaVersion: CRITIC_CORRECTIONS_SCHEMA, slug: "tottori", runId: RUN_ID, corrections,
    }, null, 2));
    // The critic's sandbox: the corrected guide, and an INCOMPLETE handoff (one row of ten).
    await writeFile(path.join(fromDir, "src", "content", "guides", "tottori", "facts.json"), TOTTORI_FACTS);
    await writeFile(path.join(fromDir, "src", "content", "guides", "tottori", TRANSIT), TOTTORI_TRANSIT_AFTER);
    await writeHandoff([declare(TRANSIT, "/0/steps/2", before, after, "the only declared row")]);
    await writeEvidence("tottori", evidenceDoc({ candidates: [], evidence: [], reconciliation: [] }), { intakeDir: dir });
    const run = () => reconcileCriticCorrections("tottori", { fromDir, intakeDir: dir, runId: RUN_ID, baselineDocs: baselineDocs() });

    // ATTEMPT 1 fails on the undeclared values…
    await expect(run()).rejects.toThrow(/without declaring the edit/);

    // …and the workflow retains the corrected guide AND the handoff into the trusted tree.
    await writeFile(path.join(repo, "src", "content", "guides", "tottori", TRANSIT), TOTTORI_TRANSIT_AFTER);
    await mkdir(path.join(repo, "guides-intake", "tottori"), { recursive: true });
    await writeFile(path.join(repo, "guides-intake", "tottori", "critic-corrections.v2.json"), await readFile(handoffFile, "utf8"));
    git("add", "-A");
    git("commit", "-q", "-m", "critic attempt output (verify FAILED — retained for repair)");
    const retained = git("rev-parse", "HEAD");
    expect(retained).not.toBe(reconcileSha);

    // ATTEMPT 2 edits ONLY the handoff. The guide bytes are byte-identical to attempt 1's — the
    // critic regenerates nothing — and the retained handoff is what it repairs.
    const guideBefore = await readFile(path.join(fromDir, "src", "content", "guides", "tottori", TRANSIT), "utf8");
    const carried = JSON.parse(await readFile(path.join(repo, "guides-intake", "tottori", "critic-corrections.v2.json"), "utf8"));
    expect(carried.corrections).toHaveLength(1);            // the previous values are still legible
    await writeHandoff(declareHistorical());
    expect(await readFile(path.join(fromDir, "src", "content", "guides", "tottori", TRANSIT), "utf8")).toBe(guideBefore);

    // The gate still compares against the ORIGINAL reconcile commit, not the retained tree…
    const result = await run();
    expect(result.targets).toHaveLength(10);
    // …which is the whole point. Read the baseline off the RETAINED tree instead and the gate
    // sees no diff at all: the declared corrections read as phantom, and — the dangerous half —
    // an attempt with NO handoff passes as "unchanged" with every correction still undeclared.
    const retainedBaseline = requireCriticBaseline(stateWith(retained), "tottori", { cwd: repo });
    expect(JSON.stringify(retainedBaseline.get(TRANSIT))).toBe(JSON.stringify(JSON.parse(TOTTORI_TRANSIT_AFTER)));
    const againstRetained = (dir2) => reconcileCriticCorrections("tottori", { fromDir: dir2, intakeDir: dir, runId: RUN_ID, baselineDocs: retainedBaseline });
    await expect(againstRetained(fromDir)).rejects.toThrow(/no guide value changed/);
    const noHandoff = path.join(dir, "critic-no-handoff");
    await mkdir(path.join(noHandoff, "src", "content", "guides", "tottori"), { recursive: true });
    await writeFile(path.join(noHandoff, "src", "content", "guides", "tottori", "facts.json"), TOTTORI_FACTS);
    await writeFile(path.join(noHandoff, "src", "content", "guides", "tottori", TRANSIT), TOTTORI_TRANSIT_AFTER);
    await expect(againstRetained(noHandoff)).resolves.toEqual({ changed: false, targets: [] });
    // Against the PINNED baseline that same handoff-less attempt is refused, as it must be.
    await expect(reconcileCriticCorrections("tottori", { fromDir: noHandoff, intakeDir: dir, runId: RUN_ID, baselineDocs: baselineDocs() }))
      .rejects.toThrow(/stale evidence is refused/);
  });
});

// ── the stage snapshot invariant, and routing a failure the critic cannot fix ─

describe("R-A — a completed stage records the tree it handed on, and an unfixable failure is routed", () => {
  const opts = () => ({ intakeDir: dir });
  const SHA = (n) => String(n).repeat(40).slice(0, 40);

  async function runThroughReconcile() {
    await initRunV2("tottori", { ...opts(), inputs: { section: "s", model: "m", effort: "high", criticModel: "c" } });
    for (const [stage, sha] of [["scaffold", SHA(1)], ["passA", SHA(2)], ["passB", SHA(3)], ["reconcile", SHA(4)]]) {
      await stageStart("tottori", stage, { ...opts(), baseline: sha });
      await stageComplete("tottori", stage, { ...opts(), commit: sha });
    }
    return readRunStateV2("tottori", opts());
  }

  it("REPAIRED: a NO-OP completion records the new HEAD, never the previous stage's stale SHA", async () => {
    // The scar: finish-stage passed commit=null when nothing was dirty and stageComplete only
    // wrote truthy commits, so a legitimate no-op completion kept the OLD snapshot — a
    // stale-but-readable baseline, which the missing-SHA guard cannot catch.
    let state = await runThroughReconcile();
    expect(state.stages.reconcile.commit).toBe(SHA(4));

    // Re-open the tail (a late human answer) — which needs the run to owe nothing first…
    await stageStart("tottori", "critic", { ...opts(), baseline: SHA(4) });
    await stageComplete("tottori", "critic", { ...opts(), commit: SHA(4) });
    await reopenForAnswers("tottori", opts());
    state = await readRunStateV2("tottori", opts());
    expect(state.stages.reconcile.commit).toBeNull();     // the stale snapshot is gone at re-open
    expect(state.stages.reconcile.baseline).toBeNull();   // …and so is the stale handed-to tree
    await stageStart("tottori", "reconcile", { ...opts(), baseline: SHA(5) });
    state = await stageComplete("tottori", "reconcile", { ...opts(), commit: SHA(6) });
    // …and the completion records the CURRENT HEAD it handed on, not SHA(4).
    expect(state.stages.reconcile.commit).toBe(SHA(6));
  });

  it("REPAIRED: starting a stage voids its previous completion snapshot", async () => {
    await runThroughReconcile();
    const state = await stageStart("tottori", "critic", { ...opts(), baseline: SHA(7) });
    expect(state.stages.critic.baseline).toBe(SHA(7));
    // Re-starting keeps the FIRST baseline: a repaired attempt owes a diff against the tree the
    // critic originally received, not against its own retained edits.
    await stageFail("tottori", "critic", { ...opts(), failureClass: "gate-failure", detail: "d" });
    const again = await stageStart("tottori", "critic", { ...opts(), baseline: SHA(8) });
    expect(again.stages.critic.baseline).toBe(SHA(7));
  });

  it("REPAIRED: the routed failure lands on the EVIDENCE OWNER, not on the blind critic", async () => {
    await runThroughReconcile();
    await stageStart("tottori", "critic", { ...opts(), baseline: SHA(7) });
    const before = await readRunStateV2("tottori", opts());
    const autoRetriesBefore = before.attempts.autoRetries;

    const state = await routeToEvidenceOwner("tottori", { ...opts(), detail: "evidence relation owed" });
    // Reconcile owns evidence, so reconcile is the failed, retryable stage…
    expect(state.stages.reconcile.status).toBe("failed");
    expect(state.stages.reconcile.failure.class).toBe("gate-failure");
    expect(state.stages.reconcile.commit).toBeNull();
    expect(state.resume.nextStage).toBe("reconcile");
    // …the critic is re-queued rather than failed, so the run's one quality auto-retry is not
    // spent on a stage that cannot comply…
    expect(state.stages.critic.status).toBe("queued");
    expect(state.stages.critic.failure).toBeNull();
    expect(state.attempts.autoRetries).toBe(autoRetriesBefore);
    // …and the critic keeps the baseline it was handed, so the repaired attempt revalidates the
    // SAME retained output against the ORIGINAL pre-critic tree.
    expect(state.stages.critic.baseline).toBe(SHA(7));
    // The attempt history is kept: routing is visible cost, not erased cost.
    expect(state.stages.critic.attempts).toBe(1);
    // And the routed failure is auto-retryable at the stage that can actually fix it.
    expect(retryEligibility(state, { stage: "reconcile", findings: ["declare the relation"] }).allowed).toBe(true);
    // The cap is not turned into a renewable autonomous budget: the round trip is ONE dispatch.
    expect(state.attempts.cap - before.attempts.cap).toBeLessThanOrEqual(1);
  });

  it("REPAIRED: routing refuses unless reconcile really completed", async () => {
    await initRunV2("tottori", { ...opts(), inputs: { section: "s", model: "m", effort: "high", criticModel: "c" } });
    await expect(routeToEvidenceOwner("tottori", opts())).rejects.toThrow(/reconcile is "queued", not complete/);
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
