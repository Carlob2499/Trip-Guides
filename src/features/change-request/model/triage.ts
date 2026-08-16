/* The owner's triage queue — pure decision layer. No DOM, no network.
   Turns the two populations of open issues into cards a person can decide about, and turns a
   decision into the payload one of the Worker's existing endpoints already accepts.

   TWO KINDS, and the difference is not cosmetic:

   · `request` — an open `modify-request` issue. Somebody asked. change.yml auto-runs one of these
     ONLY when the issue's author is the owner or a collaborator, so the ones still sitting here
     are exactly the ones waiting on a decision. Starting it POSTs /change, which files the same
     request under the owner's authorship — and that is where the weight rides, as a line of TEXT
     in the request body. The weight is a SUGGESTION: `pipeline plan` decides the real scope, so
     the button may not name it (PLAN_PIPELINE_SURFACES Reconciliation 1).

   · `proposal` — a feedback-derived revision proposal (../../pipeline-progress's model/proposals).
     Nobody asked; the divergence signals tripped. Starting it POSTs /approve, whose payload is
     `{slug, issue}` and carries no text — so there is nowhere for a weight hint to ride and no
     second button that would do anything different. One button, and the card says why.

   Nothing here invents a field. A request whose issue names no guide gets no slug and no start
   button, because the endpoint that would start it needs one. */

import { CHANGE_MAX, MODIFY_FIELDS } from "../../../lib/modify-schema.mjs";
import { labelFor } from "../../../lib/issue-forms.mjs";
import { affectedGroups, deriveWeight, matchedCategories } from "./advisory";
import type { AdvisoryCategory, Weight } from "./advisory";

/** Which population a card came from. It decides the endpoint, the copy and the button count. */
export type TriageKind = "request" | "proposal";

/** What the owner chose. Both are suggestions; only `request` cards can carry one. */
export type TriageChoice = "quick" | "full";

export interface TriageCard {
  /** Unique across both kinds — two populations can share an issue number space. */
  key: string;
  kind: TriageKind;
  /** The issue this card is about. /approve needs it; /change references it in the body. */
  issue: number;
  /** The guide, or "" when the issue names none — in which case the card cannot be started. */
  slug: string;
  /** The guide's own title when the slug resolves, else the raw slug, else "". */
  guide: string;
  /** The card's headline. */
  title: string;
  /** Where it came from and when, already phrased. */
  who: string;
  /** The requester's words, exactly as filed. */
  body: string;
  /** The section hint from the issue form, or "". */
  section: string;
  /** The topic chip, or null when nothing matched — a wrong chip is worse than none. */
  category: AdvisoryCategory | null;
  /** How big the job looks, from the guide's OWN tabs. "—" when nothing matched. */
  weight: Weight;
  /** ISO timestamp, used for ordering and for the relative "when". */
  createdAt: string;
}

/** A guide as the page knows it at build time: its slug, its title and its real tab groups. */
export interface TriageGuide {
  slug: string;
  title: string;
  groups: string[];
}

/** The raw issue shape this reads — a subset of GitHub's, named so the parser's input is a
    contract rather than "whatever the API returned". Mirrors pipeline-progress's RawIssue. */
export interface RawTriageIssue {
  number?: number;
  title?: string;
  body?: string | null;
  created_at?: string;
  pull_request?: unknown;
}

/** Pull an issue-form field's value out of a rendered body. Same convention (and the same reason
    for being local rather than imported) as pipeline-progress's model/proposals.ts: the node-side
    parser pulls zod, and this runs in the browser. Labels come from MODIFY_FIELDS, never typed
    here, so a renamed field cannot drift this into silently finding nothing. */
function issueField(body: string, label: string): string {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = String(body || "").match(new RegExp(`###\\s+${esc}\\s*\\n+([\\s\\S]*?)(?=\\n###\\s|$)`));
  const v = m ? m[1].trim() : "";
  return v === "_No response_" || v === "_No response_." ? "" : v;
}

/**
 * Undo the field-marker escaping the filing side applied.
 *
 * `sanitizeChange` writes a literal "###" as "\#\#\#" so no run of hashes can forge a field
 * header for the parser. GitHub renders that back as "###" for a human reader, so a surface that
 * prints the raw body must too — otherwise the card shows backslashes the requester never typed,
 * and "the requester's words verbatim" stops being true.
 */
export function unescapeFieldMarkers(text: string): string {
  return String(text ?? "").replace(/(?:\\#){2,}/g, (run) => run.replace(/\\/g, ""));
}

/**
 * The card's headline.
 *
 * An issue still carrying its template's canonical title says nothing the guide's name doesn't
 * already say, and "Modify: south-korea" is a filename, not a headline. A title somebody actually
 * WROTE is theirs and is shown as written.
 */
export function headline(rawTitle: string, slug: string, guideTitle: string): string {
  const stripped = String(rawTitle ?? "")
    .replace(/^\s*(?:modify|revise)\s*:\s*/i, "")
    .replace(/\(feedback-driven\)\s*$/i, "")
    .trim();
  const want = String(slug ?? "").trim().toLowerCase();
  if (!stripped || (want && stripped.toLowerCase() === want)) {
    return guideTitle || slug || "Change request";
  }
  return stripped;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * How long ago, in the words the design uses. Coarse on purpose: this is a queue, and "2 hours
 * ago" is the only precision a decision needs.
 *
 * An unparseable or future timestamp returns "" rather than a guess — the caller drops the clause
 * instead of printing "in -3 days".
 */
export function relativeWhen(iso: string, now: Date = new Date()): string {
  const then = Date.parse(String(iso ?? ""));
  if (!Number.isFinite(then)) return "";
  const ms = now.getTime() - then;
  if (ms < 0) return "";
  if (ms < MINUTE_MS) return "just now";
  if (ms < HOUR_MS) {
    const n = Math.floor(ms / MINUTE_MS);
    return `${n} minute${n === 1 ? "" : "s"} ago`;
  }
  if (ms < DAY_MS) {
    const n = Math.floor(ms / HOUR_MS);
    return `${n} hour${n === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(ms / DAY_MS);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

/** The provenance line under the title. Neither claims WHO filed it: a request that came through
    the site's own form is filed by the Worker under the repo's token, so "asked by the traveller"
    would be false for exactly the requests the owner files themselves. */
const WHO_PREFIX: Record<TriageKind, string> = {
  request: "Asked through the change form",
  proposal: "Raised automatically from trip feedback",
};

export function whoLine(kind: TriageKind, createdAt: string, now?: Date): string {
  const when = relativeWhen(createdAt, now);
  return when ? `${WHO_PREFIX[kind]} · ${when}` : WHO_PREFIX[kind];
}

/** The suggestion under the buttons. "—" is not dressed up: the keyword map matched no tab by
    name, so there is no suggestion to make and the card says so. */
export function suggestionLine(weight: Weight): string {
  if (weight === "Bigger job") return "Suggested: full re-check";
  if (weight === "Quick fix") return "Suggested: quick fix";
  return "No suggestion — nothing in the request matched a tab by name.";
}

/** The stamp on a card nobody has acted on yet. */
export const WAITING_STAMP = "Waiting on you";

/** The stamp once a decision has been sent from this browser. */
export const STARTED_STAMP: Record<TriageChoice, string> = {
  quick: "Quick fix — started",
  full: "Full re-check — started",
};

/**
 * What the card says after a decision lands — and the two kinds genuinely differ, so they say
 * different things.
 *
 * `request`: /change files the request AGAIN under the owner's authorship, which is what makes it
 * auto-run. The original stays open, because nothing in the Worker closes an issue and the run
 * that lands will close the copy, not the original. Saying so is the difference between a queue
 * that looks broken tomorrow and one that explained itself today.
 *
 * `proposal`: /approve dispatches change.yml against the proposal's OWN issue number, and a
 * merged change closes it (`pipeline report --issue`). This one really does clear itself.
 */
export const STARTED_NOTE: Record<TriageKind, string> = {
  request: "Started. The original request stays open — close it yourself once you're happy.",
  proposal: "Started. This proposal closes itself when the change lands.",
};

/** The line a feedback card carries INSTEAD of a suggestion, because it has one button and the
    plan requires it to state plainly that nothing happens until the owner decides. */
export const PROPOSAL_NOTE = "Filed and inert — nothing runs until you start it here.";

/** The card for a request that names no guide. The start buttons need a slug; without one they
    would be buttons that can only fail. */
export const NO_SLUG_NOTE = "No guide named in this request, so it can't be started from here.";

/**
 * The dispatch bar's line.
 *
 * NOT the design's "follow them on the Progress page": a change run works on `change/<slug>`, and
 * /progress/ reads `research/<slug>` then `main` (gateway.fetchState) — the run it would send the
 * owner to watch is not one the page can see. Claiming otherwise is the surface lying about its
 * own plumbing, which outranks copy fidelity.
 */
export const DISPATCH_IDLE = "Nothing has started yet.";

export function dispatchNote(started: number): string {
  const n = Math.max(0, Math.floor(started || 0));
  if (n === 0) return DISPATCH_IDLE;
  if (n === 1) return "1 under way. It runs on its own from here.";
  return `${n} under way. They run on their own from here.`;
}

/** The count above the grid. */
export function queueCountLine(waiting: number): string {
  const n = Math.max(0, Math.floor(waiting || 0));
  return `${n} still to decide`;
}

/** What the page says when both populations come back empty. An honest blank, not a placeholder:
    the queue really is clear. */
export const QUEUE_EMPTY = "Nothing is waiting. Change requests and feedback proposals land here as they are filed.";

/** …and what it says when the read FAILED. Never the line above: "nothing is waiting" on the back
    of a request that never answered is the page clearing an inbox it could not see. */
export const QUEUE_UNREAD = "Couldn't read the queue just now. Reload to try again — this says nothing about whether anything is waiting.";

/** What the page says when it has no key to read with. */
export const QUEUE_LOCKED =
  "This is the maker's queue. It needs the owner key stored in this browser — the progress page's key panel is where it goes.";

/** …and what a button says when the code that would have sent it never downloaded. It reports a
    non-event, so it must not read like a refusal from the other end: nothing was sent, and nothing
    happened. */
export const LOAD_FAILED = "Couldn't load that just now. Reload and try again — nothing was sent.";

/* ── Issues → cards ──────────────────────────────────────────────────────────────────────── */

const SLUG_LABEL = labelFor(MODIFY_FIELDS, "slug");
const CHANGE_LABEL = labelFor(MODIFY_FIELDS, "change");
const SECTION_LABEL = labelFor(MODIFY_FIELDS, "section");

function guideFor(guides: TriageGuide[], slug: string): TriageGuide | null {
  const want = String(slug ?? "").trim().toLowerCase();
  if (!want) return null;
  return guides.find((g) => String(g.slug).toLowerCase() === want) ?? null;
}

/** Category and weight, both derived from the requester's own text against the guide's own tabs.
    A guide the page doesn't know has no tabs to match, so its weight is honestly "—". */
function readingOf(text: string, guide: TriageGuide | null) {
  const affected = affectedGroups(text, guide?.groups ?? []);
  return {
    category: matchedCategories(text)[0] ?? null,
    weight: deriveWeight(affected),
  };
}

/**
 * Open `modify-request` issues → request cards, newest first.
 *
 * Pull requests share the issues endpoint and are dropped: a PR carrying the label is not a
 * request to triage. An issue whose body carries no change text is dropped too — a card with no
 * words on it is a row, and the whole point is the requester's words.
 */
export function toRequestCards(
  issues: RawTriageIssue[] | null | undefined,
  guides: TriageGuide[],
): TriageCard[] {
  return (issues ?? [])
    .filter((i) => i && !i.pull_request && Number.isInteger(i.number))
    .map((i) => {
      const body = String(i.body || "");
      const slug = issueField(body, SLUG_LABEL).trim().toLowerCase();
      const guide = guideFor(guides, slug);
      const change = unescapeFieldMarkers(issueField(body, CHANGE_LABEL));
      const reading = readingOf(change, guide);
      return {
        key: `request-${i.number}`,
        kind: "request" as const,
        issue: i.number as number,
        slug,
        guide: guide?.title || slug,
        title: headline(String(i.title || ""), slug, guide?.title || ""),
        who: whoLine("request", String(i.created_at || "")),
        body: change,
        section: issueField(body, SECTION_LABEL),
        category: reading.category,
        weight: reading.weight,
        createdAt: String(i.created_at || ""),
      };
    })
    .filter((c) => c.body.length > 0)
    .sort(byNewest);
}

/** The shape pipeline-progress's `toProposals` returns. Declared structurally rather than
    imported as a type so this module stays readable on its own; the gateway is what binds them. */
export interface ProposalLike {
  issue: number;
  title: string;
  reason: string;
  createdAt: string;
}

/**
 * Revision proposals → proposal cards. The proposals arrive already slug-filtered (they are
 * fetched per guide), so the slug is handed in rather than parsed back out.
 */
export function toProposalCards(
  proposals: ProposalLike[] | null | undefined,
  slug: string,
  guides: TriageGuide[],
): TriageCard[] {
  const guide = guideFor(guides, slug);
  return (proposals ?? [])
    .filter((p) => p && Number.isInteger(p.issue))
    .map((p) => {
      const reason = unescapeFieldMarkers(String(p.reason || ""));
      const reading = readingOf(reason, guide);
      return {
        key: `proposal-${p.issue}`,
        kind: "proposal" as const,
        issue: p.issue,
        slug: String(slug || "").toLowerCase(),
        guide: guide?.title || slug,
        title: headline(String(p.title || ""), slug, guide?.title || ""),
        who: whoLine("proposal", String(p.createdAt || "")),
        body: reason,
        section: "",
        category: reading.category,
        weight: reading.weight,
        createdAt: String(p.createdAt || ""),
      };
    })
    .sort(byNewest);
}

function byNewest(a: TriageCard, b: TriageCard): number {
  return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
}

/** Both populations in one queue, newest first, with duplicate keys dropped. */
export function mergeQueue(...lists: (TriageCard[] | null | undefined)[]): TriageCard[] {
  const seen = new Set<string>();
  const out: TriageCard[] = [];
  for (const list of lists) {
    for (const card of list ?? []) {
      if (!card || seen.has(card.key)) continue;
      seen.add(card.key);
      out.push(card);
    }
  }
  return out.sort(byNewest);
}

/* ── Decision → payload ──────────────────────────────────────────────────────────────────── */

/**
 * The weight, as a sentence for the request body.
 *
 * It is phrased as a SUGGESTION on purpose. `pipeline plan` reads the guide and decides the real
 * scope; a line that read "do a quick fix" would be an instruction the pipeline is free to ignore,
 * and a surface whose button silently loses its meaning is worse than one that never claimed it.
 */
export const SUGGESTION_NOTE: Record<TriageChoice, string> = {
  quick: "Triaged as a quick fix — the maker's suggestion after reading it, not a scope decision.",
  full: "Triaged as a full re-check — the maker's suggestion after reading it, not a scope decision.",
};

export interface ChangePayload {
  slug: string;
  section: string;
  change: string;
}

/**
 * A request card + a choice → the POST /change body.
 *
 * The requester's words go first and unaltered; the suggestion and the back-reference are
 * appended. The body is trimmed to leave room for that trailer rather than letting the Worker
 * truncate the tail off — losing the suggestion is exactly the part that must survive.
 */
export function buildTriagePayload(card: TriageCard, choice: TriageChoice): ChangePayload {
  const trail = `\n\n${SUGGESTION_NOTE[choice]}\nTriaged from request #${card.issue}.`;
  const room = Math.max(0, CHANGE_MAX - trail.length);
  const body = card.body.length > room ? card.body.slice(0, room).trimEnd() : card.body;
  return { slug: card.slug, section: card.section, change: body + trail };
}
