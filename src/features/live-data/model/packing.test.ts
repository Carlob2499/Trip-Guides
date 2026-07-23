import { describe, it, expect } from "vitest";
import { derivePackingList } from "./packing";
import type { Daily } from "./weather";

function daily(overrides: Partial<Daily> = {}): Daily {
  return {
    time: ["2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05"],
    temperature_2m_max: [30, 31, 29, 32],
    temperature_2m_min: [18, 19, 17, 20],
    weathercode: [0, 0, 0, 0],
    ...overrides,
  };
}

describe("derivePackingList", () => {
  it("returns null with no forecast or no slice", () => {
    expect(derivePackingList(null, { startI: 0, count: 4, onTrip: true }, 600)).toBeNull();
    expect(derivePackingList(daily(), null, 600)).toBeNull();
    expect(derivePackingList(daily(), { startI: 0, count: 0, onTrip: true }, 600)).toBeNull();
  });

  it("flags rain gear only when the slice actually has wet-code days", () => {
    const d = daily({ weathercode: [61, 0, 0, 63] }); // rain codes on day 0 and 3
    const result = derivePackingList(d, { startI: 0, count: 4, onTrip: true }, null);
    expect(result?.wetDays).toBe(2);
    expect(result?.items.some((i) => i.includes("Rain shell"))).toBe(true);
  });

  it("does not mention rain when every day is dry", () => {
    const result = derivePackingList(daily(), { startI: 0, count: 4, onTrip: true }, null);
    expect(result?.items.some((i) => i.includes("Rain"))).toBe(false);
  });

  it("flags layers only when the day/night spread crosses the threshold", () => {
    const wide = daily({ temperature_2m_max: [30, 30, 30, 30], temperature_2m_min: [10, 10, 10, 10] }); // 20°C spread
    const narrow = daily({ temperature_2m_max: [28, 29, 28, 29], temperature_2m_min: [24, 25, 24, 25] }); // 5°C spread
    expect(derivePackingList(wide, { startI: 0, count: 4, onTrip: true }, null)?.items.some((i) => i.includes("Layers"))).toBe(true);
    // narrow spread + dry + no daylight signal crosses no threshold at all — honest null.
    expect(derivePackingList(narrow, { startI: 0, count: 4, onTrip: true }, null)).toBeNull();
  });

  it("flags sun protection only when daylight is long, and never invents a UV figure", () => {
    const longDay = derivePackingList(daily({ temperature_2m_max: [28, 28, 28, 28], temperature_2m_min: [25, 25, 25, 25] }), { startI: 0, count: 4, onTrip: true }, 13 * 60);
    expect(longDay?.items.some((i) => i.includes("Sun protection") && i.includes("13h"))).toBe(true);
    expect(longDay?.items.some((i) => /UV/i.test(i))).toBe(false);

    const shortDay = derivePackingList(daily({ temperature_2m_max: [28, 28, 28, 28], temperature_2m_min: [25, 25, 25, 25] }), { startI: 0, count: 4, onTrip: true }, 9 * 60);
    expect(shortDay).toBeNull(); // dry, narrow spread, short days — nothing to flag
  });

  it("returns null (not an empty items array) when nothing crosses any threshold", () => {
    const mild = daily({ temperature_2m_max: [26, 27, 26, 27], temperature_2m_min: [22, 23, 22, 23], weathercode: [1, 2, 1, 2] });
    expect(derivePackingList(mild, { startI: 0, count: 4, onTrip: true }, null)).toBeNull();
  });

  it("only reads the slice window, ignoring forecast days outside it", () => {
    const d = daily({ weathercode: [95, 0, 0, 0] }); // stormy day is OUTSIDE the slice below
    const result = derivePackingList(d, { startI: 1, count: 3, onTrip: true }, null);
    expect(result?.wetDays).toBe(0);
  });
});
