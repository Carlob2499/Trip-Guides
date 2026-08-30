// September release-window policy for Waypoint / Trip-Guides.
//
// The tracker has two deliberately different freezes:
//   Sep 20-26: FEATURE FREEZE — code changes must be stabilization/release work.
//   Sep 27-30: BACKEND CODE FREEZE — code changes must be a release blocker or explicit owner waiver.
// The special September freeze expires Oct 1; future release policy is a separate decision.
//
// pull_request_target is the ordinary trusted path. An automated scaffold PR cannot rely on a
// GITHUB_TOKEN-created PR recursively starting that event, so workflow_dispatch may supply the PR
// number explicitly; the job still checks out trusted main and this script fetches PR metadata and
// changed filenames from GitHub rather than executing PR-controlled content.

const FEATURE_FREEZE = "2026-09-20";
const CODE_FREEZE = "2026-09-27";
const FREEZE_END = "2026-10-01";

export const STABILIZATION_LABEL = "stabilization";
export const RELEASE_BLOCKER_LABEL = "release-blocker";
export const FREEZE_WAIVER_LABEL = "freeze-waiver";

const TOP_LEVEL_CODE = new Set([
  "AGENTS.md",
  "CLAUDE.md",
  "PRODUCT.md",
  "docs/pipeline v2/DECISIONS.md",
  "package.json",
  "package-lock.json",
  "astro.config.mjs",
  "tsconfig.json",
  "wrangler.toml",
]);

export function easternDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${map.year}-${map.month}-${map.day}`;
}

export function freezePhase(date) {
  if (date < FEATURE_FREEZE || date >= FREEZE_END) return "open";
  if (date < CODE_FREEZE) return "feature-freeze";
  return "code-freeze";
}

export function isCodePath(file) {
  if (TOP_LEVEL_CODE.has(file)) return true;
  if (/^(?:astro|vite|vitest|playwright|eslint|prettier)\.config\./.test(file)) return true;
  if (file.startsWith(".github/")) return true;
  if (file.startsWith(".agents/")) return true;
  if (file.startsWith("prompts/")) return true;
  if (file.startsWith("scripts/")) return true;
  if (file.startsWith("public/")) return true;
  if (file.startsWith("src/content/guides/")) return false;
  if (file.startsWith("src/")) return true;
  return false;
}

export function evaluateFreeze({ date, labels = [], files = [] }) {
  const phase = freezePhase(date);
  const codeFiles = files.filter(isCodePath);
  const labelSet = new Set(labels.map((label) => String(label).toLowerCase()));

  if (phase === "open" || codeFiles.length === 0) {
    return { allowed: true, phase, codeFiles, reason: codeFiles.length ? "freeze not active" : "no code/control-plane files changed" };
  }

  if (labelSet.has(FREEZE_WAIVER_LABEL)) {
    return { allowed: true, phase, codeFiles, reason: `explicit ${FREEZE_WAIVER_LABEL} owner waiver` };
  }

  if (phase === "feature-freeze") {
    if (labelSet.has(STABILIZATION_LABEL) || labelSet.has(RELEASE_BLOCKER_LABEL)) {
      return { allowed: true, phase, codeFiles, reason: "approved stabilization/release scope" };
    }
    return {
      allowed: false,
      phase,
      codeFiles,
      reason: `feature freeze is active: code/control-plane changes require ${STABILIZATION_LABEL}, ${RELEASE_BLOCKER_LABEL}, or ${FREEZE_WAIVER_LABEL}`,
    };
  }

  if (labelSet.has(RELEASE_BLOCKER_LABEL)) {
    return { allowed: true, phase, codeFiles, reason: "release-blocker scope" };
  }
  return {
    allowed: false,
    phase,
    codeFiles,
    reason: `backend code freeze is active: code/control-plane changes require ${RELEASE_BLOCKER_LABEL} or ${FREEZE_WAIVER_LABEL}`,
  };
}

function githubHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "waypoint-september-freeze-guard",
  };
}

async function pullRequest({ repository, number, token }) {
  const response = await fetch(`https://api.github.com/repos/${repository}/pulls/${number}`, {
    headers: githubHeaders(token),
  });
  if (!response.ok) throw new Error(`GitHub pull-request query failed: ${response.status} ${response.statusText}`);
  return response.json();
}

async function changedFiles({ repository, number, token }) {
  const out = [];
  for (let page = 1; ; page += 1) {
    const url = `https://api.github.com/repos/${repository}/pulls/${number}/files?per_page=100&page=${page}`;
    const response = await fetch(url, { headers: githubHeaders(token) });
    if (!response.ok) throw new Error(`GitHub changed-files query failed: ${response.status} ${response.statusText}`);
    const rows = await response.json();
    out.push(...rows.map((row) => row.filename));
    if (rows.length < 100) return out;
  }
}

async function main() {
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  if (!repository || !token) throw new Error("GITHUB_REPOSITORY and GITHUB_TOKEN are required");

  const dispatchedNumber = process.env.WAYPOINT_FREEZE_PR_NUMBER || "";
  let number;
  let labels;
  if (dispatchedNumber) {
    if (!/^\d+$/.test(dispatchedNumber)) throw new Error(`invalid WAYPOINT_FREEZE_PR_NUMBER "${dispatchedNumber}"`);
    number = Number(dispatchedNumber);
    const pr = await pullRequest({ repository, number, token });
    labels = (pr.labels || []).map((label) => label.name);
  } else {
    const eventPath = process.env.GITHUB_EVENT_PATH;
    if (!eventPath) throw new Error("GITHUB_EVENT_PATH is required without WAYPOINT_FREEZE_PR_NUMBER");
    const { readFile } = await import("node:fs/promises");
    const event = JSON.parse(await readFile(eventPath, "utf8"));
    number = event.pull_request?.number;
    if (!number) throw new Error("September freeze guard requires a pull request or explicit dispatched PR number");
    labels = (event.pull_request.labels || []).map((label) => label.name);
  }

  const date = process.env.WAYPOINT_FREEZE_DATE || easternDate();
  const files = await changedFiles({ repository, number, token });
  const verdict = evaluateFreeze({ date, labels, files });

  console.log(`[september-freeze] pr=#${number} date=${date} phase=${verdict.phase} codeFiles=${verdict.codeFiles.length}`);
  console.log(`[september-freeze] ${verdict.allowed ? "ALLOW" : "BLOCK"}: ${verdict.reason}`);
  if (verdict.codeFiles.length) console.log(verdict.codeFiles.map((file) => `  - ${file}`).join("\n"));
  if (!verdict.allowed) process.exitCode = 1;
}

if (process.argv[1]) {
  const { pathToFileURL } = await import("node:url");
  if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
}
