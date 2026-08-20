// @protects-file The cockpit's live panels render only telemetry that names THIS run, and
// degrade to empty rather than throwing when the file they read is malformed or a version off.

import { describe, it, expect } from "vitest";
import {
  parseRunEvents, pushBounded, fetchTone, fetchHost, eventsForRun,
  EMPTY_RUN_EVENTS, FETCH_BUFFER, DECISION_BUFFER,
} from "./run-events";
import { RUN_EVENTS } from "../mocks/seeds";

/** Every parse fixture carries the identity the emitter always stamps — identity-refusal has
 *  its own dedicated cases below. */
const RID = "testland-20260719-abc123";

describe("parseRunEvents", () => {
  it("reports unavailable for everything that isn't a telemetry object", () => {
    // null is the V1 / no-run case: the gateway's read 404s (V2 emits events.json; V1 never does).
    for (const bad of [null, undefined, "", 0, [], [{ url: "x" }], "not json"]) {
      expect(parseRunEvents(bad)).toEqual(EMPTY_RUN_EVENTS);
    }
  });

  it("reports unavailable for a well-formed file that carries nothing recognisable", () => {
    // Four panels lit up over permanently blank content is a worse lie than an admitted gap.
    expect(parseRunEvents({ runId: RID })).toEqual(EMPTY_RUN_EVENTS);
    expect(parseRunEvents({ runId: RID, fetches: [], decisions: [], nuggets: [], counters: {} })).toEqual(EMPTY_RUN_EVENTS);
    expect(parseRunEvents({ runId: RID, fetches: "lots", version: 9 })).toEqual(EMPTY_RUN_EVENTS);
  });

  it("REFUSES a stream with no run identity — stale pre-scoping files read as unavailable", () => {
    // A file that cannot say which run it belongs to cannot be rendered against ANY run: an old
    // main events.json surviving from a previous run must never light the panels for a new one.
    const identityless = { ...JSON.parse(JSON.stringify(RUN_EVENTS)) } as Record<string, unknown>;
    delete identityless.runId;
    expect(parseRunEvents(identityless)).toEqual(EMPTY_RUN_EVENTS);
    expect(parseRunEvents({ ...identityless, runId: "" })).toEqual(EMPTY_RUN_EVENTS);
    expect(parseRunEvents({ ...identityless, runId: 42 })).toEqual(EMPTY_RUN_EVENTS);
  });

  it("round-trips the shape the emitter will write", () => {
    const parsed = parseRunEvents(JSON.parse(JSON.stringify(RUN_EVENTS)));
    expect(parsed.available).toBe(true);
    expect(parsed.fetches).toHaveLength(4);
    expect(parsed.decisions.map((d) => d.kind)).toEqual(["check", "reject", "decision"]);
    expect(parsed.nuggets).toHaveLength(1);
    expect(parsed.counters).toEqual({ pages: 148, facts: 62, kept: 51, dropped: 11 });
  });

  it("drops rows missing the field that makes them meaningful", () => {
    const out = parseRunEvents({
      runId: RID,
      fetches: [{ at: "t", status: 200 }, null, "nope", { url: "https://a.test", status: 200 }],
      decisions: [{ at: "t", text: "  " }, { at: "t", text: "kept it" }],
      // A nugget with no source is the unverified assertion this whole project exists not to ship.
      nuggets: [{ text: "sourceless claim" }, { text: "with a source", source: "Operator page" }],
    });
    expect(out.fetches.map((f) => f.url)).toEqual(["https://a.test"]);
    expect(out.decisions.map((d) => d.text)).toEqual(["kept it"]);
    expect(out.nuggets.map((n) => n.text)).toEqual(["with a source"]);
  });

  it("falls back on unknown or missing scalars instead of trusting them", () => {
    const out = parseRunEvents({
      runId: RID,
      fetches: [{ url: "https://a.test", status: "200" }],
      decisions: [{ text: "a judgment", kind: "sideways" }],
      counters: { pages: 3.7, facts: "many" },
    });
    expect(out.fetches[0]).toEqual({ at: "", url: "https://a.test", status: 0 });
    expect(out.decisions[0].kind).toBe("check");
    expect(out.counters).toEqual({ pages: 3, facts: 0, kept: 0, dropped: 0 });
  });

  it("keeps only the most recent entries, so an hour-long run can't grow without bound", () => {
    const many = (n: number, make: (i: number) => unknown) => Array.from({ length: n }, (_, i) => make(i));
    const out = parseRunEvents({
      runId: RID,
      fetches: many(FETCH_BUFFER + 10, (i) => ({ url: `https://a.test/${i}`, status: 200 })),
      decisions: many(DECISION_BUFFER + 10, (i) => ({ text: `d${i}` })),
    });
    expect(out.fetches).toHaveLength(FETCH_BUFFER);
    expect(out.fetches[FETCH_BUFFER - 1].url).toBe(`https://a.test/${FETCH_BUFFER + 9}`);
    expect(out.decisions).toHaveLength(DECISION_BUFFER);
    expect(out.decisions[0].text).toBe("d10");
  });
});

describe("eventsForRun — the identity join (correction pass)", () => {
  const stream = parseRunEvents(JSON.parse(JSON.stringify(RUN_EVENTS)));

  it("renders a stream only against the run it names", () => {
    expect(eventsForRun(stream, RID)).toBe(stream);
  });

  it("a MISMATCHED run renders honest-empty — never another run's feed", () => {
    // The concrete failure this pins: run B is active on the branch while main still serves run
    // A's events.json — the page must show current-run empty, not A's stale stream.
    expect(eventsForRun(stream, "testland-20260801-ffffff")).toEqual(EMPTY_RUN_EVENTS);
  });

  it("a V1 run (no runId on the snapshot) never displays V2 telemetry from main", () => {
    expect(eventsForRun(stream, null)).toEqual(EMPTY_RUN_EVENTS);
    expect(eventsForRun(stream, undefined)).toEqual(EMPTY_RUN_EVENTS);
  });

  it("an unavailable stream passes through — the honest empty stays the honest empty", () => {
    expect(eventsForRun(EMPTY_RUN_EVENTS, RID)).toBe(EMPTY_RUN_EVENTS);
  });
});

describe("pushBounded", () => {
  it("appends without mutating, and drops from the front at the cap", () => {
    const a = [1, 2, 3];
    const b = pushBounded(a, 4, 3);
    expect(a).toEqual([1, 2, 3]);
    expect(b).toEqual([2, 3, 4]);
    expect(pushBounded([], 1, 3)).toEqual([1]);
  });
});

describe("fetchTone", () => {
  it("paints success, cache hits, client errors and dead requests differently", () => {
    expect(fetchTone(200)).toBe("green");
    expect(fetchTone(299)).toBe("green");
    expect(fetchTone(304)).toBe("muted");
    expect(fetchTone(404)).toBe("warn");
    expect(fetchTone(429)).toBe("warn");
    expect(fetchTone(503)).toBe("crit");
    expect(fetchTone(0)).toBe("crit"); // never completed
  });
});

describe("fetchHost", () => {
  it("shows the host without the www, and survives a string that isn't a URL", () => {
    expect(fetchHost("https://www.visitdenmark.com/denmark/plan")).toBe("visitdenmark.com");
    expect(fetchHost("https://dsb.dk/en/")).toBe("dsb.dk");
    expect(fetchHost("not a url")).toBe("not a url");
    expect(fetchHost("")).toBe("");
  });
});

/* ── M7: late telemetry keeps being looked for ────────────────────────────────────────────── */

import { probeEventsThisTick, EVENT_PROBES, EVENT_RECHECK_EVERY } from "./run-events";

describe("probeEventsThisTick (M7)", () => {
  it("probes every tick until the first misses are spent", () => {
    for (let m = 0; m < EVENT_PROBES; m++) {
      expect(probeEventsThisTick({ pollIndex: m + 1, misses: m, active: true, seen: false })).toBe(true);
    }
  });

  it("keeps LOOKING while the run is active — every Nth tick, not never", () => {
    expect(probeEventsThisTick({ pollIndex: EVENT_RECHECK_EVERY, misses: 10, active: true, seen: false })).toBe(true);
    expect(probeEventsThisTick({ pollIndex: EVENT_RECHECK_EVERY + 1, misses: 10, active: true, seen: false })).toBe(false);
    expect(probeEventsThisTick({ pollIndex: EVENT_RECHECK_EVERY * 5, misses: 99, active: true, seen: false })).toBe(true);
  });

  it("always probes once telemetry has been seen — it is live data now", () => {
    expect(probeEventsThisTick({ pollIndex: 7, misses: 50, active: true, seen: true })).toBe(true);
  });

  it("never probes a finished run — nothing new can appear", () => {
    expect(probeEventsThisTick({ pollIndex: EVENT_RECHECK_EVERY, misses: 0, active: false, seen: false })).toBe(false);
  });
});
