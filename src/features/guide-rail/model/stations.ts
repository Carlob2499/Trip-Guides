/* The station list — the spine rail's single source of truth.

   R5 replaced the tab-pill rail with a SPINE: one horizontal line, every section group a stop
   on it, and the reader's position marked. The change that matters is not visual. A pill rail
   says "these are categories"; a spine says "this is one journey and you are here", and that
   claim is only honest if the stops are the guide's own — so this module derives them from the
   guide and never from a list anyone maintains by hand.

   Two stations are not groups and are appended here rather than authored into any guide:
     · Field log — the post-trip record, drawn only when the guide HAS one. An empty Field log
       is a promise the guide cannot keep, so its absence is absence, not an empty station.
     · Tools     — always last, always present. Its one entry point is this station.

   Korea produces 13 (11 groups + both), Sedona 9 (8 groups + Tools alone). Neither number is
   written down anywhere; both fall out of the guide. */

import type { TravelerDestinationName } from "./destinations";

/** What a station IS, which decides how it renders and where its content comes from. */
export type StationKind = "group" | "sources" | "recap" | "tools";

export interface Station {
  /** Stable id for the DOM, the URL's `group` param and localStorage keys. */
  key: string;
  /* The full, unmodified name. It is BOTH the visible label and the accessible name, and the
     rail deliberately does not shorten it: COMPONENTS.md §2 gives a station label two lines to
     wrap into, and the pill row scrolls, so neither surface is short of room. The one place a
     name is abbreviated is the thumb bar, whose four fixed slots genuinely cannot hold
     "Etiquette & language" — and that abbreviation lives in mobile-nav's own slotLabel(), where
     the rule "only if the stub stays readable" is already written and tested. A second,
     dumber shortener here would quietly override it. */
  full: string;
  kind: StationKind;
  /** Secondary destinations remain routable but never paint in primary navigation. */
  primary: boolean;
  /** Position in the rail, 0-based. The progress line reads this. */
  index: number;
}

export interface StationInput {
  /** Canonical traveler destinations, already projected into their fixed order. */
  groups: string[];
  /** True when authored evidence sections need a secondary route. */
  hasSources?: boolean;
  /** True only when `_guide.json` carries a `learnings` record. */
  hasLearnings: boolean;
}

/** The two appended stations' labels, named once so nothing restates them as literals. */
export const SOURCES_LABEL = "Sources & verification";
export const RECAP_LABEL = "Recap";
export const TOOLS_LABEL = "Trip utilities";

/* A group name becomes a DOM id and a URL parameter, so it needs an ASCII-safe key — but the
   LABEL must not be touched. "Pokémon GO" and "Food & shopping" render with their accent and
   their ampersand intact; only the key is slugged. Index is appended because two different
   names can slug identically (an all-punctuation name slugs to ""), and a collision would make
   two stations share one panel. */
function groupKey(name: string): string {
  const key = name.toLowerCase();
  if (key === "days" || key === "food" || key === "explore" || key === "essentials") return key;
  throw new Error(`Unknown traveler destination: ${name}`);
}

/**
 * Build the rail. Order is the guide's own, then Field log if the guide has one, then Tools.
 */
export function buildStations({ groups, hasSources = false, hasLearnings }: StationInput): Station[] {
  const stations: Station[] = groups.map((full, i) => ({
    key: groupKey(full),
    full,
    kind: "group" as const,
    primary: true,
    index: i,
  }));

  if (hasSources) {
    stations.push({
      key: "sources",
      full: SOURCES_LABEL,
      kind: "sources",
      primary: false,
      index: stations.length,
    });
  }

  if (hasLearnings) {
    stations.push({
      key: "recap",
      full: RECAP_LABEL,
      kind: "recap",
      primary: false,
      index: stations.length,
    });
  }

  stations.push({
    key: "tools",
    full: TOOLS_LABEL,
    kind: "tools",
    primary: false,
    index: stations.length,
  });

  return stations;
}

/** Traveler-first routing keeps primary destinations distinct from secondary evidence/utility routes. */
export type TravelerStationKind = "group" | "sources" | "recap" | "tools";

export interface TravelerStation {
  key: "days" | "food" | "explore" | "essentials" | "sources" | "recap" | "tools";
  full: TravelerDestinationName | "Sources & verification" | "Recap" | "Trip utilities";
  kind: TravelerStationKind;
  primary: boolean;
  index: number;
}

export interface TravelerStationInput {
  /** Canonical destinations produced by projectTravelerDestinations(), in their projected order. */
  groups: TravelerDestinationName[];
  /** True only when authored evidence sections exist. */
  hasSources: boolean;
  /** True only when the guide carries a learnings record. */
  hasLearnings: boolean;
}

export const SOURCES_LABEL = "Sources & verification";
export const RECAP_LABEL = "Recap";
export const TRIP_UTILITIES_LABEL = "Trip utilities";

/**
 * Build the traveler-first route list without changing the legacy rail yet.
 * Primary destinations paint in navigation; secondary routes remain reachable but do not
 * compete with the traveler's main hierarchy. This contract is intentionally separate from
 * buildStations() until GuideLayout migrates atomically.
 */
export function buildTravelerStations({ groups, hasSources, hasLearnings }: TravelerStationInput): TravelerStation[] {
  const stations: TravelerStation[] = groups.map((full, index) => ({
    key: full.toLowerCase() as TravelerStation["key"],
    full,
    kind: "group",
    primary: true,
    index,
  }));

  if (hasSources) {
    stations.push({
      key: "sources",
      full: SOURCES_LABEL,
      kind: "sources",
      primary: false,
      index: stations.length,
    });
  }

  if (hasLearnings) {
    stations.push({
      key: "recap",
      full: RECAP_LABEL,
      kind: "recap",
      primary: false,
      index: stations.length,
    });
  }

  stations.push({
    key: "tools",
    full: TRIP_UTILITIES_LABEL,
    kind: "tools",
    primary: false,
    index: stations.length,
  });

  return stations;
}

export interface Geometry {
  /** Percent from the rail's left edge. */
  left: number;
  /** Percent of the rail's width — one station's share of it. */
  width: number;
}

/**
 * Where the phone's progress-line fill sits, as percentages of the pill row's width.
 *
 * The width is `100 / stationCount` and is never a constant: Korea's fill is 7.69% wide and
 * Sedona's 11.1%, because they are different journeys of different lengths. A shared constant
 * would draw a progress line that lies about one of them.
 */
export function progressGeometry(index: number, count: number): Geometry {
  // A count of 0 or 1 is not a real rail, but it must not produce Infinity or NaN in a style
  // attribute — a malformed `width` silently drops the declaration and the fill vanishes, which
  // reads as "no progress" rather than as the bug it is. One station owns the whole line.
  if (count <= 1) return { left: 0, width: 100 };
  const share = 100 / count;
  const clamped = Math.min(Math.max(index, 0), count - 1);
  return { left: clamped * share, width: share };
}
