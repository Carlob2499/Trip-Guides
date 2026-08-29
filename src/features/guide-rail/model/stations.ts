/* Primary traveler destinations plus the secondary routes retained for evidence, recap and
   utilities. All routes share one contiguous index space so existing deep links and the panel
   router keep one code path; `primary` decides what may paint in the visible rail. */

/** What a station IS, which decides how it renders and where its content comes from. */
export type StationKind = "group" | "sources" | "recap" | "tools";

export interface Station {
  /** Stable id for the DOM, the URL's `group` param and localStorage keys. */
  key: string;
  /** Full canonical or secondary label; only the thumb bar may abbreviate it. */
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

/** Secondary labels, named once so navigation surfaces cannot drift. */
export const SOURCES_LABEL = "Sources & verification";
export const RECAP_LABEL = "Recap";
export const TOOLS_LABEL = "Trip utilities";

function groupKey(name: string): string {
  const key = name.toLowerCase();
  if (key === "days" || key === "food" || key === "explore" || key === "essentials") return key;
  throw new Error(`Unknown traveler destination: ${name}`);
}

/** Build primary destinations first, followed by the available secondary routes. */
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
