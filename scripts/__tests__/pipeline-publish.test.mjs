// Tests for scripts/pipeline/publish.mjs — the draft flip and the evidence gate in front of it.
//
// Ported from graduate-guide.test.mjs. There is no separate publication event any more: a guide
// that reaches a clean evidence gate publishes itself as part of landing. The behaviour that
// mattered carried straight over — the guide resolves to its directory meta file, only that meta
// file is written, and a guide that is already published or isn't there at all fails with a reason
// instead of a stack trace.
//
// The one thing this suite adds is the guarantee the deleted approval label used to imply: the
// flip cannot happen without a passing gate. That is now code, not a human clicking a label.

// @protects-file A draft only becomes a published guide once it meets every requirement.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { resolveGuidePath } from "../lib/guide-shape.mjs";
import { flipDraft, publishGuide, evidenceGate, PUBLISH_ERRORS } from "../pipeline/publish.mjs";

describe("resolveGuidePath + flipDraft (filesystem, isolated temp dir)", () => {
  let guidesDir;
  beforeEach(async () => {
    guidesDir = await mkdtemp(path.join(tmpdir(), "waypoint-publish-test-"));
  });
  afterEach(async () => {
    await rm(guidesDir, { recursive: true, force: true });
  });

  const writeGuide = async (slug, meta) => {
    const dir = path.join(guidesDir, slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "_guide.json"), JSON.stringify(meta, null, 2));
    return dir;
  };

  it("resolves a guide to its directory meta file", async () => {
    await writeGuide("denmark", { draft: true, country: "Denmark" });
    expect(resolveGuidePath("denmark", guidesDir)).toEqual({
      metaPath: path.join(guidesDir, "denmark", "_guide.json"),
    });
  });

  it("returns null when the guide directory doesn't exist", () => {
    expect(resolveGuidePath("nowhere", guidesDir)).toBe(null);
  });

  it("returns null for a directory with no _guide.json — a directory alone is not a guide", async () => {
    await mkdir(path.join(guidesDir, "hollow"), { recursive: true });
    expect(resolveGuidePath("hollow", guidesDir)).toBe(null);
  });

  it("ignores a stray flat <slug>.json — the flat shape no longer exists", async () => {
    await writeFile(path.join(guidesDir, "rio.json"), JSON.stringify({ draft: true, country: "Brazil" }));
    expect(resolveGuidePath("rio", guidesDir)).toBe(null);
  });

  it("publishes a draft — removes the draft key, preserves everything else", async () => {
    const dir = await writeGuide("rio", { draft: true, country: "Brazil", title: "Rio" });
    const result = await flipDraft("rio", { guidesDir });
    expect(result).toMatchObject({ ok: true, slug: "rio", country: "Brazil" });
    const written = JSON.parse(await readFile(path.join(dir, "_guide.json"), "utf8"));
    expect(written.draft).toBeUndefined();
    expect(written.title).toBe("Rio"); // untouched
  });

  it("writes only _guide.json, never touches section files", async () => {
    const dir = await writeGuide("korea", { draft: true, country: "South Korea" });
    await writeFile(path.join(dir, "01-plan.json"), JSON.stringify([{ type: "prose", group: "Plan", body: "untouched" }], null, 2));

    const result = await flipDraft("korea", { guidesDir });
    expect(result).toMatchObject({ ok: true, slug: "korea", country: "South Korea" });

    expect(JSON.parse(await readFile(path.join(dir, "_guide.json"), "utf8")).draft).toBeUndefined();
    const sections = JSON.parse(await readFile(path.join(dir, "01-plan.json"), "utf8"));
    expect(sections[0].body).toBe("untouched");
  });

  it("fails NOT_FOUND when the guide doesn't exist", async () => {
    expect(await flipDraft("ghost", { guidesDir })).toEqual({ ok: false, error: PUBLISH_ERRORS.NOT_FOUND, slug: "ghost" });
  });

  it("fails NOT_DRAFT when the guide is already published", async () => {
    await writeGuide("japan", { country: "Japan" });
    expect(await flipDraft("japan", { guidesDir })).toEqual({ ok: false, error: PUBLISH_ERRORS.NOT_DRAFT, slug: "japan" });
  });
});

describe("evidenceGate — the one thing standing between a draft and the live site", () => {
  it("runs build then the NETWORKED verify, in that order", () => {
    const seen = [];
    const gate = evidenceGate("korea", { run: (cmd) => { seen.push(cmd); return 0; } });
    expect(gate.passed).toBe(true);
    expect(seen[0]).toBe("npm run build");
    expect(seen[1]).toContain("--network"); // an offline verify cannot clear a guide for publication
    expect(seen[1]).toContain("--slug korea");
  });

  it("short-circuits: a failing build never reaches verify", () => {
    const seen = [];
    const gate = evidenceGate("korea", { run: (cmd) => { seen.push(cmd); return 1; } });
    expect(gate.passed).toBe(false);
    expect(seen).toEqual(["npm run build"]);
  });

  it("refuses an invalid slug before running anything — it becomes a shell argument", () => {
    expect(() => evidenceGate("korea; rm -rf /", { run: () => 0 })).toThrow(/valid slug/i);
  });
});

describe("publishGuide — no evidence, no publication", () => {
  let guidesDir;
  const metaOf = (slug) => path.join(guidesDir, slug, "_guide.json");
  beforeEach(async () => {
    guidesDir = await mkdtemp(path.join(tmpdir(), "waypoint-publish-gate-"));
    await mkdir(path.join(guidesDir, "korea"), { recursive: true });
    await writeFile(metaOf("korea"), JSON.stringify({ draft: true, country: "South Korea" }));
  });
  afterEach(async () => {
    await rm(guidesDir, { recursive: true, force: true });
  });

  it("REFUSES to flip when the gate fails, and leaves the file alone", async () => {
    const result = await publishGuide("korea", { guidesDir, run: () => 1 });
    expect(result).toMatchObject({ ok: false, error: PUBLISH_ERRORS.NO_EVIDENCE });
    expect(JSON.parse(await readFile(metaOf("korea"), "utf8")).draft).toBe(true);
  });

  it("REFUSES a caller claiming a pass it did not run", async () => {
    // gatePassed is how the landing path passes its already-run verdict through. Anything
    // other than a literal true is a refusal, so a falsy/absent value can never read as "yes".
    expect(await publishGuide("korea", { guidesDir, gatePassed: false })).toMatchObject({ ok: false, error: PUBLISH_ERRORS.NO_EVIDENCE });
  });

  it("flips when the gate passes", async () => {
    const result = await publishGuide("korea", { guidesDir, run: () => 0 });
    expect(result).toMatchObject({ ok: true, slug: "korea" });
    expect(JSON.parse(await readFile(metaOf("korea"), "utf8")).draft).toBeUndefined();
  });

  it("accepts a verdict the landing path already earned, without re-running the gate", async () => {
    let ran = false;
    const result = await publishGuide("korea", { guidesDir, gatePassed: true, run: () => { ran = true; return 0; } });
    expect(result).toMatchObject({ ok: true });
    expect(ran).toBe(false);
  });
});
