import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const read = (file) => readFileSync(path.join(ROOT, file), "utf8");

describe("V3 is the single selected replacement route", () => {
  it("routes trusted /new intake to V3 and keeps V1 as the only fallback", () => {
    const text = read(".github/workflows/new-guide.yml");
    expect(text).toContain('if: vars.WAYPOINT_RESEARCH_ENGINE == \'v3\'');
    expect(text).toContain("uses: ./.github/workflows/research-pass-v3.yml");
    expect(text).toContain('if [ "$ENGINE" = "v3" ]; then');
    expect(text).toContain("gh workflow run research-pass.yml");
    expect(text).not.toContain("research-pass-v2.yml");
    expect(text).not.toContain("if: vars.WAYPOINT_RESEARCH_ENGINE == 'v2'");
  });

  it("runs the proven safety spine through the V3 compiler seam", () => {
    const workflow = read(".github/workflows/research-pass-v3.yml");
    const cli = read("scripts/pipeline-v3.mjs");
    expect(workflow).toContain("WAYPOINT_RESEARCH_ENGINE != 'v3'");
    expect(workflow).toContain("node scripts/pipeline-v3.mjs");
    expect(workflow).toContain("prompts/research-passA-v3.md");
    expect(workflow).toContain("prompts/research-passB-v3.md");
    expect(workflow).toContain("prompts/research-reconcile-v3.md");
    expect(workflow).toContain("prompts/research-critic-v3.md");
    expect(workflow).not.toContain('--land auto');
    expect(cli).toContain("compileStageArtifacts");
    expect(cli).toContain('cmd === "collect-stage"');
    expect(cli).toContain('runProvenControlPlane(cmd, get, has, { engine: "v3" })');
    expect(cli.indexOf('cmd === "collect-stage"')).toBeLessThan(cli.lastIndexOf("runProvenControlPlane(cmd, get, has"));
  });

  it("shares V2's fail-closed landing transaction without accepting cross-generation state", () => {
    const cli = read("scripts/pipeline.mjs");
    const landing = read("scripts/pipeline/landing.mjs");
    expect(cli).toContain('branch === `research-v3/${slug}`');
    expect(cli).toContain('expectedEngine = branch === `research-v3/${slug}` ? "v3" : "v2"');
    expect(landing).toContain('branch === `research-v3/${slug}`');
    expect(landing).toContain('expectedEngine = branch === `research-v3/${slug}` ? "v3" : "v2"');
    expect(landing).toContain('branch, gh, git: runGit');
  });

  it("lets the progress and answer surfaces see a V3 run as the current owner", () => {
    const gateway = read("src/features/pipeline-progress/gateway.ts");
    const questions = read("scripts/pipeline/questions.mjs");
    expect(gateway).toContain("research-v3/${slug}");
    expect(gateway).toContain('g.decision === "v3-active"');
    expect(questions).toContain("const v3 = inspect(`research-v3/${slug}`");
    expect(questions).toContain('`guides-intake/${slug}/run.v2.json`, "v3"');
    expect(gateway).toContain('generationEngineMatches(v3State, "v3")');
    expect(questions).toContain('resolved.decision === "v3-active"');
  });

  it("keeps the shared control-plane audit trail engine-aware for V3 runs", () => {
    const shared = read("scripts/pipeline-v2.mjs");
    const workspace = read("scripts/pipeline/v2/workspace.mjs");
    const landing = read("scripts/pipeline/landing.mjs");
    const truth = read("scripts/pipeline/v2/landing-truth.mjs");
    expect(shared).toContain("const pipelineLabel = (engine = \"v2\") => `pipeline-${engine}`");
    expect(shared).toContain("const researchLabel = (slug, engine = \"v2\") => `research-${engine}(${slug})`");
    expect(workspace).toContain("research-v2/research-v3");
    expect(landing).toContain("const researchTag = `research-${expectedEngine}(${slug})`");
    expect(truth).toContain("researchLabel(slug, durable.engine || \"v2\")");
  });

  it("makes the model-facing contract leaner without deleting factual safeguards", () => {
    const names = ["research-passA", "research-passB", "research-reconcile", "research-critic"];
    const v2 = names.map((name) => read(`prompts/${name}-v2.md`)).join("\n");
    const v3Prompts = names.map((name) => read(`prompts/${name}-v3.md`));
    const v3 = v3Prompts.join("\n");
    expect(Buffer.byteLength(v3)).toBeLessThan(Buffer.byteLength(v2) * 0.6);
    for (const prompt of v3Prompts) expect(prompt).toContain("{{contract}}");
    for (const safeguard of ["authoritative", "corroboration", "freshness", "search preview", "frozen intake"]) {
      expect(v3.toLowerCase()).toContain(safeguard);
    }
  });
});
