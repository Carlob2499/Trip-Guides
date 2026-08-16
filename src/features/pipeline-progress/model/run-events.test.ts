// @protects-file The cockpit's live panels stay honestly empty until real telemetry exists, and
// degrade to empty rather than throwing when the file they read is malformed or a version off.

import { describe, it, expect } from "vitest";
import {
  parseRunEvents, pushBounded, fetchTone, fetchHost,
  EMPTY_RUN_EVENTS, FETCH_BUFFER, DECISION_BUFFER,
} from "./run-events";
import { RUN_EVENTS } from "../mocks/seeds";

describe("parseRunEvents", () => {
  it("reports unavailable for everything that isn't a telemetry object", () => {
    // null is the every-day case: the gateway's read 404s because nothing emits this file yet.
    for (const bad of [null, undefined, "", 0, [], [{ url: "x" }], "not json"]) {
      expect(parseRunEvents(bad)).toEqual(EMPTY_RUN_EVENTS);
    }
  });

  it("reports unavailable for a well-formed file that carries nothing recognisable", () => {
    // Four panels lit up over permanently blank content is a worse lie than an admitted gap.
    expect(parseRunEvents({})).toEqual(EMPTY_RUN_EVENTS);
    expect(parseRunEvents({ fetches: [], decisions: [], nuggets: [], counters: {} })).toEqual(EMPTY_RUN_EVENTS);
    expect(parseRunEvents({ fetches: "lots", version: 9 })).toEqual(EMPTY_RUN_EVENTS);
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
      fetches: many(FETCH_BUFFER + 10, (i) => ({ url: `https://a.test/${i}`, status: 200 })),
      decisions: many(DECISION_BUFFER + 10, (i) => ({ text: `d${i}` })),
    });
    expect(out.fetches).toHaveLength(FETCH_BUFFER);
    expect(out.fetches[FETCH_BUFFER - 1].url).toBe(`https://a.test/${FETCH_BUFFER + 9}`);
    expect(out.decisions).toHaveLength(DECISION_BUFFER);
    expect(out.decisions[0].text).toBe("d10");
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
