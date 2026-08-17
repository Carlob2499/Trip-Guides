// Tests for the candidates-table gate (standards S2/S3, adaptive since Pipeline V2).
//
// Assertion classification for the V2 change (docs/pipeline v2/FABLE_IMPLEMENTATION_PROMPT.md):
//   PRESERVE  pre-standard guides are n/a; an empty table on a post-standard guide FAILS; a
//             "shipped" row whose name appears nowhere in the guide is a finding; shipped ⊆
//             shortlist (D3); legacy 2-column tables are never gated on shortlist.
//   CHANGE    the numeric per-priority floors (16/8 · 10/5 · 6/3) and the `researchFloors`
//             override are deliberately GONE — DECISIONS.md "Research breadth": breadth is
//             adaptive, and the V2 saturation record (scripts/pipeline/v2/evidence.mjs, its
//             own suite) is the replacement protection against a lazy stop. Thin-but-honest
//             tables now pass here; ZERO consideration still fails.

// @protects-file Proposed venues are checked before they can enter a guide.

import { describe, it, expect } from "vitest";
import { parseCandidates, judgeCandidates } from "../check-candidates.mjs";

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

describe("judgeCandidates — adaptive breadth, structural honesty", () => {
  const rows = (n, shipped) => Array.from({ length: n }, (_, i) => [`Cand ${i}`, i < shipped ? "shipped" : "rejected: no source"]);
  const bigTable = parseCandidates(doc(table(1, "Food", rows(16, 8))));
  const guideText = rows(16, 8).filter(([, v]) => v === "shipped").map(([c]) => c).join(" ");

  it("passes a deep table with every shipped name present in the guide", () => {
    const r = judgeCandidates(bigTable, { guideText });
    expect(r.status).toBe("pass");
    expect(r.summary[0]).toMatchObject({ considered: 16, shipped: 8 });
  });

  it("CHANGE (V2): a thin-but-honest table PASSES — breadth is adaptive, not a quota", () => {
    // Under the old floors this failed on count alone. The replacement protection is the V2
    // saturation record (an unearned stop fails scripts/pipeline/v2/evidence.mjs's gate).
    const r = judgeCandidates(parseCandidates(doc(table(1, "Food", rows(5, 3)))), { guideText: "Cand 0 Cand 1 Cand 2" });
    expect(r.status).toBe("pass");
    expect(r.summary[0]).toMatchObject({ considered: 5, shipped: 3 }); // counts stay visible
  });

  it("PRESERVE: an EMPTY priority table still fails — zero consideration is no research", () => {
    const r = judgeCandidates(parseCandidates(doc(table(1, "Food", []))), { guideText: "" });
    expect(r.status).toBe("fail");
    expect(r.findings.join("\n")).toMatch(/table is empty/);
  });

  it("PRESERVE: a shipped row that appears nowhere in the guide fails — the anti-padding cross-check", () => {
    const r = judgeCandidates(bigTable, { guideText: guideText.replace("Cand 0", "") });
    expect(r.status).toBe("fail");
    expect(r.findings.join("\n")).toMatch(/"Cand 0" is marked shipped but appears nowhere/);
  });

  it("summaries cover every table, including bonus ranks past 3", () => {
    const t = parseCandidates(doc(table(1, "Food", rows(16, 8)), table(4, "Bonus", [["X", "shipped"]])));
    const r = judgeCandidates(t, { guideText: guideText + " X" });
    expect(r.status).toBe("pass");
    expect(r.summary).toHaveLength(2);
  });

  it("PRESERVE: FAILS an empty section on a post-standard guide", () => {
    const r = judgeCandidates([], { guideText: "" });
    expect(r.status).toBe("fail");
    expect(r.findings[0]).toMatch(/no priority tables/);
  });
});

describe("judgeCandidates — D3 shortlist stage (shipped ⊆ shortlist ⊆ considered) [PRESERVE]", () => {
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
});
