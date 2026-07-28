// Section-anchor derivations (R5, docs/PLAN_VISUAL_REDESIGN.md Move C) — the pure data
// behind the figures that open Days / Transit / checklist sections. The rule that governs
// every function here: a figure is DERIVED from the guide's own researched content, never
// drawn or worded by hand. Where the data can't support a figure honestly (one waypoint,
// missing coordinates, no route leads), the answer is null/[] and the section simply opens
// without one — an honest blank, not a guessed picture.

export interface TimelineStop {
  /** Raw date string as authored ("Wed Jul 8") — the client matches today against it. */
  date: string;
  /** Compact under-line label: "Jul 8" on the first stop and on month changes, else "9". */
  dateShort: string;
  /** Above-line word for first/last stops only: the day's own title, clamped. Null elsewhere. */
  word: string | null;
}

/** Clamp a phrase at a word boundary. Exported for reuse by figure renderers. */
export function clampWord(s: string, max: number): string {
  const t = s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max + 1);
  const atWord = cut.slice(0, cut.lastIndexOf(" "));
  return (atWord.length >= 3 ? atWord : t.slice(0, max)).replace(/[,;:—–-]$/, "") + "…";
}

/** The Days timeline: one stop per day entry. Labels come from the data alone —
 *  dates from `date`, the two above-line words from the first and last days' own titles. */
export function dayTimelineStops(days: { date?: string; title?: string }[]): TimelineStop[] {
  if (!Array.isArray(days) || days.length < 2) return []; // one dot is not a shape
  let lastMonth = "";
  return days.map((d, i) => {
    const parts = String(d.date || "").trim().split(/\s+/); // "Wed Jul 8" → [Wed, Jul, 8]
    const month = parts.length >= 3 ? parts[1] : "";
    const dayNum = parts.length >= 3 ? parts[2] : parts[parts.length - 1] || "·";
    const showMonth = month && month !== lastMonth;
    if (month) lastMonth = month;
    const isEdge = i === 0 || i === days.length - 1;
    return {
      date: String(d.date || ""),
      dateShort: showMonth ? `${month} ${dayNum}` : dayNum,
      word: isEdge && d.title ? clampWord(d.title, 16) : null,
    };
  });
}

/** One day's route-leg summary: "first stop → last stop · N km". Distance is summed
 *  ONLY when every consecutive waypoint pair carries verified coordinates — a partial
 *  sum would understate the day and read as a fact, so any gap yields km: null and the
 *  header shows names alone. Fewer than two waypoints → no leg line at all. */
export interface DayLeg { from: string; to: string; km: number | null }

export function dayLegSummary(
  waypoints: { name?: string; lat?: number; lng?: number }[] | undefined,
): DayLeg | null {
  if (!Array.isArray(waypoints) || waypoints.length < 2) return null;
  const from = String(waypoints[0].name || "").trim();
  const to = String(waypoints[waypoints.length - 1].name || "").trim();
  if (!from || !to) return null;
  let km = 0;
  let complete = true;
  for (let i = 1; i < waypoints.length; i++) {
    const a = waypoints[i - 1];
    const b = waypoints[i];
    if ([a.lat, a.lng, b.lat, b.lng].every((n) => Number.isFinite(n))) {
      km += haversineKm(a.lat!, a.lng!, b.lat!, b.lng!);
    } else {
      complete = false;
      break;
    }
  }
  return { from, to, km: complete ? Math.round(km * 10) / 10 : null };
}

/** Great-circle distance (km). Standard haversine on a mean-radius sphere — plenty for
 *  a day-leg header (walking distances are approximate by nature and rendered with ≈). */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** The Transit journey-line: one station per route step, labelled by the step's own
 *  bold lead (the lead-first content standard every routes step already follows:
 *  "<b>Incheon → Jongno base — Airport Limousine Bus 6002:</b> …"). The label is the
 *  lead cut at its first em-dash/colon — the route's identity, before its detail.
 *  Steps without a bold lead are skipped; fewer than two stations → no figure. */
export function routeLegLabels(steps: string[] | undefined): string[] {
  if (!Array.isArray(steps)) return [];
  const labels: string[] = [];
  for (const step of steps) {
    const m = String(step || "").match(/<b>(.*?)<\/b>/i);
    if (!m) continue;
    const plain = m[1]
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ");
    const cut = plain.split(/\s+—\s+|:\s*$|:\s+/)[0].trim();
    if (cut) labels.push(clampWord(cut, 30));
  }
  return labels.length >= 2 ? labels : [];
}
