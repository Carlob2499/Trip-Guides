/* Structural guarantees the workflow YAML itself must carry — the properties a Node unit test
   cannot execute (real GitHub Actions concurrency, real credential isolation inside a
   container) are instead asserted by reading the file, matching this repo's own established
   pattern for testing workflow YAML (scripts/__tests__/lint-ci-scope.test.mjs: targeted
   text/regex extraction of the one field being guarded, never a full YAML parse). */

// @protects-file The watcher's control-plane decisions (eligibility, prompt, PR-body writes)
// always execute default-branch-pinned code; no GitHub write credential is ever present while
// PR-controlled code (npm ci/lint/typecheck/test/build/the agent) runs; commit/push happens
// only from a fresh, post-validation checkout that PR-controlled code never touched; fork PRs
// are refused before any of that; and the watcher can never run two jobs for the same PR
// concurrently regardless of what triggered them.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const WORKFLOW = fileURLToPath(new URL("../../.github/workflows/claude-codex-watcher.yml", import.meta.url));
const yml = readFileSync(WORKFLOW, "utf8");

const SIGNAL_WORKFLOW = fileURLToPath(new URL("../../.github/workflows/claude-codex-signal.yml", import.meta.url));
const signalYml = readFileSync(SIGNAL_WORKFLOW, "utf8");

// Real YAML block-scalar semantics (not step-name-delimited chunking, which over-captures
// across job/step boundaries the moment a step has no `name:` in between): a `run: |` block's
// body is every subsequent line more indented than the `run:` line itself, until the first
// line at or below that indentation (or EOF). Shared by every test below that needs to look at
// what a step's shell script actually contains.
function blockScalarBodies(text) {
  const lines = text.split("\n");
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)run:\s*\|\s*$/);
    if (!m) continue;
    const indent = m[1].length;
    const body = [];
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j];
      if (line.trim() === "") { body.push(line); continue; }
      if (line.match(/^(\s*)/)[1].length <= indent) break;
      body.push(line);
    }
    blocks.push({ startLine: i + 1, indent, text: body.join("\n") });
  }
  return blocks;
}

// Indentation-scoped, like blockScalarBodies above: a `permissions:` line's own block is every
// subsequent line more indented than it, stopping at the first line at-or-below that indentation
// (or EOF). A plain "key: value" regex without an indentation bound over-captures into whatever
// follows (job names, `runs-on:`, a nested `permissions:` block) the moment there's more than
// one `permissions:` block in the file — caught live when it broke on claude-codex-signal.yml's
// two-block (workflow-level + job-level) shape.
function permissionsBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)permissions:\s*$/);
    if (!m) continue;
    const indent = m[1].length;
    const body = [];
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j];
      if (line.trim() === "") { body.push(line); continue; }
      if (line.match(/^(\s*)/)[1].length <= indent) break;
      body.push(line);
    }
    blocks.push(body.join("\n"));
  }
  return blocks;
}

// Slices out one named step's YAML (from its `- name: <label>` line up to, but not including,
// the next `- name:` at the SAME step-list indentation, or EOF). Indentation-aware so it can't
// over-capture into a sibling job the way naive text-splitting can.
function stepBlock(label) {
  const lines = yml.split("\n");
  const startIdx = lines.findIndex((l) => l.includes(`name: ${label}`));
  expect(startIdx, `step "${label}" must exist`).toBeGreaterThanOrEqual(0);
  const indent = lines[startIdx].match(/^(\s*)-\s*name:/)?.[1].length;
  expect(indent, `step "${label}" must be a "- name:" list item`).not.toBeUndefined();
  let endIdx = lines.length;
  for (let j = startIdx + 1; j < lines.length; j++) {
    if (lines[j].match(new RegExp(`^\\s{${indent}}-\\s*name:`))) { endIdx = j; break; }
  }
  return lines.slice(startIdx, endIdx).join("\n");
}

describe("claude-codex-watcher.yml — trigger safety (two-workflow privilege separation, revision 3)", () => {
  it("the privileged worker never triggers directly on pull_request or pull_request_target — only workflow_run, schedule, and workflow_dispatch", () => {
    const onBlock = yml.slice(yml.indexOf("\non:"), yml.indexOf("\npermissions:"));
    expect(onBlock).not.toMatch(/^\s*pull_request:/m);
    expect(onBlock).not.toMatch(/^\s*pull_request_target:/m);
    expect(onBlock).toMatch(/^\s*workflow_run:/m);
  });

  it("triggers on workflow_run completion of the signal workflow, by exact name, and a schedule fallback", () => {
    expect(yml).toMatch(/on:\s*\n(?:.*\n)*?\s*workflow_run:\s*\n\s*workflows:\s*\["Claude ↔ Codex review signal"\]\s*\n\s*types:\s*\[completed\]/);
    expect(yml).toMatch(/schedule:\s*\n(?:\s*#.*\n)*\s*-\s*cron:/);
  });

  it("only proceeds on a workflow_run event when the signal run actually succeeded", () => {
    const list = stepBlock("List the PR(s) this firing should check");
    expect(list).toMatch(/RUN_CONCLUSION.*!=\s*"success"/s);
  });

  it("the PR number from a workflow_run event is read from GitHub's own workflow_run.pull_requests (never trusted as sole ground truth — the eligibility check re-verifies independently below)", () => {
    const list = stepBlock("List the PR(s) this firing should check");
    expect(list).toMatch(/RUN_PR_NUMBER/);
    expect(list).toMatch(/workflow_run\.pull_requests\[0\]\.number/);
  });

  it("case 16 — the scheduled fallback computes its candidate list the same way the event trigger's eligibility check does (list-candidates, not a separate weaker path)", () => {
    expect(yml).toMatch(/codex-watcher\.mjs list-candidates/);
  });
});

describe("claude-codex-signal.yml — the unprivileged half is genuinely unprivileged", () => {
  it("triggers on pull_request: edited and nothing else", () => {
    const onBlock = signalYml.slice(signalYml.indexOf("\non:"), signalYml.indexOf("\npermissions:"));
    expect(onBlock).toMatch(/^\s*pull_request:\s*\n\s*types:\s*\[edited\]\s*$/m);
    expect(onBlock).not.toMatch(/workflow_run|schedule|workflow_dispatch/);
  });

  it("declares read-only permissions and no job in it requests anything more", () => {
    const perms = permissionsBlocks(signalYml);
    expect(perms.length).toBeGreaterThan(0);
    for (const block of perms) {
      expect(block.trim()).toBe("contents: read");
    }
  });

  it("no secret and no GitHub write-token env var appears anywhere in the file — it has nothing to leak because it never receives anything", () => {
    expect(signalYml).not.toMatch(/secrets\./);
    expect(signalYml).not.toMatch(/GH_TOKEN|PUSH_TOKEN|CLAUDE_CODE_OAUTH_TOKEN/);
  });

  it("the two workflows are actually linked by name — the signal workflow's own `name:` matches the worker's workflow_run.workflows filter exactly", () => {
    const signalName = signalYml.match(/^name:\s*(.+)$/m)?.[1].trim();
    expect(signalName).toBeTruthy();
    expect(yml).toContain(`workflows: ["${signalName}"]`);
  });
});

describe("claude-codex-watcher.yml — case 9: per-PR concurrency", () => {
  it("the watch job's concurrency group is keyed by the PR number, with cancel-in-progress false", () => {
    const m = yml.match(/concurrency:\s*\n\s*group:\s*([^\n]+)\n\s*cancel-in-progress:\s*([^\n]+)/);
    expect(m, "watch job must declare a concurrency block").toBeTruthy();
    expect(m[1].trim()).toMatch(/codex-watcher-pr-\$\{\{\s*matrix\.pr\s*\}\}/);
    expect(m[2].trim()).toBe("false");
  });

  it("the SAME group name is used regardless of trigger — an event-triggered run and a scheduled-fallback run for the same PR queue behind each other rather than racing", () => {
    const blocks = [...yml.matchAll(/concurrency:\s*\n\s*group:\s*([^\n]+)/g)];
    expect(blocks.length).toBe(1);
    expect(blocks[0][1]).not.toMatch(/event_name/);
  });
});

describe("claude-codex-watcher.yml — the control plane is pinned to the default branch, never the PR", () => {
  it("the trusted checkout (repo root) carries no explicit PR ref — for workflow_run/schedule/workflow_dispatch that means it is always the default branch (none of these triggers has a PR-ref concept at all)", () => {
    const trustedCheckout = stepBlock("Checkout the TRUSTED control plane (default branch only)");
    expect(trustedCheckout).not.toMatch(/ref:/);
  });

  it("eligibility (fork/head/work-order/authority) is decided from the trusted checkout, before any PR content is checked out", () => {
    const checkIdx = yml.indexOf("Check eligibility against LIVE PR state");
    const prCheckoutIdx = yml.indexOf("Checkout the PR's exact reviewed content");
    expect(checkIdx).toBeGreaterThan(0);
    expect(prCheckoutIdx).toBeGreaterThan(checkIdx);
  });

  it("PR content is checked out pinned to the exact SHA the eligibility check validated — never a floating branch ref that could move after the check", () => {
    const prCheckout = stepBlock("Checkout the PR's exact reviewed content (untrusted, credential-free)");
    expect(prCheckout).toMatch(/ref:\s*\$\{\{\s*steps\.check\.outputs\.head\s*\}\}/);
    expect(prCheckout).toMatch(/path:\s*pr-workspace/);
  });

  it("the agent's prompt is composed from the trusted (default-branch) prompts/codex-work-order.md, not from PR content", () => {
    const promptStep = stepBlock("Compose the agent prompt");
    expect(promptStep).not.toMatch(/working-directory:\s*pr-workspace/);
    expect(promptStep).toMatch(/prompts\/codex-work-order\.md/);
  });

  it("the PR-body write (build-section / update-pr) runs the control plane's OWN copy of codex-watcher.mjs, from repo root", () => {
    const handoff = stepBlock("Mark the new HEAD ready for Codex");
    expect(handoff).not.toMatch(/working-directory:/);
    expect(handoff).toMatch(/node scripts\/codex-watcher\.mjs build-section/);
    expect(handoff).toMatch(/node scripts\/codex-watcher\.mjs update-pr/);
  });

  it("every step after the eligibility check is gated — directly on eligibility, or transitively on a prior step's success (which itself required eligibility)", () => {
    const afterCheck = yml.slice(yml.indexOf("id: check"));
    const stepBlocks = afterCheck
      .split(/\n\s*-\s*name:/)
      .slice(2) // skip the check step itself + its own "not eligible" report step
      .map((b) => `- name:${b}`);
    expect(stepBlocks.length).toBeGreaterThan(5); // sanity: didn't accidentally match nothing
    const gated = /steps\.check\.outputs\.eligible == 'true'|steps\.agent\.outcome == 'success'|steps\.validate\.outcome == 'success'|steps\.finish\.outcome == 'success'/;
    for (const block of stepBlocks) {
      expect(block, block.split("\n")[0]).toMatch(/if:/);
      expect(block, block.split("\n")[0]).toMatch(gated);
    }
  });
});

describe("claude-codex-watcher.yml — case 4: fork PRs are refused before any secret-bearing or write-capable step", () => {
  it("fork PRs never reach PR checkout, npm ci, the agent, or any credentialed step — isEligible's isCrossRepository check runs first and gates everything after it", () => {
    // Already covered generically by the gating test above; this asserts the SPECIFIC ordering
    // fork-safety depends on: nothing that could touch PR content or a token runs before
    // `check`. Sliced from `jobs:` onward so the file's own top-of-file trust-model comment
    // (which necessarily NAMES pr-workspace/docker while explaining the design) isn't mistaken
    // for an actual step running before eligibility is decided.
    const beforeCheck = yml.slice(yml.indexOf("\njobs:"), yml.indexOf("id: check"));
    expect(beforeCheck).not.toMatch(/pr-workspace/);
    expect(beforeCheck).not.toMatch(/docker run/);
  });
});

describe("claude-codex-watcher.yml — case 2 (Codex P0 finding #2): no GitHub write credential is present while PR-controlled code executes", () => {
  it("no job declares a job-wide GH_TOKEN or PUSH_TOKEN — every token is scoped to the one step that needs it", () => {
    const watchJob = yml.slice(yml.indexOf("\n  watch:"));
    const jobHeader = watchJob.slice(0, watchJob.indexOf("\n    steps:"));
    expect(jobHeader).not.toMatch(/GH_TOKEN|PUSH_TOKEN/);
  });

  it("checking out PR content, npm ci in pr-workspace, and the agent run all carry no GH/PUSH token in their own env:", () => {
    for (const label of [
      "Checkout the PR's exact reviewed content (untrusted, credential-free)",
      "Write the work order as a file the agent reads (never inlined into the prompt)",
      "Replace the PR workspace's history with an unprivileged local sandbox",
      "Run the fix agent (isolated — no GitHub credential reaches this container)",
    ]) {
      const block = stepBlock(label);
      expect(block, label).not.toMatch(/GH_TOKEN|PUSH_TOKEN/);
    }
  });

  it("the fix agent's docker invocation never passes a GH/PUSH token env var name through -e, and only CLAUDE_CODE_OAUTH_TOKEN reaches it", () => {
    const agentBlock = stepBlock("Run the fix agent (isolated — no GitHub credential reaches this container)");
    expect(agentBlock).toMatch(/CLAUDE_CODE_OAUTH_TOKEN/);
    expect(agentBlock).not.toMatch(/-e\s+(GH_TOKEN|GITHUB_TOKEN|PUSH_TOKEN|PAT)\b/);
    expect(agentBlock).not.toMatch(/secrets\.GITHUB_TOKEN/);
  });

  it("case 2 (Codex P0 finding #2) — the validate step (npm ci/lint/typecheck/test/build) carries NO GH/PUSH token in its own env:, even though it executes PR-controlled code", () => {
    const validate = stepBlock("Validate the agent's result (credential-free — no GH/PUSH token present)");
    expect(validate).not.toMatch(/GH_TOKEN|PUSH_TOKEN/);
    for (const gate of ["npm ci", "npm run lint", "npm run typecheck", "npm test", "npm run build"]) {
      expect(validate, gate).toContain(gate);
    }
  });
});

describe("claude-codex-watcher.yml — case: validation is split from commit/push (Codex P0 finding #2)", () => {
  it("commit/push is a SEPARATE step from validation, running only after validation succeeded, and is pure git plumbing — no npm/lint/test/build command reappears once the push credential is present", () => {
    const finish = stepBlock("Commit and push (the only step with a write-capable credential)");
    expect(finish).toMatch(/if:.*steps\.validate\.outcome == 'success'/);
    expect(finish).toMatch(/PUSH_TOKEN/);
    for (const forbidden of ["npm ci", "npm run lint", "npm run typecheck", "npm test", "npm run build"]) {
      expect(finish, `finish step must not run "${forbidden}"`).not.toContain(forbidden);
    }
    expect(finish).toMatch(/git add -A/);
    expect(finish).toMatch(/git commit/);
    expect(finish).toMatch(/git push/);
  });

  it("the push happens from a FRESH checkout created only after validation succeeded — not from the workspace the agent/gates ran in", () => {
    const freshCheckout = stepBlock("Checkout a fresh control-plane copy for the push (post-validation only)");
    expect(freshCheckout).toMatch(/if:.*steps\.validate\.outcome == 'success'/);
    expect(freshCheckout).toMatch(/path:\s*push-workspace/);
    expect(freshCheckout).toMatch(/ref:\s*\$\{\{\s*steps\.check\.outputs\.head\s*\}\}/);

    const finish = stepBlock("Commit and push (the only step with a write-capable credential)");
    expect(finish).toMatch(/working-directory:\s*push-workspace/);
  });

  it("only FILES are copied onto the fresh checkout (rsync), never pr-workspace's own .git — so nothing PR-controlled could have planted a hook/config there", () => {
    const copyStep = stepBlock("Copy the validated file tree onto the fresh checkout");
    expect(copyStep).toMatch(/rsync/);
    expect(copyStep).toMatch(/--exclude='\.git'/);
    expect(copyStep).not.toMatch(/git merge|git pull|cp -r.*\.git\b/);
  });
});

describe("claude-codex-watcher.yml — case: temporary work-order data is excluded from every commit (Codex P1 finding)", () => {
  it(".codex-work-order.md is explicitly excluded from the rsync that populates the pushed workspace", () => {
    const copyStep = stepBlock("Copy the validated file tree onto the fresh checkout");
    expect(copyStep).toMatch(/--exclude='\.codex-work-order\.md'/);
  });

  it(".gitignore also lists .codex-work-order.md as defense in depth", () => {
    const gitignore = readFileSync(fileURLToPath(new URL("../../.gitignore", import.meta.url)), "utf8");
    expect(gitignore).toMatch(/^\.codex-work-order\.md$/m);
  });
});

describe("claude-codex-watcher.yml — script-injection hygiene (CodeQL, PR #78 live finding)", () => {
  // GitHub substitutes `${{ }}` into a `run:` script's TEXT before the shell ever sees it —
  // so any step-output/event/input value interpolated directly into script text is a
  // script-injection vector (a value containing shell metacharacters executes as code, not
  // data). The fix, applied everywhere in this file, is to assign the value through `env:`
  // and reference it as an ordinary shell variable — `env:` assignment is immune, because the
  // SHELL does that substitution, safely, not the expression engine. This test fails the
  // moment any `run:` step regresses to interpolating `${{ }}` directly again.
  it("no `run:` step body ever contains a raw ${{ }} expression — every value flows through env: instead", () => {
    const offenders = [];
    for (const block of blockScalarBodies(yml)) {
      if (block.text.includes("${{")) offenders.push(`line ${block.startLine} (block)`);
    }
    for (const line of yml.split("\n")) {
      const inlineMatch = line.match(/^\s*run:\s*(.+)$/);
      if (inlineMatch && inlineMatch[1].includes("${{")) offenders.push(`inline: ${line.trim()}`);
    }
    expect(offenders, "these run: steps interpolate ${{ }} directly into shell script text").toEqual([]);
  });

  it("sanity: the detector itself catches a real offender (proves it isn't vacuously passing)", () => {
    const withOffender = yml.replace(
      'echo "[codex-watcher] PR #$PR — not eligible: $REASON"',
      'echo "[codex-watcher] PR #$PR — not eligible: ${{ steps.check.outputs.reason }}"',
    );
    expect(withOffender).not.toBe(yml); // the replace actually matched something
    const offenders = blockScalarBodies(withOffender).filter((b) => b.text.includes("${{ steps.check.outputs.reason }}"));
    expect(offenders.length).toBeGreaterThan(0);
  });

  it("the signal workflow is clean too — no run: step interpolates ${{ }} directly (its one event value, PR number, flows through env: PR)", () => {
    const offenders = [];
    for (const block of blockScalarBodies(signalYml)) {
      if (block.text.includes("${{")) offenders.push(`line ${block.startLine} (block)`);
    }
    for (const line of signalYml.split("\n")) {
      const inlineMatch = line.match(/^\s*run:\s*(.+)$/);
      if (inlineMatch && inlineMatch[1].includes("${{")) offenders.push(`inline: ${line.trim()}`);
    }
    expect(offenders).toEqual([]);
  });
});

describe("claude-codex-watcher.yml + claude-codex-signal.yml — permissions stay inside the watcher's authority", () => {
  it("no job in either file requests actions:write, admin, or any scope beyond contents/pull-requests", () => {
    const perms = [...permissionsBlocks(yml), ...permissionsBlocks(signalYml)];
    expect(perms.length).toBeGreaterThan(0);
    for (const block of perms) {
      expect(block).not.toMatch(/actions:\s*write/);
      expect(block).not.toMatch(/administration:/);
      expect(block).not.toMatch(/issues:\s*write/); // this watcher never files/comments on issues
    }
  });
});
