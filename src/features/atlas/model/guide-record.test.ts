// @protects-file Each trip's summary on the home page is derived from its own guide, not restated by hand.

import { describe, it, expect } from "vitest";
import {
  deriveGuideRecord, firstMapCenter, anchorLabelFromKicker, statusFor, originFor, coverImgFor,
} from "./guide-record";
import { tripWindow } from "../../../lib/trip-dates";

const NOW = new Date(2026, 6, 1); // Jul 1 2026

describe("firstMapCenter", () => {
  it("finds the first map section's center in file order, across nested sections", () => {
    const sections = [
      { type: "prose" },
      { sections: [{ type: "map", center: { lat: 1, lng: 2 } }] },
      { type: "map", center: { lat: 99, lng: 99 } },
    ];
    expect(firstMapCenter(sections)).toEqual({ lat: 1, lng: 2 });
  });

  it("resolves Fukuoka as japan's anchor — its own first map section, no override needed", () => {
    const sections = [
      { type: "prose" },
      { type: "map", center: { lat: 33.5904, lng: 130.4017 } }, // Fukuoka
      { type: "map", center: { lat: 43.0642, lng: 141.3469 } }, // Sapporo — later, doesn't win
    ];
    expect(firstMapCenter(sections)).toEqual({ lat: 33.5904, lng: 130.4017 });
  });

  it("null for a guide with no map section — honest absence, never a guessed point", () => {
    expect(firstMapCenter([{ type: "prose" }])).toBeNull();
    expect(firstMapCenter(null)).toBeNull();
    expect(firstMapCenter(undefined)).toBeNull();
  });

  it("skips a map section with no center", () => {
    expect(firstMapCenter([{ type: "map" }, { type: "map", center: { lat: 5, lng: 6 } }])).toEqual({ lat: 5, lng: 6 });
  });
});

describe("anchorLabelFromKicker", () => {
  it("takes the leading city before a middle-dot list", () => {
    expect(anchorLabelFromKicker("Seoul · Daejeon · Busan — Jul 8–15, 2026")).toBe("Seoul");
  });

  it("takes the leading city before a comma-qualified region", () => {
    expect(anchorLabelFromKicker("Sedona, Arizona — Sep 2–8, 2026")).toBe("Sedona");
  });

  it("takes the leading city before an em dash with no comma/dot", () => {
    expect(anchorLabelFromKicker("Fukuoka · Sapporo · Sendai — Oct 15–Nov 10, 2026")).toBe("Fukuoka");
  });

  it("null for an absent kicker — never invented", () => {
    expect(anchorLabelFromKicker(null)).toBeNull();
    expect(anchorLabelFromKicker(undefined)).toBeNull();
    expect(anchorLabelFromKicker("")).toBeNull();
  });
});

describe("statusFor", () => {
  it("undated when tripWindow has no resolvable dates", () => {
    expect(statusFor(tripWindow("Day 1", "Day 9", NOW))).toBe("undated");
  });
  it("upcoming for a future trip", () => {
    expect(statusFor(tripWindow("Wed Aug 5", "Wed Aug 12", NOW))).toBe("upcoming");
  });
  it("ongoing when today falls inside the window", () => {
    expect(statusFor(tripWindow("Tue Jun 30", "Thu Jul 2", NOW))).toBe("ongoing");
  });
  it("past once the window has closed", () => {
    expect(statusFor(tripWindow("Wed Jan 7", "Wed Jan 14", NOW))).toBe("past");
  });
});

describe("originFor", () => {
  it("resolves a confirmed row through the gazetteer", () => {
    const origin = originFor({ "traveler-origin": { value: "EWR", state: "confirmed" } });
    expect(origin).toMatchObject({ iata: "EWR", confirmed: true });
    expect(origin?.lat).toBeCloseTo(40.6925, 2);
  });

  it("resolves an unconfirmed row too, but marks it unconfirmed", () => {
    const origin = originFor({ "traveler-origin": { value: "JFK", state: "unconfirmed" } });
    expect(origin).toMatchObject({ iata: "JFK", confirmed: false });
  });

  it("is case-insensitive on the stored code", () => {
    expect(originFor({ "traveler-origin": { value: "ewr", state: "confirmed" } })?.iata).toBe("EWR");
  });

  it("null when there's no traveler-origin row, no facts at all, or an unresolvable code", () => {
    expect(originFor({ "some-other-fact": { value: "x" } })).toBeNull();
    expect(originFor(null)).toBeNull();
    expect(originFor(undefined)).toBeNull();
    expect(originFor({ "traveler-origin": { value: "LAX", state: "confirmed" } })).toBeNull();
  });
});

describe("coverImgFor", () => {
  it("prefers a Commons file", () => {
    expect(coverImgFor({ file: "Example.jpg", src: "https://cdn.example.com/x.jpg" }))
      .toBe("https://commons.wikimedia.org/wiki/Special:FilePath/Example.jpg");
  });
  it("falls back to a direct src", () => {
    expect(coverImgFor({ src: "https://cdn.example.com/x.jpg" })).toBe("https://cdn.example.com/x.jpg");
  });
  it("falls back to the video poster when that's all there is", () => {
    expect(coverImgFor({ video: { poster: "https://cdn.example.com/poster.jpg" } }))
      .toBe("https://cdn.example.com/poster.jpg");
  });
  it("null for no cover at all — Stage C owns the richer fallback chain, not this", () => {
    expect(coverImgFor(null)).toBeNull();
    expect(coverImgFor({})).toBeNull();
  });
});

describe("deriveGuideRecord — the whole record, composed", () => {
  const koreaLike = {
    slug: "korea",
    title: "South Korea",
    dek: "Eight days based in Seoul.",
    kicker: "Seoul · Daejeon · Busan — Jul 8–15, 2026",
    country: "South Korea",
    tz: "Asia/Seoul",
    cover: { video: { src: "https://x", poster: "https://x/poster.jpg" } },
    sections: [
      { type: "map", center: { lat: 37.5707, lng: 126.98 } },
      { type: "days", items: [{ date: "Wed Jul 8" }, { date: "Wed Jul 15" }] },
    ],
    facts: { "traveler-origin": { value: "EWR", state: "confirmed" } },
    ordinal: 2,
  };

  it("composes every field from the guide's own content, nothing invented", () => {
    const rec = deriveGuideRecord(koreaLike, NOW);
    expect(rec).toMatchObject({
      slug: "korea",
      title: "South Korea",
      dek: "Eight days based in Seoul.",
      anchor: { lat: 37.5707, lng: 126.98 },
      anchorLabel: "Seoul",
      countryId: 410,
      ordinal: 2,
      status: "upcoming", // trip is Jul 8-15, NOW is Jul 1
      tz: "Asia/Seoul",
      coverImg: "https://x/poster.jpg",
    });
    expect(rec.origin).toMatchObject({ iata: "EWR", confirmed: true });
    expect(rec.start).toBeInstanceOf(Date);
    expect(rec.end).toBeInstanceOf(Date);
  });

  it("status is pinned by the kicker's year — a finished trip never becomes 'upcoming' again on a later build", () => {
    // Without the pinned year, trip-dates' 180-day rollover would resolve this July 2026
    // trip into 2027 on any build after ~Jan 2027, flipping status past → upcoming and
    // shifting start/end a full year (the same mechanism as the D6 plate-renumbering bug).
    const rec = deriveGuideRecord(koreaLike, new Date(2027, 1, 15));
    expect(rec.status).toBe("past");
    expect(rec.start?.getFullYear()).toBe(2026);
  });

  it("a scaffold guide with none of the optional content resolves every field to an honest null, never a crash", () => {
    const rec = deriveGuideRecord({ slug: "draft", title: "Draft Guide" }, NOW);
    expect(rec).toEqual({
      slug: "draft",
      title: "Draft Guide",
      dek: null,
      anchor: null,
      anchorLabel: null,
      countryId: null,
      ordinal: null,
      start: null,
      end: null,
      status: "undated",
      tz: null,
      origin: null,
      coverImg: null,
    });
  });
});
