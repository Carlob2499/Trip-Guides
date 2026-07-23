// Tests for the pure comment builder in scripts/append-run-report.mjs (W3 run ledger). The gh
// posting + file reads are impure; buildComment is the part that decides what evidence the
// skill-retro proposer later reads.

import { describe, it, expect } from "vitest";
import { buildComment } from "../append-run-report.mjs";

describe("buildComment (pure)", () => {
  it("includes workflow, slug, model, attempts, and run url", () => {
    const c = buildComment({
      workflow: "research-pass", slug: "portugal", model: "claude-sonnet-5",
      attempts: 2, runUrl: "https://example/run/1", date: "2026-07-23",
    });
    expect(c).toContain("research-pass");
    expect(c).toContain("`portugal`");
    expect(c).toContain("claude-sonnet-5");
    expect(c).toContain("attempts:** 2");
    expect(c).toContain("https://example/run/1");
    expect(c).toContain("2026-07-23");
  });

  it("omits the attempts line when there is no state file (attempts null)", () => {
    const c = buildComment({ workflow: "recert", slug: "korea", model: "claude-sonnet-5", attempts: null, date: "2026-07-23" });
    expect(c).not.toContain("attempts");
  });

  it("appends the agent's run-report note when present", () => {
    const c = buildComment({ workflow: "recert", slug: "korea", date: "2026-07-23", note: "## Run report\n- 6 searches; critic caught a stale fx rate" });
    expect(c).toContain("Run report");
    expect(c).toContain("critic caught a stale fx rate");
  });

  it("degrades gracefully with missing fields", () => {
    const c = buildComment({});
    expect(c).toContain("run"); // header falls back
    expect(typeof c).toBe("string");
  });
});
