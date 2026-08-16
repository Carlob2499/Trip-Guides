/**
 * The live-telemetry schema for a research run: what it fetched, what it decided, and what it
 * found worth telling the traveller. Pure parsing and formatting only — the gateway does the
 * reading, ui/ does the rendering.
 *
 * THE PIPELINE DOES NOT EMIT ANY OF THIS YET. That is the whole point of the file existing
 * ahead of the emitter: the cockpit's sourcing / judgments / "worth knowing" panels ship as
 * honest empties (`available: false`) with the copy that says so, and the day
 * scripts/pipeline.mjs starts writing `guides-intake/<slug>/events.json` in this shape, they
 * populate with no UI change. The alternative — a demo feed, or panels that "look alive" — is
 * the page lying about a run, which docs/reference/motion.md and CLAUDE.md both forbid outright.
 *
 * Every field is optional-tolerant on read: this parses a file written by a DIFFERENT process,
 * possibly a version ahead or behind, and a malformed row must degrade to "nothing to show"
 * rather than throw inside a poll tick.
 */

/** One outbound request the run made, as it appears in the sourcing panel. */
export interface FetchEvent {
  at: string;
  url: string;
  /** HTTP status. 0 means the request never completed (DNS, timeout, abort). */
  status: number;
}

/** One thing the run decided, kept, or threw away — the judgments log. */
export interface DecisionEvent {
  at: string;
  kind: "check" | "decision" | "reject";
  text: string;
}

/** Something the run learned that a traveller would actually want to know. */
export interface Nugget {
  at: string;
  text: string;
  /** Where it came from. Displayed; never a bare "our research". */
  source: string;
}

export interface RunCounters {
  pages: number;
  facts: number;
  kept: number;
  dropped: number;
}

export interface RunEvents {
  /** False whenever there is no telemetry to show — no file, no emitter, or an unreadable one.
   *  The UI must key its empty copy off THIS, never off `fetches.length === 0`, so "the run
   *  fetched nothing yet" and "this run reports nothing at all" stay distinguishable. */
  available: boolean;
  fetches: FetchEvent[];
  decisions: DecisionEvent[];
  nuggets: Nugget[];
  counters: RunCounters | null;
}

export const EMPTY_RUN_EVENTS: RunEvents = {
  available: false,
  fetches: [],
  decisions: [],
  nuggets: [],
  counters: null,
};

/** How much history each live panel keeps. A run makes hundreds of requests; the panel is a
 *  window on the last few minutes, not a transcript, and an unbounded list is a memory leak on
 *  a page people leave open for an hour. */
export const FETCH_BUFFER = 24;
export const DECISION_BUFFER = 40;

const KINDS = new Set(["check", "decision", "reject"]);

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function int(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : null;
}

function lastOf<T>(list: T[], max: number): T[] {
  return list.length > max ? list.slice(list.length - max) : list;
}

/** Keep `item` on the end of `list`, dropping from the front past `max`. Returns a NEW array —
 *  the UI diff'ing against the previous one is what lets it append rather than rebuild. */
export function pushBounded<T>(list: readonly T[], item: T, max: number): T[] {
  const next = list.concat([item]);
  return lastOf(next, max);
}

function parseFetches(raw: unknown): FetchEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: FetchEvent[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const url = str(r.url);
    if (!url) continue;
    out.push({ at: str(r.at), url, status: int(r.status) ?? 0 });
  }
  return lastOf(out, FETCH_BUFFER);
}

function parseDecisions(raw: unknown): DecisionEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: DecisionEvent[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const text = str(r.text);
    if (!text) continue;
    const kind = str(r.kind);
    out.push({ at: str(r.at), kind: (KINDS.has(kind) ? kind : "check") as DecisionEvent["kind"], text });
  }
  return lastOf(out, DECISION_BUFFER);
}

function parseNuggets(raw: unknown): Nugget[] {
  if (!Array.isArray(raw)) return [];
  const out: Nugget[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const text = str(r.text);
    const source = str(r.source);
    // A nugget with no source is exactly the unverified assertion this project exists to not
    // publish, so it is dropped rather than shown unattributed.
    if (!text || !source) continue;
    out.push({ at: str(r.at), text, source });
  }
  return out;
}

function parseCounters(raw: unknown): RunCounters | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const pages = int(r.pages);
  const facts = int(r.facts);
  const kept = int(r.kept);
  const dropped = int(r.dropped);
  if (pages == null && facts == null && kept == null && dropped == null) return null;
  return { pages: pages ?? 0, facts: facts ?? 0, kept: kept ?? 0, dropped: dropped ?? 0 };
}

/**
 * Turn whatever the events file held into a RunEvents. Anything unparseable — including the
 * overwhelmingly common case of no file at all — comes back as EMPTY_RUN_EVENTS, so a caller
 * never has to distinguish "absent" from "broken" to stay honest about both.
 */
export function parseRunEvents(raw: unknown): RunEvents {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return EMPTY_RUN_EVENTS;
  const r = raw as Record<string, unknown>;
  const events: RunEvents = {
    available: true,
    fetches: parseFetches(r.fetches),
    decisions: parseDecisions(r.decisions),
    nuggets: parseNuggets(r.nuggets),
    counters: parseCounters(r.counters),
  };
  // A file that parsed but carried nothing recognisable is not telemetry; claiming otherwise
  // would light up four panels that then sit permanently blank.
  const anything =
    events.fetches.length || events.decisions.length || events.nuggets.length || events.counters;
  return anything ? events : EMPTY_RUN_EVENTS;
}

/** Which token paints a status code in the sourcing list. */
export type FetchTone = "green" | "muted" | "warn" | "crit";

export function fetchTone(status: number): FetchTone {
  if (status >= 200 && status < 300) return "green";
  if (status >= 300 && status < 400) return "muted"; // 304 Not Modified is the common one
  if (status >= 400 && status < 500) return "warn";
  return "crit"; // 5xx, and 0 for "never completed"
}

/** Host only, for the sourcing list's left column — the full URL is the title attribute. */
export function fetchHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0] || url;
  }
}
