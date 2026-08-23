import { describe, expect, it } from "vitest";
import {
  RUN_NOTE_MAX, matchesRunNoteTarget, renderRunNoteComment, validateRunNoteRequest,
} from "../run-note.mjs";

const target = {
  slug: "uruguay",
  runId: "uruguay-20260823-9789de",
  issue: 77,
};

function run(overrides = {}) {
  return {
    schemaVersion: "wp-run/2.1",
    slug: target.slug,
    runId: target.runId,
    issue: target.issue,
    ...overrides,
  };
}

describe("run-note contract", () => {
  it("accepts a bounded note tied to a valid V2 run identity", () => {
    const result = validateRunNoteRequest({ ...target, note: "Please double-check the transit section." });
    expect(result).toEqual({
      ok: true,
      value: { ...target, note: "Please double-check the transit section." },
    });
  });

  it("rejects bad slugs, cross-run ids, issue ids and empty/oversized notes", () => {
    expect(validateRunNoteRequest({ ...target, slug: "../x", note: "x" }).ok).toBe(false);
    expect(validateRunNoteRequest({ ...target, runId: "korea-20260823-abc", note: "x" }).ok).toBe(false);
    expect(validateRunNoteRequest({ ...target, issue: 0, note: "x" }).ok).toBe(false);
    expect(validateRunNoteRequest({ ...target, note: "   " }).ok).toBe(false);
    expect(validateRunNoteRequest({ ...target, note: "x".repeat(RUN_NOTE_MAX + 1) }).ok).toBe(false);
  });

  it("matches only the exact durable V2 slug + runId + issue tuple", () => {
    expect(matchesRunNoteTarget(run(), target)).toBe(true);
    expect(matchesRunNoteTarget(run({ runId: "uruguay-20260823-new" }), target)).toBe(false);
    expect(matchesRunNoteTarget(run({ issue: 78 }), target)).toBe(false);
    expect(matchesRunNoteTarget(run({ slug: "korea" }), target)).toBe(false);
    expect(matchesRunNoteTarget(run({ schemaVersion: "wp-run/1.0" }), target)).toBe(false);
    expect(matchesRunNoteTarget(null, target)).toBe(false);
  });

  it("renders a deterministic, run-scoped issue comment without secrets", () => {
    const body = renderRunNoteComment({ ...target, note: "  Check the airport transfer.  " });
    expect(body).toContain(`<!-- waypoint-run-note:${target.runId} -->`);
    expect(body).toContain(`Run: \`${target.runId}\``);
    expect(body).toContain("guide: `uruguay`");
    expect(body).toContain("Check the airport transfer.");
    expect(body).not.toContain("X-Owner-Key");
  });
});
