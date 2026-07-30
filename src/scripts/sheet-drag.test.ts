import { describe, it, expect } from "vitest";
// @ts-expect-error — plain-JS module, no type declarations by design
import { sheetDismiss, DRAG_LOCK, DISMISS_VELOCITY } from "./sheet-drag.js";

const H = 480; // a sheet 480px tall dismisses at 120px

describe("sheetDismiss", () => {
  it("dismisses on a long enough drag", () => {
    expect(sheetDismiss(120, 0, H)).toBe(true);
    expect(sheetDismiss(119, 0, H)).toBe(false);
  });

  it("dismisses on a short but fast downward flick", () => {
    expect(sheetDismiss(30, DISMISS_VELOCITY, H)).toBe(true);
    expect(sheetDismiss(30, DISMISS_VELOCITY - 0.01, H)).toBe(false);
  });

  it("ignores a tap or a jitter however fast it registers", () => {
    expect(sheetDismiss(DRAG_LOCK, 5, H)).toBe(false);
    expect(sheetDismiss(0, 5, H)).toBe(false);
  });

  it("never dismisses on an upward drag", () => {
    expect(sheetDismiss(-200, -5, H)).toBe(false);
  });

  it("falls back to velocity when the sheet has no measurable height", () => {
    expect(sheetDismiss(40, 1, 0)).toBe(true);
    expect(sheetDismiss(40, 0, 0)).toBe(false);
  });

  it("scales with the sheet — a short sheet dismisses sooner", () => {
    expect(sheetDismiss(60, 0, 200)).toBe(true);  // 25% of 200
    expect(sheetDismiss(60, 0, 800)).toBe(false); // 25% of 800 is 200
  });
});
