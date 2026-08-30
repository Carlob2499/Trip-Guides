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
const REPO_MAP = read("docs/reference/repo-map.md");
const RUN_STATE = read("scripts/pipeline/v2/run-state.mjs");

/** The status cell of a master-tracker row, by ID. */
function trackerStatus(id) {
  const row = TRACKER.split("\n").find((line) => line.startsWith(`| ${id} |`));
  expect(row, `tracker row ${id} is missing`).toBeTruthy();
  return row.split("|")[6].trim();
}

describe("the tracker states the CURRENT delivery phase", () => {
  it("records V3 implementation without pretending cutover or acceptance already happened", () => {
    const dash = TRACKER.split("### Current evidence already recorded")[0];
    expect(dash).toMatch(/V3 deterministic replacement route is implemented and preflight-tested/i);
    expect(dash).toMatch(/V1 remains the production default\/rollback path/i);
    expect(dash).toMatch(/no model-backed V3 acceptance has been dispatched yet/i);
    expect(dash).toMatch(/production cutover.*NOT DONE|production cutover.*BLOCKED/i);
  });

  it("integration work that shipped is no longer NOT STARTED", () => {
    for (const id of ["P13", "I01", "I03", "I04", "I05"]) {
      expect(trackerStatus(id), `${id} should record shipped work`).not.toMatch(/NOT STARTED/);
    }
  });

  it("keeps V3 acceptance and V1 fallback open while recording accepted reliability history", () => {
    expect(trackerStatus("I02")).toMatch(/IN PROGRESS|MODEL ACCEPTANCE PENDING|DETERMINISTIC PATH GREEN/i);
    expect(trackerStatus("I02")).not.toMatch(/^DONE$/);
    expect(trackerStatus("I06")).toMatch(/HOLD|IN PROGRESS/i);
    expect(trackerStatus("R03")).toMatch(/^DONE$/i);
    expect(trackerStatus("A04")).toMatch(/NOT STARTED|PRE-FLIGHT READY/i);
    expect(TRACKER).toMatch(/production cutover.*pending|production cutover.*not done/i);
  });
});

describe("the pipeline POLICY doc knows the V1/V2/V3 research state", () => {
  it("names V1 rollback, V2 history, and V3 as the selected route", () => {
    expect(PIPELINE).toMatch(/research-pass-v3\.yml/);
    expect(PIPELINE).toMatch(/research-pass-v2\.yml/);
    expect(PIPELINE).toMatch(/WAYPOINT_RESEARCH_ENGINE/);
    expect(PIPELINE).toMatch(/rollback/i);
    expect(PIPELINE).toMatch(/landMode=pr/);
    expect(PIPELINE).toMatch(/V3 is the replacement route|single replacement route|trusted `\/new` routes to V3/i);
  });

  it("still asserts exactly two product lifecycles", () => {
    expect(PIPELINE).toMatch(/Two lifecycles, and nothing else/);
    expect(PIPELINE).toMatch(/two \*\*product\*\* lifecycles|exactly \*\*two\*\* product lifecycles|two PRODUCT lifecycles|exactly \*\*two\*\* product/i);
  });

  it("states V3's failure semantics and honest claim boundary", () => {
    expect(PIPELINE).toMatch(/What V3 can honestly claim/);
    expect(PIPELINE).toMatch(/55% smaller/i);
    expect(PIPELINE).toMatch(/gate-failure/);
    expect(PIPELINE).toMatch(/usage-limit/);
    expect(PIPELINE).toMatch(/No live V3 acceptance run exists yet/i);
  });
});

describe("the repo map matches the V3-forward route", () => {
  it("describes V3 as selected, V1 as rollback, and V2 as historical evidence", () => {
    expect(REPO_MAP).toMatch(/V3 selected \/ V1 rollback \/ V2 historical evidence/i);
    expect(REPO_MAP).toMatch(/research-pass-v3\.yml/);
    expect(REPO_MAP).toMatch(/single forward research route|only one is the forward route/i);
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

describe("the handoff states exactly what the accepted reliability evidence proves", () => {
  it("records the accepted Uruguay draft canary", () => {
    expect(HANDOFF).toMatch(/Uruguay/i);
    expect(HANDOFF).toMatch(/Canary #4/);
    expect(HANDOFF).toMatch(/GREEN/i);
    expect(HANDOFF).not.toMatch(/NEVER executed in a live Actions job/i);
    expect(HANDOFF).not.toMatch(/Nothing about it has run in GitHub Actions/i);
  });

  it("records the two failure-only seams as closed by targeted proofs", () => {
    expect(HANDOFF).toMatch(/escalation/i);
    expect(HANDOFF).toMatch(/cancellation/i);
    expect(HANDOFF).toMatch(/closed|proven|PASS/i);
    expect(HANDOFF).toMatch(/R03 escalation\/cancellation seams are proven/i);
  });

  it("keeps temporary cleanup status out while recording the durable reciprocal reviewer boundary and local green proof", () => {
    expect(HANDOFF).not.toMatch(/draft cleanup PR|cleanup\/grand-pass/i);
    expect(HANDOFF).toMatch(/reciprocal Claude↔Codex reviewer automation.*remains active/i);
    expect(HANDOFF).toMatch(/revision-4.*trust boundary/i);
    expect(HANDOFF).toMatch(/198\/198 passed/i);
  });
});
