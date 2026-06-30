// Build-time export helpers. Pure functions — no fetch, no client code, no I/O.
// Consumed by the static endpoints src/pages/guides/[slug].gpx.ts and
// [slug].ics.ts (which emit one file per guide into dist/ at build) and by
// GuideLayout.astro to decide whether to show each download link.
//
// Date parsing is reused from ./holidays.ts so the iCal calendar resolves the
// same trip year the holidays block already uses.

import { parseGuideDate, deriveTripYear } from "./holidays";

export interface Waypoint { lat: number; lng: number; name: string; }
export interface DayEvent { date: Date; title: string; desc?: string; }

// Recursive flatten — mirrors `flatten` in scripts/fetch-holidays.mjs and
// `flatSections` in GuideLayout.astro. The schema is currently flat, but guides
// may nest `sections`, so handle it defensively.
export function flattenSections(sections: any[] | undefined | null, out: any[] = []): any[] {
  for (const s of sections || []) {
    if (s && Array.isArray(s.sections)) flattenSections(s.sections, out);
    else if (s) out.push(s);
  }
  return out;
}

// "<a href=...>text</a>" → "text"; all other prose-allowlist tags dropped;
// HTML entities decoded. Used for calendar DESCRIPTION so an event never reads
// "Dinner at <b>X</b>" or the escaped "&lt;b&gt;". Entities are decoded BEFORE
// tag removal so an already-escaped "&lt;b&gt;" is also stripped, not revived.
export function htmlToText(s: string | undefined | null): string {
  if (!s) return "";
  return String(s)
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<a\b[^>]*>(.*?)<\/a>/gis, "$1")   // keep link text, drop the tag
    .replace(/<[^>]+>/g, " ")                    // drop every other tag
    .replace(/\s+/g, " ")
    .trim();
}

// Every `map` section center plus every `sights` item that carries a `map`
// coord. De-duped on the exact lat,lng,name triplet. Names: a map section's
// `title`, or "<Country> map point" when untitled; a sight's `name`.
export function collectWaypoints(guide: any): Waypoint[] {
  const country = guide?.country || "";
  const seen = new Set<string>();
  const out: Waypoint[] = [];
  const push = (lat: any, lng: any, name: string) => {
    if (typeof lat !== "number" || typeof lng !== "number") return;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const key = `${lat},${lng},${name}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ lat, lng, name });
  };
  for (const s of flattenSections(guide?.sections)) {
    if (s.type === "map" && s.center) {
      push(s.center.lat, s.center.lng, s.title || `${country} map point`);
    } else if (s.type === "sights" && Array.isArray(s.items)) {
      for (const it of s.items) {
        if (it?.map) push(it.map.lat, it.map.lng, it.name || `${country} sight`);
      }
    }
  }
  return out;
}

// The first `days` item's date string across the guide — anchors the trip year.
function firstDayDate(guide: any): string | null {
  const d = flattenSections(guide?.sections).find((s) => s.type === "days" && s.items?.length);
  return d?.items?.[0]?.date ?? null;
}

// One event per day card whose date string parses. Unparseable dates are
// skipped (graceful — the file still emits). `desc` is the day's note (or, if
// absent, its `fit`) stripped to plain text.
export function collectDayEvents(guide: any): DayEvent[] {
  const year = deriveTripYear(firstDayDate(guide));
  const out: DayEvent[] = [];
  for (const s of flattenSections(guide?.sections)) {
    if (s.type !== "days" || !Array.isArray(s.items)) continue;
    for (const it of s.items) {
      const date = parseGuideDate(it?.date, year);
      if (!date) continue;
      const desc = htmlToText(it?.note ?? it?.fit);
      out.push({ date, title: it?.title || "Trip day", ...(desc ? { desc } : {}) });
    }
  }
  return out;
}

// A brief, human-readable digest for the "Share summary" button: theme line,
// the planned day-by-day one-liners, and the key locations. Plain text — the
// client appends the guide URL at share time. Returns "" only for an empty guide.
export function buildSummary(guide: any): string {
  const out: string[] = [];
  const title = guide?.title || "Trip Guide";
  out.push(guide?.dek ? `${title} — ${htmlToText(guide.dek)}` : title);

  const events: string[] = [];
  for (const s of flattenSections(guide?.sections)) {
    if (s.type !== "days" || !Array.isArray(s.items)) continue;
    for (const it of s.items) {
      const t = htmlToText(it?.title);
      if (!t) continue;
      const d = (it?.date ?? "").toString().trim();
      events.push(d ? `${d} — ${t}` : t);
    }
  }
  if (events.length) {
    out.push("", "Planned:");
    for (const e of events) out.push(`• ${e}`);
  }

  const spots = collectWaypoints(guide).map((w) => w.name);
  if (spots.length) {
    const shown = spots.slice(0, 8);
    out.push("", `Key spots: ${shown.join(", ")}${spots.length > 8 ? `, +${spots.length - 8} more` : ""}`);
  }
  return out.join("\n");
}

// ── GPX 1.1 ────────────────────────────────────────────────────────────────

function xmlEscape(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function buildGpx(guide: any): string {
  const wpts = collectWaypoints(guide).map((p) =>
    `  <wpt lat="${p.lat}" lon="${p.lng}">\n    <name>${xmlEscape(p.name)}</name>\n  </wpt>`
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<gpx version="1.1" creator="Waypoint Trip Guides" xmlns="http://www.topografix.com/GPX/1/1">\n` +
    `  <metadata>\n    <name>${xmlEscape(guide?.title || "Trip Guide")}</name>\n  </metadata>\n` +
    `${wpts}\n</gpx>\n`;
}

// ── iCalendar (RFC 5545) ─────────────────────────────────────────────────────

function icsEscape(s: string): string {
  return String(s)
    .replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function pad(n: number): string { return String(n).padStart(2, "0"); }
function ymd(d: Date): string { return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`; }
function stamp(d: Date): string { return `${ymd(d)}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`; }

// Fold a content line to ≤75 octets per RFC 5545 §3.1; continuation lines start
// with a single space. Splits on code-point boundaries so multibyte UTF-8 is
// never cut. Returns a string that may contain internal CRLF+space breaks.
function fold(line: string): string {
  const segs: string[] = [];
  let cur = "", bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch, "utf8");
    const limit = segs.length === 0 ? 75 : 74; // continuation line spends 1 octet on the leading space
    if (bytes + b > limit) { segs.push(cur); cur = ch; bytes = b; }
    else { cur += ch; bytes += b; }
  }
  segs.push(cur);
  return segs.join("\r\n ");
}

export function buildIcs(guide: any, slug: string): string {
  const dtstamp = stamp(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Waypoint//Trip Guides//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:${icsEscape(guide?.title || "Trip Guide")}`),
  ];
  for (const ev of collectDayEvents(guide)) {
    const start = ymd(ev.date);
    const end = ymd(new Date(ev.date.getTime() + 864e5)); // all-day DTEND is exclusive
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${slug}-${start}@waypoint`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;VALUE=DATE:${start}`);
    lines.push(`DTEND;VALUE=DATE:${end}`);
    lines.push(fold(`SUMMARY:${icsEscape(ev.title)}`));
    if (ev.desc) lines.push(fold(`DESCRIPTION:${icsEscape(ev.desc)}`));
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
