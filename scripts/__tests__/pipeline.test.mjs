// Tests for the pipeline checkpoint spine (scripts/pipeline.mjs) — the resumability primitive.
// Pure helpers (nextStage/statusLines) are tested without the filesystem; the stateful helpers
// (initState/checkpoint/readState) use a throwaway slug and clean it up.

import { describe, it, expect, afterAll } from "vitest";
import { existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import {
  STAGE_ORDER, initState, checkpoint, readState, nextStage, statusLines, statePath,
  bumpAttempt, statusJson,
} from "../pipeline.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");

const SLUG = "zz-pipeline-test"; // sorts last, never a real guide
afterAll(() => { if (existsSync(statePath(SLUG))) rmSync(statePath(SLUG)); });

describe("nextStage (pure)", () => {
  it("no state → the first stage", () => {
    expect(nextStage(null)).toBe("scaffold");
  });
  it("scaffold cleared → passA", () => {
    expect(nextStage({ stages: { scaffold: "t", passA: null, passB: null, reconcile: null, verified: null } })).toBe("passA");
  });
  it("all cleared → null (done)", () => {
    const all = Object.fromEntries(STAGE_ORDER.map((s) => [s, "t"]));
    expect(nextStage({ stages: all })).toBe(null);
  });
  it("respects order even with a later stage set out of sequence", () => {
    expect(nextStage({ stages: { scaffold: "t", passA: null, passB: "t", reconcile: null, verified: null } })).toBe("passA");
  });
});

describe("statusLines (pure)", () => {
  it("no state → a scaffold-it-first hint", () => {
    expect(statusLines(SLUG, null).join("\n")).toMatch(/no state file yet/);
  });
  it("in-progress → checklist + a NEXT action", () => {
    const out = statusLines(SLUG, { updatedAt: "2026-01-01T00:00:00Z", stages: { scaffold: "2026-01-01T00:00:00Z", passA: null, passB: null, reconcile: null, verified: null } }).join("\n");
    expect(out).toMatch(/IN PROGRESS/);
    expect(out).toMatch(/NEXT \(passA\)/);
  });
  it("all cleared → ready for graduation", () => {
    const all = Object.fromEntries(STAGE_ORDER.map((s) => [s, "2026-01-01T00:00:00Z"]));
    expect(statusLines(SLUG, { updatedAt: "2026-01-01T00:00:00Z", stages: all }).join("\n")).toMatch(/READY for human graduation/);
  });
});

describe("initState + checkpoint + readState (filesystem)", () => {
  it("initState clears scaffold and nothing else", async () => {
    const s = await initState(SLUG, { force: true });
    expect(s.stages.scaffold).toBeTruthy();
    expect(s.stages.passA).toBe(null);
    expect(nextStage(s)).toBe("passA");
  });

  it("initState is idempotent — never wipes progress", async () => {
    await initState(SLUG, { force: true });
    await checkpoint(SLUG, "passA");
    const again = await initState(SLUG); // no force
    expect(again.stages.passA).toBeTruthy(); // progress preserved
  });

  it("checkpoint advances the next stage and persists", async () => {
    await initState(SLUG, { force: true });
    await checkpoint(SLUG, "passA");
    await checkpoint(SLUG, "passB", { note: "off-peak windows found" });
    const s = await readState(SLUG);
    expect(nextStage(s)).toBe("reconcile");
    expect(s.notes.find((n) => n.stage === "passB")?.note).toBe("off-peak windows found");
  });

  it("checkpoint is idempotent (re-clearing a stage doesn't error)", async () => {
    await initState(SLUG, { force: true });
    await checkpoint(SLUG, "passA");
    await expect(checkpoint(SLUG, "passA")).resolves.toBeTruthy();
  });

  it("an unknown stage is rejected", async () => {
    await expect(checkpoint(SLUG, "bogus")).rejects.toThrow(/unknown stage/);
  });

  it("full run reaches done", async () => {
    await initState(SLUG, { force: true });
    for (const stage of ["passA", "passB", "reconcile", "verified"]) await checkpoint(SLUG, stage);
    expect(nextStage(await readState(SLUG))).toBe(null);
  });
});

describe("bumpAttempt (circuit breaker)", () => {
  it("starts a fresh guide at attempt 1", async () => {
    await initState(SLUG, { force: true });
    const state = await bumpAttempt(SLUG);
    expect(state.attempts).toBe(1);
  });

  it("increments on every call and persists", async () => {
    await initState(SLUG, { force: true });
    await bumpAttempt(SLUG);
    await bumpAttempt(SLUG);
    const s = await bumpAttempt(SLUG);
    expect(s.attempts).toBe(3);
    expect((await readState(SLUG)).attempts).toBe(3);
  });

  it("self-heals when called with no prior state at all", async () => {
    rmSync(statePath(SLUG), { force: true });
    const s = await bumpAttempt(SLUG);
    expect(s.attempts).toBe(1);
    expect(nextStage(s)).toBe("scaffold"); // no stages cleared — bumpAttempt never fakes scaffold
  });
});

describe("CLI slug guard (S4 — path traversal)", () => {
  it("--slug ../../x exits non-zero and writes nothing outside guides-intake", () => {
    const traversalTarget = path.resolve(ROOT, "..", "..", "x.state.json");
    expect(() => {
      execFileSync("node", [path.join(ROOT, "scripts/pipeline.mjs"), "--slug", "../../x", "--status"], {
        cwd: ROOT,
        stdio: "pipe",
      });
    }).toThrow();
    expect(existsSync(traversalTarget)).toBe(false);
  });
});

describe("statusJson (machine-readable)", () => {
  it("no state → nextStage scaffold, exists false, attempts 0", () => {
    expect(statusJson(SLUG, null)).toEqual({ slug: SLUG, exists: false, nextStage: "scaffold", attempts: 0, updatedAt: null });
  });

  it("in-progress state → the correct nextStage and attempts carried through", () => {
    const state = { updatedAt: "2026-01-01T00:00:00Z", attempts: 3, stages: { scaffold: "t", passA: null, passB: null, reconcile: null, verified: null } };
    expect(statusJson(SLUG, state)).toEqual({ slug: SLUG, exists: true, nextStage: "passA", attempts: 3, updatedAt: "2026-01-01T00:00:00Z" });
  });

  it("all stages cleared → nextStage is null (JSON-serializable, not undefined)", () => {
    const all = Object.fromEntries(STAGE_ORDER.map((s) => [s, "t"]));
    const state = { updatedAt: "2026-01-01T00:00:00Z", attempts: 5, stages: all };
    const json = statusJson(SLUG, state);
    expect(json.nextStage).toBe(null);
    expect(JSON.parse(JSON.stringify(json)).nextStage).toBe(null);
  });
});
