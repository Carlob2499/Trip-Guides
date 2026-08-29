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
  ".claude/skills/waypoint-guide-author/SKILL.md": "c80ccb7b92f5a4a64af19f87d3cf798355ec1363",
  "prompts/research-passA-v2.md": "884aaf32d98def606bf3c244cb2a43b5a3e8106a",
  "prompts/research-passB-v2.md": "a3e25d2f91a823fc58eea6a92c8e155f359a9889",
  "prompts/research-reconcile-v2.md": "ae452b0b53b812148aa07ad58f87d77554ec5a50",
  "prompts/research-critic-v2.md": "bba771a4205dce9a35a7da877f898963604ee44d",
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
