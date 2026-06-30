// Build-time public-holiday helper. Pure functions — no fetch, no client code.
// The raw holiday data is fetched by scripts/fetch-holidays.mjs into
// src/data/holidays/{CC}-{year}.json and read by GuideLayout via import.meta.glob;
// this module slices it around the trip dates for rendering.

export interface RawHoliday {
  date: string;        // ISO "YYYY-MM-DD"
  localName: string;
  name: string;
  global?: boolean;    // true = nationwide
  counties?: string[] | null;
}

export interface HolidayRow {
  date: string;        // ISO
  label: string;       // pretty date, e.g. "Fri Jul 17"
  name: string;
  localName: string;
  national: boolean;   // global === true
  rel?: string;        // relative position for near items, e.g. "2 days after you leave"
}

export interface HolidayInfo {
  tripLabel: string;       // "Jul 8–15"
  year: number;
  during: HolidayRow[];    // holidays that fall within the trip
  nearBefore: HolidayRow[];// within 3 days before arrival
  nearAfter: HolidayRow[]; // within 3 days after departure
}

const MONTHS: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const MON_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "Wed Jul 8" + year → UTC Date. Tolerant of weekday/comma noise; returns null if
// no month + day can be found.
export function parseGuideDate(s: string | null | undefined, year: number): Date | null {
  if (!s) return null;
  const parts = String(s).replace(/,/g, " ").split(/\s+/).filter(Boolean);
  let mo: number | null = null, day: number | null = null;
  for (const p of parts) {
    const key = p.slice(0, 3);
    if (mo === null && MONTHS[key] !== undefined) mo = MONTHS[key];
    else if (day === null && /^\d{1,2}$/.test(p)) day = parseInt(p, 10);
  }
  if (mo === null || day === null) return null;
  return new Date(Date.UTC(year, mo, day));
}

// Derive the trip year when a guide doesn't state one: the build year, rolled
// forward if the trip's month/day is already more than ~31 days past (so a January
// trip built the prior December resolves to the right year).
export function deriveTripYear(firstDayDate: string | null | undefined, now: Date = new Date()): number {
  const y = now.getUTCFullYear();
  const d = parseGuideDate(firstDayDate, y);
  if (!d) return y;
  return d.getTime() < now.getTime() - 31 * 864e5 ? y + 1 : y;
}

function iso(d: Date): string { return d.toISOString().slice(0, 10); }

function row(h: RawHoliday): HolidayRow {
  const dt = new Date(h.date + "T00:00:00Z");
  const label = `${WD[dt.getUTCDay()]} ${MON_ABBR[dt.getUTCMonth()]} ${dt.getUTCDate()}`;
  return { date: h.date, label, name: h.name, localName: h.localName, national: h.global === true };
}

// Partition holidays into during-trip / just-before / just-after (3-day shoulder).
// Returns null only when the trip dates can't be resolved or there's no data — the
// caller hides the block in that case. An empty-but-resolved result (data present,
// nothing near the trip) returns a non-null info with empty arrays, so the block can
// still show the reassuring "no holidays during your trip" state.
export function buildHolidayInfo(
  all: RawHoliday[] | null | undefined,
  firstDayDate: string | null | undefined,
  lastDayDate: string | null | undefined,
  year: number,
): HolidayInfo | null {
  if (!Array.isArray(all)) return null;
  const start = parseGuideDate(firstDayDate, year);
  const end = parseGuideDate(lastDayDate || firstDayDate, year);
  if (!start || !end) return null;

  const SHOULDER = 3 * 864e5;
  const sIso = iso(start), eIso = iso(end);
  const wsIso = iso(new Date(start.getTime() - SHOULDER));
  const weIso = iso(new Date(end.getTime() + SHOULDER));

  const during: HolidayRow[] = [], nearBefore: HolidayRow[] = [], nearAfter: HolidayRow[] = [];
  for (const h of all) {
    if (!h || typeof h.date !== "string") continue;
    if (h.date >= sIso && h.date <= eIso) {
      during.push(row(h));
    } else if (h.date >= wsIso && h.date < sIso) {
      const r = row(h);
      const dd = Math.round((start.getTime() - new Date(h.date + "T00:00:00Z").getTime()) / 864e5);
      r.rel = `${dd} day${dd > 1 ? "s" : ""} before you arrive`;
      nearBefore.push(r);
    } else if (h.date > eIso && h.date <= weIso) {
      const r = row(h);
      const dd = Math.round((new Date(h.date + "T00:00:00Z").getTime() - end.getTime()) / 864e5);
      r.rel = `${dd} day${dd > 1 ? "s" : ""} after you leave`;
      nearAfter.push(r);
    }
  }
  const byDate = (a: HolidayRow, b: HolidayRow) => (a.date < b.date ? -1 : 1);
  during.sort(byDate); nearBefore.sort(byDate); nearAfter.sort(byDate);

  const sm = MON_ABBR[start.getUTCMonth()], em = MON_ABBR[end.getUTCMonth()];
  const tripLabel = sm === em
    ? `${sm} ${start.getUTCDate()}–${end.getUTCDate()}`
    : `${sm} ${start.getUTCDate()} – ${em} ${end.getUTCDate()}`;

  return { tripLabel, year, during, nearBefore, nearAfter };
}
