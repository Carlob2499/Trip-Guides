// Bridges a "New guide" GitHub Issue Form to the scaffolder. Run by
// .github/workflows/new-guide.yml. Reads the issue body from $ISSUE_BODY, parses + maps + validates
// it via the shared intake-schema (the single source of truth — scripts/intake-schema.mjs), writes
// the scaffold + intake via writeScaffold, and emits the chosen slug to $GITHUB_OUTPUT for the
// workflow's commit steps.
//
// All field knowledge (labels, kinds, null-ish defaults, the dates→start/end and priorities→array
// transforms) lives in intake-schema.mjs, so this file can never drift from the issue form or the
// scaffolder: it just wires them together.

import { appendFileSync } from "node:fs";
import { writeScaffold } from "./scaffold-guide.mjs";
import { parseIssueBody, answersFromForm, validateAnswers } from "./intake-schema.mjs";

const body = process.env.ISSUE_BODY || "";
const answers = answersFromForm(parseIssueBody(body));

const v = validateAnswers(answers);
if (!v.ok) { console.error(`[issue-to-scaffold] invalid intake: ${v.error} — aborting`); process.exit(1); }

const res = await writeScaffold(answers);
console.log(`[issue-to-scaffold] wrote scaffold for ${answers.country} (slug: ${res.slug})`);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `slug=${res.slug}\ncountry=${answers.country}\n`);
}
