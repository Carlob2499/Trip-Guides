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

  { id: "anchor", label: "Anchor event", kind: "input", required: false, answerKey: "anchor",
    description: "The one non-negotiable the trip is built around (a concert, a match, a festival, a wedding). This is the most perishable, most important fact on the trip — the research pass verifies its date + venue against an official source FIRST. Include a source URL if you have one.",
    placeholder: "e.g. Pokémon GO Wild Area — Mexico City, Nov 6–8 2026 (pokemongolive.com)" },

  { id: "travelers", label: "Number of travelers", kind: "input", required: false, answerKey: "travelers",
    description: "Just the headcount. Anything more specific (solo/couple/family, ages, mobility needs) goes in Comments below.",
    placeholder: "e.g. 3" },

  { id: "party", label: "Who's this for / party", kind: "input", required: false, answerKey: "party",
    description: "Who is actually going — the more concrete the better. This maps the guide onto how these specific travelers move (pace, walking tolerance, whether the group splits). Name a prior trip if the same people traveled before (\"the Korea group\"), or describe them.",
    placeholder: "e.g. the Korea group (3 mid-20s, gaming anchors, heavy walkers) / family of 5 with grandparents" },

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

  { id: "comments", label: "Comments", kind: "textarea", required: false, answerKey: "comments",
    description: "Anything the fields above don't capture — group makeup, dietary needs, a fixed anchor event, dealbreakers, etc.",
    placeholder: "e.g. traveling with my parents, one vegetarian, celebrating an anniversary" },
];

// Answer keys the intake produces (for the doc-coverage test + reference). Derived, never hand-listed.
export const ANSWER_KEYS = (() => {
  const keys = new Set();
  for (const f of FIELDS) {
    if (f.special === "dates") { keys.add("start"); keys.add("end"); }
    else if (f.special === "priority") keys.add("priorities");
    else if (f.answerKey) keys.add(f.answerKey);
  }
  return [...keys];
})();

// Issue Forms render each answered field as "### <Label>\n\n<value>"; an empty input renders the
// literal "_No response_". Pull a field's value out of the body by its label.
// A4: exported so graduate-guide.mjs (and anything importing `field` from there, e.g.
// parse-modify-issue.mjs) shares this ONE regex instead of keeping its own byte-identical copy.
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
  anchor: z.string().optional(),
  travelers: z.string().optional(),
  party: z.string().optional(),
  pace: z.string().optional(),
  travelStyle: z.string().optional(),
  priorities: z.array(z.string()).optional(),
  niche: z.string().optional(),
  budget: z.string().optional(),
  comments: z.string().optional(),
}).loose();

// Convenience wrapper: { ok: true, value } or { ok: false, error: "<field>: <msg>; ..." }.
export function validateAnswers(answers) {
  const r = IntakeAnswers.safeParse(answers);
  if (r.success) return { ok: true, value: r.data };
  const error = r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
  return { ok: false, error };
}
