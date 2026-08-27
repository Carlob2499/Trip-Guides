// M2 of Pipeline V2 — the versioned, runtime-validated contracts under scripts/pipeline/v2/.
//
// The coverage contract of THIS suite (from the execution prompt): every artifact class is
// exercised against VALID, MISSING, MALFORMED, LEGACY (V1) and FORWARD-COMPATIBLE input, and
// malformed mandatory input fails CLOSED — an actionable ContractError, never a silent "no run".

// @protects-file A malformed V2 artifact can never be mistaken for an absent one.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ContractError, parseSchemaVersion, assertVersionCompatible, RUN_SCHEMA, EVIDENCE_SCHEMA } from "../pipeline/v2/contracts.mjs";
import {
  V2_RESEARCH_STAGES, initRunV2, readRunStateV2, readAnyRunState, adaptV1RunState,
  stageStart, stageComplete, stageFail, bumpRunAttempt, recordAutoRetry,
  markPublished, markDeployedLive, nextStageV2, runStatePath,
} from "../pipeline/v2/run-state.mjs";
import {
  candidateId, normalizeCandidateIds, readEvidence, requireEvidence, writeEvidence,
  candidateProblems, dispositionProblems, saturationProblems, evidenceProblems, evidencePath,
} from "../pipeline/v2/evidence.mjs";
import { readCoverage, requireCoverage, writeCoverage, coverageProblems } from "../pipeline/v2/coverage.mjs";
import { emptyTelemetry, stageFacts, countsFromEvidence, mergeTelemetry } from "../pipeline/v2/telemetry.mjs";

let dir;
beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), "waypoint-v2-")); });
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

const opts = () => ({ intakeDir: dir });

// ── versioning ───────────────────────────────────────────────────────────────

describe("schema versioning", () => {
  it("parses name/major.minor", () => {
    expect(parseSchemaVersion("wp-run/2.0")).toEqual({ name: "wp-run", major: 2, minor: 0 });
    expect(parseSchemaVersion("garbage")).toBe(null);
  });

  it("accepts a NEWER MINOR (forward compatible) and refuses a different major with the migration named", () => {
    expect(() => assertVersionCompatible("wp-run/2.7", RUN_SCHEMA)).not.toThrow();
    expect(() => assertVersionCompatible("wp-run/3.0", RUN_SCHEMA)).toThrow(/migration/);
    expect(() => assertVersionCompatible("wp-evidence/2.0", RUN_SCHEMA)).toThrow(ContractError);
  });

  it("refuses a version-less document and points at the V1 adapter", () => {
    expect(() => assertVersionCompatible(undefined, RUN_SCHEMA)).toThrow(/V1 adapter/);
  });
});

// ── run state ────────────────────────────────────────────────────────────────

describe("run state — valid lifecycle", () => {
  it("init creates a queued run with an immutable runId and the resume point at stage one", async () => {
    const state = await initRunV2("korea", opts());
    expect(state.schemaVersion).toBe(RUN_SCHEMA);
    expect(state.runId).toMatch(/^korea-\d{8}-[0-9a-f]{6}$/);
    expect(state.stageOrder).toEqual(V2_RESEARCH_STAGES);
    expect(state.stages.passA.status).toBe("queued");
    expect(state.resume.nextStage).toBe("scaffold");
    expect(state.publication).toEqual({ published: false, publishedAt: null, deployedLive: null, deployedAt: null });
  });

  it("re-init RESUMES an unfinished run rather than minting a new one", async () => {
    const first = await initRunV2("korea", opts());
    const again = await initRunV2("korea", opts());
    expect(again.runId).toBe(first.runId);
  });

  it("start → complete records timing, model/effort, attempt count and the durable commit", async () => {
    await initRunV2("korea", opts());
    await stageStart("korea", "scaffold", { model: "claude-sonnet-5", effort: "high", ...opts() });
    const sha = "a".repeat(40);
    let state = await stageComplete("korea", "scaffold", { commit: sha, ...opts() });
    expect(state.stages.scaffold).toMatchObject({ status: "complete", model: "claude-sonnet-5", effort: "high", attempts: 1, commit: sha });
    expect(state.resume.nextStage).toBe("passA");
    expect(state.status).toBe("running");
  });

  it("a running stage IS the resume point — a resumed run repeats it, never skips ahead", async () => {
    await initRunV2("korea", opts());
    await stageStart("korea", "scaffold", opts());
    await stageComplete("korea", "scaffold", opts());
    const state = await stageStart("korea", "passA", opts());
    expect(state.resume.nextStage).toBe("passA");
    expect(state.resume.action).toMatch(/re-run it if incomplete|validate its output/);
  });

  it("failure is classified, the stage stays the resume point, and the run reads failed", async () => {
    await initRunV2("korea", opts());
    await stageStart("korea", "scaffold", opts());
    await stageComplete("korea", "scaffold", opts());
    await stageStart("korea", "passA", opts());
    const state = await stageFail("korea", "passA", { failureClass: "usage-limit", detail: "cut off", ...opts() });
    expect(state.status).toBe("failed");
    expect(state.failure.class).toBe("usage-limit");
    expect(state.stages.passA.status).toBe("failed");
    expect(state.resume.nextStage).toBe("passA");
  });

  it("attempts are bounded and the run goes stuck past the cap", async () => {
    await initRunV2("korea", opts());
    for (let i = 0; i < 5; i++) {
      const { overCap } = await bumpRunAttempt("korea", opts());
      expect(overCap).toBe(false);
    }
    const sixth = await bumpRunAttempt("korea", opts());
    expect(sixth.overCap).toBe(true);
    expect(sixth.state.status).toBe("stuck");
    const redispatched = await initRunV2("korea", opts());
    expect(redispatched.runId).toBe(sixth.state.runId);
    expect(redispatched.attempts.total).toBe(6);
    expect((await bumpRunAttempt("korea", opts())).attempts).toBe(6);
  });

  it("auto-retry is allowed exactly once", async () => {
    await initRunV2("korea", opts());
    expect((await recordAutoRetry("korea", opts())).allowed).toBe(true);
    expect((await recordAutoRetry("korea", opts())).allowed).toBe(false);
  });

  it("published and deployed-live are DISTINCT facts — reached only through the landing transaction (amended scar)", async () => {
    // Amended (correction pass): markPublished on a bare run is now SCHEMA-INVALID — published
    // requires a confirmed merged landing. The distinct-facts pin survives on the honest path:
    // complete every stage, pass the gate, confirm the merge, then observe deploy separately.
    await initRunV2("korea", { ...opts(), landMode: "auto" });
    await expect(markPublished("korea", opts())).rejects.toThrow(/CONFIRMED merged landing/);
    const { stageStart, stageComplete, markLandingGate, finalizeMergedLanding, V2_RESEARCH_STAGES } = await import("../pipeline/v2/run-state.mjs");
    for (const stage of V2_RESEARCH_STAGES) {
      await stageStart("korea", stage, opts());
      await stageComplete("korea", stage, opts());
    }
    await markLandingGate("korea", { passed: true, ...opts() });
    let state = await finalizeMergedLanding("korea", { pr: 42, ...opts() });
    expect(state.publication.published).toBe(true);
    expect(state.publication.deployedLive).toBe(null); // still unknown — a merge is not "live"
    state = await markDeployedLive("korea", opts());
    expect(state.publication.deployedLive).toBe(true);
  });

  it("all stages complete → status complete, nextStage null", async () => {
    await initRunV2("korea", opts());
    for (const s of V2_RESEARCH_STAGES) {
      await stageStart("korea", s, opts());
      await stageComplete("korea", s, opts());
    }
    const state = await readRunStateV2("korea", opts());
    expect(state.status).toBe("complete");
    expect(nextStageV2(state)).toBe(null);
    const redispatched = await initRunV2("korea", opts());
    expect(redispatched.runId).toBe(state.runId);
    expect((await bumpRunAttempt("korea", opts())).attempts).toBe(state.attempts.total);
  });
});

describe("run state — missing / malformed / legacy / forward-compatible", () => {
  it("MISSING file reads as null — the one honest absence", async () => {
    expect(await readRunStateV2("ghost", opts())).toBe(null);
  });

  it("MALFORMED JSON fails closed with the fix named — never 'no run'", async () => {
    await mkdir(path.join(dir, "broken"), { recursive: true });
    await writeFile(runStatePath("broken", dir), "{not json");
    await expect(readRunStateV2("broken", opts())).rejects.toThrow(ContractError);
    await expect(readRunStateV2("broken", opts())).rejects.toThrow(/refusing to treat it as "no run"/);
  });

  it("MALFORMED shape (missing mandatory fields) fails closed with field-level issues", async () => {
    await mkdir(path.join(dir, "bad"), { recursive: true });
    await writeFile(runStatePath("bad", dir), JSON.stringify({ schemaVersion: "wp-run/2.0", slug: "bad" }));
    await expect(readRunStateV2("bad", opts())).rejects.toThrow(/runId/);
  });

  it("a WRONG-MAJOR version is refused, not permissively parsed", async () => {
    await mkdir(path.join(dir, "future"), { recursive: true });
    await writeFile(runStatePath("future", dir), JSON.stringify({ schemaVersion: "wp-run/3.0" }));
    await expect(readRunStateV2("future", opts())).rejects.toThrow(/migration/);
  });

  it("FORWARD-COMPATIBLE: a newer minor with unknown fields parses and preserves them", async () => {
    const state = await initRunV2("korea", opts());
    const raw = JSON.parse(await readFile(runStatePath("korea", dir), "utf8"));
    raw.schemaVersion = "wp-run/2.3";
    raw.someFutureField = { kept: true };
    await writeFile(runStatePath("korea", dir), JSON.stringify(raw));
    const read = await readRunStateV2("korea", opts());
    expect(read.runId).toBe(state.runId);
    expect(read.someFutureField).toEqual({ kept: true });
  });

  it("LEGACY: a V1 state.json adapts to the V2 shape without being rewritten on disk", async () => {
    await mkdir(path.join(dir, "denmark"), { recursive: true });
    const v1 = {
      slug: "denmark", createdAt: "2026-06-01T00:00:00Z", updatedAt: "2026-06-02T00:00:00Z",
      stages: { scaffold: "2026-06-01T00:00:00Z", passA: "2026-06-01T06:00:00Z", passB: null, reconcile: null, verified: null },
      attempts: 2, notes: [],
    };
    const v1Path = path.join(dir, "denmark", "state.json");
    await writeFile(v1Path, JSON.stringify(v1));
    const { version, state } = await readAnyRunState("denmark", opts());
    expect(version).toBe(1);
    expect(state.v1).toBe(true);
    expect(state.stages.passA.status).toBe("complete");
    expect(state.stages.passB.status).toBe("queued");
    expect(state.resume.nextStage).toBe("passB");
    expect(state.attempts.total).toBe(2);
    // the V1 file was not rewritten
    expect(await readFile(v1Path, "utf8")).toBe(JSON.stringify(v1));
  });

  it("readAnyRunState prefers V2 when both exist, and reports absence as version 0", async () => {
    expect((await readAnyRunState("nobody", opts())).version).toBe(0);
    await mkdir(path.join(dir, "both"), { recursive: true });
    await writeFile(path.join(dir, "both", "state.json"), JSON.stringify({ slug: "both", stages: {}, attempts: 0 }));
    await initRunV2("both", opts());
    expect((await readAnyRunState("both", opts())).version).toBe(2);
  });

  it("adaptV1RunState(null) is null — no invented run", () => {
    expect(adaptV1RunState(null)).toBe(null);
  });
});

// ── evidence ─────────────────────────────────────────────────────────────────

const validEvidence = () => ({
  slug: "korea", runId: "korea-20260817-abc123",
  candidates: [
    { id: "c-daruma", name: "Daruma", branch: null, priority: "food", status: "shipped", shortlisted: true, reason: null, worth: null },
    { id: "c-ichiran--dotonbori", name: "Ichiran", branch: "Dotonbori", priority: "food", status: "rejected", shortlisted: true, reason: "tourist-priced chain; locals rank Shin Shin above it", worth: null },
  ],
  evidence: [
    { id: "e-1", candidateId: "c-daruma", claim: "Open Tue–Sun 11:00–22:00", kind: "objective", origin: "passA",
      source: { url: "https://example.com", kind: "official", language: "ja", publishedAt: null, family: null, independent: null }, verifiedOn: "2026-08-01", firsthand: null,
      freshness: { perishable: true, shelfLife: "hours", recheckOn: "2026-10-30" } },
    { id: "e-2", candidateId: "c-daruma", claim: "Queue clears by 14:00 on weekdays", kind: "experiential", origin: "passB",
      source: { url: "https://example.com/blog", kind: "firsthand", language: "ja", publishedAt: "2026-05-01", family: null, independent: true }, verifiedOn: "2026-08-02", firsthand: true },
  ],
  reconciliation: [{ findingId: "e-2", disposition: "adopt", note: "woven into the crowd note" }],
  saturation: { stopped: true, trend: "duplicates", unresolvedCouldChange: false, note: "last 6 searches resurfaced the same 4 venues" },
  passB: { nativeLanguage: { used: true, why: "English results were listicle-only", searchClasses: ["tabelog", "local-news"], yield: "two non-tourist izakaya" } },
});

describe("evidence — valid / structural rules", () => {
  it("writes, validates and reads back a valid document", async () => {
    await writeEvidence("korea", validEvidence(), opts());
    const doc = await requireEvidence("korea", opts());
    expect(doc.schemaVersion).toBe(EVIDENCE_SCHEMA);
    expect(evidenceProblems(doc)).toEqual([]);
    await expect(requireEvidence("korea", { ...opts(), runId: "korea-20260817-ffffff" })).rejects.toThrow(/active run/);
  });

  it("candidateId is stable and deterministic, branch included", () => {
    expect(candidateId("Daruma")).toBe("c-daruma");
    expect(candidateId("Ichiran", "Dotonbori")).toBe("c-ichiran--dotonbori");
    expect(candidateId("Café Ñoño")).toBe(candidateId("Café Ñoño"));
    expect(candidateId("だるま")).toMatch(/^c-u-[0-9a-f]{10}$/);
    expect(candidateId("だるま")).not.toBe(candidateId("一蘭"));
  });

  it("control-plane normalization owns punctuation-heavy and markdown candidate ids + refs (W1-A)", () => {
    const input = validEvidence();
    input.candidates[0] = { ...input.candidates[0], id: "model-typed-id", name: "San'in Coast **Rail**" };
    input.evidence[0].candidateId = "model-typed-id";
    input.reservations = [{ candidateId: "model-typed-id" }];
    input.depth = { reservations: { requiredCandidateIds: ["model-typed-id"] } };
    const { doc, changed } = normalizeCandidateIds(input);
    const expected = candidateId("San'in Coast **Rail**");
    expect(changed).toBe(true);
    expect(expected).toBe("c-san-in-coast-rail");
    expect(doc.candidates[0].id).toBe(expected);
    expect(doc.evidence[0].candidateId).toBe(expected);
    expect(doc.reservations[0].candidateId).toBe(expected);
    expect(doc.depth.reservations.requiredCandidateIds).toEqual([expected]);
    expect(normalizeCandidateIds(doc)).toMatchObject({ changed: false });
  });

  it("normalization preserves uniqueness and fails closed on a semantic collision", () => {
    const input = validEvidence();
    input.candidates = [
      { ...input.candidates[0], id: "one", name: "Café A" },
      { ...input.candidates[1], id: "two", name: "Cafe A", branch: null },
    ];
    expect(() => normalizeCandidateIds(input)).toThrow(/identity collision/);
  });

  it("shipped-but-never-shortlisted is a named violation — no side door", () => {
    const doc = validEvidence();
    doc.candidates[0].shortlisted = false;
    expect(candidateProblems(doc).join()).toMatch(/side door/);
  });

  it("a rejection without a reason is a violation — the reason IS the evidence", () => {
    const doc = validEvidence();
    doc.candidates[1].reason = null;
    expect(candidateProblems(doc).join()).toMatch(/no reason/);
  });

  it("an undispositioned independent finding fails; a disposition on nothing fails", () => {
    const doc = validEvidence();
    doc.reconciliation = [];
    expect(dispositionProblems(doc).join()).toMatch(/no reconciliation disposition/);
    const doc2 = validEvidence();
    doc2.reconciliation.push({ findingId: "e-ghost", disposition: "reject", note: "?" });
    expect(dispositionProblems(doc2).join()).toMatch(/points at no evidence record/);
  });

  it("a stop is EARNED: novel trend or unanswered/true unresolvedCouldChange refuse the stop", () => {
    const still = validEvidence();
    still.saturation = { stopped: true, trend: "novel", unresolvedCouldChange: false, note: "n" };
    expect(saturationProblems(still).join()).toMatch(/not earned/);

    const unresolved = validEvidence();
    unresolved.saturation = { stopped: true, trend: "duplicates", unresolvedCouldChange: true, note: "n" };
    expect(saturationProblems(unresolved).join()).toMatch(/could still change/);

    const unanswered = validEvidence();
    unanswered.saturation = { stopped: true, trend: "duplicates", unresolvedCouldChange: null, note: "n" };
    expect(saturationProblems(unanswered).join()).toMatch(/must be answered/);

    const searching = validEvidence();
    searching.saturation = { stopped: false, trend: "novel", unresolvedCouldChange: null, note: "still finding new options" };
    expect(saturationProblems(searching).join()).toMatch(/still searching/);
    expect(saturationProblems(searching, { fullPass: false })).toEqual([]);
  });

  it("a full pass with NO stop record is a violation; a scoped re-run is excused", () => {
    const doc = validEvidence();
    doc.saturation = null;
    expect(saturationProblems(doc, { fullPass: true }).join()).toMatch(/must record/);
    expect(saturationProblems(doc, { fullPass: false })).toEqual([]);
  });
});

describe("evidence — missing / malformed / forward-compatible", () => {
  it("MISSING is null on read but a BLOCKING failure where required", async () => {
    expect(await readEvidence("ghost", opts())).toBe(null);
    await expect(requireEvidence("ghost", opts())).rejects.toThrow(/blocking failure/);
  });

  it("MALFORMED fails closed", async () => {
    await mkdir(path.join(dir, "bad"), { recursive: true });
    await writeFile(evidencePath("bad", dir), "[not, valid");
    await expect(readEvidence("bad", opts())).rejects.toThrow(ContractError);
  });

  it("a write that would produce an invalid document REFUSES", async () => {
    const doc = validEvidence();
    doc.evidence[0].verifiedOn = "yesterday-ish";
    await expect(writeEvidence("korea", doc, opts())).rejects.toThrow(/YYYY-MM-DD/);
  });

  it("FORWARD-COMPATIBLE: unknown fields survive a read/write round trip", async () => {
    const doc = validEvidence();
    doc.futureBlock = { v: 3 };
    doc.candidates[0].futureField = "kept";
    await writeEvidence("korea", doc, opts());
    const read = await requireEvidence("korea", opts());
    expect(read.futureBlock).toEqual({ v: 3 });
    expect(read.candidates[0].futureField).toBe("kept");
  });
});

// ── coverage ─────────────────────────────────────────────────────────────────

const validCoverage = () => ({
  slug: "korea", runId: "korea-20260817-abc123",
  asks: [
    { id: "ask-food", ask: "Food & dining is priority #1", status: "covered", where: ["05-food.json#food-dining", "04-days.json#day-2"], evidenceIds: ["e-1"], reason: null },
    { id: "ask-niche", ask: "Vinyl record shopping", status: "excluded", where: [], evidenceIds: [], reason: "no verifiable vinyl shops found in the trip's neighborhoods; two candidates rejected as closed" },
  ],
});

describe("coverage — valid / rules / missing / malformed", () => {
  it("valid coverage round-trips and reports no problems", async () => {
    await writeCoverage("korea", validCoverage(), opts());
    const doc = await requireCoverage("korea", opts());
    expect(coverageProblems(doc, { groups: ["05-food.json", "04-days.json"] })).toEqual([]);
  });

  it("covered with NO refs is a violation — a claim is not proof", () => {
    const doc = validCoverage();
    doc.asks[0].where = [];
    expect(coverageProblems(doc).join()).toMatch(/not proof of coverage/);
  });

  it("an arbitrary string is not a ref — the schema rejects it at write time", async () => {
    const doc = validCoverage();
    doc.asks[0].where = ["covered it in the food tab, trust me"];
    await expect(writeCoverage("korea", doc, opts())).rejects.toThrow(/NN-<group>\.json/);
  });

  it("a ref into a group the guide doesn't have is named", () => {
    const doc = validCoverage();
    expect(coverageProblems(doc, { groups: ["01-plan.json"] }).join()).toMatch(/not a group file/);
  });

  it("binds coverage to real anchors, material intake asks and evidence ids", () => {
    const doc = validCoverage();
    const problems = coverageProblems(doc, {
      groups: ["05-food.json", "04-days.json"],
      groupAnchors: new Map([["05-food.json", new Set(["different-title"])], ["04-days.json", new Set(["day-2"])]]),
      expectedAskIds: new Set(["ask-food", "ask-missing"]),
      evidenceIds: new Set(["e-other"]),
    }).join("\n");
    expect(problems).toMatch(/anchor does not identify/);
    expect(problems).toMatch(/ask-missing/);
    expect(problems).toMatch(/unknown evidence id/);
  });

  it("excluded with no reason is a violation — honest exclusions name why", () => {
    const doc = validCoverage();
    doc.asks[1].reason = "  ";
    expect(coverageProblems(doc).join()).toMatch(/no reason/);
  });

  it("coverage is honest about unresolved, invalidated and BINDING support (R-F)", () => {
    const evidenceDoc = {
      evidence: [
        { id: "valid", kind: "objective", source: { kind: "official", access: "fetched" } },
        { id: "preview", kind: "objective", source: { kind: "official", access: "search-preview" } },
        { id: "rejected", kind: "objective", origin: "passB", source: { kind: "official", access: "fetched" } },
      ],
      reconciliation: [{ findingId: "rejected", disposition: "reject", note: "disproven" }],
    };
    const supported = validCoverage();
    supported.asks[0].evidenceIds = ["valid"];
    expect(coverageProblems(supported, { evidenceDoc, bindingAskIds: new Set(["ask-food"]) })).toEqual([]);

    const unresolved = validCoverage();
    unresolved.asks[0].reason = "Not adequately researched; unresolved";
    expect(coverageProblems(unresolved, { evidenceDoc }).join()).toMatch(/claims covered while/);

    const bad = validCoverage();
    bad.asks[0].evidenceIds = ["rejected"];
    expect(coverageProblems(bad, { evidenceDoc }).join()).toMatch(/disproven or superseded/);

    const advisoryPreview = validCoverage();
    advisoryPreview.asks[0].evidenceIds = ["preview"];
    expect(coverageProblems(advisoryPreview, { evidenceDoc })).toEqual([]);

    const binding = validCoverage();
    binding.asks[0].evidenceIds = [];
    expect(coverageProblems(binding, { evidenceDoc, bindingAskIds: new Set(["ask-food"]) }).join()).toMatch(/BINDING/);

    const advisory = validCoverage();
    advisory.asks[0].evidenceIds = [];
    expect(coverageProblems(advisory, { evidenceDoc, bindingAskIds: new Set() })).toEqual([]);
  });

  it("MISSING blocks where required; MALFORMED fails closed", async () => {
    await expect(requireCoverage("ghost", opts())).rejects.toThrow(/blocking failure/);
    await mkdir(path.join(dir, "bad"), { recursive: true });
    await writeFile(path.join(dir, "bad", "coverage.v2.json"), "{");
    await expect(readCoverage("bad", opts())).rejects.toThrow(ContractError);
  });
});

// ── telemetry ────────────────────────────────────────────────────────────────

describe("telemetry — honest unknowns", () => {
  it("the empty summary is all-null, never zeros", () => {
    const t = emptyTelemetry();
    expect(t.counts.candidatesConsidered).toBe(null);
    expect(t.tokens).toBe(null);
    expect(t.costUsd).toBe(null);
  });

  it("stageFacts computes duration only when both ends are known", () => {
    expect(stageFacts({ startedAt: "2026-08-17T10:00:00Z", endedAt: "2026-08-17T10:30:00Z" }).durationSec).toBe(1800);
    expect(stageFacts({ startedAt: "2026-08-17T10:00:00Z" }).durationSec).toBe(null);
    expect(stageFacts({}).model).toBe(null);
  });

  it("countsFromEvidence proves what the artifact proves and leaves the rest null", () => {
    const counts = countsFromEvidence(validEvidence());
    expect(counts.candidatesConsidered).toBe(2);
    expect(counts.candidatesDeepVerified).toBe(2);
    expect(counts.factsVerified).toBe(2);
    expect(counts.nativeLanguageSearches).toBe(null); // not derivable — unknown remains unknown
    expect(countsFromEvidence(null).candidatesConsidered).toBe(null);
  });

  it("merge: a late unknown never erases an earlier known value", () => {
    const base = mergeTelemetry(emptyTelemetry(), { stages: { passA: { durationSec: 120, model: "claude-sonnet-5" } } });
    const merged = mergeTelemetry(base, { stages: { passA: { durationSec: null, retries: 1 } } });
    expect(merged.stages.passA.durationSec).toBe(120);
    expect(merged.stages.passA.retries).toBe(1);
  });
});
