import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const railSource = readFileSync(
  fileURLToPath(new URL("../ui/rail.js", import.meta.url)),
  "utf8",
);

describe("traveler-first rail migration contract", () => {
  it("keeps the legacy rail working until GuideLayout emits primary markers", () => {
    expect(railSource).toContain('track.querySelectorAll(".grail-stop")');
    expect(railSource).toContain('data-primary="true"');
    expect(railSource).toContain("return marked.length ? marked");
  });

  it("removes secondary routes from primary progress geometry once markers exist", () => {
    expect(railSource).toContain('fill.style.width = "0%"');
    expect(railSource).toContain('.gtab-active[data-primary="true"]:not([hidden])');
  });
});
