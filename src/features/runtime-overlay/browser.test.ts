import { describe, expect, it } from "vitest";
import { matrixSummary } from "./browser";

describe("runtime surface projections", () => {
  it("never presents an incomplete route matrix as a complete journey total", () => {
    const summary = matrixSummary({
      authoredOrder: ["a", "b", "c"],
      transitions: [
        { fromId: "a", toId: "b", durationSeconds: 600, distanceMeters: 800, source: "provider" },
        { fromId: "b", toId: "c", durationSeconds: null, distanceMeters: 1200, source: "haversine" },
      ],
      suggestedOrder: null,
      estimatedSavingsSeconds: 0,
      applied: false,
    });

    expect(summary).toContain("Some live transitions are unavailable");
    expect(summary).not.toContain("10 min across");
  });

  it("labels a complete matrix as authored and unapplied", () => {
    const summary = matrixSummary({
      authoredOrder: ["a", "b"],
      transitions: [{ fromId: "a", toId: "b", durationSeconds: 600, distanceMeters: 800, source: "provider" }],
      suggestedOrder: null,
      estimatedSavingsSeconds: 0,
      applied: false,
    });

    expect(summary).toContain("10 min across the authored transitions");
    expect(summary).toContain("order unchanged");
  });
});
