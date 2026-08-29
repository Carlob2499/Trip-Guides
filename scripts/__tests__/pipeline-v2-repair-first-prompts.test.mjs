import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { renderFeedbackBlock } from "../pipeline/v2/feedback.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (relativePath) => readFileSync(path.join(ROOT, relativePath), "utf8");

const RESEARCH_PROMPTS = [
  "prompts/research-passA-v2.md",
  "prompts/research-passB-v2.md",
  "prompts/research-reconcile-v2.md",
  "prompts/research-critic-v2.md",
];

describe("post-Fukuoka repair-first model inputs", () => {
  it.each(RESEARCH_PROMPTS)("%s puts retained validator feedback before broad reading/research", (file) => {
    const prompt = read(file);
    const feedback = prompt.indexOf("{{feedback}}");
    const readFirst = prompt.indexOf("## Read first");
    expect(feedback).toBeGreaterThan(-1);
    expect(readFirst).toBeGreaterThan(-1);
    expect(feedback).toBeLessThan(readFirst);
    expect(prompt.match(/{{feedback}}/g)).toHaveLength(1);
    expect(prompt).toMatch(/REPAIR ATTEMPT/);
    expect(prompt).toMatch(/preserve/i);
  });

  it.each([
    "prompts/research-passA-v2.md",
    "prompts/research-passB-v2.md",
    "prompts/research-reconcile-v2.md",
  ])("%s makes search-preview repair an evidence action, not a relabel", (file) => {
    const prompt = read(file);
    expect(prompt).toMatch(/fetch\/read the true origin/i);
    expect(prompt).toMatch(/Never relabel a search preview merely to clear a gate/i);
  });

  it("keeps critic repair-first without widening its mechanical fetch authority", () => {
    const prompt = read("prompts/research-critic-v2.md");
    expect(prompt).toMatch(/mechanically allowlisted/i);
    expect(prompt).toMatch(/flag the exact drift\/source lead/i);
    expect(prompt).toMatch(/REPAIR DATA/i);
    expect(prompt).toContain("_guide.json.theme");
  });

  it("renders active feedback as a bounded repair contract rather than a fresh research invitation", () => {
    const block = renderFeedbackBlock([
      'objective claim "Bus stop renamed" cites an operator source with access "search-preview"',
    ]);
    expect(block).toMatch(/^REPAIR ATTEMPT/);
    expect(block).toMatch(/highest-priority completion criterion/);
    expect(block).toMatch(/do not restart broad discovery/i);
    expect(block).toMatch(/never fixed by relabeling/i);
    expect(block).toMatch(/fetch and read/i);
  });

  it("keeps a first attempt visibly distinct from repair mode", () => {
    expect(renderFeedbackBlock([])).toMatch(/^None — first attempt/);
  });

  it("states in the live contract capsule that blocked access is honest bookkeeping, not proof", () => {
    const capsule = read("scripts/pipeline/v2/contract-capsule.mjs");
    expect(capsule).toMatch(/blocked.*valid ACCESS BOOKKEEPING but is not/);
    expect(capsule).toMatch(/only .*fetched.*origin was actually read/);
    expect(capsule).toMatch(/never repair that defect by relabeling/);
  });
});
