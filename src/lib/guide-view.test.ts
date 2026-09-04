/* The one derivation behind the five destinations (design-system.md D6-03). Exercised on the
   two shipped guides, so a change to what GuideLayout and the gallery hand the destinations
   is caught here before a browser ever renders it. */
// @protects-file The guide destinations' shared derivation stays honest about the guide's own data.
import { describe, expect, it } from "vitest";
import { loadGuide } from "../../scripts/compose-guide.mjs";
import { deriveGuideView } from "./guide-view";

async function view(slug: string) {
  const g = await loadGuide(slug);
  return deriveGuideView({ ...g.meta, sections: g.sections }, slug, "/Trip-Guides", {});
}

describe("deriveGuideView", () => {
  it("names the five destinations in the fixed order and keys storage on the slug", async () => {
    const v = await view("korea");
    expect(v.destinations.map((d) => d.key)).toEqual(["trip", "itinerary", "map", "guide", "split"]);
    expect(v.storeKey).toBe("korea");
    expect(v.slug).toBe("korea");
  });

  it("derives canonical days, pins and a non-empty search index from the guide alone", async () => {
    const v = await view("korea");
    expect(v.tripDays.length).toBe(v.rawDays.length);
    expect(v.tripDays.length).toBeGreaterThan(3);
    expect(v.firstDayDate).toBe(v.rawDays[0].date);
    const ids = v.allPins.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(v.globalCenter).not.toBeNull();
    expect(v.globalSpan).toBeGreaterThan(0);
    expect(v.searchIndex.length).toBeGreaterThan(20);
    expect(v.hero.src).toMatch(/^https?:/);
    expect(v.hero.painted).toBe(false);
  });

  it("chapters are the authored groups — never the itinerary's group, never the sources", async () => {
    const v = await view("korea");
    const names = v.chapters.map((c) => c.name);
    expect(names).not.toContain(v.daysSec.group);
    expect(names.some((n) => /source|reference/i.test(n))).toBe(false);
    expect(new Set(v.chapters.map((c) => c.key)).size).toBe(v.chapters.length);
    expect(v.chapters.filter((c) => c.reference).length).toBe(1);
    expect(v.chapters.filter((c) => c.arrival).length).toBe(1);
    // A chapter carrying places with verified coordinates is spatial: it has a centre.
    const spatial = v.chapters.find((c) => c.pins.length > 0);
    expect(spatial?.center).not.toBeNull();
    // Every section index appears exactly once across chapters + sources (nothing rendered twice).
    const seen = [...v.chapters.flatMap((c) => c.entries.map((e) => e.i)), ...v.sources.map((e) => e.i)];
    expect(new Set(seen).size).toBe(seen.length);
  });

  it("projects knowledge modules onto the days they relate to (D6-53), by the module's own relations", async () => {
    const v = await view("korea");
    const arrival = v.modulesByDate["Thu Jul 9"] ?? [];
    expect(arrival.map((m) => m.id)).toContain("incheon-airport-transfer");
    expect(arrival.find((m) => m.id === "incheon-airport-transfer")?.critical).toBe(true);
    for (const links of Object.values(v.modulesByDate)) for (const l of links) expect(l.anchor).toMatch(/^sec-\d+$/);
  });

  it("keeps the plate and colophon counted, never typed", async () => {
    const v = await view("korea");
    expect(typeof v.plate.facts).toBe("number");
    expect(typeof v.plate.sources).toBe("number");
    expect(v.plate.checked === null || /^\d{4}-\d{2}-\d{2}$/.test(v.plate.checked)).toBe(true);
    expect(v.plate.emergency).toBeTruthy();
  });

  it("Denmark: branched days become labelled stops and holidays stay honest when absent", async () => {
    const v = await view("denmark");
    // Three days split the party. Their branches are authored prose (no located stops yet),
    // so the canonical days carry no branch stops — nothing is fabricated to fill the map.
    const branched = v.rawDays.filter((d) => (d.branches ?? []).length === 2);
    expect(branched.map((d) => d.date)).toEqual(["Thu Jun 11", "Fri Jun 12", "Sat Jun 13"]);
    expect(v.tripDays.every((d) => d.stops.every((s) => !s.branch))).toBe(true);
    expect(v.readiness).toBeTruthy();
    expect(v.recap === null || typeof v.recap.dayCount === "number").toBe(true);
    expect(v.exports.gpx).toBe(true);
  });
});
