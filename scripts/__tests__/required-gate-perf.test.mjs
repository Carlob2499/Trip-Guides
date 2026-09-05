import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const REQUIRED_GATE = readFileSync(path.join(ROOT, ".github", "workflows", "required-gate.yml"), "utf8");

describe("required-gate performance authority", () => {
  it("enforces the production performance budget before merge after the production build", () => {
    const build = REQUIRED_GATE.indexOf("- name: Production build");
    const perf = REQUIRED_GATE.indexOf("- name: Performance budget");
    expect(build).toBeGreaterThan(-1);
    expect(perf).toBeGreaterThan(build);
    expect(REQUIRED_GATE.slice(perf)).toMatch(/run:\s*npm run check:perf/);
  });
});
