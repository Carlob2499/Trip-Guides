// Flips a draft guide's `draft: true` off, deleting the key entirely — matching the
// convention every non-draft guide already follows (denmark.json/korea.json have no
// `draft` key at all, not `draft: false`). Run by .github/workflows/graduate-guide.yml,
// which only fires when the repo owner (write access required) applies the
// `graduate-approved` label to a `graduate-request` issue — filing the nomination
// itself never touches anything. Deliberately does NOT touch `verified` — replacing a
// draft-scaffold warning with an accurate verification date is a content judgment call
// for a human, not something to script.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUIDES_DIR = path.join(ROOT, "src", "content", "guides");

const body = process.env.ISSUE_BODY || "";

function field(label) {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = body.match(new RegExp("###\\s+" + esc + "\\s*\\n+([\\s\\S]*?)(?=\\n###\\s|$)"));
  let v = m ? m[1].trim() : "";
  if (v === "_No response_" || v === "_No response_.") v = "";
  return v;
}

const rawSlug = field("Guide slug");
if (!rawSlug) { console.error("[graduate-guide] no Guide slug field — aborting"); process.exit(1); }

// Slug must match what slugify() in scaffold-guide.mjs can produce — lowercase,
// digits, single hyphens — never trust it as a path segment otherwise.
const slug = rawSlug.trim().toLowerCase();
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error(`[graduate-guide] "${rawSlug}" isn't a valid slug — aborting`);
  process.exit(1);
}

const guidePath = path.join(GUIDES_DIR, `${slug}.json`);
if (!existsSync(guidePath)) {
  console.error(`[graduate-guide] no guide at src/content/guides/${slug}.json — aborting`);
  process.exit(2);
}

const guide = JSON.parse(await readFile(guidePath, "utf8"));
if (!guide.draft) {
  console.error(`[graduate-guide] ${slug}.json isn't a draft (no draft:true) — nothing to do`);
  process.exit(3);
}

delete guide.draft;
await writeFile(guidePath, JSON.stringify(guide, null, 2) + "\n");
console.log(`[graduate-guide] ${slug}.json graduated — draft key removed`);

if (process.env.GITHUB_OUTPUT) {
  const { appendFileSync } = await import("node:fs");
  appendFileSync(process.env.GITHUB_OUTPUT, `slug=${slug}\ncountry=${guide.country || ""}\n`);
}
