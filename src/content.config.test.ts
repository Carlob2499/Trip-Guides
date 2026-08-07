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

const LIGHT_BG = "#dfe3d9";
const DARK_BG = "#0f1317";

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

// The scaffolder↔schema seam: scaffold-guide.mjs emits a guide the BUILD must accept, but
// nothing ever asserted that contract — a scaffold field the schema rejects would surface
// as a red new-guide Action, not a red local test. Born after the R6 phase seeds landed in
// the scaffold; parses the real scaffold output (map/weather/holidays wired, niche section,
// facet tags) against the real collection schema.
describe("content.config guides schema — scaffold contract", () => {
  it("accepts a freshly scaffolded guide, facet seeds included", async () => {
    const { buildGuideObject } = await import("../scripts/scaffold-guide.mjs");
    const g = buildGuideObject({ country: "South Korea", niche: "vintage vinyl shops" });
    const result = schema.safeParse(g);
    expect(issuePaths(result)).toEqual([]);
    expect(result.success).toBe(true);
  });
});

describe("content.config guides schema — panelGroups (Atlas Phase 2)", () => {
  it("accepts a panelGroups entry naming an all-carded, all-titled group", () => {
    const sections = [
      { type: "prose", group: "Essentials", title: "A", body: "x" },
      { type: "budget", group: "Essentials", title: "B", items: [] },
    ];
    const result = schema.safeParse(validGuide({ sections, panelGroups: ["Essentials"] }));
    expect(issuePaths(result)).toEqual([]);
    expect(result.success).toBe(true);
  });

  it("rejects a panelGroups entry that names no real group (the typo failure mode)", () => {
    const result = schema.safeParse(validGuide({ panelGroups: ["Essentails"] }));
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("panelGroups");
  });

  it("rejects a panel group containing a non-carded type (days render their own cards)", () => {
    const sections = [
      { type: "prose", group: "Plan", title: "A", body: "x" },
      { type: "days", group: "Plan", title: "Itinerary", items: [{ date: "2026-01-01", d: "Day", title: "Day 1", body: "x" }] },
    ];
    const result = schema.safeParse(validGuide({ sections, panelGroups: ["Plan"] }));
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("panelGroups");
  });

  it("rejects a panel group containing an untitled section (the title is the Panel's id)", () => {
    const sections = [{ type: "prose", group: "Overview", body: "x" }];
    const result = schema.safeParse(validGuide({ sections, panelGroups: ["Overview"] }));
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("panelGroups");
  });

  it("rejects duplicate titles within a panel group (the title is the storage id)", () => {
    const sections = [
      { type: "prose", group: "Overview", title: "Same", body: "x" },
      { type: "prose", group: "Overview", title: "Same", body: "y" },
    ];
    const result = schema.safeParse(validGuide({ sections, panelGroups: ["Overview"] }));
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("panelGroups");
  });

  it("accepts weather and holidays in a panel group (hostable-but-not-carded: the Panel hides with their empty wrapper)", () => {
    const sections = [
      { type: "panel", group: "Plan", title: "Checklist", body: "x" },
      { type: "weather", group: "Plan", title: "Weather" },
      { type: "holidays", group: "Plan", title: "Public holidays" },
    ];
    const result = schema.safeParse(validGuide({ sections, panelGroups: ["Plan"] }));
    expect(issuePaths(result)).toEqual([]);
    expect(result.success).toBe(true);
  });
});

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
      validGuide({ theme: { primary: "#a6721b", secondary: "#a6721b", accent: "#a6721b" } }),
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
      validGuide({ theme: { primary: "orange", secondary: "#a6721b", accent: "#a6721b" } }),
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

// `region` (session #30) — a display-only state/multi-state override for a country large
// enough that naming it alone reads broader than the trip is (the US-guide "Sedona" ⇒
// "United States" mislabel that forced this). `country` must always stay parseable as a
// real country string (every currency/timezone-fallback/emergency-number/continent lookup
// keys on it), so this only asserts `region` doesn't loosen or replace that requirement.
describe("content.config guides schema — region (state/multi-state display override)", () => {
  it("accepts a guide with no region set (every pre-existing guide)", () => {
    const result = schema.safeParse(validGuide());
    expect(result.success).toBe(true);
  });

  it("accepts a single-state region alongside a real country", () => {
    const result = schema.safeParse(validGuide({ country: "United States", region: "Arizona" }));
    expect(result.success).toBe(true);
  });

  it("accepts a multi-state region string", () => {
    const result = schema.safeParse(validGuide({ country: "United States", region: "Arizona & Utah" }));
    expect(result.success).toBe(true);
  });

  it("still requires country even when region is set", () => {
    const g: Record<string, unknown> = validGuide({ region: "Arizona" });
    delete g.country;
    const result = schema.safeParse(g);
    expect(result.success).toBe(false);
  });
});

describe("content.config guides schema — prose tag allowlist (S2)", () => {
  it("passes clean allowlisted HTML", () => {
    const result = schema.safeParse(
      validGuide({ sections: [{ type: "prose", group: "Overview", body: "<p>Hello <b>world</b> <a href='https://x.com'>link</a></p>" }] }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a <script> tag in body", () => {
    const result = schema.safeParse(
      validGuide({ sections: [{ type: "prose", group: "Overview", body: "<p>hi</p><script>alert(1)</script>" }] }),
    );
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("sections.0.body");
  });

  it("rejects an onerror= handler on an <img>", () => {
    const result = schema.safeParse(
      validGuide({ sections: [{ type: "prose", group: "Overview", body: "<img src=x onerror=alert(1)>" }] }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a javascript: href", () => {
    const result = schema.safeParse(
      validGuide({ sections: [{ type: "prose", group: "Overview", body: "<a href=\"javascript:alert(1)\">click</a>" }] }),
    );
    expect(result.success).toBe(false);
  });

  it("allows the data-addr-kr span (field-tools tap-to-copy)", () => {
    const result = schema.safeParse(
      validGuide({ sections: [{ type: "prose", group: "Overview", body: "<span data-addr-kr='서울'>Seoul</span>" }] }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a span carrying any other attribute", () => {
    const result = schema.safeParse(
      validGuide({ sections: [{ type: "prose", group: "Overview", body: "<span style='color:red'>x</span>" }] }),
    );
    expect(result.success).toBe(false);
  });

  it("checks list items too", () => {
    const result = schema.safeParse(
      validGuide({ sections: [{ type: "list", group: "Overview", items: ["<script>bad()</script>"] }] }),
    );
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("sections.0.items.0");
  });
});

describe("content.config guides schema — archived guide state (D4)", () => {
  it("accepts a guide with archived: true", () => {
    const result = schema.safeParse(validGuide({ archived: true }));
    expect(result.success).toBe(true);
  });

  it("accepts a guide with archived omitted (default unset, not required)", () => {
    const result = schema.safeParse(validGuide());
    expect(result.success).toBe(true);
  });

  it("rejects a non-boolean archived value", () => {
    const result = schema.safeParse(validGuide({ archived: "yes" }));
    expect(result.success).toBe(false);
  });
});

describe("content.config guides schema — cover (R4: widened sources + living video)", () => {
  it("accepts the classic Commons cover unchanged (no existing guide regresses)", () => {
    const result = schema.safeParse(validGuide({ cover: { file: "Nyhavn-Copenhagen.JPG", alt: "Nyhavn" } }));
    expect(result.success).toBe(true);
  });

  it("accepts a direct royalty-free src WITH credit + license", () => {
    const result = schema.safeParse(validGuide({ cover: {
      src: "https://images.pexels.com/photos/12345/seoul.jpg?w={w}",
      credit: "Jane Doe · Pexels", license: "Pexels License",
    } }));
    expect(result.success).toBe(true);
  });

  it("rejects a direct src without credit/license — the honesty apparatus travels with the widened horizon", () => {
    const result = schema.safeParse(validGuide({ cover: { src: "https://images.pexels.com/photos/12345/seoul.jpg" } }));
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("cover.src");
  });

  it("rejects an http (non-https) src", () => {
    const result = schema.safeParse(validGuide({ cover: {
      src: "http://images.pexels.com/photos/1/x.jpg", credit: "X", license: "Y",
    } }));
    expect(result.success).toBe(false);
  });

  it("rejects file + src together (two still sources, one slot)", () => {
    const result = schema.safeParse(validGuide({ cover: {
      file: "A.jpg", src: "https://images.pexels.com/photos/1/x.jpg", credit: "X", license: "Y",
    } }));
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("cover.src");
  });

  it("rejects an empty cover object (needs file, src, or video)", () => {
    const result = schema.safeParse(validGuide({ cover: {} }));
    expect(result.success).toBe(false);
  });

  it("accepts video with required credit + license (poster optional — the photo cover is the poster)", () => {
    const result = schema.safeParse(validGuide({ cover: {
      file: "A.jpg",
      video: { src: "https://videos.pexels.com/video-files/1/a.mp4", credit: "Jane Doe · Pexels", license: "Pexels License" },
    } }));
    expect(result.success).toBe(true);
  });

  it("rejects video missing credit or license", () => {
    const result = schema.safeParse(validGuide({ cover: {
      file: "A.jpg", video: { src: "https://videos.pexels.com/video-files/1/a.mp4" },
    } }));
    expect(result.success).toBe(false);
  });

  it("accepts a video-only cover (poster falls back to the first sight photo downstream)", () => {
    const result = schema.safeParse(validGuide({ cover: {
      video: { src: "https://videos.pexels.com/video-files/1/a.mp4", credit: "J · Pexels", license: "Pexels License" },
    } }));
    expect(result.success).toBe(true);
  });
});

// The same widened-horizon trade cover.src makes, now applied to sight photos: a
// repository of sights is only as broad as the sources it can draw on, but a source
// whose licence is not machine-verifiable must carry its attribution in the data.
describe("content.config guides schema — sights img (widened sources)", () => {
  const sights = (img: unknown) => [{ type: "sights", group: "See", items: [{ name: "A spot", img }] }];

  it("accepts the classic Commons file unchanged (no existing guide regresses)", () => {
    const result = schema.safeParse(validGuide({ sections: sights({ file: "Nyhavn-Copenhagen.JPG", alt: "Nyhavn" }) }));
    expect(result.success).toBe(true);
  });

  it("accepts a direct royalty-free src WITH credit + license", () => {
    const result = schema.safeParse(validGuide({ sections: sights({
      src: "https://images.pexels.com/photos/12345/seoul.jpg?w={w}",
      credit: "Jane Doe · Pexels", license: "Pexels License", alt: "A street",
    }) }));
    expect(result.success).toBe(true);
  });

  it("rejects a direct src without credit/license — attribution travels in the data or not at all", () => {
    const result = schema.safeParse(validGuide({ sections: sights({ src: "https://images.pexels.com/photos/12345/seoul.jpg" }) }));
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("sections.0.items.0.img.src");
  });

  it("rejects an http (non-https) src", () => {
    const result = schema.safeParse(validGuide({ sections: sights({
      src: "http://images.pexels.com/photos/1/x.jpg", credit: "X", license: "Y",
    }) }));
    expect(result.success).toBe(false);
  });

  it("rejects file + src together (two sources, one slot)", () => {
    const result = schema.safeParse(validGuide({ sections: sights({
      file: "A.jpg", src: "https://images.pexels.com/photos/1/x.jpg", credit: "X", license: "Y",
    }) }));
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("sections.0.items.0.img.src");
  });

  it("rejects an img object with neither file nor src", () => {
    const result = schema.safeParse(validGuide({ sections: sights({ alt: "orphaned alt text" }) }));
    expect(result.success).toBe(false);
  });

  it("rejects a non-https creditUrl", () => {
    const result = schema.safeParse(validGuide({ sections: sights({
      src: "https://images.pexels.com/photos/1/x.jpg", credit: "X", license: "Y", creditUrl: "http://pexels.com/x",
    }) }));
    expect(result.success).toBe(false);
  });
});

describe("content.config guides schema — descriptors (R5 group-key guard)", () => {
  it("accepts descriptors whose keys are real section groups", () => {
    const result = schema.safeParse(validGuide({ descriptors: { Overview: "the lay of the land" } }));
    expect(result.success).toBe(true);
  });

  it("rejects a descriptor key no section uses (a group rename must error, not silently orphan the line)", () => {
    const result = schema.safeParse(validGuide({ descriptors: { "Getting around": "stale key from before the R1 rename" } }));
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("descriptors.Getting around");
  });
});

// Plan B — the inclement-day alternate (creator ruling 2026-08-02). The alternate names a
// venue, which makes it a perishable claim: provenance is REQUIRED at the schema level, same
// discipline as entry[], because "go to the jjimjilbang" with no source and no date is
// exactly the unverified-recommendation class the whole pipeline exists to refuse.
describe("content.config guides schema — plan_b (inclement-day alternate)", () => {
  const day = (plan_b: unknown) => [{
    type: "days", group: "Days",
    items: [{ date: "Wed Jul 8", title: "Palaces", plan_b }],
  }];

  it("accepts a sourced rain alternate", () => {
    const result = schema.safeParse(validGuide({ sections: day({
      trigger: "rain",
      body: "<p>Head to <b>Siloam Sauna</b> (jjimjilbang, 3 min from Seoul Station) and wait it out.</p>",
      source_url: "https://www.siloamsauna.com/",
      verified_on: "2026-08-02",
    }) }));
    expect(issuePaths(result)).toEqual([]);
    expect(result.success).toBe(true);
  });

  it("rejects an alternate with no source — a refuge claim is perishable like any other", () => {
    const result = schema.safeParse(validGuide({ sections: day({
      trigger: "rain", body: "<p>Find a jjimjilbang.</p>", verified_on: "2026-08-02",
    }) }));
    expect(result.success).toBe(false);
  });

  it("rejects a trigger outside rain/closure", () => {
    const result = schema.safeParse(validGuide({ sections: day({
      trigger: "meteor", body: "<p>x</p>", source_url: "https://example.com/", verified_on: "2026-08-02",
    }) }));
    expect(result.success).toBe(false);
  });

  it("plan_b body rides the prose tag allowlist (a <script> there fails like anywhere else)", () => {
    const result = schema.safeParse(validGuide({ sections: day({
      trigger: "closure", body: "<p>ok</p><script>alert(1)</script>",
      source_url: "https://example.com/", verified_on: "2026-08-02",
    }) }));
    expect(result.success).toBe(false);
  });
});
