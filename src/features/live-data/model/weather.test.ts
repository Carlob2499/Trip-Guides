import { describe, it, expect } from "vitest";
import { wxIcon, wxDayOk, wxValidate, weatherWindow, type Daily } from "./weather";
import { tripWindow } from "../../../lib/trip-dates";
import SAMPLE from "../mocks/open-meteo.sample.json";

const daily = (n: number, over: Partial<Daily> = {}): Daily => ({
  time: Array.from({ length: n }, (_, i) => `2026-07-${String(8 + i).padStart(2, "0")}`),
  temperature_2m_max: Array.from({ length: n }, () => 30),
  temperature_2m_min: Array.from({ length: n }, () => 22),
  weathercode: Array.from({ length: n }, () => 1),
  ...over,
});

describe("wxIcon", () => {
  it("maps each WMO band to its symbol, and never emoji", () => {
    expect(wxIcon(0)).toBe("☀︎");
    expect(wxIcon(2)).toBe("⛅︎");
    expect(wxIcon(45)).toBe("☁︎");
    expect(wxIcon(61)).toBe("☂︎");
    expect(wxIcon(71)).toBe("❄︎");
    expect(wxIcon(95)).toBe("☈");
  });
  it("falls back for an unknown code instead of rendering blank", () => {
    expect(wxIcon(88)).toBe("⛅︎");
    expect(wxIcon(-1)).toBe("⛅︎");
  });
});

describe("wxDayOk", () => {
  it("accepts real temperatures", () => {
    expect(wxDayOk(daily(1), 0)).toBe(true);
  });
  it("rejects a Fahrenheit payload — the unit error the band exists to catch", () => {
    // 86F/72F served as Celsius is survivable; 200 is not. Catch the impossible one.
    expect(wxDayOk(daily(1, { temperature_2m_max: [200] }), 0)).toBe(false);
    expect(wxDayOk(daily(1, { temperature_2m_min: [-100] }), 0)).toBe(false);
  });
  it("rejects nulls and non-numbers rather than rendering them", () => {
    expect(wxDayOk(daily(1, { temperature_2m_max: [null as any] }), 0)).toBe(false);
    expect(wxDayOk(daily(1, { weathercode: [null as any] }), 0)).toBe(false);
    expect(wxDayOk(daily(1, { temperature_2m_max: ["30" as any] }), 0)).toBe(false);
  });
  it("is inclusive at the physical bounds", () => {
    expect(wxDayOk(daily(1, { temperature_2m_max: [60], temperature_2m_min: [-90] }), 0)).toBe(true);
    expect(wxDayOk(daily(1, { temperature_2m_max: [60.1] }), 0)).toBe(false);
  });
});

describe("wxValidate", () => {
  it("accepts the real Open-Meteo sample", () => {
    const d = wxValidate(SAMPLE)!;
    expect(d).not.toBeNull();
    expect(d.time.length).toBe(SAMPLE.daily.time.length);
  });

  it("TRIMS trailing incomplete days instead of throwing the forecast away", () => {
    // Open-Meteo returns nulls at the 16-day edge while its model refreshes. Rejecting the
    // whole response would hide 14 good days over 2 bad ones.
    const d = daily(16);
    d.temperature_2m_max[15] = null as any;
    d.temperature_2m_max[14] = null as any;
    const out = wxValidate({ daily: d })!;
    expect(out.time.length).toBe(14);
    expect(out.temperature_2m_max.length).toBe(14);
    expect(out.weathercode.length).toBe(14);
  });

  it("HARD-fails on a bad value in the middle — that's an anomaly, not an edge artifact", () => {
    const d = daily(16);
    d.temperature_2m_max[5] = 999 as any;
    expect(wxValidate({ daily: d })).toBeNull();
  });

  it("rejects mismatched array lengths — the shape that would index past the end", () => {
    expect(wxValidate({ daily: { ...daily(5), weathercode: [1, 2] } })).toBeNull();
    expect(wxValidate({ daily: { ...daily(5), temperature_2m_min: [] } })).toBeNull();
  });

  it("rejects absent/empty/garbage payloads", () => {
    expect(wxValidate(null)).toBeNull();
    expect(wxValidate({})).toBeNull();
    expect(wxValidate({ daily: {} })).toBeNull();
    expect(wxValidate({ daily: { ...daily(0), time: [] } })).toBeNull();
  });

  it("returns null when EVERY day is bad rather than an empty strip", () => {
    const d = daily(3, { temperature_2m_max: [null, null, null] as any });
    expect(wxValidate({ daily: d })).toBeNull();
  });
});

describe("weatherWindow", () => {
  const D = daily(16); // 2026-07-08 .. 2026-07-23

  it("upcoming trip: locates the start date inside the forecast", () => {
    const trip = tripWindow("Wed Jul 8", "Wed Jul 15", new Date(2026, 6, 6));
    const w = weatherWindow(D, trip)!;
    expect(w).toMatchObject({ startI: 0, count: 8, onTrip: true });
  });

  it("ongoing trip: shows the REMAINING days, not the original length", () => {
    // Day 3 of an 8-day trip → 6 days left, not 8. Showing 8 would be mostly history.
    const trip = tripWindow("Wed Jul 8", "Wed Jul 15", new Date(2026, 6, 10));
    const w = weatherWindow(D, trip)!;
    expect(w.startI).toBe(0);
    expect(w.count).toBe(6);
    expect(w.onTrip).toBe(true);
  });

  it("past trip → null (nothing to show)", () => {
    const trip = tripWindow("Wed Jul 8", "Wed Jul 15", new Date(2026, 6, 17));
    expect(weatherWindow(D, trip)).toBeNull();
  });

  it("trip beyond the forecast horizon → null, NOT a misleading nearby forecast", () => {
    const trip = tripWindow("Wed Sep 8", "Wed Sep 15", new Date(2026, 6, 1)); // ~69 days out
    expect(weatherWindow(D, trip)).toBeNull();
  });

  it("no trip dates → generic next-7 from today", () => {
    const trip = tripWindow("Day 1", "Day 9", new Date(2026, 6, 1));
    expect(weatherWindow(D, trip)).toEqual({ startI: 0, count: 7, onTrip: false });
  });

  it("never asks for more days than the forecast holds", () => {
    const short = daily(3);
    const trip = tripWindow("Wed Jul 8", "Wed Jul 15", new Date(2026, 6, 8));
    const w = weatherWindow(short, trip)!;
    expect(w.count).toBeLessThanOrEqual(short.time.length);
  });
});
