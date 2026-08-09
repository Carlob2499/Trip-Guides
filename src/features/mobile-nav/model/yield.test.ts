// @protects-file Reading down hides the chrome; any intent to go back brings it straight back.

import { describe, it, expect } from "vitest";
import { nextYield, initialYield, YIELD_AT, RETURN_AT, TOP_ZONE } from "./yield";

/** Feed a run of samples, all well below the top zone. */
const run = (dys: number[], y = 600, blocked = false) =>
  dys.reduce((s, dy) => nextYield(s, dy, y, blocked), initialYield());

describe("nextYield", () => {
  it("yields once downward travel passes the threshold", () => {
    expect(run([40, 41]).yielded).toBe(true);
    expect(run([40, 40]).yielded).toBe(false); // exactly 80 is not past 80
  });

  it("SURVIVES the scroll-anchor rebound that broke the first cut", () => {
    // Measured in preview: every settled scroll bounced back ~2px, and the old rule
    // ("any upward pixel resets") zeroed the accumulator on each one — the chrome
    // could never yield at all.
    expect(run([60, -2, 60, -2, 60]).yielded).toBe(true);
  });

  it("keeps a rebound from resetting the downward accumulator", () => {
    expect(run([60, -2]).down).toBe(60);
  });

  it("returns the chrome on a deliberate upward flick", () => {
    const s = run([100]);
    expect(s.yielded).toBe(true);
    expect(nextYield(s, -(RETURN_AT + 1), 600).yielded).toBe(false);
  });

  it("does not return the chrome on an upward nudge below the threshold", () => {
    const s = nextYield(run([100]), -12, 600);
    expect(s.yielded).toBe(true);
    expect(s.down).toBe(0); // but real upward intent has cancelled the run
  });

  it("accumulates upward movement across samples before returning", () => {
    let s = run([100]);
    s = nextYield(s, -10, 600);
    s = nextYield(s, -10, 600);
    expect(s.yielded).toBe(true); // 20 < RETURN_AT
    s = nextYield(s, -10, 600);
    expect(s.yielded).toBe(false); // 30 > RETURN_AT
  });

  it("never yields inside the top zone, whatever the travel", () => {
    expect(run([200], TOP_ZONE - 1).yielded).toBe(false);
  });

  it("stands down and resets while an overlay is open", () => {
    const s = run([100]);
    expect(nextYield(s, 100, 600, true)).toEqual({ down: 0, up: 0, yielded: false });
  });

  it("ignores sub-pixel noise entirely", () => {
    const s = run([100]);
    expect(nextYield(s, 0.4, 600)).toBe(s);
    expect(nextYield(s, -0.4, 600)).toBe(s);
  });

  it("re-yields after a return, without needing a fresh page load", () => {
    let s = run([100]);
    s = nextYield(s, -40, 600);
    expect(s.yielded).toBe(false);
    expect(nextYield(s, YIELD_AT + 1, 600).yielded).toBe(true);
  });
});
