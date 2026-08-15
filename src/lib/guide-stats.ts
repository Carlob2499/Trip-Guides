// Real, counted-not-invented numbers for the Overture hero's stats beat
// (docs/archive/INDEX.md → PLAN_VISUAL_OVERHAUL, session V2). CLAUDE.md's honesty rule applies
// to marketing copy as much as guide content: a hero that claims "121 verified facts" had
// better mean exactly that,
// recomputed from the guides themselves on every build — never a hand-typed number that goes
// stale the next time a guide is added or edited.
//
// "A verified fact" = any node in a guide's data carrying a `source_url` — the same field the
// waypoint-guide-author skill requires on every perishable claim (CLAUDE.md's Verified pillar).
// Walking the raw guide object (rather than a fixed list of known section shapes) means this
// stays correct as new section types are added — nothing to update here when they are.

export interface GuideStats {
  guideCount: number;
  verifiedFactCount: number;
  /** Distinct source hostnames across every guide — "121 primary sources", not 121 links to 3 sites. */
  sourceCount: number;
}

function hostnameOf(url: unknown): string | null {
  if (typeof url !== "string" || !url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null; // a malformed source_url is the content's problem, not this collector's
  }
}

function walk(node: unknown, hosts: Set<string>): number {
  if (Array.isArray(node)) {
    return node.reduce((sum, item) => sum + walk(item, hosts), 0);
  }
  if (node && typeof node === "object") {
    let count = 0;
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (key === "source_url" && value) {
        count += 1;
        const host = hostnameOf(value);
        if (host) hosts.add(host);
      } else {
        count += walk(value, hosts);
      }
    }
    return count;
  }
  return 0;
}

/** `guidesData` is an array of raw guide content objects — e.g. `(await getCollection("guides")).
 *  map(g => g.data)`. Deliberately untyped beyond `unknown`: this must survive both guide shapes
 *  (flat file, split directory) and schema evolution without needing updates here. */
export function computeGuideStats(guidesData: unknown[]): GuideStats {
  const hosts = new Set<string>();
  let verifiedFactCount = 0;
  for (const guide of guidesData) verifiedFactCount += walk(guide, hosts);
  return { guideCount: guidesData.length, verifiedFactCount, sourceCount: hosts.size };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function walkLatest(node: unknown, best: { v: string | null }): void {
  if (Array.isArray(node)) {
    for (const item of node) walkLatest(item, best);
    return;
  }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (key === "verified_on" && typeof value === "string" && ISO_DATE.test(value)) {
        // ISO-8601 dates sort correctly as plain strings — no Date parsing (and no timezone
        // shifting a date backwards a day) needed to find the most recent one.
        if (!best.v || value > best.v) best.v = value;
      } else {
        walkLatest(value, best);
      }
    }
  }
}

/** The most recent `verified_on` anywhere in the given guides, or null if none carry one.
 *  The guide-level `verified` field is free prose ("Checked 28 Jun 2026 for the…"), so it
 *  cannot be shown as a date; the per-fact provenance dates ARE machine-readable, and their
 *  maximum is a true statement — "nothing here was last confirmed later than this". Same
 *  shape-agnostic walk as computeGuideStats, for the same reason: it must survive both guide
 *  shapes and future schema growth without edits here. */
export function latestVerifiedOn(guidesData: unknown[]): string | null {
  const best: { v: string | null } = { v: null };
  for (const guide of guidesData) walkLatest(guide, best);
  return best.v;
}
