import { getCollection } from "astro:content";
import { cardIdentity, xmlEscape, truncate, svgToPngResponse, CARD_SERIF, CARD_SANS } from "./_card";
import { DARK_SURFACES, DARK_INK, DARK_QUIET_INK } from "../../lib/accent-tokens";

export async function getStaticPaths() {
  const guides = await getCollection("guides");
  return guides.map((g) => ({
    params: { slug: g.id },
    props: { slug: g.id, data: g.data },
  }));
}

export async function GET({ props }: { props: { slug: string; data: any } }) {
  const { slug, data } = props;
  const { title, accent, accentInk, titleSafe, countrySafe } = cardIdentity(slug, data);
  const dekSafe = xmlEscape(truncate(data.dek || "", 76));

  // Scale display font to keep title on one line
  const tfs  = title.length > 20 ? (title.length > 28 ? 48 : 62) : 80;
  const dekY = 310 + Math.ceil(tfs * 1.25) + 20;

  // The forest register (work order §4): the share card is the first thing anyone sees of a
  // guide, and every surface behind the link now sits inside the forest frame. The colours are
  // base.css's own dark block, read from lib/accent-tokens.ts — this file holds no palette of
  // its own, so the card cannot drift from the site the way a hand-copied hex would.
  // The accent stays the guide's, on a card-toned band, so the identity still leads.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${DARK_SURFACES[2]}"/>
  <rect x="0" y="0" width="8" height="630" fill="${accent}"/>
  <rect x="0" y="608" width="1200" height="22" fill="${accent}"/>
  <text x="68" y="72"
        font-family="${CARD_SANS}"
        font-size="13" fill="${DARK_QUIET_INK}" letter-spacing="4" font-weight="700">WAYPOINT</text>
  <rect x="68" y="90" width="48" height="2" fill="${accent}"/>
  <text x="68" y="166"
        font-family="${CARD_SANS}"
        font-size="17" fill="${accentInk}" letter-spacing="3" font-weight="700">${countrySafe}</text>
  <text x="68" y="310"
        font-family="${CARD_SERIF}"
        font-size="${tfs}" fill="${DARK_INK}" font-weight="700" letter-spacing="-0.5">${titleSafe(28)}</text>
  <text x="68" y="${dekY}"
        font-family="${CARD_SANS}"
        font-size="22" fill="${DARK_QUIET_INK}">${dekSafe}</text>
</svg>`;

  return svgToPngResponse(svg);
}
