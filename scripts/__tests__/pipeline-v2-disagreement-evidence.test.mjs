import { describe, it, expect } from "vitest";
import { evidenceDocSchema, EVIDENCE_SCHEMA } from "../pipeline/v2/contracts.mjs";
import { disagreementProblems } from "../pipeline/v2/research-rules.mjs";

const evidence = (id, claim) => ({
  id,
  candidateId: "c-1",
  claim,
  kind: "objective",
  origin: "passA",
  source: {
    url: `https://${id}.example`,
    kind: "official",
    access: "fetched",
    language: "en",
    publishedAt: "2026-08-01",
    family: null,
    independent: null,
    appliesToYears: [],
  },
  verifiedOn: "2026-08-23",
  firsthand: null,
  freshness: { perishable: true, shelfLife: "hours", recheckOn: "2026-09-01" },
});

const rawDoc = (disagreement) => ({
  schemaVersion: EVIDENCE_SCHEMA,
  slug: "fixture",
  runId: "fixture-20260823-abc123",
  candidates: [],
  evidence: [
    evidence("e-open", "Last admission is 17:00"),
    evidence("e-late", "Last admission is 16:30"),
  ],
  reservations: [],
  transport: [],
  disagreements: [disagreement],
  depth: null,
  saturation: null,
  passB: null,
  reconciliation: [],
});

describe("V04 disagreement evidence linkage", () => {
  it("bumps the additive evidence contract to 2.2", () => {
    expect(EVIDENCE_SCHEMA).toBe("wp-evidence/2.2");
  });

  it("keeps historical 2.0/2.1-shaped disagreements parseable with an honest empty default", () => {
    const parsed = evidenceDocSchema.parse(rawDoc({
      id: "d-old",
      topic: "hours",
      impact: "minor",
      investigation: "historical fixture",
      resolution: null,
    }));
    expect(parsed.disagreements[0].evidenceIds).toEqual([]);
  });

  it("rejects malformed typed evidence ids at the contract boundary", () => {
    expect(() => evidenceDocSchema.parse(rawDoc({
      id: "d-bad",
      topic: "hours",
      impact: "recommendation-changing",
      evidenceIds: ["e-open", 42],
      investigation: "checked both",
      resolution: "use the more conservative cutoff",
    }))).toThrow();
  });

  it("refuses a prose-only recommendation-changing resolution", () => {
    const parsed = evidenceDocSchema.parse(rawDoc({
      id: "d-prose",
      topic: "hours",
      impact: "recommendation-changing",
      investigation: "sources diverged",
      resolution: "use the more conservative cutoff",
    }));
    expect(disagreementProblems(parsed).join("\n")).toMatch(/at least two distinct evidence records/);
  });

  it("refuses duplicate ids and unknown ids", () => {
    const duplicate = evidenceDocSchema.parse(rawDoc({
      id: "d-dup",
      topic: "hours",
      impact: "recommendation-changing",
      evidenceIds: ["e-open", "e-open"],
      investigation: "sources diverged",
      resolution: "resolved",
    }));
    expect(disagreementProblems(duplicate).join("\n")).toMatch(/at least two distinct evidence records/);

    const unknown = evidenceDocSchema.parse(rawDoc({
      id: "d-unknown",
      topic: "hours",
      impact: "recommendation-changing",
      evidenceIds: ["e-open", "e-missing"],
      investigation: "sources diverged",
      resolution: "resolved",
    }));
    expect(disagreementProblems(unknown).join("\n")).toMatch(/unknown evidence id "e-missing"/);
  });

  it("passes when a resolved recommendation-changing disagreement names two real records", () => {
    const parsed = evidenceDocSchema.parse(rawDoc({
      id: "d-good",
      topic: "hours",
      impact: "recommendation-changing",
      evidenceIds: ["e-open", "e-late"],
      investigation: "compared two current primary records",
      resolution: "use the more conservative cutoff and recheck before travel",
    }));
    expect(disagreementProblems(parsed)).toEqual([]);
  });
});
