// Tests for the candidates-table gate (standards S2/S3). The behaviors worth pinning:
// pre-standard guides are n/a (never retro-failed); an empty section on a post-standard
// guide FAILS; floors come from defaults unless the guide overrides; and a "shipped" row
// whose name appears nowhere in the guide is a finding — that cross-check is what makes
// padding the table to hit a floor expensive.

import { describe, it, expect } from "vitest";
import { parseCandidates, judgeCandidates, DEFAULT_FLOORS } from "../check-candidates.mjs";

const table = (rank, name, rows) =>
  `### Priority ${rank}: ${name}\n\n| Candidate | Verdict |\n|-----------|---------|\n` +
  rows.map(([c, v]) => `| ${c} | ${v} |`).join("\n") + "\n";

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
      { name: "Shin Shin", verdict: "shipped" },
      { name: "Ippudo", verdict: "rejected: chain, tourist-priced" },
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
