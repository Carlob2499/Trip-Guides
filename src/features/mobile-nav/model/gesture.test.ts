import { describe, expect, it } from "vitest";
import { axisLocked, resolveCommit, damp, atEdge, AXIS_LOCK_PX } from "./gesture";

const W = 390; // a 390px phone: commit distance is 117px

describe("axisLocked", () => {
  it("claims a clearly horizontal drag", () => {
    expect(axisLocked(-60, 8)).toBe(true);
  });
  it("refuses a diagonal — a stolen scroll is worse than a missed swipe", () => {
    expect(axisLocked(-60, 61)).toBe(false);
  });
  it("refuses anything shorter than the lock distance", () => {
    expect(axisLocked(-AXIS_LOCK_PX, 0)).toBe(false);
    expect(axisLocked(-(AXIS_LOCK_PX + 1), 0)).toBe(true);
  });
  it("refuses a pure vertical scroll", () => {
    expect(axisLocked(0, 200)).toBe(false);
  });
});

describe("resolveCommit", () => {
  it("advances one group on a long leftward drag", () => {
    expect(resolveCommit(-130, 0.1, W, 3, 11)).toBe(4);
  });
  it("goes back one group on a long rightward drag", () => {
    expect(resolveCommit(130, 0.1, W, 3, 11)).toBe(2);
  });
  it("springs back on a short, slow drag", () => {
    expect(resolveCommit(-60, 0.2, W, 3, 11)).toBeNull();
  });
  it("commits a short but fast flick", () => {
    expect(resolveCommit(-40, 0.9, W, 3, 11)).toBe(4);
  });
  it("does not let a fast jitter inside the axis lock commit", () => {
    expect(resolveCommit(-20, 3, W, 3, 11)).toBeNull();
  });
  it("honours the exact distance boundary (30% of width)", () => {
    expect(resolveCommit(-117, 0, W, 3, 11)).toBe(4);
    expect(resolveCommit(-116, 0, W, 3, 11)).toBeNull();
  });
  it("honours the exact velocity boundary (0.5 px/ms)", () => {
    expect(resolveCommit(-30, -0.5, W, 3, 11)).toBe(4);
    expect(resolveCommit(-30, -0.49, W, 3, 11)).toBeNull();
  });
  it("never navigates out of a tool panel (cur < 0)", () => {
    expect(resolveCommit(-200, 1, W, -1, 11)).toBeNull();
  });
  it("does not run past the last or first group", () => {
    expect(resolveCommit(-200, 1, W, 10, 11)).toBeNull();
    expect(resolveCommit(200, 1, W, 0, 11)).toBeNull();
  });
});

describe("atEdge", () => {
  it("is true only in the direction that runs out of groups", () => {
    expect(atEdge(-10, 10, 11)).toBe(true);
    expect(atEdge(10, 10, 11)).toBe(false);
    expect(atEdge(10, 0, 11)).toBe(true);
    expect(atEdge(-10, 0, 11)).toBe(false);
  });
  it("treats a tool panel as an edge in both directions", () => {
    expect(atEdge(-10, -1, 11)).toBe(true);
    expect(atEdge(10, -1, 11)).toBe(true);
  });
});

describe("damp", () => {
  it("tracks the finger nearly 1:1 inside the range", () => {
    expect(damp(100, false)).toBe(90);
  });
  it("rubber-bands at an end and never runs away", () => {
    expect(damp(100, true)).toBeCloseTo(28);
    expect(damp(1000, true)).toBe(56);
    expect(damp(-1000, true)).toBe(-56);
  });
  it("keeps the sign of the drag", () => {
    expect(damp(-100, false)).toBe(-90);
  });
});
