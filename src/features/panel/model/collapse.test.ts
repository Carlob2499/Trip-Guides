// @protects-file Opening and closing a section is remembered, per guide, per device.

import { describe, it, expect } from "vitest";
import {
  MAX_ID_LEN, MAX_PANELS, parseCollapsed, serializeCollapsed, setCollapsed, toggleCollapsed,
  isCollapsed, scopeKey,
} from "./collapse";

describe("parseCollapsed", () => {
  it("parses a JSON string", () => {
    expect(parseCollapsed('{"budget":true}')).toEqual({ budget: true });
  });
  it("accepts an already-parsed object", () => {
    expect(parseCollapsed({ budget: true })).toEqual({ budget: true });
  });
  it("returns {} for unparseable strings, arrays, null and primitives", () => {
    expect(parseCollapsed("not json")).toEqual({});
    expect(parseCollapsed("")).toEqual({});
    expect(parseCollapsed(null)).toEqual({});
    expect(parseCollapsed(undefined)).toEqual({});
    expect(parseCollapsed(["budget"])).toEqual({});
    expect(parseCollapsed(42)).toEqual({});
    expect(parseCollapsed('["budget"]')).toEqual({});
  });
  it("drops values that are not booleans", () => {
    expect(parseCollapsed({ a: "true", b: 1, c: null, d: {}, e: NaN, f: true })).toEqual({ f: true });
  });
  it("keeps an explicit false — it records a reader who opened a Panel that ships collapsed", () => {
    expect(parseCollapsed({ a: false, b: true })).toEqual({ a: false, b: true });
  });
  it("drops an empty or over-long id", () => {
    const long = "x".repeat(MAX_ID_LEN + 1);
    expect(parseCollapsed({ "": true, [long]: true, ok: true })).toEqual({ ok: true });
  });
  it("keeps an id at exactly the length cap", () => {
    const at = "x".repeat(MAX_ID_LEN);
    expect(parseCollapsed({ [at]: true })).toEqual({ [at]: true });
  });
  it("stops at the entry cap so a hand-edited store cannot grow without bound", () => {
    const blob: Record<string, boolean> = {};
    for (let i = 0; i < MAX_PANELS + 25; i++) blob["p" + i] = true;
    expect(Object.keys(parseCollapsed(blob))).toHaveLength(MAX_PANELS);
  });
});

describe("serializeCollapsed", () => {
  it("round-trips through parseCollapsed", () => {
    const state = { budget: true, days: true };
    expect(parseCollapsed(serializeCollapsed(state))).toEqual(state);
  });
  it("writes both decisions", () => {
    expect(serializeCollapsed({ a: true, b: false })).toBe('{"a":true,"b":false}');
  });
  it("drops non-boolean values a caller may have grafted on", () => {
    expect(serializeCollapsed({ a: 1, b: "true", c: true } as unknown as Record<string, boolean>))
      .toBe('{"c":true}');
  });
});

describe("toggleCollapsed", () => {
  it("collapses an open panel", () => {
    expect(toggleCollapsed({}, "budget")).toEqual({ budget: true });
  });
  it("opens a collapsed panel", () => {
    expect(toggleCollapsed({ budget: true }, "budget")).toEqual({ budget: false });
  });
  it("toggles against the markup default when the reader has never decided", () => {
    expect(toggleCollapsed({}, "budget", true)).toEqual({ budget: false });
    expect(toggleCollapsed({}, "budget", false)).toEqual({ budget: true });
  });
  it("ignores the markup default once the reader has decided", () => {
    expect(toggleCollapsed({ budget: false }, "budget", true)).toEqual({ budget: true });
  });
  it("does not mutate the input", () => {
    const before = { budget: true };
    toggleCollapsed(before, "budget");
    expect(before).toEqual({ budget: true });
  });
  it("leaves other panels untouched", () => {
    expect(toggleCollapsed({ days: true }, "budget")).toEqual({ days: true, budget: true });
  });
  it("ignores an empty id", () => {
    const state = { days: true };
    expect(toggleCollapsed(state, "")).toBe(state);
  });
});

describe("setCollapsed", () => {
  it("records both decisions, without mutating", () => {
    const before = {};
    expect(setCollapsed(before, "budget", true)).toEqual({ budget: true });
    expect(setCollapsed({ budget: true }, "budget", false)).toEqual({ budget: false });
    expect(before).toEqual({});
  });
  it("is a no-op when the reader's stored decision already matches", () => {
    const state = { budget: true, days: false };
    expect(setCollapsed(state, "budget", true)).toBe(state);
    expect(setCollapsed(state, "days", false)).toBe(state);
  });
  it("records an untouched panel even when the value matches the open default", () => {
    expect(setCollapsed({}, "budget", false)).toEqual({ budget: false });
  });
  it("ignores an empty id", () => {
    const state = {};
    expect(setCollapsed(state, "", true)).toBe(state);
  });
  it("refuses a decision parseCollapsed would drop, rather than losing it on reload", () => {
    const long = "x".repeat(MAX_ID_LEN + 1);
    const state = {};
    expect(setCollapsed(state, long, true)).toBe(state);
    const full: Record<string, boolean> = {};
    for (let i = 0; i < MAX_PANELS; i++) full["p" + i] = true;
    expect(setCollapsed(full, "one-too-many", true)).toBe(full);
  });
  it("still updates a panel already in a full store", () => {
    const full: Record<string, boolean> = {};
    for (let i = 0; i < MAX_PANELS; i++) full["p" + i] = true;
    expect(setCollapsed(full, "p0", false).p0).toBe(false);
  });
  it("every decision it records survives the round trip", () => {
    const state = setCollapsed(setCollapsed({}, "a", true), "b", false);
    expect(parseCollapsed(serializeCollapsed(state))).toEqual(state);
  });
});

describe("isCollapsed", () => {
  it("defaults to open for an unknown panel", () => {
    expect(isCollapsed({}, "budget")).toBe(false);
  });
  it("falls back to the markup default for an untouched panel", () => {
    expect(isCollapsed({}, "budget", true)).toBe(true);
  });
  it("lets the reader's decision outrank the markup default, both ways", () => {
    expect(isCollapsed({ budget: false }, "budget", true)).toBe(false);
    expect(isCollapsed({ budget: true }, "budget", false)).toBe(true);
  });
});

describe("scopeKey", () => {
  it("namespaces per scope so one scope never reads another's state", () => {
    expect(scopeKey("south-korea")).toBe("tg-panelcollapse-southkorea");
    expect(scopeKey("denmark")).toBe("tg-panelcollapse-denmark");
    expect(scopeKey("south-korea")).not.toBe(scopeKey("denmark"));
  });
  it("normalizes the way GuideLayout derives storeKey", () => {
    expect(scopeKey("South Korea!")).toBe("tg-panelcollapse-southkorea");
  });
  it("collapses scopes that normalize the same — pinned, because changing it would silently repartition every reader's stored state", () => {
    expect(scopeKey("south-korea")).toBe(scopeKey("southkorea"));
    expect(scopeKey("south-korea")).toBe(scopeKey("South Korea"));
  });
  it("falls back to a named default rather than a bare prefix", () => {
    expect(scopeKey("")).toBe("tg-panelcollapse-guide");
    expect(scopeKey(undefined)).toBe("tg-panelcollapse-guide");
    expect(scopeKey("!!!")).toBe("tg-panelcollapse-guide");
  });
});
