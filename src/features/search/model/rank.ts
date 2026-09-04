/* Search ranking — traveler-facing, context-first (design-system.md D6-24,
   docs/reference/search-ui-final.md). One query, one deterministic order:

     1. records from the CURRENT trip before every other guide's;
     2. within a tier, a title hit before a body hit;
     3. then the guide's own section order (stable — no popularity, no recency, no model).

   Results are grouped by the traveler-facing object type the record carries (Places,
   Itinerary, Guide, Other trips), never by implementation vocabulary. */

import type { SearchRecord, SearchKind } from "./search-index";

export type SearchGroupKey = "places" | "itinerary" | "guide" | "other";

export interface SearchGroup {
  key: SearchGroupKey;
  label: string;
  items: SearchRecord[];
}

export const MIN_CHARS = 2;
export const CAP_PER_GROUP = 12;

const GROUP_OF: Record<SearchKind, SearchGroupKey> = {
  place: "places",
  venue: "places",
  day: "itinerary",
  stop: "itinerary",
  section: "guide",
  module: "guide",
};

const LABEL: Record<SearchGroupKey, string> = {
  places: "Places",
  itinerary: "Itinerary",
  guide: "Guide",
  other: "Other trips",
};

export function normalizeQuery(raw: string): string {
  return String(raw || "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Query words: split on anything that is not a letter, digit or CJK character, so a pasted
    "Gyeongbokgung-Palace-Reservation-2026" still finds Gyeongbokgung Palace. */
export function queryTokens(q: string): string[] {
  return q.split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 1);
}

/* Score a record against the phrase and its tokens. -1 = no hit. Higher is better:
   exact/prefix/substring phrase hits on the title outrank token hits, and a token hit in
   the title outranks the same token in the body. `strict` requires every token to appear
   somewhere in the record; the caller relaxes it when nothing satisfies the whole query. */
function score(r: SearchRecord, q: string, tokens: string[], strict: boolean): number {
  const title = r.title.toLowerCase();
  if (title === q) return 100;
  if (title.startsWith(q)) return 90;
  if (title.includes(q)) return 80;
  if (r.hay.includes(q)) return 70;
  if (!tokens.length) return -1;
  let inTitle = 0, inHay = 0;
  for (const t of tokens) {
    if (title.includes(t)) inTitle++;
    else if (r.hay.includes(t)) inHay++;
  }
  const found = inTitle + inHay;
  if (found === 0 || (strict && found < tokens.length)) return -1;
  return inTitle * 4 + inHay;
}

/**
 * Rank and group. `currentSlug` is the trip the traveler is standing in (null from Atlas):
 * its records lead, and every other guide's matches collapse into "Other trips" so the
 * current-trip groups stay legible instead of mixing two guides' places in one list.
 */
export function rankSearch(records: readonly SearchRecord[], rawQuery: string, currentSlug: string | null): SearchGroup[] {
  const q = normalizeQuery(rawQuery);
  if (q.length < MIN_CHARS) return [];
  const tokens = queryTokens(q);
  let scored = records.map((r, i) => ({ r, i, s: score(r, q, tokens, true) })).filter((h) => h.s >= 0);
  if (!scored.length && tokens.length > 1) scored = records.map((r, i) => ({ r, i, s: score(r, q, tokens, false) })).filter((h) => h.s >= 0);
  const hits = scored
    .sort((a, b) => {
      const aCur = a.r.slug === currentSlug ? 0 : 1;
      const bCur = b.r.slug === currentSlug ? 0 : 1;
      if (aCur !== bCur) return aCur - bCur;
      if (a.s !== b.s) return b.s - a.s;
      return a.i - b.i;
    });
  const buckets = new Map<SearchGroupKey, SearchRecord[]>();
  for (const { r } of hits) {
    const key: SearchGroupKey = currentSlug && r.slug !== currentSlug ? "other" : GROUP_OF[r.kind];
    const list = buckets.get(key) ?? [];
    if (list.length >= CAP_PER_GROUP) continue;
    list.push(r);
    buckets.set(key, list);
  }
  const order: SearchGroupKey[] = ["places", "itinerary", "guide", "other"];
  return order
    .filter((k) => buckets.has(k))
    .map((k) => ({ key: k, label: LABEL[k], items: buckets.get(k)! }));
}
