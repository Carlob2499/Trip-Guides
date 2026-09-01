import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const progressPage = readFileSync(
  fileURLToPath(new URL("../../pages/progress/index.astro", import.meta.url)),
  "utf8",
);

describe("Progress UI truthfulness", () => {
  it("does not invent a completion-time estimate that the backend does not report", () => {
    expect(progressPage).not.toMatch(/research takes\s+\d/i);
  });

  it("keeps traveler status primary and pipeline diagnostics explicitly secondary", () => {
    expect(progressPage).toContain('<h2 class="pg-card-head" id="pgRouteHead">Guide build</h2>');
    expect(progressPage).toContain('<details class="pg-diagnostics">');
    expect(progressPage).toContain("<span>Research details</span>");
    expect(progressPage).toContain("Sources being checked");
    expect(progressPage).toContain("Research decisions");
    expect(progressPage).toContain('<h2 class="pg-card-head" id="pgNugHead">Useful findings</h2>');
  });

  it("retains honest unavailable telemetry copy instead of manufacturing counts", () => {
    expect(progressPage).toContain('id="pgStatPages">—</dd>');
    expect(progressPage).toContain("This run doesn't report the pages it opens yet.");
    expect(progressPage).toContain("Counts arrive with the rest of the run's reporting.");
  });
});
