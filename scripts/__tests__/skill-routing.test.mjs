import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { FULL_RESEARCH_REFERENCES, routeSkillTask } from "../skill-routing.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (relativePath) => readFileSync(path.join(ROOT, relativePath));
const gitBlobSha = (relativePath) => {
  const content = Buffer.from(read(relativePath).toString("utf8").replace(/\r\n?/g, "\n"));
  const header = Buffer.from(`blob ${content.byteLength}\0`);
  return createHash("sha1").update(Buffer.concat([header, content])).digest("hex");
};

// Fukuoka's exact prompt blobs remain historical evidence. The failed canary does not freeze
// those model inputs forever: its terminal MODEL / CONTENT verdict authorizes a deliberate new
// candidate. Pin the replacement here so later prompt drift is still impossible without an
// explicit review that updates this fence.
const FUKUOKA_HISTORICAL_PROMPT_BLOBS = {
  "prompts/research-passA-v2.md": "6c0dd96512473fd8172bfcf2760cf4f14fa7f6cb",
  "prompts/research-passB-v2.md": "9bf5e6a5d27cbf77442a086f75aa850e321142d0",
  "prompts/research-reconcile-v2.md": "69c720840117a85e2993ad718cee375560e38d37",
  "prompts/research-critic-v2.md": "47be1bf75b6032cf0ab96cde6c2759c6311d5017",
};

const CURRENT_VALIDATION_CANDIDATE_BLOBS = {
  ".claude/skills/waypoint-guide-author/SKILL.md": "afc146b7d02b15e32db40b426b503facd95e30f2",
  "prompts/research-passA-v2.md": "f78aa56a5af3192441917100c5156e101affa4bb",
  "prompts/research-passB-v2.md": "176a4fe662e3685ef1455db1df4d75cda46d8f98",
  "prompts/research-reconcile-v2.md": "b62e6638e474def26a7ab79c6ce7127014d59199",
  "prompts/research-critic-v2.md": "db868d35b3a21803ef26f00b31ae555f25cfe383",
};

describe("research model-input compatibility fence", () => {
  for (const [file, sha] of Object.entries(CURRENT_VALIDATION_CANDIDATE_BLOBS)) {
    it(`${file} remains the explicitly registered post-Fukuoka candidate`, () => {
      expect(gitBlobSha(file)).toBe(sha);
    });
  }

  for (const [file, historicalSha] of Object.entries(FUKUOKA_HISTORICAL_PROMPT_BLOBS)) {
    it(`${file} is deliberately different from the failed Fukuoka candidate`, () => {
      expect(gitBlobSha(file)).not.toBe(historicalSha);
    });
  }
});

describe("skill routing contract", () => {
  it.each(["headless-passA", "headless-passB", "headless-reconcile", "headless-critic"])(
    "%s keeps the full research stack for the registered acceptance candidate",
    (mode) => {
      const route = routeSkillTask(mode);
      expect(route.skill).toBe("waypoint-guide-author");
      expect(route.references).toEqual(FULL_RESEARCH_REFERENCES);
      expect(route.compatibilityFrozen).toBe(true);
    },
  );

  it("a narrow factual edit does not inherit the broad research stack", () => {
    const route = routeSkillTask("fact-edit");
    expect(route.references).toEqual(["references/verification-rules.md"]);
    expect(route.context).toContain("continuity-sweep");
    expect(route.references).not.toContain("references/image-sourcing.md");
    expect(route.references).not.toContain("references/research-depth.md");
  });

  it("image work loads the photo policy without loading research methodology", () => {
    const route = routeSkillTask("image");
    expect(route.references).toEqual(["references/image-sourcing.md"]);
    expect(route.references).not.toContain("references/research-efficiency.md");
  });

  it("recert keeps deeper research conditional rather than universal", () => {
    const route = routeSkillTask("recert");
    expect(route.references).toEqual(["references/verification-rules.md"]);
    expect(route.conditionalReferences).toContain("references/research-depth.md");
  });

  it("design/code work does not route through Guide Author", () => {
    const route = routeSkillTask("design-code");
    expect(route.skill).toBe("waypoint-design");
    expect(route.guideAuthor).toBe(false);
  });

  it("new-guide research retains unrestricted full-stack investigation", () => {
    const route = routeSkillTask("new-guide");
    expect(route.references).toEqual(FULL_RESEARCH_REFERENCES);
  });
});

describe("design skill boundary", () => {
  const claude = read(".claude/skills/waypoint-design/SKILL.md").toString("utf8");
  const agents = read(".agents/skills/waypoint-design/SKILL.md").toString("utf8");

  it("Claude and Codex carry the same design skill", () => {
    expect(agents).toBe(claude);
  });

  it("presentation-only work preserves facts instead of invoking research", () => {
    expect(claude).toMatch(/presentation-only/i);
    expect(claude).toMatch(/Preserve every\s+fact value verbatim/i);
  });

  it("fact creation or verification routes to Guide Author", () => {
    expect(claude).toMatch(/waypoint-guide-author/);
    expect(claude).toMatch(/creating, correcting, or verifying destination facts/i);
  });
});
