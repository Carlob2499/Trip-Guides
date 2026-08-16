// @protects-file The rail always shows this guide's own stops — never a list someone forgot to update.

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { buildStations, progressGeometry } from "../model/stations";

/* Read the real guides rather than fixtures for the count assertions. A fixture asserting
   "Korea has 13" would keep passing after someone adds a twelfth group to Korea, which is the
   exact drift these numbers exist to catch. */
function realGuide(slug: string) {
  const dir = `src/content/guides/${slug}`;
  const groups: string[] = [];
  for (const f of readdirSync(dir).filter((f) => /^\d\d-.*\.json$/.test(f)).sort()) {
    const parsed = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
    for (const s of Array.isArray(parsed) ? parsed : (parsed.sections ?? [])) {
      if (s.group && !groups.includes(s.group)) groups.push(s.group);
    }
  }
  const meta = JSON.parse(readFileSync(`${dir}/_guide.json`, "utf8"));
  return { groups, hasLearnings: !!meta.learnings };
}

const names = (s: { full: string }[]) => s.map((x) => x.full);

describe("the rail is built from the guide", () => {
  it("ends … Sources, Field log, Tools when the guide has a learnings record", () => {
    const stations = buildStations(realGuide("korea"));
    expect(names(stations).slice(-3)).toEqual(["Sources", "Field log", "Tools"]);
  });

  it("ends … Sources, Tools when it does not — Field log is ABSENT, not empty", () => {
    /* ⌁ regression. An empty Field log station is a promise the guide cannot keep: it invites a
       reader to a post-mortem that was never written. Absence is asserted as absence.
       Derived rather than read whole: every guide that ships today carries a learnings record
       (japan, the last one that didn't, was deleted for a fresh redo). So the no-learnings
       branch is exercised by flipping the one field on a real guide's real group list — the
       guard outlives the guide that happened to exercise it. */
    const stations = buildStations({ ...realGuide("denmark"), hasLearnings: false });
    expect(names(stations).slice(-2)).toEqual(["Sources", "Tools"]);
    expect(names(stations)).not.toContain("Field log");
    expect(stations.some((s) => s.kind === "fieldlog")).toBe(false);
  });

  it.each(["korea", "denmark"])("puts Tools last for %s", (slug) => {
    const stations = buildStations(realGuide(slug));
    expect(stations.at(-1)?.kind).toBe("tools");
    expect(stations.filter((s) => s.kind === "tools")).toHaveLength(1);
  });

  it("derives the count from the guide — Korea 13, Denmark 10", () => {
    // The two numbers are ASSERTED here and written nowhere in the source: 11 groups + Field
    // log + Tools, and 8 groups + Field log + Tools.
    expect(buildStations(realGuide("korea"))).toHaveLength(13);
    expect(buildStations(realGuide("denmark"))).toHaveLength(10);
  });

  it("numbers stations contiguously from zero, whatever the guide", () => {
    for (const slug of ["korea", "denmark"]) {
      const stations = buildStations(realGuide(slug));
      expect(stations.map((s) => s.index)).toEqual(stations.map((_, i) => i));
    }
  });

  it("gives every station a unique key", () => {
    // Two stations sharing a key would share a panel — one of them becomes unreachable.
    for (const slug of ["korea", "denmark"]) {
      const keys = buildStations(realGuide(slug)).map((s) => s.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("survives a name with an ampersand or a non-ASCII character, unescaped", () => {
    /* The rail does not abbreviate: a station label wraps to two lines and a pill row scrolls,
       so both have the room. Only the KEY is slugged, because it becomes a DOM id and a URL
       parameter. Asserted on the real names two guides actually use. */
    const stations = buildStations({ groups: ["Food & shopping", "Pokémon GO"], hasLearnings: false });
    expect(stations[0].full).toBe("Food & shopping");
    expect(stations[1].full).toBe("Pokémon GO");
    expect(stations[1].key).toMatch(/^[a-z0-9-]+$/);
    expect(stations[1].key).not.toContain("é");
  });

  it("renders every real group name in full — nothing is truncated on the way to the rail", () => {
    // The names a shortener would cut: the compound groups the shipped guides actually use.
    // A reader scanning the rail for "shopping" has to be able to find it.
    const stations = buildStations(realGuide("korea"));
    expect(names(stations)).toContain("Daejeon & MSI");
    expect(names(stations)).toContain("Gaming & anime");
    expect(names(stations)).toContain("Food & shopping");
  });
});

describe("the progress line's geometry", () => {
  it("is one station's share of the rail — never a shared constant", () => {
    /* ⌁ regression. Korea and Sedona are different journeys of different lengths, and a fill of
       a fixed width would lie about at least one of them. */
    expect(progressGeometry(0, 13).width).toBeCloseTo(7.69, 2);
    expect(progressGeometry(0, 9).width).toBeCloseTo(11.11, 2);
    expect(progressGeometry(0, 13).width).not.toBeCloseTo(progressGeometry(0, 9).width, 2);
  });

  it("places the fill at index / count", () => {
    expect(progressGeometry(3, 13).left).toBeCloseTo(23.08, 2);
    expect(progressGeometry(12, 13).left).toBeCloseTo(92.31, 2);
    // The last station's fill ends exactly at the rail's end.
    const last = progressGeometry(12, 13);
    expect(last.left + last.width).toBeCloseTo(100, 6);
  });

  it("never divides by zero — a one-station rail owns the whole line", () => {
    /* A width of Infinity or NaN is not a visible bug: the declaration is invalid at
       computed-value time, drops silently, and the fill simply never paints. */
    for (const g of [progressGeometry(0, 1), progressGeometry(0, 0), progressGeometry(5, 1)]) {
      expect(Number.isFinite(g.left)).toBe(true);
      expect(Number.isFinite(g.width)).toBe(true);
      expect(g.width).toBe(100);
      expect(g.left).toBe(0);
    }
  });

  it("clamps an out-of-range index rather than running off the rail", () => {
    expect(progressGeometry(99, 9).left).toBeCloseTo(88.89, 2);
    expect(progressGeometry(-4, 9).left).toBe(0);
  });

  it("produces a valid geometry for every station of every real guide", () => {
    for (const slug of ["korea", "denmark"]) {
      const stations = buildStations(realGuide(slug));
      for (const s of stations) {
        const g = progressGeometry(s.index, stations.length);
        expect(g.left).toBeGreaterThanOrEqual(0);
        expect(g.left + g.width).toBeLessThanOrEqual(100 + 1e-9);
      }
    }
  });
});
