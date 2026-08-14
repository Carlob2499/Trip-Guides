// Case 11 (docs/PLAN_EVIDENCE_FIRST.md, fixture MANIFEST) — transit leg durations asserted
// without a routing authority behind them.
//
// THE DEFECT. Guides state inter-stop durations as honest estimates — "JR Senzan Line to
// Yamagata (≈70–90 min) then a local bus (≈35–40 min)". The `≈` is correct notation under
// verification-rules.md §4, but nothing ever checks the leg against an authority, so a
// rerouted line or a withdrawn bus service reads exactly like a good estimate. This is the
// one defect class in the fixture that is systemic rather than particular: every guide in the
// corpus has it (korea 12 units, denmark 17, us 3, fixture 14).
//
// ADVISORY, ALWAYS — BY DESIGN, NOT BY TIMIDITY. The creator settled Google Routes as
// config-gated and default OFF (clarifying question 4), and the fixture MANIFEST states the
// consequence explicitly: "with no key the check degrades to advisory and never fails, so H1
// must assert the advisory finding, not a blocker." A count that fires on every guide is
// therefore the CORRECT behaviour here — it is a standing measurement of how much of a guide's
// transit is unattested, not a pass/fail gate.
//
// THREE LAYERS, cheapest first — the structural blocker that stalled this check is GONE.
// The earlier version of this file said live verification was blocked because "the durations
// live in prose with no machine-readable origin→destination pair to query". That was true of
// the PROSE legs and false of the guide as a whole: the plan's own Routes row (line 197) names
// the real substrate — "verify inter-stop transit durations at reconcile for SCHEDULED DAY
// LEGS", and `days[].waypoints[]` already carries `{name, lat, lng, time}`. Consecutive
// waypoints ARE the origin→destination pairs. So:
//
//   1. PROSE COUNT (no key, no coords) — how many leg durations carry no source at all.
//   2. PHYSICAL FLOOR (no key, needs coords) — a straight-line distance that no ground
//      transport on earth could cover in the scheduled gap. Free, offline, and zero-false-
//      positive by construction; see PHYSICAL_MAX_KMH.
//   3. LIVE MATRIX (needs a key) — ask Routes what the leg actually takes and compare it to
//      the gap the schedule allots. One computeRouteMatrix call per day, only for days with
//      ≥3 scheduled stops, exactly the budget the plan fixed.
//
// Layers 1–2 run on every verify. Layer 3 is computed by verify() under --network and threaded
// in as `live`, the same shape E2's drift check uses, so this module stays synchronous and the
// network I/O has one owner.

const MINUTES = /(?:≈|~|about\s)?\d{1,3}\s?(?:–|-|to\s)?\s?\d{0,3}\s?min\b/i;
const TRANSIT = /\b(line|train|bus|subway|metro|ferry|tram|shinkansen|JR\s|ride|transfer|walk)\b/i;

/** Fastest scheduled ground transport anywhere in the corpus' reach, rounded up hard: KTX tops
    out near 305 km/h and the Shinkansen near 320. Straight-line distance is a LOWER bound on
    the real route (rail bends, roads bend), so `haversine / 300 km/h` is a floor no ground leg
    can beat — a gap under it is not "tight", it is impossible. Deliberately not a realistic
    speed: this layer must never fire on a merely-optimistic schedule, only on a broken one.
    Calibrated 2026-08-14 on all four guides (18 coord'd legs): at a realistic 80 km/h it
    flagged both Korea KTX legs — Seoul→Daejeon and Daejeon→Busan — which are correct. At 300
    it flags nothing in the corpus, which is the right answer for a corpus with no broken day. */
export const PHYSICAL_MAX_KMH = 300;

/** A waypoint `time` is a display label at minute granularity, and the convention for a windowed
    stop is to end it at the clock time the next stop begins — korea's "17:00–21:00 jimjilbang"
    → "~21:00 dinner", and "14:15–15:30 lunch" → "15:30 base camp". Both compute to a 0-minute
    travel window over a real 2 km and 0.3 km, and both are how a human writes an itinerary, not
    a day that cannot happen. Calibrated 2026-08-14: those two legs are the ONLY physical-floor
    hits in the whole corpus, and 5 minutes of slack removes both while leaving any genuinely
    broken leg (short of the floor by tens of minutes) firing. Without this the layer's whole
    claim — zero false positives by construction — is simply false. */
export const FLOOR_GRANULARITY_MIN = 5;

/** Live overrun below this is schedule granularity, not a defect: a 4-minute walk booked into a
    0-minute gap between a lunch window ending 15:30 and a 15:30 stop is how humans write
    itineraries, not a plan that fails. A quarter-hour of overrun is a real break in the day. */
export const OVERRUN_TOLERANCE_MIN = 15;

/** Pure: every unit (section or item) asserting a transit-leg duration, split by whether it
    carries provenance. A unit inherits its section's `source_url` — an item under a sourced
    section is attested by that source, and counting it as unverified would overstate the gap. */
export function extractLegDurations(sections = []) {
  const legs = [];
  for (const s of sections ?? []) {
    for (const unit of [s, ...(s?.items ?? [])]) {
      const text = JSON.stringify(unit);
      if (!MINUTES.test(text) || !TRANSIT.test(text)) continue;
      legs.push({
        label: unit?.name || unit?.title || s?.title || s?.group || "(untitled)",
        sourced: Boolean(unit?.source_url || s?.source_url),
      });
    }
  }
  return legs;
}

/** A waypoint `time` is a display label, not a timestamp — "08:00", "≈14:30", "10:00–16:30",
    "morning", "from 11:30". Parse the clock times out of it as `{start, end}` minutes since
    midnight; a single time makes start === end. Returns null for a label with no clock time,
    which is honest: denmark schedules its days as "morning"/"evening" and no gap exists to
    measure. Never guesses a duration from a word. */
export function parseTimeCell(label) {
  const times = [...String(label ?? "").matchAll(/(\d{1,2}):(\d{2})/g)]
    .map((m) => Number(m[1]) * 60 + Number(m[2]))
    .filter((t) => t >= 0 && t < 24 * 60);
  if (!times.length) return null;
  return { start: times[0], end: times[times.length - 1] };
}

/** Great-circle km. Used only as a LOWER bound (see PHYSICAL_MAX_KMH) — never presented to the
    reader as a distance, because the real route is always longer than the chord. */
import { haversineKm } from "../lib/geo.mjs";
export { haversineKm };

/**
 * The machine-readable origin→destination pairs, at last: consecutive coordinate-bearing
 * waypoints within one day.
 *
 * GAP SEMANTICS. The travel window is the origin's LAST stated time to the destination's
 * FIRST — "10:00–16:30" → "17:00" is a 30-minute window, not 420 minutes. Using the range's
 * start for the origin would silently inflate every windowed stop's budget and make the check
 * unable to fail. `gapMin: null` (a stop with no clock time) means unjudgeable, and is
 * reported as such rather than assumed fine.
 */
export function extractDayLegs(sections = [], { minStops = 2 } = {}) {
  const legs = [];
  for (const s of sections ?? []) {
    if (s?.type !== "days") continue;
    for (const day of s.items ?? []) {
      const stops = (day?.waypoints ?? []).filter(
        (w) => typeof w?.lat === "number" && typeof w?.lng === "number",
      );
      if (stops.length < minStops) continue;
      for (let i = 0; i < stops.length - 1; i++) {
        const from = stops[i];
        const to = stops[i + 1];
        const a = parseTimeCell(from.time);
        const b = parseTimeCell(to.time);
        const gapMin = a && b ? b.start - a.end : null;
        legs.push({
          date: day.date,
          dayTitle: day.title,
          stops: stops.length,
          from: { name: from.name, lat: from.lat, lng: from.lng },
          to: { name: to.name, lat: to.lat, lng: to.lng },
          gapMin: gapMin !== null && gapMin >= 0 ? gapMin : null,
        });
      }
    }
  }
  return legs;
}

/** Layer 2 — findings for legs the schedule cannot physically contain. No key, no network. */
export function checkPhysicalFloor(legs = []) {
  const findings = [];
  for (const leg of legs) {
    if (leg.gapMin === null) continue;
    const km = haversineKm(leg.from, leg.to);
    const floorMin = (km / PHYSICAL_MAX_KMH) * 60;
    if (leg.gapMin >= floorMin - FLOOR_GRANULARITY_MIN) continue;
    findings.push({
      code: "leg-physically-impossible",
      date: leg.date,
      msg:
        `${leg.date}: "${leg.from.name}" → "${leg.to.name}" is ${km.toFixed(0)} km in a straight ` +
        `line but the schedule allows ${leg.gapMin} min — under ${Math.ceil(floorMin)} min, which ` +
        `not even ${PHYSICAL_MAX_KMH} km/h rail could cover. A stated time or a coordinate is wrong`,
    });
  }
  return findings;
}

/** Is live route verification available? Inert until a key is configured — the Places
    precedent (`lookup-venue.mjs`), and the creator's default-OFF ruling. `GOOGLE_ROUTES_KEY`
    is the name the plan fixed (line 197, "Key = GH secret GOOGLE_ROUTES_KEY"); the older
    `ROUTES_API_KEY` this file shipped with stays as an alias rather than silently ignoring a
    key someone already set. */
export function routesConfigured({
  apiKey = process.env.GOOGLE_ROUTES_KEY || process.env.ROUTES_API_KEY,
} = {}) {
  return Boolean(apiKey);
}

/**
 * Layer 3, async and network-bearing — verify each day's legs against Routes.
 *
 * `fetchMatrix(origins, destinations, mode)` resolves to a list of
 * `{originIndex, destinationIndex, durationMin, status}`; injectable so tests are zero-network
 * per repo doctrine. One call per day and only for days with ≥3 scheduled stops, which is the
 * plan's stated budget — a two-stop day is a single leg and not worth a billed request.
 *
 * The verdict is ASYMMETRIC on purpose. A gap is travel PLUS dwell at the origin, so a gap
 * larger than the live duration proves nothing and is not a finding. Only a gap SMALLER than
 * the live duration says something real: the day as written cannot be walked, driven or ridden.
 */
export async function verifyDayLegs(legs = [], { fetchMatrix, travelMode = "TRANSIT", minStops = 3 } = {}) {
  if (typeof fetchMatrix !== "function") {
    return { status: "n/a", reason: "no matrix fetcher", findings: [], queried: 0, verified: 0 };
  }
  const byDate = new Map();
  for (const leg of legs) {
    if (leg.stops < minStops) continue;
    if (!byDate.has(leg.date)) byDate.set(leg.date, []);
    byDate.get(leg.date).push(leg);
  }
  if (!byDate.size) {
    return {
      status: "n/a",
      reason: `no day has ${minStops}+ coordinate-bearing waypoints — nothing to query`,
      findings: [],
      queried: 0,
      verified: 0,
    };
  }

  const findings = [];
  let queried = 0;
  let verified = 0;
  for (const [date, dayLegs] of byDate) {
    const origins = dayLegs.map((l) => l.from);
    const destinations = dayLegs.map((l) => l.to);
    let rows;
    try {
      rows = await fetchMatrix(origins, destinations, travelMode);
      queried++;
    } catch (err) {
      // An unreachable routing API is not evidence about the guide — say so and move on,
      // exactly as E2's drift check treats an unreachable source page.
      findings.push({
        code: "routes-unreachable",
        date,
        msg: `could not reach the Routes API for ${date} (${String(err?.message || err)}) — these legs are simply untested`,
      });
      continue;
    }
    // computeRouteMatrix returns the full cross product; the consecutive legs are the diagonal.
    const diagonal = new Map();
    for (const r of rows ?? []) {
      if (r?.originIndex === r?.destinationIndex) diagonal.set(r.originIndex, r);
    }
    for (let i = 0; i < dayLegs.length; i++) {
      const leg = dayLegs[i];
      const row = diagonal.get(i);
      if (!row || typeof row.durationMin !== "number") continue;
      verified++;
      leg.liveMin = row.durationMin;
      if (leg.gapMin === null) continue;
      const overrun = row.durationMin - leg.gapMin;
      if (overrun <= OVERRUN_TOLERANCE_MIN) continue;
      findings.push({
        code: "leg-overruns-schedule",
        date,
        msg:
          `${date}: Routes puts "${leg.from.name}" → "${leg.to.name}" at ${Math.round(row.durationMin)} min ` +
          `by ${travelMode.toLowerCase()}, but the schedule allows ${leg.gapMin} min — ${Math.round(overrun)} min over ` +
          `(tolerance ${OVERRUN_TOLERANCE_MIN} min). Every entry can be true and the day still be impossible`,
      });
    }
  }
  return { status: findings.length ? "advisory" : "pass", findings, queried, verified, travelMode };
}

/**
 * Advisory report for one guide. Never returns "fail": the MANIFEST fixes this as advisory,
 * and an absent key must degrade rather than break.
 *
 * `live` is `verifyDayLegs`' result, threaded in by verify() under --network (the drift-check
 * pattern) so this stays synchronous.
 */
export function checkRoutes(sections = [], { apiKey, live = null } = {}) {
  const legs = extractLegDurations(sections);
  const dayLegs = extractDayLegs(sections);
  const floorFindings = checkPhysicalFloor(dayLegs);
  const judgeable = dayLegs.filter((l) => l.gapMin !== null).length;

  if (!legs.length && !dayLegs.length) {
    return { status: "n/a", reason: "no transit-leg durations found", findings: [], legs: 0, unverified: 0, dayLegs: 0 };
  }

  const unverified = legs.filter((l) => !l.sourced);
  const configured = routesConfigured(apiKey === undefined ? {} : { apiKey });
  const findings = [...floorFindings];

  if (unverified.length) {
    const sample = unverified.slice(0, 3).map((l) => `"${l.label}"`).join(", ");
    findings.push({
      code: "leg-duration-unverified",
      count: unverified.length,
      msg:
        `${unverified.length} of ${legs.length} transit-leg duration(s) carry no source — e.g. ${sample}. ` +
        `An \`≈\` is honest notation, but nothing has checked these legs against a routing authority`,
    });
  }

  // What the free layers could NOT judge, said out loud rather than counted as clean: a day
  // scheduled as "morning"/"evening" has no gap to measure, and silence there would read as a
  // pass it never earned.
  if (dayLegs.length && judgeable < dayLegs.length) {
    findings.push({
      code: "leg-gap-unjudgeable",
      count: dayLegs.length - judgeable,
      msg:
        `${dayLegs.length - judgeable} of ${dayLegs.length} scheduled day leg(s) have no clock time on ` +
        `both ends, so no travel window exists to test — add \`time\` to those waypoints to make them checkable`,
    });
  }

  if (live) findings.push(...live.findings);

  if (!configured) {
    findings.push({
      code: "routes-not-configured",
      msg:
        "GOOGLE_ROUTES_KEY is not set, so leg durations are checked only against the physical " +
        "floor, never a live routing authority — this check is advisory by design " +
        "(config-gated, default OFF) and never fails a run",
    });
  } else if (!dayLegs.length) {
    findings.push({
      code: "routes-no-day-legs",
      msg:
        "a Routes key is set, but no day carries coordinate-bearing `waypoints` to query — " +
        "live verification needs `days[].waypoints[].lat/lng`, which is what turns a prose leg " +
        "into an origin→destination pair",
    });
  }

  return {
    status: findings.length ? "advisory" : "pass",
    configured,
    findings,
    legs: legs.length,
    unverified: unverified.length,
    dayLegs: dayLegs.length,
    judgeable,
    live: live ? { queried: live.queried, verified: live.verified, status: live.status } : null,
  };
}

/**
 * Live `computeRouteMatrix` fetcher. Boundary-check doctrine #4 (explicit over ambient): the
 * field mask, the endpoint and the mode are named here, never inherited from a client library's
 * defaults. Returns minutes so nothing downstream parses Google's "1234s" duration strings.
 */
export function liveRouteMatrix({
  apiKey = process.env.GOOGLE_ROUTES_KEY || process.env.ROUTES_API_KEY,
  fetchImpl = fetch,
  timeoutMs = 15000,
} = {}) {
  if (!apiKey) return null;
  const waypoint = (p) => ({ waypoint: { location: { latLng: { latitude: p.lat, longitude: p.lng } } } });
  return async (origins, destinations, travelMode = "TRANSIT") => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetchImpl("https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix", {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "content-type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "originIndex,destinationIndex,duration,condition",
        },
        body: JSON.stringify({
          origins: origins.map(waypoint),
          destinations: destinations.map(waypoint),
          travelMode,
        }),
      });
      if (!res.ok) throw new Error(`Routes API ${res.status}`);
      const rows = await res.json();
      return (Array.isArray(rows) ? rows : []).map((r) => ({
        originIndex: r.originIndex ?? 0,
        destinationIndex: r.destinationIndex ?? 0,
        status: r.condition,
        durationMin:
          typeof r.duration === "string" ? Number(r.duration.replace(/s$/, "")) / 60 : undefined,
      }));
    } finally {
      clearTimeout(t);
    }
  };
}
