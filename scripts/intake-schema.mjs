// THE single source of truth for the new-guide intake. Every machine intake surface derives from
// the FIELDS array here, so they cannot silently drift apart:
//   • .github/ISSUE_TEMPLATE/new-guide.yml — the issue form. A CONTRACT TEST
//     (scripts/__tests__/intake-schema.test.mjs) asserts the checked-in form matches FIELDS
//     exactly (same ids, kinds, options), so adding/removing a field here fails CI until the form
//     is brought back in sync. The form stays hand-editable for its prose (intro block, help
//     text); the test only guards the machine-meaningful shape.
//   • scripts/issue-to-scaffold.mjs — parses the issue body BY these fields (parseIssueBody →
//     answersFromForm) and validates the result with the zod schema below.
//   • scripts/scaffold-guide.mjs — validates answers in writeScaffold; a test asserts every
//     captured answer key surfaces in the generated intake doc (no silently-dropped field).
//
// Plain .mjs on purpose: the `node`-run scaffold scripts import it directly with no TS pipeline,
// and zod runs fine here — it's a runtime library, not a type-only import.
//
// Drift is the failure this closes: before this, a field could be added to the form but never
// parsed (captured-then-lost), or parsed but absent from the form (always empty) — silent bugs a
// human wouldn't see. Now the three surfaces share one definition and a test proves it.

import { z } from "zod";

// Two dropdown default values mean "unset" and must not leak into the scaffold. "— none —" uses an
// em dash (U+2014), matching the issue form exactly.
export const NULLISH_VALUES = ["undecided", "— none —"];
const NULLISH = new Set(NULLISH_VALUES);

// C1 (docs/archive/INDEX.md → PLAN_EVIDENCE_FIRST): how firm a date-like or decision-like answer actually is.
// "assumed" is deliberately the FIRST option (dropdown index 0 = its default) — unlike the
// undecided/— none — nullish values above, a certainty field's default is a REAL, meaningful
// value, not "unset": an intake with no certainty stated is treated as "assumed", not blank.
// This is what makes the Japan case representable — "Oct 15 (target)" instead of a bare date
// that silently reads as locked (guides-intake/japan/intake.md's real, still-unresolved ambiguity;
// case 2 in docs/archive/INDEX.md → PLAN_EVIDENCE_FIRST).
export const CERTAINTY_OPTIONS = ["assumed", "fixed", "target", "flexible", "unknown", "none"];

// The intake fields, in issue-form order. Each entry carries everything the three surfaces need:
//   id          issue-form id AND the key in the raw parsed object
//   label       the ### heading in the rendered issue body AND the issue-form label
//   kind        input | textarea | dropdown  (dropdowns get a null-ish default option)
//   required    issue-form validation
//   description  issue-form help text (optional)
//   placeholder  issue-form placeholder (optional)
//   options      dropdown choices, in order, INCLUDING the null-ish first option
//   answerKey   key in the mapped `answers` object (defaults to id; e.g. travel-style → travelStyle)
//   special     "dates" (one field → start + end) | "priority" (three fields → priorities[])
//   rank        priority ordering (1..3) for the "priority" fields
export const FIELDS = [
  { id: "country", label: "Country", kind: "input", required: true,
    description: "Used to theme the guide and pull its currency and holidays. Time zone and map location are resolved separately, from the destination's actual coordinates during research — not from country.",
    placeholder: "e.g. Brazil", answerKey: "country" },

  { id: "cities", label: "City / cities", kind: "input", required: false,
    placeholder: "e.g. Rio de Janeiro, São Paulo", answerKey: "cities" },

  { id: "dates", label: "Trip dates", kind: "input", required: false, special: "dates",
    description: "Optional. Format \"YYYY-MM-DD to YYYY-MM-DD\" — drives the day-by-day cards and the weather/holiday window.",
    placeholder: "2026-03-01 to 2026-03-08" },

  { id: "dates-certainty", label: "Dates certainty", kind: "dropdown", required: false, answerKey: "datesCertainty",
    description: "How firm are these dates? fixed = booked/locked. target = the current best guess, still being narrowed. flexible = could move meaningfully. unknown = genuinely undecided. none = no dates yet at all. Leave as \"assumed\" if you're not sure which applies — research will flag it rather than treat it as locked.",
    options: CERTAINTY_OPTIONS },

  { id: "departure-airport", label: "Departure airport", kind: "input", required: false, answerKey: "departureAirport",
    description: "Which airport you'll fly out of, if you have a guess — an IATA code is best (EWR, JFK), but a plain city/airport name works too. Drives the Atlas globe's route line from home to this trip (D14/ADR 0003); recorded as UNCONFIRMED until a real booking confirms it, so a guess here draws no line by itself.",
    placeholder: "e.g. EWR (Newark) — or \"probably JFK\" if you're not sure yet" },

  { id: "anchor", label: "Anchor event", kind: "input", required: false, answerKey: "anchor",
    description: "The one non-negotiable the trip is built around (a concert, a match, a festival, a wedding). This is the most perishable, most important fact on the trip — the research pass verifies its date + venue against an official source FIRST. Include a source URL if you have one.",
    placeholder: "e.g. Pokémon GO Wild Area — Mexico City, Nov 6–8 2026 (pokemongolive.com)" },

  { id: "anchor-certainty", label: "Anchor event certainty", kind: "dropdown", required: false, answerKey: "anchorCertainty",
    description: "How firm is the anchor event itself? fixed = officially confirmed (tickets bought, date announced). target = expected but not yet officially confirmed. flexible / unknown as above. none = no anchor event for this trip. Leave as \"assumed\" if unsure.",
    options: CERTAINTY_OPTIONS },

  { id: "travelers", label: "Number of travelers", kind: "input", required: false, answerKey: "travelers",
    description: "Just the headcount. Mobility, dietary, and sensory needs go in Constraints below; anything else specific (solo/couple/family, ages) goes in Comments.",
    placeholder: "e.g. 3" },

  { id: "party", label: "Who's this for / party", kind: "input", required: false, answerKey: "party",
    description: "Who is actually going — the more concrete the better. This maps the guide onto how these specific travelers move (pace, walking tolerance, whether the group splits). Name a prior trip if the same people traveled before (\"the Korea group\"), or describe them.",
    placeholder: "e.g. the Korea group (3 mid-20s, gaming anchors, heavy walkers) / family of 5 with grandparents" },

  { id: "constraints", label: "Constraints", kind: "textarea", required: false, answerKey: "constraints",
    description: "Mobility, dietary, or sensory needs the guide must honor — a wheelchair or low-stairs requirement, a walking-distance ceiling, allergies or strict diets, sensory sensitivities. A stated constraint changes what the research OWES: related venue facts (step-free access, elevator, allergen handling) become mandatory, verified per venue — never assumed.",
    placeholder: "e.g. one traveler can't do stairs — elevator or ground floor only / severe peanut allergy / max ~3 km walking per day" },

  { id: "passport-countries", label: "Traveler passport countries", kind: "input", required: false, answerKey: "passportCountries",
    description: "Every passport held on this trip, comma-separated (a party can mix). Drives which countries get an entry/visa row researched for the Trip Kit's entry-requirements card — travelers pick their own from a dropdown, so more here means more of the party is covered, not more clutter for anyone.",
    placeholder: "e.g. United States, United Kingdom" },

  { id: "pace", label: "Pace", kind: "dropdown", required: false, answerKey: "pace",
    description: "How packed should the days be?",
    options: ["undecided", "packed", "balanced", "slow"], nullish: "undecided" },

  { id: "travel-style", label: "Travel style", kind: "dropdown", required: false, answerKey: "travelStyle",
    description: "How far off the tourist trail? Drives how hard the research leans on crowd-avoidance and non-obvious local picks versus the marquee must-sees.",
    options: ["undecided", "Bucket-list must-sees", "Off-the-beaten-path", "Balanced"], nullish: "undecided" },

  { id: "priority1", label: "Priority #1 (most important)", kind: "dropdown", required: false, special: "priority", rank: 1,
    description: "Three separate rank fields, not a multi-select — so the order you actually mean is preserved.",
    options: ["— none —", "Food & dining", "Culture / history", "Nature / outdoors", "Nightlife", "Shopping", "Wellness / relaxation", "Niche interest (specify below)"], nullish: "— none —" },

  { id: "priority2", label: "Priority #2", kind: "dropdown", required: false, special: "priority", rank: 2,
    options: ["— none —", "Food & dining", "Culture / history", "Nature / outdoors", "Nightlife", "Shopping", "Wellness / relaxation", "Niche interest (specify below)"], nullish: "— none —" },

  { id: "priority3", label: "Priority #3", kind: "dropdown", required: false, special: "priority", rank: 3,
    options: ["— none —", "Food & dining", "Culture / history", "Nature / outdoors", "Nightlife", "Shopping", "Wellness / relaxation", "Niche interest (specify below)"], nullish: "— none —" },

  { id: "niche", label: "Niche interest", kind: "input", required: false, answerKey: "niche",
    description: "Only fill in if you picked \"Niche interest\" above (e.g. anime, esports, diving, architecture, live music).",
    placeholder: "e.g. live music" },

  { id: "budget", label: "Budget", kind: "dropdown", required: false, answerKey: "budget",
    description: "Per-day spending target, all-in (lodging + food + activities).",
    options: ["undecided", "Shoestring (<$75/day)", "Mid-range ($75–150/day)", "Comfortable ($150–300/day)", "Luxury ($300+/day)"], nullish: "undecided" },

  { id: "budget-certainty", label: "Budget certainty", kind: "dropdown", required: false, answerKey: "budgetCertainty",
    description: "How firm is this budget target? fixed = a hard cap. target = a rough goal, could flex. flexible / unknown / none as above. Leave as \"assumed\" if unsure.",
    options: CERTAINTY_OPTIONS },

  { id: "comments", label: "Comments", kind: "textarea", required: false, answerKey: "comments",
    description: "Anything the fields above don't capture — group makeup, a fixed anchor event, dealbreakers, etc. (Mobility/dietary/sensory needs belong in Constraints above, where they bind the research.)",
    placeholder: "e.g. traveling with my parents, celebrating an anniversary" },
];

// Issue Forms render each answered field as "### <Label>\n\n<value>"; an empty input renders the
// literal "_No response_". Pull a field's value out of the body by its label.
// A4: exported so every issue-body parser in the pipeline shares this ONE regex instead of
// keeping its own byte-identical copy.
export function matchField(body, label) {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = String(body || "").match(new RegExp("###\\s+" + esc + "\\s*\\n+([\\s\\S]*?)(?=\\n###\\s|$)"));
  let v = m ? m[1].trim() : "";
  if (v === "_No response_" || v === "_No response_.") v = "";
  return v;
}

// Parse a rendered issue body into { <fieldId>: value }, with dropdown null-ish defaults treated
// as unset (empty string). One entry per FIELD — nothing hand-listed.
export function parseIssueBody(body) {
  const raw = {};
  for (const f of FIELDS) {
    let v = matchField(body, f.label);
    if (f.kind === "dropdown" && NULLISH.has(v)) v = "";
    raw[f.id] = v;
  }
  return raw;
}

// Map raw form values → the `answers` object the scaffolder consumes. The two structural
// transforms (a single dates field → start/end; three ranked priority fields → an ordered array)
// live here, once; everything else is a direct id→answerKey copy of non-empty values.
export function answersFromForm(raw) {
  const a = {};
  for (const f of FIELDS) {
    if (f.special) continue; // dates + priorities handled below
    const v = raw[f.id];
    if (v != null && String(v).trim() !== "") a[f.answerKey] = v;
  }
  const dates = raw.dates;
  if (dates && String(dates).trim()) {
    const [start, end] = String(dates).split(/\s+to\s+/i).map((s) => s.trim());
    if (start) a.start = start;
    if (end) a.end = end;
  }
  const priorities = FIELDS
    .filter((f) => f.special === "priority")
    .sort((x, y) => x.rank - y.rank)
    .map((f) => raw[f.id])
    .filter(Boolean);
  if (priorities.length) a.priorities = priorities;

  // C1: a certainty field left BLANK (old-format issue filed before this dropdown existed, or a
  // hand-built CLI/test answers object) is not the same as a certainty field explicitly set to
  // "assumed" — but both mean the same thing to research: treat this as provisional. The generic
  // copy loop above only sets a key when the raw value is non-empty, so an absent certainty needs
  // its own default here rather than silently staying undefined.
  a.datesCertainty ??= "assumed";
  a.anchorCertainty ??= "assumed";
  a.budgetCertainty ??= "assumed";
  return a;
}

// Validation schema for a mapped `answers` object. Only `country` is required (matches the form);
// everything else is optional. `.loose()` lets the CLI's extra keys (coords, dayLabels, slug,
// title) pass through untouched — this validates the intake, it doesn't own the scaffold's shape.
export const IntakeAnswers = z.object({
  country: z.string().min(1, "country is required"),
  cities: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  datesCertainty: z.enum(CERTAINTY_OPTIONS).optional(),
  departureAirport: z.string().optional(),
  anchor: z.string().optional(),
  anchorCertainty: z.enum(CERTAINTY_OPTIONS).optional(),
  travelers: z.string().optional(),
  party: z.string().optional(),
  constraints: z.string().optional(),
  passportCountries: z.string().optional(),
  pace: z.string().optional(),
  travelStyle: z.string().optional(),
  priorities: z.array(z.string()).optional(),
  niche: z.string().optional(),
  budget: z.string().optional(),
  budgetCertainty: z.enum(CERTAINTY_OPTIONS).optional(),
  comments: z.string().optional(),
}).loose();

// Convenience wrapper: { ok: true, value } or { ok: false, error: "<field>: <msg>; ..." }.
export function validateAnswers(answers) {
  const r = IntakeAnswers.safeParse(answers);
  if (r.success) return { ok: true, value: r.data };
  const error = r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
  return { ok: false, error };
}
