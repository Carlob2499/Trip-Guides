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

    // Guard durable CURRENT state, not one canary's temporary wording.
    expect(output).toMatch(/Canary #4/);
    expect(output).toMatch(/Uruguay/i);
    expect(output).toMatch(/draft.*true|draft-only/i);
    expect(output).toMatch(/V1.*default|V1.*rollback/i);
    expect(output).toMatch(/WAYPOINT_RESEARCH_ENGINE|selector/i);
    expect(output).toMatch(/escalation/i);
    expect(output).toMatch(/cancellation/i);
    expect(output).toMatch(/unproven|did not exercise/i);
    expect(output).toMatch(/reciprocal Claude↔Codex reviewer automation.*remains active/i);
    expect(output).toMatch(/revision-4.*trust boundary/i);
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
