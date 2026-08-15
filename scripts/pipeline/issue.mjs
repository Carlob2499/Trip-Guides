// Issue-body parsing for the CHANGE lifecycle — one parser where there used to be two
// (scripts/parse-modify-issue.mjs + scripts/parse-revise-issue.mjs, both deleted here).
//
// The two forms were never two shapes: a "Request a change" issue and a "Request a major
// revision" issue describe the same thing at different weights, and the owner used to pick the
// weight with an approval label. With the labels gone (own requests are pre-approved), one
// lifecycle reads both templates and the plan carries the weight.
//
// Labels are DERIVED from src/lib/issue-forms.mjs, never typed here: a parser that matches on a
// hand-copied heading string silently stops finding the field the day the template is reworded.

import { matchField as field } from "../intake-schema.mjs";
import { isValidSlug } from "../lib/slug.mjs";
import { REVISE_FIELDS, MODIFY_FIELDS, labelFor } from "../../src/lib/issue-forms.mjs";
// W0/S2 injection hardening lives in src/lib/modify-schema.mjs so the in-page change-request
// wizard sanitises what it SENDS with the identical rule this parser uses on what it RECEIVES.
import { sanitizeSection } from "../../src/lib/modify-schema.mjs";

export { field, sanitizeSection };

// `sections` is a comma list of free-text group hints from a PUBLIC issue body and each hint can
// reach an agent prompt — same threat model as the single `section` field, so every token goes
// through the same guard. Tokens that fail it are dropped (a missing hint is always safer than an
// attacker-authored one); the cap keeps a comma-bomb from inflating the plan.
export const MAX_SECTIONS = 10;

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

const R = (id) => labelFor(REVISE_FIELDS, id);
const M = (id) => labelFor(MODIFY_FIELDS, id);

// Just the slug — what the concurrency-key job needs before the real parse runs. Both templates
// use the same slug heading, so one lookup covers them.
export function resolveSlug(body) {
  const raw = field(body, R("slug"));
  if (!raw) throw new Error(`no ${R("slug")} field`);
  const slug = raw.trim().toLowerCase();
  if (!isValidSlug(slug)) throw new Error(`"${raw}" isn't a valid slug`);
  return slug;
}

// Pure parse of either template's rendered body → { slug, change, sections, deadline }.
// Throws Error with a human reason; the CLI maps a throw to stderr + a non-zero exit.
export function parseChangeIssue(body) {
  const rawSlug = field(body, R("slug"));
  if (!rawSlug) throw new Error(`no ${R("slug")} field`);
  const slug = rawSlug.trim().toLowerCase();
  if (!isValidSlug(slug)) throw new Error(`"${rawSlug}" isn't a valid slug`);

  // Revise template shape first, then the modify template's.
  const reviseChange = field(body, R("what-changed"));
  const modifyChange = reviseChange ? null : field(body, M("change"));
  const change = reviseChange || modifyChange;
  if (!change) throw new Error("no change description field (neither template shape matched)");

  const sections = reviseChange
    ? parseSections(field(body, R("sections")))
    : parseSections(field(body, M("section"))); // modify's single hint → one-element list

  return { slug, change, sections, deadline: parseDeadline(field(body, R("deadline"))) };
}
