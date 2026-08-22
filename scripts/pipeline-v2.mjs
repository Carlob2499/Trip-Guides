// PIPELINE V2 — the control-plane CLI (M4). One subcommand per workflow step, so
// research-pass-v2.yml stays orchestration-only. Everything here is thin over the tested
// modules in scripts/pipeline/v2/; the durable truth is guides-intake/<slug>/run.v2.json.
//
// Contract with the workflow (Recovery and attempts, execution prompt):
//   · begin-stage checkpoints stage START (and commits it) BEFORE the agent is invoked;
//   · finish-stage VALIDATES the stage's owed artifacts, commits the work, then checkpoints
//     completion — a stage that produced nothing durable is recorded as a VOID failure, with
//     `void=true` emitted so the workflow can spend the one bounded auto-retry;
//   · a resumed run repeats the interrupted stage (run.v2.json's resume block), never skips
//     ahead on uncommitted work;
//   · publication authority is INFRASTRUCTURE, never an input (correction + hardening passes):
//     landMode is derived at init by deriveLandIntent (auto ⇔ trusted non-dispatch provenance
//     from new-guide.yml's workflow_call + default-branch ref + selector "v2" — a manual
//     workflow_dispatch is always "pr"), immutable, re-checked as landing-time authority — and
//     publication itself is a TWO-PHASE transaction: the gate
//     verdict rides the merge, publication is finalized only after gh CONFIRMS the merge
//     (finalize-landing is the idempotent retry). "pr" runs ALWAYS land draft PRs and cannot
//     publish, through the same `pipeline.mjs land` machinery V1 uses.
//
// Subcommands:
//   init --slug <s> [--issue <n>] [--land pr|auto]   create/resume the V2 run (+ scaffold baseline)
//   route --slug <s> [--json]                        emit next=<stage>, done, baseline, run_id
//   budget --slug <s> [--branch <b>]                 bump the bounded attempt counter
//   begin-stage --slug <s> --stage <st> [--model m] [--effort e] [--branch <b>]
//   finish-stage --slug <s> --stage <st> [--branch <b>] [--scoped]
//   fail-stage --slug <s> --stage <st> --class <c> [--detail <d>] [--branch <b>]
//   record-agent-failure --slug <s> --stage <st> --agent-conclusion <c> [--agent-log <f>] [--branch <b>]
//                                                    classify + record the AGENT PROCESS's failure
//   auto-retry --slug <s> [--stage <st>]             emit allowed=true|false (durable state decides)
//   escalate --slug <s> [--stage <st>] [--dispatch-failed true]  the visible stop surface (Actions error + one issue comment)
//   prepare-passb --slug <s> --dest <dir>            worktree at baseline + fail-closed leak check
//   collect-passb --slug <s> --from <dir>            validate + transfer Pass B's artifact
//   prepare-critic --slug <s>                        delete forbidden files from the working tree
//   restore-critic --slug <s>                        restore them
//   validate --slug <s> [--scoped]                   the full artifact validation (fail closed)
//   land-intent --slug <s> --event-name <e> --on-default <b> --engine <v>  derive init-time intent (trusted /new only mints auto)
//   land-mode --slug <s> [--product-authority true]  emit land=auto|pr (landingMode() + landing-time authority)
//   finalize-landing --slug <s> --pr <n> [--announced ok|failed|skipped] [--base <b>]  GitHub-verified (incl. runId proof), remotely-persisted post-merge retry; announcement truth fails closed
//   reopen-answers --slug <s>                        re-open reconcile+critic for a late answer

import { existsSync, appendFileSync, readFileSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isValidSlug } from "./lib/slug.mjs";
import { isMain } from "./audit/lib.mjs";
import { ContractError } from "./pipeline/v2/contracts.mjs";
import {
  initRunV2, readRunStateV2, nextStageV2, stageStart, stageComplete, stageFail,
  bumpRunAttempt, recordAutoRetry, recordTelemetry, markLandingGate, V2_RESEARCH_STAGES,
  stageAttemptStats, landingMode, deriveLandIntent, reopenForAnswers,
} from "./pipeline/v2/run-state.mjs";
import { finalizeLandingRecovery } from "./pipeline/v2/landing-truth.mjs";
import {
  classifyAgentFailure, retryEligibility, renderStopNotice, alreadyNotified, dispatchFailedDecision,
} from "./pipeline/v2/recovery.mjs";
import { recordStageFeedback, retireFeedback, activeFeedback, renderFeedbackBlock, extractGateFindings } from "./pipeline/v2/feedback.mjs";
import { generateContractCapsule } from "./pipeline/v2/contract-capsule.mjs";
import { emitRunEvents, readGeocodeReport } from "./pipeline/v2/events.mjs";
import { readEvidence, requireEvidence, evidenceProblems } from "./pipeline/v2/evidence.mjs";
import { researchRuleProblems, isProxyHost } from "./pipeline/v2/research-rules.mjs";
import { requireCoverage, coverageProblems, loadCoverageContext, remapCoverageRefs } from "./pipeline/v2/coverage.mjs";
import {
  preparePassBWorkspace, collectPassB, collectStageOutput, prepareCriticInput, restoreCriticInput, verifyPassBWorkspace,
  resetFreshRunWorkspace,
} from "./pipeline/v2/workspace.mjs";
import { emptyTelemetry, stageFacts, countsFromEvidence, mergeTelemetry } from "./pipeline/v2/telemetry.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INTAKE_DIR = path.join(ROOT, "guides-intake");
const GUIDES_DIR = path.join(ROOT, "src", "content", "guides");

function emit(key, value) {
  if (String(value).includes("\n")) throw new Error(`step output "${key}" carries a newline`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

// Multiline step output, GitHub's heredoc form (the composePrompt precedent).
function emitMultiline(key, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  const marker = "WAYPOINT_V2_OUTPUT_EOF";
  if (String(value).includes(marker)) throw new Error(`step output "${key}" contains the output delimiter ${marker}`);
  appendFileSync(process.env.GITHUB_OUTPUT, `${key}<<${marker}\n${value}\n${marker}\n`);
}

export function criticFetchTools(slug, { guidesDir = GUIDES_DIR, intakeDir = INTAKE_DIR } = {}) {
  const domains = new Set();
  const roots = [path.join(guidesDir, slug), path.join(intakeDir, slug, "ledger.md")];
  const visit = (target) => {
    if (!existsSync(target)) return;
    if (statSync(target).isDirectory()) return readdirSync(target).forEach((name) => visit(path.join(target, name)));
    for (const match of readFileSync(target, "utf8").matchAll(/https?:\/\/[^\s"'<>)}\],]+/g)) {
      try {
        const host = new URL(match[0]).hostname.toLowerCase();
        // The host lands VERBATIM inside a comma-joined --allowedTools string, and these URLs
        // came from web research (untrusted). Node's URL parser keeps commas in a hostname, so
        // "https://evil.example,bash" would mint extra grant tokens (review finding, MEDIUM).
        // Only a strict DNS-shaped host may enter the policy; anything else is dropped.
        if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) continue;
        // Proxy/mirror hosts never enter the critic's fetch policy — a mirror is not the origin.
        if (!/(^|\.)github\.com$|(^|\.)githubusercontent\.com$/.test(host) && !isProxyHost(match[0])) domains.add(host);
      } catch { /* malformed source is caught by the evidence gate */ }
    }
  };
  roots.forEach(visit);
  // Rule-syntax law (verified against code.claude.com/docs/en/permissions, 2026-08-19, after the
  // first canary's writes were ALL denied): absolute paths need a double slash — `/workspace/**`
  // is settings-relative and never matches. Edit(//…) covers Write/MultiEdit/NotebookEdit;
  // Write()/Glob()/Grep() path rules are accepted but never consulted.
  return ["Read(//workspace/**)", "Edit(//workspace/**)", "Glob", "Grep", "WebSearch", ...[...domains].sort().map((d) => `WebFetch(domain:${d})`)].join(",");
}

function git(args, { cwd = ROOT } = {}) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

/** The subset of paths `git add` can take without aborting: present on disk, or tracked (a
    tracked-but-deleted path must still stage its deletion). A pathspec matching NOTHING kills
    the whole add with exit 128 — feedback.v2.json only exists after a failure, so a clean
    first-try run used to crash its own completion checkpoint here (review finding, HIGH). */
export function commitablePaths(paths, { cwd = ROOT } = {}) {
  return paths.filter((rel) => {
    if (existsSync(path.join(cwd, rel))) return true;
    try { git(["ls-files", "--error-unmatch", "--", rel], { cwd }); return true; }
    catch { return false; }
  });
}

function commitAndPush(paths, message, { branch = null, cwd = ROOT } = {}) {
  const targets = commitablePaths(paths, { cwd });
  if (!targets.length) return null;
  const dirty = git(["status", "--porcelain", "--", ...targets], { cwd }).trim();
  if (!dirty) return null;
  git(["add", "--", ...targets], { cwd });
  // --only prevents an unrelated pre-staged path from hitchhiking into a control-plane commit.
  git(["commit", "--only", "-m", message, "--", ...targets], { cwd });
  if (branch) git(["push", "origin", `HEAD:${branch}`], { cwd });
  return git(["rev-parse", "HEAD"], { cwd }).trim();
}

export function allowedStagePaths(slug, stage) {
  const guide = `src/content/guides/${slug}`;
  const intake = `guides-intake/${slug}`;
  const byStage = {
    passA: [guide, `${intake}/ledger.md`, `${intake}/evidence.v2.json`],
    passB: [`${intake}/passB.v2.json`],
    reconcile: [guide, `${intake}/ledger.md`, `${intake}/evidence.v2.json`, `${intake}/coverage.v2.json`],
    // coverage.v2.json is in the critic's scope for ONE writer: the deterministic post-compose
    // ref remap in the trusted checkout — the critic agent itself never sees the file.
    critic: [guide, `${intake}/ledger.md`, `${intake}/coverage.v2.json`, `${intake}/pipeline-patterns.fragment.md`, "docs/evidence/pipeline-patterns.md"],
  };
  return byStage[stage] || [];
}

function dirtyPaths({ cwd = ROOT } = {}) {
  const raw = git(["status", "--porcelain=v1", "-z"], { cwd });
  const entries = raw.split("\0").filter(Boolean);
  const paths = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const status = entry.slice(0, 2);
    const name = entry.slice(3).replace(/\\/g, "/");
    paths.push(name);
    if (status.includes("R") || status.includes("C")) {
      paths.push((entries[++i] || name).replace(/\\/g, "/"));
    }
  }
  return paths;
}

export function stageScopeProblems(slug, stage, paths) {
  const allowed = allowedStagePaths(slug, stage);
  return paths.filter((file) => !allowed.some((root) => file === root || file.startsWith(root + "/")))
    .map((file) => `stage ${stage} touched forbidden path ${file}`);
}

/** A failed offline gate, recorded as BOTH durable stage feedback and an honest failed stage,
    from ONE findings array. Single-sourcing that array is the whole point: the live canary
    (luxembourg-20260821-99c13e) logged "0 finding(s) recorded for the retry" and wrote
    `0 finding(s)` into the failure detail while feedback.v2.json carried one, because the
    console and the detail read the PRE-fallback count while the record got the fallback. Two
    counters for one fact is one counter too many. Exported (with an injectable intakeDir) so a
    test can drive the exact sequence verify-failed drives, against a temporary run directory. */
export async function recordGateFailure(slug, stage, gateOutput, { intakeDir = INTAKE_DIR } = {}) {
  const retryFindings = extractGateFindings(gateOutput);
  const state = await readRunStateV2(slug, { intakeDir });
  await recordStageFeedback(slug, {
    runId: state.runId, stage, attempt: state.stages?.[stage]?.attempts || 0,
    findings: retryFindings, intakeDir,
  });
  await stageFail(slug, stage, {
    failureClass: "gate-failure", detail: `offline verify failed: ${retryFindings.length} finding(s)`, intakeDir,
  });
  return retryFindings;
}

/** The terminal-stop report: why this run is not repairing itself and what a human should do.
    Exported (with an injectable intakeDir) so the visible-recovery-surface contract is tested
    against a temporary run directory instead of a live issue thread. A run state that cannot be
    read is itself reportable — the Actions annotation must survive a corrupt record. */
export async function escalationReport(slug, { stage = null, intakeDir = INTAKE_DIR, runUrl = null, dispatchFailed = false } = {}) {
  let state = null;
  let findings = [];
  let readError = null;
  try {
    state = await readRunStateV2(slug, { intakeDir });
    const failedStage = stage || state?.resume?.nextStage || null;
    if (state && failedStage) findings = await activeFeedback(slug, { runId: state.runId, stage: failedStage, intakeDir });
  } catch (err) {
    readError = err.message.split("\n")[0];
  }
  let decision;
  if (readError) {
    decision = { allowed: false, stage, failureClass: "unknown", findingCount: 0,
      reason: `durable run state could not be read: ${readError}`,
      recovery: `restore guides-intake/${slug}/run.v2.json from git before re-dispatching` };
  } else {
    const eligibility = retryEligibility(state, { stage: stage || state?.resume?.nextStage || null, findings });
    // A failed re-dispatch is NOT a refusal: re-deriving eligibility now would read the already
    // consumed reservation and report exhausted budget as if a repair had launched.
    decision = dispatchFailed ? dispatchFailedDecision(eligibility) : eligibility;
  }
  const notice = renderStopNotice({ slug, state, decision, runUrl });
  return { ...notice, decision, issue: state?.issue || null };
}

/** What a RETURNED model process's rejected output is, durably. finish-stage's classification
    lives here — one exported implementation, driven by tests against a temporary run directory,
    because "an invalid artifact is not a failed agent" is the whole point of the fix and prose
    cannot hold it. `changed` is the stage's dirty paths; `problems` the validators' findings. */
export async function recordStageOutputFailure(slug, stage, { problems, changed, intakeDir = INTAKE_DIR } = {}) {
  // CLASSIFICATION BOUNDARY (reliability pass, 2026-08-22): this is a verdict on output from a
  // process that RETURNED, so it may never say "agent-failure" — that class asserts a failed
  // Claude process, which only the workflow observes (recovery.mjs). Invalid-but-dirty output,
  // scope-invalid output and a failed contract are all deterministic GATE verdicts; nothing
  // produced at all is a void run.
  const isVoid = (changed || []).length === 0;
  const failureClass = isVoid ? "void-run" : "gate-failure";
  const failed = await stageFail(slug, stage, { failureClass, detail: problems.join(" · "), intakeDir });
  // 1B: persist the exact machine findings so THIS stage's retry receives them instead of
  // re-spending research to rediscover a contract defect.
  await recordStageFeedback(slug, {
    runId: failed.runId, stage, attempt: failed.stages[stage]?.attempts || 0, findings: problems, intakeDir,
  });
  return { failureClass, isVoid, state: failed };
}

export function validateSectionInput(value) {
  const section = String(value || "");
  if (section.length > 200) return "section focus exceeds 200 characters";
  if ([...section].some((char) => {
    const code = char.charCodeAt(0);
    return code <= 31 || code === 127;
  })) return "section focus contains control characters";
  return null;
}

// ── stage validation (pure-ish: filesystem reads only) ───────────────────────
// What each stage OWES before it may be checkpointed complete. This is the void check with
// teeth: not "did HEAD move" but "does the artifact the stage exists to produce validate".

export async function validateStageOutput(slug, stage, { intakeDir = INTAKE_DIR, guidesDir = GUIDES_DIR, scoped = false } = {}) {
  const problems = [];
  switch (stage) {
    case "scaffold": {
      if (!existsSync(path.join(intakeDir, slug, "intake.md"))) problems.push(`frozen intake missing: guides-intake/${slug}/intake.md`);
      if (!existsSync(path.join(guidesDir, slug, "_guide.json"))) problems.push(`guide scaffold missing: src/content/guides/${slug}/_guide.json`);
      break;
    }
    case "passA": {
      // Fail-closed read: malformed throws (a ContractError is a validation verdict, not a crash).
      const doc = await readEvidence(slug, { intakeDir });
      if (!doc) problems.push(`Pass A owes the evidence artifact: guides-intake/${slug}/evidence.v2.json`);
      else {
        const state = await readRunStateV2(slug, { intakeDir });
        if (doc.slug !== slug || (state && doc.runId !== state.runId)) problems.push(`Pass-A evidence identity does not match ${slug}/${state?.runId || "active run"}`);
        if (!doc.evidence.some((e) => e.origin === "passA")) problems.push("evidence artifact carries no Pass-A records — a pass that verified nothing is void");
      }
      break;
    }
    case "passB": {
      if (!existsSync(path.join(intakeDir, slug, "passB.v2.json"))) {
        problems.push(`Pass B owes its artifact: guides-intake/${slug}/passB.v2.json (transferred by collect-passb)`);
      }
      break;
    }
    case "reconcile": {
      const state = await readRunStateV2(slug, { intakeDir });
      const doc = await requireEvidence(slug, { intakeDir, runId: state?.runId });
      if (!doc) { problems.push(`reconcile owes the merged evidence artifact: guides-intake/${slug}/evidence.v2.json`); break; }
      problems.push(...evidenceProblems(doc, { fullPass: !scoped }));
      problems.push(...researchRuleProblems(doc));
      try {
        const coverage = await requireCoverage(slug, { intakeDir, runId: state?.runId });
        const context = await loadCoverageContext(slug, { intakeDir, guidesDir });
        problems.push(...coverageProblems(coverage, { ...context, evidenceIds: new Set(doc.evidence.map((e) => e.id)) }));
      } catch (err) {
        problems.push(err.message.split("\n")[0]);
      }
      break;
    }
    case "critic": {
      // The critic's owed artifacts live in the human ledger — reuse the V1 artifact contract.
      const { missingArtifacts } = await import("./pipeline/gate.mjs");
      const ledger = path.join(intakeDir, slug, "ledger.md");
      if (!existsSync(ledger)) { problems.push(`ledger missing: guides-intake/${slug}/ledger.md`); break; }
      const { readFile } = await import("node:fs/promises");
      const missing = missingArtifacts(await readFile(ledger, "utf8"), "critic");
      problems.push(...missing.map((m) => `critic artifact missing from ledger: '${m}'`));
      if (!existsSync(path.join(intakeDir, slug, "pipeline-patterns.fragment.md"))) problems.push("critic owes pipeline-patterns.fragment.md (an honest blank is still evidence)");
      break;
    }
    default:
      problems.push(`unknown stage "${stage}" — one of: ${V2_RESEARCH_STAGES.join(", ")}`);
  }
  return problems;
}

// ── subcommands ──────────────────────────────────────────────────────────────

async function run(cmd, get, has) {
  const slug = get("--slug");
  if (!slug || !isValidSlug(slug)) {
    console.error(`[pipeline-v2] ${cmd} needs a valid --slug (lowercase, digits, single hyphens).`);
    return 1;
  }
  const branch = get("--branch");

  switch (cmd) {
    case "init": {
      const sectionProblem = validateSectionInput(get("--section"));
      if (sectionProblem) { console.error(`[pipeline-v2] ${sectionProblem}`); return 1; }
      // A V2 run REQUIRES an existing scaffold (new-guide.yml owns scaffolding). The baseline
      // commit recorded on the scaffold stage is what Pass B's clean checkout derives from.
      const scaffoldProblems = await validateStageOutput(slug, "scaffold");
      if (scaffoldProblems.length) {
        console.error(`[pipeline-v2] ${slug} is not scaffolded — V2 researches an existing scaffold, it does not create one:`);
        for (const p of scaffoldProblems) console.error(`  · ${p}`);
        return 1;
      }
      const issue = get("--issue") || "";
      if (issue && !/^\d+$/.test(issue)) { console.error(`[pipeline-v2] "${issue}" isn't an issue number.`); return 1; }
      const landInput = get("--land") || "";
      if (landInput && !["pr", "auto"].includes(landInput)) { console.error(`[pipeline-v2] --land must be pr or auto, not "${landInput}".`); return 1; }
      const branchFresh = get("--branch-fresh") === "true";
      let state = await initRunV2(slug, {
        inputs: {
          section: get("--section") || "",
          model: get("--model") || "claude-sonnet-5",
          effort: get("--effort") || "high",
          criticModel: get("--critic-model") || "claude-opus-5",
        },
        issue: issue || null,
        landMode: landInput || null,
        // Fresh-run semantics: the workflow's branch step says whether research-v2/<slug> was
        // JUST created (true ⇒ any state on disk is default-branch history, not this run).
        branchFresh,
      });
      if (branchFresh) {
        // A fresh branch cut over merged history still CONTAINS the prior run's mutable
        // artifacts (evidence/coverage/passB/feedback/events/geocode + its run.v2.json in the
        // tree). Remove them from the run branch BEFORE the scaffold baseline is captured, so
        // Pass B's clean-workspace contract holds and Pass A never reads a previous run's
        // evidence as its own. No-op on a first-ever run. (Hardening pass, 2026-08-20.)
        const { baseline, reset } = resetFreshRunWorkspace(slug);
        if (reset) console.log(`[pipeline-v2] ${slug} — fresh-run reset: prior run artifacts removed; clean baseline ${baseline.slice(0, 7)}.`);
      }
      if (state.stages.scaffold.status !== "complete") {
        const head = git(["rev-parse", "HEAD"]).trim();
        await stageStart(slug, "scaffold");
        state = await stageComplete(slug, "scaffold", { commit: head });
        console.log(`[pipeline-v2] ${slug} — scaffold baseline recorded at ${head.slice(0, 7)}.`);
      }
      commitAndPush([`guides-intake/${slug}/run.v2.json`], `research-v2(${slug}): init run ${state.runId}`, { branch });
      emit("run_id", state.runId);
      emit("baseline", state.stages.scaffold.commit || "");
      emit("next", nextStageV2(state) || "");
      console.log(`[pipeline-v2] ${slug} — run ${state.runId}, next stage: ${nextStageV2(state) || "(none)"}`);
      return 0;
    }

    case "route": {
      const state = await readRunStateV2(slug);
      if (!state) {
        console.error(`[pipeline-v2] no V2 run for ${slug} — run init first.`);
        return 1;
      }
      const next = nextStageV2(state);
      emit("next", next || "");
      emit("done", String(!next));
      emit("baseline", state.stages.scaffold?.commit || "");
      emit("run_id", state.runId);
      emit("status", state.status);
      if (has("--json")) console.log(JSON.stringify({ slug, runId: state.runId, next, status: state.status, resume: state.resume }));
      else console.log(`[pipeline-v2] ${slug} — ${state.status}; next: ${next || "(none)"}; ${state.resume.action}`);
      return 0;
    }

    case "budget": {
      const { overCap, attempts, cap } = await bumpRunAttempt(slug);
      commitAndPush([`guides-intake/${slug}/run.v2.json`], `chore(pipeline-v2): ${slug} attempt ${attempts}`, { branch });
      emit("attempts", String(attempts));
      emit("should_run", String(!overCap));
      if (overCap) {
        console.error(`[pipeline-v2] ${slug} — attempt ${attempts} exceeds the cap of ${cap}; run is STUCK. No agent spend.`);
        return 0; // the workflow branches on should_run and files the stuck issue; not a crash
      }
      console.log(`[pipeline-v2] ${slug} — attempt ${attempts} of ${cap}, proceeding.`);
      return 0;
    }

    case "begin-stage": {
      const stage = get("--stage");
      await stageStart(slug, stage, { model: get("--model"), effort: get("--effort") });
      commitAndPush([`guides-intake/${slug}/run.v2.json`], `research-v2(${slug}): ${stage} started`, { branch });
      console.log(`[pipeline-v2] ${slug} — stage "${stage}" started (checkpointed before the agent).`);
      return 0;
    }

    case "finish-stage": {
      const stage = get("--stage");
      let problems;
      try {
        problems = await validateStageOutput(slug, stage, { scoped: has("--scoped") });
      } catch (err) {
        // A ContractError's field-level issues ARE the retry feedback — flattening them to the
        // message's first line starved the canary's retry of exactly what it needed.
        problems = err.issues?.length ? err.issues : [err.message.split("\n")[0]];
      }
      const changed = dirtyPaths();
      problems.push(...stageScopeProblems(slug, stage, changed));
      const dirty = changed.length > 0;
      if (problems.length) {
        const { isVoid, failureClass } = await recordStageOutputFailure(slug, stage, { problems, changed });
        // Retain the attempt's IN-SCOPE output on the run branch so a retry can repair the
        // artifact in place. Scope violations are NOT committed; every downstream gate
        // (finish-stage, validate, landing) still fails closed on this content.
        if (dirty) {
          const allowed = allowedStagePaths(slug, stage);
          const inScope = changed.filter((file) => allowed.some((root) => file === root || file.startsWith(root + "/")));
          if (inScope.length) {
            git(["add", "-A", "--", ...commitablePaths(allowed)]);
            try { git(["commit", "--only", "-m", `research-v2(${slug}): ${stage} attempt output (INVALID — retained for repair)`, "--", ...allowed]); }
            catch { /* nothing staged in scope */ }
            if (branch) git(["push", "origin", `HEAD:${branch}`]);
          }
        }
        await emitRunEvents(slug, { state: await readRunStateV2(slug), evidence: await readEvidence(slug).catch(() => null), geocode: await readGeocodeReport(slug) });
        commitAndPush([`guides-intake/${slug}/run.v2.json`, `guides-intake/${slug}/feedback.v2.json`, `guides-intake/${slug}/events.json`], `research-v2(${slug}): ${stage} FAILED (${isVoid ? "void" : "invalid output"})`, { branch });
        emit("void", String(isVoid));
        emit("failure_class", failureClass);
        console.error(`[pipeline-v2] ${slug} — stage "${stage}" output does not hold up:`);
        for (const p of problems) console.error(`  · ${p}`);
        return 1;
      }
      // Commit the stage's work (the WORKFLOW commits, never the agent), then checkpoint.
      let workCommit = null;
      if (dirty) {
        const paths = commitablePaths(allowedStagePaths(slug, stage));
        git(["add", "-A", "--", ...paths]);
        git(["commit", "--only", "-m", `research-v2(${slug}): ${stage}`, "--", ...paths]);
        if (branch) git(["push", "origin", `HEAD:${branch}`]);
        workCommit = git(["rev-parse", "HEAD"]).trim();
      }
      const state = await stageComplete(slug, stage, { commit: workCommit });
      // 1B: this stage's active feedback is resolved — retire it, keep the audit history.
      await retireFeedback(slug, { stage });
      // Telemetry from the workflow boundary: stage duration/model/effort + per-attempt truth.
      const st = state.stages[stage];
      const attemptStats = stageAttemptStats(st);
      const evidenceDoc = await readEvidence(slug).catch(() => null);
      const telemetry = mergeTelemetry(state.telemetry || emptyTelemetry(), {
        stages: { [stage]: stageFacts({
          startedAt: st.startedAt, endedAt: st.endedAt, model: st.model, effort: st.effort,
          retries: st.attempts > 1 ? st.attempts - 1 : null,
          failedDurationSec: attemptStats.failedSec, cumulativeDurationSec: attemptStats.cumulativeSec,
        }) },
        counts: countsFromEvidence(evidenceDoc),
        totalDurationSec: Math.max(0, Math.round((Date.parse(state.updatedAt) - Date.parse(state.createdAt)) / 1000)),
      });
      await recordTelemetry(slug, telemetry);
      // Phase 9: rebuild the truthful Progress event log from the durable artifacts.
      await emitRunEvents(slug, { state: await readRunStateV2(slug), evidence: evidenceDoc, geocode: await readGeocodeReport(slug) });
      commitAndPush([`guides-intake/${slug}/run.v2.json`, `guides-intake/${slug}/feedback.v2.json`, `guides-intake/${slug}/events.json`], `research-v2(${slug}): ${stage} complete`, { branch });
      emit("void", "false");
      emit("next", nextStageV2(state) || "");
      console.log(`[pipeline-v2] ${slug} — stage "${stage}" complete${workCommit ? ` (work at ${workCommit.slice(0, 7)})` : ""}; next: ${nextStageV2(state) || "(none)"}`);
      return 0;
    }

    case "fail-stage": {
      const stage = get("--stage");
      await stageFail(slug, stage, { failureClass: get("--class") || "unknown", detail: get("--detail") || "" });
      await emitRunEvents(slug, { state: await readRunStateV2(slug), evidence: await readEvidence(slug).catch(() => null), geocode: await readGeocodeReport(slug) });
      commitAndPush([`guides-intake/${slug}/run.v2.json`, `guides-intake/${slug}/events.json`], `research-v2(${slug}): ${stage} FAILED`, { branch });
      console.error(`[pipeline-v2] ${slug} — stage "${stage}" recorded as failed (${get("--class") || "unknown"}); branch stays manually resumable.`);
      return 0;
    }

    case "land-mode": {
      // The deterministic landing decision, ONE implementation: landingMode() — the same pure
      // function the unit suite exercises (correction pass: this case used to reimplement it).
      // "auto" additionally requires LANDING-TIME PRODUCT AUTHORITY from the workflow
      // (--product-authority true ⇔ the dispatch ref is the default branch AND the
      // WAYPOINT_RESEARCH_ENGINE selector is "v2" at this moment) — so a feature-ref dispatch
      // can NEVER auto-merge whatever the run records, and revoking the selector mid-run
      // downgrades the landing to a draft PR (fail-safe). Malformed state throws, never "pr".
      const state = await readRunStateV2(slug);
      const authority = get("--product-authority") === "true";
      const intent = landingMode(state);
      const mode = authority && intent === "auto" ? "auto" : "pr";
      emit("land", mode);
      emit("issue", state?.issue || "");
      console.log(`[pipeline-v2] ${slug} — landing mode ${mode} (intent ${state?.landMode || "(no run)"}; decision ${intent}; product authority ${authority ? "granted" : "absent"}).`);
      return 0;
    }

    case "finalize-landing": {
      // The idempotent phase-2 retry, hardened (2026-08-20): before ANY publication fact is
      // written it (1) resolves and validates the repository default branch, (2) proves the
      // merge against GitHub itself — PR exists, is MERGED, base and head match this run's
      // landing — and records GitHub's own mergedAt, never the retry clock, then (3) commits
      // AND pushes the record to the remote default branch. A push failure fails the command:
      // local success is not durable success. The printed retry command is complete as printed.
      const pr = Number(get("--pr"));
      const announcedFlag = get("--announced") || "";
      if (announcedFlag && !["ok", "failed", "skipped"].includes(announcedFlag)) {
        console.error(`[pipeline-v2] --announced must be ok, failed or skipped, not "${announcedFlag}".`); return 1;
      }
      // Omitted --announced passes null through — the recovery FAILS CLOSED on it unless the
      // durable state already records the fact; "skipped" is the explicit no-announce-URL case.
      const { state, base, mergedAt } = await finalizeLandingRecovery(slug, {
        pr,
        announced: announcedFlag === "ok" ? true : announcedFlag === "failed" ? false : announcedFlag === "skipped" ? "skipped" : null,
        base: get("--base") || null,
      });
      console.log(`[pipeline-v2] ${slug} — landing finalized (PR #${pr}, merged ${mergedAt}); publication recorded ${state.publication.publishedAt}; pushed to origin/${base}.`);
      return 0;
    }

    case "land-intent": {
      // Landing INTENT at init (requirement: only the trusted /new product flow may auto-land).
      // Pure derivation, one implementation (deriveLandIntent) shared with the unit suite:
      // provenance (the trusted workflow_call from new-guide.yml runs under the caller's event,
      // never "workflow_dispatch") AND the default-branch ref AND the live selector. The mode
      // is printed alone on stdout so the workflow can capture it with $(…).
      const intent = deriveLandIntent({
        eventName: get("--event-name") || "",
        onDefault: get("--on-default") === "true",
        engine: get("--engine") || "",
      });
      emit("land", intent);
      console.error(`[pipeline-v2] ${slug} — landing intent ${intent} (event ${get("--event-name") || "(none)"}; default-branch ${get("--on-default") || "false"}; selector ${get("--engine") || "(unset)"}).`);
      console.log(intent);
      return 0;
    }

    case "reopen-answers": {
      // Late answer to a COMPLETE-but-unmerged draft run: re-open reconcile+critic so the
      // remaining work genuinely consumes the answer (published runs are refused — those take
      // the change lifecycle; runs with work still owed no-op).
      const { reopened, state } = await reopenForAnswers(slug);
      await emitRunEvents(slug, { state: await readRunStateV2(slug), evidence: await readEvidence(slug).catch(() => null), geocode: await readGeocodeReport(slug) });
      commitAndPush(
        [`guides-intake/${slug}/run.v2.json`, `guides-intake/${slug}/events.json`],
        `research-v2(${slug}): re-opened at reconcile for a traveler answer`,
        { branch },
      );
      emit("reopened", String(reopened));
      console.log(`[pipeline-v2] ${slug} — ${reopened ? `re-opened at reconcile (run ${state.runId}) — the answer will be absorbed by the re-run` : "work still owed; the active run absorbs the answer as-is"}.`);
      return 0;
    }

    case "landing-gate": {
      const passed = get("--status") === "passed";
      await markLandingGate(slug, { passed, detail: get("--detail") });
      await emitRunEvents(slug, { state: await readRunStateV2(slug), evidence: await readEvidence(slug).catch(() => null), geocode: await readGeocodeReport(slug) });
      commitAndPush([`guides-intake/${slug}/run.v2.json`, `guides-intake/${slug}/events.json`], `research-v2(${slug}): landing gate ${passed ? "PASS" : "FAIL"}`, { branch });
      return passed ? 0 : 1;
    }

    case "auto-retry": {
      // THE STATE MACHINE decides, not the YAML (reliability pass, 2026-08-22). The old wiring
      // asked one ephemeral step output — `void == 'true'` — so an ordinary deterministic gate
      // failure, the commonest repairable failure there is, never reached this command at all.
      // Eligibility is now read from the DURABLE record: the recorded failure class, the active
      // validator findings for THIS runId/stage, and the run's own attempt/auto-retry budgets.
      // Budget is spent only when the answer is yes — a refusal must not consume the one retry
      // a later, genuinely repairable failure is owed.
      let decision;
      let state;
      try {
        state = await readRunStateV2(slug);
        const failedStage = get("--stage") || state?.resume?.nextStage || null;
        const findings = state && failedStage
          ? await activeFeedback(slug, { runId: state.runId, stage: failedStage })
          : [];
        decision = retryEligibility(state, { stage: failedStage, findings });
      } catch (err) {
        // Corrupt/unreadable durable state is never a licence to retry — it fails closed, loudly.
        emit("allowed", "false");
        emit("reason", "run state unreadable");
        console.error(`[pipeline-v2] ${slug} — automatic repair retry REFUSED: ${err.message.split("\n")[0]}`);
        return 1;
      }
      emit("stage", decision.stage || "");
      emit("failure_class", decision.failureClass || "");
      emit("findings", String(decision.findingCount));
      emit("reason", decision.reason.replace(/\s+/g, " "));
      if (!decision.allowed) {
        emit("allowed", "false");
        console.error(`[pipeline-v2] ${slug} — automatic repair retry REFUSED: ${decision.reason}`);
        console.error(`[pipeline-v2] ${slug} — safe recovery: ${decision.recovery}`);
        return 0; // the workflow escalates on allowed != 'true'; refusing is not a crash
      }
      const { allowed, autoRetries, cap } = await recordAutoRetry(slug);
      commitAndPush([`guides-intake/${slug}/run.v2.json`], `chore(pipeline-v2): ${slug} auto-retry ${autoRetries}`, { branch });
      emit("allowed", String(allowed));
      emit("run_id", state.runId);
      console.log(`[pipeline-v2] ${slug} — automatic repair retry ${autoRetries} of ${cap}: ${allowed ? "ALLOWED" : "REFUSED (bounded)"} (${decision.reason})`);
      return 0;
    }

    case "record-agent-failure": {
      // The AGENT PROCESS's own failure, classified from what the workflow actually observed:
      // the step conclusion plus the CLI's captured combined output. One implementation, shared
      // by every stage job — the four inline bash copies this replaced could (and did) drift.
      const stage = get("--stage");
      if (!V2_RESEARCH_STAGES.includes(stage)) {
        console.error(`[pipeline-v2] record-agent-failure needs --stage <${V2_RESEARCH_STAGES.join("|")}>`); return 1;
      }
      const logFile = get("--agent-log");
      const agentOutput = logFile && existsSync(logFile) ? readFileSync(logFile, "utf8") : "";
      const { class: failureClass, detail } = classifyAgentFailure({
        agentConclusion: get("--agent-conclusion") || "",
        agentOutput,
      });
      // stageFail is a no-op on an ALREADY-failed stage, deliberately: when finish-stage has
      // already recorded a deterministic gate-failure, this step must not overwrite that verdict
      // with a coarser process-plane guess. Report the class that actually stands.
      const after = await stageFail(slug, stage, { failureClass, detail });
      const recorded = after.stages?.[stage]?.failure?.class || failureClass;
      await emitRunEvents(slug, { state: await readRunStateV2(slug), evidence: await readEvidence(slug).catch(() => null), geocode: await readGeocodeReport(slug) });
      commitAndPush([`guides-intake/${slug}/run.v2.json`, `guides-intake/${slug}/events.json`], `research-v2(${slug}): ${stage} FAILED (${recorded})`, { branch });
      emit("failure_class", recorded);
      console.error(
        recorded === failureClass
          ? `[pipeline-v2] ${slug} — stage "${stage}" recorded as failed (${recorded}: ${detail}); branch stays resumable.`
          : `[pipeline-v2] ${slug} — stage "${stage}" already carries the more specific class "${recorded}"; the process-plane observation (${failureClass}) does not overwrite it.`,
      );
      return 0;
    }

    case "escalate": {
      // A run that stops without repairing itself must be VISIBLE. The Actions annotation is
      // unconditional (it is the recovery surface when no issue exists); the issue comment is
      // posted once per terminal observation, deduped by the notice's own marker.
      const report = await escalationReport(slug, {
        stage: get("--stage") || null,
        dispatchFailed: get("--dispatch-failed") === "true",
      });
      console.log(`::error::${report.actionsError}`);
      if (!report.issue) {
        console.error(`[pipeline-v2] ${slug} — no intake issue recorded; the Actions error above is the recovery surface.`);
        return 0;
      }
      const gh = (args) => execFileSync("gh", args, { cwd: ROOT, encoding: "utf8" });
      let existing;
      try {
        existing = JSON.parse(gh(["issue", "view", String(report.issue), "--json", "comments"])).comments.map((c) => c.body);
      } catch (err) {
        console.error(`[pipeline-v2] could not read issue #${report.issue}'s comments (${err.message.split("\n")[0]}) — refusing to risk a duplicate.`);
        return 0;
      }
      if (alreadyNotified(existing, report.marker)) {
        console.log(`[pipeline-v2] ${slug} — this terminal failure is already reported on issue #${report.issue}; not posting again.`);
        return 0;
      }
      gh(["issue", "comment", String(report.issue), "--body", report.body]);
      console.log(`[pipeline-v2] ${slug} — stop notice filed on issue #${report.issue}.`);
      return 0;
    }

    case "prepare-passb": {
      const dest = get("--dest");
      if (!dest) { console.error("[pipeline-v2] prepare-passb needs --dest <dir>"); return 1; }
      const state = await readRunStateV2(slug);
      const baseline = state?.stages?.scaffold?.commit;
      preparePassBWorkspace(slug, { baseCommit: baseline, destDir: dest });
      console.log(`[pipeline-v2] ${slug} — clean Pass-B workspace at ${dest} (baseline ${String(baseline).slice(0, 7)}).`);
      return 0;
    }

    case "verify-passb-workspace": {
      const dest = get("--dest") || ".";
      verifyPassBWorkspace(slug, dest);
      console.log(`[pipeline-v2] ${slug} — workspace ${dest} verified clean of Pass-A outputs.`);
      return 0;
    }

    case "collect-passb": {
      const from = get("--from");
      if (!from) { console.error("[pipeline-v2] collect-passb needs --from <dir>"); return 1; }
      const state = await readRunStateV2(slug);
      try {
        const { dest } = await collectPassB(slug, { fromDir: from, runId: state?.runId });
        console.log(`[pipeline-v2] ${slug} — Pass B artifact validated and transferred to ${dest}.`);
        return 0;
      } catch (err) {
        // 1B: the collection validator's exact finding is what the retry needs to see.
        if (err instanceof ContractError && state) {
          await recordStageFeedback(slug, { runId: state.runId, stage: "passB", attempt: state.stages?.passB?.attempts || 0, findings: [err.message] });
          commitAndPush([`guides-intake/${slug}/feedback.v2.json`], `research-v2(${slug}): passB validator findings recorded`, { branch });
        }
        throw err;
      }
    }

    case "collect-stage": {
      const stage = get("--stage");
      const from = get("--from");
      if (!V2_RESEARCH_STAGES.includes(stage) || !from) {
        console.error("[pipeline-v2] collect-stage needs --stage <stage> --from <dir>"); return 1;
      }
      try {
        const copied = await collectStageOutput({ fromDir: path.resolve(from), paths: allowedStagePaths(slug, stage) });
        if (!copied.length) throw new ContractError(`stage ${stage} produced no owned artifacts`);
        console.log(`[pipeline-v2] ${slug} — collected ${stage}: ${copied.join(", ")}`);
        return 0;
      } catch (err) {
        if (err instanceof ContractError) {
          const state = await readRunStateV2(slug).catch(() => null);
          if (state) {
            await recordStageFeedback(slug, { runId: state.runId, stage, attempt: state.stages?.[stage]?.attempts || 0, findings: [err.message] });
            commitAndPush([`guides-intake/${slug}/feedback.v2.json`], `research-v2(${slug}): ${stage} validator findings recorded`, { branch });
          }
        }
        throw err;
      }
    }

    case "remap-coverage": {
      // Deterministic, trusted-checkout step: follow coverage anchors to the group files
      // composition renamed. Fails closed when an anchor no longer resolves anywhere.
      const { changed } = await remapCoverageRefs(slug);
      console.log(`[pipeline-v2] ${slug} — coverage refs ${changed ? "remapped to the composed group files" : "already current"}.`);
      return 0;
    }

    case "verify-failed": {
      // An offline gate blocked this stage's output. Keep everything the retry needs: the gate's
      // findings as durable stage feedback, the in-scope work retained on the branch for repair
      // (fail-closed gates still guard it downstream), and an honest failed stage record.
      // Without this, a verify failure discarded the stage's work and told the retry nothing
      // (observed live: 19 minutes of reconcile re-spent for want of a scorecard).
      //
      // --file is ANY gate's captured output, not just `npm run verify`'s scorecard: the schema
      // gate and the coverage remap route here too, and extractGateFindings is what makes their
      // output actionable rather than a placeholder (see feedback.mjs's canary scar).
      const stage = get("--stage");
      const file = get("--file");
      if (!V2_RESEARCH_STAGES.includes(stage) || !file || !existsSync(file)) {
        console.error("[pipeline-v2] verify-failed needs --stage <stage> --file <gate output>"); return 1;
      }
      const gateOutput = readFileSync(file, "utf8");
      const changed = dirtyPaths();
      const allowed = allowedStagePaths(slug, stage);
      if (changed.some((f) => allowed.some((root) => f === root || f.startsWith(root + "/")))) {
        git(["add", "-A", "--", ...commitablePaths(allowed)]);
        try { git(["commit", "--only", "-m", `research-v2(${slug}): ${stage} attempt output (verify FAILED — retained for repair)`, "--", ...allowed]); }
        catch { /* nothing staged in scope */ }
        if (branch) git(["push", "origin", `HEAD:${branch}`]);
      }
      const retryFindings = await recordGateFailure(slug, stage, gateOutput);
      await emitRunEvents(slug, { state: await readRunStateV2(slug), evidence: await readEvidence(slug).catch(() => null), geocode: await readGeocodeReport(slug) });
      commitAndPush([`guides-intake/${slug}/run.v2.json`, `guides-intake/${slug}/feedback.v2.json`, `guides-intake/${slug}/events.json`], `research-v2(${slug}): ${stage} FAILED (offline verify)`, { branch });
      console.error(`[pipeline-v2] ${slug} — ${stage} failed offline verify; ${retryFindings.length} finding(s) recorded for the retry; work retained.`);
      return 0;
    }

    case "stage-feedback": {
      // 1B: emit THIS stage's active validator findings for its retry — labeled DATA, never
      // instructions; other stages' findings never leak into this prompt.
      const stage = get("--stage");
      if (!V2_RESEARCH_STAGES.includes(stage)) {
        console.error("[pipeline-v2] stage-feedback needs --stage <stage>"); return 1;
      }
      const state = await readRunStateV2(slug);
      const findings = state ? await activeFeedback(slug, { runId: state.runId, stage }) : [];
      const block = renderFeedbackBlock(findings);
      emitMultiline("findings", block);
      console.log(`[pipeline-v2] ${slug} — ${stage} retry feedback: ${findings.length} finding(s).`);
      return 0;
    }

    case "contract": {
      // 1A: the generated, stage-relevant machine-contract capsule, derived from the SAME
      // modules that validate the artifacts. The workflow substitutes it as {{contract}}.
      const stage = get("--stage");
      const state = await readRunStateV2(slug);
      const capsule = await generateContractCapsule(stage, { slug, runId: state?.runId || get("--run-id") || "<run-id>" });
      emitMultiline("capsule", capsule);
      console.log(`[pipeline-v2] ${slug} — ${stage} contract capsule generated (${capsule.length} chars).`);
      return 0;
    }

    case "prepare-critic": {
      const { deleted } = prepareCriticInput(slug);
      emit("deleted", deleted.join(","));
      console.log(`[pipeline-v2] ${slug} — critic input prepared; removed: ${deleted.join(", ") || "(nothing present)"}`);
      return 0;
    }

    case "critic-fetch-tools": {
      const tools = criticFetchTools(slug);
      emit("tools", tools);
      console.log(`[pipeline-v2] ${slug} — critic fetch policy permits only source domains already present in its blind input.`);
      return 0;
    }

    case "compound-patterns": {
      const fragment = path.join(INTAKE_DIR, slug, "pipeline-patterns.fragment.md");
      const target = path.join(ROOT, "docs", "evidence", "pipeline-patterns.md");
      if (!existsSync(fragment)) throw new ContractError(`missing critic process-memory fragment for ${slug}`);
      const state = await readRunStateV2(slug);
      const marker = `<!-- pipeline-v2:${state.runId} -->`;
      const current = readFileSync(target, "utf8");
      if (!current.includes(marker)) {
        const rows = readFileSync(fragment, "utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        if (!rows.length || rows.length > 10) throw new ContractError("critic process-memory fragment must contain 1–10 table rows");
        const date = /^\d{4}-\d{2}-\d{2}$/;
        for (const row of rows) {
          const cells = row.split("|").slice(1, -1).map((cell) => cell.trim());
          if (row.length > 1200 || cells.length !== 6 || !date.test(cells[0]) || cells[1] !== slug || cells[2] !== "[critic]" || !cells[3] || !cells[4] || cells[5] !== "open") {
            throw new ContractError(`malformed pipeline-pattern row; expected Date | ${slug} | [critic] | rubric/lens | distilled pattern | open`);
          }
        }
        const commentEnd = current.indexOf("-->", current.indexOf("## Finding ledger"));
        if (commentEnd < 0) throw new ContractError("pipeline-patterns ledger insertion point is missing");
        const at = commentEnd + 3;
        const next = `${current.slice(0, at)}\n${marker}\n${rows.join("\n")}${current.slice(at)}`;
        const { writeFile } = await import("node:fs/promises");
        await writeFile(target, next);
      }
      return 0;
    }

    case "restore-critic": {
      const { restored } = restoreCriticInput(slug);
      console.log(`[pipeline-v2] ${slug} — restored: ${restored.join(", ") || "(nothing tracked)"}`);
      return 0;
    }

    case "validate": {
      // The full pre-landing artifact validation, fail closed. M5 layers the research-rule
      // checks on top of the structural ones.
      try {
        const state = await readRunStateV2(slug);
        const evidence = await requireEvidence(slug, { runId: state?.runId });
        const coverage = await requireCoverage(slug, { runId: state?.runId });
        const context = await loadCoverageContext(slug);
        const problems = [
          ...evidenceProblems(evidence, { fullPass: !has("--scoped") }),
          ...researchRuleProblems(evidence),
          ...coverageProblems(coverage, { ...context, evidenceIds: new Set(evidence.evidence.map((e) => e.id)) }),
        ];
        if (problems.length) {
          console.error(`[pipeline-v2] ${slug} — V2 artifacts do not hold up:`);
          for (const p of problems) console.error(`  · ${p}`);
          return 1;
        }
      } catch (err) {
        console.error(`[pipeline-v2] ${err.message}`);
        return 1;
      }
      console.log(`[pipeline-v2] ${slug} — V2 artifacts validate.`);
      return 0;
    }

    default:
      console.error(`[pipeline-v2] unknown subcommand "${cmd}"`);
      return 1;
  }
}

// ── CLI ──────────────────────────────────────────────────────────────────────
// No top-level await here (the pipeline.mjs lesson): a subcommand's dynamic import that
// reaches back into a mid-evaluation module would deadlock the graph and exit 13.
async function cliMain() {
  const argv = process.argv.slice(2);
  const get = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : null);
  const has = (flag) => argv.includes(flag);
  const cmd = argv[0];
  if (!cmd || cmd.startsWith("--")) {
    console.error("Usage: node scripts/pipeline-v2.mjs <init|route|budget|begin-stage|finish-stage|fail-stage|record-agent-failure|auto-retry|escalate|prepare-passb|verify-passb-workspace|collect-passb|collect-stage|stage-feedback|contract|prepare-critic|restore-critic|validate|land-intent|land-mode|finalize-landing|reopen-answers> --slug <slug> …");
    process.exit(1);
  }
  try {
    process.exit(await run(cmd, get, has));
  } catch (err) {
    if (err instanceof ContractError) {
      console.error(`[pipeline-v2] CONTRACT FAILURE: ${err.message}`);
      process.exit(2);
    }
    console.error(`[pipeline-v2] ${err?.message || err}`);
    process.exit(1);
  }
}

if (isMain(import.meta.url)) {
  cliMain().catch((err) => {
    console.error(`[pipeline-v2] ${err?.message || err}`);
    process.exit(1);
  });
}
