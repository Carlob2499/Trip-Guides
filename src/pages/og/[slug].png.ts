import { getCollection } from "astro:content";
import { accentFor } from "../../lib/themes";
import sharp from "sharp";

export async function getStaticPaths() {
  const guides = await getCollection("guides");
  return guides.map((g) => ({
    params: { slug: g.id },
    props: { data: g.data },
  }));
}

export async function GET({ props }: { props: { data: any } }) {
  const { data } = props;
  const title   = data.title  || "Guide";
  const country = data.country || "";
  const dek     = data.dek    || "";
  const accent  = accentFor(country);

  function xmlEscape(s: string) {
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
  function truncate(s: string, n: number) {
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }

  const titleSafe   = xmlEscape(truncate(title, 28));
  const countrySafe = xmlEscape(country.toUpperCase());
  const dekSafe     = xmlEscape(truncate(dek, 76));

  // Scale display font to keep title on one line
  const tfs  = title.length > 20 ? (title.length > 28 ? 48 : 62) : 80;
  const dekY = 310 + Math.ceil(tfs * 1.25) + 20;

  // Font hints ordered for Netlify's Ubuntu image (librsvg) then browsers:
  // Liberation* are the Linux equivalents of the Windows/Mac metric-compatible fonts.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f3ecdf"/>
  <rect x="0" y="0" width="8" height="630" fill="${accent}"/>
  <rect x="0" y="608" width="1200" height="22" fill="${accent}"/>
  <text x="68" y="72"
        font-family="'Liberation Mono','Courier New',monospace"
        font-size="13" fill="#615849" letter-spacing="4" font-weight="700">WAYPOINT</text>
  <rect x="68" y="90" width="48" height="2" fill="${accent}"/>
  <text x="68" y="166"
        font-family="'Liberation Mono','Courier New',monospace"
        font-size="17" fill="${accent}" letter-spacing="3" font-weight="700">${countrySafe}</text>
  <text x="68" y="310"
        font-family="'Liberation Serif',Georgia,'Times New Roman',serif"
        font-size="${tfs}" fill="#211e1a" font-style="italic" font-weight="400">${titleSafe}</text>
  <text x="68" y="${dekY}"
        font-family="'Liberation Sans',Arial,sans-serif"
        font-size="22" fill="#615849">${dekSafe}</text>
</svg>`;

  // Rasterise SVG → PNG using sharp (already a dep via Astro's image optimiser).
  // Social platforms (Twitter, WhatsApp, Facebook) require raster images for og:image.
  const pngBuffer = await sharp(Buffer.from(svg, "utf-8")).png().toBuffer();

  return new Response(pngBuffer, {
    headers: { "Content-Type": "image/png" },
  });
}
