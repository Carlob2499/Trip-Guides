import { getCollection } from "astro:content";
import { accentFor } from "../../lib/themes";

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
  const dekSafe     = xmlEscape(truncate(dek, 80));

  // Scale display font to fit: short titles get 80px, long ones shrink
  const tfs = title.length > 20 ? (title.length > 28 ? 48 : 62) : 80;
  const dekY = 310 + Math.ceil(tfs * 1.25) + 16;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f3ecdf"/>
  <rect x="0" y="0" width="8" height="630" fill="${accent}"/>
  <rect x="0" y="608" width="1200" height="22" fill="${accent}"/>
  <text x="68" y="72"
        font-family="'Courier New',monospace" font-size="13" fill="#615849" letter-spacing="4"
        font-weight="700">WAYPOINT</text>
  <rect x="68" y="90" width="48" height="2" fill="${accent}"/>
  <text x="68" y="166"
        font-family="'Courier New',monospace" font-size="17" fill="${accent}"
        letter-spacing="3" font-weight="700">${countrySafe}</text>
  <text x="68" y="310"
        font-family="Georgia,'Times New Roman',serif" font-size="${tfs}" fill="#211e1a"
        font-style="italic" font-weight="400">${titleSafe}</text>
  <text x="68" y="${dekY}"
        font-family="Arial,sans-serif" font-size="22" fill="#615849">${dekSafe}</text>
</svg>`;

  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
  });
}
