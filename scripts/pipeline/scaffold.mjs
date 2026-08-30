// SCAFFOLD LANDING — the protected-main tail of new-guide.yml.
//
// issue-to-scaffold.mjs writes a quarantined draft into the checkout. This module commits that
// draft to an isolated scaffold branch, opens a PR, explicitly dispatches the checks that a
// GITHUB_TOKEN-created PR cannot be trusted to trigger recursively, waits for the exact branch
// head to pass every required check, verifies that the tested main base is still current, merges
// the PR, and only THEN replies/closes the intake issue. Research starts after this function
// returns, so a failed/unknown gate or a moved base leaves the draft isolated and the issue open
// instead of starting research from content that never reached main.

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gh } from "../lib/cli.mjs";
import { isValidSlug } from "../lib/slug.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const SCAFFOLD_REQUIRED_CHECKS = [
  "required-gate",
  "freeze-policy",
  "Analyze (actions)",
  "Analyze (javascript-typescript)",
];

export function scaffoldBranchName(slug, issue) {
  return `scaffold/${slug}-${issue}`;
}

export function scaffoldComment({ slug, repo, guideUrl, progressUrl, prNumber }) {
  const tree = `https://github.com/${repo}/tree/main`;
  const pr = prNumber ? ` through check-gated PR #${prNumber}` : " through the protected scaffold gate";
  return `Scaffolded ✅ — landed on \`main\`${pr}: [\`src/content/guides/${slug}/\`](${tree}/src/content/guides/${slug}) (\`_guide.json\` + per-tab \`NN-*.json\`). It's a **draft** (\`draft: true\`) — reachable directly at ${guideUrl} (not listed on the hub grid while it's a draft) — and the research pass fills the facts from here per the intake spec: [\`guides-intake/${slug}/intake.md\`](${tree}/guides-intake/${slug}/intake.md).

**Watch it happen:** ${progressUrl} — a live timer + step checklist (scaffold → Pass A → Pass B → reconcile → verify → published). Nothing to do here; that page updates itself.

**The research pass is starting automatically** (TWO independent passes → reconcile → critic, Sonnet by default). If it reaches a full verify PASS it **publishes itself**: \`draft: true\` comes off in the same run that merges to \`main\`, and it's live on the next Pages deploy. No approval step, no label, nothing further from you — an "🚀 Auto-published" issue is filed with a one-line rollback if you disagree. If it can't reach PASS (or the run gets cut off) it leaves a draft PR for a human instead, and re-running the workflow resumes from the last checkpoint.

*Didn't start, or want to re-run/target one section?* Actions → Research pass → Run workflow → slug \`${slug}\` (optionally a \`section\`). To drive it by hand instead, print the same prompt CI uses — no second copy to drift:
\`\`\`
WP_SLUG=${slug} WP_SECTION="full pass" node scripts/pipeline.mjs prompt prompts/research-passA.md
\`\`\``;
}

function latestCheckByName(checkRuns) {
  const latest = new Map();
  for (const check of checkRuns || []) {
    if (!check?.name) continue;
    const previous = latest.get(check.name);
    if (!previous || Number(check.id || 0) > Number(previous.id || 0)) latest.set(check.name, check);
  }
  return latest;
}

export function scaffoldCheckState(checkRuns, required = SCAFFOLD_REQUIRED_CHECKS) {
  const latest = latestCheckByName(checkRuns);
  const missing = [];
  const pending = [];
  const failed = [];
  for (const name of required) {
    const check = latest.get(name);
    if (!check) missing.push(name);
    else if (check.status !== "completed") pending.push(name);
    else if (check.conclusion !== "success") failed.push(`${name}=${check.conclusion || "unknown"}`);
  }
  return { missing, pending, failed, passed: missing.length === 0 && pending.length === 0 && failed.length === 0 };
}

export function assertScaffoldBaseUnmoved({ testedBaseSha, currentBaseSha }) {
  if (!/^[0-9a-f]{40}$/.test(String(testedBaseSha))) {
    throw new Error(`could not resolve tested scaffold base SHA: "${testedBaseSha}"`);
  }
  if (!/^[0-9a-f]{40}$/.test(String(currentBaseSha))) {
    throw new Error(`could not resolve current main SHA before scaffold merge: "${currentBaseSha}"`);
  }
  if (testedBaseSha !== currentBaseSha) {
    throw new Error(`main moved after scaffold verification: tested ${testedBaseSha}, current ${currentBaseSha}; refusing stale merge`);
  }
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function waitForScaffoldChecks({
  repo,
  headSha,
  ghRun = gh,
  required = SCAFFOLD_REQUIRED_CHECKS,
  timeoutMs = 20 * 60 * 1000,
  pollMs = 5000,
  now = () => Date.now(),
  sleep = defaultSleep,
}) {
  const started = now();
  while (true) {
    const raw = ghRun(["api", `repos/${repo}/commits/${headSha}/check-runs?per_page=100`]);
    const payload = JSON.parse(raw || "{}");
    const state = scaffoldCheckState(payload.check_runs, required);
    if (state.failed.length) throw new Error(`scaffold checks failed for ${headSha}: ${state.failed.join(", ")}`);
    if (state.passed) return state;
    if (now() - started >= timeoutMs) {
      const detail = [...state.missing.map((name) => `${name}=missing`), ...state.pending.map((name) => `${name}=pending`)];
      throw new Error(`timed out waiting for scaffold checks on ${headSha}: ${detail.join(", ") || "unknown state"}`);
    }
    await sleep(pollMs);
  }
}

export async function landScaffold(
  { slug, country, issue, siteBase, repo, cwd = ROOT },
  { gitRun = null, ghRun = gh, waitForChecks = waitForScaffoldChecks } = {},
) {
  if (!isValidSlug(slug)) throw new Error(`"${slug}" isn't a valid slug`);
  if (!/^\d+$/.test(String(issue))) {
    throw new Error(`"${issue}" isn't an issue number — refusing before anything is committed`);
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(String(repo))) {
    throw new Error(`"${repo}" isn't a valid GitHub repository name`);
  }

  const runGit = gitRun || ((args, { capture = false } = {}) => execFileSync("git", args, {
    cwd,
    encoding: capture ? "utf8" : undefined,
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  }));
  const branch = scaffoldBranchName(slug, issue);
  const title = `Scaffold new guide: ${country || slug} (from #${issue})`;

  runGit(["add", "src/content/guides", "guides-intake"]);
  runGit(["commit", "-m", title]);
  // Preserve the existing serialization/collision behavior: reconcile with whatever reached main
  // since checkout before publishing the isolated branch. A conflict fails before any PR merge.
  runGit(["pull", "--rebase", "origin", "main"]);
  const testedBaseSha = String(runGit(["rev-parse", "origin/main"], { capture: true })).trim();
  if (!/^[0-9a-f]{40}$/.test(testedBaseSha)) throw new Error(`could not resolve tested scaffold base SHA: "${testedBaseSha}"`);
  const headSha = String(runGit(["rev-parse", "HEAD"], { capture: true })).trim();
  if (!/^[0-9a-f]{40}$/.test(headSha)) throw new Error(`could not resolve scaffold head SHA: "${headSha}"`);
  runGit(["push", "origin", `HEAD:refs/heads/${branch}`]);

  ghRun([
    "pr", "create", "--repo", repo, "--base", "main", "--head", branch,
    "--title", title,
    "--body", `Automated quarantined draft scaffold for #${issue}. Merge only after the exact scaffold head passes the repository release gates.`,
  ]);
  const prNumber = Number(String(ghRun(["pr", "view", branch, "--repo", repo, "--json", "number", "--jq", ".number"])).trim());
  if (!Number.isSafeInteger(prNumber) || prNumber < 1) throw new Error(`could not resolve scaffold PR number for ${branch}`);

  // PRs created with GITHUB_TOKEN are not allowed to rely on recursive pull_request workflow
  // dispatch. Explicit workflow_dispatch is the trusted unattended path for the two repo-owned
  // checks; CodeQL default-setup Analyze checks attach to the pushed exact head separately.
  ghRun(["workflow", "run", "required-gate.yml", "--repo", repo, "--ref", branch, "-f", "base=main"]);
  ghRun(["workflow", "run", "september-freeze.yml", "--repo", repo, "--ref", branch, "-f", `pr_number=${prNumber}`]);
  await waitForChecks({ repo, headSha, ghRun });

  // Required-gate dispatch proves the prospective merge against the base that existed when the
  // branch was rebased and checks were launched. Do not allow a later main advance to turn that
  // proof into a stale-base merge; repository up-to-date protection will provide the platform
  // enforcement once issue #130's final settings mutation is available.
  const currentBaseSha = String(ghRun(["api", `repos/${repo}/branches/main`, "--jq", ".commit.sha"])).trim();
  assertScaffoldBaseUnmoved({ testedBaseSha, currentBaseSha });

  ghRun(["pr", "merge", String(prNumber), "--repo", repo, "--merge", "--match-head-commit", headSha, "--delete-branch"]);
  const merged = JSON.parse(ghRun(["pr", "view", String(prNumber), "--repo", repo, "--json", "mergedAt,state"]));
  if (!merged?.mergedAt || merged.state !== "MERGED") {
    throw new Error(`scaffold PR #${prNumber} did not merge; issue remains open and research will not start`);
  }

  const body = scaffoldComment({
    slug,
    repo,
    prNumber,
    guideUrl: `${siteBase}/guides/${slug}/`,
    progressUrl: `${siteBase}/progress/?slug=${slug}`,
  });
  ghRun(["issue", "comment", String(issue), "--repo", repo, "--body", body]);
  ghRun(["issue", "close", String(issue), "--repo", repo]);
  return { slug, issue: String(issue), branch, testedBaseSha, headSha, prNumber };
}

/** Argument resolution, pure and testable. Flags win; env names match new-guide.yml exactly. */
export function resolveScaffoldArgs(get, env = process.env) {
  return {
    slug: get("--slug") || env.SLUG || "",
    country: get("--country") || env.COUNTRY || "",
    issue: get("--issue") || env.ISSUE || "",
    siteBase: (env.SITE_BASE_URL || "").replace(/\/$/, ""),
    repo: env.GITHUB_REPOSITORY || "",
  };
}

export async function runScaffold(get) {
  const args = resolveScaffoldArgs(get);
  const result = await landScaffold(args);
  console.log(`[scaffold] ${args.slug} merged through PR #${result.prNumber}; issue closed.`);
}
