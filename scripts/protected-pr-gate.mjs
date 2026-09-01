// Shared unattended protected-main gate for automation-created PRs.
//
// GITHUB_TOKEN-created PRs cannot rely on recursive pull_request workflow events. Callers capture
// the exact base + head, create the PR, then use this helper to explicitly dispatch repository
// gates, wait for all exact-head checks, and refuse if either the PR head or base moved. GitHub
// branch protection / merge queue remains the final atomic enforcement layer; this helper is the
// repository-side fail-closed compatibility contract.

import { gh } from "./lib/cli.mjs";
import { pathToFileURL } from "node:url";

export const PROTECTED_PR_REQUIRED_CHECKS = [
  "required-gate",
  "freeze-policy",
  "Analyze (actions)",
  "Analyze (javascript-typescript)",
];

function latestCheckByName(checkRuns, minimumIds = {}) {
  const latest = new Map();
  for (const check of checkRuns || []) {
    if (!check?.name) continue;
    if (Number(check.id || 0) <= Number(minimumIds[check.name] || 0)) continue;
    const previous = latest.get(check.name);
    if (!previous || Number(check.id || 0) > Number(previous.id || 0)) latest.set(check.name, check);
  }
  return latest;
}

export function protectedCheckState(checkRuns, required = PROTECTED_PR_REQUIRED_CHECKS, minimumIds = {}) {
  const latest = latestCheckByName(checkRuns, minimumIds);
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

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function validSha(value) {
  return /^[0-9a-f]{40}$/.test(String(value || ""));
}

export function currentBaseSha({ repo, base = "main", ghRun = gh }) {
  const value = String(ghRun(["api", `repos/${repo}/branches/${base}`, "--jq", ".commit.sha"])).trim();
  if (!validSha(value)) throw new Error(`could not resolve ${base} SHA: "${value}"`);
  return value;
}

export function currentPrHead({ repo, prNumber, ghRun = gh }) {
  const value = String(ghRun(["pr", "view", String(prNumber), "--repo", repo, "--json", "headRefOid", "--jq", ".headRefOid"])).trim();
  if (!validSha(value)) throw new Error(`could not resolve PR #${prNumber} head SHA: "${value}"`);
  return value;
}

export async function waitForProtectedChecks({
  repo,
  headSha,
  ghRun = gh,
  required = PROTECTED_PR_REQUIRED_CHECKS,
  minimumIds = {},
  timeoutMs = 20 * 60 * 1000,
  pollMs = 5000,
  now = () => Date.now(),
  sleep = defaultSleep,
}) {
  const started = now();
  while (true) {
    const payload = JSON.parse(ghRun(["api", `repos/${repo}/commits/${headSha}/check-runs?per_page=100`]) || "{}");
    const state = protectedCheckState(payload.check_runs, required, minimumIds);
    if (state.failed.length) throw new Error(`protected PR checks failed for ${headSha}: ${state.failed.join(", ")}`);
    if (state.passed) return state;
    if (now() - started >= timeoutMs) {
      const detail = [...state.missing.map((name) => `${name}=missing`), ...state.pending.map((name) => `${name}=pending`)];
      throw new Error(`timed out waiting for protected PR checks on ${headSha}: ${detail.join(", ") || "unknown state"}`);
    }
    await sleep(pollMs);
  }
}

export async function gateProtectedPr({
  repo,
  prNumber,
  branch,
  headSha,
  base = "main",
  baseSha,
  ghRun = gh,
  waitForChecks = waitForProtectedChecks,
}) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(String(repo))) throw new Error(`invalid repository "${repo}"`);
  if (!Number.isSafeInteger(Number(prNumber)) || Number(prNumber) < 1) throw new Error(`invalid PR number "${prNumber}"`);
  if (!branch || !/^[A-Za-z0-9._/-]+$/.test(branch)) throw new Error(`invalid branch "${branch}"`);
  if (!validSha(headSha) || !validSha(baseSha)) throw new Error("exact 40-character head and base SHAs are required");

  const initialBase = currentBaseSha({ repo, base, ghRun });
  if (initialBase !== baseSha) throw new Error(`${base} moved before protected checks: expected ${baseSha}, found ${initialBase}`);
  const initialHead = currentPrHead({ repo, prNumber, ghRun });
  if (initialHead !== headSha) throw new Error(`PR #${prNumber} head moved before protected checks: expected ${headSha}, found ${initialHead}`);

  // A retried landing may already have successful checks on this commit. Record the newest
  // explicitly dispatched gate IDs so only runs created by this transaction can satisfy those
  // two controls. CodeQL may legitimately have completed when the branch head was pushed.
  const beforePayload = JSON.parse(ghRun(["api", `repos/${repo}/commits/${headSha}/check-runs?per_page=100`]) || "{}");
  const before = latestCheckByName(beforePayload.check_runs);
  const minimumIds = Object.fromEntries(
    ["required-gate", "freeze-policy"].map((name) => [name, Number(before.get(name)?.id || 0)]),
  );

  ghRun(["workflow", "run", "required-gate.yml", "--repo", repo, "--ref", branch, "-f", `base=${base}`, "-f", `base_sha=${baseSha}`]);
  ghRun(["workflow", "run", "september-freeze.yml", "--repo", repo, "--ref", branch, "-f", `pr_number=${prNumber}`]);
  await waitForChecks({ repo, headSha, ghRun, minimumIds });

  const finalHead = currentPrHead({ repo, prNumber, ghRun });
  if (finalHead !== headSha) throw new Error(`PR #${prNumber} head moved after protected checks: expected ${headSha}, found ${finalHead}`);
  const finalBase = currentBaseSha({ repo, base, ghRun });
  if (finalBase !== baseSha) throw new Error(`${base} moved after protected checks: tested ${baseSha}, now ${finalBase}; refusing stale integration merge`);
  return { headSha, baseSha };
}

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : "";
}

async function main() {
  const repo = getArg("--repo") || process.env.GITHUB_REPOSITORY || "";
  const prNumber = Number(getArg("--pr"));
  const branch = getArg("--branch");
  const headSha = getArg("--head-sha");
  const base = getArg("--base") || "main";
  const baseSha = getArg("--base-sha");
  await gateProtectedPr({ repo, prNumber, branch, headSha, base, baseSha });
  console.log(`[protected-pr] PR #${prNumber} exact head ${headSha} passed required checks against ${base}@${baseSha}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`[protected-pr] ${err?.message || err}`);
    process.exitCode = 1;
  });
}
