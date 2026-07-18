// Tests for the verify roll-up gate (scripts/verify-guide.mjs): the verdict logic (evaluateGuide,
// via the real readiness checks on mock guides) and the markdown scorecard renderer (P4).

import { describe, it, expect } from "vitest";
import { evaluateGuide, renderMarkdown } from "../verify-guide.mjs";

const CLEAN_STALENESS = { stale: [], sections: [], noDate: [], drafts: [] };

describe("evaluateGuide verdict", () => {
  it("a clean published guide PASSes with no blockers", () => {
    const guide = {
      verified: "Checked Jun 2026 for the trip",
      sections: [{ type: "prose", group: "Overview", title: "About", body: "A lovely city with much to see and do." }],
    };
    const r = evaluateGuide(guide, "clean", CLEAN_STALENESS, null);
    expect(r.pass).toBe(true);
    expect(r.blockers).toEqual([]);
    expect(r.readiness.pass).toBe(true);
  });

  it("an empty-body section FAILs on the research (P0) gate", () => {
    const guide = {
      verified: "Checked Jun 2026 for the trip",
      sections: [{ type: "panel", group: "Plan", title: "When you land", body: "" }],
    };
    const r = evaluateGuide(guide, "empty", CLEAN_STALENESS, null);
    expect(r.pass).toBe(false);
    expect(r.blockers).toContain("research");
  });

  it("recency is advisory — a stale published guide still PASSes the verdict", () => {
    const guide = { verified: "Checked Jun 2026", sections: [{ type: "prose", group: "Overview", title: "About", body: "Lots to see here." }] };
    const staleness = { stale: [], noDate: [], drafts: [], sections: [{ slug: "s", index: 1, title: "Money", category: "fx", date: "2026-06-01", ageDays: 40, life: 7, source: "https://x" }] };
    const r = evaluateGuide(guide, "s", staleness, null);
    expect(r.recency.status).toBe("stale");
    expect(r.pass).toBe(true); // recency never blocks the verdict
  });

  it("a draft is exempt from recency", () => {
    const guide = { draft: true, verified: "⚠ Draft", sections: [{ type: "prose", group: "Overview", title: "About", body: "Lots to see here." }] };
    const r = evaluateGuide(guide, "d", CLEAN_STALENESS, null);
    expect(r.recency.status).toBe("n/a");
  });

  it("dead links (with --network) block the verdict", () => {
    const guide = { verified: "Checked Jun 2026", sections: [{ type: "prose", group: "Overview", title: "About", body: "Lots to see here." }] };
    const net = { links: { dead: [{ url: "https://dead.example", guides: ["n"] }] }, photos: { missing: [] } };
    const r = evaluateGuide(guide, "n", CLEAN_STALENESS, net);
    expect(r.content.status).toBe("fail");
    expect(r.blockers).toContain("content");
    expect(r.pass).toBe(false);
  });
});

describe("renderMarkdown", () => {
  const base = {
    slug: "korea", draft: false, pass: true, blockers: [],
    readiness: { pass: true, warns: [], infos: [], coverage: {} },
    recency: { status: "current", staleSections: [] },
    content: { status: "skipped" },
    noVerifiedDate: false,
  };

  it("renders a passing scorecard with the marker, table, and checklist", () => {
    const md = renderMarkdown(base);
    expect(md).toMatch(/^<!-- waypoint-scorecard:korea -->/);
    expect(md).toContain("Verdict: ✅ PASS");
    expect(md).toContain("| Gate | Tier | Result |");
    expect(md).toContain("Research —");
    expect(md).toContain("- [ ] **#9**"); // a human-checklist row
  });

  it("renders NEEDS WORK with a collapsible blocking-findings list", () => {
    const md = renderMarkdown({
      ...base, pass: false, blockers: ["research"],
      readiness: { pass: false, warns: [{ severity: "warn", msg: 'panel "When you land" is empty' }], infos: [], coverage: {} },
    });
    expect(md).toContain("Verdict: ❌ NEEDS WORK");
    expect(md).toContain("<details><summary>⚠ 1 blocking");
    expect(md).toContain('panel "When you land" is empty');
  });

  it("shows a draft's recency as n/a and stale recency as advisory", () => {
    expect(renderMarkdown({ ...base, draft: true, recency: { status: "n/a", reason: "draft" } })).toContain("— n/a (draft)");
    expect(renderMarkdown({ ...base, recency: { status: "stale", staleSections: [{ index: 1, title: "Money" }] } })).toContain("past shelf life (advisory)");
  });

  it("lists dead links + missing photos when content failed", () => {
    const md = renderMarkdown({
      ...base, content: { status: "fail", deadLinks: [{ url: "https://dead.example" }], missingPhotos: [{ file: "File:Ghost.jpg" }] },
    });
    expect(md).toContain("dead link: https://dead.example");
    expect(md).toContain("missing photo: File:Ghost.jpg");
  });
});
