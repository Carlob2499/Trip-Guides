// RUN-INTEGRITY GATE — the harness half of the checkpoint contract (docs/archive/PLAN_FACTORY_V2 P1).
//
// research-pass.yml's prompt MANDATES commit+push after every research stage, so a cut-off run
// resumes instead of restarting. The first real end-to-end run (Japan, 2026-07-29) proved a prompt
// mandate is not a guarantee: passA/passB/reconcile were checkpointed 35 MILLISECONDS apart and
// committed in one burst at the end (d68524e/a3bc3a7/12c6939, all 10:32:33). Three distinct
// commits — so "did each stage get its own commit?" passes — but zero resumability: a crash at
// minute 50 would have lost all three stages. See docs/archive/INDEX.md → QA_RESEARCH_TRIAL_JAPAN F1.
//
// The same run also exposed F2: an agent step can burn a full session, exit `success`, and leave
// NOTHING behind — no commit, no checkpoint, no PR. Nothing in the workflow noticed.
//
// This script is the detective half of both (the preventive half is pipeline.mjs's CLI guard,
// which refuses to checkpoint a stage while its predecessor is still uncommitted):
//
//   --snapshot   → JSON {head, stagesCleared} — capture BEFORE the agent step
//   (audit mode) → compare against that snapshot after the agent step and report
//                  · VOID          the agent produced no durable output at all (F2)
//                  · BATCHED_COMMIT   two stages share one introducing commit
//                  · BURST_COMMIT     consecutive stage commits < MIN_GAP apart
//                  · BURST_CHECKPOINT consecutive stage checkpoints < MIN_GAP apart (the Japan defect)
//
// Only stages introduced BY THIS RUN are judged — a resumed run is never blamed for a prior
// run's batching, and a run that clears a single stage has nothing to violate.
//
// Plain .mjs, node built-ins only.

import { readFileSync, existsSync, appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isValidSlug } from "./lib/slug.mjs";
import { isMain } from "./audit/lib.mjs";
import { STAGE_ORDER } from "./pipeline.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Research stages are tens of minutes of work. Anything under two minutes apart is not two
// stages, it is one burst wearing two labels. Generous on purpose: the cheapest failure mode
// here is a false accusation, so the threshold sits far below any real stage duration
// (Japan's own legitimate reconcile→verified gap was 13 minutes).
export const MIN_GAP_SECONDS = 120;

export function stateRelPath(slug) {
  return `guides-intake/${slug}/state.json`;
}

export function countCleared(state) {
  if (!state?.stages) return 0;
  return STAGE_ORDER.filter((s) => state.stages[s]).length;
}

// ── pure core ────────────────────────────────────────────────────────────────

// history: [{ sha, committedAt (epoch seconds), stages }] oldest → newest.
// Returns { <stage>: { sha, committedAt, stageTs } } for the commit that FIRST recorded each
// stage — the commit that made that stage durable, which is the only one resumability cares about.
export function stageIntroducingCommits(history) {
  const out = {};
  for (const commit of history) {
    for (const stage of STAGE_ORDER) {
      if (out[stage]) continue;
      const ts = commit.stages?.[stage];
      if (ts) out[stage] = { sha: commit.sha, committedAt: commit.committedAt, stageTs: ts };
    }
  }
  return out;
}

// Findings for the stages THIS run introduced. runShas = Set of commit shas created by this run.
export function disciplineFindings({ history, runShas, minGapSeconds = MIN_GAP_SECONDS }) {
  const intro = stageIntroducingCommits(history);
  const findings = [];
  for (let i = 1; i < STAGE_ORDER.length; i++) {
    const prevStage = STAGE_ORDER[i - 1];
    const curStage = STAGE_ORDER[i];
    const prev = intro[prevStage];
    const cur = intro[curStage];
    if (!prev || !cur) continue;
    // Judge only pairs this run actually created — never re-litigate history it inherited.
    if (!runShas.has(prev.sha) || !runShas.has(cur.sha)) continue;

    if (prev.sha === cur.sha) {
      findings.push({
        kind: "BATCHED_COMMIT",
        stages: [prevStage, curStage],
        detail: `"${prevStage}" and "${curStage}" were both first recorded by the SAME commit ${cur.sha.slice(0, 7)} — a crash between them would have lost both.`,
      });
      continue;
    }

    const commitGap = cur.committedAt - prev.committedAt;
    if (commitGap < minGapSeconds) {
      findings.push({
        kind: "BURST_COMMIT",
        stages: [prevStage, curStage],
        detail: `"${prevStage}" (${prev.sha.slice(0, 7)}) and "${curStage}" (${cur.sha.slice(0, 7)}) were committed ${commitGap}s apart — under the ${minGapSeconds}s floor, so they were written in one burst at the end, not after each stage.`,
      });
    }

    const checkpointGap = (Date.parse(cur.stageTs) - Date.parse(prev.stageTs)) / 1000;
    if (Number.isFinite(checkpointGap) && checkpointGap < minGapSeconds) {
      findings.push({
        kind: "BURST_CHECKPOINT",
        stages: [prevStage, curStage],
        detail: `"${prevStage}" (${prev.stageTs}) and "${curStage}" (${cur.stageTs}) were checkpointed ${checkpointGap.toFixed(3)}s apart — real research stages cannot complete that fast.`,
      });
    }
  }
  return findings;
}

// F2: an agent run that moved NOTHING durable — no new commit AND no stage advanced — is void,
// however green its exit status looked.
export function voidVerdict({ preHead, postHead, preStages, postStages }) {
  const movedHead = preHead !== postHead;
  const advancedStage = postStages > preStages;
  return {
    void: !movedHead && !advancedStage,
    movedHead,
    advancedStage,
  };
}

export function formatReport({ slug, verdict, findings }) {
  const lines = [];
  if (verdict.void) {
    lines.push(`❌ VOID RUN — ${slug}: the agent step produced no durable output at all.`);
    lines.push(`   HEAD did not move and no pipeline stage advanced. A green step status here means`);
    lines.push(`   the session ran and left nothing behind (QA finding F2) — not that the work is done.`);
  } else {
    lines.push(`✓ durable output present — ${slug}: ${verdict.movedHead ? "HEAD moved" : "HEAD unchanged"}, ${verdict.advancedStage ? "a stage advanced" : "no stage advanced"}.`);
  }
  if (findings.length) {
    lines.push(``, `❌ CHECKPOINT DISCIPLINE VIOLATED — ${findings.length} finding(s):`);
    for (const f of findings) lines.push(`   · [${f.kind}] ${f.detail}`);
    lines.push(
      ``,
      `   The contract (research-pass.yml header) is: checkpoint AND COMMIT after EACH stage, so a`,
      `   cut-off run resumes at the next un-done stage. Stages recorded in one burst are not`,
      `   resumable no matter how many commits they end up in.`,
    );
  } else {
    lines.push(`✓ checkpoint discipline held — every stage this run cleared was committed on its own.`);
  }
  return lines.join("\n");
}

// ── git adapters (impure) ────────────────────────────────────────────────────

function git(args, { cwd = ROOT } = {}) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

function readCommittedState(sha, relPath) {
  try { return JSON.parse(git(["show", `${sha}:${relPath}`])); }
  catch { return null; }
}

export function gitHistoryFor(slug, { head = "HEAD" } = {}) {
  const rel = stateRelPath(slug);
  let log;
  try { log = git(["log", "--reverse", "--format=%H %ct", head, "--", rel]); }
  catch { return []; }
  return log.trim().split("\n").filter(Boolean).map((line) => {
    const [sha, ct] = line.trim().split(/\s+/);
    const state = readCommittedState(sha, rel);
    return { sha, committedAt: Number(ct), stages: state?.stages || {} };
  });
}

export function shasInRun(preHead, head = "HEAD") {
  try {
    const out = git(["rev-list", `${preHead}..${head}`]);
    return new Set(out.trim().split("\n").filter(Boolean));
  } catch {
    return new Set();
  }
}

function readWorkingState(slug) {
  const p = path.join(ROOT, stateRelPath(slug));
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, "utf8")); }
  catch { return null; }
}

function emitOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

function emitSummary(text) {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + "\n");
}

// ── CLI ──────────────────────────────────────────────────────────────────────
// node scripts/check-run-integrity.mjs --slug japan --snapshot
// node scripts/check-run-integrity.mjs --slug japan --pre-head <sha> --pre-stages <n> [--head <sha>] [--report-only]
//
// Exit codes (audit mode): 0 clean · 3 void or discipline violation · 1 bad usage.
// --report-only forces exit 0 so a workflow can run its remediation steps (auto-retry, stuck
// issue) BEFORE a final step enforces the failure. Explicit over ambient (CLAUDE.md #4).
if (isMain(import.meta.url)) {
  const argv = process.argv.slice(2);
  const get = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : null);
  const slug = get("--slug");
  if (!slug || !isValidSlug(slug)) {
    console.error("Usage: node scripts/check-run-integrity.mjs --slug <slug> [--snapshot | --pre-head <sha> --pre-stages <n> [--head <sha>] [--report-only]]");
    process.exit(1);
  }

  const head = get("--head") || "HEAD";

  if (argv.includes("--snapshot")) {
    let sha;
    try { sha = git(["rev-parse", head]).trim(); } catch { sha = ""; }
    const snap = { head: sha, stagesCleared: countCleared(readWorkingState(slug)) };
    console.log(JSON.stringify(snap));
    emitOutput("head", snap.head);
    emitOutput("stages", String(snap.stagesCleared));
    process.exit(0);
  }

  const preHead = get("--pre-head");
  const preStages = Number(get("--pre-stages") ?? "0");
  if (!preHead) {
    console.error("[run-integrity] --pre-head is required in audit mode (capture it with --snapshot before the agent step).");
    process.exit(1);
  }

  let postHead;
  try { postHead = git(["rev-parse", head]).trim(); } catch { postHead = ""; }
  const postState = head === "HEAD" ? readWorkingState(slug) : readCommittedState(postHead, stateRelPath(slug));
  const postStages = countCleared(postState);

  const verdict = voidVerdict({ preHead: git(["rev-parse", preHead]).trim(), postHead, preStages, postStages });
  const findings = disciplineFindings({
    history: gitHistoryFor(slug, { head }),
    runShas: shasInRun(preHead, head),
  });

  const report = formatReport({ slug, verdict, findings });
  console.log(report);
  emitSummary(`### Run integrity — ${slug}\n\n\`\`\`\n${report}\n\`\`\``);
  emitOutput("void", String(verdict.void));
  emitOutput("violations", String(findings.length));
  emitOutput("kinds", findings.map((f) => f.kind).join(","));

  const failed = verdict.void || findings.length > 0;
  process.exit(failed && !argv.includes("--report-only") ? 3 : 0);
}
