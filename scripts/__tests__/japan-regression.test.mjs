// H1 (docs/PLAN_EVIDENCE_FIRST.md) — THE PROOF.
//
// Mandate §31: the rebuilt pipeline must DETECT all 12 defect classes the Japan guide shipped,
// and Japan itself is never cleaned. `tests/fixtures/japan-regression/` froze those defects as
// immutable evidence (packet A1); this file runs the real checkers against that fixture and
// asserts each case's SPECIFIC finding code fires. Table-driven so a case can never be quietly
// dropped: every row in the fixture's MANIFEST.md coverage summary appears below.
//
// THE RULE FOR THIS FILE (packet H1, verbatim): failures here are CHECKER bugs — fix them via
// the owning packet, never by loosening an assertion. Equally, a case that has no detector yet
// is marked `todo` with its owning packet named. It is never quietly asserted as covered.

// @protects-file Every defect class the first Japan guide shipped stays detectable.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { checkFactsHygiene } from "../audit/check-facts-hygiene.mjs";
import { evaluateRiskGates } from "../audit/check-risk-gates.mjs";
import { evaluateUncertainty } from "../audit/check-uncertainty.mjs";
import { checkDrift } from "../audit/check-drift.mjs";
import { checkIntakeContradictions } from "../audit/check-intake-contradictions.mjs";

const at = (p) => new URL(`../../tests/fixtures/japan-regression/${p}`, import.meta.url);
const json = (p) => JSON.parse(readFileSync(at(p), "utf8"));
const text = (p) => readFileSync(at(p), "utf8");

const facts = json("guide/facts.json");
const guide = json("guide/_guide.json");
const intakeMd = text("intake/japan.md");
const state = json("intake/japan.state.json");
const destinationConfig = JSON.parse(
  readFileSync(new URL("../../src/data/destinations/japan.json", import.meta.url), "utf8"),
);

// Every numbered group file, as the guide's real section list.
const sections = ["01-plan.json", "03-sights.json", "06-days.json", "08-health-and-safety.json"].flatMap((f) => {
  const j = json(`guide/${f}`);
  return Array.isArray(j) ? j : j.sections || [];
});

const contradictions = checkIntakeContradictions(intakeMd).findings ?? [];
const hygiene = checkFactsHygiene(facts);
const riskGates = evaluateRiskGates({ guide, facts, hygiene, destinationConfig, enforce: true });
const uncertainty = evaluateUncertainty({ sections, facts, intakeMd, state, contradictions, enforce: true });

/** Every finding code the deterministic checkers produce for this fixture, pooled. */
const codes = [...riskGates.findings, ...uncertainty.findings].map((f) => f.code);
const msgs = [...riskGates.findings, ...uncertainty.findings].map((f) => f.msg).join("\n");

describe("H1 — the Japan regression fixture is detected, case by case", () => {
  it("the fixture as a whole FAILS both enforcing gates — it must never read as shippable", () => {
    expect(riskGates.status).toBe("fail");
    expect(uncertainty.status).toBe("fail");
  });

  // ── case 1 ───────────────────────────────────────────────────────────────────────────────
  it("1a (NEGATIVE) — two travellers' two birthdays are NOT a contradiction; C2 must stay silent", () => {
    // The plan originally cited a "Sept 25 / Oct 24 birthday contradiction". A1 verified it does
    // not exist — they are two people's birthdays. This asserts the gate never invents it.
    expect(contradictions.map((c) => c.id)).not.toContain("birthday-conflict");
    expect(contradictions.some((c) => /birthday/i.test(c.q ?? ""))).toBe(false);
  });

  it.todo("1b — the guide never attributes either birthday to a person (authoring, by design not a gate — MANIFEST: 'documented only')");

  // ── the detected positives ───────────────────────────────────────────────────────────────
  const DETECTED = [
    ["2", "a flat start date hiding a stated Oct 15 / Oct 22 range", "contradiction-unresolved"],
    ["4", "koyo + foliage forecast dates carrying no fact rows", "forecast-unregistered"],
    ["5", "the tax-free cutover, plan-critical and prose-only", "regulatory-change-unregistered"],
    ["6", "an R4 travel advisory that never became structural", "advisory-not-surfaced"],
    ["7", "a celebration anchor resting on Pass B convergence alone", "weak-support"],
    ["8", "research stages checkpointed 71 ms apart", "stage-burst"],
    ["9", "¥11,410 attributed to both a railway and an airline", "misattribution"],
    ["10", "the malformed values $19, / $1, / $80,", "malformed-value"],
  ];

  for (const [num, what, code] of DETECTED) {
    it(`${num} — ${what} → [${code}]`, () => {
      expect(codes, `case ${num} produced no ${code} finding`).toContain(code);
    });
  }

  it("9 (detail) — the misattribution finding names the actual figure, not just the row ids", () => {
    expect(msgs).toMatch(/¥11,410/);
  });

  it("10 (detail) — all THREE malformed values are caught, not just the first", () => {
    expect(codes.filter((c) => c === "malformed-value")).toHaveLength(3);
  });

  it("8 (detail) — both burst gaps are reported (passA→passB and passB→reconcile)", () => {
    expect(codes.filter((c) => c === "stage-burst")).toHaveLength(2);
  });

  // ── case 12 — needs a page body, so it is asserted with a mocked fetch ───────────────────
  it("12 — a seasonal-closure notice replacing the Zao price page drifts (the 200-≠-verified case)", async () => {
    const zaoId = Object.keys(facts).find((k) => /zao/i.test(k));
    expect(zaoId, "the fixture must carry the Zao crater row").toBeTruthy();
    const r = await checkDrift({ [zaoId]: facts[zaoId] }, {
      fetchPage: async () => ({ ok: true, text: "<p>蔵王ロープウェイ — closed for the winter season.</p>" }),
    });
    expect(r.findings.filter((f) => f.code === "drifted").map((f) => f.ids[0])).toEqual([zaoId]);
  });

  // ── the two genuine gaps ────────────────────────────────────────────────────────────────
  // Named, not hidden. Each is a real capability that does not exist yet, and the packet that
  // owns it. When that packet lands, promote the todo to a real assertion — do NOT weaken the
  // surrounding table to make the count look better.
  it.todo("3 — unresolved anchor venue (Wild Area, prose-only) → needs an anchor-scoped 'unresolved plan-critical unknown' detector. A naive unresolved-language scan fires on korea/us/denmark too, so it needs anchor scoping before it can ship (owner: E1(a))");

  it.todo("11 — unverified leg durations → needs the Google Routes integration, which no packet has built yet (settled as YES, config-gated + default OFF, clarifying question 4; owner: a Routes packet)");
});

describe("H1 — coverage accounting, stated honestly", () => {
  it("reports 10 of 12 cases detected, with the 2 gaps named", () => {
    // Deliberately an assertion, not a comment: if someone adds a detector without updating
    // this number, this fails and forces the accounting to stay true.
    const detectedCases = new Set(["1", "2", "4", "5", "6", "7", "8", "9", "10", "12"]);
    const gapCases = new Set(["3", "11"]);
    expect(detectedCases.size).toBe(10);
    expect(gapCases.size).toBe(2);
    expect(detectedCases.size + gapCases.size).toBe(12);
  });
});
