/**
 * The New-Guide intake's priority vocabulary (/new, ui/intake-checklist.js): which card maps
 * to which issue-enum value, and how a ranking becomes the three priority fields. Extracted
 * for the same reason model/wizard.ts was (A7) — it is the bug-prone bit and it needs no DOM
 * to test. The six-section checklist that renders around it is model/checklist.ts.
 *
 * PIPELINE CONTRACT (do not drift): every value this module produces must be one the
 * issue form already accepts — priority values are the EXACT option strings from the
 * new-guide issue template; field keys are the EXACT ids intake-submit.js collects.
 * The shell has changed twice (R4's composed flow, then the 2026-08-15 preflight
 * checklist); the seam has not.
 */

/* ── The priority cards ───────────────────────────────────────────────────────────
   The checklist asks these as five head-to-head matchups (model/checklist.ts) rather
   than as three dropdowns of seven. RANK cards carry the issue template's exact enum
   values; TOPIC chips are the also-research tier that folds into comments, exactly as
   the old wizard's chips did. */

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

/** Ranked card values (best first, max 3) → the three priority field values.
 *  Shorter ranks pad with "" — the issue form treats empty as "— none —". */
export function rankToFields(ranked: string[]): { priority1: string; priority2: string; priority3: string } {
  return {
    priority1: ranked[0] ?? "",
    priority2: ranked[1] ?? "",
    priority3: ranked[2] ?? "",
  };
}
