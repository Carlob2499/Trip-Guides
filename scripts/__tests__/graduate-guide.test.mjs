// Tests for scripts/graduate-guide.mjs — specifically that it handles BOTH guide shapes
// (flat <slug>.json and split <slug>/_guide.json), which the original single-file-only version
// silently didn't (docs/HANDOFF.md / pipeline-audit finding, this session).

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  field, parseIssueBody, isValidSlug, resolveGuidePath, graduateGuide, GRADUATE_ERRORS,
} from "../graduate-guide.mjs";

describe("field / parseIssueBody (pure)", () => {
  it("extracts a labeled field from a rendered issue body", () => {
    const body = "### Guide slug\n\nkorea\n\n### Why is this ready?\n\nAll facts checked.";
    expect(field(body, "Guide slug")).toBe("korea");
    expect(parseIssueBody(body).rawSlug).toBe("korea");
  });

  it("normalizes GitHub's _No response_ placeholder to empty", () => {
    const body = "### Guide slug\n\n_No response_";
    expect(field(body, "Guide slug")).toBe("");
  });

  it("returns empty for a missing field or empty body", () => {
    expect(field("### Something else\n\nvalue", "Guide slug")).toBe("");
    expect(field("", "Guide slug")).toBe("");
    expect(field(undefined, "Guide slug")).toBe("");
  });
});

describe("isValidSlug (pure)", () => {
  it("accepts lowercase-digits-single-hyphens", () => {
    expect(isValidSlug("korea")).toBe(true);
    expect(isValidSlug("mexico-city")).toBe(true);
    expect(isValidSlug("rio-2")).toBe(true);
  });
  it("rejects anything else", () => {
    expect(isValidSlug("Korea")).toBe(false);
    expect(isValidSlug("../etc/passwd")).toBe(false);
    expect(isValidSlug("a--b")).toBe(false);
    expect(isValidSlug("")).toBe(false);
  });
});

describe("resolveGuidePath + graduateGuide (filesystem, isolated temp dir)", () => {
  let guidesDir;
  beforeEach(async () => {
    guidesDir = await mkdtemp(path.join(tmpdir(), "waypoint-graduate-test-"));
  });
  afterEach(async () => {
    await rm(guidesDir, { recursive: true, force: true });
  });

  it("resolves the flat-file shape", async () => {
    await writeFile(path.join(guidesDir, "korea.json"), JSON.stringify({ draft: true, country: "South Korea" }));
    const located = resolveGuidePath("korea", guidesDir);
    expect(located).toMatchObject({ isDirectory: false });
  });

  it("resolves the split-directory shape", async () => {
    await mkdir(path.join(guidesDir, "denmark"), { recursive: true });
    await writeFile(path.join(guidesDir, "denmark", "_guide.json"), JSON.stringify({ draft: true, country: "Denmark" }));
    const located = resolveGuidePath("denmark", guidesDir);
    expect(located).toMatchObject({ isDirectory: true });
  });

  it("returns null when neither shape exists", () => {
    expect(resolveGuidePath("nowhere", guidesDir)).toBe(null);
  });

  it("graduates a flat-file draft — removes the draft key, preserves everything else", async () => {
    const guidePath = path.join(guidesDir, "rio.json");
    await writeFile(guidePath, JSON.stringify({ draft: true, country: "Brazil", title: "Rio" }, null, 2));
    const result = await graduateGuide("rio", { guidesDir });
    expect(result).toMatchObject({ ok: true, slug: "rio", country: "Brazil", isDirectory: false });
    const written = JSON.parse(await readFile(guidePath, "utf8"));
    expect(written.draft).toBeUndefined();
    expect(written.title).toBe("Rio"); // untouched
  });

  it("graduates a split-directory draft — writes only _guide.json, never touches section files", async () => {
    const dir = path.join(guidesDir, "korea");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "_guide.json"), JSON.stringify({ draft: true, country: "South Korea" }, null, 2));
    await writeFile(path.join(dir, "01-plan.json"), JSON.stringify([{ type: "prose", group: "Plan", body: "untouched" }], null, 2));

    const result = await graduateGuide("korea", { guidesDir });
    expect(result).toMatchObject({ ok: true, slug: "korea", country: "South Korea", isDirectory: true });

    const meta = JSON.parse(await readFile(path.join(dir, "_guide.json"), "utf8"));
    expect(meta.draft).toBeUndefined();
    const sections = JSON.parse(await readFile(path.join(dir, "01-plan.json"), "utf8"));
    expect(sections[0].body).toBe("untouched"); // this is the bug the fix closes: the old
    // single-file-only version couldn't even find this guide to graduate it in the first place
  });

  it("fails NOT_FOUND when neither shape exists", async () => {
    const result = await graduateGuide("ghost", { guidesDir });
    expect(result).toEqual({ ok: false, error: GRADUATE_ERRORS.NOT_FOUND, slug: "ghost" });
  });

  it("fails NOT_DRAFT when the guide has already graduated (no draft key)", async () => {
    await writeFile(path.join(guidesDir, "japan.json"), JSON.stringify({ country: "Japan" }));
    const result = await graduateGuide("japan", { guidesDir });
    expect(result).toEqual({ ok: false, error: GRADUATE_ERRORS.NOT_DRAFT, slug: "japan" });
  });

  it("prefers the flat file if both shapes somehow exist (defensive tie-break, not an expected case)", async () => {
    await writeFile(path.join(guidesDir, "dupe.json"), JSON.stringify({ draft: true, country: "Flat" }));
    await mkdir(path.join(guidesDir, "dupe"), { recursive: true });
    await writeFile(path.join(guidesDir, "dupe", "_guide.json"), JSON.stringify({ draft: true, country: "Directory" }));
    const located = resolveGuidePath("dupe", guidesDir);
    expect(located.isDirectory).toBe(false);
  });
});
