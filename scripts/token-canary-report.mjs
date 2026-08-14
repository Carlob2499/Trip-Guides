// Files (or clears) the token-canary tracking issue based on the probe outcome. Called by
// .github/workflows/token-canary.yml — the workflow runs the minimal Claude probe; this script
// owns the issue bookkeeping (find-or-update-or-close by a fixed title, the same self-healing
// convention scripts/audit/run-audit.mjs uses). Kept out of the workflow YAML so the multi-line
// issue body isn't a fragile heredoc-inside-a-block-scalar.
//
//   OUTCOME=success|failure  RUN_URL=<actions run url>  node scripts/token-canary-report.mjs

import { gh, findOpenIssueByTitle } from "./lib/cli.mjs";

const TITLE = "🔴 CLAUDE_CODE_OAUTH_TOKEN canary FAILED — the agent pipeline is down";
const LABEL = "token-canary";

const findOpenIssue = () => findOpenIssueByTitle(TITLE);

function today() {
  return new Date().toISOString().slice(0, 10);
}

/* The repo owner, derived from GH_REPO ("owner/repo") rather than hardcoded. Used to ASSIGN and
   @-MENTION them on the alert.

   Why this matters more than it looks: the canary already detected the dead token correctly and
   filed this issue — and the pipeline still stayed broken for days, because an issue nobody
   opens is not an alert. Assigning + mentioning routes it through GitHub's OWN notification
   path (email, and mobile push if the GitHub app is installed), which needs no extra service,
   no webhook, and no connector. A scheduled external watcher was considered and rejected: it
   would have had to reach api.github.com from an environment whose proxy intercepts it, i.e. a
   health check that cannot see the thing it is checking. */
function ownerLogin() {
  const repo = process.env.GH_REPO || "";
  const owner = repo.split("/")[0];
  return /^[A-Za-z0-9-]+$/.test(owner) ? owner : null;
}

function body(runUrl) {
  const owner = ownerLogin();
  return [
    owner ? `@${owner} — the agent pipeline is down until this is rotated.` : "",
    "",
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
    // Assign separately, and never let it fail the run: filing the alert is the job, and an
    // assignment that bounces (permissions, a renamed account) must not swallow the alert
    // itself. The @mention in the body above already notifies regardless.
    const owner = ownerLogin();
    if (owner) {
      try {
        gh(["issue", "edit", String(findOpenIssue()), "--add-assignee", owner]);
      } catch {
        console.log("[token-canary] note: could not assign to " + owner + " (issue still filed + mentions them)");
      }
    }
    console.log("[token-canary] red — opened tracking issue");
  }
}
