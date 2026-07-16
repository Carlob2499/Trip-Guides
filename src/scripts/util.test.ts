import { describe, it, expect } from "vitest";
// @ts-expect-error — plain-JS module, no types needed for this test
import { todayInTz } from "./util.js";

// Fixed instants (injectable clock — never the real one).
// 2026-07-10T20:00:00Z = Jul 11 05:00 in Seoul (UTC+9), Jul 10 16:00 in New York.
const INSTANT = new Date("2026-07-10T20:00:00Z");

describe("todayInTz", () => {
  it("returns the DESTINATION calendar day, not the device/UTC day", () => {
    expect(todayInTz("Asia/Seoul", INSTANT)).toEqual({ y: 2026, m: 7, d: 11 });
    expect(todayInTz("America/New_York", INSTANT)).toEqual({ y: 2026, m: 7, d: 10 });
  });

  it("handles the year boundary across timezones", () => {
    const nye = new Date("2026-12-31T16:00:00Z"); // Jan 1 01:00 Seoul, Dec 31 11:00 NY
    expect(todayInTz("Asia/Seoul", nye)).toEqual({ y: 2027, m: 1, d: 1 });
    expect(todayInTz("America/New_York", nye)).toEqual({ y: 2026, m: 12, d: 31 });
  });

  it("returns null for a missing or invalid timezone (caller falls back)", () => {
    expect(todayInTz(null, INSTANT)).toBeNull();
    expect(todayInTz("", INSTANT)).toBeNull();
    expect(todayInTz("Not/AZone", INSTANT)).toBeNull();
  });
});
