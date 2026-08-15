// Tests for the pure transform functions in scripts/scaffold-guide.mjs: slug derivation,
// day-label generation from a date range, and the canonical guide/intake/ledger backbones a
// new "Guide-to-be" is scaffolded from — plus one hermetic writeScaffold run that pins the
// emitted run-state LAYOUT (tmp dirs, no repo writes). The CLI itself is exercised end-to-end
// by the new-guide.yml workflow.

// @protects-file A new guide starts from a valid, complete skeleton every time.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { slugify, dayLabelsFromRange, buildGuideObject, buildIntakeMd, buildLedgerMd, writeScaffold, parseArgs, deriveRanks, PRIORITY_GROUP_MAP, buildCoverageMatrix, extractIataCode } from "../scaffold-guide.mjs";
// The never-fold groups come from the Composer that owns the rule, not a local copy — a
// re-declared literal here would keep passing after compose-guide.mjs changed its mind.
import { NEVER_FOLD } from "../compose-guide.mjs";

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

  it("passes the intake budget target through to the budget section", () => {
    const g = buildGuideObject({ country: "Denmark", budget: "Mid-range ($75-150/day)" });
    expect(g.sections.find((s) => s.type === "budget").budgetTarget).toBe("Mid-range ($75-150/day)");
  });

  it("omits budgetTarget when no budget answer is given", () => {
    const g = buildGuideObject({ country: "Denmark" });
    expect(g.sections.find((s) => s.type === "budget").budgetTarget).toBeUndefined();
  });

  // R6 fold-target seeds: every foldable-group section is born with a phase (so a
  // Composer fold routes it honestly), and never-fold groups carry none (a tag there
  // would be dead weight pretending to be a decision).
  it("seeds a valid Composer phase on every foldable-group section, and none on Plan/Days/Sources", () => {
    const g = buildGuideObject({ country: "South Korea", niche: "vintage vinyl shops" });
    const PHASES = new Set(["before", "arrival", "daily", "leaving"]);
    for (const s of g.sections) {
      if (NEVER_FOLD.has(s.group)) {
        expect(s.phase, `${s.group} / ${s.title} must not carry a phase`).toBeUndefined();
      } else {
        expect(PHASES.has(s.phase), `${s.group} / ${s.title} needs a valid phase, got ${s.phase}`).toBe(true);
      }
    }
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
    expect(md).toContain("Anchor event (assumed) — the non-negotiable the trip is built around:** Roskilde Festival");
    expect(md).toContain("1. Food");
    expect(md).toContain("2. Design");
    expect(md).toContain("3. Nature");
    expect(md).toContain("Niche interest: record shops");
    expect(md).toContain("Per-day target (assumed, from form): $150/day");
  });

  // The split's whole point: intake.md is frozen traveler intent, so nothing research produces
  // may be scaffolded into it. Every heading below now belongs to ledger.md.
  it("carries NO research-state sections — those are the ledger's", () => {
    const md = buildIntakeMd({ country: "Denmark" });
    for (const heading of [
      "## Spec Summary", "## Cover art", "## Research reconciliation", "## Discovery leads",
      "## Candidates considered", "## Questions for the traveler", "## Amendments",
    ]) {
      expect(md, `${heading} must not appear in intake.md`).not.toContain(heading);
    }
    expect(md.trimEnd().endsWith("- Anything that makes this trip unlike a default version of the same destination:")).toBe(true);
  });

  // C1 (docs/archive/INDEX.md → PLAN_EVIDENCE_FIRST): dates/anchor/budget certainty renders inline. No certainty
  // supplied defaults to "assumed" (asserted above); this pins that a REAL certainty answer
  // renders too — the exact shape that makes the Japan case representable ("target: Oct 15",
  // not a bare date silently read as locked).
  it("renders a supplied certainty inline for dates, anchor, and budget", () => {
    const md = buildIntakeMd({
      country: "Japan", start: "2026-10-15", end: "2026-11-10", datesCertainty: "target",
      anchor: "Wild Area — Sendai", anchorCertainty: "fixed",
      budget: "Comfortable ($150–300/day)", budgetCertainty: "flexible",
    });
    expect(md).toContain("**Dates (target):** 2026-10-15 – 2026-11-10");
    expect(md).toContain("Anchor event (fixed) — the non-negotiable the trip is built around:** Wild Area — Sendai");
    expect(md).toContain("Per-day target (flexible, from form): Comfortable ($150–300/day)");
  });

  it("leaves blanks honest (no invented placeholder text) when answers are missing", () => {
    const md = buildIntakeMd({});
    expect(md).toContain("# New Guide Intake — [Destination]");
    expect(md).toContain("Who is this for / party:**   *(→ pick");
    expect(md).toContain("1. \n2. \n3. ");
  });
});

describe("buildLedgerMd", () => {
  it("scaffolds every research-state section a pass appends into", () => {
    const md = buildLedgerMd({ country: "Denmark" });
    expect(md).toContain("# Research ledger — Denmark");
    expect(md).toContain("## Spec Summary");
    expect(md).toContain("## Research reconciliation");
    expect(md).toContain("## Candidates considered");
    expect(md).toContain("### Priority 1:");
    expect(md).toContain("## Questions for the traveler");
    expect(md).toContain("## Amendments");
  });

  // The footage scout's ledger (R4): the section must exist in every scaffolded ledger so the
  // research pass has a home to record candidates into — and the creator-sign rule rides it.
  it("carries the footage-candidates table and its creator-sign rule", () => {
    const md = buildLedgerMd({ country: "Denmark" });
    expect(md).toContain("## Cover art — footage candidates");
    expect(md).toContain("no invented geography");
  });

  it("starts the traveler-questions section on the placeholder the C2 gate fills", () => {
    // applyContradictions() replaces this exact string rather than appending a second heading.
    expect(buildLedgerMd({})).toContain("(none yet)");
  });

  it("names no destination rather than inventing one", () => {
    expect(buildLedgerMd({})).toContain("# Research ledger — [Destination]");
  });
});

describe("writeScaffold — the emitted run-state layout", () => {
  let guidesDir, intakeDir;

  beforeEach(async () => {
    guidesDir = await mkdtemp(path.join(tmpdir(), "scaffold-guides-"));
    intakeDir = await mkdtemp(path.join(tmpdir(), "scaffold-intake-"));
  });

  afterEach(async () => {
    await rm(guidesDir, { recursive: true, force: true });
    await rm(intakeDir, { recursive: true, force: true });
  });

  it("puts intake.md, ledger.md, state.json and coverage.json in guides-intake/<slug>/", async () => {
    const res = await writeScaffold({ country: "Denmark", start: "2026-07-13", end: "2026-07-15" }, { guidesDir, intakeDir });
    expect(res.slug).toBe("denmark");
    expect(path.relative(intakeDir, res.intakeDir)).toBe("denmark");
    const runDir = path.join(intakeDir, "denmark");
    for (const [file, marker] of [
      ["intake.md", "# New Guide Intake — Denmark"],
      ["ledger.md", "# Research ledger — Denmark"],
    ]) {
      expect(await readFile(path.join(runDir, file), "utf8")).toContain(marker);
    }
    const state = JSON.parse(await readFile(path.join(runDir, "state.json"), "utf8"));
    expect(state.slug).toBe("denmark");
    expect(state.stages.scaffold).toBeTruthy();
    expect(JSON.parse(await readFile(path.join(runDir, "coverage.json"), "utf8")).slug).toBe("denmark");
  });

  it("writes nothing loose beside the run directory", async () => {
    await writeScaffold({ country: "Denmark" }, { guidesDir, intakeDir });
    const { readdir } = await import("node:fs/promises");
    expect(await readdir(intakeDir)).toEqual(["denmark"]);
  });
});

describe("deriveRanks (P2/R16 — deterministic intake→facet rank mapping)", () => {
  it("maps each priority to its group with 1-indexed rank", () => {
    expect(deriveRanks(["Food & dining", "Culture / history", "Nature / outdoors"])).toEqual({
      "Food & shopping": 1,
      "Sights": 2, // Culture claims it first; Nature shares the group but doesn't overwrite
    });
  });

  it("first priority to claim a group wins (Food before Shopping)", () => {
    const r = deriveRanks(["Food & dining", "Shopping"]);
    expect(r["Food & shopping"]).toBe(1); // Food at rank 1, Shopping doesn't overwrite
  });

  it("returns empty for no priorities", () => {
    expect(deriveRanks([])).toEqual({});
  });

  it("maps niche interest to Highlights", () => {
    expect(deriveRanks(["Niche interest (specify below)"])).toEqual({ Highlights: 1 });
  });

  it("maps every known priority label to a group", () => {
    for (const label of Object.keys(PRIORITY_GROUP_MAP)) {
      expect(PRIORITY_GROUP_MAP[label], `${label} should map to a group`).toBeTruthy();
    }
  });
});

describe("buildGuideObject rank facets (P2/R16)", () => {
  it("applies rank to sections whose group matches a priority", () => {
    const g = buildGuideObject({ country: "Denmark", priorities: ["Food & dining", "Culture / history"] });
    const food = g.sections.find((s) => s.group === "Food & shopping");
    const sights = g.sections.find((s) => s.group === "Sights");
    expect(food.rank).toBe(1);
    expect(sights.rank).toBe(2);
  });

  it("does not add rank to groups with no matching priority", () => {
    const g = buildGuideObject({ country: "Denmark", priorities: ["Food & dining"] });
    const transit = g.sections.filter((s) => s.group === "Transit");
    for (const s of transit) expect(s.rank).toBeUndefined();
  });

  it("no priorities means no ranks anywhere", () => {
    const g = buildGuideObject({ country: "Denmark" });
    for (const s of g.sections) expect(s.rank).toBeUndefined();
  });
});

describe("buildCoverageMatrix (P3/R15 — intake asks for verify coverage gate)", () => {
  it("extracts non-empty asks from answers", () => {
    const m = buildCoverageMatrix({
      country: "Japan", anchor: "Koyo viewing", cities: "Sendai",
      start: "2026-10-15", end: "2026-10-22",
      priorities: ["Food & dining", "Nature / outdoors"], niche: "onsen",
      budget: "Mid-range ($75–150/day)", party: "3 friends",
    }, "japan");
    expect(m.slug).toBe("japan");
    expect(m.asks.length).toBeGreaterThanOrEqual(7);
    expect(m.asks.every((a) => a.coveredBy === null)).toBe(true);
    expect(m.asks.find((a) => a.id === "anchor").value).toBe("Koyo viewing");
    expect(m.asks.find((a) => a.id === "priority-1").value).toBe("Food & dining");
    expect(m.asks.find((a) => a.id === "dates").value).toBe("2026-10-15 – 2026-10-22");
  });

  it("omits empty/missing answers", () => {
    const m = buildCoverageMatrix({ country: "Denmark" }, "denmark");
    expect(m.asks.length).toBe(0); // country is not tracked as an ask (it's the destination, not a requirement)
  });

  it("includes niche only when provided", () => {
    const withNiche = buildCoverageMatrix({ country: "X", niche: "diving" }, "x");
    const without = buildCoverageMatrix({ country: "X" }, "x");
    expect(withNiche.asks.some((a) => a.id === "niche")).toBe(true);
    expect(without.asks.some((a) => a.id === "niche")).toBe(false);
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

describe("extractIataCode — Stage B.7 intake congruence (D14/ADR 0003)", () => {
  it("extracts a bare, deliberately-capitalized code", () => {
    expect(extractIataCode("EWR")).toBe("EWR");
  });

  it("extracts a code mentioned inline, capitalized, among lowercase prose", () => {
    expect(extractIataCode("probably JFK")).toBe("JFK");
    expect(extractIataCode("EWR (Newark)")).toBe("EWR");
  });

  it("does NOT guess from a lowercase word — a false positive would be worse than no row", () => {
    expect(extractIataCode("the airport near newark")).toBeNull();
    expect(extractIataCode("not sure yet")).toBeNull();
  });

  it("does not guess from a bare city name with no code at all", () => {
    expect(extractIataCode("Newark")).toBeNull();
    // "NYC" matches the capitalized-3-letter pattern, so it IS extracted — and that's fine:
    // it's a real IATA metropolitan-area code, the row it seeds is always unconfirmed, and an
    // unresolvable code draws nothing downstream (originFor returns null for any code the
    // gazetteer doesn't carry). Better an honest unconfirmed row than a discarded answer.
    expect(extractIataCode("somewhere near NYC, not sure which airport")).toBe("NYC");
  });

  it("null for empty/absent input", () => {
    expect(extractIataCode("")).toBeNull();
    expect(extractIataCode(null)).toBeNull();
    expect(extractIataCode(undefined)).toBeNull();
  });
});
