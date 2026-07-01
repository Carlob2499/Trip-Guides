import { describe, it, expect } from "vitest";
import { parseGuideDate, deriveTripYear, buildHolidayInfo, type RawHoliday } from "./holidays";

describe("parseGuideDate", () => {
  it("parses a plain weekday + month + day string", () => {
    const d = parseGuideDate("Wed Jul 8", 2026);
    expect(d?.toISOString().slice(0, 10)).toBe("2026-07-08");
  });

  it("is tolerant of commas", () => {
    const d = parseGuideDate("Wed, Jul 8, 2026", 2026);
    expect(d?.toISOString().slice(0, 10)).toBe("2026-07-08");
  });

  it("ignores a trailing/leading year token and uses the passed-in year", () => {
    const d = parseGuideDate("Jul 8 2099", 2026);
    expect(d?.toISOString().slice(0, 10)).toBe("2026-07-08");
  });

  it("returns null for null/undefined/empty input", () => {
    expect(parseGuideDate(null, 2026)).toBeNull();
    expect(parseGuideDate(undefined, 2026)).toBeNull();
    expect(parseGuideDate("", 2026)).toBeNull();
  });

  it("returns null when no month token is present", () => {
    expect(parseGuideDate("Wednesday 8", 2026)).toBeNull();
  });

  it("returns null when no day token is present", () => {
    expect(parseGuideDate("Wed Jul", 2026)).toBeNull();
  });

  it("returns null for pure garbage", () => {
    expect(parseGuideDate("not a date", 2026)).toBeNull();
  });
});

describe("deriveTripYear", () => {
  it("uses the build year when the trip date is later in the same year", () => {
    const now = new Date(Date.UTC(2026, 0, 15)); // Jan 15, 2026
    expect(deriveTripYear("Jul 8", now)).toBe(2026);
  });

  it("rolls forward to next year when the trip date is >31 days in the past", () => {
    // Built in December, trip is in January -> should resolve to next year.
    const now = new Date(Date.UTC(2026, 11, 1)); // Dec 1, 2026
    expect(deriveTripYear("Jan 10", now)).toBe(2027);
  });

  it("does NOT roll forward for a date within the last 31 days", () => {
    const now = new Date(Date.UTC(2026, 6, 20)); // Jul 20, 2026
    expect(deriveTripYear("Jul 1", now)).toBe(2026);
  });

  it("falls back to the current year when the date string is unparseable", () => {
    const now = new Date(Date.UTC(2026, 5, 1));
    expect(deriveTripYear(null, now)).toBe(2026);
    expect(deriveTripYear("garbage", now)).toBe(2026);
  });
});

describe("buildHolidayInfo", () => {
  const holidays: RawHoliday[] = [
    { date: "2026-07-04", localName: "Before-shoulder", name: "Before Shoulder", global: true },
    { date: "2026-07-05", localName: "Just-before", name: "Just Before", global: true },
    { date: "2026-07-08", localName: "During-start", name: "During Start", global: true },
    { date: "2026-07-10", localName: "During-mid", name: "During Mid", global: false, counties: ["DK-01"] },
    { date: "2026-07-16", localName: "Just-after", name: "Just After", global: true },
    { date: "2026-07-19", localName: "After-shoulder", name: "After Shoulder", global: true },
  ];

  it("returns null when the holiday list isn't an array", () => {
    expect(buildHolidayInfo(null, "Jul 8", "Jul 15", 2026)).toBeNull();
    expect(buildHolidayInfo(undefined, "Jul 8", "Jul 15", 2026)).toBeNull();
  });

  it("returns null when the trip dates can't be resolved", () => {
    expect(buildHolidayInfo(holidays, "garbage", "also garbage", 2026)).toBeNull();
  });

  it("returns a non-null result with empty arrays when there's data but nothing nearby", () => {
    const info = buildHolidayInfo([], "Jul 8", "Jul 15", 2026);
    expect(info).not.toBeNull();
    expect(info?.during).toEqual([]);
    expect(info?.nearBefore).toEqual([]);
    expect(info?.nearAfter).toEqual([]);
  });

  it("partitions holidays into during/near-before/near-after on the 3-day shoulder boundary", () => {
    const info = buildHolidayInfo(holidays, "Jul 8", "Jul 15", 2026);
    expect(info?.during.map((h) => h.date)).toEqual(["2026-07-08", "2026-07-10"]);
    // Jul 5 is exactly 3 days before Jul 8 -> included; Jul 4 (4 days before) -> excluded.
    expect(info?.nearBefore.map((h) => h.date)).toEqual(["2026-07-05"]);
    // Jul 16 is exactly 1 day after Jul 15 -> included; Jul 19 (4 days after) -> excluded.
    expect(info?.nearAfter.map((h) => h.date)).toEqual(["2026-07-16"]);
  });

  it("computes relative-day labels for near-before/near-after entries", () => {
    const info = buildHolidayInfo(holidays, "Jul 8", "Jul 15", 2026);
    expect(info?.nearBefore[0].rel).toBe("3 days before you arrive");
    expect(info?.nearAfter[0].rel).toBe("1 day after you leave");
  });

  it("marks national vs regional holidays from the `global` flag", () => {
    const info = buildHolidayInfo(holidays, "Jul 8", "Jul 15", 2026);
    expect(info?.during.find((h) => h.date === "2026-07-08")?.national).toBe(true);
    expect(info?.during.find((h) => h.date === "2026-07-10")?.national).toBe(false);
  });

  it("formats tripLabel within a single month", () => {
    const info = buildHolidayInfo([], "Jul 8", "Jul 15", 2026);
    expect(info?.tripLabel).toBe("Jul 8–15");
  });

  it("formats tripLabel across two months", () => {
    const info = buildHolidayInfo([], "Jul 29", "Aug 2", 2026);
    expect(info?.tripLabel).toBe("Jul 29 – Aug 2");
  });

  it("defaults the end date to the start date when lastDayDate is omitted", () => {
    const info = buildHolidayInfo(holidays, "Jul 8", null, 2026);
    expect(info?.tripLabel).toBe("Jul 8–8");
    expect(info?.during.map((h) => h.date)).toEqual(["2026-07-08"]);
  });

  it("ignores malformed entries in the holiday list instead of throwing", () => {
    const dirty = [...holidays, null, {}, { date: 12345 }] as any;
    expect(() => buildHolidayInfo(dirty, "Jul 8", "Jul 15", 2026)).not.toThrow();
  });
});
