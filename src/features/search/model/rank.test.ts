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

describe("token matching (D7: pasted references still find the place)", () => {
  const recs = [
    { slug: "korea", guideTitle: "Korea", kind: "place", title: "Gyeongbokgung Palace", section: "Sights", anchor: "a", hay: "gyeongbokgung palace royal seoul" },
    { slug: "korea", guideTitle: "Korea", kind: "section", title: "Booking ahead", section: "Plan", anchor: "b", hay: "booking ahead reservation needed for the palace tour" },
    { slug: "korea", guideTitle: "Korea", kind: "venue", title: "Tosokchon", section: "Food", anchor: "c", hay: "tosokchon samgyetang" },
  ] as never[];
  it("splits a hyphenated query into words and requires each of them when it can", () => {
    const g = rankSearch(recs, "palace-reservation", "korea");
    expect(g.flatMap((x) => x.items.map((i) => i.title))).toEqual(["Booking ahead"]);
  });
  it("relaxes to any word when no record carries the whole query", () => {
    const g = rankSearch(recs, "Gyeongbokgung-Palace-Reservation-ABCDEFG-2026", "korea");
    const titles = g.flatMap((x) => x.items.map((i) => i.title));
    expect(titles[0]).toBe("Gyeongbokgung Palace");
    expect(titles).toContain("Booking ahead");
    expect(titles).not.toContain("Tosokchon");
  });
});
