// @protects-file Search can find anything that is actually in a guide.

import { describe, it, expect } from "vitest";
import { buildSectionRecord, buildGuideSearchIndex } from "./search-index";

describe("buildSectionRecord", () => {
  it("shapes a prose section into a record, matching the prototype's crumb/snippet/hay contract", () => {
    const rec = buildSectionRecord("korea", "South Korea", {
      group: "Plan", title: "Local essentials", body: "<p>Plug type C/F, 220V.</p>",
    });
    expect(rec).toEqual({
      slug: "korea",
      kind: "section",
      anchor: "sec-0",
      group: "Plan",
      crumb: "SOUTH KOREA · PLAN",
      title: "Local essentials",
      snippet: "Local essentials Plug type C/F, 220V.",
      hay: "local essentials plan local essentials plug type c/f, 220v.",
      index: 0,
    });
  });

  it("strips HTML tags from the snippet/hay, never leaks markup into search text", () => {
    const rec = buildSectionRecord("korea", "South Korea", {
      group: "Sights", title: "Gyeongbokgung", body: "<b>Closed</b> <a href='x'>Tuesdays</a>.",
    });
    expect(rec?.snippet).not.toMatch(/<[^>]+>/);
    expect(rec?.hay).not.toMatch(/<[^>]+>/);
    expect(rec?.snippet).toContain("Closed");
    expect(rec?.snippet).toContain("Tuesdays");
  });

  it("truncates a long snippet at 150 chars with a trailing ellipsis", () => {
    const long = "x".repeat(200);
    const rec = buildSectionRecord("korea", "South Korea", { group: "Plan", title: "T", body: long });
    expect(rec?.snippet.length).toBe(151); // 150 chars + "…"
    expect(rec?.snippet.endsWith("…")).toBe(true);
  });

  it("does not truncate a short snippet", () => {
    const rec = buildSectionRecord("korea", "South Korea", { group: "Plan", title: "T", body: "short" });
    expect(rec?.snippet).toBe("T short");
    expect(rec?.snippet.endsWith("…")).toBe(false);
  });

  it("pulls text from items — bare strings and name/label/claim + body/correction/note objects", () => {
    const rec = buildSectionRecord("korea", "South Korea", {
      group: "Sights",
      title: "Top sights",
      items: [
        { name: "Nyhavn", body: "Candy-coloured canal houses." },
        { label: "Chip label", note: "a note" },
        { claim: "generic advice", correction: "the real story" },
        "a bare string item",
      ],
    });
    expect(rec?.hay).toContain("nyhavn");
    expect(rec?.hay).toContain("candy-coloured canal houses");
    expect(rec?.hay).toContain("chip label");
    expect(rec?.hay).toContain("the real story");
    expect(rec?.hay).toContain("a bare string item");
  });

  it("pulls text from steps and checklist entries too", () => {
    const rec = buildSectionRecord("korea", "South Korea", {
      group: "Transit", title: "Key routes", steps: ["Take the subway", "Transfer at City Hall"],
      checklist: ["Book KTX tickets"],
    });
    expect(rec?.hay).toContain("take the subway");
    expect(rec?.hay).toContain("book ktx tickets");
  });

  it("falls back to the group name as title when the section has none", () => {
    const rec = buildSectionRecord("korea", "South Korea", { group: "Plan", body: "content" });
    expect(rec?.title).toBe("Plan");
  });

  it("returns null for a section with no searchable text at all — never an empty row", () => {
    expect(buildSectionRecord("korea", "South Korea", { group: "Plan", title: "" })).toBeNull();
    expect(buildSectionRecord("korea", "South Korea", { group: "Plan" })).toBeNull();
  });

  it("matches the four real guides' own title fields (no parallel slug->name registry)", () => {
    // The prototype hardcoded NAME = { korea: "South Korea", japan: "Japan", denmark:
    // "Denmark", us: "Sedona" } — every one of those equals the real guide's own `title`,
    // verified against src/content/guides/*/_guide.json before relying on it here.
    for (const [slug, title] of [["korea", "South Korea"], ["japan", "Japan"], ["denmark", "Denmark"], ["us", "Sedona"]] as const) {
      const rec = buildSectionRecord(slug, title, { group: "Plan", title: "T", body: "x" });
      expect(rec?.crumb).toBe(`${title.toUpperCase()} · PLAN`);
    }
  });
});

describe("buildGuideSearchIndex", () => {
  it("builds one record per searchable section, in order, skipping empty ones", () => {
    const idx = buildGuideSearchIndex("korea", "South Korea", [
      { group: "Plan", title: "A", body: "alpha" },
      { group: "Plan" }, // no title/body/intro/note/items at all -> skipped
      { group: "Sights", title: "B", body: "beta" },
    ]);
    expect(idx.map((r) => r.title)).toEqual(["A", "B"]);
    expect(idx.every((r) => r.slug === "korea")).toBe(true);
  });

  it("emits canonical object records — places, venues, days and stops — with their own anchors", () => {
    const idx = buildGuideSearchIndex("korea", "South Korea", [
      { type: "sights", group: "Sights", title: "Top sights", items: [
        { name: "Gyeongbokgung", kicker: "The grand palace", map: { lat: 1, lng: 2 } },
        { name: "Unmapped Spot", body: "no coordinates" },
      ] },
      { type: "venues", group: "Food", title: "Where to eat", items: [{ name: "Tosokchon", area: "Jongno", map: { lat: 1, lng: 2 } }] },
      { type: "days", group: "Days", title: "Day by day", items: [
        { date: "Thu Jul 9", title: "Arrive", tldr: "Shower, bus", waypoints: [{ name: "ICN T1", time: "~06:30" }],
          branches: [{ label: "Mom", waypoints: [{ name: "Canal tour" }] }] },
      ] },
    ]);
    const by = (kind: string) => idx.filter((r) => r.kind === kind);
    expect(by("place").map((r) => [r.title, r.anchor])).toEqual([["Gyeongbokgung", "sight-gyeongbokgung"], ["Unmapped Spot", "sec-0"]]);
    expect(by("venue").map((r) => r.anchor)).toEqual(["venue-tosokchon"]);
    expect(by("day").map((r) => [r.title, r.anchor])).toEqual([["Arrive", "day-0"]]);
    expect(by("stop").map((r) => r.title)).toEqual(["ICN T1", "Canal tour"]);
    expect(by("place")[0].hay).toContain("grand palace");
  });

  it("marks a section carrying module metadata as a knowledge module", () => {
    const idx = buildGuideSearchIndex("korea", "South Korea", [
      { group: "Transit", title: "How to use the subway", body: "T-money.", module: { id: "subway", kind: "transit" } },
    ]);
    expect(idx[0].kind).toBe("module");
  });

  it("index tracks each record's ORIGINAL position, not its position after skipped sections are dropped", () => {
    // Section 1 (the empty one) is skipped, so without index-passing the second record would
    // wrongly claim index:1 (its output position) instead of index:2 (its real #sec-2 anchor).
    const idx = buildGuideSearchIndex("korea", "South Korea", [
      { group: "Plan", title: "A", body: "alpha" },
      { group: "Plan" },
      { group: "Sights", title: "B", body: "beta" },
    ]);
    expect(idx.map((r) => r.index)).toEqual([0, 2]);
  });

  it("empty array in, empty array out", () => {
    expect(buildGuideSearchIndex("korea", "South Korea", [])).toEqual([]);
  });
});
