// R5 — THE authoritative active-generation resolver: one semantic for Progress, questions,
// events and answers routing. The matrix cases the hardening pass requires, behaviorally:
//   CASE A  stale completed V2 + active V1      → V1
//   CASE B  active V2 + stale/completed V1      → V2
//   CASE C  both genuinely active               → explicit conflict, never precedence
// plus the states around them (complete-draft, merged remnant/history, none).

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveActiveGeneration, isV2RunActive, isV2CompleteDraft, isV1RunActive, V2_ACTIVE_STATUSES,
} from "../../src/lib/run-generation.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

const v2 = (over = {}) => ({
  status: "running",
  landing: { outcome: "pending" },
  publication: { published: false },
  ...over,
});
const V1_ACTIVE = { stages: { scaffold: "2026-08-01T00:00:00Z", passA: null, passB: null, reconcile: null, verified: null } };
const V1_COMPLETE = { stages: { scaffold: "x", passA: "x", passB: "x", reconcile: "x", verified: "x" } };

describe("resolveActiveGeneration — the required matrix", () => {
  it("CASE A: a stale COMPLETE-but-unmerged V2 branch never outranks an active V1 rollback run", () => {
    const out = resolveActiveGeneration({
      v2Exists: true, v2State: v2({ status: "complete" }),
      v1Exists: true, v1State: V1_ACTIVE,
    });
    expect(out).toEqual({ decision: "v1-active", conflict: false });
  });

  it("CASE B: an active V2 run wins over a stale/completed V1 record", () => {
    const out = resolveActiveGeneration({
      v2Exists: true, v2State: v2({ status: "running" }),
      v1Exists: true, v1State: V1_COMPLETE,
    });
    expect(out).toEqual({ decision: "v2-active", conflict: false });
  });

  it("CASE C: both generations genuinely active is a CONFLICT — an explicit diagnostic, no precedence pick", () => {
    const out = resolveActiveGeneration({
      v2Exists: true, v2State: v2({ status: "running" }),
      v1Exists: true, v1State: V1_ACTIVE,
    });
    expect(out).toEqual({ decision: "conflict", conflict: true });
  });

  it("every non-terminal V2 status counts as active — failed and stuck runs still own their slug", () => {
    for (const status of V2_ACTIVE_STATUSES) {
      const out = resolveActiveGeneration({ v2Exists: true, v2State: v2({ status }), v1Exists: false, v1State: null });
      expect(out.decision, status).toBe("v2-active");
    }
  });

  it("a complete-but-unmerged V2 draft owns the slug when NOTHING else is active (late answers re-open it)", () => {
    const out = resolveActiveGeneration({ v2Exists: true, v2State: v2({ status: "complete" }), v1Exists: false, v1State: null });
    expect(out).toEqual({ decision: "v2-complete-draft", conflict: false });
  });

  it("a merged/published V2 branch remnant is HISTORY — it owns nothing active", () => {
    const merged = v2({ status: "complete", landing: { outcome: "merged" }, publication: { published: true } });
    const alone = resolveActiveGeneration({ v2Exists: true, v2State: merged, v1Exists: false, v1State: null });
    expect(alone).toEqual({ decision: "v2-history", conflict: false });
    // Beside an active V1 rollback, the rollback wins — the exact selector-rollback scenario.
    const withV1 = resolveActiveGeneration({ v2Exists: true, v2State: merged, v1Exists: true, v1State: V1_ACTIVE });
    expect(withV1).toEqual({ decision: "v1-active", conflict: false });
  });

  it("existence without a readable state is not activity; nothing anywhere is none", () => {
    expect(resolveActiveGeneration({ v2Exists: true, v2State: null, v1Exists: false, v1State: null }).decision).toBe("none");
    expect(resolveActiveGeneration({}).decision).toBe("none");
  });

  it("the predicates are defensive against raw fetched JSON", () => {
    expect(isV2RunActive(null)).toBe(false);
    expect(isV2RunActive({ status: 42 })).toBe(false);
    expect(isV2CompleteDraft({ status: "complete" })).toBe(true); // absent landing/publication = unmerged draft
    expect(isV1RunActive({})).toBe(true); // a V1 state with no stages recorded owes everything
    expect(isV1RunActive(null)).toBe(false);
  });
});

describe("one resolver everywhere (wiring)", () => {
  it("answers routing consumes THE shared resolver, not a private precedence rule", () => {
    // The resolution body moved to questions.mjs's resolveAnswerRouting (Codex blocker 1) so
    // the real seam is behaviorally testable; the pin follows it there, and pins the CLI to
    // delegating rather than re-deriving.
    const q = readFileSync(path.join(ROOT, "scripts", "pipeline", "questions.mjs"), "utf8");
    expect(q).toContain('import("../../src/lib/run-generation.mjs")');
    expect(q).toContain("resolveActiveGeneration({");
    const src = readFileSync(path.join(ROOT, "scripts", "pipeline.mjs"), "utf8");
    const routeCase = src.split('case "answers-route"')[1].split('case "answers-apply"')[0];
    expect(routeCase).toContain("resolveAnswerRouting(slug");
    expect(routeCase).toContain("refusing to guess which run owns the answer");
    // The old inline predicates are gone — no subsystem-local activity definition survives.
    expect(routeCase).not.toContain("v2Incomplete");
    expect(routeCase).not.toContain("resolveActiveGeneration");
  });

  it("the Progress gateway consumes the same resolver for run state, questions AND events", () => {
    const gw = readFileSync(path.join(ROOT, "src", "features", "pipeline-progress", "gateway.ts"), "utf8");
    expect(gw).toContain('from "../../lib/run-generation.mjs"');
    expect(gw).toContain("resolveActiveGeneration({");
    for (const method of ["async fetchRun(slug)", "async fetchQuestions(slug)", "async fetchRunEvents(slug)"]) {
      const body = gw.split(method)[1].split("async ")[0];
      expect(body, method).toContain("generation(slug)");
    }
  });
});
