// @protects-file The current trip outranks every other guide, and grouping follows real object types.

import { describe, it, expect } from "vitest";
import { rankSearch, normalizeQuery } from "./rank";
import type { SearchRecord } from "./search-index";

const rec = (slug: string, kind: SearchRecord["kind"], title: string, hay = ""): SearchRecord => ({
  slug, kind, group: "G", crumb: "X · G", title, snippet: "", hay: `${title} ${hay}`.toLowerCase(), index: 0, anchor: "sec-0",
});

const records = [
  rec("denmark", "place", "Nyhavn"),
  rec("korea", "section", "Palaces of old Seoul", "gyeongbokgung palace"),
  rec("korea", "place", "Gyeongbokgung", "the grand palace"),
  rec("korea", "stop", "Gyeongbokgung gate", "palace at 14:00"),
  rec("korea", "day", "Palaces & old Seoul"),
];

describe("rankSearch", () => {
  it("returns nothing under the minimum query length", () => {
    expect(rankSearch(records, "p", "korea")).toEqual([]);
    expect(normalizeQuery("  Pal   ace ")).toBe("pal ace");
  });
  it("groups by traveler object type, current trip first, title hits before body hits", () => {
    const groups = rankSearch(records, "palace", "korea");
    expect(groups.map((g) => g.key)).toEqual(["places", "itinerary", "guide"]);
    const places = groups[0].items.map((r) => r.title);
    expect(places).toEqual(["Gyeongbokgung"]);
    expect(groups[1].items.map((r) => r.title)).toEqual(["Palaces & old Seoul", "Gyeongbokgung gate"]);
  });
  it("folds every other guide into one Other trips group when a trip is current", () => {
    const groups = rankSearch(records, "nyhavn", "korea");
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe("other");
  });
  it("is global from Atlas (no current trip): object groups across guides", () => {
    const groups = rankSearch(records, "nyhavn", null);
    expect(groups[0].key).toBe("places");
  });
});
