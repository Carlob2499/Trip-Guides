// Parses a "Request a change" issue body (.github/ISSUE_TEMPLATE/modify-guide.yml) into
// { slug, change, section } and prints it as JSON on stdout, for modify-guide.yml to consume
// with `jq`. Reuses field()/isValidSlug() from graduate-guide.mjs — the same "### Label\n\n
// <value>" extraction convention every issue-body parser in this repo already uses, so the two
// can't quietly diverge on the regex.

import { field, isValidSlug } from "./graduate-guide.mjs";
import { isMain } from "./audit/lib.mjs";
// Labels come from the shared schema, never from literals here — that duplication (form vs
// parser, held together by two matching strings) is what a renamed label used to break silently.
import { MODIFY_FIELDS } from "../src/lib/modify-schema.mjs";

const labelOf = (id) => MODIFY_FIELDS.find((f) => f.id === id).label;

// W0/S2 injection hardening for the `section` hint now lives in src/lib/modify-schema.mjs, so
// the in-page change-request wizard sanitises what it SENDS with the identical rule this parser
// uses on what it RECEIVES — a wizard can't offer a value the parser would silently drop.
// Re-exported here because this module is the established import site for it.
export { sanitizeSection, SECTION_ALLOWED, SECTION_MAX } from "../src/lib/modify-schema.mjs";
import { sanitizeSection } from "../src/lib/modify-schema.mjs";

// Pure parse: returns { slug, change, section } or throws Error with a human reason. The CLI
// below maps a throw to stderr + exit 1, preserving the prior behavior the workflow relies on.
export function parseModifyIssue(body) {
  const rawSlug = field(body, labelOf("slug"));
  if (!rawSlug) throw new Error(`no ${labelOf("slug")} field`);
  const slug = rawSlug.trim().toLowerCase();
  if (!isValidSlug(slug)) throw new Error(`"${rawSlug}" isn't a valid slug`);
  const change = field(body, labelOf("change"));
  if (!change) throw new Error(`no '${labelOf("change")}' field`);
  const section = sanitizeSection(field(body, labelOf("section")));
  return { slug, change, section };
}

if (isMain(import.meta.url)) {
  try {
    console.log(JSON.stringify(parseModifyIssue(process.env.ISSUE_BODY || "")));
  } catch (err) {
    console.error(`[parse-modify-issue] ${err.message} — aborting`);
    process.exit(1);
  }
}
