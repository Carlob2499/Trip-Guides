// One home for every GitHub issue-form field set the pipeline parses.
//
// The failure this exists to stop: a parser matches a field by its LABEL STRING
// (`### Guide slug\n\n<value>`), and the label lives in a YAML template the parser never
// reads. Rename the label and the parser silently stops finding the field — the workflow
// then reports "no Guide slug field" on a perfectly well-formed issue. `modify-schema.mjs`
// was created to close exactly that for the modify form; revise and graduate still had
// hand-typed literals and, unlike new-guide and modify, no contract test at all.
//
// `issue-forms.test.mjs` asserts each array against its checked-in template.
//
// NOTE ON `Guide slug`: all three forms use the same label, deliberately — one vocabulary
// for the owner. It is written once here (SLUG_FIELD) and spread into each set, so the three
// can't drift apart by a stray capital letter.

/** Every form opens with the same slug input. */
export const SLUG_FIELD = { id: "slug", label: "Guide slug", kind: "input", required: true };

/** `.github/ISSUE_TEMPLATE/modify-guide.yml` — a scoped content fix. */
export const MODIFY_FIELDS = [
  SLUG_FIELD,
  { id: "change", label: "What needs to change", kind: "textarea", required: true },
  { id: "section", label: "Section", kind: "input", required: false },
];

/** `.github/ISSUE_TEMPLATE/revise-guide.yml` — a major re-research.
    An issue filed on the MODIFY form can be escalated to a revision by the owner (the
    single-intake-surface ruling), so the revise parser falls back to MODIFY_FIELDS' labels
    when these are absent. That fallback is why both sets must live in one file. */
export const REVISE_FIELDS = [
  SLUG_FIELD,
  { id: "what-changed", label: "What changed and why this needs re-research", kind: "textarea", required: true },
  { id: "sections", label: "Sections", kind: "input", required: false },
  { id: "deadline", label: "Deadline", kind: "input", required: false },
];

/** `.github/ISSUE_TEMPLATE/graduate-guide.yml` — nominate a draft for publication. */
export const GRADUATE_FIELDS = [
  SLUG_FIELD,
  { id: "why", label: "Why is this ready?", kind: "textarea", required: false },
];

/** Look a label up by field id. Throws rather than returning undefined: a typo'd id would
    otherwise become `field(body, undefined)`, which matches nothing and reads as "the issue
    is missing that field" — the same silent-miss this module exists to prevent. */
export function labelFor(fields, id) {
  const f = fields.find((x) => x.id === id);
  if (!f) throw new Error(`no field "${id}" in this form's schema`);
  return f.label;
}
