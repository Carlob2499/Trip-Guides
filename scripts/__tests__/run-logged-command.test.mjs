import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const WRAPPER = path.join(ROOT, "scripts/run-logged-command.sh");
const dirs = [];

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function tempLog() {
  const dir = await mkdtemp(path.join(tmpdir(), "waypoint-logged-command-"));
  dirs.push(dir);
  return path.join(dir, "agent-output.log");
}

function run(log, script) {
  return spawnSync("bash", [WRAPPER, log, "bash", "-lc", script], { encoding: "utf8" });
}

describe("run-logged-command", () => {
  it("returns zero and preserves combined stdout/stderr when the producer succeeds", async () => {
    const log = await tempLog();
    const result = run(log, "printf 'stdout-line\\n'; printf 'stderr-line\\n' >&2; exit 0");
    expect(result.status).toBe(0);
    expect(await readFile(log, "utf8")).toContain("stdout-line");
    expect(await readFile(log, "utf8")).toContain("stderr-line");
  });

  it("propagates the producer's nonzero status instead of tee's success", async () => {
    const log = await tempLog();
    const result = run(log, "printf 'partial work\\n'; exit 23");
    expect(result.status).toBe(23);
    expect(await readFile(log, "utf8")).toContain("partial work");
  });

  it("makes a Claude session-limit interruption an actual command failure while preserving the diagnostic", async () => {
    const log = await tempLog();
    const result = run(log, "printf \"You've hit your session limit · resets 5:40am (UTC)\\n\"; exit 1");
    expect(result.status).toBe(1);
    expect(await readFile(log, "utf8")).toContain("hit your session limit");
  });

  it("fails usage errors rather than silently running without a log target", () => {
    const result = spawnSync("bash", [WRAPPER], { encoding: "utf8" });
    expect(result.status).toBe(64);
    expect(result.stderr).toContain("usage:");
  });
});
