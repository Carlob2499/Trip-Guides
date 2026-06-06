import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// A point on the map.
const coord = z.object({ lat: z.number(), lng: z.number() });

// The seven kinds of section a guide can contain. Each one lists the fields it
// needs; if a content file gets one wrong, the build fails with a clear message.
const section = z.discriminatedUnion("type", [
  z.object({ type: z.literal("panel"),  group: z.string(), title: z.string().optional(), body: z.string().optional(), checklist: z.array(z.string()).optional() }),
  z.object({ type: z.literal("prose"),  group: z.string(), title: z.string().optional(), body: z.string().optional() }),
  z.object({ type: z.literal("list"),   group: z.string(), title: z.string().optional(), items: z.array(z.string()) }),
  z.object({ type: z.literal("routes"), group: z.string(), title: z.string().optional(), steps: z.array(z.string()) }),
  z.object({ type: z.literal("map"),    group: z.string(), title: z.string().optional(), center: coord, span: z.number().optional() }),
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
    intro: z.string().optional(),
    sections: z.array(section),
  }),
});

export const collections = { guides };
