// Tests for the verify roll-up gate (scripts/verify-guide.mjs): the verdict logic (evaluateGuide,
// via the real readiness checks on mock guides), the markdown scorecard renderer (P4), the plain-text
// CLI renderer, and the verify() orchestrator (readGuides/checkStaleness/network audits mocked out —
// this is a rollup gate, not the place to re-test the audit scripts it calls).

// @protects-file A guide cannot publish with unsourced facts or broken references.

import { describe, it, expect, vi, beforeEach } from "vitest";

const readGuidesMock = vi.fn();
const checkStalenessMock = vi.fn();
const checkLinksMock = vi.fn();
const checkPhotosMock = vi.fn();

vi.mock("../audit/lib.mjs", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, readGuides: (...args) => readGuidesMock(...args) };
});
vi.mock("../audit/check-staleness.mjs", () => ({ checkStaleness: (...args) => checkStalenessMock(...args) }));
vi.mock("../audit/check-links.mjs", () => ({ checkLinks: (...args) => checkLinksMock(...args) }));
vi.mock("../audit/check-photos.mjs", () => ({ checkPhotos: (...args) => checkPhotosMock(...args) }));

const { evaluateGuide, renderMarkdown, report, verify, checkCoverage, checkVoice, sourceCoverage, evaluateReadiness } = await import("../verify-guide.mjs");

const CLEAN_STALENESS = { stale: [], sections: [], noDate: [], drafts: [] };

describe("checkVoice (P6 traveler-facing voice)", () => {
  const guideWith = (body) => ({
    sections: [{ type: "prose", group: "Plan", title: "Plan", body }],
  });

  it.each([
    "Nestled in the heart of Kumamoto, the market is easy to reach.",
    "The district offers a rich tapestry of history.",
    "The hall serves as a testament to the city's food culture.",
    "It is important to note that the last bus leaves early.",
    "In conclusion, Kurokawa is worth visiting.",
    "Let's delve into the neighborhood.",
    "This restaurant is a game changer.",
  ])("blocks unmistakable formulaic travel copy: %s", (body) => {
    const result = checkVoice(guideWith(body));
    expect(result.status).toBe("fail");
    expect(result.hits.length).toBeGreaterThan(0);
  });

  it("still blocks research-process leakage", () => {
    expect(checkVoice(guideWith("Our research found that this is the best option.")).status).toBe("fail");
  });

  it("does not globally ban context-sensitive ordinary travel words", () => {
    const result = checkVoice(guideWith(
      "The volcanic landscape around Aso is visible from Kusasenri. The station area is bustling after the morning trains.",
    ));
    expect(result.status).toBe("pass");
  });

  it("passes direct, restrained traveler guidance", () => {
    const result = checkVoice(guideWith(
      "Take the morning bus to Kurokawa. It reaches town before lunch and leaves enough time for the baths.",
    ));
    expect(result.status).toBe("pass");
  });
  it("scans nested day-card prose rather than only section-level bodies", () => {
    const result = checkVoice({
      sections: [{
        type: "days",
        group: "Days",
        title: "Day by day",
        items: [{ date: "Mon Nov 9", title: "Kumamoto", body: "A rich tapestry of neighborhoods awaits." }],
      }],
    });
    expect(result.status).toBe("fail");
  });

  it("scans guide descriptors because they are traveler-facing copy", () => {
    const result = checkVoice({
      descriptors: { "Trip anchor": "Nestled in the heart of the city." },
      sections: [],
    });
    expect(result.status).toBe("fail");
  });
});

// sourceCoverage / evaluateReadiness — folded in from the former scripts/guide-readiness.mjs
// (2026-08-15). No dedicated test file existed for that module; these pin the behavior verify-guide
// now owns directly.
describe("sourceCoverage (folded in from guide-readiness.mjs)", () => {
  it("counts a contentful fact section with source_url as sourced", () => {
    const guide = { sections: [{ type: "prose", group: "Overview", title: "About", body: "A real paragraph.", source_url: "https://x.example" }] };
    const c = sourceCoverage(guide);
    expect(c).toEqual({ total: 1, sourced: 1, pct: 1 });
  });

  it("counts a contentful fact section with an inline <a href> citation as sourced", () => {
    // Single-quoted href, matching this repo's own guide-content convention — JSON.stringify
    // escapes double quotes to `\"`, which the isSourced regex does not match through.
    const guide = { sections: [{ type: "prose", group: "Overview", title: "About", body: "See <a href='https://x.example'>the source</a>." }] };
    const c = sourceCoverage(guide);
    expect(c.sourced).toBe(1);
  });

  it("counts a contentful fact section with neither as unsourced", () => {
    const guide = { sections: [{ type: "prose", group: "Overview", title: "About", body: "A real paragraph with no citation." }] };
    const c = sourceCoverage(guide);
    expect(c).toEqual({ total: 1, sourced: 0, pct: 0 });
  });

  it("excludes an empty scaffold section (no body/items/steps/checklist)", () => {
    const guide = { sections: [{ type: "prose", group: "Overview", title: "About", body: "" }] };
    expect(sourceCoverage(guide)).toEqual({ total: 0, sourced: 0, pct: 1 });
  });

  it("excludes sections in a References group by design", () => {
    const guide = { sections: [{ type: "list", group: "References", title: "Sources", items: ["one", "two"] }] };
    expect(sourceCoverage(guide)).toEqual({ total: 0, sourced: 0, pct: 1 });
  });

  it("excludes non-fact section types (e.g. map, sights)", () => {
    const guide = { sections: [{ type: "map", group: "Overview", points: [{ name: "x" }] }] };
    expect(sourceCoverage(guide)).toEqual({ total: 0, sourced: 0, pct: 1 });
  });

  it("returns pct 1 when there are zero fact sections (vacuously full)", () => {
    const guide = { sections: [] };
    expect(sourceCoverage(guide).pct).toBe(1);
  });
});

describe("evaluateReadiness (folded in from guide-readiness.mjs)", () => {
  it("passes when check-research reports no blocking (warn) findings", () => {
    const guide = { verified: "Checked Jun 2026", sections: [{ type: "prose", group: "Overview", title: "About", body: "A lovely city with much to see." }] };
    const r = evaluateReadiness(guide, "clean");
    expect(r.pass).toBe(true);
    expect(r.warns).toEqual([]);
    expect(r.slug).toBe("clean");
    expect(r.coverage).toBeTruthy();
  });

  it("fails when check-research reports a blocking (warn) finding, but still reports infos separately", () => {
    const guide = { sections: [{ type: "panel", group: "Plan", title: "When you land", body: "" }] };
    const r = evaluateReadiness(guide, "empty");
    expect(r.pass).toBe(false);
    expect(r.warns.length).toBeGreaterThan(0);
    expect(r.warns.every((f) => f.severity === "warn")).toBe(true);
  });
});

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

  it("a Commons API failure marks content unverifiable and blocks (fail-closed, not fail-open)", () => {
    const guide = { verified: "Checked Jun 2026", sections: [{ type: "prose", group: "Overview", title: "About", body: "Lots to see here." }] };
    const net = { links: { dead: [], checked: 3, error: [] }, photos: { missing: [], apiError: "Commons API HTTP 503" } };
    const r = evaluateGuide(guide, "n", CLEAN_STALENESS, net);
    expect(r.content.status).toBe("unverifiable");
    expect(r.content.reason).toContain("Commons API");
    expect(r.blockers).toContain("content-unverifiable");
    expect(r.pass).toBe(false);
  });

  it("every link probe failing (network outage) marks content unverifiable and blocks", () => {
    const guide = { verified: "Checked Jun 2026", sections: [{ type: "prose", group: "Overview", title: "About", body: "Lots to see here." }] };
    const net = { links: { dead: [], checked: 5, error: [{ url: "https://a" }, { url: "https://b" }, { url: "https://c" }, { url: "https://d" }, { url: "https://e" }] }, photos: { missing: [], apiError: null } };
    const r = evaluateGuide(guide, "n", CLEAN_STALENESS, net);
    expect(r.content.status).toBe("unverifiable");
    expect(r.content.reason).toBe("all link probes failed — network outage");
    expect(r.blockers).toContain("content-unverifiable");
    expect(r.pass).toBe(false);
  });

  it("a single flaky error link among otherwise-checked links stays advisory — still PASSes", () => {
    const guide = { verified: "Checked Jun 2026", sections: [{ type: "prose", group: "Overview", title: "About", body: "Lots to see here." }] };
    const net = { links: { dead: [], checked: 5, error: [{ url: "https://flaky" }] }, photos: { missing: [], apiError: null } };
    const r = evaluateGuide(guide, "n", CLEAN_STALENESS, net);
    expect(r.content.status).toBe("pass");
    expect(r.pass).toBe(true);
  });

  it("a clean network check (no dead links, no missing photos, no outage) PASSes", () => {
    const guide = { verified: "Checked Jun 2026", sections: [{ type: "prose", group: "Overview", title: "About", body: "Lots to see here." }] };
    const net = { links: { dead: [], checked: 5, error: [] }, photos: { missing: [], apiError: null } };
    const r = evaluateGuide(guide, "n", CLEAN_STALENESS, net);
    expect(r.content.status).toBe("pass");
    expect(r.pass).toBe(true);
  });
});

// B3 (docs/archive/INDEX.md → PLAN_EVIDENCE_FIRST): facts.json hygiene is ADVISORY ONLY this packet — the
// DO NOT TOUCH boundary its own task packet names ("existing blockers list semantics"). These
// pin that a guide riddled with hygiene findings still PASSes on hygiene grounds alone; E1 is
// the (separate, future) packet that may promote some of these to real blockers.
describe("evaluateGuide — facts hygiene (B3, advisory only)", () => {
  const guide = { verified: "Checked Jun 2026", sections: [{ type: "prose", group: "Overview", title: "About", body: "Lots to see here." }] };

  it("a guide with no facts.json reports hygiene n/a and is unaffected", () => {
    const r = evaluateGuide(guide, "no-facts", CLEAN_STALENESS, null, null);
    expect(r.hygiene.status).toBe("n/a");
    expect(r.pass).toBe(true);
  });

  it("a malformed value in facts.json is surfaced in hygiene, but never blocks the verdict", () => {
    const facts = { a: { claim: "Sights → Museum entry — $19,", value: "$19,", source_url: "https://x.example/", verified_on: "2026-01-01", shelf_life: "venue" } };
    const r = evaluateGuide(guide, "malformed", CLEAN_STALENESS, null, facts);
    expect(r.hygiene.status).toBe("advisory");
    expect(r.hygiene.malformed).toHaveLength(1);
    expect(r.blockers).not.toContain("hygiene");
    expect(r.blockers).toEqual([]);
    expect(r.pass).toBe(true);
  });

  it("a facts.json with none of the three defect classes reports hygiene clean", () => {
    const facts = { a: { claim: "Sights → Museum entry — $10", value: "$10", source_url: "https://x.example/", verified_on: "2026-01-01", shelf_life: "venue" } };
    const r = evaluateGuide(guide, "clean-facts", CLEAN_STALENESS, null, facts);
    expect(r.hygiene.status).toBe("clean");
    expect(r.pass).toBe(true);
  });
});

describe("renderMarkdown", () => {
  const base = {
    slug: "korea", draft: false, pass: true, blockers: [],
    readiness: { pass: true, warns: [], infos: [], coverage: {} },
    recency: { status: "current", staleSections: [] },
    content: { status: "skipped" },
    coverage: { status: "n/a", uncovered: [] },
    noVerifiedDate: false,
  };

  it("renders a passing scorecard with the marker, table, and ADVISORY review prompts (#12 scar)", () => {
    const md = renderMarkdown(base);
    expect(md).toMatch(/^<!-- waypoint-scorecard:korea -->/);
    expect(md).toContain("Verdict: ✅ PASS");
    expect(md).toContain("| Gate | Tier | Result |");
    expect(md).toContain("Research —");
    // The human rows are ADVISORY review prompts — the evidence gate is the publication bar
    // (publish.mjs doctrine; the separate human approval ceremony was removed). The old footer
    // claimed publishing "still needs the checklist", an unenforced requirement no automation
    // honored: unchecked boxes under mandatory-sounding prose may not return.
    expect(md).toContain("- **#9**"); // a prompt row — not a checkbox
    expect(md).not.toContain("- [ ]");
    expect(md).toContain("the evidence gate");
    expect(md).not.toMatch(/still needs the checklist|Publishing still needs/i);
    expect(md).toContain("not unpublished requirements");
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

  it("renders unverifiable content distinctly from a clean pass", () => {
    const md = renderMarkdown({
      ...base, pass: false, blockers: ["content-unverifiable"],
      content: { status: "unverifiable", reason: "Commons API: HTTP 503", deadLinks: [], missingPhotos: [] },
    });
    expect(md).toContain("UNVERIFIABLE");
    expect(md).toContain("do NOT publish on this run");
    expect(md).toContain("Verdict: ❌ NEEDS WORK");
  });
});

describe("report (plain-text CLI renderer)", () => {
  const base = {
    slug: "korea", draft: false, pass: true, blockers: [],
    readiness: { pass: true, warns: [], infos: [], coverage: {} },
    recency: { status: "current", staleSections: [] },
    content: { status: "skipped" },
    coverage: { status: "n/a", uncovered: [] },
    noVerifiedDate: false,
  };

  it("renders a PASS header and ADVISORY review prompts, never a publish checklist (#12 scar)", () => {
    const out = report(base);
    expect(out).toContain("korea — PASS ✓");
    expect(out).toContain("draft: no");
    expect(out).toContain("P0 research   · PASS");
    expect(out).toContain("verdict: PASS");
    expect(out).toContain("#9"); // the prompt stays visible…
    expect(out).not.toContain("[ ] #9"); // …but never as an unchecked publish requirement
    expect(out).toContain("advisory — the evidence gate is the publication bar");
    expect(out).not.toMatch(/Publishing still needs/i);
  });

  it("renders NEEDS WORK with each blocking finding listed", () => {
    const out = report({
      ...base, pass: false, blockers: ["research"],
      readiness: { pass: false, warns: [{ severity: "warn", msg: "panel is empty" }], infos: [], coverage: {} },
    });
    expect(out).toContain("NEEDS WORK");
    expect(out).toContain("P0 research   · FAIL");
    expect(out).toContain("⚠ panel is empty");
    expect(out).toContain("verdict: NEEDS WORK — fix the blocking gate(s): research");
  });

  it("reports content as skipped when --network wasn't run", () => {
    expect(report(base)).toContain("P0 content    · skipped — run with --network");
  });

  it("reports dead links and missing photos when content failed", () => {
    const out = report({
      ...base, content: { status: "fail", deadLinks: [{ url: "https://dead.example" }], missingPhotos: [{ file: "File:Ghost.jpg" }] },
    });
    expect(out).toContain("✗ dead link: https://dead.example");
    expect(out).toContain("✗ missing photo: File:Ghost.jpg");
  });

  it("reports unverifiable content as a distinct do-NOT-publish state", () => {
    const out = report({
      ...base, pass: false, blockers: ["content-unverifiable"],
      content: { status: "unverifiable", reason: "all link probes failed — network outage", deadLinks: [], missingPhotos: [] },
    });
    expect(out).toContain("P0 content    · UNVERIFIABLE");
    expect(out).toContain("do NOT publish on this run");
    expect(out).toContain("verdict: NEEDS WORK — fix the blocking gate(s): content-unverifiable");
  });

  it("reports draft recency as n/a", () => {
    expect(report({ ...base, draft: true, recency: { status: "n/a", reason: "draft — unverified by design, not stale" } }))
      .toContain("P1 recency    · n/a — draft — unverified by design, not stale");
  });

  it("reports stale sections with their category/age/shelf-life", () => {
    const out = report({
      ...base,
      recency: {
        status: "stale",
        staleSections: [{ index: 2, title: "Money", category: "fx", date: "2026-06-01", ageDays: 40, life: 7, source: "https://x.example" }],
        guideStale: null,
      },
    });
    expect(out).toContain('§2 "Money" — fx fact 2026-06-01, 40d vs 7d · re-check: https://x.example');
  });

  it("notes a `verified` field with no parseable date", () => {
    expect(report({ ...base, noVerifiedDate: true })).toContain("has a `verified` field but no parseable");
  });
});

describe("verify() orchestrator", () => {
  const GUIDE_A = {
    file: "a.json", slug: "a",
    guide: { verified: "Checked Jun 2026", sections: [{ type: "prose", group: "Overview", title: "About", body: "Lots to see and do here." }] },
  };
  const GUIDE_B = {
    file: "b.json", slug: "b",
    guide: { verified: "Checked Jun 2026", sections: [{ type: "prose", group: "Overview", title: "About", body: "Another fine destination." }] },
  };
  const CLEAN_STALENESS = { stale: [], sections: [], noDate: [], drafts: [] };

  beforeEach(() => {
    // Clears call history only (not implementations) — each test sets its own
    // mockResolvedValue anyway, but a "was X called" assertion must not inherit
    // calls left over from an earlier test in this block.
    vi.clearAllMocks();
  });

  it("returns an error and no results when --slug names a guide that doesn't exist", async () => {
    readGuidesMock.mockResolvedValue([GUIDE_A]);
    const { results, error } = await verify({ slug: "nonexistent" });
    expect(error).toBe('no guide with slug "nonexistent"');
    expect(results).toEqual([]);
    expect(checkStalenessMock).not.toHaveBeenCalled();
  });

  it("evaluates every guide when no --slug is given", async () => {
    readGuidesMock.mockResolvedValue([GUIDE_A, GUIDE_B]);
    checkStalenessMock.mockResolvedValue(CLEAN_STALENESS);
    const { results, error, network } = await verify({});
    expect(error).toBeNull();
    expect(network).toBe(false);
    expect(results.map((r) => r.slug)).toEqual(["a", "b"]);
    expect(results.every((r) => r.content.status === "skipped")).toBe(true);
  });

  it("filters to just the named guide when --slug is given", async () => {
    readGuidesMock.mockResolvedValue([GUIDE_A, GUIDE_B]);
    checkStalenessMock.mockResolvedValue(CLEAN_STALENESS);
    const { results } = await verify({ slug: "b" });
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe("b");
  });

  it("runs the network audits and folds dead links / missing photos into content when --network is set", async () => {
    readGuidesMock.mockResolvedValue([GUIDE_A]);
    checkStalenessMock.mockResolvedValue(CLEAN_STALENESS);
    checkLinksMock.mockResolvedValue({ dead: [{ url: "https://dead.example", guides: ["a"] }] });
    checkPhotosMock.mockResolvedValue({ missing: [] });
    const { results, network } = await verify({ network: true });
    expect(network).toBe(true);
    expect(checkLinksMock).toHaveBeenCalled();
    expect(checkPhotosMock).toHaveBeenCalled();
    expect(results[0].content.status).toBe("fail");
    expect(results[0].blockers).toContain("content");
    expect(results[0].pass).toBe(false);
  });

  it("folds a Commons API failure into an unverifiable, failing verdict (fail-closed on outage)", async () => {
    readGuidesMock.mockResolvedValue([GUIDE_A]);
    checkStalenessMock.mockResolvedValue(CLEAN_STALENESS);
    checkLinksMock.mockResolvedValue({ checked: 2, dead: [], blocked: [], error: [], other: [] });
    checkPhotosMock.mockResolvedValue({ checked: 0, missing: [], apiError: "Commons API HTTP 503" });
    const { results } = await verify({ network: true });
    expect(results[0].content.status).toBe("unverifiable");
    expect(results[0].blockers).toContain("content-unverifiable");
    expect(results[0].pass).toBe(false);
  });

  it("never runs the network audits when --network is not set", async () => {
    readGuidesMock.mockResolvedValue([GUIDE_A]);
    checkStalenessMock.mockResolvedValue(CLEAN_STALENESS);
    await verify({});
    expect(checkLinksMock).not.toHaveBeenCalled();
    expect(checkPhotosMock).not.toHaveBeenCalled();
  });
});

describe("checkCoverage (P3/R15)", () => {
  it("returns n/a for a slug without coverage.json (pre-P3 guide)", () => {
    const r = checkCoverage("nonexistent-slug-xyz");
    expect(r.status).toBe("n/a");
    expect(r.uncovered).toEqual([]);
  });
});

describe("evaluateGuide coverage gate (P3/R15)", () => {
  it("pre-P3 guides without coverage.json get coverage n/a and still PASS", () => {
    const guide = { verified: "Checked Jun 2026", sections: [{ type: "prose", group: "Overview", title: "About", body: "Lots to see." }] };
    const r = evaluateGuide(guide, "no-coverage-slug-xyz", CLEAN_STALENESS, null);
    expect(r.coverage.status).toBe("n/a");
    expect(r.pass).toBe(true);
    expect(r.blockers).not.toContain("coverage");
  });
});
