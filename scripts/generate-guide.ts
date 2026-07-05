// AI-driven guide generator (free-tier Groq, grounded on Wikivoyage).
//
// Pipeline — the model is a SUMMARIZER of retrieved material, not a knowledge source:
//   1. Retrieve real travel content (Wikivoyage + Wikipedia) for the destination.
//   2. Groq generates a structured "brief" (src/schemas/guideSchema.ts), instructed to
//      use ONLY the retrieved source text.
//   3. Enrich the checkable specifics from AUTHORITATIVE sources, never the model:
//      OSM Nominatim (coords/place_id) + Wikimedia Commons (verified photo filenames).
//   4. A second Groq pass self-critiques which items aren't supported by the sources.
//   5. Map into the site's real sections-array shape (scripts/brief-to-guide.mjs) and
//      write a draft:true guide with a ⚠ AI-provenance stamp for human verify/graduate.
//
// Usage: npm run create-guide -- --location "Kyoto, Japan" [--parameters "2 adults, foodie, mid-range"]

import "dotenv/config";
import Groq from "groq-sdk";
import { z, toJSONSchema } from "zod";
import path from "node:path";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { guideSchema } from "../src/schemas/guideSchema.ts";
import { buildGuideFromBrief } from "./brief-to-guide.mjs";
import { slugify } from "./scaffold-guide.mjs";
import { fetchGrounding } from "./fetch-wikivoyage.mjs";
import { lookupPlace } from "./lookup-place.mjs";
import { searchCommons } from "./search-commons.mjs";

// Only the GPT-OSS models on Groq support json_schema structured output (confirmed
// against Groq's structured-outputs docs). 120b is the more capable of the two.
const MODEL = "openai/gpt-oss-120b";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUIDES_DIR = path.join(ROOT, "src", "content", "guides");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseArgs(argv: string[]) {
  const a: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) { a[argv[i].slice(2)] = argv[i + 1]; i++; }
  }
  return a;
}

async function uniqueSlug(base: string) {
  let slug = base, n = 2;
  while (existsSync(path.join(GUIDES_DIR, `${slug}.json`))) { slug = `${base}-${n++}`; }
  return slug;
}

// "Kyoto, Japan" -> country "Japan", city "Kyoto".
function splitLocation(location: string) {
  const parts = location.split(",").map((s) => s.trim()).filter(Boolean);
  return { city: parts[0] || location.trim(), country: parts[parts.length - 1] || location.trim() };
}

const SYSTEM_PROMPT =
  "You are an expert, practical group-travel planner. You will be given SOURCE TEXT from " +
  "travel wikis about a destination. Produce a structured destination brief for a first-time " +
  "group of travelers. Base every specific fact ONLY on the provided SOURCE TEXT — do not add " +
  "attractions, restaurants, prices, or claims that are not present in it. If the sources do " +
  "not cover something, keep that part general rather than inventing specifics.\n" +
  "CRITICAL: For must_do_activities, name SPECIFIC real places by their exact proper name as " +
  "they appear in the source text (e.g. 'Fushimi Inari Taisha', 'Kinkaku-ji', 'Nishiki Market') " +
  "— NEVER a generic category like 'Temple Tour', 'City Walk', or 'Local Market'. A specific " +
  "proper-noun place name is required for every activity. Same for restaurants: name the actual " +
  "venue, not a food type.";

// Strict mode rejects the min/max/optional keywords our schema uses, so we steer with the
// schema (strict:false) and enforce the real contract with guideSchema.parse() + one retry.
async function generateBrief(groq: Groq, userMsg: string) {
  const jsonSchema = toJSONSchema(guideSchema);
  const call = async () => {
    const c = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userMsg }],
      response_format: { type: "json_schema", json_schema: { name: "travel_guide_brief", schema: jsonSchema } },
    });
    return guideSchema.parse(JSON.parse(c.choices[0]?.message?.content ?? ""));
  };
  try { return await call(); }
  catch { return await call(); } // one retry — the model occasionally under/over-fills a bounded array
}

// Second pass: which generated items aren't actually supported by the source text.
const critiqueSchema = z.object({
  unsupported_activities: z.array(z.string()),
  unsupported_restaurants: z.array(z.string()),
});
async function selfCritique(groq: Groq, brief: any, context: string) {
  if (!context) return { activities: new Set<string>(), restaurants: new Set<string>() };
  try {
    const c = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a fact-checker. Given SOURCE TEXT and a generated draft, list the exact names of any activities or restaurants in the draft that are NOT clearly supported by the source text. Only list names that appear in the draft." },
        { role: "user", content:
            `SOURCE TEXT:\n${context}\n\nDRAFT ACTIVITIES:\n${brief.must_do_activities.map((a: any) => a.name).join("\n")}\n\n` +
            `DRAFT RESTAURANTS:\n${(brief.restaurants || []).map((r: any) => r.name).join("\n") || "(none)"}` },
      ],
      response_format: { type: "json_schema", json_schema: { name: "critique", schema: toJSONSchema(critiqueSchema) } },
    });
    const v = critiqueSchema.parse(JSON.parse(c.choices[0]?.message?.content ?? ""));
    return { activities: new Set(v.unsupported_activities), restaurants: new Set(v.unsupported_restaurants) };
  } catch {
    return { activities: new Set<string>(), restaurants: new Set<string>() }; // best-effort; the ⚠ stamp still covers the whole guide
  }
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  if (!a.location) {
    console.error('Usage: tsx scripts/generate-guide.ts --location "City, Country" [--parameters "traveler context"]');
    process.exit(1);
  }
  if (!process.env.GROQ_API_KEY) {
    console.error("[generate-guide] error: GROQ_API_KEY is not set (add it to .env — free key at console.groq.com)");
    process.exit(1);
  }

  const { city, country } = splitLocation(a.location);
  const today = new Date().toISOString().slice(0, 10);

  // 1. Retrieve grounding
  console.error(`[generate-guide] retrieving grounding for "${a.location}"…`);
  const grounding = await fetchGrounding(a.location);
  const userMsg =
    `Destination: ${a.location}.` + (a.parameters ? ` Traveler context: ${a.parameters}.` : "") +
    (grounding.found
      ? `\n\n=== SOURCE TEXT (base every specific on this) ===\n${grounding.context}`
      : `\n\n(No source text was available — keep all guidance general and high-level; do not invent specific venues or prices.)`);

  // 2. Generate
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.error(`[generate-guide] generating brief with ${MODEL}…`);
  const brief = await generateBrief(groq, userMsg);

  // 3. Enrich checkable specifics from authoritative sources (Nominatim ≥1s throttle)
  console.error(`[generate-guide] enriching ${brief.must_do_activities.length} activities (coords + photos)…`);
  const enrichment: Record<string, { lat?: number; lng?: number; place_id?: string; imgFile?: string }> = {};
  for (const act of brief.must_do_activities) {
    const place: any = await lookupPlace(`${act.name}, ${city}`, country);
    const located = Number.isFinite(place.lat) && Number.isFinite(place.lng);
    // Only attach a photo to a place we could actually geolocate. A name too vague to
    // geocode is too vague to trust a Commons match for — attaching a real-but-wrong
    // photo (e.g. a Miyajima gate for a generic "temple tour") is worse than none. The
    // photo query is scoped with the city to keep hits on the right place.
    const photos = located ? await searchCommons(`${act.name} ${city}`, 1) : [];
    enrichment[act.name] = located
      ? { lat: place.lat, lng: place.lng, place_id: place.place_id, imgFile: photos[0] }
      : {};
    await sleep(1100); // Nominatim usage policy: ≤1 request/second
  }

  // 4. Self-critique
  console.error(`[generate-guide] self-critique pass…`);
  const unsupported = await selfCritique(groq, brief, grounding.context);

  // 5. Map + write
  const guide = buildGuideFromBrief(brief, country, { enrichment, sources: grounding.sources, unsupported, date: today });
  const slug = await uniqueSlug(slugify(a.location));
  const guidePath = path.join(GUIDES_DIR, `${slug}.json`);
  await writeFile(guidePath, JSON.stringify(guide, null, 2) + "\n");
  console.log(`[generate-guide] wrote ${path.relative(ROOT, guidePath)} (slug: ${slug})`);
}

main().catch((err) => {
  console.error("[generate-guide] error:", err.message);
  process.exit(1);
});
