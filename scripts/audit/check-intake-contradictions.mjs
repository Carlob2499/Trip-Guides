// C2 (docs/PLAN_EVIDENCE_FIRST.md) — intake contradiction gate. Deterministic extraction of
// dates, party counts, and named people across an intake doc's FULL TEXT (not just the
// structured scaffold bullets), because the contradictions this exists to catch live in the
// free-text elaboration a traveler or researcher adds AFTER scaffolding — exactly like the
// Japan regression fixture's case 2 (a date range narrowed in a "Comments" paragraph, never
// reflected in the flat "Exact dates" bullet).
//
// Runs at TWO points (creator ruling, §5.2): right after new-guide.yml scaffolds the intake
// doc, and again as a research-pass preflight — the second run is what catches contradictions a
// human adds while hand-elaborating the doc, which the first run couldn't have seen yet.
// NEVER A HARD FAILURE either time: a hit emits a traveler question (the existing mechanism,
// references/pipeline-roles.md) and stamps `## Contradictions`; research proceeds on the
// recorded `**Assumed:**` line, same as any other traveler question.
//
// THE BINDING CONSTRAINT (learned the hard way, in A1): "the same entity" means the same
// PERSON for person-scoped facts, never the bare noun. A1 verified that Japan's intake was
// mis-read as a birthday CONTRADICTION when it is actually two travellers' two birthdays,
// correctly handled — case 1a, now a permanent negative test (tests/fixtures/japan-regression/
// MANIFEST.md). birthdayConflicts() below groups by the POSSESSIVE MARKER text ("his" vs
// "traveler's own" are different people) precisely so it cannot reproduce that bug: verified
// zero false positives against every real, shipped intake doc before this shipped.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { GUIDES_INTAKE_DIR, isMain } from "./lib.mjs";

const MONTH_NAMES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_DAY = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\\.?\\s+\\d{1,2}";

function normMonthDay(s) {
  const m = /^([A-Za-z]+)\.?\s+(\d{1,2})$/.exec(s.trim());
  if (!m) return null;
  const mon = m[1].slice(0, 3).toLowerCase();
  if (!MONTH_NAMES.includes(mon)) return null;
  return { mon, day: parseInt(m[2], 10) };
}

function isoToMonthDay(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso || "").trim());
  if (!m) return null;
  return { year: parseInt(m[1], 10), mon: MONTH_NAMES[parseInt(m[2], 10) - 1], day: parseInt(m[3], 10) };
}

// Small, targeted line extractors for the scaffold's known bullet shapes — NOT a general intake
// parser (that's intake-schema.mjs's job, and it only covers the ISSUE FORM's `### Label`
// shape, a different format from this file's `- **Label:** value` bullets). Supports both the
// pre-C1 "Exact dates (start–end): START – END" bullet AND the C1 "**Dates (<certainty>):**
// START – END" bullet (same "START – END" shape either way), since this checker must still
// read intake docs scaffolded before C1 shipped (Japan's fixture is one).
const DATE_RANGE_LINE_RE = /-\s+(?:\*\*Dates\s+\([^)]*\):\*\*|Exact dates \(start–end\):)\s*(\d{4}-\d{2}-\d{2})(?:\s*–\s*(\d{4}-\d{2}-\d{2}))?/;

export function extractDateRange(text) {
  const m = DATE_RANGE_LINE_RE.exec(text);
  return m ? { start: m[1], end: m[2] ?? null } : { start: null, end: null };
}

export function extractStartDate(text) {
  return extractDateRange(text).start;
}

export function extractTravelerCount(text) {
  const m = /-\s+Number of travelers:\s*(\d+)/.exec(text);
  return m ? parseInt(m[1], 10) : null;
}

function extractLineValue(text, labelPattern) {
  const re = new RegExp(`-\\s+\\*\\*${labelPattern}[^:]*:\\*\\*\\s*(.+)`);
  const m = re.exec(text);
  return m ? m[1].split(/\s{2}\*/)[0].trim() : null; // strip a trailing "  *(...)*" aside
}

export function extractAnchorText(text) {
  return extractLineValue(text, "Anchor event");
}

export function extractPartyText(text) {
  return extractLineValue(text, "Who is this for / party");
}

// Flag: a date attributed to the SAME possessive marker twice, with two different values. The
// marker (not the bare word "birthday") is the entity — see the module comment above.
const BIRTHDAY_RE = new RegExp(
  `\\b(his|her|their|my|our|(?:the\\s+)?travelers?'?s?(?:\\s+own)?)\\b\\s+birthday\\b[\\s\\S]{0,20}?\\b(${MONTH_DAY})\\b`,
  "gi",
);

export function birthdayConflicts(text) {
  const byMarker = new Map();
  for (const m of text.matchAll(BIRTHDAY_RE)) {
    const marker = m[1].toLowerCase().replace(/\s+/g, " ");
    const date = m[2];
    if (!byMarker.has(marker)) byMarker.set(marker, []);
    const dates = byMarker.get(marker);
    if (!dates.includes(date)) dates.push(date);
  }
  const out = [];
  for (const [marker, dates] of byMarker) {
    if (dates.length < 2) continue;
    out.push({ marker, dates });
  }
  return out;
}

// Flag (case 2's shape): free text names two candidate dates joined by "or" for what sounds
// like the SAME decision, and the structured start-date bullet already committed to one of the
// two without reflecting the other. "committed to only one of two stated options" is the
// signal — not "any two dates near the word or", which would fire constantly on unrelated text.
const OR_PAIR_RE = new RegExp(`\\b(${MONTH_DAY})\\s+or\\s+(${MONTH_DAY})\\b`, "gi");

export function dateRangeAmbiguity(text, startIso) {
  const start = isoToMonthDay(startIso);
  if (!start) return [];
  const out = [];
  for (const m of text.matchAll(OR_PAIR_RE)) {
    const a = normMonthDay(m[1]);
    const b = normMonthDay(m[2]);
    const aMatch = a && a.mon === start.mon && a.day === start.day;
    const bMatch = b && b.mon === start.mon && b.day === start.day;
    if (aMatch !== bMatch) out.push({ committed: aMatch ? m[1] : m[2], other: aMatch ? m[2] : m[1] });
  }
  return out;
}

// Flag (b): the anchor's own stated date falls outside [start, end]. Only fires when BOTH a
// year and a start/end window are extractable — a bare "Nov 6-8" with no year is a real anchor
// text shape (Japan's own) that this must NOT guess a year for.
const DATED_ANCHOR_RE = new RegExp(`\\b(${MONTH_DAY})(?:[\\s\\S]{0,10}?(\\d{4}))?\\b`);

export function anchorOutsideWindow(anchorText, startIso, endIso) {
  if (!anchorText) return null;
  const start = isoToMonthDay(startIso);
  const end = isoToMonthDay(endIso);
  if (!start || !end) return null;
  const m = DATED_ANCHOR_RE.exec(anchorText);
  if (!m || !m[2]) return null; // no year stated — nothing safe to compare
  const md = normMonthDay(m[1]);
  if (!md) return null;
  const year = parseInt(m[2], 10);
  const anchor = new Date(Date.UTC(year, MONTH_NAMES.indexOf(md.mon), md.day));
  const lo = new Date(Date.UTC(start.year, MONTH_NAMES.indexOf(start.mon), start.day));
  const hi = new Date(Date.UTC(end.year, MONTH_NAMES.indexOf(end.mon), end.day));
  if (anchor >= lo && anchor <= hi) return null;
  return { anchorDate: m[0], window: `${startIso} – ${endIso}` };
}

// Flag (c): a headcount named in the party/comments prose disagrees with the structured
// travelers bullet. Narrow on purpose — a handful of common phrasings, not free-form counting.
const HEADCOUNT_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

export function extractHeadcount(text) {
  if (!text) return null;
  const familyOf = /family of (\d+)/i.exec(text);
  if (familyOf) return parseInt(familyOf[1], 10);
  if (/\b(single|solo)\b/i.test(text)) return 1;
  if (/\bcouple\b/i.test(text)) return 2;
  const leading = /^(?:a\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i.exec(text.trim());
  if (leading) return /^\d+$/.test(leading[1]) ? parseInt(leading[1], 10) : HEADCOUNT_WORDS[leading[1].toLowerCase()];
  return null;
}

export function partySizeMismatch(partyText, travelerCount) {
  if (travelerCount == null) return null;
  const named = extractHeadcount(partyText);
  if (named == null || named === travelerCount) return null;
  return { named, stated: travelerCount };
}

/** Roll every detector over one intake doc's text into findings ready to become traveler
    questions. Pure — never touches disk; `applyContradictions` below is the file-mutating half. */
export function checkIntakeContradictions(text) {
  const { start, end } = extractDateRange(text);
  const anchor = extractAnchorText(text);
  const party = extractPartyText(text);
  const travelers = extractTravelerCount(text);

  const findings = [];

  for (const { marker, dates } of birthdayConflicts(text)) {
    // `marker` is always a possessive shape ("his", "traveler's own", ...) — grammatically
    // complete right before "birthday" with no extra possessive needed either way.
    findings.push({
      id: `birthday-${marker.replace(/[^a-z]+/g, "-").replace(/^-+|-+$/g, "")}`,
      q: `Your intake mentions ${marker} birthday as both ${dates.join(" and ")} — which is right?`,
      assumed: `Treating ${dates[0]} as correct; ${dates.slice(1).join(", ")} noted but not built around.`,
      context: "Trip Shape / traveler details",
    });
  }

  for (const { committed, other } of dateRangeAmbiguity(text, start)) {
    findings.push({
      id: "dates-range",
      q: `The dates say you were still deciding between ${committed} and ${other} — is ${committed} confirmed now, or should the guide flag the whole start date as unconfirmed?`,
      assumed: `Built the itinerary starting ${committed}, with an explicit ⚠ that ${other} is still possible and would shift every day by the gap between the two.`,
      context: "Trip Shape — start date",
    });
  }

  const window = anchorOutsideWindow(anchor, start, end);
  if (window) {
    findings.push({
      id: "anchor-outside-window",
      q: `The anchor event (${window.anchorDate}) falls outside the trip window you gave (${window.window}) — did the dates or the anchor change?`,
      assumed: "Kept both as stated and flagged the mismatch rather than silently moving either.",
      context: "Trip Shape — anchor event",
    });
  }

  const mismatch = partySizeMismatch(party, travelers);
  if (mismatch) {
    findings.push({
      id: "party-size-mismatch",
      q: `"Number of travelers" says ${mismatch.stated}, but the party description reads like ${mismatch.named} — which is right?`,
      assumed: `Built for ${mismatch.stated} travelers (the structured field), noted the discrepancy.`,
      context: "The Traveler(s) — party size",
    });
  }

  return { status: findings.length ? "advisory" : "clean", findings };
}

/** The file-mutating half: read a guide's intake doc, run the detectors, and append anything
    NEW (idempotent — an id already present in the doc is never re-appended, so a repeated run,
    e.g. the research-pass preflight re-running what new-guide.yml already stamped, is a no-op)
    as a `### q-<slug>-<id>` block under `## Questions for the traveler` (the existing mechanism,
    references/pipeline-roles.md — reused untouched) plus a line under `## Contradictions`
    (created if absent). Returns the finding count actually appended (0 on a clean or already-
    stamped doc). NEVER throws on a missing intake doc — callers proceed regardless. */
export async function applyContradictions(slug, guidesIntakeDir = GUIDES_INTAKE_DIR) {
  const file = path.join(guidesIntakeDir, `${slug}.md`);
  let text;
  try {
    text = await readFile(file, "utf8");
  } catch {
    return { applied: 0, findings: [] };
  }

  const { findings } = checkIntakeContradictions(text);
  const qId = (f) => `q-${slug}-${f.id}`;
  const fresh = findings.filter((f) => !text.includes(qId(f)));
  if (!fresh.length) return { applied: 0, findings };

  const questionBlocks = fresh
    .map((f) => `### ${qId(f)}\n- **Q:** ${f.q}\n- **Assumed:** ${f.assumed}\n- **Context:** ${f.context}\n- **Status:** open\n`)
    .join("\n");

  let out = text;
  if (out.includes("## Questions for the traveler")) {
    out = out.replace(
      /^## Questions for the traveler.*$\n(?:> .*\n)*\n?(?:\(none yet\)\n)?/m,
      (block) => block.replace(/\(none yet\)\n?/, "") + questionBlocks + "\n",
    );
  } else {
    out += `\n## Questions for the traveler\n\n${questionBlocks}\n`;
  }

  const contradictionLines = fresh.map((f) => `- \`${qId(f)}\` — ${f.q}`).join("\n");
  if (out.includes("## Contradictions")) {
    out = out.replace(/^## Contradictions\n(?:> .*\n)*\n?/m, (block) => `${block}${contradictionLines}\n\n`);
  } else {
    out += `\n## Contradictions\n> Deterministic findings from \`npm run check-intake-contradictions\` — never a hard-stop; research proceeds on each finding's Assumed line above.\n\n${contradictionLines}\n`;
  }

  await import("node:fs/promises").then(({ writeFile }) => writeFile(file, out));
  return { applied: fresh.length, findings };
}

// ── CLI ──
if (isMain(import.meta.url)) {
  const argv = process.argv.slice(2);
  const slug = argv.includes("--slug") ? argv[argv.indexOf("--slug") + 1] : null;
  const write = argv.includes("--write");
  if (!slug) {
    console.error("Usage: node scripts/audit/check-intake-contradictions.mjs --slug <slug> [--write]");
    process.exit(1);
  }
  const file = path.join(GUIDES_INTAKE_DIR, `${slug}.md`);
  const text = await readFile(file, "utf8").catch(() => null);
  if (text == null) {
    console.log(`[contradictions] ${slug}: no intake doc at ${file}`);
    process.exit(0);
  }
  const { status, findings } = checkIntakeContradictions(text);
  if (status === "clean") {
    console.log(`[contradictions] ${slug}: clean — no findings`);
  } else {
    console.log(`[contradictions] ${slug}: ${findings.length} finding(s)`);
    for (const f of findings) console.log(`  ⚠ ${f.id}: ${f.q}`);
  }
  if (write) {
    const { applied } = await applyContradictions(slug);
    console.log(`[contradictions] ${slug}: appended ${applied} new question(s) to ${file}`);
  }
  // Never a hard failure (creator ruling) — always exits 0.
}
