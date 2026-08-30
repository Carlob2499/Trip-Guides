import { describe, it, expect } from "vitest";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  compileEvidenceEnvelope,
  compileCoverageEnvelope,
  compileCriticCorrectionEnvelope,
  compileStageArtifacts,
} from "../pipeline/v3/compiler.mjs";
import {
  EVIDENCE_SCHEMA,
  COVERAGE_SCHEMA,
  CRITIC_CORRECTIONS_SCHEMA,
  ContractError,
} from "../pipeline/v2/contracts.mjs";
import { initRunV2 } from "../pipeline/v2/run-state.mjs";

const run = { slug: "kumamoto", runId: "kumamoto-20260911-abc123" };

const rawEvidence = () => ({
  schemaVersion: "model-guessed/99.0",
  slug: "wrong-place",
  runId: "wrong-run",
  candidates: [
    {
      id: "the model typed this",
      name: "Kumamoto Castle",
      branch: null,
      priority: "anchor",
      status: "shipped",
      shortlisted: true,
      reason: null,
      worth: null,
    },
  ],
  evidence: [
    {
      id: "e-castle-hours",
      candidateId: "the model typed this",
      claim: "Last admission is 16:30",
      kind: "objective",
      origin: "critic",
      source: {
        url: "https://castle.example.jp/hours",
        kind: "official",
        access: "fetched",
        language: "ja",
        publishedAt: null,
        family: null,
        independent: null,
        appliesToYears: [],
      },
      verifiedOn: "2026-09-11",
      firsthand: null,
      freshness: { perishable: true, shelfLife: "hours", recheckOn: "2026-12-10" },
    },
  ],
  reconciliation: [],
  saturation: {
    stopped: true,
    trend: "duplicates",
    unresolvedCouldChange: false,
    note: "Further searches repeated the same official page.",
  },
});

describe("V3 artifact compiler — deterministic metadata belongs to the control plane", () => {
  it("injects evidence identity, stage origin, schema, and stable candidate references", () => {
    const doc = compileEvidenceEnvelope(rawEvidence(), { ...run, origin: "passA" });

    expect(doc.schemaVersion).toBe(EVIDENCE_SCHEMA);
    expect(doc.slug).toBe(run.slug);
    expect(doc.runId).toBe(run.runId);
    expect(doc.candidates[0].id).toBe("c-kumamoto-castle");
    expect(doc.evidence[0]).toMatchObject({
      candidateId: "c-kumamoto-castle",
      origin: "passA",
    });
  });

  it("does not repair semantic source claims such as preview-as-proof", () => {
    const raw = rawEvidence();
    raw.evidence[0].source.access = "search-preview";
    const doc = compileEvidenceEnvelope(raw, { ...run, origin: "passA" });
    expect(doc.evidence[0].source.access).toBe("search-preview");
  });

  it("fails closed when two candidate names collapse to the same stable identity", () => {
    const raw = rawEvidence();
    raw.candidates.push({ ...raw.candidates[0], id: "another", name: "Kumamoto  Castle" });
    expect(() => compileEvidenceEnvelope(raw, { ...run, origin: "passA" })).toThrow(ContractError);
  });

  it("derives coverage ids from the traveler ask while preserving semantic evidence links", () => {
    const doc = compileCoverageEnvelope({
      schemaVersion: "guessed",
      slug: "wrong",
      runId: "wrong",
      asks: [{
        id: "Ask Number One",
        ask: "Step-free access at the castle",
        status: "covered",
        where: ["02-sights.json#kumamoto-castle"],
        evidenceIds: ["e-castle-hours"],
        reason: null,
      }],
    }, run);

    expect(doc).toMatchObject({ schemaVersion: COVERAGE_SCHEMA, ...run });
    expect(doc.asks[0].id).toBe("ask-step-free-access-at-the-castle");
    expect(doc.asks[0].evidenceIds).toEqual(["e-castle-hours"]);
  });

  it("injects critic handoff identity without inventing correction semantics", () => {
    const correction = {
      target: "02-sights.json#/0/body",
      previousValue: "Closes at 17:00",
      correctedValue: "Last admission is 16:30",
      claim: "Castle last admission",
      source: rawEvidence().evidence[0].source,
      verifiedOn: "2026-09-11",
      freshness: { perishable: true, shelfLife: "hours", recheckOn: "2026-12-10" },
    };
    const doc = compileCriticCorrectionEnvelope({
      schemaVersion: "guessed",
      slug: "wrong",
      runId: "wrong",
      corrections: [correction],
    }, run);

    expect(doc).toMatchObject({ schemaVersion: CRITIC_CORRECTIONS_SCHEMA, ...run });
    expect(doc.corrections).toEqual([correction]);
  });

  it("compiles a reconcile stage's evidence and coverage files in one trusted operation", async () => {
    const intakeDir = await mkdtemp(path.join(tmpdir(), "waypoint-v3-compile-"));
    try {
      const state = await initRunV2("kumamoto", { intakeDir, engine: "v3" });
      const runDir = path.join(intakeDir, "kumamoto");
      await mkdir(runDir, { recursive: true });
      await writeFile(path.join(runDir, "evidence.v2.json"), JSON.stringify(rawEvidence()));
      await writeFile(path.join(runDir, "coverage.v2.json"), JSON.stringify({
        asks: [{
          id: "model-id",
          ask: "Step-free access at the castle",
          status: "covered",
          where: ["02-sights.json#kumamoto-castle"],
          evidenceIds: ["e-castle-hours"],
          reason: null,
        }],
      }));

      const result = await compileStageArtifacts("kumamoto", "reconcile", { intakeDir });
      expect(result.compiled.sort()).toEqual(["coverage.v2.json", "evidence.v2.json"]);
      const evidence = JSON.parse(await readFile(path.join(runDir, "evidence.v2.json"), "utf8"));
      const coverage = JSON.parse(await readFile(path.join(runDir, "coverage.v2.json"), "utf8"));
      expect(evidence).toMatchObject({ schemaVersion: EVIDENCE_SCHEMA, slug: "kumamoto", runId: state.runId });
      expect(coverage).toMatchObject({ schemaVersion: COVERAGE_SCHEMA, slug: "kumamoto", runId: state.runId });
    } finally {
      await rm(intakeDir, { recursive: true, force: true });
    }
  });

  it("compiles untrusted Pass A output before the strict collection parser sees it", async () => {
    const intakeDir = await mkdtemp(path.join(tmpdir(), "waypoint-v3-control-"));
    const fromDir = await mkdtemp(path.join(tmpdir(), "waypoint-v3-agent-"));
    try {
      const state = await initRunV2("kumamoto", { intakeDir, engine: "v3" });
      const agentRunDir = path.join(fromDir, "guides-intake", "kumamoto");
      await mkdir(agentRunDir, { recursive: true });
      const raw = rawEvidence();
      delete raw.schemaVersion;
      delete raw.slug;
      delete raw.runId;
      await writeFile(path.join(agentRunDir, "evidence.v2.json"), JSON.stringify(raw));

      const result = await compileStageArtifacts("kumamoto", "passA", { intakeDir, fromDir });
      expect(result.compiled).toEqual(["evidence.v2.json"]);
      const compiled = JSON.parse(await readFile(path.join(agentRunDir, "evidence.v2.json"), "utf8"));
      expect(compiled).toMatchObject({
        schemaVersion: EVIDENCE_SCHEMA,
        slug: "kumamoto",
        runId: state.runId,
      });
      expect(compiled.evidence[0].origin).toBe("passA");
    } finally {
      await rm(intakeDir, { recursive: true, force: true });
      await rm(fromDir, { recursive: true, force: true });
    }
  });
});
