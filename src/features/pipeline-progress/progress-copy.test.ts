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
});
