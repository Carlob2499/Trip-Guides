// @protects-file Grouped figures put each item in the right band.

import { describe, it, expect } from "vitest";
import { bucket } from "./buckets";
import type { Section } from "./guide-types";

/* M6: bucket() only ever reads `group`, and these fixtures deliberately carry nothing else —
   that minimalism IS the test (it proves the grouping does not depend on any other field).
   The cast states that, instead of padding every fixture with a full valid section. */
const asSections = (s: unknown[]) => s as Section[];

describe("bucket", () => {
  it("groups sections under their declared `group`", () => {
    const sections = [{ group: "Overview" }, { group: "Days" }, { group: "Overview" }];
    const { order, byG } = bucket(asSections(sections));
    expect(order).toEqual(["Overview", "Days"]);
    expect(byG.Overview.map((e) => e.i)).toEqual([0, 2]);
    expect(byG.Days.map((e) => e.i)).toEqual([1]);
  });

  it("defaults ungrouped sections to 'More'", () => {
    const sections = [{ title: "no group" }];
    const { order, byG } = bucket(asSections(sections));
    expect(order).toEqual(["More"]);
    expect(byG.More).toHaveLength(1);
  });

  it("preserves first-appearance order of groups, not alphabetical/sorted order", () => {
    const sections = [{ group: "Z" }, { group: "A" }, { group: "Z" }];
    const { order } = bucket(asSections(sections));
    expect(order).toEqual(["Z", "A"]);
  });

  it("retains the original array index alongside each section", () => {
    const sections = [{ group: "G" }, { group: "G" }];
    const { byG } = bucket(asSections(sections));
    expect(byG.G[0].i).toBe(0);
    expect(byG.G[1].i).toBe(1);
    expect(byG.G[0].s).toBe(sections[0]);
  });

  it("returns empty structures for an empty sections array", () => {
    const { order, byG } = bucket(asSections([]));
    expect(order).toEqual([]);
    expect(byG).toEqual({});
  });
});
