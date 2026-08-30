// Protected scaffold-landing seam for /new.
// @protects-file /new cannot lose its issue, push directly to main, or start research before the exact scaffold head is check-gated and merged.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SCAFFOLD_REQUIRED_CHECKS,
  assertScaffoldBaseUnmoved,
  landScaffold,
  resolveScaffoldArgs,
  scaffoldBranchName,
  scaffoldCheckState,
  scaffoldComment,
  waitForScaffoldChecks,
} from "../pipeline/scaffold.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const HEAD = "a".repeat(40);
const BASE = "b".repeat(40);
const MOVED_BASE = "c".repeat(40);
const successChecks = () => SCAFFOLD_REQUIRED_CHECKS.map((name, i) => ({
  id: i + 1,
  name,
  status: "completed",
  conclusion: "success",
}));

const getFrom = (argv) => (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : null);

describe("resolveScaffoldArgs — argv/env seam", () => {
  it("resolves the literal flags pipeline.mjs passes", () => {
    const get = getFrom(["scaffold", "--slug", "andorra", "--country", "Andorra", "--issue", "64"]);
    expect(resolveScaffoldArgs(get, {})).toMatchObject({ slug: "andorra", country: "Andorra", issue: "64" });
  });

  it("falls back to the exact new-guide workflow env names", () => {
    const args = resolveScaffoldArgs(() => null, {
      SLUG: "andorra", COUNTRY: "Andorra", ISSUE: "64",
      SITE_BASE_URL: "https://x.test/base/", GITHUB_REPOSITORY: "o/r",
    });
    expect(args).toMatchObject({ slug: "andorra", country: "Andorra", issue: "64", siteBase: "https://x.test/base", repo: "o/r" });
  });

  it("the workflow provides protected-landing permissions, names, and quoted flags", () => {
    const wf = readFileSync(path.join(ROOT, ".github", "workflows", "new-guide.yml"), "utf8");
    const step = wf.split("Land scaffold through protected checks")[1].split("- name:")[0];
    expect(wf).toMatch(/permissions:\n {2}contents: write\n {2}pull-requests: write\n {2}issues: write\n {2}actions: write/);
    for (const needle of ["SLUG:", "COUNTRY:", "ISSUE:", '--slug "$SLUG"', '--country "$COUNTRY"', '--issue "$ISSUE"']) {
      expect(step).toContain(needle);
    }
    expect(wf).not.toContain("Land the scaffold on main");
  });
});

describe("scaffold branch and check contract", () => {
  it("uses a deterministic isolated branch per intake issue", () => {
    expect(scaffoldBranchName("andorra", "64")).toBe("scaffold/andorra-64");
  });

  it("requires the repository gate, freeze policy, and both platform Analyze checks", () => {
    expect(SCAFFOLD_REQUIRED_CHECKS).toEqual([
      "required-gate",
      "freeze-policy",
      "Analyze (actions)",
      "Analyze (javascript-typescript)",
    ]);
  });

  it("fails closed on missing, pending, or failed exact-head checks", () => {
    expect(scaffoldCheckState([]).passed).toBe(false);
    expect(scaffoldCheckState([{ id: 1, name: "required-gate", status: "in_progress", conclusion: null }]).pending)
      .toContain("required-gate");
    const failed = successChecks();
    failed[0] = { ...failed[0], conclusion: "failure" };
    expect(scaffoldCheckState(failed).failed).toEqual(["required-gate=failure"]);
    expect(scaffoldCheckState(successChecks()).passed).toBe(true);
  });

  it("waits for the exact head and rejects a terminal red check", async () => {
    const ghRun = () => JSON.stringify({ check_runs: [
      ...successChecks().slice(1),
      { id: 99, name: "required-gate", status: "completed", conclusion: "failure" },
    ] });
    await expect(waitForScaffoldChecks({ repo: "o/r", headSha: HEAD, ghRun, timeoutMs: 1 }))
      .rejects.toThrow(/required-gate=failure/);
  });

  it("refuses a stale tested base before merge", () => {
    expect(() => assertScaffoldBaseUnmoved({ testedBaseSha: BASE, currentBaseSha: BASE })).not.toThrow();
    expect(() => assertScaffoldBaseUnmoved({ testedBaseSha: BASE, currentBaseSha: MOVED_BASE }))
      .toThrow(/main moved after scaffold verification/);
  });
});

describe("landScaffold protected transaction", () => {
  it("refuses invalid issue/repo inputs before git or GitHub mutation", async () => {
    const calls = [];
    const deps = { gitRun: (...args) => calls.push(["git", ...args]), ghRun: (...args) => calls.push(["gh", ...args]) };
    await expect(landScaffold({ slug: "andorra", country: "Andorra", issue: "", siteBase: "", repo: "o/r" }, deps))
      .rejects.toThrow(/isn't an issue number/);
    await expect(landScaffold({ slug: "andorra", country: "Andorra", issue: "64", siteBase: "", repo: "not-a-repo" }, deps))
      .rejects.toThrow(/isn't a valid GitHub repository/);
    expect(calls).toEqual([]);
  });

  it("pushes only the scaffold branch, dispatches checks, verifies the tested base, merges exact head, then closes the issue", async () => {
    const events = [];
    const gitRun = (args) => {
      events.push(["git", ...args]);
      if (args[0] === "rev-parse" && args[1] === "origin/main") return BASE;
      if (args[0] === "rev-parse" && args[1] === "HEAD") return HEAD;
      return "";
    };
    const ghRun = (args) => {
      events.push(["gh", ...args]);
      if (args[0] === "pr" && args[1] === "view" && args.includes("number")) return "77\n";
      if (args[0] === "api" && args[1] === "repos/o/r/branches/main") return `${BASE}\n`;
      if (args[0] === "api") return JSON.stringify({ check_runs: successChecks() });
      if (args[0] === "pr" && args[1] === "view") return JSON.stringify({ mergedAt: "2026-08-30T00:00:00Z", state: "MERGED" });
      return "";
    };

    const result = await landScaffold({
      slug: "andorra", country: "Andorra", issue: "64", siteBase: "https://x.test", repo: "o/r",
    }, { gitRun, ghRun });

    expect(result).toMatchObject({ branch: "scaffold/andorra-64", testedBaseSha: BASE, headSha: HEAD, prNumber: 77 });
    const flattened = events.map((event) => event.join(" "));
    expect(flattened.some((line) => line.includes("git push origin HEAD:refs/heads/scaffold/andorra-64"))).toBe(true);
    expect(flattened.some((line) => line.includes("HEAD:main"))).toBe(false);
    expect(flattened.some((line) => line.includes("gh workflow run required-gate.yml") && line.includes("--ref scaffold/andorra-64"))).toBe(true);
    expect(flattened.some((line) => line.includes("gh workflow run september-freeze.yml") && line.includes("pr_number=77"))).toBe(true);
    expect(flattened.some((line) => line.includes("gh api repos/o/r/branches/main --jq .commit.sha"))).toBe(true);
    expect(flattened.some((line) => line.includes("gh pr merge 77") && line.includes(`--match-head-commit ${HEAD}`))).toBe(true);
    const baseCheckAt = flattened.findIndex((line) => line.includes("gh api repos/o/r/branches/main"));
    const mergeAt = flattened.findIndex((line) => line.includes("gh pr merge 77"));
    const closeAt = flattened.findIndex((line) => line.includes("gh issue close 64"));
    expect(baseCheckAt).toBeGreaterThan(-1);
    expect(mergeAt).toBeGreaterThan(baseCheckAt);
    expect(closeAt).toBeGreaterThan(mergeAt);
  });

  it("leaves the issue open and never merges when an exact-head check fails", async () => {
    const events = [];
    const gitRun = (args) => {
      events.push(["git", ...args]);
      if (args[0] === "rev-parse" && args[1] === "origin/main") return BASE;
      if (args[0] === "rev-parse" && args[1] === "HEAD") return HEAD;
      return "";
    };
    const ghRun = (args) => {
      events.push(["gh", ...args]);
      if (args[0] === "pr" && args[1] === "view" && args.includes("number")) return "77\n";
      if (args[0] === "api") {
        const checks = successChecks();
        checks[0] = { ...checks[0], conclusion: "failure" };
        return JSON.stringify({ check_runs: checks });
      }
      return "";
    };
    await expect(landScaffold({
      slug: "andorra", country: "Andorra", issue: "64", siteBase: "https://x.test", repo: "o/r",
    }, { gitRun, ghRun })).rejects.toThrow(/scaffold checks failed/);
    const flattened = events.map((event) => event.join(" "));
    expect(flattened.some((line) => line.includes("gh pr merge"))).toBe(false);
    expect(flattened.some((line) => line.includes("gh issue close"))).toBe(false);
  });

  it("leaves the issue open and never merges when main moves after checks", async () => {
    const events = [];
    const gitRun = (args) => {
      events.push(["git", ...args]);
      if (args[0] === "rev-parse" && args[1] === "origin/main") return BASE;
      if (args[0] === "rev-parse" && args[1] === "HEAD") return HEAD;
      return "";
    };
    const ghRun = (args) => {
      events.push(["gh", ...args]);
      if (args[0] === "pr" && args[1] === "view" && args.includes("number")) return "77\n";
      if (args[0] === "api" && args[1] === "repos/o/r/branches/main") return `${MOVED_BASE}\n`;
      if (args[0] === "api") return JSON.stringify({ check_runs: successChecks() });
      return "";
    };

    await expect(landScaffold({
      slug: "andorra", country: "Andorra", issue: "64", siteBase: "https://x.test", repo: "o/r",
    }, { gitRun, ghRun })).rejects.toThrow(/refusing stale merge/);
    const flattened = events.map((event) => event.join(" "));
    expect(flattened.some((line) => line.includes("gh pr merge"))).toBe(false);
    expect(flattened.some((line) => line.includes("gh issue close"))).toBe(false);
  });
});

describe("scaffoldComment", () => {
  it("names the merged PR, guide, intake spec and progress page", () => {
    const body = scaffoldComment({
      slug: "andorra", repo: "o/r", prNumber: 77,
      guideUrl: "https://x/guides/andorra/", progressUrl: "https://x/progress/?slug=andorra",
    });
    expect(body).toContain("check-gated PR #77");
    expect(body).toContain("src/content/guides/andorra/");
    expect(body).toContain("guides-intake/andorra/intake.md");
    expect(body).toContain("https://x/progress/?slug=andorra");
  });
});
