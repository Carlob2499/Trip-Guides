/**
 * Pure logic behind the /new PREFLIGHT CHECKLIST (ui/intake-checklist.js): the six-section
 * grouping over the intake schema, each section's status, the completeness meter, the
 * head-to-head priority tally, and the pre-dispatch fork gate. Extracted for the reason
 * model/intake.ts was — which field sits in which section, when a section is "done" rather
 * than "part done", and which clarifying question the answers actually raise are the
 * bug-prone bits, and none of them need a DOM to test.
 *
 * PIPELINE CONTRACT (do not drift): SECTIONS is a PRESENTATION GROUPING over
 * scripts/intake-schema.mjs's FIELDS — every `id` here is a FIELDS id and every FIELDS id
 * appears in exactly one section (model/intake-contract.test.ts asserts both). Adding an
 * intake field means adding it to the schema; this file then has to place it or the contract
 * test fails. `dom` names the ids intake-submit.js collects, which is the other half of the
 * same seam.
 *
 * TRAVELLER LANGUAGE, NOT RESEARCH ARCHITECTURE. The schema's own `description` strings are
 * written for the pipeline ("drives the Atlas globe's route line", "recorded as UNCONFIRMED").
 * The `changes` line here answers the only question a traveller is actually asking — what does
 * my answer change about MY guide — so it is authored here rather than borrowed from there.
 */

import { RANK_CARDS, NICHE_VALUE, type RankCard } from "./intake";

export interface ChecklistField {
  /** scripts/intake-schema.mjs FIELDS id — the seam the contract test asserts. */
  id: string;
  /** DOM ids carrying this field's value. `dates` is one schema field over two inputs. */
  dom: string[];
  /** The traveller-voice question this row asks. Omitted on derived fields. */
  question?: string;
  /** Inline example, shown under the question. */
  example?: string;
  /** What this answer changes, in the traveller's terms. */
  changes?: string;
  /** A certainty rider: its select always holds a real value ("assumed"), so it can never be
   *  blank in the sense this checklist means, and counting it would inflate every section it
   *  sits in. Same rule model/intake.ts's CERTAINTY_IDS states. It still gets a row — "how
   *  firm is that?" is a real question — it just never moves the meter. */
  rider?: boolean;
  /** No row of its own: another control writes it (the priority fields, from the matchups). */
  derived?: boolean;
  /** Countable unit. Fields that are one answer to a traveller share one key. */
  unit?: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  /** One line under the heading — what the section is for. */
  blurb: string;
  fields: ChecklistField[];
  /** The head-to-head priority run renders here instead of three dropdowns. */
  matchups?: boolean;
}

export const SECTIONS: ChecklistSection[] = [
  {
    id: "trip",
    title: "Trip",
    blurb: "Where, when, and whether anything is already locked in.",
    fields: [
      { id: "country", dom: ["ngCountry"], question: "Which country?", example: "Brazil",
        changes: "Sets the guide itself — its currency, its holidays, and everything researched in it." },
      { id: "cities", dom: ["ngCities"], question: "Any cities you already know you'll be in?",
        example: "Rio de Janeiro, São Paulo",
        changes: "Decides which neighbourhoods get walked, and how the days group together." },
      { id: "dates", dom: ["ngStart", "ngEnd"], question: "When?",
        example: "leave the second date empty if only the start is settled",
        changes: "Fills the day-by-day plan, and pulls the weather and holidays for those exact days." },
      { id: "dates-certainty", dom: ["ngDatesCertainty"], rider: true, question: "How firm are those dates?",
        changes: "Booked dates get built around. A best guess gets flagged instead of locked in." },
      { id: "departure-airport", dom: ["ngDepartureAirport"], question: "Where are you flying out of?",
        example: "EWR — or just \"Newark\"",
        changes: "Draws the line from home to the trip on your map." },
      { id: "anchor", dom: ["ngAnchor"], question: "Is the trip built around one thing?",
        example: "a festival, a match, a wedding — or nothing, that's fine",
        changes: "Becomes the fixed point the rest of the days are arranged around, and the first fact checked." },
      { id: "anchor-certainty", dom: ["ngAnchorCertainty"], rider: true, question: "How firm is that?",
        changes: "Confirmed and the days plan around it. Expected and a fallback day gets planned too." },
    ],
  },
  {
    id: "who",
    title: "Who's going",
    blurb: "The people, not the personalities — the guide is sized to them.",
    fields: [
      { id: "travelers", dom: ["ngTravelers"], question: "How many of you?", example: "3",
        changes: "Splits every cost, and sizes every booking." },
      { id: "party", dom: ["ngParty"], question: "Who are they?",
        example: "the Korea group (3 mid-20s, heavy walkers) / family of 5 with grandparents",
        changes: "Decides how far a day walks, and whether the group can split up." },
      { id: "destination-familiarity", dom: ["ngDestinationFamiliarity"], question: "How familiar are you with the destination?",
        changes: "Sets how much orientation the finished guide explains instead of assuming you already know." },
      { id: "passport-countries", dom: ["ngPassports"], question: "Whose passports?",
        example: "United States, United Kingdom",
        changes: "Which entry and visa rules get looked up — one row per passport in the party." },
    ],
  },
  {
    id: "priorities",
    title: "Priorities",
    blurb: "Five quick either-ors. What wins gets the deepest research.",
    matchups: true,
    fields: [
      { id: "priority1", dom: ["ngPriority1"], derived: true, unit: "priorities" },
      { id: "priority2", dom: ["ngPriority2"], derived: true, unit: "priorities" },
      { id: "priority3", dom: ["ngPriority3"], derived: true, unit: "priorities" },
      { id: "niche", dom: ["ngNiche"], question: "Anything specific you'd follow anywhere?",
        example: "live music, ceramics, birding — leave blank if nothing comes to mind",
        changes: "Adds one thread the guide follows through every city, not just the obvious stops." },
    ],
  },
  {
    id: "budget",
    title: "Budget",
    blurb: "A bracket, and how much it can move.",
    fields: [
      { id: "budget", dom: ["ngBudget"], question: "Roughly what per day, all in?",
        example: "lodging + food + doing things",
        changes: "Sets the bracket every place suggested has to fit inside." },
      { id: "budget-certainty", dom: ["ngBudgetCertainty"], rider: true, question: "How firm is that?",
        changes: "A hard cap changes which places make the guide. A rough goal only changes their order." },
    ],
  },
  {
    id: "constraints",
    title: "Constraints",
    blurb: "Hard rules, not preferences. These bind the research.",
    fields: [
      { id: "constraints", dom: ["ngConstraints"], question: "Anything the guide has to honour?",
        example: "no stairs / severe peanut allergy / max ~3 km walking a day",
        changes: "Stops being a preference: every place has to be checked against it before it's suggested." },
    ],
  },
  {
    id: "tone",
    title: "Style",
    blurb: "How the days should feel, and how the finished guide should read.",
    fields: [
      { id: "pace", dom: ["ngPace"], question: "How packed should the days be?",
        changes: "How many things land in a day, and how much of it stays open." },
      { id: "travel-style", dom: ["ngTravelStyle"], question: "How far off the main drag?",
        changes: "Whether the picks lean marquee or quiet." },
      { id: "guide-audience", dom: ["ngGuideAudience"], question: "Who will use the guide?",
        changes: "Controls how much traveler context is stated out loud instead of staying implicit." },
      { id: "guide-style", dom: ["ngGuideStyle"], question: "How much detail should the guide surface?",
        changes: "Biases the scannable default view versus the deeper context behind More detail — without changing the facts." },
      { id: "comments", dom: ["ngComments"], question: "Anything the questions missed?",
        example: "an anniversary, a dealbreaker, someone joining halfway",
        changes: "Reaches the person building the guide exactly as you wrote it." },
    ],
  },
];

export const SECTION_IDS: string[] = SECTIONS.map((s) => s.id);

/* ── Status ──────────────────────────────────────────────────────────────────────
   Four readings, and the fourth is the point: SKIPPING IS A FIRST-CLASS ANSWER. An
   intake with a section left deliberately blank is not a broken intake — it is a
   traveller saying "you decide", and the guide states that gap rather than inventing
   a value for it. So a skipped section reads `assumed`, not `todo`. */

export type SectionState = "todo" | "part" | "done" | "assumed";

/** The countable answers in a section: riders never count, and fields that are one answer
 *  to a traveller (the three priority slots) count once. */
export function sectionUnits(section: ChecklistSection): string[] {
  const out: string[] = [];
  for (const f of section.fields) {
    if (f.rider) continue;
    const unit = f.unit ?? f.id;
    if (!out.includes(unit)) out.push(unit);
  }
  return out;
}

function unitFilled(section: ChecklistSection, unit: string, vals: Record<string, string>): boolean {
  return section.fields.some(
    (f) => (f.unit ?? f.id) === unit && f.dom.some((d) => (vals[d] ?? "").trim() !== ""),
  );
}

/** How many of a section's countable answers are actually answered. */
export function filledUnits(section: ChecklistSection, vals: Record<string, string>): number {
  return sectionUnits(section).filter((u) => unitFilled(section, u, vals)).length;
}

export function sectionState(
  section: ChecklistSection,
  vals: Record<string, string>,
  skipped: string[],
): SectionState {
  if (skipped.includes(section.id)) return "assumed";
  const units = sectionUnits(section);
  const n = filledUnits(section, vals);
  if (n === 0) return "todo";
  return n === units.length ? "done" : "part";
}

/** The square stamp beside each section heading. The word is the accessible carrier —
 *  SPEC-COMPONENTS §6: never a coloured mark without it. */
export const STAMP_LABEL: Record<SectionState, string> = {
  done: "DONE",
  part: "PART DONE",
  todo: "NOT STARTED",
  assumed: "ASSUMED",
};

/** Every section's state, in SECTIONS order. */
export function allStates(vals: Record<string, string>, skipped: string[]): SectionState[] {
  return SECTIONS.map((s) => sectionState(s, vals, skipped));
}

/** Meter fill, 0–1, for the `scaleX` bar. A skipped section counts 0.4: it is a decision
 *  made, not an answer given, and reading it as either extreme would misreport the intake. */
export function meterFill(states: SectionState[]): number {
  if (!states.length) return 0;
  const done = states.filter((s) => s === "done").length;
  const assumed = states.filter((s) => s === "assumed").length;
  return (done + assumed * 0.4) / states.length;
}

export function clearedLabel(states: SectionState[]): string {
  const done = states.filter((s) => s === "done").length;
  const skipped = states.filter((s) => s === "assumed").length;
  return `${done} of ${states.length} done` + (skipped ? ` · ${skipped} skipped` : "");
}

/** How many countable answers are still blank, across every section. */
export function blankCount(vals: Record<string, string>): number {
  return SECTIONS.reduce((n, s) => n + (sectionUnits(s).length - filledUnits(s, vals)), 0);
}

/** The meter's right-hand line. NOT a time or cost estimate: the design puts
 *  "est. 1h 40m · ~$11.80" here, and neither number is knowable before the research runs —
 *  a confident wrong figure is exactly the plausible-but-invented claim this project's
 *  accuracy rules forbid (the same call model/progress.ts makes about "time remaining").
 *  What IS knowable is how much of the intake is still blank, and what happens to it. */
export function blanksLine(vals: Record<string, string>): string {
  const n = blankCount(vals);
  if (n === 0) return "Nothing left blank";
  return `${n} left blank · stated as gaps, never guessed`;
}

/** The next section still worth opening, skipping the one just finished. */
export function nextSection(
  states: SectionState[],
  currentId: string | null,
): ChecklistSection | null {
  for (let i = 0; i < SECTIONS.length; i++) {
    if (SECTIONS[i].id === currentId) continue;
    if (states[i] === "todo" || states[i] === "part") return SECTIONS[i];
  }
  return null;
}

/* ── Head-to-head priorities ─────────────────────────────────────────────────────
   Five either-ors over six categories, instead of three dropdowns of seven. The
   CATEGORIES are RANK_CARDS minus the niche option — filtered, never retyped, so the
   values stay the issue form's exact option strings (a "friendlified" value files as
   blank and the traveller's #1 priority reaches research as nothing at all). Niche is
   not a matchup: it is a free-text thread, and it keeps its own field. */

export const MATCH_CATEGORIES: RankCard[] = RANK_CARDS.filter((c) => c.value !== NICHE_VALUE);

/** The five pairings, as index pairs into MATCH_CATEGORIES. Every category appears at
 *  least once; the spread is deliberately uneven so five taps can separate six things. */
export const MATCHUPS: Array<[number, number]> = [[0, 1], [2, 3], [0, 2], [1, 5], [0, 4]];

/** Winner values, in matchup order → one point each. */
export function tally(picks: string[]): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const c of MATCH_CATEGORIES) scores[c.value] = 0;
  for (const p of picks) if (p in scores) scores[p] += 1;
  return scores;
}

/** The ranked top three. Only a category that actually WON something is ranked — with five
 *  matchups a clean third place may not exist, and padding the podium out of the leftovers
 *  would be inventing a preference the traveller never expressed. Ties break toward the
 *  earlier category in MATCH_CATEGORIES: arbitrary, but fixed, so the same taps always
 *  produce the same ranking. */
export function rankFromPicks(picks: string[]): string[] {
  const scores = tally(picks);
  return MATCH_CATEGORIES.map((c, i) => ({ value: c.value, score: scores[c.value], i }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, 3)
    .map((e) => e.value);
}

/* ── The fork gate ───────────────────────────────────────────────────────────────
   The last thing before dispatch: the clarifying questions THE ANSWERS THEMSELVES raise.
   The design's two questions are demo content for its Iceland trip ("Reykjavík base or
   move around?"), and a question whose answer posts nowhere is the page lying to the
   traveller — Reconciliation 4. So each fork here is derived from what was actually
   entered and writes to a real schema field, riding out in the same dispatch payload.
   No forks means no gate: an intake that raises nothing has nothing to ask. */

export interface Fork {
  /** Stable id — the key `forkPicks` persists under. */
  id: string;
  /** The DOM select this writes. Its own options supply the choices, so the traveller-
   *  facing wording lives in one place (the page) rather than being copied here. */
  dom: string;
  question: string;
  /** Why the recommendation is the recommendation. A reason, never a statistic. */
  why: string;
  /** The option value recommended, or "" for no recommendation. */
  recommend: string;
}

/** At most two PER SESSION, matching the design's card. More than two before dispatch stops
 *  being a gate and becomes a second form. */
export const MAX_FORKS = 2;

/** The candidates below outnumber MAX_FORKS, so the budget has to count what the traveller
 *  has ALREADY answered, not just what is still open. Counting only the open ones makes the
 *  gate a treadmill: answer both, the next two slide in, and "All set" keeps receding — which
 *  is the opposite of a gate. Two questions, then the remaining blanks travel as blanks, which
 *  is what the rest of this page already promises them. */
export function deriveForks(vals: Record<string, string>, picks: Record<string, string> = {}): Fork[] {
  const answered = (id: string) => Object.prototype.hasOwnProperty.call(picks, id);
  const room = MAX_FORKS - Object.keys(picks).length;
  if (room <= 0) return [];
  const has = (id: string) => (vals[id] ?? "").trim() !== "";
  const assumed = (id: string) => (vals[id] ?? "assumed").trim() === "assumed";
  const out: Fork[] = [];

  if ((has("ngStart") || has("ngEnd")) && assumed("ngDatesCertainty")) {
    out.push({
      id: "dates-certainty", dom: "ngDatesCertainty",
      question: "You gave dates, but not how firm they are.",
      why: "Unless they're booked, the safer answer is the looser one — research flags a movable date instead of building the whole trip on it.",
      recommend: "target",
    });
  }
  if (has("ngAnchor") && assumed("ngAnchorCertainty")) {
    out.push({
      id: "anchor-certainty", dom: "ngAnchorCertainty",
      question: "How settled is the thing the trip is built around?",
      why: "Expected rather than confirmed means the day gets a fallback planned beside it, which costs you nothing if it goes ahead.",
      recommend: "target",
    });
  }
  if (has("ngBudget") && assumed("ngBudgetCertainty")) {
    out.push({
      id: "budget-certainty", dom: "ngBudgetCertainty",
      question: "Is that budget a ceiling or a target?",
      why: "A target keeps the good outliers in the guide with their prices stated; a hard cap removes them entirely.",
      recommend: "target",
    });
  }
  if (!has("ngPace")) {
    out.push({
      id: "pace", dom: "ngPace",
      question: "How packed should the days be?",
      why: "Balanced leaves room to add or drop something without the rest of the day falling over.",
      recommend: "balanced",
    });
  }
  if (!has("ngTravelStyle")) {
    out.push({
      id: "travel-style", dom: "ngTravelStyle",
      question: "Marquee sights, or the quieter version?",
      why: "Balanced covers the things you'd regret missing and still leaves room for the ones you wouldn't have found.",
      recommend: "Balanced",
    });
  }
  // An answered fork drops out of the queue but keeps spending its budget above — a traveller
  // who picks "leave it open" still re-trips its rule, and asking again would be a loop.
  return out.filter((f) => !answered(f.id)).slice(0, room);
}

/** Every derived fork answered? The send control unlocks on this. Presence, not truthiness:
 *  "leave it open" is one of the choices, and it writes the empty value the field's own
 *  dropdown uses for undecided — reading that back as unanswered would trap a traveller who
 *  made exactly the decision they were asked to make. */
export function forksCleared(forks: Fork[], picks: Record<string, string>): boolean {
  return forks.every((f) => Object.prototype.hasOwnProperty.call(picks, f.id));
}
