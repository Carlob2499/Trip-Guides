import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  legacyRouteAnchors,
  projectTravelerDestinations,
  TRAVELER_DESTINATION_ORDER,
} from "../model/destinations";

function realSections(slug: string) {
  const dir = `src/content/guides/${slug}`;
  return readdirSync(dir)
    .filter((file) => /^\d\d-.*\.json$/.test(file))
    .sort()
    .flatMap((file) => {
      const parsed = JSON.parse(readFileSync(`${dir}/${file}`, "utf8"));
      return Array.isArray(parsed) ? parsed : (parsed.sections ?? []);
    });
}

describe("traveler destination projection", () => {
  it("assigns every raw section exactly once without cloning it or changing its index", () => {
    const sections = realSections("korea");
    const projected = projectTravelerDestinations(sections);
    const all = [...projected.destinations.flatMap((destination) => destination.sections), ...projected.sources];

    expect(all).toHaveLength(sections.length);
    expect(new Set(all.map((entry) => entry.index)).size).toBe(sections.length);
    for (const entry of all) expect(entry.section).toBe(sections[entry.index]);
  });

  it("uses canonical order and never promotes Sources", () => {
    const projected = projectTravelerDestinations(realSections("korea"));
    expect(projected.destinations.map((destination) => destination.name)).toEqual(TRAVELER_DESTINATION_ORDER);
    expect(projected.destinations.map((destination) => destination.name)).not.toContain("Sources");
    expect(projected.sources.length).toBeGreaterThan(0);
    expect(projected.sources.every((entry) => entry.home === "Sources & verification")).toBe(true);
  });

  it("keeps Korea food in Food while niche, event, side-trip and shopping-only sections move to Explore", () => {
    const projected = projectTravelerDestinations(realSections("korea"));
    const at = (name: string) => projected.destinations.find((destination) => destination.name === name)!.sections;
    const food = at("Food");
    const explore = at("Explore");

    expect(food.some((entry) => entry.rawGroup === "Food & shopping" && /Where to eat/.test(entry.section.title ?? ""))).toBe(true);
    expect(explore.some((entry) => entry.rawGroup === "Food & shopping" && /Shopping game plan/.test(entry.section.title ?? ""))).toBe(true);
    expect(explore.some((entry) => entry.rawGroup === "Pokémon GO")).toBe(true);
    expect(explore.some((entry) => entry.rawGroup === "Daejeon & MSI")).toBe(true);
    expect(explore.some((entry) => entry.rawGroup === "Tokyo")).toBe(true);
  });

  it("treats Today as a projection, never as a section owner", () => {
    const projected = projectTravelerDestinations(realSections("korea"));
    expect(projected.destinations.map((destination) => destination.name)).not.toContain("Today");
    expect([...projected.destinations.flatMap((destination) => destination.sections), ...projected.sources]
      .some((entry) => entry.home === ("Today" as never))).toBe(false);
  });

  it("keeps evidence sections secondary even when their group label is absent", () => {
    const projected = projectTravelerDestinations([
      { type: "sources", title: "Official references" },
      { type: "days", group: "Days", title: "Day by day" },
    ]);
    expect(projected.sources.map((entry) => entry.section.title)).toEqual(["Official references"]);
    expect(projected.destinations.map((destination) => destination.name)).toEqual(["Days"]);
  });
});

describe("legacy public group links", () => {
  const sections = [
    { type: "overview", group: "Plan", title: "Before you go" },
    { type: "days", group: "Days", title: "Day by day" },
    { type: "venues", group: "Food & shopping", title: "Where to eat" },
    { type: "checklist", group: "Food & shopping", title: "Shopping game plan" },
    { type: "sights", group: "Daejeon & MSI", title: "Tournament side trip" },
    { type: "sources", group: "Sources", title: "References" },
  ];

  it("maps the old raw-group order and appended stations to their R6 owners", () => {
    expect(legacyRouteAnchors(sections, { hasLearnings: true })).toEqual([
      { id: "grp-0", route: "essentials" },
      { id: "grp-1", route: "days" },
      { id: "grp-2", route: "food" },
      { id: "grp-3", route: "explore" },
      { id: "grp-4", route: "sources" },
      { id: "grp-5", route: "recap" },
      { id: "grp-6", route: "tools" },
    ]);
  });

  it("keeps the old Tools index immediately after raw groups when no recap existed", () => {
    expect(legacyRouteAnchors(sections.slice(0, 2), { hasLearnings: false })).toEqual([
      { id: "grp-0", route: "essentials" },
      { id: "grp-1", route: "days" },
      { id: "grp-2", route: "tools" },
    ]);
  });
});
