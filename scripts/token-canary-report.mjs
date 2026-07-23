// Files (or clears) the token-canary tracking issue based on the probe outcome. Called by
// .github/workflows/token-canary.yml — the workflow runs the minimal Claude probe; this script
// owns the issue bookkeeping (find-or-update-or-close by a fixed title, the same self-healing
// convention scripts/audit/run-audit.mjs uses). Kept out of the workflow YAML so the multi-line
// issue body isn't a fragile heredoc-inside-a-block-scalar.
//
//   OUTCOME=success|failure  RUN_URL=<actions run url>  node scripts/token-canary-report.mjs

import { execFileSync } from "node:child_process";

const TITLE = "🔴 CLAUDE_CODE_OAUTH_TOKEN canary FAILED — the agent pipeline is down";
const LABEL = "token-canary";

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8" });
}

function findOpenIssue() {
  const out = gh(["issue", "list", "--search", `"${TITLE}" in:title`, "--state", "open", "--json", "number,title"]);
  const found = JSON.parse(out).find((i) => i.title === TITLE);
  return found ? found.number : null;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function body(runUrl) {
  return [
    `_Detected ${today()} (UTC)._`,
    "",
    "The weekly token canary could not complete a minimal Claude call — **`CLAUDE_CODE_OAUTH_TOKEN` is almost certainly expired or revoked.**",
    "",
    "While this is red, every agent workflow is silently broken:",
    "- `research-pass.yml` (new-guide generation)",
    "- `recert.yml` (weekly + pre-trip freshness)",
    "- `modify-guide.yml` (scoped edits)",
    "",
    "Deploy / test / audit workflows are unaffected (they use no agent), so nothing else turns red — which is exactly why this canary exists.",
    "",
    "**Fix:** run `claude setup-token` locally, update the `CLAUDE_CODE_OAUTH_TOKEN` repo secret (Settings → Secrets and variables → Actions), then re-run **Actions → Token canary → Run workflow**. A green run closes this issue automatically.",
    "",
    runUrl ? `Failing run: ${runUrl}` : "",
  ].join("\n");
}

const outcome = process.env.OUTCOME || "failure";
const runUrl = process.env.RUN_URL || "";
const existing = findOpenIssue();

if (outcome === "success") {
  if (existing) {
    gh(["issue", "comment", String(existing), "--body", `✅ Canary passed on ${today()} — token works again. Closing.`]);
    gh(["issue", "close", String(existing)]);
    console.log(`[token-canary] green — closed issue #${existing}`);
  } else {
    console.log("[token-canary] green — nothing to do");
  }
} else {
  if (existing) {
    gh(["issue", "edit", String(existing), "--body", body(runUrl)]);
    console.log(`[token-canary] red — updated issue #${existing}`);
  } else {
    gh(["issue", "create", "--title", TITLE, "--body", body(runUrl), "--label", LABEL]);
    console.log("[token-canary] red — opened tracking issue");
  }
}
