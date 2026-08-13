// Tests for the candidates-table gate (standards S2/S3). The behaviors worth pinning:
// pre-standard guides are n/a (never retro-failed); an empty section on a post-standard
// guide FAILS; floors come from defaults unless the guide overrides; and a "shipped" row
// whose name appears nowhere in the guide is a finding — that cross-check is what makes
// padding the table to hit a floor expensive.

// @protects-file Proposed venues are checked before they can enter a guide.

import { describe, it, expect } from "vitest";
import { parseCandidates, judgeCandidates, DEFAULT_FLOORS } from "../check-candidates.mjs";

const table = (rank, name, rows) =>
  `### Priority ${rank}: ${name}\n\n| Candidate | Verdict |\n|-----------|---------|\n` +
  rows.map(([c, v]) => `| ${c} | ${v} |`).join("\n") + "\n";

// D3: the 3-column format — rows are [name, verdict, shortlist ("y"/"n"/"")].
const table3 = (rank, name, rows) =>
  `### Priority ${rank}: ${name}\n\n| Candidate | Verdict | Shortlist |\n|---|---|---|\n` +
  rows.map(([c, v, s]) => `| ${c} | ${v} | ${s} |`).join("\n") + "\n";

const doc = (...tables) => `# Intake\n\n## Candidates considered (fill DURING research)\n> blurb\n\n${tables.join("\n")}\n## Amendments\n- none\n`;

describe("parseCandidates", () => {
  it("returns null when the section is absent — a pre-standard guide is n/a, never failed", () => {
    expect(parseCandidates("# Intake\n\n## Amendments\n")).toBeNull();
  });

  it("parses per-priority tables, skipping header and separator rows", () => {
    const t = parseCandidates(doc(table(1, "Food", [["Shin Shin", "shipped"], ["Ippudo", "rejected: chain, tourist-priced"]])));
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ rank: 1, priority: "Food" });
    expect(t[0].rows).toEqual([
      { name: "Shin Shin", verdict: "shipped", shortlisted: null },
      { name: "Ippudo", verdict: "rejected: chain, tourist-priced", shortlisted: null },
    ]);
  });

  it("stops at the next ## section — Amendments rows never leak in", () => {
    const t = parseCandidates(doc(table(1, "Food", [["A", "shipped"]])));
    expect(t[0].rows).toHaveLength(1);
  });
});

describe("judgeCandidates", () => {
  const rows = (n, shipped) => Array.from({ length: n }, (_, i) => [`Cand ${i}`, i < shipped ? "shipped" : "rejected: no source"]);
  const bigTable = parseCandidates(doc(table(1, "Food", rows(16, 8))));
  const guideText = rows(16, 8).filter(([, v]) => v === "shipped").map(([c]) => c).join(" ");

  it("passes a table meeting the default floors, with every shipped name present in the guide", () => {
    const r = judgeCandidates(bigTable, { guideText });
    expect(r.status).toBe("pass");
    expect(r.summary[0]).toMatchObject({ considered: 16, shipped: 8 });
  });

  it("fails a thin consideration set by count, naming the floor", () => {
    const r = judgeCandidates(parseCandidates(doc(table(1, "Food", rows(5, 5)))), { guideText: "Cand 0 Cand 1 Cand 2 Cand 3 Cand 4" });
    expect(r.status).toBe("fail");
    expect(r.findings.join("\n")).toMatch(/5 candidate\(s\) considered, floor is 16/);
  });

  it("fails a shipped row that appears nowhere in the guide — the anti-padding cross-check", () => {
    const r = judgeCandidates(bigTable, { guideText: guideText.replace("Cand 0", "") });
    expect(r.status).toBe("fail");
    expect(r.findings.join("\n")).toMatch(/"Cand 0" is marked shipped but appears nowhere/);
  });

  it("honors per-guide researchFloors over the defaults — the tabBudget precedent", () => {
    const small = parseCandidates(doc(table(1, "Food", rows(6, 3))));
    const text = "Cand 0 Cand 1 Cand 2";
    expect(judgeCandidates(small, { guideText: text }).status).toBe("fail"); // default floor bites
    expect(judgeCandidates(small, { floors: { 1: { considered: 6, shipped: 3 } }, guideText: text }).status).toBe("pass");
  });

  it("gates only ranks 1-3; a fourth table is bonus depth", () => {
    const t = parseCandidates(doc(table(1, "Food", rows(16, 8)), table(4, "Bonus", [["X", "shipped"]])));
    const r = judgeCandidates(t, { guideText: guideText + " X" });
    expect(r.status).toBe("pass");
  });

  it("FAILS an empty section on a post-standard guide — the thinness this exists to measure", () => {
    const r = judgeCandidates([], { guideText: "" });
    expect(r.status).toBe("fail");
    expect(r.findings[0]).toMatch(/no priority tables/);
  });

  it("default floors are the documented 16/8 · 10/5 · 6/3", () => {
    expect(DEFAULT_FLOORS).toEqual({
      1: { considered: 16, shipped: 8 },
      2: { considered: 10, shipped: 5 },
      3: { considered: 6, shipped: 3 },
    });
  });
});

describe("judgeCandidates — D3 shortlist stage (shipped ⊆ shortlist ⊆ considered)", () => {
  const rows3 = (n, shipped, shortlistExtra = 0) =>
    Array.from({ length: n }, (_, i) => [
      `Cand ${i}`,
      i < shipped ? "shipped" : "rejected: no source",
      i < shipped + shortlistExtra ? "y" : "n",
    ]);
  const names = (n) => Array.from({ length: n }, (_, i) => `Cand ${i}`).join(" ");

  it("valid: every shipped row is also marked shortlisted → passes", () => {
    const t = parseCandidates(doc(table3(1, "Food", rows3(16, 8))));
    const r = judgeCandidates(t, { guideText: names(8) });
    expect(r.status).toBe("pass");
    expect(r.summary[0]).toMatchObject({ shipped: 8, shortlisted: 8 });
  });

  it("superset: shortlist marks MORE than shipped (extra candidates promoted, not shipped) → still passes", () => {
    const t = parseCandidates(doc(table3(1, "Food", rows3(16, 8, 4))));
    const r = judgeCandidates(t, { guideText: names(8) });
    expect(r.status).toBe("pass");
    expect(r.summary[0]).toMatchObject({ shipped: 8, shortlisted: 12 });
  });

  it("missing: a shipped row is NOT marked shortlisted → fails, naming the row (ACCEPTANCE)", () => {
    const rows = rows3(16, 8);
    rows[0][2] = "n"; // Cand 0 ships but was never shortlisted
    const t = parseCandidates(doc(table3(1, "Food", rows)));
    const r = judgeCandidates(t, { guideText: names(8) });
    expect(r.status).toBe("fail");
    expect(r.findings.join("\n")).toMatch(/"Cand 0" is marked shipped but not shortlisted/);
  });

  it("legacy 2-column tables (no Shortlist cell) are never gated on shortlist — backward compatible", () => {
    const rows2 = Array.from({ length: 16 }, (_, i) => [`Cand ${i}`, i < 8 ? "shipped" : "rejected: no source"]);
    const t = parseCandidates(doc(table(1, "Food", rows2)));
    expect(t[0].rows.every((r) => r.shortlisted === null)).toBe(true);
    const r = judgeCandidates(t, { guideText: names(8) });
    expect(r.status).toBe("pass");
  });

  it("honors an optional per-rank `shortlist` floor via researchFloors, on top of considered/shipped", () => {
    const t = parseCandidates(doc(table3(1, "Food", rows3(16, 8, 0))));
    const passing = judgeCandidates(t, { guideText: names(8) });
    expect(passing.status).toBe("pass");
    const withFloor = judgeCandidates(t, {
      floors: { 1: { considered: 16, shipped: 8, shortlist: 10 } },
      guideText: names(8),
    });
    expect(withFloor.status).toBe("fail");
    expect(withFloor.findings.join("\n")).toMatch(/8 shortlisted, floor is 10/);
  });
});
