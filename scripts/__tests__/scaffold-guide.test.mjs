// Tests for the pure transform functions in scripts/scaffold-guide.mjs: slug derivation,
// day-label generation from a date range, and the canonical guide/intake-doc backbones a
// new "Guide-to-be" is scaffolded from. writeScaffold()/the CLI do real disk I/O and are
// exercised end-to-end by the new-guide.yml workflow, so they're intentionally out of
// scope here — this covers the logic a bug would corrupt silently.

import { describe, it, expect } from "vitest";
import { slugify, dayLabelsFromRange, buildGuideObject, buildIntakeMd, parseArgs } from "../scaffold-guide.mjs";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("South Korea")).toBe("south-korea");
  });

  it("strips accents", () => {
    expect(slugify("Île-de-France")).toBe("ile-de-france");
  });

  it("collapses runs of non-alphanumeric characters into one hyphen", () => {
    expect(slugify("Trinidad & Tobago!!")).toBe("trinidad-tobago");
  });

  it("strips leading/trailing hyphens", () => {
    expect(slugify("  --Wow--  ")).toBe("wow");
  });

  it("falls back to \"guide\" for empty/falsy input", () => {
    expect(slugify("")).toBe("guide");
    expect(slugify(null)).toBe("guide");
    expect(slugify(undefined)).toBe("guide");
  });
});

describe("dayLabelsFromRange", () => {
  it("produces one label per day in an inclusive range", () => {
    expect(dayLabelsFromRange("2026-07-13", "2026-07-15")).toEqual(["Mon Jul 13", "Tue Jul 14", "Wed Jul 15"]);
  });

  it("produces a single label when start === end", () => {
    expect(dayLabelsFromRange("2026-07-13", "2026-07-13")).toEqual(["Mon Jul 13"]);
  });

  it("falls back to a single day when end is missing", () => {
    expect(dayLabelsFromRange("2026-07-13", undefined)).toEqual(["Mon Jul 13"]);
  });

  it("falls back to a single day when end is before start", () => {
    expect(dayLabelsFromRange("2026-07-13", "2026-07-01")).toEqual(["Mon Jul 13"]);
  });

  it("returns [] when start can't be parsed", () => {
    expect(dayLabelsFromRange(undefined, "2026-07-15")).toEqual([]);
    expect(dayLabelsFromRange("not-a-date", "2026-07-15")).toEqual([]);
  });

  it("caps at 30 days for an overlong range", () => {
    expect(dayLabelsFromRange("2026-01-01", "2026-12-31")).toHaveLength(30);
  });
});

describe("buildGuideObject", () => {
  it("wires weather + holidays + map when the country resolves to capital coords", () => {
    const g = buildGuideObject({ country: "South Korea" });
    const types = g.sections.map((s) => s.type);
    expect(types).toContain("weather");
    expect(types).toContain("holidays");
    expect(types).toContain("map");
  });

  it("omits weather/holidays/map for an unrecognized country (never invents coords)", () => {
    const g = buildGuideObject({ country: "Nowhereland" });
    const types = g.sections.map((s) => s.type);
    expect(types).not.toContain("weather");
    expect(types).not.toContain("holidays");
    expect(types).not.toContain("map");
  });

  it("prefers explicit coords over the country capital", () => {
    const g = buildGuideObject({ country: "South Korea", coords: { lat: 1, lng: 2 } });
    const map = g.sections.find((s) => s.type === "map");
    expect(map.center).toEqual({ lat: 1, lng: 2 });
  });

  it("defaults to 7 generic day cards when no dayLabels are given", () => {
    const g = buildGuideObject({ country: "South Korea" });
    const days = g.sections.find((s) => s.type === "days");
    expect(days.items.map((d) => d.date)).toEqual(["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"]);
  });

  it("uses supplied dayLabels verbatim, one day card each", () => {
    const g = buildGuideObject({ country: "South Korea", dayLabels: ["Mon Jul 13", "Tue Jul 14"] });
    const days = g.sections.find((s) => s.type === "days");
    expect(days.items).toHaveLength(2);
    expect(days.items[0]).toEqual({ date: "Mon Jul 13", title: "", pace: "", body: "" });
  });

  it("adds a Highlights section only when a niche is given", () => {
    expect(buildGuideObject({ country: "Denmark" }).sections.some((s) => s.group === "Highlights")).toBe(false);
    const g = buildGuideObject({ country: "Denmark", niche: "vintage vinyl shops" });
    const highlight = g.sections.find((s) => s.group === "Highlights");
    expect(highlight.title).toBe("vintage vinyl shops");
  });

  it("is born draft:true, provenance:strict, with the draft stamp and a valid roomId", () => {
    const g = buildGuideObject({ country: "Denmark" });
    expect(g.draft).toBe(true);
    expect(g.provenance).toBe("strict");
    expect(g.verified).toMatch(/^⚠ Draft scaffold/);
    expect(g.roomId).toMatch(/^[a-z0-9]{16,40}$/);
  });

  it("titles the guide from cities + country when no explicit title is given", () => {
    const g = buildGuideObject({ country: "Denmark", cities: "Copenhagen" });
    expect(g.title).toBe("Copenhagen & Denmark");
  });

  it("prefers an explicit title over the derived one", () => {
    const g = buildGuideObject({ country: "Denmark", cities: "Copenhagen", title: "My Nordic Trip" });
    expect(g.title).toBe("My Nordic Trip");
  });

  it("uses the country's currency symbol in the budget section, defaulting to $", () => {
    const known = buildGuideObject({ country: "South Korea" });
    expect(known.sections.find((s) => s.type === "budget").currency).toBe("₩");
    const unknown = buildGuideObject({ country: "Nowhereland" });
    expect(unknown.sections.find((s) => s.type === "budget").currency).toBe("$");
  });

  it("sizes the budget's `days` to the itinerary length", () => {
    const g = buildGuideObject({ country: "Denmark", dayLabels: ["Mon Jul 13", "Tue Jul 14", "Wed Jul 15"] });
    expect(g.sections.find((s) => s.type === "budget").days).toBe(3);
  });
});

describe("buildIntakeMd", () => {
  it("fills in the supplied answers", () => {
    const md = buildIntakeMd({
      country: "Denmark", party: "Couple", travelers: "2", cities: "Copenhagen",
      start: "2026-07-13", end: "2026-07-20", anchor: "Roskilde Festival",
      priorities: ["Food", "Design", "Nature"], niche: "record shops", budget: "$150/day",
    });
    expect(md).toContain("# New Guide Intake — Denmark");
    expect(md).toContain("Who is this for / party:** Couple");
    expect(md).toContain("Number of travelers: 2");
    expect(md).toContain("2026-07-13 – 2026-07-20");
    expect(md).toContain("Anchor event (the non-negotiable the trip is built around):** Roskilde Festival");
    expect(md).toContain("1. Food");
    expect(md).toContain("2. Design");
    expect(md).toContain("3. Nature");
    expect(md).toContain("Niche interest: record shops");
    expect(md).toContain("Per-day target (from form): $150/day");
  });

  it("leaves blanks honest (no invented placeholder text) when answers are missing", () => {
    const md = buildIntakeMd({});
    expect(md).toContain("# New Guide Intake — [Destination]");
    expect(md).toContain("Who is this for / party:**   *(→ pick");
    expect(md).toContain("1. \n2. \n3. ");
  });
});

describe("parseArgs (R9 — a flag with no value doesn't swallow the next flag's name)", () => {
  it("parses normal --flag value pairs", () => {
    expect(parseArgs(["--country", "Brazil", "--travelers", "2"])).toEqual({
      country: "Brazil", travelers: "2",
    });
  });

  it("a flag directly followed by another flag gets true, NOT the next flag's name as its value", () => {
    // The bug: `--country --start X` used to set country to the literal string "--start".
    const a = parseArgs(["--country", "--start", "2026-03-01"]);
    expect(a.country).toBe(true);
    expect(a.start).toBe("2026-03-01");
  });

  it("a trailing flag with nothing after it gets true, not undefined-as-a-string", () => {
    const a = parseArgs(["--country", "Brazil", "--dryrun"]);
    expect(a.country).toBe("Brazil");
    expect(a.dryrun).toBe(true);
  });

  it("handles an all-flags-no-values argv without throwing", () => {
    expect(parseArgs(["--a", "--b", "--c"])).toEqual({ a: true, b: true, c: true });
  });
});
