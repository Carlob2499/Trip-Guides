import { describe, expect, it } from "vitest";
import { resolveSwipe, swipeHint } from "./gesture";
import { SWIPE_NEXT, SWIPE_PREV } from "../mocks/seeds";

const swipe = (g: { dx: number; dy: number; dt: number }, cur: number, count: number) =>
  resolveSwipe(g.dx, g.dy, g.dt, cur, count);

describe("resolveSwipe", () => {
  it("advances one section on a clear leftward swipe", () => {
    expect(swipe(SWIPE_NEXT, 3, 11)).toBe(4);
  });

  it("goes back one section on a clear rightward swipe", () => {
    expect(swipe(SWIPE_PREV, 3, 11)).toBe(2);
  });

  it("ignores a swipe too short to commit (|dx| < 72)", () => {
    expect(resolveSwipe(-71, 0, 200, 3, 11)).toBeNull();
    expect(resolveSwipe(-72, 0, 200, 3, 11)).toBe(4); // boundary is inclusive at 72
  });

  it("ignores a too-vertical swipe (|dy| > 46)", () => {
    expect(resolveSwipe(-120, 47, 200, 3, 11)).toBeNull();
    expect(resolveSwipe(-120, 46, 200, 3, 11)).toBe(4); // boundary inclusive at 46
  });

  it("ignores a too-slow swipe (dt > 650)", () => {
    expect(resolveSwipe(-120, 0, 651, 3, 11)).toBeNull();
    expect(resolveSwipe(-120, 0, 650, 3, 11)).toBe(4); // boundary inclusive at 650
  });

  it("never navigates from a special panel (cur < 0)", () => {
    expect(resolveSwipe(-120, 0, 200, -1, 11)).toBeNull();
  });

  it("does not run past the last or first section", () => {
    expect(resolveSwipe(-120, 0, 200, 10, 11)).toBeNull(); // next would be 11 (== count)
    expect(resolveSwipe(120, 0, 200, 0, 11)).toBeNull(); // prev would be -1
  });
});

describe("swipeHint", () => {
  it("hints forward on a forming leftward drag, back on rightward", () => {
    expect(swipeHint(-40, 5)).toBe("fwd");
    expect(swipeHint(40, 5)).toBe("back");
  });

  it("fires earlier than the commit threshold (|dx| > 34, not 72)", () => {
    expect(swipeHint(-35, 0)).toBe("fwd");
    expect(swipeHint(-34, 0)).toBeNull(); // 34 is not > 34
  });

  it("stays silent while the drag is still mostly vertical", () => {
    expect(swipeHint(-60, 47)).toBeNull();
  });
});
