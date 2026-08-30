import { describe, expect, test } from "vitest";
import {
  PROTECTED_PR_REQUIRED_CHECKS,
  protectedCheckState,
  gateProtectedPr,
} from "../protected-pr-gate.mjs";

const HEAD = "1".repeat(40);
const BASE = "2".repeat(40);

describe("protected unattended PR gate", () => {
  test("requires the four concrete merge controls", () => {
    expect(PROTECTED_PR_REQUIRED_CHECKS).toEqual([
      "required-gate",
      "freeze-policy",
      "Analyze (actions)",
      "Analyze (javascript-typescript)",
    ]);
    expect(protectedCheckState(PROTECTED_PR_REQUIRED_CHECKS.map((name, i) => ({ id: i + 1, name, status: "completed", conclusion: "success" }))).toMatchObject({ passed: true, missing: [], pending: [], failed: [] });
  });

  test("fails closed on missing, pending, or unsuccessful checks", () => {
    expect(protectedCheckState([]).passed).toBe(false);
    expect(protectedCheckState([{ id: 1, name: "required-gate", status: "in_progress" }]).pending).toContain("required-gate");
    expect(protectedCheckState([{ id: 1, name: "required-gate", status: "completed", conclusion: "failure" }]).failed).toContain("required-gate=failure");
  });

  test("dispatches exact-base gates and rejects head/base drift", async () => {
    const calls = [];
    let base = BASE;
    let head = HEAD;
    const ghRun = (args) => {
      calls.push(args);
      if (args[0] === "api" && args[1].includes("/branches/main")) return `${base}\n`;
      if (args[0] === "pr" && args[1] === "view") return `${head}\n`;
      if (args[0] === "workflow") return "";
      throw new Error(`unexpected gh call: ${args.join(" ")}`);
    };
    const waitForChecks = async () => {
      expect(calls.some((args) => args.includes(`base_sha=${BASE}`))).toBe(true);
    };

    await expect(gateProtectedPr({
      repo: "owner/repo", prNumber: 12, branch: "research/demo", headSha: HEAD,
      base: "main", baseSha: BASE, ghRun, waitForChecks,
    })).resolves.toEqual({ headSha: HEAD, baseSha: BASE });

    base = "3".repeat(40);
    await expect(gateProtectedPr({
      repo: "owner/repo", prNumber: 12, branch: "research/demo", headSha: HEAD,
      base: "main", baseSha: BASE, ghRun, waitForChecks,
    })).rejects.toThrow(/main moved before protected checks/);

    base = BASE;
    head = "4".repeat(40);
    await expect(gateProtectedPr({
      repo: "owner/repo", prNumber: 12, branch: "research/demo", headSha: HEAD,
      base: "main", baseSha: BASE, ghRun, waitForChecks,
    })).rejects.toThrow(/head moved before protected checks/);
  });
});
