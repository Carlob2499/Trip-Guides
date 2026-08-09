// @protects-file The day rail fits every day on screen when it can, and scrolls when it cannot.

import { describe, it, expect } from "vitest";
import { canScrub, dayFromX, SCRUB_MAX_DAYS } from "./scrub";

describe("canScrub", () => {
  it("is off for short trips — a 3-day rail is faster to tap than to scrub", () => {
    expect(canScrub(3)).toBe(false);
    expect(canScrub(4)).toBe(true);
  });
  it("is off past the fit limit, where chips fall under the minimum target size", () => {
    expect(canScrub(SCRUB_MAX_DAYS)).toBe(true);
    expect(canScrub(SCRUB_MAX_DAYS + 1)).toBe(false);
  });
  it("is off for a guide with no days at all", () => {
    expect(canScrub(0)).toBe(false);
  });
});

describe("dayFromX", () => {
  const L = 20, W = 320, N = 8; // a rail 20..340 holding 8 days, 40px each

  it("maps the left edge to the first day and the right edge to the last", () => {
    expect(dayFromX(L, L, W, N)).toBe(0);
    expect(dayFromX(L + W - 1, L, W, N)).toBe(7);
  });
  it("maps a mid-rail position to the day under it", () => {
    expect(dayFromX(L + 100, L, W, N)).toBe(2); // 100/40 = 2.5
    expect(dayFromX(L + 160, L, W, N)).toBe(4);
  });
  it("clamps past either end instead of running off", () => {
    expect(dayFromX(L - 500, L, W, N)).toBe(0);
    expect(dayFromX(L + W + 500, L, W, N)).toBe(7);
  });
  it("lands exactly on a boundary at the start of that day's band", () => {
    expect(dayFromX(L + 40, L, W, N)).toBe(1);
    expect(dayFromX(L + 39, L, W, N)).toBe(0);
  });
  it("returns 0 rather than NaN for a degenerate rail", () => {
    expect(dayFromX(50, 0, 0, 8)).toBe(0);
    expect(dayFromX(50, 0, 320, 0)).toBe(0);
  });
});
