// AUTHORITY DOCS — the surfaces a future session TRUSTS must not silently regress to a
// pre-integration status. These tests pin current architectural truth, not one day's wording.
// A status test must evolve when evidence evolves; forcing a living tracker back to yesterday's
// state merely to keep CI green would make the test the source of misinformation.

// @protects-file Current authority docs cannot regress to a pre-integration or contradicted claim.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { AUTO_RETRYABLE_CLASSES } from "../pipeline/v2/recovery.mjs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");

const TRACKER = read("docs/pipeline v2/SEPTEMBER_TRACKER.md");
const PIPELINE = read("docs/reference/pipeline.md");
const HANDOFF = read("docs/handoff.md");
const RUN_STATE = read("scripts/pipeline/v2/run-state.mjs");

/** The status cell of a master-tracker row, by ID. */
function trackerStatus(id) {
  const row = TRACKER.split("\n").find((line) => line.startsWith(`| ${id} |`));
  expect(row, `tracker row ${id} is missing`).toBeTruthy();
  return row.split("|")[6].trim();
}

describe("the tracker states the CURRENT delivery phase", () => {
  it("records accepted draft reliability evidence without claiming production cutover", () => {
    const dash = TRACKER.split("# Master tracker")[0];
    expect(dash).toMatch(/Canary #4/);
    expect(dash).toMatch(/draft product path GREEN/i);
    expect(dash).toMatch(/production cutover.*NOT DONE/i);
    expect(dash).not.toMatch(/Carlo's next action:.*Fable proof/i);
    expect(dash).not.toMatch(/2,566/);
  });

  it("integration work that shipped is no longer NOT STARTED", () => {
    for (const id of ["P13", "I01", "I03", "I04", "I05"]) {
      expect(trackerStatus(id), `${id} should record shipped work`).not.toMatch(/NOT STARTED/);
    }
  });

  it("keeps production cutover open", () => {
    expect(trackerStatus("I02")).toMatch(/DONE \/ YELLOW|DRAFT PRODUCT PATH GREEN/i);
    expect(trackerStatus("I02")).not.toMatch(/^DONE$/);
    expect(trackerStatus("I06")).toMatch(/HOLD|IN PROGRESS/i);
    expect(trackerStatus("R03")).toMatch(/DONE \/ YELLOW/i);
    expect(TRACKER).toMatch(/production cutover.*pending|production cutover.*not done/i);
  });
});

describe("the pipeline POLICY doc knows both research implementations", () => {
  it("names V1 and V2 during the cutover, with V1 as the rollback/default", () => {
    expect(PIPELINE).toMatch(/research-pass-v2\.yml/);
    expect(PIPELINE).toMatch(/WAYPOINT_RESEARCH_ENGINE/);
    expect(PIPELINE).toMatch(/rollback/i);
    expect(PIPELINE).toMatch(/landMode=pr/);
  });

  it("still asserts exactly two product lifecycles", () => {
    expect(PIPELINE).toMatch(/Two lifecycles, and nothing else/);
    expect(PIPELINE).toMatch(/two \*\*product\*\* lifecycles|exactly \*\*two\*\* product lifecycles|two PRODUCT lifecycles|exactly \*\*two\*\* product/i);
  });

  it("states V2's failure semantics as PR #75 left them", () => {
    const v2 = PIPELINE.slice(PIPELINE.indexOf("Two GENERATION implementations"));
    expect(v2).toMatch(/workflow-owned/i);
    expect(v2).toMatch(/never `agent-failure`|never .agent-failure./);
    expect(v2).toMatch(/gate-failure/);
    expect(v2).toMatch(/usage-limit/);
  });
});

describe("retry policy prose agrees with executable policy", () => {
  it("recordAutoRetry's comment no longer promises a usage-limit redispatch", () => {
    const comment = RUN_STATE.slice(0, RUN_STATE.indexOf("export async function recordAutoRetry"))
      .split("/**").pop();
    expect(comment).not.toMatch(/for a recognized usage\/capacity interruption/i);
    expect(comment).toMatch(/usage-limit/);
    expect(comment).toMatch(/NEVER auto-retryable|never auto-retryable/i);
  });

  it("the executable policy agrees", () => {
    expect([...AUTO_RETRYABLE_CLASSES].sort()).toEqual(["gate-failure", "void-run"]);
    expect(AUTO_RETRYABLE_CLASSES).not.toContain("usage-limit");
    expect(AUTO_RETRYABLE_CLASSES).not.toContain("cancelled");
    expect(AUTO_RETRYABLE_CLASSES).not.toContain("agent-failure");
  });
});

describe("the handoff states exactly what the accepted canary did and did not prove", () => {
  it("records the accepted Uruguay draft canary", () => {
    expect(HANDOFF).toMatch(/Uruguay/i);
    expect(HANDOFF).toMatch(/Canary #4/);
    expect(HANDOFF).toMatch(/GREEN/i);
    expect(HANDOFF).not.toMatch(/NEVER executed in a live Actions job/i);
    expect(HANDOFF).not.toMatch(/Nothing about it has run in GitHub Actions/i);
  });

  it("keeps the two unproven failure-only seams explicit", () => {
    expect(HANDOFF).toMatch(/escalation/i);
    expect(HANDOFF).toMatch(/cancellation/i);
    expect(HANDOFF).toMatch(/unproven|did not exercise/i);
  });

  it("does not advertise temporary cleanup/reviewer machinery as current architecture", () => {
    expect(HANDOFF).not.toMatch(/draft cleanup PR|cleanup\/grand-pass/i);
    expect(HANDOFF).not.toMatch(/reciprocal Claude↔Codex|codex-watcher/i);
  });
});
