import { describe, it, expect } from "vitest";
import { weekdayOf, formatClosedDays, fallsOnClosedDay, checkClosedDayConflicts } from "./closed-days.mjs";

describe("weekdayOf", () => {
  it("maps Date#getDay() to the schema's 3-letter codes", () => {
    // 2026-07-08 is a Wednesday (matches the Korea guide's own "Wed Jul 8" label).
    expect(weekdayOf(new Date(2026, 6, 8))).toBe("wed");
    expect(weekdayOf(new Date(2026, 6, 12))).toBe("sun");
  });
});

describe("formatClosedDays", () => {
  it("formats one day", () => {
    expect(formatClosedDays(["tue"])).toBe("Closed Tuesdays");
  });

  it("formats several days in order", () => {
    expect(formatClosedDays(["sun", "mon"])).toBe("Closed Sundays, Mondays");
  });

  it("returns null for absent/empty — honest blank, no row at all", () => {
    expect(formatClosedDays(undefined)).toBeNull();
    expect(formatClosedDays(null)).toBeNull();
    expect(formatClosedDays([])).toBeNull();
  });
});

describe("fallsOnClosedDay", () => {
  it("true when the weekday is in the list", () => {
    expect(fallsOnClosedDay("tue", ["mon", "tue"])).toBe(true);
  });
  it("false when it isn't, or the list is absent", () => {
    expect(fallsOnClosedDay("wed", ["mon", "tue"])).toBe(false);
    expect(fallsOnClosedDay("wed", undefined)).toBe(false);
  });
});

describe("checkClosedDayConflicts", () => {
  const visitables = [
    { name: "Gyeongbokgung Palace", closedDays: ["tue"] },
    { name: "Some Cafe", closedDays: null },
  ];

  it("flags a waypoint scheduled on its matched venue's closed day", () => {
    const warnings = checkClosedDayConflicts(
      [{ guideSlug: "korea", dayDate: "Tue Jul 7", weekday: "tue", waypointName: "Gyeongbokgung Palace" }],
      visitables,
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({ guideSlug: "korea", matchedName: "Gyeongbokgung Palace", weekday: "tue" });
  });

  it("matches case/whitespace-insensitively", () => {
    const warnings = checkClosedDayConflicts(
      [{ guideSlug: "korea", dayDate: "Tue Jul 7", weekday: "tue", waypointName: "  gyeongbokgung palace  " }],
      visitables,
    );
    expect(warnings).toHaveLength(1);
  });

  it("stays silent when the day doesn't fall on a closed day", () => {
    const warnings = checkClosedDayConflicts(
      [{ guideSlug: "korea", dayDate: "Wed Jul 8", weekday: "wed", waypointName: "Gyeongbokgung Palace" }],
      visitables,
    );
    expect(warnings).toHaveLength(0);
  });

  it("stays silent when the waypoint matches nothing, or matches an item with no closed_days", () => {
    const warnings = checkClosedDayConflicts(
      [
        { guideSlug: "korea", dayDate: "Tue Jul 7", weekday: "tue", waypointName: "Unlisted Spot" },
        { guideSlug: "korea", dayDate: "Tue Jul 7", weekday: "tue", waypointName: "Some Cafe" },
      ],
      visitables,
    );
    expect(warnings).toHaveLength(0);
  });
});
