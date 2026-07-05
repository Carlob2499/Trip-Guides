// Retrieval grounding. Pulls the plain-text Wikivoyage article for a destination (and a
// Wikipedia summary for extra context) so the guide generator SUMMARIZES real, current
// travel content instead of inventing it from model weights. Wikivoyage is a free,
// no-key, CC-licensed travel wiki whose articles follow a consistent structure
// (Understand / Get in / Get around / See / Do / Eat / Drink / Sleep / Stay safe) — an
// ideal grounding source for exactly this task.
//
// Importable:  fetchGrounding("Kyoto, Japan") -> { context, sources, ... }
// CLI:         node scripts/fetch-wikivoyage.mjs "Kyoto, Japan"
//
// Graceful by design: a missing article yields empty context + a warning, never a crash
// — the generator then produces a thinner draft rather than failing outright.

import { pathToFileURL } from "node:url";

const UA = "waypoint-generator/1.0 (+https://github.com/Carlob2499/Trip-Guides)";
const WIKIVOYAGE = "https://en.wikivoyage.org/w/api.php";
const WIKIPEDIA = "https://en.wikipedia.org/api/rest_v1/page/summary";
// Keep the grounding context bounded so it fits comfortably in the model prompt.
const MAX_CONTEXT_CHARS = 16000;
// Traveler-relevant Wikivoyage sections, in the order we want them in the prompt. The
// transport-heavy "Get in" / "Get around" and meta sections (Talk, Learn, Connect, Cope,
// Go next) are deliberately dropped: on a big article they otherwise consume the whole
// context budget and starve the See/Do/Eat sections where the actual sights live — which
// is exactly what made an early draft pick trains and stations as "must-do activities".
const WANT_SECTIONS = ["See", "Do", "Eat", "Drink", "Buy", "Sleep", "Understand", "Stay safe", "Respect"];
const PER_SECTION_CHARS = 3200;

// Split a plain-text Wikivoyage extract into top-level (== H2 ==) sections and reassemble
// only the traveler-relevant ones, in WANT_SECTIONS order, each capped. Subsections
// (=== H3 ===) stay inside their parent section's body.
function selectSections(extract) {
  const headerRe = /^==([^=].*?)==\s*$/gm;
  const marks = [];
  let m;
  while ((m = headerRe.exec(extract))) marks.push({ title: m[1].trim(), end: headerRe.lastIndex, start: m.index });
  const intro = (marks.length ? extract.slice(0, marks[0].start) : extract).trim();
  const byName = {};
  for (let i = 0; i < marks.length; i++) {
    const body = extract.slice(marks[i].end, i + 1 < marks.length ? marks[i + 1].start : extract.length).trim();
    byName[marks[i].title.toLowerCase()] = { title: marks[i].title, body };
  }
  let out = intro ? intro.slice(0, 700) + "\n\n" : "";
  for (const want of WANT_SECTIONS) {
    const s = byName[want.toLowerCase()];
    if (!s || !s.body) continue;
    out += `== ${s.title} ==\n${s.body.slice(0, PER_SECTION_CHARS)}\n\n`;
    if (out.length >= MAX_CONTEXT_CHARS) break;
  }
  return out.trim();
}

// "Kyoto, Japan" -> "Kyoto" (the Wikivoyage/Wikipedia article title is the place, not
// the "City, Country" phrase).
function articleTitle(location) {
  return String(location || "").split(",")[0].trim();
}

async function getJson(url) {
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Plain-text extract of the Wikivoyage article (explaintext strips wiki markup).
async function wikivoyageExtract(title) {
  const params = new URLSearchParams({
    action: "query", prop: "extracts", explaintext: "1", redirects: "1",
    titles: title, format: "json", formatversion: "2",
  });
  const data = await getJson(`${WIKIVOYAGE}?${params}`);
  const page = data?.query?.pages?.[0];
  if (!page || page.missing || !page.extract) return null;
  return { title: page.title, extract: selectSections(page.extract) };
}

async function wikipediaSummary(title) {
  try {
    const data = await getJson(`${WIKIPEDIA}/${encodeURIComponent(title)}`);
    if (data?.type === "disambiguation" || !data?.extract) return null;
    return { title: data.title, extract: data.extract, url: data?.content_urls?.desktop?.page || null };
  } catch { return null; }
}

export async function fetchGrounding(location) {
  const title = articleTitle(location);
  if (!title) return { title: "", context: "", sources: [], found: false };

  const sources = [];
  let context = "";

  // Wikivoyage — the primary grounding source.
  try {
    const wv = await wikivoyageExtract(title);
    if (wv) {
      const url = `https://en.wikivoyage.org/wiki/${encodeURIComponent(wv.title.replace(/ /g, "_"))}`;
      sources.push({ name: `Wikivoyage: ${wv.title}`, url });
      context += `=== WIKIVOYAGE: ${wv.title} ===\n${wv.extract}\n\n`;
    } else {
      console.error(`[wikivoyage] no article for "${title}" — continuing with Wikipedia only`);
    }
  } catch (err) {
    console.error(`[wikivoyage] fetch failed for "${title}" (${err.message}) — continuing`);
  }

  // Wikipedia — supplementary context.
  const wp = await wikipediaSummary(title);
  if (wp) {
    if (wp.url) sources.push({ name: `Wikipedia: ${wp.title}`, url: wp.url });
    context += `=== WIKIPEDIA: ${wp.title} ===\n${wp.extract}\n\n`;
  }

  if (context.length > MAX_CONTEXT_CHARS) context = context.slice(0, MAX_CONTEXT_CHARS) + "\n…[truncated]";

  return { title, context: context.trim(), sources, found: context.length > 0 };
}

// ── CLI ──
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const location = process.argv.slice(2).join(" ");
  if (!location) {
    console.error('Usage: node scripts/fetch-wikivoyage.mjs "<City, Country>"');
    process.exit(1);
  }
  const g = await fetchGrounding(location);
  console.error(`[wikivoyage] "${g.title}" — ${g.found ? g.context.length + " chars" : "NO CONTEXT"}, ${g.sources.length} source(s)`);
  console.log(JSON.stringify({ title: g.title, found: g.found, sources: g.sources, contextPreview: g.context.slice(0, 600) }, null, 2));
}
