import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { initRunV2, readRunStateV2, deriveLandIntent } from "../pipeline/v2/run-state.mjs";
import { retryEligibility, renderStopNotice } from "../pipeline/v2/recovery.mjs";

let intakeDir;
beforeEach(async () => { intakeDir = await mkdtemp(path.join(tmpdir(), "waypoint-v3-state-")); });
afterEach(async () => { await rm(intakeDir, { recursive: true, force: true }); });

describe("V3 run identity", () => {
  it("records the engine durably while reusing the proven state implementation", async () => {
    const state = await initRunV2("kumamoto", { intakeDir, engine: "v3" });
    expect(state.engine).toBe("v3");
    expect((await readRunStateV2("kumamoto", { intakeDir })).engine).toBe("v3");
  });

  it("refuses to resume a V3 run through a V2 control path", async () => {
    await initRunV2("kumamoto", { intakeDir, engine: "v3" });
    await expect(initRunV2("kumamoto", { intakeDir, engine: "v2" }))
      .rejects.toThrow(/belongs to engine "v3"/);
  });

  it("only trusted non-manual V3 provenance can mint automatic landing intent", () => {
    expect(deriveLandIntent({ eventName: "issues", onDefault: true, engine: "v3" })).toBe("auto");
    expect(deriveLandIntent({ eventName: "workflow_dispatch", onDefault: true, engine: "v3" })).toBe("pr");
  });

  it("surfaces V3-specific recovery guidance when a V3 run stops", async () => {
    const state = await initRunV2("kumamoto", { intakeDir, engine: "v3" });
    state.status = "failed";
    state.resume = { nextStage: "reconcile", action: "resume at reconcile" };
    state.stages.reconcile.status = "failed";
    state.stages.reconcile.attempts = 2;
    state.stages.reconcile.failure = { class: "usage-limit", detail: "window reset required" };

    const decision = retryEligibility(state, { stage: "reconcile", findings: ["partial output retained"] });
    const notice = renderStopNotice({ slug: "kumamoto", state, decision });

    expect(decision.recovery).toContain("research-pass-v3.yml");
    expect(notice.body).toContain("research-pass-v3.yml");
    expect(notice.actionsError).toContain("research-pass-v3.yml");
  });
});
