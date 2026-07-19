import { describe, it, expect } from "vitest";
import { solarTimesFor, daylightLeftLabel } from "./sun";

// Reference values from sunrise-sunset.org (USNO-derived, formatted=0/UTC) — fetched live
// during development, not recalled from training data:
//   Seoul (37.5665, 126.9780) 2026-07-09      → sunrise 2026-07-08T20:17:12Z, sunset 2026-07-09T10:57:25Z, solar noon 2026-07-09T03:37:18Z
//   Copenhagen (55.6761, 12.5683) 2026-06-10  → sunrise 2026-06-10T02:24:10Z, sunset 2026-06-10T19:54:13Z, solar noon 2026-06-10T11:09:12Z
const FIVE_MIN = 5 * 60 * 1000;

describe("solarTimesFor", () => {
  it("matches Seoul reference within 5 minutes", () => {
    const t = solarTimesFor(37.5665, 126.9780, new Date(Date.UTC(2026, 6, 9)));
    expect(Math.abs(t.sunrise!.getTime() - Date.parse("2026-07-08T20:17:12Z"))).toBeLessThan(FIVE_MIN);
    expect(Math.abs(t.sunset!.getTime() - Date.parse("2026-07-09T10:57:25Z"))).toBeLessThan(FIVE_MIN);
    expect(Math.abs(t.solarNoon.getTime() - Date.parse("2026-07-09T03:37:18Z"))).toBeLessThan(FIVE_MIN);
  });

  it("matches Copenhagen reference within 5 minutes", () => {
    const t = solarTimesFor(55.6761, 12.5683, new Date(Date.UTC(2026, 5, 10)));
    expect(Math.abs(t.sunrise!.getTime() - Date.parse("2026-06-10T02:24:10Z"))).toBeLessThan(FIVE_MIN);
    expect(Math.abs(t.sunset!.getTime() - Date.parse("2026-06-10T19:54:13Z"))).toBeLessThan(FIVE_MIN);
    expect(Math.abs(t.solarNoon.getTime() - Date.parse("2026-06-10T11:09:12Z"))).toBeLessThan(FIVE_MIN);
  });

  it("golden hour brackets sunrise/sunset symmetrically", () => {
    const t = solarTimesFor(37.5665, 126.9780, new Date(Date.UTC(2026, 6, 9)));
    expect(t.goldenHourMorningEnd!.getTime()).toBeGreaterThan(t.sunrise!.getTime());
    expect(t.goldenHourEveningStart!.getTime()).toBeLessThan(t.sunset!.getTime());
  });

  it("reports day length consistent with sunset - sunrise", () => {
    const t = solarTimesFor(37.5665, 126.9780, new Date(Date.UTC(2026, 6, 9)));
    const actualMin = Math.round((t.sunset!.getTime() - t.sunrise!.getTime()) / 60000);
    expect(Math.abs(t.dayLengthMin! - actualMin)).toBeLessThan(2);
  });

  it("flags midnight sun above the Arctic Circle in summer", () => {
    const t = solarTimesFor(78, 15, new Date(Date.UTC(2026, 5, 21))); // Svalbard, summer solstice
    expect(t.alwaysUp).toBe(true);
    expect(t.sunrise).toBeNull();
    expect(t.sunset).toBeNull();
    expect(t.dayLengthMin).toBe(1440);
  });

  it("flags polar night above the Arctic Circle in winter", () => {
    const t = solarTimesFor(78, 15, new Date(Date.UTC(2026, 11, 21))); // Svalbard, winter solstice
    expect(t.alwaysDown).toBe(true);
    expect(t.sunrise).toBeNull();
    expect(t.dayLengthMin).toBe(0);
  });
});

describe("daylightLeftLabel", () => {
  const t = solarTimesFor(37.5665, 126.9780, new Date(Date.UTC(2026, 6, 9)));

  it("counts down from now when mid-day", () => {
    const now = new Date(t.sunset!.getTime() - 90 * 60000); // 90 min before sunset
    expect(daylightLeftLabel(now, t)).toBe("1h 30m");
  });

  it("counts from sunrise when queried before dawn", () => {
    const beforeDawn = new Date(t.sunrise!.getTime() - 60 * 60000);
    const label = daylightLeftLabel(beforeDawn, t);
    const expectedMin = Math.round((t.sunset!.getTime() - t.sunrise!.getTime()) / 60000);
    expect(label).toBe(`${Math.floor(expectedMin / 60)}h ${expectedMin % 60}m`);
  });

  it("returns null after sunset", () => {
    const afterDusk = new Date(t.sunset!.getTime() + 5 * 60000);
    expect(daylightLeftLabel(afterDusk, t)).toBeNull();
  });
});
