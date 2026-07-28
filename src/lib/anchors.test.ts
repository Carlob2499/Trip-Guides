import { describe, it, expect } from "vitest";
import { dayTimelineStops, dayLegSummary, haversineKm, routeLegLabels, clampWord } from "./anchors";

describe("dayTimelineStops", () => {
  const days = [
    { date: "Wed Jul 8", title: "Flight — depart Newark (EWR) at ≈01:00" },
    { date: "Thu Jul 9", title: "Arrive Seoul — light, bathhouse, early night" },
    { date: "Fri Jul 10", title: "Palaces & old Seoul" },
    { date: "Sat Aug 1", title: "Fly home" },
  ];

  it("returns one stop per day with month shown on first stop and month changes only", () => {
    const stops = dayTimelineStops(days);
    expect(stops.map((s) => s.dateShort)).toEqual(["Jul 8", "9", "10", "Aug 1"]);
  });

  it("gives above-line words to first and last stops only, clamped from their own titles", () => {
    const stops = dayTimelineStops(days);
    expect(stops[0].word).toBeTruthy();
    expect(stops[0].word!.length).toBeLessThanOrEqual(18);
    expect(stops[1].word).toBeNull();
    expect(stops[2].word).toBeNull();
    expect(stops[3].word).toBe("Fly home");
  });

  it("preserves the raw date for client today-matching", () => {
    expect(dayTimelineStops(days)[2].date).toBe("Fri Jul 10");
  });

  it("refuses a shape for fewer than two days (one dot is not a timeline)", () => {
    expect(dayTimelineStops([{ date: "Wed Jul 8", title: "x" }])).toEqual([]);
    expect(dayTimelineStops([])).toEqual([]);
  });
});

describe("dayLegSummary", () => {
  const seoulWp = [
    { name: "Gyeongbokgung", lat: 37.5796, lng: 126.977 },
    { name: "Bukchon", lat: 37.5826, lng: 126.9831 },
    { name: "Changdeokgung", lat: 37.5794, lng: 126.991 },
  ];

  it("sums verified legs and names the day's first and last stops", () => {
    const leg = dayLegSummary(seoulWp)!;
    expect(leg.from).toBe("Gyeongbokgung");
    expect(leg.to).toBe("Changdeokgung");
    expect(leg.km).toBeGreaterThan(0.5);
    expect(leg.km).toBeLessThan(3); // sanity: these are ~1.4 km of real Seoul
  });

  it("returns km: null (never a partial sum) when any consecutive pair lacks coordinates", () => {
    const leg = dayLegSummary([
      { name: "A", lat: 37.5, lng: 127 },
      { name: "B" },
      { name: "C", lat: 37.6, lng: 127.1 },
    ])!;
    expect(leg.from).toBe("A");
    expect(leg.to).toBe("C");
    expect(leg.km).toBeNull();
  });

  it("returns null entirely for fewer than two waypoints", () => {
    expect(dayLegSummary([{ name: "Solo", lat: 1, lng: 1 }])).toBeNull();
    expect(dayLegSummary(undefined)).toBeNull();
  });
});

describe("haversineKm", () => {
  it("matches a known distance (Seoul Station → Daejeon Station ≈ 140 km)", () => {
    const d = haversineKm(37.5547, 126.9707, 36.3315, 127.4346);
    expect(d).toBeGreaterThan(130);
    expect(d).toBeLessThan(150);
  });
  it("is zero for identical points", () => {
    expect(haversineKm(37.5, 127, 37.5, 127)).toBe(0);
  });
});

describe("routeLegLabels", () => {
  it("extracts each step's bold lead, cut at its em-dash detail", () => {
    const labels = routeLegLabels([
      "<b>Incheon → Jongno base — Airport Limousine Bus 6002 (your pick):</b> Air Premia arrives…",
      "<b>Seoul → Daejeon (Jul 11, the two of you):</b> KTX from Seoul Station…",
    ]);
    expect(labels[0]).toBe("Incheon → Jongno base");
    expect(labels[1]).toBe("Seoul → Daejeon (Jul 11, the…");
  });

  it("decodes entities and strips nested tags inside the lead", () => {
    const labels = routeLegLabels([
      "<b>Palaces &amp; <i>old</i> Seoul — walk:</b> details",
      "<b>Second:</b> more",
    ]);
    expect(labels[0]).toBe("Palaces & old Seoul");
  });

  it("skips lead-less steps and refuses a figure below two stations", () => {
    expect(routeLegLabels(["no lead at all", "<b>Only one:</b> x"])).toEqual([]);
    expect(routeLegLabels(undefined)).toEqual([]);
  });
});

describe("clampWord", () => {
  it("clamps at a word boundary with an ellipsis and strips trailing punctuation", () => {
    expect(clampWord("Palaces & old Seoul, the long way around", 16)).toBe("Palaces & old…");
  });
  it("passes short strings through untouched", () => {
    expect(clampWord("Fly home", 16)).toBe("Fly home");
  });
});
