// SCAFFOLD LANDING — the protected-main tail of new-guide.yml.
//
// issue-to-scaffold.mjs writes a quarantined draft into the checkout. This module commits that
// draft to an isolated scaffold branch, opens a PR, explicitly dispatches the checks that a
// GITHUB_TOKEN-created PR cannot be trusted to trigger recursively, waits for the exact branch
// head to pass every required check against an exact base SHA, merges the PR, and only THEN
// replies/closes the intake issue. Research starts after this function returns, so a failed,
// unknown, or stale-base gate leaves the draft isolated and the issue open.

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gh } from "../lib/cli.mjs";
import { isValidSlug } from "../lib/slug.mjs";
import {
  PROTECTED_PR_REQUIRED_CHECKS,
  gateProtectedPr,
  protectedCheckState,
  waitForProtectedChecks,
} from "../protected-pr-gate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const SCAFFOLD_REQUIRED_CHECKS = PROTECTED_PR_REQUIRED_CHECKS;
export const scaffoldCheckState = protectedCheckState;
export const waitForScaffoldChecks = waitForProtectedChecks;

export function scaffoldBranchName(slug, issue) {
  return `scaffold/${slug}-${issue}`;
}

export function scaffoldComment({ slug, repo, guideUrl, progressUrl, prNumber }) {
  const tree = `https://github.com/${repo}/tree/main`;
  const pr = prNumber ? ` through check-gated PR #${prNumber}` : " through the protected scaffold gate";
  return `Scaffolded ✅ — landed on \`main\`${pr}: [\`src/content/guides/${slug}/\`](${tree}/src/content/guides/${slug}) (\`_guide.json\` + per-tab \`NN-*.json\`). It's a **draft** (\`draft: true\`) — reachable directly at ${guideUrl} (not listed on the hub grid while it's a draft) — and the research pass fills the facts from here per the intake spec: [\`guides-intake/${slug}/intake.md\`](${tree}/guides-intake/${slug}/intake.md).

**Watch it happen:** ${progressUrl} — a live timer + step checklist (scaffold → Pass A → Pass B → reconcile → verify → published). Nothing to do here; that page updates itself.

**The research pipeline is starting automatically** (Pass A → Pass B → Reconcile → Critic). The active engine owns its model routing; this issue comment does not duplicate that contract. If it reaches a full verify PASS it **publishes itself**: \`draft: true\` comes off in the same run that merges to \`main\`, and it's live on the next Pages deploy. No approval step, no label, nothing further from you — an "🚀 Auto-published" issue is filed with a one-line rollback if you disagree. If it can't reach PASS (or the run gets cut off) it leaves a draft PR for a human instead, and re-running the workflow resumes from the last checkpoint.

*Didn't start, or need a manual resume?* In Actions, use **Research pass (V2)** when this guide has \`guides-intake/${slug}/run.v2.json\`; otherwise use **Research pass**. Supply slug \`${slug}\` and only a section when you intentionally want a scoped pass.`;
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
  // Preserve serialization/collision behavior and make the scaffold head contain the base that
  // will be tested. A later main movement is detected after checks and refused before merge.
  runGit(["pull", "--rebase", "origin", "main"]);
  const headSha = String(runGit(["rev-parse", "HEAD"], { capture: true })).trim();
  const baseSha = String(runGit(["rev-parse", "origin/main"], { capture: true })).trim();
  if (!/^[0-9a-f]{40}$/.test(headSha)) throw new Error(`could not resolve scaffold head SHA: "${headSha}"`);
  if (!/^[0-9a-f]{40}$/.test(baseSha)) throw new Error(`could not resolve scaffold base SHA: "${baseSha}"`);
  runGit(["push", "origin", `HEAD:refs/heads/${branch}`]);

  ghRun([
    "pr", "create", "--repo", repo, "--base", "main", "--head", branch,
    "--title", title,
    "--body", `Automated quarantined draft scaffold for #${issue}. Merge only after the exact scaffold head passes the repository release gates.`,
  ]);
  const prNumber = Number(String(ghRun(["pr", "view", branch, "--repo", repo, "--json", "number", "--jq", ".number"])).trim());
  if (!Number.isSafeInteger(prNumber) || prNumber < 1) throw new Error(`could not resolve scaffold PR number for ${branch}`);

  await gateProtectedPr({
    repo,
    prNumber,
    branch,
    headSha,
    base: "main",
    baseSha,
    ghRun,
    waitForChecks,
  });

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
  return { slug, issue: String(issue), branch, headSha, baseSha, prNumber };
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
