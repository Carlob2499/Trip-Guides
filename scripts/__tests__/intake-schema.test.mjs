// Contract + parser tests for the intake single-source-of-truth (scripts/intake-schema.mjs).
//
// The CONTRACT test is the point of P1: it asserts the checked-in issue form
// (.github/ISSUE_TEMPLATE/new-guide.yml) matches FIELDS exactly — same ids, kinds, labels, and
// dropdown options. Add a field to FIELDS without updating the form (or vice versa) and this fails,
// so the two machine surfaces cannot silently drift. The parser + doc-coverage tests lock the
// behaviour the scaffold pipeline depends on.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FIELDS, parseIssueBody, answersFromForm, validateAnswers } from "../intake-schema.mjs";
import { buildIntakeMd } from "../scaffold-guide.mjs";

const FORM_PATH = fileURLToPath(new URL("../../.github/ISSUE_TEMPLATE/new-guide.yml", import.meta.url));

// Minimal, dependency-free extractor for the issue-form field blocks: per field, its type, id,
// label, and options list. We only parse the machine-meaningful shape — the form stays free to
// carry prose (intro block, descriptions) the test ignores.
function extractFormFields(yaml) {
  const unquote = (s) => s.replace(/^["']|["']$/g, "");
  const out = [];
  let cur = null, inOptions = false;
  for (const line of yaml.split(/\r?\n/)) {
    const mType = line.match(/^ {2}- type:\s*(\S+)/);
    if (mType) { if (cur) out.push(cur); cur = { type: mType[1], id: null, label: null, options: [] }; inOptions = false; continue; }
    if (!cur) continue;
    if (inOptions) {
      const mOpt = line.match(/^ {8}-\s*(.+?)\s*$/);
      if (mOpt) { cur.options.push(unquote(mOpt[1])); continue; }
      inOptions = false; // fell out of the options list (default:/validations:/next field)
    }
    const mId = line.match(/^ {4}id:\s*(\S+)/);
    if (mId) { cur.id = mId[1]; continue; }
    const mLabel = line.match(/^ {6}label:\s*(.+?)\s*$/);
    if (mLabel) { cur.label = unquote(mLabel[1]); continue; }
    if (/^ {6}options:\s*$/.test(line)) { inOptions = true; continue; }
  }
  if (cur) out.push(cur);
  return out.filter((f) => f.id); // drop the markdown intro block (no id)
}

describe("intake-schema ↔ issue-form contract", () => {
  const formFields = extractFormFields(readFileSync(FORM_PATH, "utf8"));
  const KIND_TO_TYPE = { input: "input", textarea: "textarea", dropdown: "dropdown" };

  it("has the same fields, in the same order, as the issue form", () => {
    expect(formFields.map((f) => f.id)).toEqual(FIELDS.map((f) => f.id));
  });

  for (const f of FIELDS) {
    it(`field "${f.id}" matches the form (kind, label, options)`, () => {
      const ff = formFields.find((x) => x.id === f.id);
      expect(ff, `form is missing field "${f.id}"`).toBeTruthy();
      expect(ff.type).toBe(KIND_TO_TYPE[f.kind]);
      expect(ff.label).toBe(f.label); // labels are the parse key — must match exactly
      if (f.kind === "dropdown") expect(ff.options).toEqual(f.options);
      else expect(ff.options).toEqual([]);
    });
  }
});

const FULL_BODY = [
  "### Country", "", "Portugal", "",
  "### City / cities", "", "Lisbon, Porto", "",
  "### Trip dates", "", "2026-07-08 to 2026-07-14", "",
  "### Anchor event", "", "NOS Alive festival — Lisbon, Jul 9-11 2026", "",
  "### Number of travelers", "", "3", "",
  "### Who's this for / party", "", "the Korea group (3 mid-20s, heavy walkers)", "",
  "### Traveler passport countries", "", "United States, United Kingdom", "",
  "### Pace", "", "balanced", "",
  "### Travel style", "", "Off-the-beaten-path", "",
  "### Priority #1 (most important)", "", "Food & dining", "",
  "### Priority #2", "", "Culture / history", "",
  "### Priority #3", "", "— none —", "",
  "### Niche interest", "", "_No response_", "",
  "### Budget", "", "Mid-range ($75–150/day)", "",
  "### Comments", "", "one vegetarian",
].join("\n");

describe("parseIssueBody + answersFromForm", () => {
  const answers = answersFromForm(parseIssueBody(FULL_BODY));

  it("maps direct fields", () => {
    expect(answers.country).toBe("Portugal");
    expect(answers.cities).toBe("Lisbon, Porto");
    expect(answers.travelers).toBe("3");
    expect(answers.party).toBe("the Korea group (3 mid-20s, heavy walkers)");
    expect(answers.passportCountries).toBe("United States, United Kingdom");
    expect(answers.pace).toBe("balanced");
    expect(answers.travelStyle).toBe("Off-the-beaten-path"); // travel-style → travelStyle
    expect(answers.anchor).toContain("NOS Alive");
    expect(answers.budget).toBe("Mid-range ($75–150/day)");
    expect(answers.comments).toBe("one vegetarian");
  });

  it("splits dates into start/end", () => {
    expect(answers.start).toBe("2026-07-08");
    expect(answers.end).toBe("2026-07-14");
  });

  it("collects priorities in rank order, dropping the null-ish choice", () => {
    expect(answers.priorities).toEqual(["Food & dining", "Culture / history"]);
  });

  it("treats _No response_ and null-ish dropdown defaults as unset", () => {
    expect(answers.niche).toBeUndefined(); // _No response_
    const undecided = answersFromForm(parseIssueBody("### Country\n\nX\n\n### Pace\n\nundecided\n\n### Travel style\n\nundecided"));
    expect(undecided.pace).toBeUndefined();
    expect(undecided.travelStyle).toBeUndefined();
  });

  it("validates: country required, extras allowed", () => {
    expect(validateAnswers(answers).ok).toBe(true);
    expect(validateAnswers({ ...answers, coords: { lat: 1, lng: 2 } }).ok).toBe(true); // loose passthrough
    expect(validateAnswers({ cities: "Rome" }).ok).toBe(false); // no country
  });
});

describe("intake doc surfaces every captured field", () => {
  // Guards the third surface: a field captured by the parser but silently missing from the
  // generated intake doc would be data the human never sees.
  const answers = answersFromForm(parseIssueBody(FULL_BODY));
  const md = buildIntakeMd(answers);
  for (const val of ["Portugal", "Lisbon, Porto", "2026-07-08", "NOS Alive", "3",
    "the Korea group", "United States, United Kingdom", "balanced", "Off-the-beaten-path",
    "Food & dining", "Culture / history", "Mid-range ($75–150/day)", "one vegetarian"]) {
    it(`renders "${val}"`, () => expect(md).toContain(val));
  }
});
