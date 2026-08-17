// THE GATES — every check a workflow used to do in inline bash, in one tested place.
//
// Each of these was a heredoc in a YAML `run:` block: unlintable, untestable, and duplicated
// between research-pass.yml and revise-guide.yml where the two had already drifted. The logic is
// unchanged; only its address is. Every gate here reads its evidence off disk or git and emits
// GitHub step outputs, so the workflow step stays one line.
//
// What each gate is FOR (delete a gate only if you can answer this):
//   budget     — a headless run that keeps getting cut off must eventually stop and ask a human
//                instead of resuming forever. The attempt count is committed on the run's own
//                branch, so the breaker's memory survives a run that dies before anything else.
//   artifacts  — an agent whose required record is missing did not do its job, however green the
//                step looked. Alarm, not barrier, on the research side (the critic writes the
//                artifacts itself, so the check necessarily runs after it).
//   coverage   — the reconcile blind spot: one agent merges two independent passes and nothing
//                downstream can see what the merge silently dropped. Deterministic, agent-free,
//                and a real barrier — it runs BEFORE the critic spends tokens.
//   compose    — composition is deterministic code, not agent judgement; exit 2 is a standing
//                proposal (surface it), anything else nonzero is a real error (fail).
//   integrity  — a run can burn a full session, exit `success`, and leave nothing behind, or
//                record several stages in one burst that is not resumable. Both go red.
//   forks      — the Clarifying-Questions Doctrine, headless: a blocking fork pauses the run and
//                asks on the issue rather than guessing.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gh, findOpenIssueByTitle } from "../lib/cli.mjs";
// One-way import: pipeline.mjs reaches these gates by dynamic import inside its CLI, so the
// spine stays cycle-free and a plain `--checkpoint` never loads any of this.
import { readState, bumpAttempt, nextStage, statusLines, statePath } from "../pipeline.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const INTAKE_DIR = path.join(ROOT, "guides-intake");

export const CAPS = { research: 5, change: 3 };

export function ledgerPath(slug, intakeDir = INTAKE_DIR) {
  return path.join(intakeDir, slug, "ledger.md");
}

export function emitOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

export function emitSummary(text) {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + "\n");
}

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });
}

// ── attempt budget ───────────────────────────────────────────────────────────

// Pure: given the state and the lifecycle, how many attempts and is the cap blown? A `change`
// run counts separately from research — they are different lifecycles with different costs, and
// a guide that took four research attempts starts its first change run at attempt 1.
export function attemptsOf(state, lifecycle) {
  if (lifecycle === "change") return state?.change?.attempts || 0;
  return state?.attempts || 0;
}

export async function bumpChangeAttempt(slug, { now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  const state = (await readState(slug, { intakeDir })) || { slug, createdAt: now, updatedAt: now, stages: {}, attempts: 0, notes: [] };
  state.change = { ...(state.change || {}), attempts: (state.change?.attempts || 0) + 1, updatedAt: now };
  state.updatedAt = now;
  await mkdir(path.join(intakeDir, slug), { recursive: true });
  await writeFile(statePath(slug, intakeDir), JSON.stringify(state, null, 2) + "\n");
  return state;
}

async function gateBudget({ slug, lifecycle = "research", branch, cap = CAPS[lifecycle] || 5 }) {
  const before = await readState(slug);
  if (lifecycle === "research" && before && !nextStage(before)) {
    console.log(`[budget] ${slug} already reached verified — nothing to do.`);
    emitOutput("should_run", "false");
    return 0;
  }

  const state = lifecycle === "change" ? await bumpChangeAttempt(slug) : await bumpAttempt(slug);
  const attempts = attemptsOf(state, lifecycle);
  emitOutput("attempts", String(attempts));
  emitOutput("next", nextStage(state) || "");

  // Persist the bumped count on THIS branch now, so the breaker's memory does not depend on the
  // agent ever reaching a commit step. (On main this used to never land at all: a failing guide
  // never reached the merge that would have carried it, so the cap could not trip.)
  const rel = `guides-intake/${slug}/state.json`;
  if (branch && git(["status", "--porcelain", "--", rel]).trim()) {
    git(["add", rel]);
    git(["commit", "-m", `chore(pipeline): ${lifecycle} attempt ${attempts}`]);
    git(["push", "origin", `HEAD:${branch}`]);
  }

  // Trips AFTER the cap-th attempt so the message names the count that actually triggered it.
  if (attempts > cap) {
    console.log(`[budget] ${slug} has been attempted ${attempts} times (cap ${cap}) — flagging instead of continuing.`);
    fileStuckIssue({
      slug,
      title: `${lifecycle === "change" ? "Change" : "Research"} stuck: ${slug}`,
      body:
        `Automated ${lifecycle} has run **${attempts}** times for \`${slug}\` without completing.\n\n` +
        "Current status:\n```\n" + statusLines(slug, state).join("\n") + "\n```\n\n" +
        `Either finish it by hand or re-run — the attempt count only resets if \`${rel}\` is edited directly ` +
        "(git-tracked, so that is a deliberate act, not automatic).",
    });
    emitOutput("should_run", "false");
    return 1;
  }

  console.log(`[budget] ${slug} — ${lifecycle} attempt ${attempts} of ${cap}, proceeding.`);
  emitOutput("should_run", "true");
  return 0;
}

// One stuck-issue path for every circuit breaker: comment on the open one if it exists, else file
// it. Search-based, so a manually closed issue self-heals into a new one.
export function fileStuckIssue({ slug, title, body }) {
  try {
    const existing = findOpenIssueByTitle(title);
    if (existing) gh(["issue", "comment", String(existing), "--body", body]);
    else gh(["issue", "create", "--title", title, "--body", body, "--label", "stuck"]);
  } catch (err) {
    console.error(`[gate] could not file the stuck issue for ${slug}: ${err.message}`);
  }
}

// ── required artifacts ───────────────────────────────────────────────────────

// Pure: which required headings are missing from a document. The critic's continuity-sweep record
// is conditional — a clean pass edits nothing and owes no sweep — so it is only required when
// findings exist and are not the clean-pass sentinel.
export function missingArtifacts(text, stage) {
  const md = String(text || "");
  const has = (h) => new RegExp(`^${h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m").test(md);
  const missing = [];

  if (stage === "critic") {
    for (const h of ["## Critic findings", "## Citation audit"]) if (!has(h)) missing.push(h);
    const findingsBody = md.split(/^## Critic findings/m)[1] || "";
    const clean = /^\s*\r?\n?None/i.test(findingsBody);
    if (has("## Critic findings") && !clean && !has("#### Continuity sweep — critic execution")) {
      missing.push("#### Continuity sweep — critic execution");
    }
    return missing;
  }

  if (stage === "change") {
    // The change agent's sweep record is unconditional: a change run that edited nothing has
    // nothing to land, so there is always something to sweep for.
    if (!has("## Continuity sweep")) missing.push("## Continuity sweep");
    return missing;
  }

  throw new Error(`unknown artifact stage "${stage}"`);
}

async function gateArtifacts({ slug, stage, file }) {
  const target = file || ledgerPath(slug);
  if (!existsSync(target)) {
    console.error(`::error::${stage} artifact gate — ${path.relative(ROOT, target)} does not exist.`);
    return 1;
  }
  const missing = missingArtifacts(await readFile(target, "utf8"), stage);
  if (missing.length) {
    console.error(
      `::error::${stage} run ended without required artifact(s): ${missing.map((m) => `'${m}'`).join(" ")} ` +
        `in ${path.relative(ROOT, target)} — the stage's own protocol was not completed.`,
    );
    return 1;
  }
  console.log(`[gate] ${stage} artifacts present in ${path.relative(ROOT, target)}`);
  return 0;
}

// ── delegated gates ──────────────────────────────────────────────────────────

function runNode(args) {
  try { execFileSync(process.execPath, args, { cwd: ROOT, stdio: "inherit" }); return 0; }
  catch (err) { return typeof err?.status === "number" ? err.status : 1; }
}

function captureNode(args) {
  try { return { code: 0, out: execFileSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }) }; }
  catch (err) { return { code: typeof err?.status === "number" ? err.status : 1, out: `${err?.stdout || ""}${err?.stderr || ""}` }; }
}

// Quantitative floors bite only on a FULL pass — a section-scoped re-run legitimately produces
// few B finds, and gating it would punish precision.
function gateCoverage({ slug, floors }) {
  const args = [path.join(ROOT, "scripts", "check-passb-coverage.mjs"), "--slug", slug];
  if (floors) args.push("--floors");
  return runNode(args);
}

// exit 0 = composed · exit 2 = a standing proposal (surface it, stay green) · anything else is a
// real error (the ⚠-relocation guard, unit loss) and fails the run.
function gateCompose({ slug }) {
  const { code, out } = captureNode([path.join(ROOT, "scripts", "compose-guide.mjs"), "--slug", slug, "--check"]);
  console.log(out);
  emitSummary(`### Composer\n\n\`\`\`\n${out}\n\`\`\``);
  if (code === 2) {
    emitSummary("Standing proposal — composition applies inside the next research pass (drafts) or via `--write --creator-signed` (live).");
    return 0;
  }
  return code;
}

// --report-only keeps the step green so remediation (the void auto-retry, the stuck issue) still
// runs; a later `gate enforce` is what turns the run red. A lifecycle with no remediation between
// the two passes --enforce and gets the verdict immediately.
function gateIntegrity({ slug, preHead, preStages, enforce }) {
  const args = [
    path.join(ROOT, "scripts", "check-run-integrity.mjs"),
    "--slug", slug,
    "--pre-head", preHead,
    "--pre-stages", String(preStages ?? 0),
  ];
  if (!enforce) args.push("--report-only");
  return runNode(args);
}

// The SAME deterministic contradiction check new-guide.yml runs after scaffolding, re-run before
// any agent budget is spent: a human may have hand-elaborated the intake since, and a date range
// narrowed in prose but never reflected in the flat bullet is exactly how a contradiction gets in.
// Idempotent, and never fails the run — a finding becomes a traveler question, not a red build.
// Pure: the file the preflight's --write actually mutates, so the commit below and the writer
// (applyContradictions → guides-intake/<slug>/ledger.md) cannot disagree again. It used to
// commit intake.md — the one file the check NEVER writes (intake is frozen intent; findings are
// recorded beside it) — so every preflight finding was silently left uncommitted.
export function preflightCommitPath(slug) {
  return `guides-intake/${slug}/ledger.md`;
}

function gatePreflight({ slug, branch }) {
  runNode([path.join(ROOT, "scripts", "audit", "check-intake-contradictions.mjs"), "--slug", slug, "--write"]);
  const rel = preflightCommitPath(slug);
  if (branch && git(["status", "--porcelain", "--", rel]).trim()) {
    git(["add", rel]);
    git(["commit", "-m", `chore(intake): stamp contradiction findings for ${slug}`]);
    git(["push", "origin", `HEAD:${branch}`]);
  }
  return 0;
}

// The verdict, run AFTER remediation so a void run still gets its retry dispatched and its stuck
// issue filed before the workflow goes red — but it does go red: a run that produced nothing, or
// that faked its staging, is a failed run no matter what merged.
function gateEnforce({ isVoid, violations, kinds, compose }) {
  let failed = false;
  if (String(isVoid) === "true") {
    console.error("::error::Void run — the agent produced no durable output. Remediation dispatched above.");
    failed = true;
  }
  if (violations && String(violations) !== "0") {
    console.error(`::error::Checkpoint discipline violated — ${violations} finding(s), kinds: ${kinds || "?"}. The stages this run cleared are not resumable.`);
    failed = true;
  }
  // The compose check now runs BEFORE landing (continue-on-error, so a failure downgrades the
  // landing to a draft PR instead of skipping it) — this is where that deferred failure turns
  // the run red, after remediation and the draft-PR landing have both had their chance.
  if (compose === "failure") {
    console.error("::error::Compose check failed — the run landed as a draft at most; the composition error needs a human.");
    failed = true;
  }
  if (failed) return 1;
  console.log("[run-integrity] clean.");
  return 0;
}

// A second void in a row is not a flake — the run is stuck in a way retrying cannot fix.
function gateStuck({ slug, lifecycle = "research", runUrl }) {
  fileStuckIssue({
    slug,
    title: `${lifecycle === "change" ? "Change" : "Research"} stuck: ${slug}`,
    body:
      `Two consecutive ${lifecycle} runs for \`${slug}\` produced **no durable output** — no commit, no ` +
      `checkpoint advance — while reporting success. The auto-retry has been spent.\n\n` +
      `A green agent step is not evidence of work. Check the run log before dispatching again.` +
      (runUrl ? `\n\nLatest run: ${runUrl}` : ""),
  });
  return 0;
}

// ── fork gate ────────────────────────────────────────────────────────────────

// The Clarifying-Questions Doctrine's headless mechanism. A change agent that hits a fork it
// cannot resolve writes change-forks.json and stops; this posts the questions on the originating
// issue, labels it, and halts the run before anything lands. Silently guessing and silently
// ignoring are both wrong — so a fork file with no issue to ask on is still a hard stop.
export function forkComment(forks, slug) {
  const lines = [
    `**Paused: ${forks.length === 1 ? "a decision" : `${forks.length} decisions`} only you can make.**`,
    "",
    `The change run on \`${slug}\` reached a fork it cannot resolve without guessing at what you want, so it stopped rather than pick one.`,
    "",
  ];
  forks.forEach((f, i) => {
    lines.push(`${i + 1}. **${f.question || f.id}**`);
    if (f.options?.length) for (const o of f.options) lines.push(`   - ${o}`);
    if (f.affects) lines.push(`   - Affects: ${f.affects}`);
  });
  lines.push("", "Answer here and re-run the change — nothing was written.");
  return lines.join("\n");
}

async function gateForks({ slug, file = "change-forks.json", issue }) {
  const target = path.isAbsolute(file) ? file : path.join(ROOT, file);
  if (!existsSync(target)) {
    emitOutput("blocked", "false");
    console.log("[gate] no blocking forks.");
    return 0;
  }
  let forks;
  try { forks = JSON.parse(await readFile(target, "utf8")); }
  catch { forks = []; }
  if (!Array.isArray(forks) || !forks.length) {
    emitOutput("blocked", "false");
    console.log("[gate] fork file present but empty — proceeding.");
    return 0;
  }

  const body = forkComment(forks, slug);
  emitOutput("blocked", "true");
  emitSummary(`### Fork gate — paused\n\n${body}`);
  if (!issue) {
    // Nowhere to ask is a real failure: the run would otherwise pause silently forever.
    console.error("::error::Blocking fork(s) with no issue to ask on — the run stops rather than guess.");
    console.error(body);
    return 1;
  }
  try {
    gh(["issue", "comment", String(issue), "--body", body]);
    gh(["issue", "edit", String(issue), "--add-label", "needs-decision"]);
    console.log(`[gate] ${forks.length} blocking fork(s) — asked on #${issue}, run paused.`);
  } catch (err) {
    console.error(`[gate] could not comment on #${issue}: ${err.message}`);
    return 1;
  }
  // Paused, not failed. A run waiting on the creator is not a broken run, so this stays green and
  // the caller skips the rest on `blocked == 'true'`.
  return 0;
}

// ── dispatcher ───────────────────────────────────────────────────────────────

export async function runGate(kind, opts) {
  switch (kind) {
    case "budget": return gateBudget(opts);
    case "preflight": return gatePreflight(opts);
    case "artifacts": return gateArtifacts(opts);
    case "coverage": return gateCoverage(opts);
    case "compose": return gateCompose(opts);
    case "integrity": return gateIntegrity(opts);
    case "enforce": return gateEnforce(opts);
    case "stuck": return gateStuck(opts);
    case "forks": return gateForks(opts);
    default:
      console.error(`[gate] unknown gate "${kind}" — one of: budget, preflight, artifacts, coverage, compose, integrity, enforce, stuck, forks`);
      return 1;
  }
}
