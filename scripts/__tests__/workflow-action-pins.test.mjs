import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const WORKFLOWS = path.join(ROOT, ".github", "workflows");

const workflowFiles = readdirSync(WORKFLOWS)
  .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
  .sort();

describe("GitHub Actions supply-chain pins", () => {
  it("pins every external action/workflow reference to an immutable 40-character commit SHA", () => {
    const offenders = [];

    for (const name of workflowFiles) {
      const file = path.join(WORKFLOWS, name);
      const lines = readFileSync(file, "utf8").split("\n");

      lines.forEach((line, index) => {
        const match = line.match(/^\s*-?\s*uses:\s*([^\s#]+)/);
        if (!match) return;

        const target = match[1];
        if (target.startsWith("./")) return; // repository-owned reusable workflow/action
        if (target.startsWith("docker://")) return; // immutable-image policy is handled separately

        const at = target.lastIndexOf("@");
        const ref = at >= 0 ? target.slice(at + 1) : "";
        if (!/^[0-9a-f]{40}$/i.test(ref)) {
          offenders.push(`${name}:${index + 1} ${target}`);
        }
      });
    }

    expect(
      offenders,
      "external GitHub Actions references must use immutable commit SHAs, never mutable tags/branches",
    ).toEqual([]);
  });
});
