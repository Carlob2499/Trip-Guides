/**
 * Pure logic behind the composed New-Guide intake (/new, ui/intake-flow.js) — the ranked
 * priority board, the ask-only-what's-missing interview tail, and the manifest confirm
 * paragraph. Extracted for the same reason model/wizard.ts was (A7): which card maps to
 * which issue-enum value, which tail question fires for which empty field, and what the
 * confirm paragraph says are the bug-prone bits, and none of them need a DOM to test.
 *
 * PIPELINE CONTRACT (do not drift): every value this module produces must be one the
 * issue form already accepts — priority values are the EXACT option strings from the
 * new-guide issue template; field keys are the EXACT ids intake-submit.js collects.
 * The shell changed (R4, 2026-08-05 intake redesign); the seam did not.
 */

/* ── The ranked board ─────────────────────────────────────────────────────────────
   One interaction replaces the old 3×7 priority dropdowns AND the separate research-
   topic chips (the 2026-08-05 critique's densest-moment flag): tap cards into rank
   order. RANK cards carry the issue template's exact enum values; TOPIC chips are the
   also-research tier that folds into comments, exactly as the old wizard's chips did. */

export interface RankCard {
  /** EXACT issue-template option string — the pipeline's vocabulary, never invented. */
  value: string;
  /** Friendlier display label (the value is shown nowhere). */
  label: string;
}

export const RANK_CARDS: RankCard[] = [
  { value: "Food & dining", label: "Food & dining" },
  { value: "Culture / history", label: "Culture & history" },
  { value: "Nature / outdoors", label: "Nature & outdoors" },
  { value: "Nightlife", label: "Nightlife" },
  { value: "Shopping", label: "Shopping" },
  { value: "Wellness / relaxation", label: "Wellness & relaxation" },
  { value: "Niche interest (specify below)", label: "Something niche…" },
];

export const NICHE_VALUE = "Niche interest (specify below)";

/** The also-research tier — topic-only chips (no enum seat), same strings the old
 *  wizard's TOPICS travelled under, so the research brief reads identically. */
export const TOPIC_CHIPS: string[] = [
  "Events & festivals", "Day trips", "Photo spots", "Gaming & anime", "Museums & culture",
];

/** Ranked card values (in tap order, max 3) → the three priority field values.
 *  Shorter ranks pad with "" — the issue form treats empty as "— none —". */
export function rankToFields(ranked: string[]): { priority1: string; priority2: string; priority3: string } {
  return {
    priority1: ranked[0] ?? "",
    priority2: ranked[1] ?? "",
    priority3: ranked[2] ?? "",
  };
}

/* ── The interview tail ───────────────────────────────────────────────────────────
   After the drop zone (which may prefill) and the board, the tail asks ONLY what is
   still blank — one small screen per group. Pure descriptors; the UI renders each
   step's real form fields (the flat form stays the single source of truth). */

export interface TailStep {
  /** Field ids this screen shows (all from the flat form). */
  ids: string[];
  /** The big serif question. */
  ask: string;
  /** Optional smaller reassurance line. */
  sub?: string;
}

/* A certainty field (dates / anchor / budget) rides in the step of the field it QUALIFIES —
   asking "how firm is that?" on its own screen would be a quiz about an answer the traveler
   hasn't given yet. It is a RIDER: it never decides whether a step fires. It cannot be blank in
   the sense the tail means — its select defaults to the schema's real "assumed" value
   (intake-schema.mjs's CERTAINTY_OPTIONS comment: an unstated certainty means "assumed", not
   "unset") — so counting it as empty would re-ask a question the drop zone already answered.
   Budget's certainty is the exception to the placement, not the rule: budget itself lives on the
   ranked board, so its row is built there rather than in the tail. */
export const CERTAINTY_IDS: string[] = ["ngDatesCertainty", "ngAnchorCertainty", "ngBudgetCertainty"];
export const TAIL_STEPS: TailStep[] = [
  { ids: ["ngCountry", "ngCities"], ask: "Where are we going?", sub: "Country is the one thing research can't start without." },
  { ids: ["ngStart", "ngEnd", "ngDatesCertainty"], ask: "When, roughly?", sub: "Even a loose window shapes what gets checked — and how firm it is decides whether research treats it as booked." },
  { ids: ["ngDepartureAirport"], ask: "Where are you flying out of?", sub: "A code is best (EWR, JFK); a city name works. It's the home end of the route line on your map." },
  { ids: ["ngAnchor", "ngAnchorCertainty"], ask: "Is the trip built around something?", sub: "A festival, a match, a season — or nothing, that's fine." },
  { ids: ["ngTravelers", "ngParty"], ask: "Who's going?", sub: "Numbers and shape — the guide is tailored to the people on it." },
  { ids: ["ngPassports"], ask: "Whose passports?", sub: "Drives the visa & entry research." },
  { ids: ["ngConstraints"], ask: "Anything the guide must honor?", sub: "Mobility, dietary, sensory — hard rules, not preferences." },
  { ids: ["ngNiche"], ask: "You said something niche — what is it?", sub: "e.g. live music, ceramics, birding." },
  { ids: ["ngComments"], ask: "Anything else the researcher should know?" },
];

/** Which tail steps still need asking, given current field values (id → value) and the
 *  ranked priorities. A step fires when ANY of its fields is empty — except the certainty
 *  riders, which are never counted (see CERTAINTY_IDS above); the niche step
 *  fires only when a ranked priority IS the niche enum (killing the old form's
 *  remember-the-dropdown memory bridge); the two always-optional closers (constraints,
 *  comments) still show when empty — an explicit blank is a decision, so they render
 *  once, skippable. */
export function nextTailSteps(
  values: Record<string, string>,
  ranked: string[],
): TailStep[] {
  const empty = (id: string) => !CERTAINTY_IDS.includes(id) && !(values[id] ?? "").trim();
  return TAIL_STEPS.filter((step) => {
    if (step.ids.includes("ngNiche") && !ranked.includes(NICHE_VALUE)) return false;
    return step.ids.some(empty);
  });
}

/* ── The manifest ─────────────────────────────────────────────────────────────────
   The confirm screen: the trip describing itself in one paragraph — every value a
   blank the reader can reopen. Pure: values in, alternating text/field segments out.
   Ghosts are what renders when the value is empty (quietly honest, never invented). */

export interface ManifestSegment {
  text?: string;
  /** When set, this segment renders as a blank bound to that field id. */
  field?: string;
  ghost?: string;
}

export function manifestSegments(v: Record<string, string>): ManifestSegment[] {
  const get = (id: string) => (v[id] ?? "").trim();
  const dates = [get("ngStart"), get("ngEnd")].filter(Boolean).join(" → ");
  const segs: ManifestSegment[] = [
    { text: "We're " },
    { field: "ngTravelers", ghost: "some travelers" },
    { text: " (" },
    { field: "ngParty", ghost: "party TBD" },
    { text: ") heading to " },
    { field: "ngCountry", ghost: "somewhere" },
  ];
  if (get("ngCities")) segs.push({ text: " — " }, { field: "ngCities", ghost: "" });
  segs.push(
    { text: ", " },
    dates ? { field: "ngStart", ghost: "dates open" } : { field: "ngStart", ghost: "dates open" },
    { text: get("ngAnchor") ? ", built around " : "" },
  );
  if (get("ngAnchor")) segs.push({ field: "ngAnchor", ghost: "" });
  segs.push(
    { text: ". We move " },
    { field: "ngPace", ghost: "at our own pace" },
    { text: ", lean " },
    { field: "ngTravelStyle", ghost: "wherever it's good" },
    { text: ", care most about " },
    { field: "ngPriority1", ghost: "everything a bit" },
  );
  if (get("ngPriority2")) segs.push({ text: ", then " }, { field: "ngPriority2", ghost: "" });
  if (get("ngPriority3")) segs.push({ text: ", then " }, { field: "ngPriority3", ghost: "" });
  if (get("ngNiche")) segs.push({ text: " — specifically " }, { field: "ngNiche", ghost: "" });
  segs.push({ text: ", on a " }, { field: "ngBudget", ghost: "budget TBD" }, { text: " footing." });
  if (get("ngDepartureAirport")) segs.push({ text: " Flying out of " }, { field: "ngDepartureAirport", ghost: "" }, { text: "." });
  if (get("ngConstraints")) segs.push({ text: " The guide must honor: " }, { field: "ngConstraints", ghost: "" }, { text: "." });
  if (get("ngPassports")) segs.push({ text: " Passports: " }, { field: "ngPassports", ghost: "" }, { text: "." });
  // Drop empty-text segments so the UI never renders stray separators.
  return segs.filter((s) => s.field !== undefined || (s.text ?? "") !== "");
}
