// Parses a "Request a change" issue body (.github/ISSUE_TEMPLATE/modify-guide.yml) into
// { slug, change, section } and prints it as JSON on stdout, for modify-guide.yml to consume
// with `jq`. Reuses field()/isValidSlug() from graduate-guide.mjs — the same "### Label\n\n
// <value>" extraction convention every issue-body parser in this repo already uses, so the two
// can't quietly diverge on the regex.

import { field, isValidSlug } from "./graduate-guide.mjs";

const body = process.env.ISSUE_BODY || "";
const rawSlug = field(body, "Guide slug");
const change = field(body, "What needs to change");
const section = field(body, "Section");

if (!rawSlug) { console.error("[parse-modify-issue] no Guide slug field — aborting"); process.exit(1); }
const slug = rawSlug.trim().toLowerCase();
if (!isValidSlug(slug)) { console.error(`[parse-modify-issue] "${rawSlug}" isn't a valid slug — aborting`); process.exit(1); }
if (!change) { console.error("[parse-modify-issue] no 'What needs to change' field — aborting"); process.exit(1); }

console.log(JSON.stringify({ slug, change, section }));
