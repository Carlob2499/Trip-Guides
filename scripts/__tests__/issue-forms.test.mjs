// CONTRACT tests for the issue-form field sets (src/lib/issue-forms.mjs).
//
// Every pipeline parser matches a field by its LABEL STRING — `### Guide slug\n\n<value>` —
// and the label lives in a YAML template the parser never reads. Rename a label and the parser
// silently stops finding the field; the workflow then reports "no Guide slug field" on a
// perfectly well-formed issue. new-guide has had this guard since P1 (intake-schema.test.mjs)
// and modify got one with the change-request wizard; revise had NONE until now, despite
// carrying six hand-typed literals across two different templates.

// @protects-file The forms used to file work match what the automation expects to read.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { MODIFY_FIELDS, REVISE_FIELDS, SLUG_FIELD, labelFor } from "../../src/lib/issue-forms.mjs";
import { parseChangeIssue } from "../pipeline/issue.mjs";

const form = (name) => readFileSync(fileURLToPath(new URL(`../../.github/ISSUE_TEMPLATE/${name}`, import.meta.url)), "utf8");

/** Extract each form field's type/id/label/required — the machine-meaningful shape only. */
function extractFormFields(yaml) {
  const out = [];
  let cur = null;
  for (const line of yaml.split(/\r?\n/)) {
    const mType = line.match(/^ {2}- type:\s*(\S+)/);
    if (mType) { if (cur) out.push(cur); cur = { type: mType[1], id: null, label: null, required: false }; continue; }
    if (!cur) continue;
    const mId = line.match(/^ {4}id:\s*(\S+)/);
    if (mId) { cur.id = mId[1]; continue; }
    const mLabel = line.match(/^ {6}label:\s*(.+?)\s*$/);
    if (mLabel) { cur.label = mLabel[1].replace(/^["']|["']$/g, ""); continue; }
    if (/^ {6}required:\s*true/.test(line)) cur.required = true;
  }
  if (cur) out.push(cur);
  return out.filter((f) => f.id);
}

const CASES = [
  ["modify-guide.yml", MODIFY_FIELDS],
  ["revise-guide.yml", REVISE_FIELDS],
];

describe.each(CASES)("CONTRACT — %s matches its field set", (file, fields) => {
  const parsed = extractFormFields(form(file));

  it("has the same field ids, in the same order", () => {
    expect(parsed.map((f) => f.id)).toEqual(fields.map((f) => f.id));
  });

  it("labels match exactly — the parsers match on these strings", () => {
    expect(parsed.map((f) => f.label)).toEqual(fields.map((f) => f.label));
  });

  it("kinds and required-ness match", () => {
    expect(parsed.map((f) => f.type)).toEqual(fields.map((f) => f.kind));
    expect(parsed.map((f) => f.required)).toEqual(fields.map((f) => !!f.required));
  });
});

describe("one slug vocabulary across both forms", () => {
  it("every form opens with the identical slug field object", () => {
    for (const [, fields] of CASES) expect(fields[0]).toBe(SLUG_FIELD);
  });
});

describe("labelFor", () => {
  it("resolves a label by id", () => {
    expect(labelFor(REVISE_FIELDS, "what-changed")).toBe("What changed and why this needs re-research");
  });

  it("THROWS on an unknown id rather than returning undefined", () => {
    // field(body, undefined) matches nothing, which reads as "the issue is missing that
    // field" — the exact silent miss this module exists to prevent.
    expect(() => labelFor(REVISE_FIELDS, "nope")).toThrow(/no field "nope"/);
  });
});

// Round-trips: render a body the way GitHub does, and confirm the parser reads it back.
const render = (fields, values) =>
  fields.map((f) => `### ${f.label}\n\n${values[f.id] ?? "_No response_"}`).join("\n\n");

describe("round-trip — a rendered issue body parses back", () => {
  it("revise form → parseChangeIssue", () => {
    const body = render(REVISE_FIELDS, {
      slug: "korea",
      "what-changed": "The trip moved to October; the whole itinerary needs re-cutting.",
      sections: "Days, Sights",
      deadline: "2026-09-01",
    });
    expect(parseChangeIssue(body)).toEqual({
      slug: "korea",
      change: "The trip moved to October; the whole itinerary needs re-cutting.",
      sections: ["Days", "Sights"],
      deadline: "2026-09-01",
    });
  });

  it("modify form → the SAME parser falls back to modify's labels", () => {
    // The single-intake-surface ruling: one lifecycle reads both templates, so a request
    // filed on either form parses identically. That is why both field sets live in one module.
    const body = render(MODIFY_FIELDS, {
      slug: "denmark",
      change: "Prices are a year out of date across the whole guide.",
      section: "Essentials",
    });
    expect(parseChangeIssue(body)).toEqual({
      slug: "denmark",
      change: "Prices are a year out of date across the whole guide.",
      sections: ["Essentials"],
      deadline: "",
    });
  });
});
