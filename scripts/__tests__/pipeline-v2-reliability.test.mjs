// PIPELINE V2 — runtime failure recovery, pinned against the live Portugal evidence.
//
// Run portugal-20260822-7c041e (#74, 2026-08-22) failed three ways at once and the workflow
// reported none of them. Each claim below is one of those failures, made mechanical:
//
//   · a headless Claude process printed "You've hit your session limit" and exited nonzero, but
//     the step was piped through `tee`, so GitHub recorded the agent step as SUCCESS;
//   · the normal collect/verify path then inspected a PARTIAL workspace and produced a
//     content-gate story about a reconcile that had never finished;
//   · nothing retried, because the retry gate read one ephemeral step output (`void == 'true'`)
//     that an ordinary deterministic gate failure never sets;
//   · and the classification vocabulary let an INVALID ARTIFACT be recorded as `agent-failure`,
//     conflating a rejected artifact with a failed model process.
//
// The exit-status wrapper itself is proven in run-logged-command.test.mjs (a real subprocess);
// this file proves the semantics built on top of it, plus the workflow wiring that joins them.

// @protects-file A failed agent is never a successful stage, an invalid artifact is never a failed agent, and a run that stops says so.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyAgentFailure, hasUsageLimitDiagnostic, retryEligibility, renderStopNotice,
  stopNoticeMarker, alreadyNotified, AUTO_RETRYABLE_CLASSES,
} from "../pipeline/v2/recovery.mjs";
import { FAILURE_CLASSES } from "../pipeline/v2/contracts.mjs";
import { recordStageOutputFailure, escalationReport } from "../pipeline-v2.mjs";
import {
  initRunV2, readRunStateV2, stageStart, stageComplete, stageFail, nextStageV2,
  bumpRunAttempt, recordAutoRetry, V2_ATTEMPT_CAP, V2_AUTO_RETRY_CAP,
} from "../pipeline/v2/run-state.mjs";
import { activeFeedback, recordStageFeedback } from "../pipeline/v2/feedback.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const readRepo = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const WORKFLOW = readRepo(".github/workflows/research-pass-v2.yml").replace(/\r\n?/g, "\n");
const SLUG = "testland";

// The exact line the live reconcile printed before the container exited nonzero.
const SESSION_LIMIT_LINE = "You've hit your session limit · resets 5:40am (UTC)";

let intakeDir;
beforeEach(async () => {
  intakeDir = await mkdtemp(path.join(tmpdir(), "waypoint-v2-reliability-"));
  await mkdir(path.join(intakeDir, SLUG), { recursive: true });
});
afterEach(async () => {
  await rm(intakeDir, { recursive: true, force: true });
});

/** A run whose research reached `stage` with everything before it genuinely complete. */
async function runAt(stage, { landMode = "pr", issue = null } = {}) {
  await initRunV2(SLUG, { intakeDir, issue, landMode });
  for (const s of ["scaffold", "passA", "passB", "reconcile", "critic"]) {
    if (s === stage) break;
    await stageStart(SLUG, s, { intakeDir });
    await stageComplete(SLUG, s, { intakeDir });
  }
  await bumpRunAttempt(SLUG, { intakeDir });
  await stageStart(SLUG, stage, { intakeDir });
  return readRunStateV2(SLUG, { intakeDir });
}

async function failWith(stage, failureClass, { findings = [] } = {}) {
  const state = await readRunStateV2(SLUG, { intakeDir });
  if (findings.length) {
    await recordStageFeedback(SLUG, { runId: state.runId, stage, attempt: state.stages[stage].attempts, findings, intakeDir });
  }
  await stageFail(SLUG, stage, { failureClass, detail: `${failureClass} in test`, intakeDir });
  return readRunStateV2(SLUG, { intakeDir });
}

const decide = async (state, stage) =>
  retryEligibility(state, { stage, findings: await activeFeedback(SLUG, { runId: state.runId, stage, intakeDir }) });

// ── D · the interrupted Claude process ───────────────────────────────────────

describe("D — a session-limit interruption is a usage-limit, and only from a failed process", () => {
  it("classifies the live Portugal diagnostic as usage-limit when the process ALSO exited nonzero", () => {
    const verdict = classifyAgentFailure({ agentConclusion: "failure", agentOutput: `working…\n${SESSION_LIMIT_LINE}\n` });
    expect(verdict.class).toBe("usage-limit");
    expect(verdict.detail).toMatch(/session limit/i);
  });

  it("never promotes the diagnostic on a process that RETURNED — the text alone proves nothing", () => {
    // The captured log is research output too: a page or a prompt could quote this phrase.
    expect(classifyAgentFailure({ agentConclusion: "success", agentOutput: SESSION_LIMIT_LINE }).class).toBe("unknown");
    expect(classifyAgentFailure({ agentConclusion: "", agentOutput: SESSION_LIMIT_LINE }).class).toBe("unknown");
  });

  it("a nonzero process without an interruption diagnostic is agent-failure; cancellation is cancelled", () => {
    expect(classifyAgentFailure({ agentConclusion: "failure", agentOutput: "Error: boom" }).class).toBe("agent-failure");
    expect(classifyAgentFailure({ agentConclusion: "cancelled", agentOutput: "" }).class).toBe("cancelled");
  });

  it("an unattributed control-plane failure is `unknown`, never `gate-failure` (no validator ruled)", () => {
    expect(classifyAgentFailure({ agentConclusion: "skipped" }).class).toBe("unknown");
    expect(classifyAgentFailure({}).class).toBe("unknown");
  });

  it("the process plane can NEVER mint an artifact verdict", () => {
    for (const conclusion of ["failure", "cancelled", "success", "skipped", ""]) {
      const cls = classifyAgentFailure({ agentConclusion: conclusion, agentOutput: SESSION_LIMIT_LINE }).class;
      expect(FAILURE_CLASSES).toContain(cls);
      expect(["gate-failure", "void-run"]).not.toContain(cls);
    }
  });

  it("recognizes the CLI's interruption wordings, not arbitrary prose", () => {
    expect(hasUsageLimitDiagnostic(SESSION_LIMIT_LINE)).toBe(true);
    expect(hasUsageLimitDiagnostic("Claude usage limit reached")).toBe(true);
    expect(hasUsageLimitDiagnostic("the venue limits sessions to 90 minutes")).toBe(false);
    expect(hasUsageLimitDiagnostic("")).toBe(false);
  });
});

// ── B · C · E · the workflow boundary ────────────────────────────────────────

describe("B/C/E — the workflow observes the PRODUCER, and partial output stays out of the success path", () => {
  const agentSteps = WORKFLOW.split("- name: Run research agent —").slice(1);

  it("has exactly four headless Claude invocations — Pass A, Pass B, reconcile, critic", () => {
    expect(agentSteps).toHaveLength(4);
    expect(WORKFLOW.match(/@anthropic-ai\/claude-code@/g)).toHaveLength(4);
  });

  it("every one runs through the exit-integrity wrapper, and none is piped to tee", () => {
    for (const step of agentSteps) {
      const block = step.split("- name:")[0];
      expect(block).toContain('bash "$GITHUB_WORKSPACE/scripts/run-logged-command.sh" "$RUNNER_TEMP/agent-output.log"');
      expect(block).toContain("docker run --rm");
      // The exact defect: the pipeline observed tee rather than the Claude process.
      expect(block).not.toMatch(/\|\s*tee\s+"\$RUNNER_TEMP\/agent-output\.log"/);
    }
  });

  it("preserves the hardened invocation — pinned container, HOME=/tmp, safe mode, no session persistence, allow+deny lists", () => {
    for (const step of agentSteps) {
      const block = step.split("- name:")[0];
      expect(block).toContain("node:22-bookworm-slim@sha256:d649c27dae7ba0137b3cef5dd75baa422c08dc3d9e3fc0c23dfb172dc3cc6436");
      expect(block).toContain("-e HOME=/tmp");
      expect(block).toContain("--safe-mode");
      expect(block).toContain("--no-session-persistence");
      expect(block).toContain('--allowedTools "$WP_TOOLS"');
      expect(block).toContain('--disallowedTools "$WP_DENY"');
      expect(block).toContain('--model "$WP_MODEL"');
      expect(block).toContain('--effort "$WP_EFFORT"');
      // Credential isolation: only the OAuth token crosses into the container.
      expect(block).not.toContain("GITHUB_TOKEN");
    }
  });

  it("E — the collect/verify path is explicitly gated on the agent process having returned cleanly", () => {
    const gated = WORKFLOW.match(/if: success\(\) && steps\.agent\.outcome == 'success'/g) || [];
    expect(gated).toHaveLength(3); // Pass A, Pass B, reconcile
    // The critic carries ONE additional admission, and it is not a loosening: an evidence-owner
    // routed replay runs no agent at all, so there is no agent outcome to require and no partial
    // agent output to admit. Nothing else may widen the gate — a partial agent workspace still
    // cannot reach the success path.
    const critic = WORKFLOW.split(/^ {2}critic:$/m)[1].split(/^ {2}land:$/m)[0];
    expect(critic).toContain(
      "if: success() && (steps.agent.outcome == 'success' || steps.begin.outputs.replay == 'true')");
  });

  it("E — the always() control-plane checkout and the failure record still run, with their own npm ci", () => {
    // Portugal's masked failure meant these paths had never executed: with exit integrity
    // restored the finish step is SKIPPED on an agent failure, so the recording step is the
    // first thing to touch collect/ and must install its own dependencies.
    const recordSteps = WORKFLOW.split("- name: Record agent failure honestly").slice(1);
    expect(recordSteps).toHaveLength(4);
    for (const step of recordSteps) {
      const block = step.split("- name:")[0];
      expect(block).toMatch(/if: \(failure\(\) \|\| cancelled\(\)\)/);
      expect(block).toContain("npm ci");
      expect(block).toContain("record-agent-failure");
      expect(block).toContain('--agent-conclusion "${{ steps.agent.conclusion }}"');
      expect(block).toContain('--agent-log "$RUNNER_TEMP/agent-output.log"');
    }
    expect((WORKFLOW.match(/if: always\(\)/g) || []).length).toBeGreaterThanOrEqual(4);
  });

  it("classification is one implementation — no stage re-derives it in inline bash", () => {
    expect(WORKFLOW).not.toContain("CLASS=agent-failure");
    expect(WORKFLOW).not.toContain('grep -q "hit your session limit"');
  });
});

// ── F · G · the artifact plane ───────────────────────────────────────────────

describe("F/G — finish-stage judges an ARTIFACT, so it can never say agent-failure", () => {
  it("F — invalid but dirty stage output is a gate-failure", async () => {
    await runAt("reconcile");
    const { failureClass } = await recordStageOutputFailure(SLUG, "reconcile", {
      problems: ["evidence record e-3 has no verifiedOn", "coverage ref points at a missing group file"],
      changed: [`src/content/guides/${SLUG}/03-food.json`],
      intakeDir,
    });
    expect(failureClass).toBe("gate-failure");
    const state = await readRunStateV2(SLUG, { intakeDir });
    expect(state.stages.reconcile.failure.class).toBe("gate-failure");
    expect(state.failure.class).toBe("gate-failure");
  });

  it("F — scope-invalid output is a gate-failure too, not a failed agent", async () => {
    await runAt("passA");
    const { failureClass } = await recordStageOutputFailure(SLUG, "passA", {
      problems: [`stage passA touched forbidden path src/styles/base.css`],
      changed: ["src/styles/base.css"],
      intakeDir,
    });
    expect(failureClass).toBe("gate-failure");
  });

  it("G — no owned output at all is a void-run", async () => {
    await runAt("passA");
    const { failureClass, isVoid } = await recordStageOutputFailure(SLUG, "passA", {
      problems: [`Pass A owes the evidence artifact: guides-intake/${SLUG}/evidence.v2.json`],
      changed: [],
      intakeDir,
    });
    expect(failureClass).toBe("void-run");
    expect(isVoid).toBe(true);
    expect((await readRunStateV2(SLUG, { intakeDir })).stages.passA.failure.class).toBe("void-run");
  });

  it("a dirty invalid artifact can NEVER become agent-failure, whatever the findings say", async () => {
    await runAt("critic");
    const { failureClass } = await recordStageOutputFailure(SLUG, "critic", {
      problems: ["the agent failed to do its job", "agent-failure"], // hostile finding text
      changed: [`guides-intake/${SLUG}/ledger.md`],
      intakeDir,
    });
    expect(failureClass).not.toBe("agent-failure");
    expect(failureClass).toBe("gate-failure");
  });

  it("the findings the retry needs are recorded with the failure, scoped to this stage", async () => {
    await runAt("reconcile");
    await recordStageOutputFailure(SLUG, "reconcile", {
      problems: ["coverage.v2.json is missing"], changed: [`guides-intake/${SLUG}/ledger.md`], intakeDir,
    });
    const state = await readRunStateV2(SLUG, { intakeDir });
    expect(await activeFeedback(SLUG, { runId: state.runId, stage: "reconcile", intakeDir })).toEqual(["coverage.v2.json is missing"]);
    expect(await activeFeedback(SLUG, { runId: state.runId, stage: "passA", intakeDir })).toEqual([]);
  });

  it("a recorded gate verdict is NOT overwritten by the coarser process-plane observation", async () => {
    // The critic job records the agent failure unconditionally; stageFail must leave the
    // existing, more specific verdict alone rather than downgrading it.
    await runAt("critic");
    await recordStageOutputFailure(SLUG, "critic", { problems: ["ledger owes an artifact"], changed: ["x"], intakeDir });
    const process = classifyAgentFailure({ agentConclusion: "success" });
    await stageFail(SLUG, "critic", { failureClass: process.class, detail: process.detail, intakeDir });
    expect((await readRunStateV2(SLUG, { intakeDir })).stages.critic.failure.class).toBe("gate-failure");
  });
});

// ── H–N · retry eligibility, decided by the durable record ───────────────────

describe("H/I/J — an actionable gate failure repairs itself, on the SAME run", () => {
  it("H — gate-failure with findings and budget is auto-retryable", async () => {
    const state = await runAt("reconcile");
    expect(state.stages.passA.status).toBe("complete");
    const failed = await failWith("reconcile", "gate-failure", { findings: ["coverage.v2.json is missing"] });
    const decision = await decide(failed, "reconcile");
    expect(decision.allowed).toBe(true);
    expect(decision.failureClass).toBe("gate-failure");
    expect(decision.findingCount).toBe(1);
  });

  it("H — a void run with validator findings is auto-retryable too, and nothing else is", async () => {
    await runAt("passA");
    const failed = await failWith("passA", "void-run", { findings: ["Pass A owes evidence.v2.json"] });
    expect((await decide(failed, "passA")).allowed).toBe(true);
    expect(AUTO_RETRYABLE_CLASSES).toEqual(["gate-failure", "void-run"]);
  });

  it("I/J — the repair preserves runId, branch inputs, landMode and every completed stage", async () => {
    const before = await runAt("reconcile", { landMode: "pr" });
    const failed = await failWith("reconcile", "gate-failure", { findings: ["fix the coverage refs"] });
    expect((await decide(failed, "reconcile")).allowed).toBe(true);
    await recordAutoRetry(SLUG, { intakeDir });

    const after = await readRunStateV2(SLUG, { intakeDir });
    expect(after.runId).toBe(before.runId);          // same run — never a fresh one
    expect(after.landMode).toBe("pr");               // immutable landing intent
    expect(after.inputs).toEqual(before.inputs);     // same intake/model/effort
    expect(after.stages.passA.status).toBe("complete");
    expect(after.stages.passB.status).toBe("complete");
    // J — the resume point is the FAILED stage, so expensive completed research is skipped.
    expect(nextStageV2(after)).toBe("reconcile");
    expect(after.resume.nextStage).toBe("reconcile");
    // I — attempt-1's findings survive into attempt 2.
    expect(await activeFeedback(SLUG, { runId: after.runId, stage: "reconcile", intakeDir })).toEqual(["fix the coverage refs"]);
    expect(after.stages.reconcile.history.length).toBeGreaterThanOrEqual(1);
  });
});

describe("K/L/M/N — everything else fails closed", () => {
  it("K — a usage-limit interruption refunds quality budget but never auto-retries into the same exhausted window", async () => {
    await runAt("reconcile");
    const failed = await failWith("reconcile", "usage-limit", { findings: ["partial reconcile"] });
    const decision = await decide(failed, "reconcile");
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("usage-limit");
    expect(decision.recovery).toMatch(/usage window/i);
    expect(failed.attempts.total).toBe(0);
    expect(failed.attempts.autoRetries).toBe(0);
  });

  it("L — a true agent-failure never blindly retries", async () => {
    await runAt("passB");
    const failed = await failWith("passB", "agent-failure", { findings: ["container died"] });
    const decision = await decide(failed, "passB");
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("never auto-retryable");
  });

  it("L — cancellation and unclassified control-plane failures stop as well", async () => {
    for (const cls of ["cancelled", "unknown"]) {
      await rm(path.join(intakeDir, SLUG), { recursive: true, force: true });
      await mkdir(path.join(intakeDir, SLUG), { recursive: true });
      await runAt("critic");
      const failed = await failWith("critic", cls, { findings: ["something"] });
      expect((await decide(failed, "critic")).allowed).toBe(false);
    }
  });

  it("M — a repairable class with NO actionable feedback fails closed (a blind retry re-spends research)", async () => {
    await runAt("reconcile");
    const failed = await failWith("reconcile", "gate-failure"); // no findings recorded
    const decision = await decide(failed, "reconcile");
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/no actionable validator feedback/);
  });

  it("M — a stage that is not RECORDED failed is not retryable, whatever the workflow thinks", async () => {
    const running = await runAt("reconcile");
    expect(retryEligibility(running, { stage: "reconcile", findings: ["x"] }).allowed).toBe(false);
  });

  it("M — corrupt/absent run state is never a licence to retry", () => {
    expect(retryEligibility(null, { stage: "reconcile", findings: ["x"] }).allowed).toBe(false);
    expect(retryEligibility(null, {}).reason).toMatch(/no durable V2 run state/);
  });

  it("N — the automatic repair budget stops the loop across dispatches", async () => {
    await runAt("reconcile");
    const failed = await failWith("reconcile", "gate-failure", { findings: ["fix it"] });
    expect((await decide(failed, "reconcile")).allowed).toBe(true);
    // Attempt 1's repair is spent…
    await recordAutoRetry(SLUG, { intakeDir });
    const spent = await readRunStateV2(SLUG, { intakeDir });
    expect(spent.attempts.autoRetries).toBe(V2_AUTO_RETRY_CAP);
    // …so the identical failure on the next dispatch escalates instead of looping.
    const again = await decide(spent, "reconcile");
    expect(again.allowed).toBe(false);
    expect(again.reason).toMatch(/automatic repair budget exhausted/);
  });

  it("N — the attempt cap stops it too, and the caps are the authorized ones", async () => {
    expect(V2_ATTEMPT_CAP).toBe(5);
    expect(V2_AUTO_RETRY_CAP).toBe(1);
    await runAt("reconcile");
    const failed = await failWith("reconcile", "gate-failure", { findings: ["fix it"] });
    const exhausted = { ...failed, attempts: { ...failed.attempts, total: V2_ATTEMPT_CAP } };
    expect(retryEligibility(exhausted, { stage: "reconcile", findings: ["fix it"] }).allowed).toBe(false);
    const stuck = { ...failed, status: "stuck" };
    expect(retryEligibility(stuck, { stage: "reconcile", findings: ["fix it"] }).allowed).toBe(false);
  });

  it("a refusal must not spend the repair budget a later failure is owed", async () => {
    // The old command incremented unconditionally; a usage-limit stop would then have consumed
    // the one retry that a genuinely repairable gate failure needed.
    await runAt("reconcile");
    const failed = await failWith("reconcile", "usage-limit", { findings: ["partial"] });
    expect((await decide(failed, "reconcile")).allowed).toBe(false);
    expect((await readRunStateV2(SLUG, { intakeDir })).attempts.autoRetries).toBe(0);
  });
});

describe("the retry gate is wired to durable state, not to an ephemeral boolean", () => {
  it("no stage keys its retry on steps.*.outputs.void or inputs.void_retry any more", () => {
    expect(WORKFLOW).not.toContain("outputs.void == 'true'");
    expect(WORKFLOW).not.toContain("format('{0}', inputs.void_retry) != 'true'");
    // The input itself stays for compatibility with an in-flight re-dispatch.
    expect(WORKFLOW).toContain("void_retry:");
  });

  it("every stage asks the state machine, on failure, naming its own stage", () => {
    const retries = WORKFLOW.split("- name: Bounded automatic repair retry").slice(1);
    expect(retries).toHaveLength(4);
    for (const [i, stage] of ["passA", "passB", "reconcile", "critic"].entries()) {
      const block = retries[i].split("- name:")[0];
      expect(block).toContain("if: failure()");
      expect(block).toContain(`auto-retry --slug "$SLUG" --stage ${stage}`);
    }
  });

  it("the re-dispatch carries the same slug, so setup resumes the same run", () => {
    const redispatches = WORKFLOW.split("- name: Re-dispatch the repair attempt once").slice(1);
    expect(redispatches).toHaveLength(4);
    for (const step of redispatches) {
      const block = step.split("- name:")[0];
      expect(block).toContain("if: failure() && steps.retry.outputs.allowed == 'true'");
      expect(block).toContain('-f slug="$SLUG"');
      expect(block).toContain('--ref "${{ github.ref_name }}"');
    }
  });
});

// ── O · the visible stop ─────────────────────────────────────────────────────

describe("O — a run that stops creates a visible recovery surface", () => {
  it("names slug, run, stage, class, finding count, why there was no retry, and the safe action", async () => {
    await runAt("reconcile", { issue: "74" });
    const failed = await failWith("reconcile", "usage-limit", { findings: ["partial reconcile output"] });
    const report = await escalationReport(SLUG, { stage: "reconcile", intakeDir });

    expect(report.issue).toBe("74");
    for (const fact of [SLUG, failed.runId, "reconcile", "usage-limit"]) {
      expect(report.body).toContain(fact);
      expect(report.actionsError).toContain(fact);
    }
    expect(report.body).toContain("Why it did not retry itself");
    expect(report.body).toContain("Safe recovery");
    expect(report.actionsError).toMatch(/STOPPED/);
    expect(report.actionsError).not.toContain("\n"); // one Actions annotation, one line
    expect(report.decision.allowed).toBe(false);
  });

  it("reports honestly when the durable record itself cannot be read", async () => {
    await writeFile(path.join(intakeDir, SLUG, "run.v2.json"), "{ not json");
    const report = await escalationReport(SLUG, { stage: "reconcile", intakeDir });
    expect(report.decision.allowed).toBe(false);
    expect(report.body).toMatch(/could not be read/);
    expect(report.decision.recovery).toMatch(/restore/i);
  });

  it("does not post twice for the same terminal failure", async () => {
    await runAt("reconcile", { issue: "74" });
    await failWith("reconcile", "agent-failure", { findings: ["died"] });
    const first = await escalationReport(SLUG, { stage: "reconcile", intakeDir });
    const second = await escalationReport(SLUG, { stage: "reconcile", intakeDir });
    expect(second.marker).toBe(first.marker);
    expect(alreadyNotified([first.body], second.marker)).toBe(true);
    // A different failure on the same run is a different observation and DOES get reported.
    const other = stopNoticeMarker({ runId: first.runId, stage: "critic", failureClass: "agent-failure", attempt: 1 });
    expect(alreadyNotified([first.body], other)).toBe(false);
  });

  it("renders a usable notice even with no run state at all — an honest blank, not a crash", () => {
    const decision = retryEligibility(null, {});
    const notice = renderStopNotice({ slug: SLUG, state: null, decision });
    expect(notice.body).toContain(SLUG);
    expect(notice.body).toContain("(no run state)");
    expect(notice.actionsError).toContain("STOPPED");
    expect(notice.marker).toContain("waypoint-v2-stop");
  });

  it("a traveler-question comment is never the only signal — the Actions error is unconditional", () => {
    const escalations = WORKFLOW.split("- name: Escalate — this run stopped and needs a human").slice(1);
    expect(escalations).toHaveLength(4);
    for (const step of escalations) {
      const block = step.split("- name:")[0];
      // Both stop shapes reach it: a refused repair, and an eligible repair whose re-dispatch
      // failed (B2 — the reservation is spent and no repair run exists).
      expect(block).toContain("steps.retry.outputs.allowed != 'true'");
      expect(block).toContain("escalate --slug");
    }
    expect(readRepo("scripts/pipeline-v2.mjs")).toContain("::error::");
  });
});

// ── B1 · B2 · the live boundaries the escalation actually crosses ────────────
// Codex review on PR #75. Both are the Boundary Checks class: code meeting a system it does
// not control (GitHub's permission model; the Actions dispatch API), where every unit test
// upstream was green and would have stayed green.

describe("B1 — every job that can escalate is actually permitted to comment", () => {
  // COMMENTS ARE STRIPPED FIRST, deliberately: the prose explaining why the grant is needed
  // contains the very string being asserted, so a comment-blind substring check passes even
  // with the real grant deleted. (Caught by forcing the failure path on this guard itself.)
  const CODE = WORKFLOW.split("\n").filter((line) => !/^\s*#/.test(line)).join("\n");
  const jobs = CODE.split(/\n {2}(?=[a-zA-Z_][a-zA-Z0-9_-]*:\n)/);

  /** The scopes a job's own permissions block actually grants. */
  const grants = (job) => {
    const block = job.split(/^ {4}permissions:$/m)[1] || "";
    return block.split("\n").slice(1)
      .filter((line) => /^ {6}\S/.test(line))
      .map((line) => line.trim());
  };

  it("a job-level permissions block sets omitted scopes to none, so each stage job grants issues: write", () => {
    const escalating = jobs.filter((job) => job.includes("escalate --slug"));
    expect(escalating.length).toBe(4); // passA, passB, reconcile, critic
    for (const job of escalating) {
      const scopes = grants(job);
      expect(scopes).toContain("issues: write");   // the escalation surface
      expect(scopes).toContain("contents: write");
      expect(scopes).toContain("actions: write");  // the re-dispatch still needs it
      expect(scopes).not.toContain("pull-requests: write"); // least privilege: not this job's job
    }
  });

  it("the issue permission is NEVER exposed to the Claude container", () => {
    for (const step of WORKFLOW.split("- name: Run research agent —").slice(1)) {
      const block = step.split("- name:")[0];
      for (const secret of ["GH_TOKEN", "GITHUB_TOKEN", "github.token"]) {
        expect(block).not.toContain(secret);
      }
      // Only the OAuth token is forwarded into the container's environment.
      const forwarded = [...block.matchAll(/-e ([A-Z_]+)/g)].map((m) => m[1]);
      expect(forwarded).toContain("CLAUDE_CODE_OAUTH_TOKEN");
      expect(forwarded.filter((v) => /TOKEN/.test(v))).toEqual(["CLAUDE_CODE_OAUTH_TOKEN"]);
    }
  });

  it("inside the stage jobs, only the two steps that shell out to gh hold GH_TOKEN", () => {
    // Scoped to the jobs this change touches; `setup`'s long-standing job-level grant (it files
    // the stuck issue) is not in scope here.
    for (const job of jobs.filter((j) => j.includes("escalate --slug"))) {
      const holders = job.split("- name:").filter((s) => s.includes("GH_TOKEN: ${{ github.token }}"));
      expect(holders).toHaveLength(2);
      for (const step of holders) expect(step).toMatch(/gh workflow run|pipeline-v2\.mjs escalate/);
      // The grant is per-step, never hoisted to the job where the agent step would inherit it.
      expect(job.split(/^ {4}steps:$/m)[0]).not.toContain("GH_TOKEN");
    }
  });
});

describe("B2 — an eligible repair whose re-dispatch FAILS is still a visible stop", () => {
  it("the workflow routes a failed re-dispatch into the escalation step", () => {
    const redispatches = WORKFLOW.split("- name: Re-dispatch the repair attempt once").slice(1);
    expect(redispatches).toHaveLength(4);
    for (const step of redispatches) {
      const block = step.split("- name:")[0];
      expect(block).toContain("id: redispatch");
      // Without this the job's failure would short-circuit the escalation step entirely.
      expect(block).toContain("continue-on-error: true");
    }
    const escalations = WORKFLOW.split("- name: Escalate — this run stopped and needs a human").slice(1);
    expect(escalations).toHaveLength(4);
    for (const step of escalations) {
      const block = step.split("- name:")[0];
      expect(block).toContain("steps.redispatch.outcome == 'failure'");
      expect(block).toContain(`--dispatch-failed "${"${{"} steps.redispatch.outcome == 'failure' }}"`);
    }
  });

  it("escalates on refusal OR failed dispatch, and stays silent when the repair really launched", () => {
    // The step's own condition, evaluated as the truth table it encodes. Case 4 in the review:
    // an eligible repair that DID dispatch must not file a stop notice.
    const condition = (allowed, redispatchOutcome) =>
      allowed !== "true" || redispatchOutcome === "failure";
    expect(condition("false", "skipped")).toBe(true);  // 3 · refused            → escalate
    expect(condition("", "skipped")).toBe(true);       //     retry step crashed → escalate
    expect(condition("true", "success")).toBe(false);  // 4 · repair launched    → silent
    expect(condition("true", "failure")).toBe(true);   // 5 · dispatch failed    → escalate

    for (const step of WORKFLOW.split("- name: Escalate — this run stopped and needs a human").slice(1)) {
      // The B2 branch survives B3's widening of the outer status guard (see the B3 block).
      expect(step.split("- name:")[0])
        .toContain("(steps.retry.outputs.allowed != 'true' || steps.redispatch.outcome == 'failure')");
    }
  });

  it("introduces no new automatic retry loop — one dispatch per stage, and escalation never dispatches", () => {
    expect(WORKFLOW.match(/gh workflow run research-pass-v2\.yml/g)).toHaveLength(4); // one per stage
    for (const step of WORKFLOW.split("- name: Escalate — this run stopped and needs a human").slice(1)) {
      const block = step.split("- name:")[0];
      expect(block).not.toContain("gh workflow run");
      expect(block).not.toContain("auto-retry");
    }
    // The reservation is spent once and never rolled back — no rollback path exists to race.
    expect(readRepo("scripts/pipeline-v2.mjs")).not.toMatch(/autoRetries\s*-[-=]/);
  });

  it("reports the dispatch failure truthfully — never as exhausted budget, never as a launched repair", async () => {
    await runAt("reconcile", { issue: "74" });
    await failWith("reconcile", "gate-failure", { findings: ["coverage refs unresolved"] });
    // Eligibility said yes and the reservation was consumed…
    expect((await decide(await readRunStateV2(SLUG, { intakeDir }), "reconcile")).allowed).toBe(true);
    await recordAutoRetry(SLUG, { intakeDir });
    // …then `gh workflow run` failed. Re-deriving eligibility now would read the SPENT budget.
    const spent = await readRunStateV2(SLUG, { intakeDir });
    expect(retryEligibility(spent, { stage: "reconcile", findings: ["x"] }).reason).toMatch(/budget exhausted/);

    const report = await escalationReport(SLUG, { stage: "reconcile", intakeDir, dispatchFailed: true });
    expect(report.decision.allowed).toBe(false);
    expect(report.decision.reason).toMatch(/re-dispatch itself failed/);
    expect(report.decision.reason).toMatch(/no repair run was created/);
    expect(report.decision.reason).not.toMatch(/budget exhausted/);
    expect(report.body).toContain("reconcile");
    expect(report.body).toContain("gate-failure");
    expect(report.decision.recovery).toMatch(/SAME slug/);
    expect(report.actionsError).toMatch(/STOPPED/);
  });

  it("the dispatch-failure notice is a DIFFERENT observation from a plain refusal", async () => {
    await runAt("reconcile", { issue: "74" });
    await failWith("reconcile", "gate-failure", { findings: ["fix"] });
    const refused = await escalationReport(SLUG, { stage: "reconcile", intakeDir });
    const failedDispatch = await escalationReport(SLUG, { stage: "reconcile", intakeDir, dispatchFailed: true });
    expect(failedDispatch.marker).not.toBe(refused.marker);
    expect(alreadyNotified([refused.body], failedDispatch.marker)).toBe(false);
    // …but each still dedupes against itself on a repeated observation.
    const again = await escalationReport(SLUG, { stage: "reconcile", intakeDir, dispatchFailed: true });
    expect(alreadyNotified([failedDispatch.body], again.marker)).toBe(true);
  });

  it("a failed re-dispatch moves neither publication nor landing authority", async () => {
    await runAt("reconcile", { landMode: "pr" });
    await failWith("reconcile", "gate-failure", { findings: ["fix"] });
    await recordAutoRetry(SLUG, { intakeDir });
    await escalationReport(SLUG, { stage: "reconcile", intakeDir, dispatchFailed: true });
    const state = await readRunStateV2(SLUG, { intakeDir });
    expect(state.publication.published).toBe(false);
    expect(state.publication.publishedAt).toBeNull();
    expect(state.landMode).toBe("pr");
    expect(state.landing.outcome).toBe("pending");
    // The run is still resumable at exactly the failed stage.
    expect(nextStageV2(state)).toBe("reconcile");
  });
});

// ── B3 · cancellation must reach the visible stop, not fall through it ───────
// Codex re-review on PR #75. GitHub Actions' status functions are DISJOINT: on a cancelled run
// `failure()` is false. `Record agent failure honestly` already used `(failure() || cancelled())`
// and so durably recorded `cancelled` — but the retry decision and the escalation were gated on
// `failure()` alone, so the contract's own matrix row (cancelled → stop + escalate) had no
// escalation behind it. Another silent strand, in a class the matrix claimed was covered.

describe("B3 — a cancelled run stops VISIBLY and never auto-repairs", () => {
  // The three step conditions, modelled exactly as the YAML writes them. Each is pinned against
  // the workflow text below, so this table cannot drift away from what actually ships.
  const retryRuns = (failed, cancelledRun) => failed || cancelledRun;
  const redispatchRuns = (failed, cancelledRun, allowed) => failed && allowed === "true";
  const escalateRuns = (failed, cancelledRun, allowed, redispatch) =>
    (failed || cancelledRun) && (allowed !== "true" || redispatch === "failure");

  it("the workflow's real conditions are the ones this table models", () => {
    const retries = WORKFLOW.split("- name: Bounded automatic repair retry").slice(1);
    const redispatches = WORKFLOW.split("- name: Re-dispatch the repair attempt once").slice(1);
    const escalations = WORKFLOW.split("- name: Escalate — this run stopped and needs a human").slice(1);
    expect([retries.length, redispatches.length, escalations.length]).toEqual([4, 4, 4]);
    for (const step of retries) expect(step.split("- name:")[0]).toContain("if: failure() || cancelled()");
    for (const step of escalations) {
      expect(step.split("- name:")[0])
        .toContain("if: (failure() || cancelled()) && (steps.retry.outputs.allowed != 'true' || steps.redispatch.outcome == 'failure')");
    }
    // (3) The DISPATCH condition stays narrow — a cancelled run must never launch a repair.
    for (const step of redispatches) {
      const block = step.split("- name:")[0];
      expect(block).toContain("if: failure() && steps.retry.outputs.allowed == 'true'");
      expect(block).not.toContain("cancelled()");
    }
  });

  it("cancelled → the decision is reached, refused, and the escalation runs; no dispatch", () => {
    // A cancelled run: failure()=false, cancelled()=true. `allowed` is 'false' because the state
    // machine refuses the class (proven behaviorally below).
    expect(retryRuns(false, true)).toBe(true);          // the decision is REACHED …
    expect(redispatchRuns(false, true, "false")).toBe(false); // … no automatic repair launches …
    expect(escalateRuns(false, true, "false", "skipped")).toBe(true); // … and the stop is visible.
    // What this replaces: the pre-B3 gates keyed on failure() alone, which is FALSE here — both
    // the decision and the escalation were skipped, stranding the run with no notice.
    const preB3RetryRuns = (failed) => failed;
    const preB3EscalateRuns = (failed, allowed) => failed && allowed !== "true";
    expect(preB3RetryRuns(false)).toBe(false);
    expect(preB3EscalateRuns(false, "false")).toBe(false);
  });

  it("cancellation still can't dispatch even if `allowed` were somehow true (defence in depth)", () => {
    expect(redispatchRuns(false, true, "true")).toBe(false);
    expect(escalateRuns(false, true, "true", "skipped")).toBe(false);
  });

  it("the ordinary failure paths are unchanged by B3", () => {
    expect(escalateRuns(true, false, "false", "skipped")).toBe(true);  // refused      → escalate
    expect(escalateRuns(true, false, "true", "success")).toBe(false);  // launched     → silent
    expect(escalateRuns(true, false, "true", "failure")).toBe(true);   // B2 dispatch  → escalate
    expect(redispatchRuns(true, false, "true")).toBe(true);
  });

  it("end to end: a cancelled agent records `cancelled`, is refused, and yields a stop notice", async () => {
    await runAt("reconcile", { issue: "74" });
    // The workflow's record step classifies the cancelled process…
    const verdict = classifyAgentFailure({ agentConclusion: "cancelled", agentOutput: "" });
    expect(verdict.class).toBe("cancelled");
    await stageFail(SLUG, "reconcile", { failureClass: verdict.class, detail: verdict.detail, intakeDir });
    const state = await readRunStateV2(SLUG, { intakeDir });
    expect(state.stages.reconcile.failure.class).toBe("cancelled");

    // …the state machine refuses it (no budget spent)…
    const decision = await decide(state, "reconcile");
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("never auto-retryable");
    expect((await readRunStateV2(SLUG, { intakeDir })).attempts.autoRetries).toBe(0);

    // …and the escalation has a real notice to file.
    const report = await escalationReport(SLUG, { stage: "reconcile", intakeDir });
    expect(report.issue).toBe("74");
    expect(report.body).toContain("cancelled");
    expect(report.actionsError).toMatch(/STOPPED/);
    expect(report.decision.recovery).toBeTruthy();
    // The run is untouched and resumable at the cancelled stage.
    const after = await readRunStateV2(SLUG, { intakeDir });
    expect(nextStageV2(after)).toBe("reconcile");
    expect(after.publication.published).toBe(false);
    expect(after.landMode).toBe("pr");
  });
});

// ── the retry-authority invariant, re-checked independently ──────────────────
// Codex's non-blocking note on PR #75: the YAML suppresses the visible stop whenever
// `allowed=true`, so it trusts retryEligibility() completely. A regression that let a
// never-retryable class through would strand a run silently — the exact failure this pass
// exists to remove. `auto-retry` therefore re-checks the invariant against the DURABLE record
// before emitting a yes, as a separate predicate rather than a shared branch.

describe("retry authority — a `yes` must always be able to name an auto-retryable recorded class", () => {
  it("the guard is a second, independent read of the durable record", () => {
    const source = readRepo("scripts/pipeline-v2.mjs");
    const block = source.split("DEFENCE IN DEPTH")[1].split("case \"record-agent-failure\"")[0];
    expect(block).toContain("AUTO_RETRYABLE_CLASSES.includes(recorded)");
    expect(block).toContain("state?.stages?.[decision.stage]?.failure?.class");
    expect(block).toContain("allowed: false");
  });

  it("every class the state machine may approve satisfies the invariant", async () => {
    // The two agree today — this pins that they must, for the whole vocabulary.
    for (const cls of FAILURE_CLASSES) {
      await rm(path.join(intakeDir, SLUG), { recursive: true, force: true });
      await mkdir(path.join(intakeDir, SLUG), { recursive: true });
      await runAt("reconcile");
      const failed = await failWith("reconcile", cls, { findings: ["a finding"] });
      const decision = await decide(failed, "reconcile");
      const recorded = failed.stages.reconcile.failure.class;
      if (decision.allowed) expect(AUTO_RETRYABLE_CLASSES).toContain(recorded);
      else expect(decision.reason).toBeTruthy();
    }
  }, 30_000);

  it("the invariant would catch a disagreement, and its refusal is honest about being a bug", () => {
    // Simulating the regression Codex described: eligibility says yes for a cancelled stage.
    const recorded = "cancelled";
    const wouldRefuse = !AUTO_RETRYABLE_CLASSES.includes(recorded);
    expect(wouldRefuse).toBe(true);
    const source = readRepo("scripts/pipeline-v2.mjs");
    expect(source).toContain("that disagreement is itself the bug");
  });
});

// ── P · Q · authority and publication never move on a failure path ───────────

describe("P/Q — no failure or retry state can move landing authority or publication", () => {
  it("P — a manual dispatch cannot mint auto landing authority, and a repair cannot upgrade it", async () => {
    await runAt("reconcile", { landMode: "pr" });
    await failWith("reconcile", "gate-failure", { findings: ["fix"] });
    await recordAutoRetry(SLUG, { intakeDir });
    expect((await readRunStateV2(SLUG, { intakeDir })).landMode).toBe("pr");
    // The workflow surface still offers no land input to type.
    const inputs = WORKFLOW.split("workflow_dispatch:")[1].split("permissions:")[0];
    expect(inputs).not.toMatch(/^\s+land:/m);
  });

  it("Q — publication stays false through failure, escalation and retry", async () => {
    await runAt("reconcile");
    for (const cls of ["gate-failure", "void-run", "usage-limit", "agent-failure"]) {
      await stageFail(SLUG, "reconcile", { failureClass: cls, intakeDir });
      const state = await readRunStateV2(SLUG, { intakeDir });
      expect(state.publication.published).toBe(false);
      expect(state.publication.publishedAt).toBeNull();
      expect(state.landing.outcome).toBe("pending");
    }
    await recordAutoRetry(SLUG, { intakeDir });
    expect((await readRunStateV2(SLUG, { intakeDir })).publication.published).toBe(false);
  });

  it("Q — a published run is never auto-retried, whatever class is recorded", async () => {
    await runAt("reconcile");
    const failed = await failWith("reconcile", "gate-failure", { findings: ["fix"] });
    const published = { ...failed, publication: { ...failed.publication, published: true } };
    const decision = retryEligibility(published, { stage: "reconcile", findings: ["fix"] });
    expect(decision.allowed).toBe(false);
    expect(decision.recovery).toMatch(/change lifecycle/);
  });
});

// ── R · S · the doctrine and the warm-start contract ─────────────────────────

describe("R — the security-challenge rule is one rule in both skill homes", () => {
  const canonical = readRepo(".claude/skills/waypoint-guide-author/references/research-efficiency.md");
  const mirror = readRepo(".agents/skills/waypoint-guide-author/references/research-efficiency.md");

  it("the two research-efficiency files are byte-identical", () => {
    expect(mirror).toBe(canonical);
  });

  it("states the binding rule, and points at the runtime doc rather than duplicating it", () => {
    const norm = canonical.replace(/\s+/g, " ");
    expect(norm).toMatch(/CAPTCHA/);
    expect(norm).toMatch(/Turnstile/);
    expect(norm).toMatch(/Never attempt one in Claude's embedded browser/);
    expect(norm).toMatch(/source\.access = "blocked"/);
    expect(norm).toMatch(/Never promote a search-result preview to verification/);
    expect(norm).toMatch(/One blocked source never fails the pass/);
    expect(norm).toContain("docs/reference/claude-research-runtime.md");
    // The short binding form, not a copy of the runtime document.
    expect(canonical.split("### Security challenges")[1].split("\n## ")[0].length).toBeLessThan(2000);
  });

  it("the runtime authority it points at exists and separates the three execution planes", () => {
    const runtime = readRepo("docs/reference/claude-research-runtime.md");
    expect(runtime).toMatch(/interactive/i);
    expect(runtime).toMatch(/headless/i);
    expect(runtime).toMatch(/control plane/i);
  });
});
