// Bridges a "New guide" GitHub Issue Form to the scaffolder. Run by
// .github/workflows/new-guide.yml. Reads the issue body from $ISSUE_BODY, extracts
// the form fields (by their labels), writes the scaffold + intake via writeScaffold,
// and emits the chosen slug to $GITHUB_OUTPUT for the workflow's commit/PR steps.
//
// No third-party actions: the issue-form body is parsed here with a small regex.

import { appendFileSync } from "node:fs";
import { writeScaffold, dayLabelsFromRange } from "./scaffold-guide.mjs";

const body = process.env.ISSUE_BODY || "";

// Issue Forms render each field as "### <Label>\n\n<value>". Empty inputs render the
// literal "_No response_". Extract a field's value by its label.
function field(label) {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = body.match(new RegExp("###\\s+" + esc + "\\s*\\n+([\\s\\S]*?)(?=\\n###\\s|$)"));
  let v = m ? m[1].trim() : "";
  if (v === "_No response_" || v === "_No response_.") v = "";
  return v;
}

const country = field("Country");
if (!country) { console.error("[issue-to-scaffold] no Country field — aborting"); process.exit(1); }

const dates = field("Trip dates");
const [start, end] = dates ? dates.split(/\s+to\s+/i).map((s) => s.trim()) : [];
const prioRaw = field("Top priorities");

const answers = {
  country,
  cities: field("City / cities"),
  who: field("Who's going"),
  start, end,
  priorities: prioRaw ? prioRaw.split(",").map((s) => s.trim()).filter(Boolean) : [],
  dayLabels: dayLabelsFromRange(start, end),
};

const res = await writeScaffold(answers);
console.log(`[issue-to-scaffold] wrote scaffold for ${country} (slug: ${res.slug})`);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `slug=${res.slug}\ncountry=${country}\n`);
}
