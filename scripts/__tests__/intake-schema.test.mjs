// Contract + parser tests for the intake single-source-of-truth (scripts/intake-schema.mjs).
//
// The CONTRACT test is the point of P1: it asserts the checked-in issue form
// (.github/ISSUE_TEMPLATE/new-guide.yml) matches FIELDS exactly — same ids, kinds, labels, and
// dropdown options. Add a field to FIELDS without updating the form (or vice versa) and this fails,
// so the two machine surfaces cannot silently drift. The parser + doc-coverage tests lock the
// behaviour the scaffold pipeline depends on.

// @protects-file A guide request cannot arrive missing the answers it needs.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FIELDS, CERTAINTY_OPTIONS, parseIssueBody, answersFromForm, validateAnswers } from "../intake-schema.mjs";
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
  "### Dates certainty", "", "target", "",
  "### Departure airport", "", "EWR (Newark)", "",
  "### Anchor event", "", "NOS Alive festival — Lisbon, Jul 9-11 2026", "",
  "### Anchor event certainty", "", "fixed", "",
  "### Number of travelers", "", "3", "",
  "### Who's this for / party", "", "the Korea group (3 mid-20s, heavy walkers)", "",
  "### Destination familiarity", "", "Returning travelers", "",
  "### Traveler passport countries", "", "United States, United Kingdom", "",
  "### Pace", "", "balanced", "",
  "### Travel style", "", "Off-the-beaten-path", "",
  "### Guide audience", "", "My travel group", "",
  "### Guide reading style", "", "Balanced", "",
  "### Priority #1 (most important)", "", "Food & dining", "",
  "### Priority #2", "", "Culture / history", "",
  "### Priority #3", "", "— none —", "",
  "### Niche interest", "", "_No response_", "",
  "### Budget", "", "Mid-range ($75–150/day)", "",
  "### Budget certainty", "", "flexible", "",
  "### Comments", "", "one vegetarian",
].join("\n");

// The exact shape of a REAL old issue filed before C1 shipped these three dropdowns — no
// certainty headings at all, not even blank ones. This is the compatibility case the plan's
// own ACCEPTANCE names: "old-format issues still parse."
const OLD_FORMAT_BODY = [
  "### Country", "", "Portugal", "",
  "### Trip dates", "", "2026-07-08 to 2026-07-14", "",
  "### Anchor event", "", "NOS Alive festival — Lisbon, Jul 9-11 2026", "",
  "### Budget", "", "Mid-range ($75–150/day)", "",
].join("\n");

describe("parseIssueBody + answersFromForm", () => {
  const answers = answersFromForm(parseIssueBody(FULL_BODY));

  it("maps direct fields", () => {
    expect(answers.country).toBe("Portugal");
    expect(answers.cities).toBe("Lisbon, Porto");
    expect(answers.travelers).toBe("3");
    expect(answers.party).toBe("the Korea group (3 mid-20s, heavy walkers)");
    expect(answers.destinationFamiliarity).toBe("Returning travelers");
    expect(answers.passportCountries).toBe("United States, United Kingdom");
    expect(answers.pace).toBe("balanced");
    expect(answers.travelStyle).toBe("Off-the-beaten-path"); // travel-style → travelStyle
    expect(answers.guideAudience).toBe("My travel group");
    expect(answers.guideStyle).toBe("Balanced");
    expect(answers.anchor).toContain("NOS Alive");
    expect(answers.departureAirport).toBe("EWR (Newark)");
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
    const undecided = answersFromForm(parseIssueBody(
      "### Country\n\nX\n\n### Pace\n\nundecided\n\n### Travel style\n\nundecided" +
      "\n\n### Destination familiarity\n\nundecided\n\n### Guide audience\n\nundecided" +
      "\n\n### Guide reading style\n\nundecided",
    ));
    expect(undecided.pace).toBeUndefined();
    expect(undecided.travelStyle).toBeUndefined();
    expect(undecided.destinationFamiliarity).toBeUndefined();
    expect(undecided.guideAudience).toBeUndefined();
    expect(undecided.guideStyle).toBeUndefined();
  });

  it("validates: country required, extras allowed", () => {
    expect(validateAnswers(answers).ok).toBe(true);
    expect(validateAnswers({ ...answers, coords: { lat: 1, lng: 2 } }).ok).toBe(true); // loose passthrough
    expect(validateAnswers({ country: "X", destinationFamiliarity: "I went once maybe" }).ok).toBe(false);
    expect(validateAnswers({ country: "X", guideAudience: "Everyone on Earth" }).ok).toBe(false);
    expect(validateAnswers({ country: "X", guideStyle: "Purple prose" }).ok).toBe(false);
    expect(validateAnswers({ cities: "Rome" }).ok).toBe(false); // no country
  });
});

// C1 (docs/archive/INDEX.md → PLAN_EVIDENCE_FIRST): certainty states. Round-trips each certainty value through
// the real parser, and confirms an intake with none of the three new headings at all — a real
// pre-C1 issue — still parses and defaults every certainty to "assumed" rather than throwing or
// leaving the key undefined (the plan's own ACCEPTANCE: "old-format issues still parse").
describe("certainty states (C1)", () => {
  const answers = answersFromForm(parseIssueBody(FULL_BODY));

  it("round-trips an explicitly selected certainty for dates, anchor, and budget", () => {
    expect(answers.datesCertainty).toBe("target");
    expect(answers.anchorCertainty).toBe("fixed");
    expect(answers.budgetCertainty).toBe("flexible");
  });

  it("every CERTAINTY_OPTIONS value round-trips through the parser unchanged", () => {
    for (const value of CERTAINTY_OPTIONS) {
      const body = `### Country\n\nX\n\n### Dates certainty\n\n${value}`;
      expect(answersFromForm(parseIssueBody(body)).datesCertainty).toBe(value);
    }
  });

  it("an old-format issue with NO certainty headings still parses and defaults to \"assumed\"", () => {
    const old = answersFromForm(parseIssueBody(OLD_FORMAT_BODY));
    expect(old.country).toBe("Portugal"); // the rest of the old-format issue still parses fine
    expect(old.datesCertainty).toBe("assumed");
    expect(old.anchorCertainty).toBe("assumed");
    expect(old.budgetCertainty).toBe("assumed");
  });

  it("validates: a certainty answer must be one of CERTAINTY_OPTIONS", () => {
    expect(validateAnswers({ country: "X", datesCertainty: "target" }).ok).toBe(true);
    expect(validateAnswers({ country: "X", datesCertainty: "definitely" }).ok).toBe(false);
  });
});

describe("intake doc surfaces every captured field", () => {
  // Guards the third surface: a field captured by the parser but silently missing from the
  // generated intake doc would be data the human never sees.
  const answers = answersFromForm(parseIssueBody(FULL_BODY));
  const md = buildIntakeMd(answers);
  for (const val of ["Portugal", "Lisbon, Porto", "2026-07-08", "EWR (Newark)", "NOS Alive", "3",
    "the Korea group", "Returning travelers", "United States, United Kingdom", "balanced", "Off-the-beaten-path",
    "My travel group", "Guide reading style: Balanced", "Food & dining", "Culture / history",
    "Mid-range ($75–150/day)", "one vegetarian",
    "Dates (target)", "Anchor event (fixed)", "Per-day target (flexible, from form)"]) {
    it(`renders "${val}"`, () => expect(md).toContain(val));
  }
});
