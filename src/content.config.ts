import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// A point on the map.
const coord = z.object({ lat: z.number(), lng: z.number() });

// The eleven kinds of section a guide can contain. Each one lists the fields it
// needs; if a content file gets one wrong, the build fails with a clear message.
// NOTE: when adding a new type here, also add it to Block.astro and CLAUDE.md.

// Shared counter shape used by the `raids` type.
const counter = z.object({
  pokemon: z.string(),
  fast:    z.string(),
  charged: z.string(),
  typing:  z.string(),
});

const section = z.discriminatedUnion("type", [
  z.object({ type: z.literal("panel"),  group: z.string(), title: z.string().optional(), body: z.string().optional(), checklist: z.array(z.string()).optional() }),
  z.object({ type: z.literal("prose"),  group: z.string(), title: z.string().optional(), body: z.string().optional() }),
  z.object({ type: z.literal("list"),   group: z.string(), title: z.string().optional(), items: z.array(z.string()) }),
  z.object({ type: z.literal("routes"), group: z.string(), title: z.string().optional(), steps: z.array(z.string()) }),
  z.object({ type: z.literal("map"),    group: z.string(), title: z.string().optional(), center: coord, span: z.number().optional() }),
  // weather — live 7-day Open-Meteo strip. No coords here: reads lat/lng from the
  // guide's first `map` section at runtime (so it needs no per-guide config). If the
  // guide has no map section the block stays hidden. `note` is an optional caption.
  z.object({ type: z.literal("weather"), group: z.string(), title: z.string().optional(), note: z.string().optional() }),
  // holidays — public holidays for the trip, fetched at BUILD time from Nager.Date
  // into src/data/holidays/{CC}-{year}.json (offline-safe, no client JS). The country
  // comes from themes.ts COUNTRY_CODES; the dates come from the guide's `days` section.
  // `year` is optional (defaults to the derived trip year). The block highlights any
  // holiday during the trip, notes ones just before/after, and hides if no data file
  // exists for the country/year.
  z.object({ type: z.literal("holidays"), group: z.string(), title: z.string().optional(), note: z.string().optional(), year: z.number().int().optional() }),
  z.object({ type: z.literal("days"),   group: z.string(), title: z.string().optional(), items: z.array(z.object({
    date: z.string(), title: z.string(),
    pace: z.string().optional(), note: z.string().optional(), body: z.string().optional(), fit: z.string().optional(),
    checklist: z.array(z.string()).optional(),
  })) }),
  z.object({ type: z.literal("sights"), group: z.string(), title: z.string().optional(), items: z.array(z.object({
    name: z.string(), kicker: z.string().optional(), body: z.string().optional(),
    img: z.object({ file: z.string(), alt: z.string().optional() }).optional(),
    map: coord.optional(),
  })) }),
  z.object({ type: z.literal("budget"), group: z.string(), title: z.string().optional(),
    intro: z.string().optional(), currency: z.string().optional(), days: z.number().optional(),
    party: z.number().optional(),       // number of people sharing group costs (default 1)
    items: z.array(z.object({
      label: z.string(),
      basis: z.enum(["day", "trip"]),   // per-day cost (× days) or a one-off trip cost
      est: z.number(),                  // midpoint estimate in the guide's currency
      low:  z.number().optional(),      // low-end estimate (same basis as est)
      high: z.number().optional(),      // high-end estimate (same basis as est)
      category: z.string().optional(),  // groups items under a labelled category header
      per: z.enum(["person", "group"]).optional(), // "group" ÷ party in per-person view
      note: z.string().optional(),
    })) }),
  // raids — structured raid boss counter tables; replaces hand-written HTML in prose bodies.
  // Each boss renders as a collapsible <details> card with a typed counter table.
  // `strategy` may contain simple inline HTML (<b>, <a>); no block elements.
  z.object({ type: z.literal("raids"),  group: z.string(), title: z.string().optional(),
    bosses: z.array(z.object({
      name:        z.string(),
      tier:        z.enum(["3-star", "5-star", "primal", "shadow", "super-mega"]),
      typing:      z.array(z.string()).min(1),
      shiny_odds:  z.string(),
      shiny_note:  z.string().optional(),
      trainers:    z.string(),
      note:        z.string().optional(),   // e.g. "GO Fest moveset: Counter + Psystrike"
      strategy:    z.string(),              // inline HTML allowed (<b>, <a>)
      counters:    z.array(counter).min(1).max(10),
    })) }),
]);

const guides = defineCollection({
  // Every .json file in src/content/guides/ becomes one guide page.
  loader: glob({ pattern: "**/*.json", base: "./src/content/guides" }),
  schema: z.object({
    kicker: z.string().optional(),
    title: z.string(),
    dek: z.string().optional(),
    footer: z.string().optional(),
    country: z.string(),          // sets the accent colour (see src/lib/themes.ts)
    verified: z.string().optional(),  // freshness stamp shown under the dek, e.g. "✓ Verified June 2026 — …"
    draft: z.boolean().optional(),    // true = a "Guide-to-be" scaffold; listed in the home page's draft tier, not the curated grid
    intro: z.string().optional(),
    sections: z.array(section),
  }),
});

export const collections = { guides };
