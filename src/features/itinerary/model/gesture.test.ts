// @protects-file A swipe through a day is read as the traveller meant it, not as an accidental tap.

import { describe, expect, it } from "vitest";
import { resolveSwipe } from "./gesture";
import { SWIPE_NEXT, SWIPE_PREV } from "../mocks/seeds";

const swipe = (g: { dx: number; dy: number; dt: number }, cur: number, count: number) =>
  resolveSwipe(g.dx, g.dy, g.dt, cur, count);

describe("resolveSwipe (story mode's day deck)", () => {
  it("advances one day on a clear leftward swipe", () => {
    expect(swipe(SWIPE_NEXT, 3, 8)).toBe(4);
  });

  it("goes back one day on a clear rightward swipe", () => {
    expect(swipe(SWIPE_PREV, 3, 8)).toBe(2);
  });

  it("ignores a swipe too short to commit (|dx| < 72)", () => {
    expect(resolveSwipe(-71, 0, 200, 3, 8)).toBeNull();
    expect(resolveSwipe(-72, 0, 200, 3, 8)).toBe(4); // boundary is inclusive at 72
  });

  it("ignores a too-vertical swipe (|dy| > 46)", () => {
    expect(resolveSwipe(-120, 47, 200, 3, 8)).toBeNull();
    expect(resolveSwipe(-120, 46, 200, 3, 8)).toBe(4); // boundary inclusive at 46
  });

  it("ignores a too-slow swipe (dt > 650)", () => {
    expect(resolveSwipe(-120, 0, 651, 3, 8)).toBeNull();
    expect(resolveSwipe(-120, 0, 650, 3, 8)).toBe(4); // boundary inclusive at 650
  });

  it("never navigates from an unresolved position (cur < 0)", () => {
    expect(resolveSwipe(-120, 0, 200, -1, 8)).toBeNull();
  });

  it("does not run past the last or first day", () => {
    expect(resolveSwipe(-120, 0, 200, 7, 8)).toBeNull(); // next would be 8 (== count)
    expect(resolveSwipe(120, 0, 200, 0, 8)).toBeNull(); // prev would be -1
  });
});
