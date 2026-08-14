// Tests for the case-11 leg-duration check. The behaviour that matters most is what it
// REFUSES to do: escalate. Routes is config-gated and default OFF by creator ruling, and the
// fixture MANIFEST fixes this case as "advisory... never fails", so a check that cannot run
// must degrade rather than break a run.
//
// The three layers are tested separately because they fail for different reasons: the prose
// count needs no coords, the physical floor needs coords but no key, and the live matrix needs
// both plus a network the tests never touch (injected fetcher, repo doctrine).

// @protects-file Transit durations are measured against a routing authority, or the gap is counted.

import { describe, it, expect } from "vitest";
import {
  extractLegDurations,
  parseTimeCell,
  haversineKm,
  extractDayLegs,
  checkPhysicalFloor,
  routesConfigured,
  verifyDayLegs,
  checkRoutes,
  liveRouteMatrix,
  PHYSICAL_MAX_KMH,
  OVERRUN_TOLERANCE_MIN,
} from "../audit/check-routes.mjs";

const leg = (over) => ({ title: "Getting around", body: "JR Senzan Line to Yamagata (≈70–90 min).", ...over });

// A day of scheduled stops. Coordinates are Seoul-area so distances are realistic.
const days = (waypoints, over = {}) => ({
  type: "days",
  group: "Days",
  items: [{ date: "Fri Jul 10", title: "Palaces", waypoints, ...over }],
});

describe("extractLegDurations", () => {
  it("finds a duration stated in transit context", () => {
    expect(extractLegDurations([leg()])).toHaveLength(1);
  });

  it("ignores a duration with no transit context — a dwell time is not a leg", () => {
    expect(extractLegDurations([{ title: "Sight", body: "Allow 45 min inside the museum." }])).toEqual([]);
  });

  it("counts a unit as sourced when its SECTION carries the source_url", () => {
    // An item under a sourced section is attested by that source; counting it unverified
    // would overstate the gap.
    const [a] = extractLegDurations([{ ...leg(), source_url: "https://jr.test/x" }]);
    expect(a.sourced).toBe(true);
    const [b] = extractLegDurations([{ title: "S", items: [{ name: "Leg", body: "bus ~35 min" }] }]);
    expect(b.sourced).toBe(false);
  });
});

describe("parseTimeCell", () => {
  it("reads a plain time and an approximated one identically — `≈` is notation, not data", () => {
    expect(parseTimeCell("08:00")).toEqual({ start: 480, end: 480 });
    expect(parseTimeCell("≈08:00")).toEqual({ start: 480, end: 480 });
  });

  it("reads a window as start AND end, so a windowed stop cannot inflate its own travel gap", () => {
    expect(parseTimeCell("10:00–16:30")).toEqual({ start: 600, end: 990 });
  });

  it("is null for a label with no clock time — 'morning' is not a time to measure from", () => {
    expect(parseTimeCell("morning")).toBeNull();
    expect(parseTimeCell(undefined)).toBeNull();
  });
});

describe("extractDayLegs", () => {
  const wp = (name, lat, lng, time) => ({ name, lat, lng, time });

  it("pairs consecutive coordinate-bearing waypoints into origin→destination legs", () => {
    const legs = extractDayLegs([days([wp("A", 37.5, 127.0, "09:00"), wp("B", 37.6, 127.1, "10:00"), wp("C", 37.7, 127.2, "11:00")])]);
    expect(legs.map((l) => `${l.from.name}→${l.to.name}`)).toEqual(["A→B", "B→C"]);
    expect(legs[0].gapMin).toBe(60);
  });

  it("measures the gap from the origin's END to the destination's START", () => {
    // The bug this pins: taking the range's start would call this a 420-minute travel window
    // when the traveller actually has 30 minutes, and the check could never fail.
    const [l] = extractDayLegs([days([wp("Expo", 36.37, 127.38, "10:00–16:30"), wp("DCC", 36.38, 127.39, "17:00")])]);
    expect(l.gapMin).toBe(30);
  });

  it("skips waypoints with no coordinates — a name alone is not an origin", () => {
    const legs = extractDayLegs([days([wp("A", 37.5, 127.0, "09:00"), { name: "B", time: "10:00" }, wp("C", 37.7, 127.2, "11:00")])]);
    expect(legs.map((l) => `${l.from.name}→${l.to.name}`)).toEqual(["A→C"]);
  });

  it("reports an unmeasurable gap as null rather than assuming it is fine", () => {
    const [l] = extractDayLegs([days([wp("A", 37.5, 127.0, "morning"), wp("B", 37.6, 127.1, "evening")])]);
    expect(l.gapMin).toBeNull();
  });

  it("ignores non-days sections entirely", () => {
    expect(extractDayLegs([leg(), { type: "map", points: [wp("A", 1, 2)] }])).toEqual([]);
  });
});

describe("checkPhysicalFloor", () => {
  it("flags a leg no ground transport could make in the scheduled gap", () => {
    // Seoul → Busan is ~325 km straight-line; 10 minutes is impossible at any speed.
    const [f] = checkPhysicalFloor([
      { date: "D1", gapMin: 10, from: { name: "Seoul", lat: 37.5665, lng: 126.978 }, to: { name: "Busan", lat: 35.1796, lng: 129.0756 } },
    ]);
    expect(f.code).toBe("leg-physically-impossible");
  });

  it("does NOT flag a real KTX leg — the floor is physics, not a realistic speed", () => {
    // Seoul→Daejeon, 142 km straight-line in the 60 minutes the korea guide schedules. A
    // realistic 80 km/h ceiling called this impossible during calibration; it is not.
    expect(
      checkPhysicalFloor([
        { date: "D1", gapMin: 60, from: { name: "Seoul Station", lat: 37.5551, lng: 126.9707 }, to: { name: "Daejeon Station", lat: 36.3323, lng: 127.4344 } },
      ]),
    ).toEqual([]);
  });

  it("does NOT flag the windowed-stop convention — the real corpus' only two floor hits", () => {
    // korea's "17:00–21:00 jimjilbang" → "~21:00 dinner" computes to a 0-minute window over
    // 2 km. That is how an itinerary is written, not a day that cannot happen; before
    // FLOOR_GRANULARITY_MIN existed this layer flagged both of these and its zero-false-
    // positive claim was untrue.
    expect(
      checkPhysicalFloor([
        { date: "Thu Jul 9", gapMin: 0, from: { name: "SPAREX", lat: 37.5709, lng: 127.009 }, to: { name: "Dinner", lat: 37.5705, lng: 126.9877 } },
        { date: "Mon Jul 13", gapMin: 0, from: { name: "Lunch", lat: 35.1631, lng: 129.1635 }, to: { name: "T1 Base", lat: 35.1607, lng: 129.1636 } },
      ]),
    ).toEqual([]);
  });

  it("says nothing about a leg with no measurable gap", () => {
    expect(checkPhysicalFloor([{ date: "D1", gapMin: null, from: { lat: 0, lng: 0 }, to: { lat: 40, lng: 40 } }])).toEqual([]);
  });

  it("uses a straight-line lower bound, so its verdict can never be beaten by a real route", () => {
    // The chord is shorter than any road or rail between the same two points, which is what
    // makes a violation of this floor unarguable rather than a modelling opinion.
    expect(haversineKm({ lat: 37.5665, lng: 126.978 }, { lat: 35.1796, lng: 129.0756 })).toBeGreaterThan(300);
    expect(PHYSICAL_MAX_KMH).toBeGreaterThanOrEqual(300);
  });
});

describe("routesConfigured", () => {
  it("is false without a key and true with one — inert until configured", () => {
    expect(routesConfigured({ apiKey: undefined })).toBe(false);
    expect(routesConfigured({ apiKey: "k" })).toBe(true);
  });
});

describe("verifyDayLegs", () => {
  const dayOf = (n, gapMin) =>
    Array.from({ length: n }, (_, i) => ({
      date: "D1",
      stops: n + 1,
      gapMin,
      from: { name: `A${i}`, lat: 37.5 + i / 100, lng: 127 },
      to: { name: `A${i + 1}`, lat: 37.5 + (i + 1) / 100, lng: 127 },
    }));

  it("flags only an OVERRUN — a gap larger than the drive is dwell time, not a defect", async () => {
    const fetchMatrix = async () => [{ originIndex: 0, destinationIndex: 0, durationMin: 20 }];
    const under = await verifyDayLegs(dayOf(1, 90), { fetchMatrix, minStops: 2 });
    expect(under.findings).toEqual([]);
    const over = await verifyDayLegs(dayOf(1, 0), { fetchMatrix, minStops: 2 });
    expect(over.findings.map((f) => f.code)).toEqual(["leg-overruns-schedule"]);
  });

  it("tolerates overrun inside the granularity threshold", async () => {
    const fetchMatrix = async () => [{ originIndex: 0, destinationIndex: 0, durationMin: 10 }];
    const r = await verifyDayLegs(dayOf(1, 10 - OVERRUN_TOLERANCE_MIN + 1), { fetchMatrix, minStops: 2 });
    expect(r.findings).toEqual([]);
  });

  it("reads only the matrix diagonal — the cross product's off-diagonal cells are other pairs", async () => {
    const fetchMatrix = async () => [
      { originIndex: 0, destinationIndex: 1, durationMin: 999 },
      { originIndex: 0, destinationIndex: 0, durationMin: 5 },
      { originIndex: 1, destinationIndex: 1, durationMin: 5 },
    ];
    const r = await verifyDayLegs(dayOf(2, 60), { fetchMatrix, minStops: 2 });
    expect(r.verified).toBe(2);
    expect(r.findings).toEqual([]);
  });

  it("spends one matrix call per day, and skips days under the stop budget", async () => {
    let calls = 0;
    const fetchMatrix = async () => { calls++; return []; };
    const legs = [...dayOf(3, 60), ...dayOf(1, 60).map((l) => ({ ...l, date: "D2", stops: 2 }))];
    const r = await verifyDayLegs(legs, { fetchMatrix, minStops: 3 });
    expect(calls).toBe(1);
    expect(r.queried).toBe(1);
  });

  it("degrades when the Routes API is unreachable instead of inventing a verdict", async () => {
    // Boundary check #2 — the fallback path executed, not assumed. An API that is down says
    // nothing about the guide, so the finding must name the outage, never the itinerary.
    const fetchMatrix = async () => { throw new Error("ECONNREFUSED"); };
    const r = await verifyDayLegs(dayOf(1, 5), { fetchMatrix, minStops: 2 });
    expect(r.findings.map((f) => f.code)).toEqual(["routes-unreachable"]);
    expect(r.findings[0].msg).toContain("ECONNREFUSED");
  });

  it("is n/a with no fetcher and with no day meeting the stop budget", async () => {
    expect((await verifyDayLegs(dayOf(1, 60), {})).status).toBe("n/a");
    expect((await verifyDayLegs(dayOf(1, 60), { fetchMatrix: async () => [], minStops: 5 })).status).toBe("n/a");
  });
});

describe("liveRouteMatrix", () => {
  it("returns null with no key — an unconfigured repo does zero work", () => {
    expect(liveRouteMatrix({ apiKey: "" })).toBeNull();
  });

  it("names endpoint, key header and field mask explicitly, and converts Google's seconds", async () => {
    // Boundary check #4: nothing here is resolved ambiently from a client library's defaults.
    let seen;
    const fetchImpl = async (url, init) => {
      seen = { url, init };
      return { ok: true, json: async () => [{ originIndex: 0, destinationIndex: 0, duration: "1200s", condition: "ROUTE_EXISTS" }] };
    };
    const fetchMatrix = liveRouteMatrix({ apiKey: "k", fetchImpl });
    const rows = await fetchMatrix([{ lat: 1, lng: 2 }], [{ lat: 3, lng: 4 }], "DRIVE");
    expect(seen.url).toBe("https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix");
    expect(seen.init.headers["X-Goog-Api-Key"]).toBe("k");
    expect(seen.init.headers["X-Goog-FieldMask"]).toContain("duration");
    expect(JSON.parse(seen.init.body).travelMode).toBe("DRIVE");
    expect(rows[0].durationMin).toBe(20);
  });

  it("throws on a non-2xx so verifyDayLegs reports the outage rather than a silent pass", async () => {
    const fetchMatrix = liveRouteMatrix({ apiKey: "k", fetchImpl: async () => ({ ok: false, status: 403 }) });
    await expect(fetchMatrix([{ lat: 1, lng: 2 }], [{ lat: 3, lng: 4 }])).rejects.toThrow("403");
  });
});

describe("checkRoutes", () => {
  it("is ADVISORY, never fail, when legs are unattested and no key is set", () => {
    const r = checkRoutes([leg()], { apiKey: undefined });
    expect(r.status).toBe("advisory");
    expect(r.configured).toBe(false);
    expect(r.findings.map((f) => f.code)).toEqual(["leg-duration-unverified", "routes-not-configured"]);
  });

  it("counts attested vs total rather than flagging each leg individually", () => {
    const r = checkRoutes([leg({ source_url: "https://jr.test/x" }), leg({ title: "B" })], { apiKey: undefined });
    expect(r.legs).toBe(2);
    expect(r.unverified).toBe(1);
  });

  it("runs the physical floor with no key at all — the free layer needs coords, not credentials", () => {
    const r = checkRoutes(
      [days([{ name: "Seoul", lat: 37.5665, lng: 126.978, time: "09:00" }, { name: "Busan", lat: 35.1796, lng: 129.0756, time: "09:10" }])],
      { apiKey: undefined },
    );
    expect(r.findings.map((f) => f.code)).toContain("leg-physically-impossible");
    expect(r.configured).toBe(false);
  });

  it("says how many scheduled legs it could NOT judge, so silence never reads as a pass", () => {
    const r = checkRoutes(
      [days([{ name: "A", lat: 55.6, lng: 12.5, time: "morning" }, { name: "B", lat: 55.7, lng: 12.6, time: "evening" }])],
      { apiKey: undefined },
    );
    const f = r.findings.find((x) => x.code === "leg-gap-unjudgeable");
    expect(f.count).toBe(1);
    expect(r.judgeable).toBe(0);
  });

  it("with a key but no coordinate-bearing day, names the missing substrate exactly", () => {
    const r = checkRoutes([leg()], { apiKey: "k" });
    expect(r.configured).toBe(true);
    expect(r.findings.map((f) => f.code)).toContain("routes-no-day-legs");
    expect(r.status).toBe("advisory");
  });

  it("folds the live layer's findings into the row when verify threads one in", () => {
    const live = { status: "advisory", queried: 1, verified: 2, findings: [{ code: "leg-overruns-schedule", msg: "x" }] };
    const r = checkRoutes([leg()], { apiKey: "k", live });
    expect(r.findings.map((f) => f.code)).toContain("leg-overruns-schedule");
    expect(r.live).toEqual({ queried: 1, verified: 2, status: "advisory" });
  });

  it("is n/a for a guide that asserts no leg durations at all", () => {
    expect(checkRoutes([{ title: "Money", body: "Cash is common." }]).status).toBe("n/a");
  });

  it("never returns 'fail' under any input — the ruling this check exists under", () => {
    const impossible = days([{ name: "A", lat: 37, lng: 127, time: "09:00" }, { name: "B", lat: 35, lng: 129, time: "09:01" }]);
    const inputs = [[], [leg()], [leg({ source_url: "https://x.test" })], [impossible], [leg(), impossible]];
    for (const input of inputs) {
      expect(checkRoutes(input, { apiKey: undefined }).status).not.toBe("fail");
      expect(checkRoutes(input, { apiKey: "k" }).status).not.toBe("fail");
    }
  });
});
