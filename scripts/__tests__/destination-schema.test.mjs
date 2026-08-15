// Tests for scripts/lib/destination-schema.mjs (D1, docs/archive/INDEX.md → PLAN_EVIDENCE_FIRST): the
// destination-knowledge schema and its three seed files.

// @protects-file Destination config obeys the same fact discipline as facts.json — no URL
// without a verified_on, and every seed validates before it can be consumed by research.

import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { destinationConfig, sourcePointer, validateDestinationConfig } from "../lib/destination-schema.mjs";

async function seed(slug) {
  const p = fileURLToPath(new URL(`../../src/data/destinations/${slug}.json`, import.meta.url));
  return JSON.parse(await readFile(p, "utf8"));
}

describe("sourcePointer", () => {
  it("accepts a confirmed pointer with a verified_on date", () => {
    const r = sourcePointer.safeParse({ url: "https://example.gov/", verified_on: "2026-08-13" });
    expect(r.success).toBe(true);
  });

  it("rejects a URL field with no verified_on — the ACCEPTANCE rule", () => {
    const r = sourcePointer.safeParse({ url: "https://example.gov/" });
    expect(r.success).toBe(false);
  });

  it("rejects a malformed date", () => {
    const r = sourcePointer.safeParse({ url: "https://example.gov/", verified_on: "Aug 13 2026" });
    expect(r.success).toBe(false);
  });

  it("rejects a non-URL string", () => {
    const r = sourcePointer.safeParse({ url: "not a url", verified_on: "2026-08-13" });
    expect(r.success).toBe(false);
  });

  it("defaults state to 'confirmed' when omitted", () => {
    const r = sourcePointer.parse({ url: "https://example.gov/", verified_on: "2026-08-13" });
    expect(r.state).toBe("confirmed");
  });

  it("accepts an explicit 'unconfirmed' state — a URL attempted but not fetched successfully", () => {
    const r = sourcePointer.safeParse({ url: "https://example.gov/", verified_on: "2026-08-13", state: "unconfirmed" });
    expect(r.success).toBe(true);
  });
});

describe("destinationConfig", () => {
  it("accepts the minimum viable config — slug + one language, everything else defaulted/absent", () => {
    const r = destinationConfig.safeParse({ slug: "testland", languages: ["en"] });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.t0Domains).toEqual([]);
      expect(r.data.transitAuthorities).toEqual([]);
      expect(r.data.travelAdvisory).toBeUndefined();
      expect(r.data.taxFreeRules).toBeUndefined();
    }
  });

  it("rejects a missing slug or empty languages array", () => {
    expect(destinationConfig.safeParse({ languages: ["en"] }).success).toBe(false);
    expect(destinationConfig.safeParse({ slug: "testland", languages: [] }).success).toBe(false);
  });

  it("rejects a non-kebab-case slug", () => {
    expect(destinationConfig.safeParse({ slug: "Test Land", languages: ["en"] }).success).toBe(false);
  });

  it("rejects an unknown top-level field (.strict())", () => {
    const r = destinationConfig.safeParse({ slug: "testland", languages: ["en"], madeUpField: true });
    expect(r.success).toBe(false);
  });

  it("propagates the URL-needs-verified_on rule through nested transitAuthorities/gtfsPortals/seasonalSources", () => {
    const base = { slug: "testland", languages: ["en"] };
    expect(destinationConfig.safeParse({ ...base, transitAuthorities: [{ name: "X", url: { url: "https://x.example/" } }] }).success).toBe(false);
    expect(destinationConfig.safeParse({ ...base, gtfsPortals: [{ url: "https://x.example/" }] }).success).toBe(false);
    expect(destinationConfig.safeParse({ ...base, seasonalSources: [{ url: "https://x.example/" }] }).success).toBe(false);
    expect(destinationConfig.safeParse({ ...base, travelAdvisory: { url: "https://x.example/" } }).success).toBe(false);
    expect(destinationConfig.safeParse({ ...base, taxFreeRules: { url: "https://x.example/" } }).success).toBe(false);
  });
});

describe("validateDestinationConfig", () => {
  it("returns { ok: true, value } on success", () => {
    const r = validateDestinationConfig({ slug: "testland", languages: ["en"] });
    expect(r.ok).toBe(true);
    expect(r.value.slug).toBe("testland");
  });

  it("returns { ok: false, error } naming the field on failure", () => {
    const r = validateDestinationConfig({ languages: ["en"] });
    expect(r.ok).toBe(false);
    expect(r.error).toContain("slug");
  });
});

// D1's own ACCEPTANCE line: "three seeds validate; Japan seed carries advisory URL, ja
// language, koyo source list, GTFS feed entries, tax-free pointer."
describe("the three seed files (ACCEPTANCE)", () => {
  it("all three seeds validate against the schema", async () => {
    for (const slug of ["japan", "korea"]) {
      const data = await seed(slug);
      const r = validateDestinationConfig(data);
      expect(r.ok, `${slug}: ${r.error}`).toBe(true);
    }
  });

  it("the Japan seed carries every field the ACCEPTANCE line names", async () => {
    const japan = await seed("japan");
    expect(japan.languages).toEqual(["ja"]);
    expect(japan.travelAdvisory?.url).toContain("travel.state.gov");
    expect(japan.seasonalSources.length).toBeGreaterThan(0); // koyo source list
    expect(japan.gtfsPortals.length).toBeGreaterThan(0); // GTFS feed entries
    expect(japan.taxFreeRules?.url).toContain("mlit.go.jp"); // tax-free pointer
  });

  it("every URL-bearing field in every seed has a verified_on (re-checks the real files, not just the schema)", async () => {
    for (const slug of ["japan", "korea"]) {
      const data = await seed(slug);
      const pointers = [
        data.travelAdvisory,
        data.taxFreeRules,
        ...(data.transitAuthorities ?? []).map((t) => t.url),
        ...(data.gtfsPortals ?? []),
        ...(data.seasonalSources ?? []),
      ].filter(Boolean);
      for (const p of pointers) {
        expect(p.verified_on, `${slug}: ${p.url} missing verified_on`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it("the Japan travel advisory is honestly marked unconfirmed (matches the guide's own bot-gated note)", async () => {
    const japan = await seed("japan");
    // src/content/guides/japan/08-health-and-safety.json: "could not be independently
    // confirmed — its page is bot-gated against automated fetches". The destination config
    // must not silently claim more certainty than the guide itself does.
    expect(japan.travelAdvisory.state).toBe("unconfirmed");
  });
});
