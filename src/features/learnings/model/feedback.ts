/* Pure model for Trip Learnings feedback — no DOM, no Firebase, fully unit-testable.
   · buildFeedbackRecord() shapes + sanitizes ONE survey submission before it is written
     to Firebase (clamps ratings, drops empty skips, caps text, rejects wholly-empty input).
   · aggregateVisited() rolls MANY submissions into the objective visited/skipped aggregate
     the Learnings tab (P2) renders live.
   `freeform` is carried through storage but is NEVER surfaced by the aggregate or any UI —
   it is the private, candid channel, summarized into learnings/<slug>.md rather than shown
   (see "The Learnings Loop" in CLAUDE.md). */

export interface Ratings {
  overall?: number;
  pacing?: number;
  food?: number;
}
export interface Skip {
  stop: string;
  reason: string;
}
export interface FeedbackInput {
  ratings?: Ratings;
  visited?: Record<string, unknown>;
  skips?: Array<{ stop?: string; reason?: string } | null | undefined>;
  freeform?: string;
  day?: string;
}
export interface FeedbackRecord {
  ratings: Ratings;
  visited: Record<string, boolean>;
  skips: Skip[];
  freeform: string;
  day?: string;
}

const FREEFORM_MAX = 2000;
const REASON_MAX = 300;
const RATING_KEYS: (keyof Ratings)[] = ["overall", "pacing", "food"];

// A rating is a whole star 1..5. Round to nearest int; anything below 1 (0, blank,
// NaN) means "not answered" → omitted so partial submissions are allowed.
function clampRating(v: unknown): number | undefined {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < 1) return undefined;
  return n > 5 ? 5 : n;
}

export function buildFeedbackRecord(input: FeedbackInput): FeedbackRecord | null {
  const src = (input && input.ratings) || {};
  const ratings: Ratings = {};
  for (const k of RATING_KEYS) {
    const c = clampRating(src[k]);
    if (c !== undefined) ratings[k] = c;
  }

  const visited: Record<string, boolean> = {};
  const vsrc = (input && input.visited) || {};
  for (const k of Object.keys(vsrc)) visited[k] = !!vsrc[k];

  const skips: Skip[] = [];
  for (const s of (input && input.skips) || []) {
    const stop = String((s && s.stop) || "").trim();
    if (!stop) continue; // a skip with no stop label is noise
    skips.push({ stop, reason: String((s && s.reason) || "").trim().slice(0, REASON_MAX) });
  }

  const freeform = String((input && input.freeform) || "").trim().slice(0, FREEFORM_MAX);

  const empty =
    Object.keys(ratings).length === 0 &&
    Object.keys(visited).length === 0 &&
    skips.length === 0 &&
    freeform.length === 0;
  if (empty) return null; // nothing to log — caller refuses the submit

  const rec: FeedbackRecord = { ratings, visited, skips, freeform };
  const day = String((input && input.day) || "").trim();
  if (day) rec.day = day;
  return rec;
}

export interface VisitedAggregate {
  done: number;
  total: number;
  skipped: Skip[];
}

// Merge every submission's visited map (later record wins per stop, so the freshest
// check-off state carries) and union the skip reasons (latest reason per stop).
export function aggregateVisited(records: Array<Partial<FeedbackRecord> | null | undefined>): VisitedAggregate {
  const merged: Record<string, boolean> = {};
  const skipMap: Record<string, string> = {};
  for (const r of records || []) {
    if (!r) continue;
    const v = r.visited || {};
    for (const k of Object.keys(v)) merged[k] = !!v[k];
    for (const s of r.skips || []) {
      if (s && s.stop) skipMap[s.stop] = s.reason || "";
    }
  }
  const keys = Object.keys(merged);
  const done = keys.reduce((n, k) => n + (merged[k] ? 1 : 0), 0);
  const skipped = Object.keys(skipMap).map((stop) => ({ stop, reason: skipMap[stop] }));
  return { done, total: keys.length, skipped };
}

export interface GroupSkipTally {
  group: string;
  count: number;
}

/**
 * Roll a curated post-mortem's skipped stops up by their DECLARED `group` — "what didn't
 * survive contact with the trip", per tab group, highest first.
 *
 * Counts only. The `learnings` block records what was skipped, never what was planned, so
 * there is no honest denominator here: "Sights — 4 stops didn't happen" is supportable,
 * "4 of 6" is not. Stops with no declared group are excluded rather than bucketed into an
 * "other" pile, because an absent group means the maker judged it ambiguous — inventing a
 * home for it is exactly the guess the field exists to avoid.
 *
 * Takes `learnings.days`; returns [] for absent/empty/ungrouped input so the caller renders
 * nothing rather than an empty heading (the loop's honest-blank rule).
 */
export function tallySkipsByGroup(
  days: Array<{ skipped?: Array<{ stop?: string; group?: string } | null | undefined> } | null | undefined> | null | undefined,
): GroupSkipTally[] {
  const counts: Record<string, number> = {};
  for (const d of days || []) {
    for (const s of d?.skipped || []) {
      if (!s || !s.group) continue;
      counts[s.group] = (counts[s.group] || 0) + 1;
    }
  }
  return Object.keys(counts)
    .map((group) => ({ group, count: counts[group] }))
    // Ties broken by group name so the render is deterministic — an unstable order would
    // make the visual-regression baselines flap for no reason.
    .sort((a, b) => b.count - a.count || a.group.localeCompare(b.group));
}
