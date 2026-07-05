// AI-facing "content brief" schema — deliberately standalone (plain `zod`, zero
// `astro:content` dependency) so it runs under `tsx` outside the Astro build.
//
// This is NOT the site's guide storage shape. The real guide schema (14-type
// sections-array discriminated union) lives in src/content.config.ts and is
// untouched by this feature. `scripts/brief-to-guide.mjs` maps a GuideBrief
// produced here into that real shape before anything is written to
// src/content/guides/.
import { z } from "zod";

export const guideSchema = z.object({
  title: z.string().describe("A short, evocative guide title for this destination."),
  cost: z.enum(["budget", "mid-range", "luxury"]).describe("Overall cost tier for a typical traveler here."),
  vibe: z.enum(["chill", "adventurous", "historic", "foodie", "party"]).describe("The dominant character of this destination."),
  currency: z.object({
    code: z.string().max(3).describe("ISO 4217 currency code, e.g. EUR"),
    name: z.string().describe("Full currency name, e.g. Euro"),
    exchange_advice: z.string().describe("Practical cash vs card reality on the ground."),
  }),
  culture_tips: z.array(z.string()).length(3).describe("Exactly 3 real-world cultural tips regarding etiquette or logistics."),
  must_do_activities: z.array(z.object({
    name: z.string(),
    description: z.string().describe("2 sentences maximum explaining the core appeal."),
    booking_required: z.boolean(),
  })).min(3).max(5),
  restaurants: z.array(z.object({
    name: z.string(),
    cuisine: z.string(),
    price_tier: z.enum(["$", "$$", "$$$"]),
    why_go: z.string().describe("1 sentence highlighting a specific dish or reason to visit."),
  })).optional(),
  emergency_contacts: z.array(z.object({
    service: z.string(),
    number: z.string(),
  })).optional(),
});

export type GuideBrief = z.infer<typeof guideSchema>;
