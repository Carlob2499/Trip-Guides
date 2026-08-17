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
//   · publication stays OFF in this workflow — V2 lands draft PRs while it is being proven.
//
// Subcommands:
//   init --slug <s>                                  create/resume the V2 run (+ scaffold baseline)
//   route --slug <s> [--json]                        emit next=<stage>, done, baseline, run_id
//   budget --slug <s> [--branch <b>]                 bump the bounded attempt counter
//   begin-stage --slug <s> --stage <st> [--model m] [--effort e] [--branch <b>]
//   finish-stage --slug <s> --stage <st> [--branch <b>] [--scoped]
//   fail-stage --slug <s> --stage <st> --class <c> [--detail <d>] [--branch <b>]
//   auto-retry --slug <s>                            emit allowed=true|false (bounded, once)
//   prepare-passb --slug <s> --dest <dir>            worktree at baseline + fail-closed leak check
//   collect-passb --slug <s> --from <dir>            validate + transfer Pass B's artifact
//   prepare-critic --slug <s>                        delete forbidden files from the working tree
//   restore-critic --slug <s>                        restore them
//   validate --slug <s> [--scoped]                   the full artifact validation (fail closed)

import { existsSync, appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isValidSlug } from "./lib/slug.mjs";
import { isMain } from "./audit/lib.mjs";
import { ContractError } from "./pipeline/v2/contracts.mjs";
import {
  initRunV2, readRunStateV2, nextStageV2, stageStart, stageComplete, stageFail,
  bumpRunAttempt, recordAutoRetry, recordTelemetry, V2_RESEARCH_STAGES,
} from "./pipeline/v2/run-state.mjs";
import { readEvidence, requireEvidence, evidenceProblems } from "./pipeline/v2/evidence.mjs";
import { researchRuleProblems } from "./pipeline/v2/research-rules.mjs";
import { requireCoverage, coverageProblems } from "./pipeline/v2/coverage.mjs";
import {
  preparePassBWorkspace, collectPassB, prepareCriticInput, restoreCriticInput, verifyPassBWorkspace,
} from "./pipeline/v2/workspace.mjs";
import { emptyTelemetry, stageFacts, countsFromEvidence, mergeTelemetry } from "./pipeline/v2/telemetry.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INTAKE_DIR = path.join(ROOT, "guides-intake");
const GUIDES_DIR = path.join(ROOT, "src", "content", "guides");

function emit(key, value) {
  if (String(value).includes("\n")) throw new Error(`step output "${key}" carries a newline`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

function git(args, { cwd = ROOT } = {}) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

function commitAndPush(paths, message, { branch = null, cwd = ROOT } = {}) {
  const dirty = git(["status", "--porcelain", "--", ...paths], { cwd }).trim();
  if (!dirty) return null;
  git(["add", "--", ...paths], { cwd });
  git(["commit", "-m", message], { cwd });
  if (branch) git(["push", "origin", `HEAD:${branch}`], { cwd });
  return git(["rev-parse", "HEAD"], { cwd }).trim();
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
      else if (!doc.evidence.some((e) => e.origin === "passA")) problems.push("evidence artifact carries no Pass-A records — a pass that verified nothing is void");
      break;
    }
    case "passB": {
      if (!existsSync(path.join(intakeDir, slug, "passB.v2.json"))) {
        problems.push(`Pass B owes its artifact: guides-intake/${slug}/passB.v2.json (transferred by collect-passb)`);
      }
      break;
    }
    case "reconcile": {
      const doc = await readEvidence(slug, { intakeDir });
      if (!doc) { problems.push(`reconcile owes the merged evidence artifact: guides-intake/${slug}/evidence.v2.json`); break; }
      problems.push(...evidenceProblems(doc, { fullPass: !scoped }));
      problems.push(...researchRuleProblems(doc));
      try {
        const coverage = await requireCoverage(slug, { intakeDir });
        problems.push(...coverageProblems(coverage));
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
      // A V2 run REQUIRES an existing scaffold (new-guide.yml owns scaffolding). The baseline
      // commit recorded on the scaffold stage is what Pass B's clean checkout derives from.
      const scaffoldProblems = await validateStageOutput(slug, "scaffold");
      if (scaffoldProblems.length) {
        console.error(`[pipeline-v2] ${slug} is not scaffolded — V2 researches an existing scaffold, it does not create one:`);
        for (const p of scaffoldProblems) console.error(`  · ${p}`);
        return 1;
      }
      let state = await initRunV2(slug);
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
        problems = [err.message.split("\n")[0]];
      }
      const dirty = git(["status", "--porcelain"]).trim();
      if (problems.length) {
        const isVoid = !dirty; // nothing produced at all — the classic void run
        await stageFail(slug, stage, {
          failureClass: isVoid ? "void-run" : "agent-failure",
          detail: problems.join(" · "),
        });
        commitAndPush([`guides-intake/${slug}/run.v2.json`], `research-v2(${slug}): ${stage} FAILED (${isVoid ? "void" : "invalid output"})`, { branch });
        emit("void", String(isVoid));
        console.error(`[pipeline-v2] ${slug} — stage "${stage}" output does not hold up:`);
        for (const p of problems) console.error(`  · ${p}`);
        return 1;
      }
      // Commit the stage's work (the WORKFLOW commits, never the agent), then checkpoint.
      let workCommit = null;
      if (dirty) {
        git(["add", "-A"]);
        git(["commit", "-m", `research-v2(${slug}): ${stage}`]);
        if (branch) git(["push", "origin", `HEAD:${branch}`]);
        workCommit = git(["rev-parse", "HEAD"]).trim();
      }
      const state = await stageComplete(slug, stage, { commit: workCommit });
      // Telemetry from the workflow boundary: stage duration/model/effort + evidence counts.
      const st = state.stages[stage];
      const evidenceDoc = await readEvidence(slug).catch(() => null);
      const telemetry = mergeTelemetry(state.telemetry || emptyTelemetry(), {
        stages: { [stage]: stageFacts({ startedAt: st.startedAt, endedAt: st.endedAt, model: st.model, effort: st.effort, retries: st.attempts > 1 ? st.attempts - 1 : null }) },
        counts: countsFromEvidence(evidenceDoc),
      });
      await recordTelemetry(slug, telemetry);
      commitAndPush([`guides-intake/${slug}/run.v2.json`], `research-v2(${slug}): ${stage} complete`, { branch });
      emit("void", "false");
      emit("next", nextStageV2(state) || "");
      console.log(`[pipeline-v2] ${slug} — stage "${stage}" complete${workCommit ? ` (work at ${workCommit.slice(0, 7)})` : ""}; next: ${nextStageV2(state) || "(none)"}`);
      return 0;
    }

    case "fail-stage": {
      const stage = get("--stage");
      await stageFail(slug, stage, { failureClass: get("--class") || "unknown", detail: get("--detail") || "" });
      commitAndPush([`guides-intake/${slug}/run.v2.json`], `research-v2(${slug}): ${stage} FAILED`, { branch });
      console.error(`[pipeline-v2] ${slug} — stage "${stage}" recorded as failed (${get("--class") || "unknown"}); branch stays manually resumable.`);
      return 0;
    }

    case "auto-retry": {
      const { allowed, autoRetries, cap } = await recordAutoRetry(slug);
      commitAndPush([`guides-intake/${slug}/run.v2.json`], `chore(pipeline-v2): ${slug} auto-retry ${autoRetries}`, { branch });
      emit("allowed", String(allowed));
      console.log(`[pipeline-v2] ${slug} — auto-retry ${autoRetries} of ${cap}: ${allowed ? "allowed" : "REFUSED (bounded)"}`);
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
      const { dest } = await collectPassB(slug, { fromDir: from });
      console.log(`[pipeline-v2] ${slug} — Pass B artifact validated and transferred to ${dest}.`);
      return 0;
    }

    case "prepare-critic": {
      const { deleted } = prepareCriticInput(slug);
      emit("deleted", deleted.join(","));
      console.log(`[pipeline-v2] ${slug} — critic input prepared; removed: ${deleted.join(", ") || "(nothing present)"}`);
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
        const evidence = await requireEvidence(slug);
        const coverage = await requireCoverage(slug);
        const problems = [
          ...evidenceProblems(evidence, { fullPass: !has("--scoped") }),
          ...researchRuleProblems(evidence),
          ...coverageProblems(coverage),
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
if (isMain(import.meta.url)) {
  const argv = process.argv.slice(2);
  const get = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : null);
  const has = (flag) => argv.includes(flag);
  const cmd = argv[0];
  if (!cmd || cmd.startsWith("--")) {
    console.error("Usage: node scripts/pipeline-v2.mjs <init|route|budget|begin-stage|finish-stage|fail-stage|auto-retry|prepare-passb|verify-passb-workspace|collect-passb|prepare-critic|restore-critic|validate> --slug <slug> …");
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
