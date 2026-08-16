/* Change-request advisory — pure decision layer. No DOM, no network.
   Given what the requester typed and the guide's OWN tab groups, work out which tabs a change
   would plausibly touch, how big the job looks, and which topics they raised.

   Everything here is ADVISORY and the UI must say so. It is a keyword map, not a plan: it has
   never read the guide's content, and the editor that actually runs the change is free to touch
   something this never guessed. Its job is to make "I typed a sentence into a box" feel like it
   landed somewhere specific — and to let the requester REMOVE a tab they know is irrelevant,
   which is the one signal here the editor genuinely could not derive on its own.

   Why match the guide's real groups instead of the prototype's hardcoded ["Plan","Days","Weather"]:
   those names came from a guide that no longer exists. Denmark ships 8 groups and Korea 11, and
   neither has a "Weather" tab. Naming a tab the reader cannot find is the guide lying about
   itself — so rules carry a pattern for the GROUP NAME and only ever return groups that are
   actually in front of the reader. A guide with no matching tab simply gets no suggestion. */

import { CHANGE_MIN } from "../../../lib/modify-schema.mjs";

/** How the pipeline would treat a tab: rewrite it, or check it and probably leave it alone. */
export type AdvisoryKind = "rewrite" | "check";

/** The topics a request can be about. Five, from the approved prototype — not extensible here:
    a sixth category is a design decision, not an implementation one. */
export type AdvisoryCategory = "dates" | "access" | "closed" | "money" | "taste";

/** The chip label the requester sees. These are the reader's words, not the pipeline's. */
export const CATEGORY_LABEL: Record<AdvisoryCategory, string> = {
  dates: "When?",
  access: "Access needs",
  closed: "Something closed",
  money: "Budget",
  taste: "Preferences",
};

/**
 * The tone token each category paints with, resolved in CSS as `var(--<token>)`.
 *
 * `dates` and `access` deliberately SHARE `--accent` and are told apart by their labels — the
 * design README's decision 1 ruled out the prototype's purple, and inventing a sixth hue to
 * replace it would have been the same mistake with a different swatch.
 */
export const CATEGORY_TONE: Record<AdvisoryCategory, string> = {
  dates: "accent",
  access: "accent",
  closed: "crit",
  money: "green",
  taste: "warn",
};

interface Rule {
  /** What the requester wrote. */
  re: RegExp;
  /** Which of the guide's own tab groups it points at, matched against the group NAME. */
  groups: RegExp;
  kind: AdvisoryKind;
  /**
   * The chip this raises, if any.
   *
   * Two rules deliberately have none. The prototype filed "our hotel is wrong" under
   * `access` and "the airport bus changed" under `dates`, which would print a chip reading
   * "Access needs" to someone who said nothing about access, and "When?" to someone who said
   * nothing about dates. A chip is the requester's own words handed back to them; handing back
   * the wrong words is worse than handing back none. These rules still route to the right tabs.
   */
  cat?: AdvisoryCategory;
}

/**
 * The keyword map, from the prototype's RULES with its two category slips dropped (above) and
 * its tab names generalised to group patterns.
 *
 * Order matters only for which KIND wins a tie, and `rewrite` beats `check` regardless (see
 * affectedGroups) — so this list reads by topic, not by priority.
 */
const RULES: Rule[] = [
  {
    re: /\b(date|dates|week|month|when|moved|shift(?:ed)?|reschedul\w*|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/i,
    groups: /plan|day|weather|season|essential/i,
    kind: "rewrite",
    cat: "dates",
  },
  {
    re: /\b(stairs?|wheelchair|step-?free|access(?:ible|ibility)?|mobility|walking|elderly|father|mother|grandparent|pram|stroller|baby|toddler)\b/i,
    groups: /stay|sleep|day|sight|around|transit/i,
    kind: "rewrite",
    cat: "access",
  },
  {
    re: /\b(closed|shut|gone|no longer|permanently|gone out of business|replaced?)\b/i,
    groups: /food|sight|shop|day trip/i,
    kind: "rewrite",
    cat: "closed",
  },
  {
    re: /\b(budget|cheap(?:er)?|expensive|cost|costs|money|afford|price|prices|fare|fares|trim)\b/i,
    groups: /budget|money|cost|stay|essential/i,
    kind: "check",
    cat: "money",
  },
  {
    re: /\b(food|eat|eating|restaurant|dinner|lunch|dining|meal|vegetarian|vegan|allerg\w+|halal|kosher)\b/i,
    groups: /food|eat|shop/i,
    kind: "rewrite",
    cat: "taste",
  },
  // Topic-only rules: they route, they do not label. See Rule.cat.
  {
    re: /\b(hotel|hostel|airbnb|room|rooms|accommodation|stay(?:ing)?)\b/i,
    groups: /stay|sleep/i,
    kind: "rewrite",
  },
  {
    re: /\b(flight|flights|airport|fly(?:ing)?|transit|bus|train|metro|subway|taxi|car|drive|driving|rental)\b/i,
    groups: /transit|around|getting|plan/i,
    kind: "check",
  },
];

/**
 * How much text before the advisory says anything.
 *
 * Tied to the Worker's own floor rather than the prototype's 8, so the panel and the send button
 * turn on together — a panel that fills in while the button still rejects the text is the surface
 * disagreeing with itself.
 */
export const ADVISORY_MIN = CHANGE_MIN;

/** A tab the change looks like it would touch. */
export interface AffectedGroup {
  group: string;
  kind: AdvisoryKind;
}

function usable(text: string): string {
  const t = (text ?? "").trim();
  return t.length >= ADVISORY_MIN ? t : "";
}

/**
 * Which of this guide's tabs the change looks like it touches, in the guide's own nav order —
 * so the list reads in the same order as the tab map below it, not in rule order.
 *
 * `dropped` is the requester's veto. They know things the keyword map cannot: it is their trip.
 */
export function affectedGroups(
  text: string,
  groups: string[] | null | undefined,
  dropped?: Iterable<string> | null,
): AffectedGroup[] {
  const t = usable(text);
  if (!t) return [];
  const veto = new Set(dropped ?? []);
  const out: AffectedGroup[] = [];

  for (const group of groups ?? []) {
    if (!group || veto.has(group)) continue;
    let kind: AdvisoryKind | null = null;
    for (const rule of RULES) {
      if (!rule.re.test(t) || !rule.groups.test(group)) continue;
      // "Rewrite it" and "look at it" can both be true; the stronger one is the honest answer.
      if (rule.kind === "rewrite") {
        kind = "rewrite";
        break;
      }
      kind = kind ?? "check";
    }
    if (kind) out.push({ group, kind });
  }
  return out;
}

/** The topics the text raised, deduped, in the order the rules declare them. */
export function matchedCategories(text: string): AdvisoryCategory[] {
  const t = usable(text);
  if (!t) return [];
  const seen = new Set<AdvisoryCategory>();
  for (const rule of RULES) {
    if (rule.cat && rule.re.test(t)) seen.add(rule.cat);
  }
  return [...seen];
}

export type Weight = "—" | "Quick fix" | "Bigger job";

/**
 * How big the job looks. Two or more tabs to REWRITE is the line, per the plan.
 *
 * The prototype counted `kind === "re-research"`, a kind none of its own rules ever emitted, so
 * its stamp read "Quick fix" for every request ever typed into it — including one that rewrote
 * six tabs. A stamp that cannot change is not information.
 */
export function deriveWeight(affected: AffectedGroup[] | null | undefined): Weight {
  const list = affected ?? [];
  if (!list.length) return "—";
  return list.filter((a) => a.kind === "rewrite").length >= 2 ? "Bigger job" : "Quick fix";
}

/**
 * What to say about time. Grounded in the one figure the project actually has: a change run is
 * "one editor agent plus a critic, minutes rather than hours" (CONTEXT.md).
 *
 * It describes the EDIT, never the wait — when the edit starts depends on the owner, and this
 * surface has no way to know that. The prototype's "Usually done in about 10 minutes" promised
 * a number nothing measures.
 */
export const WEIGHT_NOTE: Record<Weight, string> = {
  "—": "Nothing matched yet. Say a little more and we'll show what it would touch.",
  "Quick fix": "Editing takes minutes rather than hours once it starts.",
  "Bigger job": "More tabs to redo — still minutes rather than hours, but more of them.",
};

/** How a tab is labelled in the "what we'd touch" map. */
export type TouchTag = "Redone" | "Checked" | "Untouched";

export interface SectionTouch {
  group: string;
  tag: TouchTag;
  /** 0 or 1 — drives the underline's `scaleX`, so the bar draws instead of resizing. */
  bar: 0 | 1;
}

const TAG_FOR: Record<AdvisoryKind, TouchTag> = { rewrite: "Redone", check: "Checked" };

/** Every tab in the guide, tagged. The untouched ones are the point: the map's job is to show
    that most of the guide stays exactly as it is. */
export function sectionTouches(
  groups: string[] | null | undefined,
  affected: AffectedGroup[] | null | undefined,
): SectionTouch[] {
  const byGroup = new Map((affected ?? []).map((a) => [a.group, a.kind]));
  return (groups ?? [])
    .filter(Boolean)
    .map((group) => {
      const kind = byGroup.get(group);
      return { group, tag: kind ? TAG_FOR[kind] : "Untouched", bar: kind ? 1 : 0 } as SectionTouch;
    });
}

/**
 * What the panel says when it has nothing to show.
 *
 * `none` is the one that matters. Neither published guide has an accommodation tab, so "our
 * hotel is wrong" genuinely matches no group by name — and the request is still perfectly
 * sendable, because the editor reads the guide and this does not. The empty state has to say
 * that plainly instead of implying the request went nowhere.
 */
export const ADVISORY_EMPTY = {
  short: "Type a sentence or two and we'll show which tabs it would touch.",
  none: "Nothing matched a tab by name — that's fine, and the request still sends. The editor reads the whole guide and finds the right place.",
};

/**
 * Which empty-state line the panel shows, when it has no tabs to list.
 *
 * The choice is about honesty, not tone. `none` asserts two things — that the map was consulted
 * and that "the request still sends" — and BOTH are false below ADVISORY_MIN: nothing has been
 * evaluated, and the send button rejects the text at exactly the same floor. So the same
 * threshold that gates the advisory gates the sentence about it; anything shorter gets asked for
 * more words instead of being reassured about a verdict that was never reached.
 */
export function advisoryEmptyLine(text: string): string {
  return usable(text) ? ADVISORY_EMPTY.none : ADVISORY_EMPTY.short;
}

/** The legend sentence under the map, kept here so the three words match the tags exactly. */
export const TOUCH_LEGEND =
  "Redone means rewritten from fresh sources. Checked means read and probably left alone. Everything else is untouched.";
