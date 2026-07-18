// Tests for the recert work-list transform (scripts/recert.mjs). Pure logic tested against a mock
// staleness result, so it's independent of today's date and needs no network / real guides.

import { describe, it, expect } from "vitest";
import { toWorklist, formatGuide } from "../recert.mjs";

const MOCK = {
  thresholdDays: 90,
  stale: [{ slug: "alpha", date: "2026-01-01", ageDays: 200 }], // guide-level stamp stale
  noDate: [],
  drafts: ["draftguide"], // skipped by check-staleness — must never appear in the work-list
  sections: [
    { slug: "alpha", index: 3, title: "Money", category: "fx", date: "2026-06-01", ageDays: 40, life: 7, source: "https://x.example" },
    { slug: "beta", index: 1, title: "Transit", category: "transit", date: "2026-01-01", ageDays: 200, life: 90, source: null },
  ],
};

describe("toWorklist", () => {
  const { slugs, byGuide } = toWorklist(MOCK);

  it("unions guide-level and per-section stale slugs, sorted", () => {
    expect(slugs).toEqual(["alpha", "beta"]);
  });

  it("keeps both the guide-stamp and the section findings per guide", () => {
    expect(byGuide.alpha.guideStale).toBeTruthy();
    expect(byGuide.alpha.sections).toHaveLength(1);
    expect(byGuide.alpha.sections[0].title).toBe("Money");
  });

  it("a section-only stale guide has no guide-stamp entry", () => {
    expect(byGuide.beta.guideStale).toBe(null);
    expect(byGuide.beta.sections).toHaveLength(1);
  });

  it("never includes drafts or clean guides", () => {
    expect(slugs).not.toContain("draftguide");
    expect(byGuide.draftguide).toBeUndefined();
  });

  it("empty staleness → empty work-list", () => {
    expect(toWorklist({ stale: [], sections: [] }).slugs).toEqual([]);
  });

  it("tolerates missing arrays", () => {
    expect(toWorklist({}).slugs).toEqual([]);
  });
});

describe("formatGuide", () => {
  const { byGuide } = toWorklist(MOCK);

  it("lists each stale fact + its source and the re-verify instruction", () => {
    const out = formatGuide("alpha", byGuide.alpha);
    expect(out).toContain("2 item(s) to re-verify"); // alpha has a stale section AND a stale guide-stamp
    expect(out).toContain("Money");
    expect(out).toContain("https://x.example");
    expect(out).toContain("guide stamp");
    expect(out).toMatch(/PRIMARY \(T0\) source/);
    expect(out).toContain("npm run verify -- --slug alpha");
  });

  it("a clean / unknown guide reports nothing to do", () => {
    expect(formatGuide("gamma", undefined)).toMatch(/current, nothing past shelf life/);
    expect(formatGuide("gamma", { guideStale: null, sections: [] })).toMatch(/current, nothing past shelf life/);
  });
});
