import { getCollection } from "astro:content";
// Same accent resolution as the guide page + hub + OG card (uniform across surfaces).
import { accentForGuide } from "../../lib/palettes";
import { tripRecapStats } from "../../features/exports/index";
import sharp from "sharp";

// One recap card per guide that actually has a post-trip `learnings` block — the
// reality layer only renders when there IS reality to show (same rule the
// Learnings tab follows). A guide that hasn't happened yet gets no recap route
// at all, rather than a card with nothing honest to say.
export async function getStaticPaths() {
  const guides = await getCollection("guides");
  return guides
    .filter((g) => tripRecapStats(g.data as any).hasRecap)
    .map((g) => ({ params: { slug: g.id }, props: { slug: g.id, data: g.data } }));
}

export async function GET({ props }: { props: { slug: string; data: any } }) {
  const { slug, data } = props;
  const title   = data.title  || "Guide";
  const country = data.country || "";
  const accent  = accentForGuide(slug, data.theme, country);
  const stats   = tripRecapStats(data);

  function xmlEscape(s: string) {
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
  function truncate(s: string, n: number) {
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }

  const titleSafe   = xmlEscape(truncate(title, 28));
  const countrySafe = xmlEscape(country.toUpperCase());
  const tfs = title.length > 20 ? (title.length > 28 ? 44 : 56) : 68;

  const stops = stats.waypointsTotal > 0
    ? `${stats.hit} of ${stats.waypointsTotal} planned stops`
    : null;
  const spend = stats.spendTotal != null
    ? `${stats.currency}${Math.round(stats.spendTotal).toLocaleString("en-US")} trip total`
    : null;

  // Up to 3 stat chips — day count is always present; stops/spend render only when
  // the guide's own data actually supports them (never a fabricated placeholder).
  const chips = [`${stats.days} days`, stops, spend].filter((c): c is string => !!c);
  const chipSafe = chips.map((c) => xmlEscape(c));

  const chipW = 1064 / chipSafe.length;
  const chipsSvg = chipSafe.map((c, i) => {
    const x = 68 + i * chipW;
    return `
    <rect x="${x}" y="420" width="${chipW - 16}" height="94" rx="10" fill="#ffffff" fill-opacity="0.06" stroke="${accent}" stroke-opacity="0.5"/>
    <text x="${x + (chipW - 16) / 2}" y="475" text-anchor="middle"
          font-family="'Liberation Sans',Arial,sans-serif" font-size="27" fill="#e9ebe3" font-weight="700">${c}</text>`;
  }).join("");

  // Dark ground (distinct from the standard OG card) — reads as "after the trip",
  // not "come plan this trip". Font hints ordered for the CI Ubuntu build image
  // (librsvg) then browsers, same as the standard OG card.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#14181c"/>
  <rect x="0" y="0" width="8" height="630" fill="${accent}"/>
  <text x="68" y="72"
        font-family="'Liberation Mono','Courier New',monospace"
        font-size="13" fill="#97a08f" letter-spacing="4" font-weight="700">WAYPOINT · TRIP RECAP</text>
  <rect x="68" y="90" width="48" height="2" fill="${accent}"/>
  <text x="68" y="166"
        font-family="'Liberation Mono','Courier New',monospace"
        font-size="17" fill="${accent}" letter-spacing="3" font-weight="700">${countrySafe}</text>
  <text x="68" y="290"
        font-family="'Liberation Sans',Arial,sans-serif"
        font-size="${tfs}" fill="#e9ebe3" font-weight="700" letter-spacing="-1.5">${titleSafe}</text>
  <text x="68" y="340"
        font-family="'Liberation Sans',Arial,sans-serif"
        font-size="22" fill="#97a08f">How it actually went</text>
  ${chipsSvg}
</svg>`;

  const pngBuffer = await sharp(Buffer.from(svg, "utf-8")).png().toBuffer();

  return new Response(new Uint8Array(pngBuffer), {
    headers: { "Content-Type": "image/png" },
  });
}
