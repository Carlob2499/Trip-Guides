// AUTHORITY DOCS — the surfaces a future session TRUSTS must not silently regress to a
// pre-integration status. Codex's release-readiness audit (PR #76, R1–R7) found the tracker two
// days and several phases stale, an obsolete audit brief still readable as an active work order,
// the pipeline POLICY doc describing a V1-only research lifecycle, and a code comment claiming a
// retry policy that PR #75 deliberately reversed. Every one of those passed the whole suite.
//
// These pins are deliberately COARSE — status vocabulary and the few claims that were actually
// wrong — not prose assertions. A doc must stay editable; it must not be able to quietly say
// "NOT STARTED" about work that shipped, or assert a policy the code contradicts.

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
  it("the dashboard names reliability acceptance and Canary #4, not the retired P13 blocker", () => {
    const dash = TRACKER.split("# Master tracker")[0];
    expect(dash).toMatch(/Canary #4/);
    expect(dash).toMatch(/reliability acceptance/i);
    expect(dash).toMatch(/#76/);                       // the current blocker
    expect(dash).not.toMatch(/Carlo's next action:.*Fable proof/i); // the retired next action
    expect(dash).not.toMatch(/2,566/);                 // the stale test count
  });

  it("integration work that shipped is no longer NOT STARTED", () => {
    for (const id of ["P13", "I01", "I03", "I04", "I05"]) {
      expect(trackerStatus(id), `${id} should record shipped work`).not.toMatch(/NOT STARTED/);
    }
  });

  it("but live acceptance is NOT claimed — I02 and the canary stay open, I06 stays held", () => {
    // The failure mode in the other direction: marking the product path done because the code
    // exists. Three RED canaries and a merged repair are not an acceptance.
    expect(trackerStatus("I02")).toMatch(/IN PROGRESS|PENDING/i);
    expect(trackerStatus("I02")).not.toMatch(/^DONE$/);
    expect(trackerStatus("I06")).toMatch(/HOLD|SATISFIED TO DATE/i);
    expect(trackerStatus("R03")).toMatch(/NOT STARTED/); // fresh Canary #4
  });

  it("the reliability pass is recorded as the current work", () => {
    expect(trackerStatus("R01")).toMatch(/DONE/);        // #75 merged
    expect(TRACKER).toMatch(/253607a/);                  // the merged head
  });
});

describe("R2 — the original audit brief cannot be mistaken for an active work order", () => {
  it("carries a prominent historical/resolved status block before any instruction", () => {
    const head = CODEX_HANDOFF.slice(0, CODEX_HANDOFF.indexOf("## What you need to answer"));
    expect(head).toMatch(/HISTORICAL|NOT AN ACTIVE WORK ORDER/i);
    expect(head).toMatch(/RESOLVED/i);
    expect(head).toMatch(/built beside V1|build beside V1/i);
    // It must point at what IS current.
    expect(head).toMatch(/SEPTEMBER_TRACKER\.md/);
    expect(head).toMatch(/IMPLEMENTATION_STATE\.md/);
  });

  it("names the three claims that are now false, so they cannot be acted on", () => {
    const head = CODEX_HANDOFF.slice(0, CODEX_HANDOFF.indexOf("## What you need to answer"));
    expect(head).toMatch(/quota/i);      // numeric Pass-B quotas were removed (P06)
    expect(head).toMatch(/telemetry/i);  // telemetry does emit (I05)
  });
});

describe("R3 — the pipeline POLICY doc knows both research implementations", () => {
  it("names V1 and V2 during the cutover, with V1 as the rollback/default", () => {
    expect(PIPELINE).toMatch(/research-pass-v2\.yml/);
    expect(PIPELINE).toMatch(/WAYPOINT_RESEARCH_ENGINE/);
    expect(PIPELINE).toMatch(/rollback/i);
    expect(PIPELINE).toMatch(/landMode=pr/);
  });

  it("still asserts exactly TWO product lifecycles — the implementations are not a third", () => {
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
    // Read the real exported value, not the source text: the comment must answer to the code.
    expect([...AUTO_RETRYABLE_CLASSES].sort()).toEqual(["gate-failure", "void-run"]);
    expect(AUTO_RETRYABLE_CLASSES).not.toContain("usage-limit");
    expect(AUTO_RETRYABLE_CLASSES).not.toContain("cancelled");
    expect(AUTO_RETRYABLE_CLASSES).not.toContain("agent-failure");
  });
});

describe("R6 — the handoff's unproven-runtime claim is literally true", () => {
  const HANDOFF = read("docs/handoff.md");

  it("does not claim the repair never ran in Actions — PR CI did", () => {
    expect(HANDOFF).not.toMatch(/NEVER executed in a live Actions job/i);
    expect(HANDOFF).not.toMatch(/Nothing about it has run in GitHub Actions/i);
  });

  it("makes the narrower, true claim: no live V2 research canary has exercised it", () => {
    expect(HANDOFF).toMatch(/research canary/i);
    expect(HANDOFF).toMatch(/Canary #4/);
  });
});
