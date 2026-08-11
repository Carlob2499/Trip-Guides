// @protects-file The plate line says where this trip goes and what is next, or says nothing.

import { describe, expect, it } from "vitest";
import { cityLine, dateLine, nextLeg } from "./plate-line";
import { resolveTripDate } from "./trip-dates";

const KOREA_KICKER = "Seoul · Daejeon · Busan — Jul 8–15, 2026";

describe("cityLine", () => {
  it("takes the cities and leaves the dates to the eyebrow", () => {
    expect(cityLine(KOREA_KICKER)).toBe("Seoul · Daejeon · Busan");
  });

  it("accepts an en dash as well as an em dash", () => {
    expect(cityLine("Tokyo · Kyoto – Nov 2026")).toBe("Tokyo · Kyoto");
  });

  it("⌁ renders nothing for a kicker with no city half", () => {
    // The absent state is a shorter plate line, never a padded one (FALLBACKS §1).
    expect(cityLine("Jul 8–15, 2026")).toBeNull();
    expect(cityLine("Seoul — Jul 8")).toBeNull();   // one place is not a city LIST
    expect(cityLine("")).toBeNull();
    expect(cityLine(null)).toBeNull();
    expect(cityLine(undefined)).toBeNull();
  });

  it("⌁ never guesses which half of an unpunctuated kicker is a place", () => {
    // Without the separator there is no rule that is not a guess, so there is no output.
    expect(cityLine("Eight days in Korea")).toBeNull();
    expect(cityLine("Seoul · Busan")).toBeNull();
  });

  it("⌁ declines a single-city kicker rather than trusting the dash alone", () => {
    /* Sedona's real kicker. "The head of a dash split is a place" holds for every guide
       written so far and would fail on the first sentence-shaped one — and being wrong here
       puts a fabricated place name on the loudest row of the masthead. Nothing is lost: the
       eyebrow keeps this kicker whole (see dateLine), so the reader sees every word. */
    expect(cityLine("Sedona, Arizona — Sep 2–8, 2026")).toBeNull();
    expect(dateLine("Sedona, Arizona — Sep 2–8, 2026")).toBe("Sedona, Arizona — Sep 2–8, 2026");
  });
});

describe("dateLine", () => {
  it("takes what cityLine leaves", () => {
    expect(dateLine(KOREA_KICKER)).toBe("Jul 8–15, 2026");
  });

  it("⌁ keeps a kicker with no city half whole rather than halving it", () => {
    // Halving an unsplittable kicker would LOSE text, not move it — the eyebrow keeps it all.
    expect(dateLine("Eight days in Korea")).toBe("Eight days in Korea");
    expect(dateLine("Seoul — Jul 8")).toBe("Seoul — Jul 8");
  });

  it("⌁ never renders the same words as cityLine — the halves cannot overlap", () => {
    /* The whole reason both functions exist is that the masthead shows each half once. If the
       seam ever drifts, one of these strings appears in the eyebrow AND on the plate line, and
       a reader sees the trip's cities twice as if they were two different facts. */
    for (const k of [KOREA_KICKER, "Tokyo · Kyoto – Nov 2026", "Copenhagen · Aarhus — May 2027"]) {
      const cities = cityLine(k)!;
      const dates = dateLine(k)!;
      expect(dates).not.toContain(cities);
      expect(cities).not.toContain(dates);
      expect(`${cities} — ${dates}`).toBe(k.replace(/\s–\s/, " — "));   // together, the whole
    }
  });

  it("returns null for no kicker at all", () => {
    expect(dateLine(null)).toBeNull();
    expect(dateLine("")).toBeNull();
  });
});

describe("nextLeg", () => {
  const DAYS = [
    { date: "Wed Jul 8", waypoints: [{ name: "Depart EWR Terminal B", time: "≈01:00 EDT" }] },
    {
      date: "Thu Jul 9",
      waypoints: [
        { name: "Gyeongbokgung", lat: 37.5, lng: 127 },          // no time — skipped
        { name: "Land ICN Terminal 1", time: "≈04:55 KST" },
      ],
    },
    { date: "Fri Jul 10", waypoints: [{ name: "KTX to Daejeon", time: "08:30" }] },
  ];
  const on = (iso: string) => new Date(iso);

  it("names the next timed stop from today's own day", () => {
    expect(nextLeg(DAYS, resolveTripDate, on("2026-07-08T09:00:00"))).toBe("≈01:00 EDT → Depart EWR Terminal B");
  });

  it("skips a stop with no time rather than printing a leg with no departure", () => {
    expect(nextLeg(DAYS, resolveTripDate, on("2026-07-09T06:00:00"))).toBe("≈04:55 KST → Land ICN Terminal 1");
  });

  it("moves to the next day once today's stops are behind it", () => {
    expect(nextLeg(DAYS, resolveTripDate, on("2026-07-10T07:00:00"))).toBe("08:30 → KTX to Daejeon");
  });

  it("counts the whole of today as ahead, not the hours left in it", () => {
    /* Comparing instants would retire the day at whatever hour the page was built, so a reader
       opening the guide at 23:00 would be told the next leg is tomorrow's — while today's
       08:30 train is still the thing they are looking at on the day card. */
    expect(nextLeg(DAYS, resolveTripDate, on("2026-07-10T23:30:00"))).toBe("08:30 → KTX to Daejeon");
  });

  it("⌁ says nothing once the trip is over", () => {
    // FALLBACKS §1: a finished trip gets no present moment invented for it.
    expect(nextLeg(DAYS, resolveTripDate, on("2026-07-20T09:00:00"))).toBeNull();
  });

  it("⌁ says nothing BEFORE the trip either, however real the first departure is", () => {
    /* The row is framed as the present ("Next · …"). Three weeks out the first departure is a
       real, sourced fact and still the wrong thing to print there, because the framing says it
       is happening now. Same window the what's-next banner beside it uses. */
    expect(nextLeg(DAYS, resolveTripDate, on("2026-06-20T09:00:00"))).toBeNull();
    // ...and it starts exactly on the first day, not the day after.
    expect(nextLeg(DAYS, resolveTripDate, on("2026-07-08T00:01:00"))).toBe("≈01:00 EDT → Depart EWR Terminal B");
  });

  it("⌁ says nothing when no stop anywhere carries a time", () => {
    const untimed = [{ date: "Wed Jul 8", waypoints: [{ name: "Gyeongbokgung" }] }];
    expect(nextLeg(untimed, resolveTripDate, on("2026-07-08T09:00:00"))).toBeNull();
  });

  it("⌁ says nothing for a guide whose days are not calendar dates", () => {
    // "Day 1" guides legitimately have no trip dates — resolveTripDate returns null and the
    // leg is absent, rather than the trip being assumed to start today.
    const relative = [{ date: "Day 1", waypoints: [{ name: "Arrive", time: "08:30" }] }];
    expect(nextLeg(relative, resolveTripDate, on("2026-07-08T09:00:00"))).toBeNull();
  });

  it("⌁ says nothing for a guide with no days at all", () => {
    expect(nextLeg([], resolveTripDate, on("2026-07-08T09:00:00"))).toBeNull();
    expect(nextLeg(null, resolveTripDate, on("2026-07-08T09:00:00"))).toBeNull();
    expect(nextLeg(undefined, resolveTripDate, on("2026-07-08T09:00:00"))).toBeNull();
  });

  it("reads the days in date order, not the order the file happens to list them in", () => {
    const shuffled = [DAYS[2], DAYS[0], DAYS[1]];
    expect(nextLeg(shuffled, resolveTripDate, on("2026-07-08T09:00:00"))).toBe("≈01:00 EDT → Depart EWR Terminal B");
  });
});
