// AUTHORITY DOCS — the surfaces a future session TRUSTS must not silently regress to a
// pre-integration status. These tests pin current architectural truth, not one day's wording.
// A status test must evolve when evidence evolves; forcing a living tracker back to yesterday's
// state merely to keep CI green would make the test the source of misinformation.

// @protects-file The docs a future session treats as current cannot revert to a pre-integration or contradicted claim.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { AUTO_RETRYABLE_CLASSES } from "../pipeline/v2/recovery.mjs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");

const TRACKER = read("docs/pipeline v2/SEPTEMBER_TRACKER.md");
const CODEX_HANDOFF = read("docs/pipeline v2/CODEX_HANDOFF.md");
const PIPELINE = read("docs/reference/pipeline.md");
const RUN_STATE = read("scripts/pipeline/v2/run-state.mjs");

/** The status cell of a master-tracker row, by ID. */
function trackerStatus(id) {
  const row = TRACKER.split("\n").find((l) => l.startsWith(`| ${id} |`));
  expect(row, `tracker row ${id} is missing`).toBeTruthy();
  return row.split("|")[6].trim();
}

describe("R1 — the tracker states the CURRENT phase, and no shipped work reads as NOT STARTED", () => {
  it("the dashboard records accepted draft reliability evidence without claiming production cutover", () => {
    const dash = TRACKER.split("# Master tracker")[0];
    expect(dash).toMatch(/Canary #4/);
    expect(dash).toMatch(/reliability acceptance/i);
    expect(dash).toMatch(/#75/);
    expect(dash).toMatch(/#76/);
    expect(dash).toMatch(/253607a/);
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

  it("records draft product-path acceptance while keeping production cutover open", () => {
    expect(trackerStatus("I02")).toMatch(/DONE \/ YELLOW|DRAFT PRODUCT PATH GREEN/i);
    expect(trackerStatus("I02")).not.toMatch(/^DONE$/);
    expect(trackerStatus("I06")).toMatch(/HOLD|IN PROGRESS/i);
    expect(trackerStatus("R03")).toMatch(/DONE \/ YELLOW/i);
    expect(TRACKER).toMatch(/production cutover.*pending|production cutover.*not done/i);
  });

  it("the temporary reciprocal reviewer is retired rather than advertised as current architecture", () => {
    const dash = TRACKER.split("# Master tracker")[0];
    expect(dash).toMatch(/reciprocal reviewer.*RETIRED/i);
    expect(dash).not.toMatch(/review automation uses a job-level read-only-validation/i);
  });
});

describe("R2 — the original audit brief cannot be mistaken for an active work order", () => {
  it("carries a prominent historical/resolved status block before any instruction", () => {
    const head = CODEX_HANDOFF.slice(0, CODEX_HANDOFF.indexOf("## What you need to answer"));
    expect(head).toMatch(/HISTORICAL|NOT AN ACTIVE WORK ORDER/i);
    expect(head).toMatch(/RESOLVED/i);
    expect(head).toMatch(/built beside V1|build beside V1/i);
    expect(head).toMatch(/SEPTEMBER_TRACKER\.md/);
    expect(head).toMatch(/IMPLEMENTATION_STATE\.md/);
  });

  it("names the obsolete quota/telemetry assumptions so they cannot be acted on", () => {
    const head = CODEX_HANDOFF.slice(0, CODEX_HANDOFF.indexOf("## What you need to answer"));
    expect(head).toMatch(/quota/i);
    expect(head).toMatch(/telemetry/i);
  });
});

describe("R3 — the pipeline POLICY doc knows both research implementations", () => {
  it("names V1 and V2 during the cutover, with V1 as the rollback/default", () => {
    expect(PIPELINE).toMatch(/research-pass-v2\.yml/);
    expect(PIPELINE).toMatch(/WAYPOINT_RESEARCH_ENGINE/);
    expect(PIPELINE).toMatch(/rollback/i);
    expect(PIPELINE).toMatch(/landMode=pr/);
  });

  it("still asserts exactly TWO product lifecycles — implementations and retired tooling are not a third", () => {
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

describe("R5 — no doc or comment claims a retry policy the code refuses", () => {
  it("recordAutoRetry's comment no longer promises a usage-limit redispatch", () => {
    const comment = RUN_STATE.slice(0, RUN_STATE.indexOf("export async function recordAutoRetry"))
      .split("/**").pop();
    expect(comment).not.toMatch(/for a recognized usage\/capacity interruption/i);
    expect(comment).toMatch(/usage-limit/);
    expect(comment).toMatch(/NEVER auto-retryable|never auto-retryable/i);
  });

  it("and the executable policy agrees — the comment is not the authority", () => {
    expect([...AUTO_RETRYABLE_CLASSES].sort()).toEqual(["gate-failure", "void-run"]);
    expect(AUTO_RETRYABLE_CLASSES).not.toContain("usage-limit");
    expect(AUTO_RETRYABLE_CLASSES).not.toContain("cancelled");
    expect(AUTO_RETRYABLE_CLASSES).not.toContain("agent-failure");
  });
});

describe("R6 — the handoff states exactly what the accepted canary did and did not prove", () => {
  const HANDOFF = read("docs/handoff.md");

  it("records the accepted Uruguay draft canary rather than pretending the repair never ran", () => {
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

  it("states the reciprocal reviewer is retired, not a current lifecycle", () => {
    expect(HANDOFF).toMatch(/reciprocal Claude↔Codex reviewer automation.*RETIRED/i);
    expect(HANDOFF).toMatch(/not a Waypoint product lifecycle/i);
  });
});
