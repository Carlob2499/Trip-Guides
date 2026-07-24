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

// Turn the raw AUTO_CAP env var into the two thresholds intakeRateDecision needs. This is judgment,
// not I/O, so it lives here where it can be tested — the Worker is meant to be I/O only.
//   · a missing/garbage AUTO_CAP falls back to the default rather than silently DISABLING the cap
//     (every comparison against NaN is false, which would auto-research every submission forever).
//   · hardMax floors at 1, so AUTO_CAP=0 means what setting it to 0 obviously intends — "never
//     auto-research, queue EVERYTHING for my approval" — and not "reject everything". A plain
//     cap * 3 gives hardMax 0 there, and the very first submission (count 0 >= 0) is rejected.
// A BLANK value reads as unset, not as 0: Number("") and Number(null) are both 0, so without the
// blank guard, accidentally emptying the var would quietly stop every submission auto-researching.
// Only an explicit numeric 0 means "queue everything".
export function rateThresholds(rawAutoCap, fallback = 3) {
  const s = rawAutoCap == null ? "" : String(rawAutoCap).trim();
  const n = s === "" ? NaN : Number(s);
  const cap = Number.isFinite(n) && n >= 0 ? n : fallback;
  return { cap, hardMax: Math.max(cap * 3, 1) };
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
