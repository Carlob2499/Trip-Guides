// The scaffold-landing seam new-guide.yml stands on — pinned after live run 32375205019
// (fixture intake #64, 2026-08-20) pushed the Andorra scaffold to main and THEN died at the
// filer reply: runScaffold read `get("issue")` where pipeline.mjs's `get` only answers literal
// argv flags (`get("--issue")`), and its env fallback named ISSUE_NUM where the workflow sets
// ISSUE — so the issue number silently resolved to "", the commit message read "from #", the
// issue was never answered or closed, and the research pass never auto-started (for EITHER
// engine — the auto-start step never ran).

// @protects-file /new's scaffold cannot lose its issue: flags resolve, env names match the workflow, and a missing issue refuses BEFORE the push.

import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveScaffoldArgs, landScaffold, scaffoldComment } from "../pipeline/scaffold.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

/** pipeline.mjs's actual get(): literal argv-flag lookup. */
const getFrom = (argv) => (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : null);

describe("resolveScaffoldArgs — the argv/env seam", () => {
  it("resolves the FLAG form pipeline.mjs actually passes (--slug/--country/--issue)", () => {
    const get = getFrom(["scaffold", "--slug", "andorra", "--country", "Andorra", "--issue", "64"]);
    const args = resolveScaffoldArgs(get, {});
    expect(args).toMatchObject({ slug: "andorra", country: "Andorra", issue: "64" });
  });

  it("falls back to the EXACT env names new-guide.yml sets — SLUG, COUNTRY, ISSUE (not ISSUE_NUM)", () => {
    const args = resolveScaffoldArgs(() => null, {
      SLUG: "andorra", COUNTRY: "Andorra", ISSUE: "64",
      SITE_BASE_URL: "https://x.test/base/", GITHUB_REPOSITORY: "o/r",
    });
    expect(args).toMatchObject({ slug: "andorra", country: "Andorra", issue: "64", siteBase: "https://x.test/base", repo: "o/r" });
  });

  it("the workflow really does provide those names and flags — parity with new-guide.yml's text", () => {
    const wf = readFileSync(path.join(ROOT, ".github", "workflows", "new-guide.yml"), "utf8");
    const step = wf.split("Land the scaffold on main")[1].split("- name:")[0];
    for (const needle of ["SLUG:", "COUNTRY:", "ISSUE:", '--slug "$SLUG"', '--country "$COUNTRY"', '--issue "$ISSUE"']) {
      expect(step).toContain(needle);
    }
  });
});

describe("landScaffold — a missing issue refuses BEFORE any side effect", () => {
  it("throws on an empty issue without touching git — the push must never precede the refusal", () => {
    // cwd is an empty non-repo directory: if landScaffold reached its `git add`, the error would
    // be git's "not a git repository", not our refusal — so the message IS the ordering proof.
    const dir = mkdtempSync(path.join(tmpdir(), "waypoint-scaffold-"));
    expect(() => landScaffold({ slug: "andorra", country: "Andorra", issue: "", siteBase: "", repo: "o/r", cwd: dir }))
      .toThrow(/isn't an issue number — refusing before anything is committed/);
  });

  it("rejects a non-numeric issue the same way — it becomes a gh argument and a commit message", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "waypoint-scaffold-"));
    expect(() => landScaffold({ slug: "andorra", country: "Andorra", issue: "64; rm -rf /", siteBase: "", repo: "o/r", cwd: dir }))
      .toThrow(/isn't an issue number/);
  });
});

describe("scaffoldComment", () => {
  it("names the guide, the intake spec and the progress page for the slug it was given", () => {
    const body = scaffoldComment({ slug: "andorra", repo: "o/r", guideUrl: "https://x/guides/andorra/", progressUrl: "https://x/progress/?slug=andorra" });
    expect(body).toContain("src/content/guides/andorra/");
    expect(body).toContain("guides-intake/andorra/intake.md");
    expect(body).toContain("https://x/progress/?slug=andorra");
  });
});
