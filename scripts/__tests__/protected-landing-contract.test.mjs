import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const readText = (url) => readFileSync(url, "utf8").replace(/\r\n?/g, "\n");
const lander = readText(new URL("../land-branch.sh", import.meta.url));
const changeWorkflow = readText(new URL("../../.github/workflows/change.yml", import.meta.url));
const newGuideWorkflow = readText(new URL("../../.github/workflows/new-guide.yml", import.meta.url));
const v1Workflow = readText(new URL("../../.github/workflows/research-pass.yml", import.meta.url));
const v2Workflow = readText(new URL("../../.github/workflows/research-pass-v2.yml", import.meta.url));

describe("protected automated landing contract", () => {
  test("passing research/change landing synchronizes base before final evidence", () => {
    expect(lander).toContain('git fetch origin "$BASE"');
    expect(lander).toContain('git merge-base --is-ancestor "$BASE_SHA" HEAD');
    expect(lander).toContain('git merge --no-edit "origin/$BASE"');
    expect(lander).toContain('npm run verify -- --slug "$LANDING_SLUG" --network');
    expect(lander.indexOf('git merge --no-edit "origin/$BASE"')).toBeLessThan(lander.indexOf('npm run verify -- --slug "$LANDING_SLUG" --network'));
  });

  test("runs protected exact-base checks before exact-head merge", () => {
    expect(lander).toContain("node scripts/protected-pr-gate.mjs");
    expect(lander).toContain('--base-sha "$BASE_SHA"');
    expect(lander).toContain('--match-head-commit "$HEAD_SHA"');
    expect(lander.indexOf("node scripts/protected-pr-gate.mjs")).toBeLessThan(lander.indexOf('gh pr merge "$PR_NUM"'));
  });

  test("keeps conflict as draft but treats other merge failures as hard failures", () => {
    expect(lander).toMatch(/conflict\|automatic merge failed/i);
    expect(lander).toContain("leaving PR #$PR_NUM for human triage");
    expect(lander).toContain("not silently downgrading to draft-PR triage");
  });

  test("grants every automated landing the narrow dispatch and check-read scopes", () => {
    expect(changeWorkflow).toMatch(/change:\n[\s\S]*?permissions:\n(?:\s+.*\n)*?\s+checks: read[\s\S]*?\s+actions: write/);
    expect(newGuideWorkflow).toMatch(/permissions:\n\s+checks: read[\s\S]*?\s+actions: write/);
    expect(v1Workflow).toMatch(/permissions:\n\s+checks: read[\s\S]*?\s+actions: write/);
    expect(v2Workflow).toMatch(/# ── Land[\s\S]*?permissions:\n\s+actions: write\n\s+checks: read/);
  });
});
