import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { classifyChangedPaths } from "../classify-required-gate.mjs";

const readWorkflow = (name) => readFileSync(new URL(`../../.github/workflows/${name}`, import.meta.url), "utf8");
const workflow = readWorkflow("required-gate.yml");

describe("required gate path classification", () => {
  test("Markdown-only changes stay on the cheap invariant path", () => {
    expect(classifyChangedPaths(["README.md", "docs/handoff.md"])).toEqual({ full: false, a11y: false });
  });

  test("intake and learnings data do not trigger code/browser gates", () => {
    expect(classifyChangedPaths(["guides-intake/demo/run.json", "learnings/demo.json"])).toEqual({ full: false, a11y: false });
  });

  test("non-Markdown docs code is lint/typecheck relevant but not browser relevant", () => {
    expect(classifyChangedPaths(["docs/mockups/prototype.mjs"])).toEqual({ full: true, a11y: false });
  });

  test("product or workflow code runs both full and browser gates", () => {
    expect(classifyChangedPaths(["src/pages/index.astro"])).toEqual({ full: true, a11y: true });
    expect(classifyChangedPaths([".github/workflows/new-guide.yml"])).toEqual({ full: true, a11y: true });
  });

  test("mixed changes fail closed to the strongest applicable scope", () => {
    expect(classifyChangedPaths(["docs/handoff.md", "src/lib/foo.ts"])).toEqual({ full: true, a11y: true });
  });
});

describe("required gate workflow contract", () => {
  test("always reports for pull requests and can be dispatched on automation-created branches", () => {
    expect(workflow).toMatch(/\n {2}pull_request:\n/);
    expect(workflow).toMatch(/\n {2}workflow_dispatch:\n/);
    expect(workflow).not.toMatch(/^\s+paths(?:-ignore)?:/m);
  });

  test("is the sole repository PR test/a11y/invariant workflow", () => {
    for (const name of ["test.yml", "a11y.yml", "project-invariants.yml"]) {
      expect(readWorkflow(name), `${name} must not duplicate Required gate on pull_request`).not.toMatch(/\n {2}pull_request:/);
    }
    expect(readWorkflow("a11y.yml")).toMatch(/\n {2}push:\n/);
  });

  test("uses trusted pinned actions and the repository's existing merge evidence", () => {
    expect(workflow).toContain("actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1");
    expect(workflow).toContain("actions/setup-node@820762786026740c76f36085b0efc47a31fe5020");
    expect(workflow).toContain("actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9");
    expect(workflow).toContain("node scripts/check-project-invariants.mjs");
    expect(workflow).toContain("npm run coverage");
    expect(workflow).toContain("npm run build");
    expect(workflow).toContain("tests/visual/a11y.spec.ts tests/visual/resilience.spec.ts tests/visual/offline-sync.spec.ts");
  });
});
