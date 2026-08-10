/* Turn Stryker's report into English.
 *
 * A green suite proves the tests RAN. It does not prove they would CATCH anything — a test that
 * asserts nothing useful passes just as loudly as one that guards real behaviour. Mutation
 * testing settles it by vandalism: change the source on purpose (a `+` to a `-`, a `true` to a
 * `false`, delete a line) and see whether any test goes red. One that survives is a change
 * nobody would have noticed.
 *
 * Stryker's own output is a wall of diffs. This is the short version.
 *
 * Run: npm run mutate    (writes reports/mutation/mutation.json, then this)
 *      node scripts/mutation-report.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const REPORT = "reports/mutation/mutation.json";
const DOC = "docs/generated/where-the-tests-are-blind.md";

/** Same plain-English areas the readable test index uses, so the two documents line up. */
const AREAS = [
  [/trip-split|budget|field-math/, "Money — the shared trip budget"],
  [/atlas|hub|globe|terrain|contour|map-pins|relevance|maps\/|cluster/, "The hub — the globe and the map"],
  [/contrast|palette|accent|theme/, "Colour and legibility"],
  [/date|holiday|jetlag|tz-|staleness|book-by|arrival|day-swap/, "Dates, time zones and freshness"],
  [/weather|sun|packing|rate|closures|live-data/, "Live conditions — weather, daylight, closures"],
  [/anchor|route|transit|checklist|sheet-order|buckets|itinerary|trip-kit/, "Using a guide on the road"],
  [/reminder|telemetry|voting|intake|change-request|learnings|pipeline-progress/, "Reminders, feedback and the pipeline"],
  [/exports|share/, "Taking a guide with you — exports and sharing"],
  [/firebase|outbox|room/, "Syncing between phones"],
  [/mobile-nav|panel|gesture|scrub|scroll-spy|yield|rank/, "Navigation, panels and gestures"],
  [/prose|lead-split|section-types|guide-types|json-embed|img-width|guide-stats/, "Guide content and how it renders"],
  [/./, "Everything else"],
];
const areaOf = (f) => AREAS.find(([re]) => re.test(f))[1];

/** What a mutation actually did, said the way a person would say it. */
const PLAIN = {
  ArithmeticOperator: "swapped a plus for a minus (or similar)",
  BooleanLiteral: "flipped a yes to a no",
  ConditionalExpression: "forced a decision to always go one way",
  EqualityOperator: "changed a comparison, so a boundary shifted by one",
  LogicalOperator: "changed an and to an or",
  StringLiteral: "blanked out a piece of text",
  ArrayDeclaration: "emptied a list",
  BlockStatement: "deleted the body of a block entirely",
  MethodExpression: "removed a call, such as the copy that keeps data from being shared",
  UnaryOperator: "flipped a sign",
  UpdateOperator: "counted the wrong way",
  ObjectLiteral: "emptied an object",
  OptionalChaining: "removed a guard against missing data",
  Regex: "changed a pattern-match rule",
  AssignmentOperator: "changed how a value is assigned",
};
const plain = (m) => PLAIN[m] || `changed ${m}`;

export function load(path = REPORT) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function tally(report) {
  const areas = new Map();
  for (const [file, data] of Object.entries(report.files)) {
    const area = areaOf(file);
    if (!areas.has(area)) areas.set(area, { caught: 0, missed: 0, untested: 0, gaps: [] });
    const a = areas.get(area);
    const src = (data.source || "").split("\n");
    for (const m of data.mutants) {
      if (m.status === "Killed" || m.status === "Timeout") a.caught++;
      else if (m.status === "NoCoverage") a.untested++;
      else if (m.status === "Survived") {
        a.missed++;
        a.gaps.push({ file, line: m.location.start.line, what: plain(m.mutatorName), code: (src[m.location.start.line - 1] || "").trim() });
      }
    }
  }
  return areas;
}

export function render(report) {
  const areas = tally(report);
  const sum = (k) => [...areas.values()].reduce((n, a) => n + a[k], 0);
  const caught = sum("caught"), missed = sum("missed"), untested = sum("untested");
  const total = caught + missed + untested;

  const out = [
    "# Where the tests are blind",
    "",
    "**Generated — do not edit.** `npm run mutate` rebuilds it.",
    "",
    "A passing test suite proves the tests *ran*. It does not prove they would *catch* anything.",
    "So this breaks the code on purpose — thousands of small sabotages, one at a time — and",
    "records which ones no test noticed. Every line below is a change someone could make to this",
    "product tomorrow without a single test going red.",
    "",
    `**${Math.round((100 * caught) / total)}% of ${total} deliberate breakages were caught.**`,
    `${missed} slipped past the tests. ${untested} were in code no test touches at all.`,
    "",
    "This number is never 100% and is not meant to be — some sabotages produce code that behaves",
    "identically, and some are in places not worth the cost of a test. It is a map of the thin ice,",
    "not a grade.",
    "",
  ];

  const sorted = [...areas.entries()].sort((a, b) => b[1].missed - a[1].missed);
  out.push("| Area | Caught | Slipped past | Untouched by any test |", "| --- | --- | --- | --- |");
  for (const [name, a] of sorted) out.push(`| ${name} | ${a.caught} | ${a.missed} | ${a.untested} |`);
  out.push("");

  out.push("## The gaps worth reading", "");
  out.push("Up to ten per area — the rest are in the full report.", "");
  for (const [name, a] of sorted) {
    if (!a.gaps.length) continue;
    out.push(`### ${name}`, "");
    for (const g of a.gaps.slice(0, 10)) {
      out.push(`- Someone ${g.what} and nothing failed.  <sub>${g.file}:${g.line}</sub>`);
      if (g.code) out.push(`  \`${g.code.slice(0, 110)}\``);
    }
    if (a.gaps.length > 10) out.push(`- …and ${a.gaps.length - 10} more.`);
    out.push("");
  }
  return out.join("\n") + "\n";
}

if (process.argv[1]?.endsWith("mutation-report.mjs")) {
  const doc = render(load());
  writeFileSync(DOC, doc);
  console.log(`[mutation] ${DOC} written`);
}
