// Parses a "Request a major revision" issue body (.github/ISSUE_TEMPLATE/revise-guide.yml)
// into { slug, change, sections, deadline } and prints it as JSON on stdout, for
// revise-guide.yml to consume with `jq`. Reuses field()/isValidSlug() from graduate-guide.mjs
// (the repo-wide "### Label\n\n<value>" extraction convention) and sanitizeSection() from
// parse-modify-issue.mjs (the W0/S2 injection hardening) — so none of the three parsers can
// quietly diverge on either the regex or the neutralization rules.
//
// FALLBACK (synthesis ruling #1): an issue filed on the MODIFY template can be escalated to a
// revision by the owner applying `revision-approved` — the single-intake-surface decision. So
// when the revise field headings are missing, this parser falls back to the modify template's
// shape ("What needs to change", "Section") rather than erroring, and the modify body parses
// into the same output shape with sections=[that one hint].

import { field, isValidSlug } from "./graduate-guide.mjs";
import { sanitizeSection } from "./parse-modify-issue.mjs";
import { isMain } from "./audit/lib.mjs";

// `sections` is a comma list of free-text group hints from a PUBLIC issue body, and each hint
// flows into the planner agent's prompt — same threat model as modify's single `section` field,
// so each token goes through the same sanitizeSection() guard. Tokens that fail the guard are
// dropped (a missing hint is always safer than an attacker-authored one); a hard cap keeps a
// comma-bomb from inflating the prompt.
const MAX_SECTIONS = 10;

export function parseSections(raw) {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((t) => sanitizeSection(t))
    .filter(Boolean)
    .slice(0, MAX_SECTIONS);
}

// `deadline` is interpolated nowhere — it rides the DATA channel with the change text — but
// normalize it to a bare YYYY-MM-DD or drop it, so downstream code never parses freeform dates.
export function parseDeadline(raw) {
  const m = String(raw || "").trim().match(/^(\d{4}-\d{2}-\d{2})$/);
  return m ? m[1] : "";
}

// Pure parse: returns { slug, change, sections, deadline } or throws Error with a human reason.
export function parseReviseIssue(body) {
  const rawSlug = field(body, "Guide slug");
  if (!rawSlug) throw new Error("no Guide slug field");
  const slug = rawSlug.trim().toLowerCase();
  if (!isValidSlug(slug)) throw new Error(`"${rawSlug}" isn't a valid slug`);

  // Revise template shape first, then the modify template's (escalated-issue fallback).
  const reviseChange = field(body, "What changed and why this needs re-research");
  const modifyChange = reviseChange ? null : field(body, "What needs to change");
  const change = reviseChange || modifyChange;
  if (!change) throw new Error("no change description field (neither template shape matched)");

  const sections = reviseChange
    ? parseSections(field(body, "Sections"))
    : parseSections(field(body, "Section")); // modify's single hint → one-element list

  return { slug, change, sections, deadline: parseDeadline(field(body, "Deadline")) };
}

if (isMain(import.meta.url)) {
  try {
    console.log(JSON.stringify(parseReviseIssue(process.env.ISSUE_BODY || "")));
  } catch (err) {
    console.error(`[parse-revise-issue] ${err.message} — aborting`);
    process.exit(1);
  }
}
