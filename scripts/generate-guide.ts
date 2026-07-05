// AI-driven guide generator. Calls Gemini via Google's own native SDK (@google/genai —
// NOT the Vercel AI SDK: as of mid-2026 Google's new "AQ."-format auth keys are
// rejected by @ai-sdk/google with an opaque OAuth error, while the native SDK accepts
// them directly) to produce a destination "brief" (src/schemas/guideSchema.ts), maps
// it into the site's real sections-array guide shape (scripts/brief-to-guide.mjs), and
// writes a draft guide to src/content/guides/. Always lands as draft:true — a human
// runs the existing research/verification pass and scripts/graduate-guide.mjs to
// publish it.
//
// Usage: npm run create-guide -- --location "Kyoto, Japan" [--parameters "2 adults, foodie trip, mid-range budget"]

import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { toJSONSchema } from "zod";
import path from "node:path";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { guideSchema } from "../src/schemas/guideSchema.ts";
import { buildGuideFromBrief } from "./brief-to-guide.mjs";
import { slugify } from "./scaffold-guide.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUIDES_DIR = path.join(ROOT, "src", "content", "guides");

function parseArgs(argv: string[]) {
  const a: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) { a[argv[i].slice(2)] = argv[i + 1]; i++; }
  }
  return a;
}

// Same 3-line existsSync loop scaffold-guide.mjs's (module-private) uniqueSlug uses —
// replicated here rather than exported from a file whose primary job is the human
// scaffold CLI, for the sake of this one extra caller.
async function uniqueSlug(base: string) {
  let slug = base, n = 2;
  while (existsSync(path.join(GUIDES_DIR, `${slug}.json`))) { slug = `${base}-${n++}`; }
  return slug;
}

// "Kyoto, Japan" -> "Japan". Deterministic and matches countryData's canonical strings
// (via its ALIASES map) — never trusts the AI's own title string for this.
function countryFromLocation(location: string) {
  const parts = location.split(",").map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] || location.trim();
}

const SYSTEM_PROMPT =
  "You are an expert, practical group-travel planner who has personally visited " +
  "hundreds of destinations. Give concrete, current, actionable advice a real " +
  "traveler could act on tomorrow — no generic filler, no invented statistics.";

async function main() {
  const a = parseArgs(process.argv.slice(2));
  if (!a.location) {
    console.error('Usage: tsx scripts/generate-guide.ts --location "City, Country" [--parameters "traveler context"]');
    process.exit(1);
  }
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("[generate-guide] error: GOOGLE_GENERATIVE_AI_API_KEY is not set (add it to .env)");
    process.exit(1);
  }

  const country = countryFromLocation(a.location);
  const prompt = `Destination: ${a.location}.` +
    (a.parameters ? ` Traveler context: ${a.parameters}.` : "") +
    " Produce a practical destination brief for a first-time group of travelers.";

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      // Standard JSON Schema (not Gemini's proprietary Type-enum schema dialect) —
      // reuses guideSchema.ts directly via zod's native converter, so there's no
      // hand-transcribed second schema that could silently drift from the real one.
      responseJsonSchema: toJSONSchema(guideSchema),
    },
  });

  // responseSchema/responseJsonSchema is a strong prompting constraint on the model,
  // not a client-side validator (unlike generateObject, which ran Zod's .parse()
  // internally) — so we validate explicitly here to keep the exact same guarantee:
  // buildGuideFromBrief only ever receives a confirmed-valid GuideBrief.
  const brief = guideSchema.parse(JSON.parse(response.text ?? ""));

  const guide = buildGuideFromBrief(brief, country);
  const slug = await uniqueSlug(slugify(a.location));
  const guidePath = path.join(GUIDES_DIR, `${slug}.json`);
  await writeFile(guidePath, JSON.stringify(guide, null, 2) + "\n");
  console.log(`[generate-guide] wrote ${path.relative(ROOT, guidePath)} (slug: ${slug})`);
}

main().catch((err) => {
  console.error("[generate-guide] error:", err.message);
  process.exit(1);
});
