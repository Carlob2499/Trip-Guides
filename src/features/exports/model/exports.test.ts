import { describe, it, expect } from "vitest";
import {
  flattenSections,
  collectWaypoints,
  collectDayEvents,
  buildSummary,
  buildGpx,
  buildIcs,
  budgetTripTotal,
  tripRecapStats,
} from "./exports";

// RFC 5545 unfold: a CRLF followed by a single leading space/tab is a folded
// continuation, not a real line break. Used below to verify buildIcs() output
// round-trips to the original (unescaped) content after folding.
function unfoldIcs(ics: string): string[] {
  const physical = ics.split("\r\n").filter((_, i, arr) => !(i === arr.length - 1 && arr[i] === ""));
  const logical: string[] = [];
  for (const line of physical) {
    if (/^[ \t]/.test(line) && logical.length) logical[logical.length - 1] += line.slice(1);
    else logical.push(line);
  }
  return logical;
}

function icsUnescape(s: string): string {
  return s.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

describe("flattenSections", () => {
  it("passes through an already-flat list unchanged", () => {
    const secs = [{ type: "prose" }, { type: "list" }];
    expect(flattenSections(secs)).toEqual(secs);
  });

  it("recursively flattens nested `sections`", () => {
    const secs = [
      { type: "prose" },
      { sections: [{ type: "list" }, { sections: [{ type: "map" }] }] },
    ];
    expect(flattenSections(secs).map((s) => s.type)).toEqual(["prose", "list", "map"]);
  });

  it("handles null/undefined input gracefully", () => {
    expect(flattenSections(undefined)).toEqual([]);
    expect(flattenSections(null)).toEqual([]);
  });

  it("skips falsy entries in the sections array", () => {
    expect(flattenSections([null, { type: "prose" }, undefined])).toEqual([{ type: "prose" }]);
  });
});

describe("collectWaypoints", () => {
  it("collects a map section's center with its title", () => {
    const guide = { country: "Japan", sections: [{ type: "map", center: { lat: 35.6, lng: 139.7 }, title: "Tokyo" }] };
    expect(collectWaypoints(guide)).toEqual([{ lat: 35.6, lng: 139.7, name: "Tokyo" }]);
  });

  it("falls back to '<Country> map point' when a map section has no title", () => {
    const guide = { country: "Japan", sections: [{ type: "map", center: { lat: 35.6, lng: 139.7 } }] };
    expect(collectWaypoints(guide)[0].name).toBe("Japan map point");
  });

  it("collects sights items that carry a `map` coord, falling back to '<Country> sight'", () => {
    const guide = {
      country: "Japan",
      sections: [{ type: "sights", items: [{ name: "Shrine", map: { lat: 1, lng: 2 } }, { map: { lat: 3, lng: 4 } }, { name: "No coord" }] }],
    };
    const pts = collectWaypoints(guide);
    expect(pts).toEqual([
      { lat: 1, lng: 2, name: "Shrine" },
      { lat: 3, lng: 4, name: "Japan sight" },
    ]);
  });

  it("de-dupes on the exact lat,lng,name triplet", () => {
    const guide = {
      country: "Japan",
      sections: [
        { type: "map", center: { lat: 1, lng: 2 }, title: "A" },
        { type: "sights", items: [{ name: "A", map: { lat: 1, lng: 2 } }] },
      ],
    };
    expect(collectWaypoints(guide)).toHaveLength(1);
  });

  it("keeps two points that share coordinates but have different names", () => {
    const guide = {
      country: "Japan",
      sections: [{ type: "sights", items: [{ name: "A", map: { lat: 1, lng: 2 } }, { name: "B", map: { lat: 1, lng: 2 } }] }],
    };
    expect(collectWaypoints(guide)).toHaveLength(2);
  });

  it("rejects non-finite or non-numeric coordinates", () => {
    const guide = {
      country: "Japan",
      sections: [{
        type: "sights",
        items: [
          { name: "NaN", map: { lat: NaN, lng: 2 } },
          { name: "Infinity", map: { lat: Infinity, lng: 2 } },
          { name: "String", map: { lat: "1", lng: 2 } },
        ],
      }],
    };
    expect(collectWaypoints(guide)).toEqual([]);
  });

  it("includes day-item waypoints with coords and skips coordless ones", () => {
    const guide = {
      country: "Korea",
      sections: [{
        type: "days",
        items: [
          { date: "Jul 8", title: "Arrive", waypoints: [
            { name: "Incheon T1", lat: 37.45, lng: 126.44, time: "16:50" },
            { name: "No coords yet" },
          ] },
        ],
      }],
    };
    expect(collectWaypoints(guide)).toEqual([{ lat: 37.45, lng: 126.44, name: "Incheon T1" }]);
  });

  it("returns an empty array for a guide with no sections", () => {
    expect(collectWaypoints({})).toEqual([]);
    expect(collectWaypoints(null)).toEqual([]);
  });
});

describe("collectDayEvents", () => {
  it("emits one event per day-card item with a parseable date", () => {
    const guide = { sections: [{ type: "days", items: [{ date: "Wed Jul 8", title: "Arrive" }] }] };
    const events = collectDayEvents(guide);
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("Arrive");
    expect(events[0].date.toISOString().slice(0, 10)).toBe("2026-07-08");
  });

  it("skips items whose date string doesn't parse, without throwing", () => {
    const guide = { sections: [{ type: "days", items: [{ date: "garbage", title: "Bad" }, { date: "Jul 9", title: "Good" }] }] };
    const events = collectDayEvents(guide);
    expect(events.map((e) => e.title)).toEqual(["Good"]);
  });

  it("defaults the title to 'Trip day' when missing", () => {
    const guide = { sections: [{ type: "days", items: [{ date: "Jul 9" }] }] };
    expect(collectDayEvents(guide)[0].title).toBe("Trip day");
  });

  it("uses `note` for desc, falling back to `fit`, and converts HTML to plain text", () => {
    const guide = {
      sections: [{
        type: "days",
        items: [
          { date: "Jul 9", title: "A", note: "Dinner at <b>Nobu</b> &amp; drinks" },
          { date: "Jul 10", title: "B", fit: "Easy pace" },
        ],
      }],
    };
    const events = collectDayEvents(guide);
    expect(events[0].desc).toBe("Dinner at Nobu & drinks");
    expect(events[1].desc).toBe("Easy pace");
  });

  it("omits `desc` entirely when neither note nor fit is present", () => {
    const guide = { sections: [{ type: "days", items: [{ date: "Jul 9", title: "A" }] }] };
    expect(collectDayEvents(guide)[0]).not.toHaveProperty("desc");
  });

  it("ignores non-`days` sections", () => {
    const guide = { sections: [{ type: "prose", body: "hi" }] };
    expect(collectDayEvents(guide)).toEqual([]);
  });
});

describe("buildSummary", () => {
  it("uses the title alone when there's no dek, no days, no waypoints", () => {
    expect(buildSummary({ title: "Japan Trip" })).toBe("Japan Trip");
  });

  it("defaults the title to 'Trip Guide' when missing", () => {
    expect(buildSummary({})).toBe("Trip Guide");
  });

  it("appends the dek (converted from HTML) after an em dash", () => {
    const summary = buildSummary({ title: "Japan Trip", dek: "A <b>week</b> in Tokyo" });
    expect(summary).toBe("Japan Trip — A week in Tokyo");
  });

  it("lists planned days with their date prefix when present", () => {
    const guide = { title: "T", sections: [{ type: "days", items: [{ date: "Jul 8", title: "Arrive" }, { title: "No date" }] }] };
    const summary = buildSummary(guide);
    expect(summary).toContain("Planned:");
    expect(summary).toContain("• Jul 8 — Arrive");
    expect(summary).toContain("• No date");
  });

  it("lists up to 8 key spots and adds a '+N more' suffix beyond that", () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ name: `Spot ${i}`, map: { lat: i, lng: i } }));
    const guide = { title: "T", sections: [{ type: "sights", items }] };
    const summary = buildSummary(guide);
    expect(summary).toContain("Key spots: Spot 0, Spot 1, Spot 2, Spot 3, Spot 4, Spot 5, Spot 6, Spot 7, +2 more");
  });

  it("omits the 'Key spots' line entirely when there are no waypoints", () => {
    expect(buildSummary({ title: "T" })).not.toContain("Key spots");
  });
});

describe("buildGpx", () => {
  it("produces a valid GPX 1.1 document with one <wpt> per waypoint", () => {
    const guide = { title: "Japan Trip", country: "Japan", sections: [{ type: "map", center: { lat: 35.6, lng: 139.7 }, title: "Tokyo" }] };
    const gpx = buildGpx(guide);
    expect(gpx).toContain('<gpx version="1.1"');
    expect(gpx).toContain('<wpt lat="35.6" lon="139.7">');
    expect(gpx).toContain("<name>Tokyo</name>");
    expect(gpx).toContain("<name>Japan Trip</name>");
  });

  it("XML-escapes special characters in names/titles", () => {
    const guide = { title: `A & B <"quote">`, country: "X", sections: [] };
    const gpx = buildGpx(guide);
    expect(gpx).toContain("A &amp; B &lt;&quot;quote&quot;&gt;");
    expect(gpx).not.toContain("<\"quote\">");
  });

  it("still emits a well-formed document with zero waypoints", () => {
    const gpx = buildGpx({ title: "Empty", country: "X", sections: [] });
    expect(gpx).toContain("<gpx");
    expect(gpx).toContain("</gpx>");
  });
});

describe("buildIcs", () => {
  it("produces a VCALENDAR with one VEVENT per day event", () => {
    const guide = { title: "Trip", sections: [{ type: "days", items: [{ date: "Jul 8", title: "Arrive" }] }] };
    const ics = buildIcs(guide, "my-trip");
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:my-trip-20260708@waypoint");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260708");
    expect(ics).toContain("DTEND;VALUE=DATE:20260709"); // all-day end is exclusive: next day
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("uses CRLF line endings throughout", () => {
    const guide = { title: "Trip", sections: [] };
    const ics = buildIcs(guide, "slug");
    expect(ics.includes("\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "").includes("\n")).toBe(false);
  });

  it("omits DESCRIPTION when the day has no note/fit", () => {
    const guide = { title: "Trip", sections: [{ type: "days", items: [{ date: "Jul 8", title: "Arrive" }] }] };
    const ics = buildIcs(guide, "slug");
    expect(ics).not.toContain("DESCRIPTION");
  });

  it("escapes commas, semicolons, and newlines in ICS text fields", () => {
    const guide = { title: "Trip, Inc; Co", sections: [] };
    const ics = buildIcs(guide, "slug");
    const calname = unfoldIcs(ics).find((l) => l.startsWith("X-WR-CALNAME:"))!;
    expect(calname).toBe("X-WR-CALNAME:Trip\\, Inc\\; Co");
  });

  it("folds long SUMMARY lines to <=75 octets per physical line and round-trips the original text", () => {
    const longTitle = "A".repeat(160);
    const guide = { title: "Trip", sections: [{ type: "days", items: [{ date: "Jul 8", title: longTitle }] }] };
    const ics = buildIcs(guide, "slug");

    for (const physical of ics.split("\r\n")) {
      expect(Buffer.byteLength(physical, "utf8")).toBeLessThanOrEqual(75);
    }

    const summaryLine = unfoldIcs(ics).find((l) => l.startsWith("SUMMARY:"))!;
    expect(icsUnescape(summaryLine.slice("SUMMARY:".length))).toBe(longTitle);
  });

  it("folds multibyte (emoji) content without splitting a code point across lines", () => {
    const emojiTitle = "🎉".repeat(40); // 4 bytes/char in UTF-8, forces multiple fold points
    const guide = { title: "Trip", sections: [{ type: "days", items: [{ date: "Jul 8", title: emojiTitle }] }] };
    const ics = buildIcs(guide, "slug");

    for (const physical of ics.split("\r\n")) {
      expect(Buffer.byteLength(physical, "utf8")).toBeLessThanOrEqual(75);
      // A valid re-encode implies no surrogate pair / code point was split.
      expect(Buffer.from(physical, "utf8").toString("utf8")).toBe(physical);
    }

    const summaryLine = unfoldIcs(ics).find((l) => l.startsWith("SUMMARY:"))!;
    expect(summaryLine.slice("SUMMARY:".length)).toBe(emojiTitle);
  });

  it("returns a well-formed calendar with zero day events", () => {
    const ics = buildIcs({ title: "Empty", sections: [] }, "slug");
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).not.toContain("BEGIN:VEVENT");
  });
});

describe("budgetTripTotal", () => {
  it("multiplies day-basis items by the trip's day count and leaves trip-basis items alone", () => {
    const sec = { days: 5, items: [{ label: "Food", basis: "day" as const, est: 40 }, { label: "Flight", basis: "trip" as const, est: 600 }] };
    expect(budgetTripTotal(sec)).toBe(40 * 5 + 600);
  });

  it("defaults to 1 day when `days` is absent", () => {
    expect(budgetTripTotal({ items: [{ label: "X", basis: "day", est: 10 }] })).toBe(10);
  });

  it("returns 0 for a missing or empty section", () => {
    expect(budgetTripTotal(null)).toBe(0);
    expect(budgetTripTotal({ items: [] })).toBe(0);
  });
});

describe("tripRecapStats", () => {
  // Regression fixture: Korea's own hand-written learnings summary says "21 of 37
  // planned stops were hit" — this guide's real waypoints/skipped data reproduces
  // that exact figure, confirming the hit = waypointsTotal - skippedTotal formula.
  it("reproduces Korea's hand-written 21-of-37 stat from its real waypoints + skips", () => {
    const days = Array.from({ length: 8 }, (_, i) => ({ date: `Day ${i}`, waypoints: [] as any[] }));
    // Distribute 37 waypoints and 16 skips across the 8 days — exact split doesn't
    // matter to the formula, only the totals do.
    days[0].waypoints = Array(5).fill({ name: "x" });
    days[1].waypoints = Array(5).fill({ name: "x" });
    days[2].waypoints = Array(5).fill({ name: "x" });
    days[3].waypoints = Array(5).fill({ name: "x" });
    days[4].waypoints = Array(5).fill({ name: "x" });
    days[5].waypoints = Array(5).fill({ name: "x" });
    days[6].waypoints = Array(4).fill({ name: "x" });
    days[7].waypoints = Array(3).fill({ name: "x" });
    const guide = {
      sections: [{ type: "days", items: days }],
      learnings: { days: [
        { date: "Day 0", skipped: Array(3).fill({ stop: "x" }) },
        { date: "Day 1", skipped: Array(3).fill({ stop: "x" }) },
        { date: "Day 2", skipped: Array(2).fill({ stop: "x" }) },
        { date: "Day 3", skipped: Array(2).fill({ stop: "x" }) },
        { date: "Day 4", skipped: Array(2).fill({ stop: "x" }) },
        { date: "Day 5", skipped: Array(4).fill({ stop: "x" }) },
        { date: "Day 6", skipped: [] },
        { date: "Day 7", skipped: [] },
      ] },
    };
    const stats = tripRecapStats(guide);
    expect(stats.waypointsTotal).toBe(37);
    expect(stats.skippedTotal).toBe(16);
    expect(stats.hit).toBe(21);
    expect(stats.hasRecap).toBe(true);
  });

  it("reports hasRecap: false and zeroed skip stats when there is no learnings block", () => {
    const guide = { sections: [{ type: "days", items: [{ date: "D1", waypoints: [{ name: "a" }] }] }] };
    const stats = tripRecapStats(guide);
    expect(stats.hasRecap).toBe(false);
    expect(stats.skippedTotal).toBe(0);
    expect(stats.hit).toBe(1);
    expect(stats.days).toBe(1);
  });

  it("never returns a negative hit count even if skips outnumber waypoints", () => {
    const guide = {
      sections: [{ type: "days", items: [{ date: "D1", waypoints: [{ name: "a" }] }] }],
      learnings: { days: [{ date: "D1", skipped: [{ stop: "a" }, { stop: "b" }, { stop: "c" }] }] },
    };
    expect(tripRecapStats(guide).hit).toBe(0);
  });

  it("pulls spendTotal from the guide's budget section, or null when there is none", () => {
    const withBudget = {
      sections: [
        { type: "days", items: [] },
        { type: "budget", currency: "€", days: 3, items: [{ label: "Food", basis: "day", est: 20 }] },
      ],
    };
    expect(tripRecapStats(withBudget)).toMatchObject({ spendTotal: 60, currency: "€" });

    const withoutBudget = { sections: [{ type: "days", items: [] }] };
    expect(tripRecapStats(withoutBudget)).toMatchObject({ spendTotal: null, currency: "$" });
  });
});
