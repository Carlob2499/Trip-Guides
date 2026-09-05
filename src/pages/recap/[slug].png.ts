import { getCollection } from "astro:content";
import { tripRecapStats } from "../../features/exports/index";
import { cardIdentity, xmlEscape, svgToPngResponse, CARD_SERIF, CARD_SANS } from "../og/_card";
import { DARK_SURFACES, DARK_INK, DARK_QUIET_INK } from "../../lib/accent-tokens";

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
  const { title, accent, accentInk, titleSafe, countrySafe } = cardIdentity(slug, data);
  const stats = tripRecapStats(data);

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
    <rect x="${x}" y="420" width="${chipW - 16}" height="94" rx="10" fill="${DARK_SURFACES[0]}" stroke="${accent}" stroke-opacity="0.5"/>
    <text x="${x + (chipW - 16) / 2}" y="475" text-anchor="middle"
          font-family="${CARD_SANS}" font-size="27" fill="${DARK_INK}" font-weight="700">${c}</text>`;
  }).join("");

  // Same forest register as the standard card now (work order §4) — the two are siblings, and
  // the recap says which one it is in words rather than by being a different colour. Ground,
  // ink and quiet ink are base.css's dark block, read from lib/accent-tokens.ts. The title is
  // the SERIF here as it is there; the mono face went with the hand-picked palette.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${DARK_SURFACES[2]}"/>
  <rect x="0" y="0" width="8" height="630" fill="${accent}"/>
  <text x="68" y="72"
        font-family="${CARD_SANS}"
        font-size="13" fill="${DARK_QUIET_INK}" letter-spacing="4" font-weight="700">WAYPOINT · TRIP RECAP</text>
  <rect x="68" y="90" width="48" height="2" fill="${accent}"/>
  <text x="68" y="166"
        font-family="${CARD_SANS}"
        font-size="17" fill="${accentInk}" letter-spacing="3" font-weight="700">${countrySafe}</text>
  <text x="68" y="290"
        font-family="${CARD_SERIF}"
        font-size="${tfs}" fill="${DARK_INK}" font-weight="700" letter-spacing="-1.5">${titleSafe(28)}</text>
  <text x="68" y="340"
        font-family="${CARD_SANS}"
        font-size="22" fill="${DARK_QUIET_INK}">How it actually went</text>
  ${chipsSvg}
</svg>`;

  return svgToPngResponse(svg);
}
