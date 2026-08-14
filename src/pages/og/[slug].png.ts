import { getCollection } from "astro:content";
import { cardIdentity, xmlEscape, truncate, svgToPngResponse } from "./_card";

export async function getStaticPaths() {
  const guides = await getCollection("guides");
  return guides.map((g) => ({
    params: { slug: g.id },
    props: { slug: g.id, data: g.data },
  }));
}

export async function GET({ props }: { props: { slug: string; data: any } }) {
  const { slug, data } = props;
  const { title, accent, titleSafe, countrySafe } = cardIdentity(slug, data);
  const dekSafe = xmlEscape(truncate(data.dek || "", 76));

  // Scale display font to keep title on one line
  const tfs  = title.length > 20 ? (title.length > 28 ? 48 : 62) : 80;
  const dekY = 310 + Math.ceil(tfs * 1.25) + 20;

  // Font hints ordered for the CI Ubuntu build image (librsvg) then browsers:
  // Liberation* are the Linux equivalents of the Windows/Mac metric-compatible fonts.
  // Palette mirrors base.css light-mode tokens (cartographic paper + map ink).
  // Quiet Edition parity (uniform application across surfaces): the title is a SERIF
  // (Liberation Serif standing in for Literata display) and the small data labels are a
  // plain SANS (Liberation Sans standing in for Source Sans 3) — no webfonts in librsvg.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#e3e7dc"/>
  <rect x="0" y="0" width="8" height="630" fill="${accent}"/>
  <rect x="0" y="608" width="1200" height="22" fill="${accent}"/>
  <text x="68" y="72"
        font-family="'Liberation Sans',Arial,sans-serif"
        font-size="13" fill="#3c4534" letter-spacing="4" font-weight="700">WAYPOINT</text>
  <rect x="68" y="90" width="48" height="2" fill="${accent}"/>
  <text x="68" y="166"
        font-family="'Liberation Sans',Arial,sans-serif"
        font-size="17" fill="${accent}" letter-spacing="3" font-weight="700">${countrySafe}</text>
  <text x="68" y="310"
        font-family="'Liberation Serif',Georgia,serif"
        font-size="${tfs}" fill="#0f141a" font-weight="700" letter-spacing="-0.5">${titleSafe(28)}</text>
  <text x="68" y="${dekY}"
        font-family="'Liberation Sans',Arial,sans-serif"
        font-size="22" fill="#3c4534">${dekSafe}</text>
</svg>`;

  return svgToPngResponse(svg);
}
