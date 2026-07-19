// Schema-contract tests for content.config.ts. `npm run build` only validates the guides
// that currently exist; it never asserts the refinements themselves still reject what
// they're meant to reject. These tests feed crafted objects straight to the collection
// schema so a loosened check (tabBudget, theme contrast, the provenance:"strict" gate,
// the learnings cross-references) fails here on the day it regresses, not the day some
// future guide happens to trip it.
//
// "astro:content" is a virtual module the Astro Vite plugin resolves at build time — it
// isn't reachable from plain Node/Vitest. defineCollection is a pass-through (see
// node_modules/astro/dist/content/config.js) and `z` is just the zod package astro
// re-exports (this repo has a single hoisted zod install, so this IS the same zod
// instance astro would hand back), so mocking the two is a faithful stand-in without
// needing Astro's build pipeline in a unit test.
import { describe, it, expect, vi } from "vitest";

vi.mock("astro:content", async () => {
  const zod = await import("zod");
  return { z: zod.z, defineCollection: (config: unknown) => config };
});

const { collections } = await import("./content.config");
const schema = (collections.guides as any).schema;

const LIGHT_BG = "#e9ebe3";
const DARK_BG = "#14181c";

function validGuide(overrides: Record<string, unknown> = {}) {
  return {
    title: "Test Guide",
    country: "Testland",
    sections: [{ type: "prose", group: "Overview", body: "Hello" }],
    ...overrides,
  };
}

function issuePaths(result: any) {
  if (result.success) return [];
  return result.error.issues.map((i: any) => i.path.join("."));
}

describe("content.config guides schema — tab budget", () => {
  it("passes at exactly the default budget (10 groups)", () => {
    const sections = Array.from({ length: 10 }, (_, i) => ({ type: "prose", group: `Group ${i}`, body: "x" }));
    const result = schema.safeParse(validGuide({ sections }));
    expect(result.success).toBe(true);
  });

  it("fails past the default budget (11 groups) with an issue on tabBudget", () => {
    const sections = Array.from({ length: 11 }, (_, i) => ({ type: "prose", group: `Group ${i}`, body: "x" }));
    const result = schema.safeParse(validGuide({ sections }));
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("tabBudget");
  });

  it("respects a raised per-guide tabBudget", () => {
    const sections = Array.from({ length: 11 }, (_, i) => ({ type: "prose", group: `Group ${i}`, body: "x" }));
    const result = schema.safeParse(validGuide({ sections, tabBudget: 11 }));
    expect(result.success).toBe(true);
  });

  it("still fails a guide that exceeds its own raised tabBudget", () => {
    const sections = Array.from({ length: 12 }, (_, i) => ({ type: "prose", group: `Group ${i}`, body: "x" }));
    const result = schema.safeParse(validGuide({ sections, tabBudget: 11 }));
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("tabBudget");
  });
});

describe("content.config guides schema — theme.primary contrast gate", () => {
  it("passes a mid-value colour legible on both grounds", () => {
    const result = schema.safeParse(
      validGuide({ theme: { primary: "#b07a1f", secondary: "#b07a1f", accent: "#b07a1f" } }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a colour illegible against the light background", () => {
    const result = schema.safeParse(
      validGuide({ theme: { primary: "#eeeeee", secondary: "#eeeeee", accent: "#eeeeee" } }),
    );
    expect(result.success).toBe(false);
    const msg = result.success ? "" : result.error.issues.map((i: any) => i.message).join(" ");
    expect(msg).toContain(LIGHT_BG);
  });

  it("rejects a colour illegible against the dark background even though it passes light", () => {
    const result = schema.safeParse(
      validGuide({ theme: { primary: "#001030", secondary: "#001030", accent: "#001030" } }),
    );
    expect(result.success).toBe(false);
    const msg = result.success ? "" : result.error.issues.map((i: any) => i.message).join(" ");
    expect(msg).toContain(DARK_BG);
  });

  it("rejects a theme colour not shaped like #RRGGBB", () => {
    const result = schema.safeParse(
      validGuide({ theme: { primary: "orange", secondary: "#b07a1f", accent: "#b07a1f" } }),
    );
    expect(result.success).toBe(false);
  });
});

describe("content.config guides schema — provenance:\"strict\" ≈ gate", () => {
  it("rejects a ≈ figure with no verified_on under strict provenance", () => {
    const result = schema.safeParse(
      validGuide({
        provenance: "strict",
        sections: [{ type: "prose", group: "Overview", body: "About ≈45 minutes by train." }],
      }),
    );
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("sections.0.verified_on");
  });

  it("accepts the same ≈ figure once verified_on is present", () => {
    const result = schema.safeParse(
      validGuide({
        provenance: "strict",
        sections: [
          {
            type: "prose",
            group: "Overview",
            body: "About ≈45 minutes by train.",
            verified_on: "2026-06-01",
            source_url: "https://example.com/schedule",
          },
        ],
      }),
    );
    expect(result.success).toBe(true);
  });

  it("does not gate ≈ figures when provenance isn't declared strict", () => {
    const result = schema.safeParse(
      validGuide({ sections: [{ type: "prose", group: "Overview", body: "About ≈45 minutes by train." }] }),
    );
    expect(result.success).toBe(true);
  });

  it("does not require verified_on for an honestly-flagged ⚠ gap under strict provenance", () => {
    const result = schema.safeParse(
      validGuide({
        provenance: "strict",
        sections: [{ type: "prose", group: "Overview", body: "⚠ Hours unconfirmed." }],
      }),
    );
    expect(result.success).toBe(true);
  });
});

describe("content.config guides schema — learnings cross-references", () => {
  const daysSection = { type: "days", group: "Itinerary", items: [{ date: "Mon Jul 13", title: "Arrival" }] };

  it("rejects a learnings day whose date matches no itinerary day", () => {
    const result = schema.safeParse(
      validGuide({
        sections: [daysSection],
        learnings: { verified_on: "2026-07-01", days: [{ date: "Tue Jul 14", actually: "Rained all day" }] },
      }),
    );
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("learnings.days");
  });

  it("accepts a learnings day whose date matches a real itinerary day", () => {
    const result = schema.safeParse(
      validGuide({
        sections: [daysSection],
        learnings: { verified_on: "2026-07-01", days: [{ date: "Mon Jul 13", actually: "Flight delayed" }] },
      }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a skipped stop whose declared group names no real section group", () => {
    const result = schema.safeParse(
      validGuide({
        sections: [daysSection],
        learnings: {
          verified_on: "2026-07-01",
          days: [{ date: "Mon Jul 13", skipped: [{ stop: "Museum", group: "Nonexistent Group" }] }],
        },
      }),
    );
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("learnings.days");
  });

  it("accepts a skipped stop whose declared group is real", () => {
    const result = schema.safeParse(
      validGuide({
        sections: [daysSection],
        learnings: {
          verified_on: "2026-07-01",
          days: [{ date: "Mon Jul 13", skipped: [{ stop: "Museum", group: "Itinerary" }] }],
        },
      }),
    );
    expect(result.success).toBe(true);
  });
});

describe("content.config guides schema — other field-level gates", () => {
  it("rejects a roomId shorter than the RTDB write-gate minimum", () => {
    const result = schema.safeParse(validGuide({ roomId: "short" }));
    expect(result.success).toBe(false);
  });

  it("accepts a 16-char lowercase-alphanumeric roomId", () => {
    const result = schema.safeParse(validGuide({ roomId: "abcd1234efgh5678" }));
    expect(result.success).toBe(true);
  });

  it("requires source_url + verified_on on an entry-requirements row", () => {
    const result = schema.safeParse(
      validGuide({ entry: [{ homeCountry: "United States", visa: "Visa-free" }] }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts a fully-provenanced entry-requirements row", () => {
    const result = schema.safeParse(
      validGuide({
        entry: [
          {
            homeCountry: "United States",
            visa: "Visa-free — K-ETA required, up to 90 days",
            source_url: "https://example.gov/entry",
            verified_on: "2026-06-01",
          },
        ],
      }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects an advisory level outside 1–4", () => {
    const result = schema.safeParse(
      validGuide({
        advisory: { level: 5, title: "Bad", source_url: "https://example.gov/advisory", verified_on: "2026-06-01" },
      }),
    );
    expect(result.success).toBe(false);
  });
});
