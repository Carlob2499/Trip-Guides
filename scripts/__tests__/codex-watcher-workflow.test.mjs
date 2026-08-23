/* Structural guarantees the workflow YAML itself must carry — the properties a Node unit test
   cannot execute (real GitHub Actions concurrency, real credential isolation inside a
   container) are instead asserted by reading the file, matching this repo's own established
   pattern for testing workflow YAML (scripts/__tests__/lint-ci-scope.test.mjs: targeted
   text/regex extraction of the one field being guarded, never a full YAML parse). */

// @protects-file The watcher workflow never uses pull_request_target, never runs on a fork
// PR, never lets a GitHub write credential reach the agent container, and can never run two
// jobs for the same PR concurrently regardless of what triggered them.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const WORKFLOW = fileURLToPath(new URL("../../.github/workflows/claude-codex-watcher.yml", import.meta.url));
const yml = readFileSync(WORKFLOW, "utf8");

describe("claude-codex-watcher.yml — trigger safety", () => {
  it("never uses pull_request_target as an actual trigger (the classic fork-PR-with-secrets vulnerability) — the term may still appear in an explanatory comment", () => {
    const onBlock = yml.slice(yml.indexOf("\non:"), yml.indexOf("\npermissions:"));
    expect(onBlock).not.toMatch(/^\s*pull_request_target:/m);
  });

  it("triggers on pull_request edited (Codex's PR-body edit) and a schedule fallback", () => {
    expect(yml).toMatch(/on:\s*\n(?:.*\n)*?\s*pull_request:\s*\n\s*types:\s*\[edited\]/);
    // Comment lines may sit between `schedule:` and its `- cron:` entry.
    expect(yml).toMatch(/schedule:\s*\n(?:\s*#.*\n)*\s*-\s*cron:/);
  });

  it("case 16 — the scheduled fallback computes its candidate list the same way the event trigger's eligibility check does (list-candidates, not a separate weaker path)", () => {
    expect(yml).toMatch(/codex-watcher\.mjs list-candidates/);
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
    // Only one concurrency block should exist in the whole file, and it must be keyed purely
    // by matrix.pr — nothing here branches on github.event_name, so trigger source cannot
    // change which lock a run takes.
    const blocks = [...yml.matchAll(/concurrency:\s*\n\s*group:\s*([^\n]+)/g)];
    expect(blocks.length).toBe(1);
    expect(blocks[0][1]).not.toMatch(/event_name/);
  });
});

describe("claude-codex-watcher.yml — case 4: fork PRs are refused before the agent can run", () => {
  it("the eligibility check (which rejects isCrossRepository PRs) runs before the agent step, and the agent step is gated on it", () => {
    const checkIdx = yml.indexOf("Check eligibility against LIVE PR state");
    const agentIdx = yml.indexOf("Run the fix agent");
    expect(checkIdx).toBeGreaterThan(0);
    expect(agentIdx).toBeGreaterThan(checkIdx);
  });

  it("every step after the eligibility check is gated — directly on eligibility, or transitively on a prior step's success (which itself required eligibility)", () => {
    const afterCheck = yml.slice(yml.indexOf("id: check"));
    const stepBlocks = afterCheck
      .split(/\n\s*-\s*name:/)
      .slice(2) // skip the check step itself + its own "not eligible" report step
      .map((b) => `- name:${b}`);
    expect(stepBlocks.length).toBeGreaterThan(5); // sanity: didn't accidentally match nothing
    const gated = /steps\.check\.outputs\.eligible == 'true'|steps\.agent\.outcome == 'success'|steps\.finish\.outcome == 'success'/;
    for (const block of stepBlocks) {
      expect(block, block.split("\n")[0]).toMatch(/if:/);
      expect(block, block.split("\n")[0]).toMatch(gated);
    }
  });
});

describe("claude-codex-watcher.yml — case 14: no GitHub write credential reaches the agent container", () => {
  it("the docker run invocation for the agent step never passes a GH/PUSH token env var name through -e", () => {
    const agentBlock = yml.slice(yml.indexOf("Run the fix agent"), yml.indexOf("Checkout a fresh control-plane copy after the agent"));
    expect(agentBlock).toMatch(/CLAUDE_CODE_OAUTH_TOKEN/); // the only credential that DOES reach it
    expect(agentBlock).not.toMatch(/-e\s+(GH_TOKEN|GITHUB_TOKEN|PUSH_TOKEN|PAT)\b/);
    expect(agentBlock).not.toMatch(/secrets\.GITHUB_TOKEN/);
  });

  it("repository credentials are explicitly stripped from the checkout before the agent step runs", () => {
    const beforeAgent = yml.slice(0, yml.indexOf("Run the fix agent"));
    expect(beforeAgent).toMatch(/Remove repository credentials before the agent runs/);
    expect(beforeAgent).toMatch(/--unset-all http\.https:\/\/github\.com\/\.extraheader/);
  });

  it("the agent's workspace history is replaced with an unprivileged, remote-less sandbox before it runs", () => {
    const beforeAgent = yml.slice(0, yml.indexOf("Run the fix agent"));
    expect(beforeAgent).toMatch(/rm -rf \.git/);
    expect(beforeAgent).toMatch(/git init/);
  });
});

describe("claude-codex-watcher.yml — the control plane, not the agent, validates and pushes", () => {
  it("the repo's gates (lint, typecheck, test, build) run on the collected result before any commit", () => {
    const finishBlock = yml.slice(yml.indexOf("Apply the agent's result"), yml.indexOf("Mark the new HEAD ready for Codex"));
    const gateIdx = {
      lint: finishBlock.indexOf("npm run lint"),
      typecheck: finishBlock.indexOf("npm run typecheck"),
      test: finishBlock.indexOf("npm test"),
      build: finishBlock.indexOf("npm run build"),
      commit: finishBlock.indexOf("git commit"),
      push: finishBlock.indexOf("git push"),
    };
    for (const [gate, idx] of Object.entries(gateIdx)) expect(idx, gate).toBeGreaterThan(-1);
    expect(gateIdx.lint).toBeLessThan(gateIdx.commit);
    expect(gateIdx.typecheck).toBeLessThan(gateIdx.commit);
    expect(gateIdx.test).toBeLessThan(gateIdx.commit);
    expect(gateIdx.build).toBeLessThan(gateIdx.commit);
    expect(gateIdx.commit).toBeLessThan(gateIdx.push);
  });

  it("bash's default -e (errexit) means a failing gate stops the step before any commit runs — no separate guard needed", () => {
    // GitHub Actions' default bash shell for `run:` is `bash --noprofile --norc -eo pipefail`.
    // This test exists so that if this workflow's steps ever gain an explicit `shell:`
    // override, a reviewer is forced to re-examine whether fail-closed still holds.
    expect(yml).not.toMatch(/shell:\s*bash\s+-c\b/); // no override that would drop -e
  });

  it("Claude's PR-section write happens ONLY after the push succeeds, using control-plane-composed text, not the agent's own output file", () => {
    const handoff = yml.slice(yml.indexOf("Mark the new HEAD ready for Codex"));
    expect(handoff).toMatch(/if:\s*steps\.finish\.outcome == 'success'/);
    expect(handoff).toMatch(/build-section/);
    expect(handoff).not.toMatch(/summary-file|agent-output\.log/);
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
    // Real YAML block-scalar semantics, not step-name-delimited chunking (which over-captures
    // across job/step boundaries the moment a step has no `name:` in between): a `run: |`
    // block's body is every subsequent line more indented than the `run:` line itself, until
    // the first line at or below that indentation (or EOF).
    const lines = yml.split("\n");
    const offenders = [];
    for (let i = 0; i < lines.length; i++) {
      const blockMatch = lines[i].match(/^(\s*)run:\s*\|\s*$/);
      if (blockMatch) {
        const indent = blockMatch[1].length;
        const body = [];
        for (let j = i + 1; j < lines.length; j++) {
          const line = lines[j];
          if (line.trim() === "") { body.push(line); continue; }
          if (line.match(/^(\s*)/)[1].length <= indent) break;
          body.push(line);
        }
        if (body.join("\n").includes("${{")) offenders.push(`line ${i + 1} (block)`);
        continue;
      }
      const inlineMatch = lines[i].match(/^\s*run:\s*(.+)$/);
      if (inlineMatch && inlineMatch[1].includes("${{")) offenders.push(`line ${i + 1} (inline)`);
    }
    expect(offenders, "these run: steps interpolate ${{ }} directly into shell script text").toEqual([]);
  });

  it("sanity: the detector itself catches a real offender (proves it isn't vacuously passing)", () => {
    const withOffender = yml.replace(
      'echo "[codex-watcher] PR #$PR — not eligible: $REASON"',
      'echo "[codex-watcher] PR #$PR — not eligible: ${{ steps.check.outputs.reason }}"',
    );
    expect(withOffender).not.toBe(yml); // the replace actually matched something
    const lines = withOffender.split("\n");
    const found = lines.some((l, i) => {
      const m = l.match(/^(\s*)run:\s*\|\s*$/);
      if (!m) return false;
      const indent = m[1].length;
      const body = [];
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === "") continue;
        if (lines[j].match(/^(\s*)/)[1].length <= indent) break;
        body.push(lines[j]);
      }
      return body.join("\n").includes("${{ steps.check.outputs.reason }}");
    });
    expect(found).toBe(true);
  });
});

describe("claude-codex-watcher.yml — permissions stay inside the watcher's authority", () => {
  it("no job requests actions:write, admin, or any scope beyond contents/pull-requests", () => {
    const perms = [...yml.matchAll(/permissions:\s*\n((?:\s+\S+:\s*\S+\n?)+)/g)].map((m) => m[1]);
    expect(perms.length).toBeGreaterThan(0);
    for (const block of perms) {
      expect(block).not.toMatch(/actions:\s*write/);
      expect(block).not.toMatch(/administration:/);
      expect(block).not.toMatch(/issues:\s*write/); // this watcher never files/comments on issues
    }
  });
});
