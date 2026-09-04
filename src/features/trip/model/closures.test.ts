// @protects-file What is shut on a given day is read from real holiday and opening-hours data.

import { describe, it, expect } from "vitest";
import { buildClosures, closureCount, weekdayOf } from "./closures";

describe("weekdayOf", () => {
  it("maps a JS Sunday-first date onto the schema's Monday-first vocabulary", () => {
    expect(weekdayOf(new Date("2026-10-15T12:00:00"))).toBe("thu");
    expect(weekdayOf(new Date("2026-10-18T12:00:00"))).toBe("sun");
    expect(weekdayOf(new Date("2026-10-19T12:00:00"))).toBe("mon");
  });
});

describe("buildClosures", () => {
  const sections = [
    { type: "sights", title: "Seoul sights", items: [
      { name: "Gyeongbokgung", closed_days: ["tue"], verified_on: "2026-07-29", source_url: "https://example.com/g" },
      { name: "Changdeokgung", closed_days: ["mon"] },
      { name: "Bukchon", },
    ] },
    { type: "venues", title: "Food", items: [
      { name: "Yanagibashi Market", closed_days: ["sun", "tue"] },
    ] },
  ];

  it("groups places by the weekday they are shut, Monday first", () => {
    const days = buildClosures(sections);
    expect(days.map((d) => d.day)).toEqual(["mon", "tue", "sun"]);
    expect(days[1].places.map((p) => p.name)).toEqual(["Gyeongbokgung", "Yanagibashi Market"]);
  });

  it("carries each place's own check date and source, where it has them", () => {
    const tue = buildClosures(sections).find((d) => d.day === "tue")!;
    const g = tue.places.find((p) => p.name === "Gyeongbokgung")!;
    expect(g.verifiedOn).toBe("2026-07-29");
    expect(g.sourceUrl).toBe("https://example.com/g");
    expect(tue.places.find((p) => p.name === "Yanagibashi Market")!.verifiedOn).toBeNull();
  });

  it("omits entries with no closed_days rather than guessing from prose", () => {
    const names = buildClosures(sections).flatMap((d) => d.places.map((p) => p.name));
    expect(names).not.toContain("Bukchon");
  });

  it("returns an empty list — an admitted blank — when nothing declares a closure", () => {
    expect(buildClosures([{ type: "sights", items: [{ name: "Bukchon" }] }])).toEqual([]);
    expect(buildClosures(null)).toEqual([]);
  });

  it("lists a place once per weekday even when two sections carry it", () => {
    const days = buildClosures([
      { type: "sights", title: "A", items: [{ name: "Gyeongbokgung", closed_days: ["tue"] }] },
      { type: "sights", title: "B", items: [{ name: "Gyeongbokgung", closed_days: ["tue"] }] },
    ]);
    expect(days[0].places).toHaveLength(1);
  });

  it("ignores a weekday value the schema would never allow", () => {
    expect(buildClosures([{ type: "sights", items: [{ name: "X", closed_days: ["someday"] }] }])).toEqual([]);
  });

  it("counts distinct places, not closure rows", () => {
    // Yanagibashi closes twice a week — it is still one place.
    expect(closureCount(buildClosures(sections))).toBe(3);
  });
});
