import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractWarmStart,
  WARM_START_BEGIN,
  WARM_START_END,
  WARM_START_MAX_BYTES,
} from "../handoff-head.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const handoff = readFileSync(path.join(ROOT, "docs/handoff.md"), "utf8");
const context = readFileSync(path.join(ROOT, "CONTEXT.md"), "utf8");

describe("bounded session warm start", () => {
  it("emits the current operational capsule within the hard byte budget", () => {
    const output = extractWarmStart(handoff);
    expect(output.length).toBeGreaterThan(0);
    expect(Buffer.byteLength(output, "utf8")).toBeLessThanOrEqual(WARM_START_MAX_BYTES);
    // The capsule must always carry the CURRENT safety state. These assert the standing
    // invariants rather than one moment's wording — the original three pinned the pre-merge
    // phrasing ("reliability-blocked", "do not start Canary #4 yet"), which went stale the hour
    // PR #75 merged and would have forced a false line back into the capsule to stay green.
    expect(output).toMatch(/Canary #4/);                 // where the risk currently sits
    expect(output).toMatch(/DO NOT resume Portugal/i);   // the evidence run stays untouched
    expect(output).toMatch(/V1 intact|keep V1/i);        // the rollback path
    expect(output).toMatch(/selector/i);                 // the V2 cutover switch's state
    // A capsule that has stopped naming the live risk is worse than none.
    expect(output).toMatch(/NEVER executed in a live Actions job|proven|has not started/i);
  });

  it("never auto-injects CONTEXT.md", () => {
    const output = extractWarmStart(handoff);
    expect(output).not.toBe(context);
    expect(output.length).toBeLessThan(context.length);
    expect(output).toContain("CONTEXT.md"); // pointer only, not the document body
  });

  it("is deterministic and idempotent across repeated SessionStart events", () => {
    expect(extractWarmStart(handoff)).toBe(extractWarmStart(handoff));
  });

  it("fails harmlessly when markers are missing or malformed", () => {
    expect(extractWarmStart("no capsule here")).toBe("");
    expect(extractWarmStart(`${WARM_START_END}\nwrong order\n${WARM_START_BEGIN}`)).toBe("");
  });

  it("refuses an oversized capsule instead of feeding a truncated pseudo-handoff", () => {
    const oversized = `${WARM_START_BEGIN}\n${"x".repeat(WARM_START_MAX_BYTES + 1)}\n${WARM_START_END}`;
    expect(extractWarmStart(oversized)).toBe("");
  });
});
