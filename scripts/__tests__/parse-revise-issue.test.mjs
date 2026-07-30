// Tests for scripts/parse-revise-issue.mjs — the revise-guide issue-body parser. Two things
// matter here beyond the modify parser's coverage: the comma-list `sections` field goes through
// the same sanitizeSection() injection guard PER TOKEN, and the modify-template fallback
// (synthesis ruling #1 — an escalated modify issue must parse without edits).

import { describe, it, expect } from "vitest";
import { parseReviseIssue, parseSections, parseDeadline } from "../parse-revise-issue.mjs";

describe("parseSections (pure)", () => {
  it("splits a comma list and trims each token", () => {
    expect(parseSections("Sights, Days")).toEqual(["Sights", "Days"]);
    expect(parseSections("Food & shopping")).toEqual(["Food & shopping"]);
  });

  it("drops tokens that fail the injection guard, keeps the rest", () => {
    expect(parseSections("Sights, ${{ secrets.X }}, Days")).toEqual(["Sights", "Days"]);
    expect(parseSections("`echo pwned`, Money")).toEqual(["Money"]);
  });

  it("caps the list to stop a comma-bomb", () => {
    const bomb = Array.from({ length: 50 }, (_, i) => `S${i}`).join(",");
    expect(parseSections(bomb).length).toBe(10);
  });

  it("returns empty for blank / undefined", () => {
    expect(parseSections("")).toEqual([]);
    expect(parseSections(undefined)).toEqual([]);
  });
});

describe("parseDeadline (pure)", () => {
  it("accepts a bare ISO date", () => {
    expect(parseDeadline("2026-09-01")).toBe("2026-09-01");
    expect(parseDeadline("  2026-09-01  ")).toBe("2026-09-01");
  });
  it("drops anything else", () => {
    expect(parseDeadline("Sept 1st")).toBe("");
    expect(parseDeadline("2026-09-01; rm -rf /")).toBe("");
    expect(parseDeadline(undefined)).toBe("");
  });
});

describe("parseReviseIssue (pure)", () => {
  const revise =
    "### Guide slug\n\nkorea\n\n### What changed and why this needs re-research\n\nDates moved to April — seasonal picks all wrong\n\n### Sections\n\nSights, Days\n\n### Deadline\n\n2026-09-01";

  it("parses a well-formed revise issue body", () => {
    expect(parseReviseIssue(revise)).toEqual({
      slug: "korea",
      change: "Dates moved to April — seasonal picks all wrong",
      sections: ["Sights", "Days"],
      deadline: "2026-09-01",
    });
  });

  it("falls back to the MODIFY template's shape (escalated issue, ruling #1)", () => {
    const modifyBody =
      "### Guide slug\n\nkorea\n\n### What needs to change\n\nThe whole autumn leg is stale\n\n### Section\n\nSights";
    expect(parseReviseIssue(modifyBody)).toEqual({
      slug: "korea",
      change: "The whole autumn leg is stale",
      sections: ["Sights"],
      deadline: "",
    });
  });

  it("lowercases and trims the slug, rejects invalid ones", () => {
    expect(parseReviseIssue("### Guide slug\n\n  Korea  \n\n### What changed and why this needs re-research\n\nx").slug).toBe("korea");
    expect(() => parseReviseIssue("### Guide slug\n\n../etc/passwd\n\n### What changed and why this needs re-research\n\nx")).toThrow(/valid slug/i);
  });

  it("throws when neither template's change field is present", () => {
    expect(() => parseReviseIssue("### Guide slug\n\nkorea")).toThrow(/neither template/i);
  });

  it("sections and deadline are optional", () => {
    const minimal = "### Guide slug\n\nkorea\n\n### What changed and why this needs re-research\n\nbig change";
    expect(parseReviseIssue(minimal)).toEqual({ slug: "korea", change: "big change", sections: [], deadline: "" });
  });
});
