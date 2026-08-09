/* The built .gpx / .ics artifacts, checked as FILES rather than as functions.

   src/features/exports/model/exports.test.ts already tests buildGpx/buildIcs against handwritten
   input, and it passes. That is not the same claim as "the file this site serves for this guide
   parses". Between the pure function and the served bytes sit getStaticPaths, the content loader,
   the Response headers, and — the part that actually varies — real guide prose: em dashes, commas,
   apostrophes, semicolons, names long enough to need folding. A unit test only ever sees the
   strings its author thought to type.

   So this walks every guide the repo actually contains, discovered from disk rather than listed
   here, and holds the served artifact to the spec it claims to implement. A new guide is covered
   the moment its directory exists; nobody has to remember to add it.

   RFC 5545 §3.1 (folding, 75 octets, CRLF) and the GPX 1.1 schema are the two contracts. Both are
   the kind that fail SILENTLY: a calendar with a mis-folded DESCRIPTION imports with a truncated
   body, a GPX with an unescaped & is rejected by the app at the trailhead, and in both cases the
   build is green and the traveler is the one who finds out. */
// @protects-file The map and calendar files a guide hands out are valid, and open in real apps.

import { test, expect } from "@playwright/test";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const GUIDES_DIR = fileURLToPath(new URL("../../src/content/guides", import.meta.url));

const SLUGS = readdirSync(GUIDES_DIR).filter((e) => statSync(join(GUIDES_DIR, e)).isDirectory());

/* A guide with no mappable venue gets no .gpx, and one with no dated day cards gets no .ics —
   getStaticPaths filters both, so 404 is a legitimate answer and NOT a failure. What would be a
   failure is every guide 404ing, because then this whole file passes while testing nothing. The
   last test in this file is the guard against that, and it re-fetches rather than reading a
   counter: fullyParallel spreads these tests across worker PROCESSES, so module-level state
   accumulated by one test is simply not visible to another. A shared counter would have read
   zero in whichever worker drew the final test and failed for a reason that isn't true. */

/** Unfold per RFC 5545 §3.1: a CRLF followed by one space or tab continues the previous line. */
function unfold(ics: string): string[] {
  const out: string[] = [];
  for (const line of ics.split("\r\n")) {
    if (/^[ \t]/.test(line) && out.length) out[out.length - 1] += line.slice(1);
    else out.push(line);
  }
  return out;
}

test.describe("built exports", () => {
  test("the repo has guides to check (guards a vacuous pass)", () => {
    expect(SLUGS.length, `no guide directories under ${GUIDES_DIR}`).toBeGreaterThan(0);
  });

  for (const slug of SLUGS) {
    test(`${slug}.gpx is well-formed GPX 1.1`, async ({ request }) => {
      const res = await request.get(`/Trip-Guides/guides/${slug}.gpx`);
      expect([200, 404], `unexpected status for ${slug}.gpx`).toContain(res.status());
      if (res.status() === 404) return; // guide has no waypoints — see the note above

      expect(res.headers()["content-type"]).toContain("application/gpx+xml");
      const body = await res.text();

      expect(body.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
      expect(body).toContain('<gpx version="1.1"');
      expect(body).toContain('xmlns="http://www.topografix.com/GPX/1/1"');
      expect(body.trimEnd().endsWith("</gpx>")).toBe(true);

      const wpts = [...body.matchAll(/<wpt lat="([^"]+)" lon="([^"]+)">/g)];
      expect(wpts.length, "a .gpx was served with no waypoints in it").toBeGreaterThan(0);

      /* Out-of-range coordinates are the failure a schema check would miss and a mapping app
         would not: it silently drops the point, so the trailhead just isn't there. */
      const badCoords = wpts
        .map(([, lat, lon]) => ({ lat: Number(lat), lon: Number(lon) }))
        .filter((c) => !(c.lat >= -90 && c.lat <= 90 && c.lon >= -180 && c.lon <= 180))
        .map((c) => `${c.lat},${c.lon}`);
      expect(badCoords, "waypoint coordinate outside the valid lat/lon range").toEqual([]);

      /* Guide prose is full of & and < — an unescaped one makes the whole document unparseable,
         not just the one waypoint. Matching a bare & is the cheapest way to catch it. */
      const rawAmp = body.match(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g) ?? [];
      expect(rawAmp, "unescaped & in the GPX — the document will not parse").toEqual([]);
    });

    test(`${slug}.ics is well-formed iCalendar`, async ({ request }) => {
      const res = await request.get(`/Trip-Guides/guides/${slug}.ics`);
      expect([200, 404], `unexpected status for ${slug}.ics`).toContain(res.status());
      if (res.status() === 404) return; // guide has no dated day cards

      expect(res.headers()["content-type"]).toContain("text/calendar");
      const body = await res.text();

      /* RFC 5545 requires CRLF. A bare LF is what you get from an editor or a join("\n") that
         slipped in, and strict importers (Outlook) reject the file outright. */
      expect(body.match(/(?<!\r)\n/g) ?? [], "bare LF in an .ics — RFC 5545 requires CRLF").toEqual([]);
      expect(body.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
      expect(body.endsWith("END:VCALENDAR\r\n")).toBe(true);

      /* ≤75 OCTETS, not characters. An em dash is three bytes, so a fold that counts characters
         passes every ASCII test ever written and overruns on the first piece of real prose. */
      const overlong = body
        .split("\r\n")
        .map((l, i) => ({ i: i + 1, n: Buffer.byteLength(l, "utf8"), l }))
        .filter((x) => x.n > 75)
        .map((x) => `line ${x.i}: ${x.n} octets — ${x.l.slice(0, 40)}…`);
      expect(overlong, "content line over 75 octets — RFC 5545 §3.1 folding").toEqual([]);

      const lines = unfold(body);
      const begins = lines.filter((l) => l === "BEGIN:VEVENT").length;
      const ends = lines.filter((l) => l === "END:VEVENT").length;
      expect(begins, "an .ics was served with no events in it").toBeGreaterThan(0);
      expect(ends, "unbalanced BEGIN/END:VEVENT").toBe(begins);

      expect(lines).toContain("VERSION:2.0");
      expect(lines.some((l) => l.startsWith("PRODID:"))).toBe(true);

      /* Every VEVENT needs UID + DTSTAMP + DTSTART, and the UID must be unique — a duplicate is
         the nastiest one, because calendars treat the second event as an EDIT of the first and
         the day quietly disappears from the traveler's calendar. */
      const uids: string[] = [];
      const incomplete: string[] = [];
      let current: string[] | null = null;
      for (const line of lines) {
        if (line === "BEGIN:VEVENT") current = [];
        else if (line === "END:VEVENT" && current) {
          const body_ = current;
          const missing = ["UID:", "DTSTAMP:", "DTSTART"].filter((p) => !body_.some((l) => l.startsWith(p)));
          if (missing.length) incomplete.push(missing.join(", "));
          const uid = body_.find((l) => l.startsWith("UID:"));
          if (uid) uids.push(uid);
          current = null;
        } else current?.push(line);
      }
      expect(incomplete, "VEVENT missing a required property").toEqual([]);
      expect(uids.length - new Set(uids).size, "duplicate UID — calendars will overwrite the event").toBe(0);

      /* SUMMARY/DESCRIPTION values must escape , ; and \ (§3.3.11). An unescaped comma splits the
         value into a list, so the summary silently truncates at the first comma. */
      const unescaped = lines
        .filter((l) => /^(SUMMARY|DESCRIPTION):/.test(l))
        .filter((l) => /(?<!\\)[,;]/.test(l.slice(l.indexOf(":") + 1)))
        .map((l) => l.slice(0, 60) + "…");
      expect(unescaped, "unescaped , or ; in a text value — the value will truncate").toEqual([]);

      /* All-day DTEND is EXCLUSIVE. Off by one here and every day card lands on the wrong date
         or renders as zero-length, which is exactly the bug nobody notices until they're there. */
      const dates = lines.filter((l) => l.startsWith("DTSTART;VALUE=DATE:") || l.startsWith("DTEND;VALUE=DATE:"));
      const malformed = dates.filter((l) => !/^DT(START|END);VALUE=DATE:\d{8}$/.test(l));
      expect(malformed, "DATE value is not YYYYMMDD").toEqual([]);
    });
  }

  /* Without this, a build that emitted no exports at all would show this file fully green — every
     per-slug test would take the 404 early return and pass. Self-contained on purpose: it asks the
     server itself rather than trusting state from a sibling test in another worker. */
  test("at least one guide actually produced each export", async ({ request }) => {
    const statuses = await Promise.all(
      SLUGS.flatMap((slug) =>
        [`${slug}.gpx`, `${slug}.ics`].map(async (file) => ({
          file,
          status: (await request.get(`/Trip-Guides/guides/${file}`)).status(),
        })),
      ),
    );
    const served = (ext: string) => statuses.filter((s) => s.file.endsWith(ext) && s.status === 200).length;
    expect(served(".gpx"), "no guide served a .gpx — the export route may be broken").toBeGreaterThan(0);
    expect(served(".ics"), "no guide served an .ics — the export route may be broken").toBeGreaterThan(0);
  });
});
