import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initRunV2, runStatePath } from "../pipeline/v2/run-state.mjs";
import { RUN_SCHEMA } from "../pipeline/v2/contracts.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const WORKFLOW = readFileSync(path.join(ROOT, ".github", "workflows", "research-pass-v2.yml"), "utf8").replace(/\r\n?/g, "\n");

function job(name, next) {
  return WORKFLOW.split(new RegExp(`^ {2}${name}:$`, "m"))[1].split(new RegExp(`^ {2}${next}:$`, "m"))[0];
}

describe("Pipeline V2 role-based model/effort routing", () => {
  let dir;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "wp-v2-routing-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("routes researchers to Sonnet and judges to Opus, with Medium as the default", () => {
    const passA = job("passA", "passB");
    const passB = job("passB", "reconcile");
    const reconcile = job("reconcile", "geocode");
    const critic = job("critic", "land");

    expect(WORKFLOW).toMatch(/effort:\n\s+required: false\n\s+type: string\n\s+default: medium/);
    expect(WORKFLOW).toContain('default: medium');
    expect(WORKFLOW).not.toContain("inputs.effort || 'high'");

    expect(passA).toContain(`--model "\${{ inputs.model || 'claude-sonnet-5' }}"`);
    expect(passA).toContain(`WP_MODEL: \${{ inputs.model || 'claude-sonnet-5' }}`);
    expect(passA).toContain(`WP_EFFORT: \${{ inputs.effort || 'medium' }}`);

    expect(passB).toContain("--model claude-sonnet-5");
    expect(passB).toContain("WP_MODEL: claude-sonnet-5");
    expect(passB).toContain(`WP_EFFORT: \${{ inputs.effort || 'medium' }}`);

    for (const judge of [reconcile, critic]) {
      expect(judge).toContain(`--model "\${{ inputs.critic_model || 'claude-opus-5' }}"`);
      expect(judge).toContain(`WP_MODEL: \${{ inputs.critic_model || 'claude-opus-5' }}`);
      expect(judge).toContain(`WP_EFFORT: \${{ inputs.critic_effort || inputs.effort || 'medium' }}`);
    }
  });

  it("writes the fresh-run routing defaults durably", async () => {
    const state = await initRunV2("routing-defaults", {
      intakeDir: dir,
      now: "2026-09-01T06:30:00.000Z",
      landMode: "pr",
    });
    expect(state.schemaVersion).toBe(RUN_SCHEMA);
    expect(state.inputs).toEqual({
      section: "",
      model: "claude-sonnet-5",
      effort: "medium",
      criticModel: "claude-opus-5",
      criticEffort: null,
    });
  });

  it("resumes a historical 2.1 run that has no criticEffort field", async () => {
    const legacyInputs = {
      section: "",
      model: "claude-sonnet-5",
      effort: "high",
      criticModel: "claude-opus-5",
    };
    await initRunV2("legacy-routing", {
      intakeDir: dir,
      now: "2026-08-23T03:00:00.000Z",
      landMode: "pr",
      inputs: legacyInputs,
    });

    const file = runStatePath("legacy-routing", dir);
    const raw = JSON.parse(await readFile(file, "utf8"));
    raw.schemaVersion = "wp-run/2.1";
    delete raw.inputs.criticEffort;
    await writeFile(file, JSON.stringify(raw, null, 2) + "\n");

    const resumed = await initRunV2("legacy-routing", {
      intakeDir: dir,
      now: "2026-09-01T06:31:00.000Z",
      landMode: "pr",
      inputs: legacyInputs,
    });

    expect(resumed.runId).toBe(raw.runId);
    expect(resumed.inputs.criticEffort).toBeNull();
    expect(resumed.inputs.effort).toBe("high");
  });
});
