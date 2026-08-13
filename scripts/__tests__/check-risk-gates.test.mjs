// Tests for E1's risk-weighted gates (docs/PLAN_EVIDENCE_FIRST.md). Two things carry the
// packet and both are pinned here: the warn-first split (drafts BLOCK because that is what
// graduate-guide.yml gates on; published guides only advise), and the fact that every
// detector works WITHOUT any `risk` data — because no row in the corpus has any, and the
// regression fixture is frozen evidence that can never be re-annotated.

// @protects-file A guide cannot be published carrying an unsurfaced advisory or a misattributed fact.

import { describe, it, expect } from "vitest";
import {
  checkAdvisorySurfaced,
  checkR4Surfaced,
  checkTierEvidence,
  hygieneFindings,
  evaluateRiskGates,
} from "../audit/check-risk-gates.mjs";

const withAdvisory = { url: "https://travel.state.gov/x", verified_on: "2026-08-13", state: "unconfirmed" };

describe("checkAdvisorySurfaced — regression case 6", () => {
  it("FIRES when the destination declares an advisory and the guide has no typed advisory", () => {
    const f = checkAdvisorySurfaced({}, { travelAdvisory: withAdvisory });
    expect(f?.code).toBe("advisory-not-surfaced");
  });

  it("is silent when the guide carries a typed advisory object", () => {
    expect(checkAdvisorySurfaced({ advisory: { level: 1 } }, { travelAdvisory: withAdvisory })).toBeNull();
  });

  it("is silent for a destination with no advisory in its config — the domestic-trip case", () => {
    // us.json deliberately has no travelAdvisory: a US advisory for a US-domestic trip is
    // meaningless. This is why the rule needs no per-guide exemption list.
    expect(checkAdvisorySurfaced({}, { t0Domains: ["tsa.gov"] })).toBeNull();
  });

  it("is silent when the destination has no config at all — denmark today", () => {
    expect(checkAdvisorySurfaced({}, null)).toBeNull();
  });
});

describe("checkR4Surfaced — E1(c), active only once rows carry risk", () => {
  it("fires on an R4 row that no rendered group references", () => {
    const findings = checkR4Surfaced({ adv: { risk: 4 } }, ["adv"]);
    expect(findings).toHaveLength(1);
    expect(findings[0].code).toBe("r4-unsurfaced");
  });

  it("is silent when the R4 row IS referenced", () => {
    expect(checkR4Surfaced({ adv: { risk: 4 } }, [])).toEqual([]);
  });

  it("ignores unreferenced rows below R4, and rows with no risk at all", () => {
    expect(checkR4Surfaced({ a: { risk: 3 }, b: {} }, ["a", "b"])).toEqual([]);
  });
});

describe("checkTierEvidence — E1(b), active only once rows carry risk", () => {
  it("requires a tier at R2+", () => {
    expect(checkTierEvidence({ a: { risk: 2 } }).map((f) => f.code)).toEqual(["tier-missing"]);
  });

  it("requires tier:primary AND evidence at R3+", () => {
    const codes = checkTierEvidence({ a: { risk: 3, tier: "secondary" } }).map((f) => f.code);
    expect(codes).toContain("tier-not-primary");
    expect(codes).toContain("evidence-missing");
  });

  it("passes a fully-specified R4 row", () => {
    expect(checkTierEvidence({ a: { risk: 4, tier: "primary", evidence: "Level 1" } })).toEqual([]);
  });

  it("says NOTHING about rows with no risk — the whole corpus today", () => {
    expect(checkTierEvidence({ a: { source_url: "https://x.test" }, b: { risk: 1 } })).toEqual([]);
  });
});

describe("hygieneFindings — E1(d), promoting B3's detectors", () => {
  it("promotes misattribution and malformed values", () => {
    const codes = hygieneFindings({
      misattribution: [{ value: "¥11,410", ids: ["a", "b"], sources: ["u1", "u2"] }],
      malformed: [{ id: "c", value: "$19," }],
    }).map((f) => f.code);
    expect(codes).toEqual(["misattribution", "malformed-value"]);
  });

  it("leaves bareEcho advisory — a section-path-shaped claim is a naming smell, not a wrong fact", () => {
    expect(hygieneFindings({ bareEcho: [{ stem: "Local essentials", ids: ["a", "b"] }] })).toEqual([]);
  });
});

describe("evaluateRiskGates — the warn-first split", () => {
  const defective = {
    guide: {},
    destinationConfig: { travelAdvisory: withAdvisory },
    hygiene: { malformed: [{ id: "x", value: "$19," }] },
  };

  it("BLOCKS on a draft — graduate-guide.yml gates on this, so it is the publication chokepoint", () => {
    const r = evaluateRiskGates({ ...defective, enforce: true });
    expect(r.status).toBe("fail");
    expect(r.findings).toHaveLength(2);
  });

  it("only ADVISES on a published guide, with identical findings", () => {
    const r = evaluateRiskGates({ ...defective, enforce: false });
    expect(r.status).toBe("advisory");
    expect(r.findings).toHaveLength(2);
  });

  it("passes a clean guide regardless of posture", () => {
    expect(evaluateRiskGates({ guide: { advisory: { level: 1 } }, destinationConfig: { travelAdvisory: withAdvisory }, enforce: true }).status).toBe("pass");
  });

  it("passes an entirely risk-free corpus guide — no risk data must never mean no verdict", () => {
    expect(evaluateRiskGates({ guide: {}, facts: { a: { source_url: "https://x.test" } }, enforce: true }).status).toBe("pass");
  });
});

// ── ACCEPTANCE, against the frozen A1 fixture ────────────────────────────────────────────
// The packet's bar is "regression cases 5, 6, 9, 10 detected as blockers on the fixture".
// This asserts against the real frozen evidence, not a hand-built object, so the gate cannot
// drift away from the corpus it was built to catch.
describe("E1 ACCEPTANCE — the frozen japan-regression fixture", async () => {
  const { readFile } = await import("node:fs/promises");
  const base = new URL("../../tests/fixtures/japan-regression/guide/", import.meta.url);
  const facts = JSON.parse(await readFile(new URL("facts.json", base), "utf8"));
  const guide = JSON.parse(await readFile(new URL("_guide.json", base), "utf8"));
  const destinationConfig = JSON.parse(
    await readFile(new URL("../../src/data/destinations/japan.json", import.meta.url), "utf8"),
  );
  const { checkFactsHygiene } = await import("../audit/check-facts-hygiene.mjs");

  const r = evaluateRiskGates({
    guide,
    facts,
    hygiene: checkFactsHygiene(facts),
    destinationConfig,
    enforce: true, // the fixture mirrors a draft; drafts are where the gate bites
  });

  it("fails the fixture outright", () => {
    expect(r.status).toBe("fail");
  });

  it("case 6 — the unsurfaced R4 travel advisory", () => {
    expect(r.findings.some((f) => f.code === "advisory-not-surfaced")).toBe(true);
  });

  it("case 9 — the ¥11,410 figure attributed to both a railway and an airline", () => {
    const f = r.findings.find((x) => x.code === "misattribution");
    expect(f?.msg).toMatch(/¥11,410/);
  });

  it("case 10 — all three malformed values ($19, / $1, / $80,)", () => {
    const ids = r.findings.filter((f) => f.code === "malformed-value").map((f) => f.msg);
    expect(ids).toHaveLength(3);
    expect(ids.join(" ")).toMatch(/phone-data-19/);
    expect(ids.join(" ")).toMatch(/money-currency-1/);
    expect(ids.join(" ")).toMatch(/budget-daily-costs-80/);
  });
});
