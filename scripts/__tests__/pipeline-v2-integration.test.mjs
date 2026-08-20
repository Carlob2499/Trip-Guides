// I01–I02 of Pipeline V2 integration week — the /new → V2 product connection:
//
//   · run.v2.json carries the intake ISSUE durably (I01): recorded once at init from /new's
//     dispatch, inherited by every resume/retry (which carry no issue input), never rewired;
//   · run.v2.json carries the LANDING INTENT durably (I02): "pr" (controlled/draft — canaries
//     and manual dispatches, can never publish) or "auto" (the accepted /new product path),
//     immutable for the run's life so a redispatch can neither strip nor grant publication;
//   · the landing decision is deterministic tested code (landingMode), never workflow inputs;
//   · a product landing's gate verdict + publication fact are recorded BEFORE the merge
//     (recordProductLanding) because an auto-merged landing deletes its branch — and the same
//     function FAILS CLOSED on an incomplete run, before any draft flag is touched;
//   · the workflows wire all of it: /new passes issue+land only in the V2 product dispatch,
//     retries deliberately pass neither (the durable record is the carrier), and the questions
//     job surfaces traveler assumptions from the run's own recorded issue.

// @protects-file A draft/test V2 run can never publish; a product V2 run publishes only complete and gated; issue context survives every resume.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  initRunV2, readRunStateV2, stageStart, stageComplete, landingMode, recordProductLanding,
  V2_RESEARCH_STAGES,
} from "../pipeline/v2/run-state.mjs";
import { ContractError } from "../pipeline/v2/contracts.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const readRepo = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const SLUG = "testland";

let intakeDir;
beforeEach(async () => { intakeDir = await mkdtemp(path.join(tmpdir(), "waypoint-integration-")); });
afterEach(async () => { await rm(intakeDir, { recursive: true, force: true }); });

async function completeAllStages(slug, dir) {
  for (const stage of V2_RESEARCH_STAGES) {
    await stageStart(slug, stage, { intakeDir: dir });
    await stageComplete(slug, stage, { intakeDir: dir });
  }
}

// ── durable issue context (I01) ──────────────────────────────────────────────

describe("run.v2.json carries the intake issue durably", () => {
  it("init records the issue; a resume WITHOUT one inherits it", async () => {
    const created = await initRunV2(SLUG, { intakeDir, issue: "84" });
    expect(created.issue).toBe("84");
    const resumed = await initRunV2(SLUG, { intakeDir }); // a retry dispatch passes nothing
    expect(resumed.issue).toBe("84");
    expect(resumed.runId).toBe(created.runId);
  });

  it("a manual run has no issue (null, honest) — and a later /new adoption can heal it", async () => {
    const created = await initRunV2(SLUG, { intakeDir });
    expect(created.issue).toBeNull();
    const healed = await initRunV2(SLUG, { intakeDir, issue: "91" });
    expect(healed.issue).toBe("91");
    expect((await readRunStateV2(SLUG, { intakeDir })).issue).toBe("91"); // durable, not in-memory
  });

  it("rewiring a run to a DIFFERENT issue is refused — an answer must never land on the wrong thread", async () => {
    await initRunV2(SLUG, { intakeDir, issue: "84" });
    await expect(initRunV2(SLUG, { intakeDir, issue: "99" })).rejects.toThrow(/#84/);
  });

  it("a non-numeric issue is refused by the schema itself", async () => {
    await expect(initRunV2(SLUG, { intakeDir, issue: "84; rm -rf /" })).rejects.toThrow(ContractError);
  });

  it("a pre-integration run.v2.json (no issue/landMode fields) still parses — defaults fill in", async () => {
    const created = await initRunV2(SLUG, { intakeDir });
    // Simulate the canary-era shape: strip the new fields from disk.
    const file = path.join(intakeDir, SLUG, "run.v2.json");
    const raw = JSON.parse(readFileSync(file, "utf8"));
    delete raw.issue;
    delete raw.landMode;
    const { writeFileSync } = await import("node:fs");
    writeFileSync(file, JSON.stringify(raw, null, 2) + "\n");
    const read = await readRunStateV2(SLUG, { intakeDir });
    expect(read.runId).toBe(created.runId);
    expect(read.issue).toBeNull();
    expect(read.landMode).toBe("pr"); // absent intent is DRAFT intent, never product
  });
});

// ── durable landing intent (I02) ─────────────────────────────────────────────

describe("run.v2.json landing intent is immutable per run", () => {
  it("defaults to pr — every manual/test dispatch is draft-only", async () => {
    expect((await initRunV2(SLUG, { intakeDir })).landMode).toBe("pr");
  });

  it("the /new product dispatch records auto", async () => {
    expect((await initRunV2(SLUG, { intakeDir, landMode: "auto" })).landMode).toBe("auto");
  });

  it("a redispatch cannot ESCALATE a draft run to product", async () => {
    await initRunV2(SLUG, { intakeDir });
    await expect(initRunV2(SLUG, { intakeDir, landMode: "auto" })).rejects.toThrow(/immutable/);
  });

  it("a redispatch cannot STRIP a product run to draft", async () => {
    await initRunV2(SLUG, { intakeDir, landMode: "auto" });
    await expect(initRunV2(SLUG, { intakeDir, landMode: "pr" })).rejects.toThrow(/immutable/);
  });

  it("a redispatch naming the SAME mode, or none, resumes normally", async () => {
    const created = await initRunV2(SLUG, { intakeDir, landMode: "auto" });
    expect((await initRunV2(SLUG, { intakeDir, landMode: "auto" })).runId).toBe(created.runId);
    expect((await initRunV2(SLUG, { intakeDir })).runId).toBe(created.runId);
  });
});

describe("landingMode — the deterministic landing decision", () => {
  it("pr while ANY stage is incomplete, whatever the intent — an unfinished run never merges", async () => {
    const state = await initRunV2(SLUG, { intakeDir, landMode: "auto" });
    expect(landingMode(state)).toBe("pr");
  });

  it("pr for a COMPLETE run whose intent is draft — canaries stay drafts forever", async () => {
    await initRunV2(SLUG, { intakeDir });
    await completeAllStages(SLUG, intakeDir);
    expect(landingMode(await readRunStateV2(SLUG, { intakeDir }))).toBe("pr");
  });

  it("auto ONLY for a complete run with recorded product intent", async () => {
    await initRunV2(SLUG, { intakeDir, landMode: "auto" });
    await completeAllStages(SLUG, intakeDir);
    expect(landingMode(await readRunStateV2(SLUG, { intakeDir }))).toBe("auto");
  });

  it("pr when there is no run at all", () => {
    expect(landingMode(null)).toBe("pr");
  });
});

describe("recordProductLanding — the pre-merge record, fail closed", () => {
  it("records gate PASS + published on a complete run; deployed-live stays honestly unknown", async () => {
    await initRunV2(SLUG, { intakeDir, landMode: "auto" });
    await completeAllStages(SLUG, intakeDir);
    const state = await recordProductLanding(SLUG, { intakeDir });
    expect(state.landingGate.status).toBe("passed");
    expect(state.publication.published).toBe(true);
    expect(state.publication.publishedAt).toBeTruthy();
    expect(state.publication.deployedLive).toBeNull(); // merged is NOT live — distinct facts
    expect(state.status).toBe("complete");
  });

  it("THROWS on an incomplete run and records nothing — the schema itself is the gate", async () => {
    await initRunV2(SLUG, { intakeDir, landMode: "auto" });
    await stageStart(SLUG, "scaffold", { intakeDir });
    await stageComplete(SLUG, "scaffold", { intakeDir });
    await expect(recordProductLanding(SLUG, { intakeDir })).rejects.toThrow(ContractError);
    const after = await readRunStateV2(SLUG, { intakeDir });
    expect(after.landingGate.status).toBe("pending"); // the failed write never reached disk
    expect(after.publication.published).toBe(false);
  });

  it("returns null for a slug with no V2 run — a V1 landing passes through untouched", async () => {
    expect(await recordProductLanding("korea", { intakeDir })).toBeNull();
  });
});

// ── the wiring: workflows and the land subcommand ────────────────────────────

describe("new-guide.yml — the /new dispatch (I01)", () => {
  const text = readRepo(".github/workflows/new-guide.yml");
  const dispatch = text.split("Auto-start the research pass")[1];

  it("the V2 product dispatch threads the intake issue AND product landing intent", () => {
    const v2 = dispatch.split('if [ "$ENGINE" = "v2" ]')[1].split("else")[0];
    expect(v2).toContain('-f issue="$ISSUE"');
    expect(v2).toContain("-f land=auto");
  });

  it("the V1 dispatch still threads the issue — V1 behavior preserved", () => {
    const v1 = dispatch.split("else")[1];
    expect(v1).toContain("research-pass.yml");
    expect(v1).toContain('-f issue="$ISSUE"');
  });
});

describe("research-pass-v2.yml — issue/land wiring (I01/I02)", () => {
  const text = readRepo(".github/workflows/research-pass-v2.yml");

  it("declares the issue and land inputs, blank-defaulted so a resume inherits the durable record", () => {
    expect(text).toMatch(/^ {6}issue:$/m);
    expect(text).toMatch(/^ {6}land:$/m);
  });

  it("init records them durably (--issue/--land through env, not expression splicing)", () => {
    const init = text.split("Init or resume the V2 run")[1].split("- name:")[0];
    expect(init).toContain('--issue "$ISSUE"');
    expect(init).toContain('--land "$LAND"');
    expect(init).toContain("ISSUE: ${{ inputs.issue }}");
    expect(init).toContain("LAND: ${{ inputs.land }}");
  });

  it("void-retry redispatches pass NEITHER issue nor land — the durable record is the carrier", () => {
    // Adding `-f land=` to a retry would strip a product run to draft (or worse, escalate);
    // adding `-f issue=` would race the healed record. Inheritance is the contract.
    const retries = [...text.matchAll(/gh workflow run research-pass-v2\.yml[^;]*?void_retry=true/gs)];
    expect(retries.length).toBeGreaterThanOrEqual(3);
    for (const [block] of retries) {
      expect(block).not.toContain("-f land");
      expect(block).not.toContain("-f issue");
    }
  });

  it("the questions job surfaces traveler assumptions from the run's OWN recorded issue, never gating", () => {
    const job = text.split(/^ {2}questions:$/m)[1];
    expect(job).toBeTruthy();
    expect(job).toContain("always()");
    expect(job).toContain("continue-on-error: true");
    expect(job).toContain("run.v2.json"); // the durable record, not this dispatch's inputs
    expect(job).toContain("pipeline.mjs questions");
  });
});

describe("pipeline.mjs land — the V2 pre-merge record is wired", () => {
  it("recordProductLanding runs before landBranch, inside the auto+passed path only", () => {
    const src = readRepo("scripts/pipeline.mjs");
    const landCase = src.split('case "land"')[1].split("case ")[0];
    const record = landCase.indexOf("recordProductLanding");
    const land = landCase.indexOf("landBranch({");
    expect(record).toBeGreaterThan(0);
    expect(land).toBeGreaterThan(record);
    // Guarded by the earned verdict: the record only happens when passed && auto.
    expect(landCase.indexOf("if (passed && auto)")).toBeLessThan(record);
  });
});
