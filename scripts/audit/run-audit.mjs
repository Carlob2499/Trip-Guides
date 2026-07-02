// Orchestrator: runs all four content-audit checks, builds one Markdown report,
// and finds-or-updates a single tracking GitHub Issue (never opens a duplicate —
// keyed by a fixed title). Pure Node + `gh` CLI, no third-party actions, matching
// this repo's existing workflow convention (see new-guide.yml, ensure-labels.yml).
//
// Local dry run (no GH_TOKEN needed, just prints the report):
//   node scripts/audit/run-audit.mjs --dry-run
// CI run (posts/updates the issue):
//   node scripts/audit/run-audit.mjs

import { execFileSync } from "node:child_process";
import { checkLinks } from "./check-links.mjs";
import { checkPhotos } from "./check-photos.mjs";
import { checkApis } from "./check-apis.mjs";
import { checkStaleness } from "./check-staleness.mjs";
import { isMain } from "./lib.mjs";

const ISSUE_TITLE = "Content audit — automated findings";
const ISSUE_LABEL = "content-audit";

function buildReport({ links, photos, apis, staleness }) {
  const lines = [];
  const today = new Date().toISOString().slice(0, 10);
  lines.push(`_Last run: ${today} (UTC). This issue is updated in place on every run — it does not accumulate duplicates._`, "");

  lines.push("## API canary", "");
  for (const r of apis.results) lines.push(`- ${r.ok ? "✓" : "✗"} **${r.name}** — ${r.detail}`);
  lines.push("");

  lines.push("## Staleness", "");
  lines.push(`Threshold: ${staleness.thresholdDays} days. Drafts skipped (unverified by design): ${staleness.drafts.join(", ") || "none"}.`, "");
  if (staleness.stale.length) {
    for (const s of staleness.stale) lines.push(`- ⚠ **${s.slug}** — last verified ${s.date} (${s.ageDays}d ago)`);
  } else {
    lines.push("- Nothing past threshold.");
  }
  if (staleness.noDate.length) {
    lines.push("", `Guides with a \`verified\` field but no parseable date: ${staleness.noDate.join(", ")}.`);
  }
  lines.push("");

  lines.push("## Links", "");
  lines.push(`Checked ${links.checked} unique URLs.`, "");
  if (links.dead.length) {
    lines.push("**Dead (404/410 — high confidence):**");
    for (const l of links.dead) lines.push(`- ${l.url} — cited by ${l.guides.join(", ")}`);
    lines.push("");
  }
  if (links.blocked.length) {
    lines.push(`<details><summary>Blocked / low confidence (${links.blocked.length}) — likely bot-detection, not actually dead; check manually in a browser before editing anything</summary>`, "");
    for (const l of links.blocked) lines.push(`- ${l.url} (${l.status}) — cited by ${l.guides.join(", ")}`);
    lines.push("", "</details>", "");
  }
  if (links.error.length) {
    lines.push(`<details><summary>Network errors (${links.error.length}) — could be transient or a real outage; retried once already</summary>`, "");
    for (const l of links.error) lines.push(`- ${l.url} (${l.error}) — cited by ${l.guides.join(", ")}`);
    lines.push("", "</details>", "");
  }
  if (!links.dead.length && !links.blocked.length && !links.error.length && !links.other.length) {
    lines.push("- All clean.");
  }
  lines.push("");

  lines.push("## Photos (Wikimedia Commons)", "");
  if (photos.apiError) {
    lines.push(`- Could not check — Commons API error: ${photos.apiError}`);
  } else if (photos.missing.length) {
    for (const m of photos.missing) lines.push(`- ✗ **${m.file}** — cited by ${m.guides.join(", ")}`);
  } else {
    lines.push(`- All ${photos.checked} photo files resolve.`);
  }

  return lines.join("\n");
}

function gh(args, opts = {}) {
  return execFileSync("gh", args, { encoding: "utf8", ...opts });
}

async function postOrUpdateIssue(body) {
  // Find an existing open issue with the fixed title (search, not a stored ID —
  // no state file needed, and it self-heals if the issue is ever manually closed
  // and a fresh one should open).
  const listOut = gh(["issue", "list", "--search", `"${ISSUE_TITLE}" in:title`, "--state", "open", "--json", "number,title"]);
  const existing = JSON.parse(listOut).find((i) => i.title === ISSUE_TITLE);

  if (existing) {
    gh(["issue", "edit", String(existing.number), "--body", body]);
    console.log(`[audit] updated issue #${existing.number}`);
  } else {
    gh(["issue", "create", "--title", ISSUE_TITLE, "--body", body, "--label", ISSUE_LABEL]);
    console.log(`[audit] opened a new tracking issue`);
  }
}

export async function runAudit() {
  const [links, photos, apis, staleness] = await Promise.all([
    checkLinks(),
    checkPhotos(),
    checkApis(),
    checkStaleness(),
  ]);
  return { links, photos, apis, staleness, report: buildReport({ links, photos, apis, staleness }) };
}

if (isMain(import.meta.url)) {
  const dryRun = process.argv.includes("--dry-run");
  const { report } = await runAudit();
  if (dryRun) {
    console.log(report);
  } else {
    await postOrUpdateIssue(report);
  }
}
