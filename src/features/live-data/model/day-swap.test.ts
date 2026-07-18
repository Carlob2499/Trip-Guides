// Weather day-swap advisory — the honesty rules are the spec: explicit env tags only,
// future days only, silent (null) whenever the data doesn't clearly support a swap.
import { describe, it, expect } from "vitest";
import { isWetCode, matchForecastIndex, daySwapAdvice } from "./day-swap";

const NOW = new Date("2026-07-20T09:00:00");
const daily = (codes: number[]) => ({
  // Jul 21..(21+n) 2026 — all future relative to NOW
  time: codes.map((_, i) => `2026-07-${String(21 + i).padStart(2, "0")}`),
  weathercode: codes,
});

describe("isWetCode", () => {
  it("classifies WMO precipitation bands", () => {
    for (const w of [51, 55, 61, 65, 67, 71, 77, 80, 82, 85, 95, 99]) expect(isWetCode(w)).toBe(true);
    for (const w of [0, 1, 2, 3, 45, 48]) expect(isWetCode(w)).toBe(false);
    expect(isWetCode(null)).toBe(false);
    expect(isWetCode(undefined)).toBe(false);
  });
});

describe("matchForecastIndex", () => {
  it("matches 'Mon D' labels to ISO forecast dates by month+day", () => {
    const d = daily([0, 0, 0]);
    expect(matchForecastIndex("Tue Jul 21", d.time)).toBe(0);
    expect(matchForecastIndex("Thu Jul 23", d.time)).toBe(2);
    expect(matchForecastIndex("Sat Aug 1", d.time)).toBe(-1); // outside window
    expect(matchForecastIndex("Day 3", d.time)).toBe(-1);     // scaffold label — no real date
  });
});

describe("daySwapAdvice", () => {
  it("suggests swapping a rainy outdoor day with the nearest dry indoor day", () => {
    const advice = daySwapAdvice(
      [
        { date: "Tue Jul 21", title: "Palace & gardens", env: "outdoor" },
        { date: "Wed Jul 22", title: "Museums", env: "indoor" },
      ],
      daily([63, 1]), // rain on the outdoor day, clear on the indoor day
      NOW
    );
    expect(advice?.rain.title).toBe("Palace & gardens");
    expect(advice?.dry.title).toBe("Museums");
  });

  it("stays silent without explicit env tags (no prose guessing)", () => {
    expect(daySwapAdvice(
      [{ date: "Tue Jul 21", title: "Palace" }, { date: "Wed Jul 22", title: "Museums" }],
      daily([63, 1]), NOW
    )).toBe(null);
  });

  it("stays silent when the indoor day is also wet, or no indoor day exists", () => {
    expect(daySwapAdvice(
      [
        { date: "Tue Jul 21", title: "Palace", env: "outdoor" },
        { date: "Wed Jul 22", title: "Museums", env: "indoor" },
      ],
      daily([63, 65]), NOW
    )).toBe(null);
    expect(daySwapAdvice(
      [{ date: "Tue Jul 21", title: "Palace", env: "outdoor" }],
      daily([63]), NOW
    )).toBe(null);
  });

  it("never advises rearranging past days", () => {
    const past = {
      time: ["2026-07-10", "2026-07-11"], // before NOW
      weathercode: [63, 1],
    };
    expect(daySwapAdvice(
      [
        { date: "Fri Jul 10", title: "Palace", env: "outdoor" },
        { date: "Sat Jul 11", title: "Museums", env: "indoor" },
      ],
      past, NOW
    )).toBe(null);
  });

  it("mixed days neither trigger nor receive a swap", () => {
    expect(daySwapAdvice(
      [
        { date: "Tue Jul 21", title: "Palace", env: "outdoor" },
        { date: "Wed Jul 22", title: "Wander", env: "mixed" },
      ],
      daily([63, 1]), NOW
    )).toBe(null);
  });

  it("picks the NEAREST dry indoor day when several qualify", () => {
    const advice = daySwapAdvice(
      [
        { date: "Wed Jul 22", title: "Museums A", env: "indoor" },
        { date: "Thu Jul 23", title: "Palace", env: "outdoor" },
        { date: "Fri Jul 24", title: "Museums B", env: "indoor" },
      ],
      daily([1, 1, 63, 1]), NOW // time starts Jul 21 → rain lands on Jul 23 (the Palace day)
    );
    // Jul 22 and Jul 24 are both 1 day from Jul 23; sort is stable so the earlier wins —
    // either neighbour is acceptable, but it must be one of them.
    expect(["Museums A", "Museums B"]).toContain(advice?.dry.title);
    expect(advice?.rain.title).toBe("Palace");
  });
});
