// Tests for the perishable-fact registry mechanics (src/lib/facts.mjs).
//
// Two properties matter most and both are cheap to guard:
//  1. An unresolved token must be REPORTED, never silently dropped or silently kept — the
//     loader turns a report into a build failure, because a literal "{{fact:…}}" reaching
//     dist/ would appear in the page AND in the .ics/.gpx exports.
//  2. `≈` is derived from state, never authored into a value. That keeps one spelling of
//     "sourced-but-approximate" and stops a bare ≈ from being typed beside an unsourced number.

import { describe, it, expect } from "vitest";
import {
  RESERVED_GUIDE_FILES,
  isSectionFile,
  FACT_TOKEN_RE,
  FACT_VALUE_FORBIDDEN_RE,
  renderFactValue,
  collectTokens,
  interpolateFacts,
  unusedFactIds,
} from "./facts.mjs";

const FACTS = {
  "museum-x-admission": { claim: "Museum X adult admission", value: "€12", state: "clean" },
  "bus-ride-time": {
    claim: "Airport bus duration", value: "60–70 min", state: "approx",
    source_url: "https://example.com/bus", verified_on: "2026-07-01", shelf_life: "transit",
  },
};

describe("isSectionFile — the guard five directory readers depend on", () => {
  it("treats _guide.json and facts.json as reserved, not sections", () => {
    expect(isSectionFile("_guide.json")).toBe(false);
    expect(isSectionFile("facts.json")).toBe(false);
    expect(RESERVED_GUIDE_FILES.has("facts.json")).toBe(true);
  });

  it("accepts real section files", () => {
    expect(isSectionFile("01-plan.json")).toBe(true);
    expect(isSectionFile("07-money-and-budget.json")).toBe(true);
  });

  it("ignores non-json entries", () => {
    expect(isSectionFile("notes.md")).toBe(false);
    expect(isSectionFile("facts.json.bak")).toBe(false);
  });
});

describe("renderFactValue — ≈ is derived, never authored", () => {
  it("renders a clean fact as-is", () => {
    expect(renderFactValue({ value: "€12", state: "clean" })).toBe("€12");
  });
  it("defaults to clean when state is absent", () => {
    expect(renderFactValue({ value: "€12" })).toBe("€12");
  });

  // D10/Stage A.7 (creator-confirmed form, Stage A/B review): an approx value renders as the
  // PLAIN value followed by a small "≈ approx." pill — the design-handoff's literal flag-chip
  // label — never a bare "≈…" string and never the value swallowed into the pill.
  describe("an approx fact", () => {
    const fact = {
      claim: "Airport bus duration", value: "60–70 min", state: "approx",
      source_url: "https://example.com/bus", verified_on: "2026-07-01",
      shelf_life: "transit", tier: "primary",
    };
    const html = renderFactValue(fact);

    it("renders the value plain, then the ≈ approx. pill as a real allowlisted <a>", () => {
      expect(html).toMatch(/^60–70 min <a class="flag-chip flag-chip--approx" /);
      expect(html).toContain(">≈ approx.</a>");
    });
    it("links straight at the source — works with zero JS", () => {
      expect(html).toContain('href="https://example.com/bus"');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener"');
    });
    it("carries every popover field as data-*, for provenance-dot.js to build the same popover", () => {
      expect(html).toContain('data-claim="Airport bus duration"');
      expect(html).toContain('data-verified-on="2026-07-01"');
      expect(html).toContain('data-shelf-life="transit"');
      expect(html).toContain('data-source-url="https://example.com/bus"');
      expect(html).toContain('data-tier="primary"');
    });
    it("omits data-tier when the fact carries none", () => {
      expect(renderFactValue({ ...fact, tier: undefined })).not.toContain("data-tier");
    });
    it("HTML-escapes a claim carrying quotes or angle brackets", () => {
      const out = renderFactValue({ ...fact, claim: `A "quoted" <claim>` });
      expect(out).toContain('data-claim="A &quot;quoted&quot; &lt;claim&gt;"');
    });
    it("strips to honest plain text for the .ics/.gpx exports (tags dropped, inner text kept)", () => {
      expect(html.replace(/<[^>]*>/g, "")).toBe("60–70 min ≈ approx.");
    });
  });
});

describe("token matching", () => {
  it("matches kebab ids only", () => {
    expect([..."{{fact:museum-x-admission}}".matchAll(FACT_TOKEN_RE)][0][1]).toBe("museum-x-admission");
    expect([..."{{fact:Museum_X}}".matchAll(FACT_TOKEN_RE)]).toHaveLength(0);
  });

  it("collects every referenced id across a nested structure, deduped", () => {
    const tree = {
      sections: [
        { body: "<p>Entry is {{fact:museum-x-admission}}.</p>" },
        { items: [{ why: "About {{fact:bus-ride-time}} from the airport" }] },
        { body: "Again: {{fact:museum-x-admission}}" },
      ],
    };
    expect(collectTokens(tree)).toEqual(["museum-x-admission", "bus-ride-time"]);
  });

  it("rejects markup in a fact value — it would bypass the prose tag allowlist", () => {
    expect(FACT_VALUE_FORBIDDEN_RE.test("€12")).toBe(false);
    expect(FACT_VALUE_FORBIDDEN_RE.test("<b>€12</b>")).toBe(true);
    expect(FACT_VALUE_FORBIDDEN_RE.test("€12</p>")).toBe(true);
  });
});

describe("interpolateFacts", () => {
  it("substitutes into deeply nested strings and leaves everything else alone", () => {
    const tree = {
      title: "Denmark",
      draft: true,
      count: 3,
      sections: [{ type: "prose", body: "<p>Entry is {{fact:museum-x-admission}}.</p>" }],
    };
    const { data, used, missing } = interpolateFacts(tree, FACTS);
    expect(data.sections[0].body).toBe("<p>Entry is €12.</p>");
    expect(data.title).toBe("Denmark");
    expect(data.draft).toBe(true);
    expect(data.count).toBe(3);
    expect(used).toEqual(["museum-x-admission"]);
    expect(missing).toEqual([]);
  });

  it("applies the ≈ marker (value + the ≈ approx. pill) from the record's state", () => {
    const { data } = interpolateFacts({ b: "Takes {{fact:bus-ride-time}}." }, FACTS);
    expect(data.b).toMatch(/^Takes 60–70 min <a class="flag-chip flag-chip--approx" .*>≈ approx\.<\/a>\.$/);
  });

  it("reports an unknown id instead of failing silently", () => {
    const { data, missing } = interpolateFacts({ b: "Costs {{fact:nope}}." }, FACTS);
    expect(missing).toEqual(["nope"]);
    // Left in place by default so the caller can print the offending text verbatim.
    expect(data.b).toContain("{{fact:nope}}");
  });

  it("does not mutate the input tree", () => {
    const tree = { b: "{{fact:museum-x-admission}}" };
    interpolateFacts(tree, FACTS);
    expect(tree.b).toBe("{{fact:museum-x-admission}}");
  });

  it("handles a guide with no registry at all — the dormant case", () => {
    const tree = { b: "no tokens here" };
    const { data, used, missing } = interpolateFacts(tree, {});
    expect(data).toEqual(tree);
    expect(used).toEqual([]);
    expect(missing).toEqual([]);
  });

  it("substitutes every occurrence of a repeated fact — the one-edit-updates-everywhere property", () => {
    const tree = { a: "{{fact:museum-x-admission}}", b: "also {{fact:museum-x-admission}}" };
    const { data } = interpolateFacts(tree, FACTS);
    expect(data.a).toBe("€12");
    expect(data.b).toBe("also €12");
  });
});

describe("unusedFactIds", () => {
  it("flags a registered fact nothing references", () => {
    expect(unusedFactIds(FACTS, ["museum-x-admission"])).toEqual(["bus-ride-time"]);
  });
  it("is empty when everything is referenced", () => {
    expect(unusedFactIds(FACTS, ["museum-x-admission", "bus-ride-time"])).toEqual([]);
  });
});
