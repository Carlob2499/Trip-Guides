// PIPELINE V2 — recovery semantics: what a failure IS, whether the run may repair itself, and
// what a human is told when it may not.
//
// THE PORTUGAL SCAR (run portugal-20260822-7c041e, 2026-08-22). Three separate defects had to
// line up for a live reconcile to die silently:
//
//   1. the Claude process printed "You've hit your session limit" and exited nonzero, but the
//      workflow piped it through `| tee`, so the STEP observed tee's zero and reported SUCCESS;
//   2. the normal collect/verify path then inspected a PARTIAL workspace and manufactured a
//      content-gate story about work the model never finished;
//   3. nothing auto-retried, because the retry wiring keyed on one ephemeral boolean
//      (`void == 'true'`) that a deterministic gate failure never sets.
//
// (1) is fixed by scripts/run-logged-command.sh at the workflow boundary. (2) and (3) are fixed
// here, by making the DURABLE run state the only authority on both questions.
//
// The vocabulary is deliberately narrow (contracts.mjs FAILURE_CLASSES) and each class names a
// DIFFERENT plane:
//
//   usage-limit    the Claude process was interrupted by a usage/session window — proven by the
//                  CLI's own printed diagnostic AND a nonzero process, never by one alone.
//   agent-failure  the Claude process itself exited nonzero with no more specific interruption.
//   cancelled      the workflow/process was cancelled.
//   void-run       the model RETURNED but produced no stage-owned output at all.
//   gate-failure   the model RETURNED output and deterministic contract/schema/scope/verification
//                  rules rejected it. Invalid dirty output is THIS, not agent-failure: the model
//                  process succeeded; its artifact did not.
//   unknown        fail-safe for an unclassified control-plane/process failure.

import { FAILURE_CLASSES } from "./contracts.mjs";

/** Classes an automatic repair retry may spend budget on. Both share one precondition, enforced
    below: the model PROCESS returned, and the deterministic validators left actionable findings
    for the retry to work from. A retry with nothing to repair is a blind re-spend. */
export const AUTO_RETRYABLE_CLASSES = Object.freeze(["gate-failure", "void-run", "usage-limit"]);

// The CLI's own printed interruption diagnostics. Machine output, not a guess — and matched only
// against a process that ALSO exited nonzero, so a stray mention in research text can never
// reclassify a healthy run.
const USAGE_LIMIT_DIAGNOSTICS = [
  /hit your session limit/i,
  /session limit reached/i,
  /usage limit reached/i,
  /claude usage limit/i,
];

export function hasUsageLimitDiagnostic(agentOutput) {
  const text = String(agentOutput || "");
  return USAGE_LIMIT_DIAGNOSTICS.some((re) => re.test(text));
}

/** Classify a failure from the AGENT PROCESS's own outcome plus its captured combined output.
    This function is the workflow's plane ONLY: it can never return gate-failure or void-run,
    because those are verdicts on an artifact and only finish-stage may reach them. */
export function classifyAgentFailure({ agentConclusion = "", agentOutput = "" } = {}) {
  const conclusion = String(agentConclusion || "").trim().toLowerCase();
  if (conclusion === "cancelled") {
    return { class: "cancelled", detail: "agent was cancelled; branch resumes this stage" };
  }
  if (conclusion === "failure") {
    if (hasUsageLimitDiagnostic(agentOutput)) {
      return {
        class: "usage-limit",
        detail: "Claude session limit reached mid-stage; re-dispatch after the window resets",
      };
    }
    return { class: "agent-failure", detail: "agent process exited nonzero; branch resumes this stage" };
  }
  // The agent process RETURNED. Whatever failed afterwards is control-plane, and the honest
  // class for an unattributed control-plane failure is unknown — never gate-failure, which
  // asserts a validator verdict nobody produced.
  return {
    class: "unknown",
    detail: "control-plane step failed after the agent returned; branch resumes this stage",
  };
}

function deny(stage, failureClass, findingCount, reason, recovery) {
  return { allowed: false, stage, failureClass, findingCount, reason, recovery };
}

/** May this run repair itself, automatically, right now? Pure over the DURABLE record — the
    ephemeral `void_retry` dispatch input is deliberately not consulted, because a boolean that
    lives only in one dispatch cannot bound a loop across dispatches. `findings` is the ACTIVE
    stage feedback for this runId/stage (feedback.mjs), already scoped by the caller. */
export function retryEligibility(state, { stage = null, findings = [] } = {}) {
  const findingCount = (findings || []).length;
  if (!state) {
    return deny(stage, null, findingCount,
      "no durable V2 run state — retry eligibility is decided by run.v2.json alone",
      "check out the research branch and inspect guides-intake/<slug>/run.v2.json before re-dispatching");
  }
  if (state.publication?.published) {
    return deny(stage, null, findingCount,
      `run ${state.runId} is already published — a published run never auto-retries`,
      "take the change lifecycle (change.yml), not a research retry");
  }
  const failedStage = stage || state.resume?.nextStage || null;
  if (!failedStage) {
    return deny(null, null, findingCount,
      `run ${state.runId} records no failed stage to retry`,
      "re-dispatch research-pass-v2.yml for this slug to re-run the landing gate");
  }
  const st = state.stages?.[failedStage];
  if (!st) {
    return deny(failedStage, null, findingCount,
      `run ${state.runId} has no stage "${failedStage}"`,
      "inspect run.v2.json — a stage set that disagrees with the pipeline is a control-plane integrity failure");
  }
  const failureClass = st.failure?.class || (st.status === "failed" ? state.failure?.class : null) || null;
  if (st.status !== "failed") {
    return deny(failedStage, failureClass, findingCount,
      `stage "${failedStage}" is recorded "${st.status}", not failed — only a recorded failure is retryable`,
      "re-dispatch research-pass-v2.yml; the run resumes at its durable resume point");
  }
  if (!FAILURE_CLASSES.includes(failureClass)) {
    return deny(failedStage, failureClass, findingCount,
      `stage "${failedStage}" failed with an unrecognized class "${failureClass}"`,
      "inspect run.v2.json's failure record; re-dispatch by hand once the cause is understood");
  }
  if (!AUTO_RETRYABLE_CLASSES.includes(failureClass)) {
    return deny(failedStage, failureClass, findingCount,
      `failure class "${failureClass}" is never auto-retryable — only ${AUTO_RETRYABLE_CLASSES.join(" and ")} are`,
      "diagnose the agent/control-plane failure, then re-dispatch research-pass-v2.yml with the same slug");
  }
  if (failureClass === "usage-limit") {
    if ((state.attempts?.availabilityRetries ?? 0) >= (state.attempts?.availabilityRetryCap ?? 0)) {
      return deny(failedStage, failureClass, findingCount,
        `availability recovery budget exhausted (${state.attempts?.availabilityRetries} of ${state.attempts?.availabilityRetryCap})`,
        "wait for account availability, then re-dispatch research-pass-v2.yml deliberately with the same slug");
    }
    if ((state.attempts?.total ?? 0) >= (state.attempts?.cap ?? 0)) {
      return deny(failedStage, failureClass, findingCount,
        `quality attempt budget is already exhausted (${state.attempts?.total} of ${state.attempts?.cap})`,
        "review the run before granting any further research spend");
    }
    return {
      allowed: true, stage: failedStage, failureClass, findingCount, budget: "availability",
      reason: `usage-limit at "${failedStage}" with bounded availability recovery remaining`, recovery: null,
    };
  }
  if (findingCount === 0) {
    return deny(failedStage, failureClass, findingCount,
      `no actionable validator feedback is recorded for ${state.runId}/${failedStage} — a retry with nothing to repair re-spends research blind`,
      "read the run log, fix the cause (or record findings), then re-dispatch research-pass-v2.yml with the same slug");
  }
  if (state.status === "stuck") {
    return deny(failedStage, failureClass, findingCount,
      `run ${state.runId} is stuck at its attempt cap (${state.attempts?.cap})`,
      "review the run's evidence and decide by hand whether it is worth more spend");
  }
  if ((state.attempts?.total ?? 0) >= (state.attempts?.cap ?? 0)) {
    return deny(failedStage, failureClass, findingCount,
      `attempt budget exhausted (${state.attempts?.total} of ${state.attempts?.cap})`,
      "review the run's evidence and decide by hand whether it is worth more spend");
  }
  if ((state.attempts?.autoRetries ?? 0) >= (state.attempts?.autoRetryCap ?? 0)) {
    return deny(failedStage, failureClass, findingCount,
      `automatic repair budget exhausted (${state.attempts?.autoRetries} of ${state.attempts?.autoRetryCap})`,
      "read the recorded findings, repair by hand or re-dispatch research-pass-v2.yml deliberately");
  }
  return {
    allowed: true,
    stage: failedStage,
    failureClass,
    findingCount,
    budget: "quality-repair",
    reason: `${failureClass} at "${failedStage}" with ${findingCount} actionable finding(s) and budget remaining`,
    recovery: null,
  };
}

// ── the visible stop surface ─────────────────────────────────────────────────
// A run that stops without auto-retrying must SAY SO where a human is looking. A traveler-
// question comment is not that signal; neither is a green-looking workflow page.

/** Identity of one terminal observation. Repeated observations of the SAME failure (same run,
    stage, class, attempt and KIND of stop) reuse this marker, so the escalation never spams the
    issue — while a refusal and a failed re-dispatch on the same failure stay distinct notices,
    because they are different events needing different recovery. */
export function stopNoticeMarker({ runId, stage, failureClass, attempt, kind = "refused" }) {
  return `<!-- waypoint-v2-stop:${kind}:${runId}:${stage}:${failureClass || "unknown"}:${attempt ?? 0} -->`;
}

/** THE REPAIR WAS ELIGIBLE AND THE RE-DISPATCH ITSELF FAILED (Codex review B2). The auto-retry
    reservation is already durably consumed and no repair run exists — so this is a stop, and its
    notice must say exactly that. Re-deriving eligibility here would read the now-spent budget and
    report "automatic repair budget exhausted", which reads as though a repair actually launched;
    that is the misreport this function exists to prevent. */
export function dispatchFailedDecision(eligible) {
  return {
    allowed: false,
    kind: "dispatch-failed",
    stage: eligible.stage,
    failureClass: eligible.failureClass,
    findingCount: eligible.findingCount,
    reason: "the automatic repair was ELIGIBLE, but the workflow re-dispatch itself failed — " +
      "no repair run was created, and the run's single auto-retry reservation is already spent",
    recovery: "re-dispatch research-pass-v2.yml by hand with the SAME slug — the run resumes at " +
      "the failed stage with its recorded findings, and no completed research is repeated. The " +
      "automatic repair budget is spent, so a further failure will stop here again.",
  };
}

/** True when this exact terminal failure was already reported into the issue thread. */
export function alreadyNotified(commentBodies, marker) {
  return (commentBodies || []).some((body) => String(body || "").includes(marker));
}

/** The stop notice: one issue comment body plus the one-line Actions error. Both carry the same
    facts — slug, runId, failed stage, failure class, finding count, why no automatic retry
    happened, and the exact safe recovery action. */
export function renderStopNotice({ slug, state, decision, runUrl = null }) {
  const stage = decision.stage || state?.resume?.nextStage || "(unknown stage)";
  const failureClass = decision.failureClass || "unknown";
  const runId = state?.runId || "(no run state)";
  const attempt = state?.stages?.[stage]?.attempts ?? 0;
  const marker = stopNoticeMarker({ runId, stage, failureClass, attempt, kind: decision.kind || "refused" });
  const detail = state?.stages?.[stage]?.failure?.detail || state?.failure?.detail || null;

  const body = [
    marker,
    `**Research run stopped — a human decision is needed.**`,
    "",
    `| | |`,
    `|---|---|`,
    `| guide | \`${slug}\` |`,
    `| run | \`${runId}\` (attempt ${attempt}) |`,
    `| failed stage | \`${stage}\` |`,
    `| failure class | \`${failureClass}\` |`,
    `| recorded findings | ${decision.findingCount} |`,
    `| publication | ${state?.publication?.published ? "published" : "not published"} |`,
    "",
    `**Why it did not retry itself:** ${decision.reason}`,
    "",
    `**Safe recovery:** ${decision.recovery || "re-dispatch research-pass-v2.yml with the same slug — the run resumes at its durable resume point."}`,
    "",
    detail ? `<details><summary>Recorded failure detail</summary>\n\n\`\`\`\n${String(detail).slice(0, 2000)}\n\`\`\`\n\n</details>` : null,
    runUrl ? `\n[Workflow run](${runUrl})` : null,
    "",
    "_The branch is preserved exactly as the run left it. Completed stages are durable; a re-dispatch resumes at the failed stage and never restarts finished research._",
  ].filter((line) => line !== null).join("\n");

  const actionsError = `research run ${runId} (${slug}) STOPPED at stage ${stage} — ${failureClass}; ` +
    `${decision.findingCount} recorded finding(s); no automatic retry: ${decision.reason}. ` +
    `Recovery: ${decision.recovery || "re-dispatch research-pass-v2.yml with the same slug."}`;

  return { marker, body, actionsError, stage, failureClass, runId, attempt };
}
