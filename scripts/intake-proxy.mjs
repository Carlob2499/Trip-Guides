// Shared PURE logic for the zero-click intake proxy (W5). The Cloudflare Worker (worker/index.mjs)
// imports these; keeping them here (not in the Worker) means they're bundled into the Worker AND
// unit-tested by the existing vitest scripts glob — and renderIssueBody derives from the same
// FIELDS single source as the issue form and the scaffolder, so the body it files can't drift from
// what issue-to-scaffold.mjs parses.

import { FIELDS, answersFromForm, validateAnswers } from "./intake-schema.mjs";

export { answersFromForm, validateAnswers };

// Render the GitHub issue body from a raw {fieldId: value} map, byte-compatible with what GitHub's
// Issue Form produces — "### <Label>\n\n<value>", and the literal "_No response_" for an empty
// field. That exact shape is what parseIssueBody (intake-schema.mjs) reads, so a Worker-filed issue
// round-trips through issue-to-scaffold.mjs identically to a human-submitted one.
export function renderIssueBody(raw) {
  const r = raw || {};
  return FIELDS.map((f) => {
    const v = r[f.id];
    const val = v != null && String(v).trim() !== "" ? String(v).trim() : "_No response_";
    return `### ${f.label}\n\n${val}`;
  }).join("\n\n");
}

// Rate decision for anonymous submissions (they spend the maker's Claude quota, so a stranger can't
// trigger unlimited research runs). Given how many this IP has already filed this window:
//   · over `hardMax` → reject outright (429).
//   · at or over `cap` (but under hardMax) → accept, but WITHOUT the `new-guide` label, so it's
//     queued for the owner to approve instead of auto-researching.
//   · under `cap` → accept and label (auto-research). Pure so the thresholds are testable.
export function intakeRateDecision(count, { cap = 3, hardMax = 10 } = {}) {
  const n = Number(count) || 0;
  if (n >= hardMax) return { accept: false, withLabel: false, reason: "rate-limited" };
  if (n >= cap) return { accept: true, withLabel: false, reason: "over cap — queued for owner approval" };
  return { accept: true, withLabel: true, reason: "ok" };
}

// Best-effort slug guess from the country, mirroring scaffold-guide.mjs's slugify so the progress
// page can start polling immediately (a same-name collision gets "-2" server-side; the bot's issue
// comment carries the authoritative link either way).
export function guessSlug(country) {
  return (
    String(country || "")
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "guide"
  );
}
