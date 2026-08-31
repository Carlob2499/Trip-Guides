import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";

const WORKFLOW = fileURLToPath(new URL("../../.github/workflows/september-completion-watch.yml", import.meta.url));
const yml = readFileSync(WORKFLOW, "utf8").replace(/\r\n?/g, "\n");

function jobBlock(name) {
  const lines = yml.split("\n");
  const start = lines.findIndex((line) => line.match(new RegExp(`^  ${name}:\\s*$`)));
  expect(start, `job "${name}" must exist`).toBeGreaterThanOrEqual(0);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (lines[i].match(/^ {2}\S+:\s*$/)) { end = i; break; }
  }
  return lines.slice(start, end).join("\n");
}

describe("September completion watch — bounded September operator contract", () => {
  it("is hourly/manual only and serializes its own executions", () => {
    const onBlock = yml.slice(yml.indexOf("\non:"), yml.indexOf("\npermissions:"));
    expect(onBlock).toMatch(/schedule:\s*\n\s*- cron: "23 \* \* \* \*"/);
    expect(onBlock).toMatch(/workflow_dispatch:/);
    expect(onBlock).not.toMatch(/^\s*push:/m);
    expect(onBlock).not.toMatch(/^\s*pull_request(?:_target)?:/m);
    expect(yml).toMatch(/group: september-completion-watch\s*\n\s*cancel-in-progress: false/);
  });

  it("pins the frozen Kumamoto r3 identity and Sep 2 date gate", () => {
    const job = jobBlock("kumamoto-acceptance");
    expect(job).toContain('NOT_BEFORE: "2026-09-02"');
    expect(job).toContain("CANDIDATE_REF: acceptance/v2-kumamoto-20260902-r3");
    expect(job).toContain("CANDIDATE_SHA: 56e513000792bc71bf4e18c0a0909724fe5cebac");
    expect(job).toContain("ACCEPTED_BASE: 57e320535d1cb6e861a5001f8c26cc718dcfd93d");
    expect(job).toMatch(/if \[\[ "\$today" < "\$NOT_BEFORE" \]\]; then[\s\S]*eligible=false/);
    expect(job).toMatch(/if: steps\.firewall\.outputs\.eligible == 'true'/);
  });

  it("fails closed on selector/candidate/authority drift before model dispatch", () => {
    const job = jobBlock("kumamoto-acceptance");
    expect(job).toContain("WAYPOINT_RESEARCH_ENGINE is set");
    expect(job).toContain("Frozen candidate moved");
    expect(job).toContain("Current handoff no longer names frozen Kumamoto r3 as dispatch authority");
    expect(job).toContain("Acceptance-sensitive drift");
    expect(job).toMatch(/refusing dispatch/i);
  });

  it("never overlaps an active Kumamoto workflow", () => {
    const job = jobBlock("kumamoto-acceptance");
    expect(job).toContain("A Kumamoto acceptance workflow is already active");
    expect(job).toMatch(/steps\.active\.outputs\.count == '0'/);
  });

  it("resumes automatically only for a durably recorded usage-limit", () => {
    const job = jobBlock("kumamoto-acceptance");
    expect(job).toContain('failure_class" != "usage-limit"');
    expect(job).toContain("Quality/deterministic/unknown failures are never blindly retried");
    expect(job).toContain("Proven usage-limit interruption");
    expect(job).toContain("Durable inputs no longer match the frozen Kumamoto contract");
  });

  it("dispatches only the frozen model contract and never exposes a retry override", () => {
    const job = jobBlock("kumamoto-acceptance");
    for (const required of [
      "-f slug=kumamoto",
      "-f model=claude-sonnet-5",
      "-f effort=high",
      "-f critic_model=claude-opus-5",
      '--ref "$CANDIDATE_REF"',
    ]) expect(job).toContain(required);
    expect(job).not.toContain("void_retry=true");
    expect(job).not.toMatch(/attempts\.cap\s*=|autoRetryCap\s*=|cap extension/i);
  });

  it("does not contain selector/cutover/publication mutation commands", () => {
    const job = jobBlock("kumamoto-acceptance");
    expect(job).not.toMatch(/gh variable set|WAYPOINT_RESEARCH_ENGINE=v2|publish-guide|finalize-landing|merge_pull_request/i);
  });

  it("dispatches the protected-main proof only after GitHub reports main protected and never loops a failed proof", () => {
    const job = jobBlock("protected-main-proof");
    expect(job).toContain('.protected');
    expect(job).toContain('if [[ "$protected" != "true" ]]');
    expect(job).toContain("A protected-main proof is already active");
    expect(job).toContain("Protected-main live proof already passed");
    expect(job).toContain("A prior protected-main proof completed without success; refusing blind hourly retries");
    expect(job).toContain("gh workflow run protected-landing-live-proof.yml");
  });
});
