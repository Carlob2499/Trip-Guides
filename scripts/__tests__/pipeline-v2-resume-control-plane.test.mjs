// Regression for V2 resume control-plane freshness.
//
// A durable research branch must preserve run artifacts while executing the control-plane code
// from the workflow's current dispatch commit. Yamagata Run-B attempt 6 proved the old behavior
// checked out the research branch wholesale and silently rolled scripts/pipeline/v2/evidence.mjs
// back behind merged PR #109.

import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { startOrResumeBranch } from "../pipeline/publish.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const temps = [];
afterEach(() => {
  while (temps.length) rmSync(temps.pop(), { recursive: true, force: true });
});

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

describe("startOrResumeBranch — current control-plane on V2 resume", () => {

  it("the V2 workflow explicitly opts resumed research branches into current-code synchronization", () => {
    const workflow = readFileSync(path.join(ROOT, ".github", "workflows", "research-pass-v2.yml"), "utf8");
    expect(workflow).toContain('pipeline.mjs branch --slug "$SLUG" --prefix research-v2 --sync-current');
  });
  it("preserves durable run files but synchronizes the resumed branch to the dispatch commit", () => {
    const root = mkdtempSync(path.join(tmpdir(), "waypoint-v2-resume-"));
    temps.push(root);
    const remote = path.join(root, "remote.git");
    const work = path.join(root, "work");

    git(root, "init", "--bare", remote);
    git(root, "clone", remote, work);
    git(work, "config", "user.name", "Waypoint Test");
    git(work, "config", "user.email", "waypoint@example.invalid");

    writeFileSync(path.join(work, "control-plane.txt"), "old-control-plane\n");
    git(work, "add", "control-plane.txt");
    git(work, "commit", "-m", "baseline");
    git(work, "branch", "-M", "main");
    git(work, "push", "-u", "origin", "main");

    git(work, "checkout", "-b", "research-v2/yamagata");
    writeFileSync(path.join(work, "durable-run.txt"), "keep-this-run-state\n");
    git(work, "add", "durable-run.txt");
    git(work, "commit", "-m", "durable run state");
    git(work, "push", "-u", "origin", "research-v2/yamagata");

    git(work, "checkout", "main");
    writeFileSync(path.join(work, "control-plane.txt"), "repaired-current-control-plane\n");
    git(work, "add", "control-plane.txt");
    git(work, "commit", "-m", "repair control plane");
    git(work, "push", "origin", "main");
    const dispatchHead = git(work, "rev-parse", "HEAD");

    const result = startOrResumeBranch("research-v2/yamagata", { cwd: work, syncCurrent: true });

    expect(result.resumed).toBe(true);
    expect(readFileSync(path.join(work, "durable-run.txt"), "utf8")).toBe("keep-this-run-state\n");
    expect(readFileSync(path.join(work, "control-plane.txt"), "utf8")).toBe("repaired-current-control-plane\n");
    expect(() => git(work, "merge-base", "--is-ancestor", dispatchHead, "HEAD")).not.toThrow();

    const localHead = git(work, "rev-parse", "HEAD");
    const remoteHead = git(work, "ls-remote", "origin", "refs/heads/research-v2/yamagata").split(/\s+/)[0];
    expect(remoteHead).toBe(localHead);
  });
});
