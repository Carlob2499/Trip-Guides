/* Shared plumbing for the two SVG→PNG card endpoints (og/ and recap/) — the escape,
   truncation, accent/label derivation and rasterisation they had each copy-pasted
   (audit dedup, 2026-08-14). Underscore-prefixed: not a route. */
import { accentForGuide } from "../../lib/palettes";
import { accentTokens } from "../../lib/accent-tokens";
import sharp from "sharp";

/* The two font stacks both cards paint with, in ONE place. These are not the site's faces and
   cannot be: the cards are rasterised by librsvg on the CI image, which loads no webfonts, so
   Literata and Atkinson Hyperlegible Next are unavailable at the only moment that matters.
   Liberation Serif/Sans are the metric-compatible Linux stand-ins (Georgia/Arial behind them for
   a browser preview). Naming them here means the substitution is one decision recorded once,
   rather than six string literals that could each drift into a different fallback. */
export const CARD_SERIF = "'Liberation Serif',Georgia,serif";
export const CARD_SANS = "'Liberation Sans',Arial,sans-serif";

export function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/** The identity strip both cards open with: accent (keyed on the real country — functional)
 *  and the printed label, which prefers `region` so a single-state US guide doesn't read as a
 *  whole-country one. */
type CardData = { title?: string; country?: string; region?: string; theme?: { primary?: string } | null };

export function cardIdentity(slug: string, data: CardData) {
  const title = data.title || "Guide";
  const country = data.country || "";
  const accent = accentForGuide(slug, data.theme, country);
  return {
    title,
    /** The identity colour itself — for FILLS (the edge stripe, the foot band). Never text. */
    accent,
    /* Both cards now sit on the forest ground, and a raw accent is an identity colour, not a
       legible one: Korea's moss measures ~2.6:1 on #0d1512. Accent TEXT takes the same
       dark-ground derivation every dark surface in the product takes (accent-tokens.ts's
       inkDark, >= 4.5:1 on every dark surface) rather than a shade picked by eye per card. */
    accentInk: accentTokens(accent).inkDark,
    titleSafe: (n: number) => xmlEscape(truncate(title, n)),
    countrySafe: xmlEscape((data.region || country).toUpperCase()),
  };
}

/** Rasterise SVG → PNG (sharp is already a dep via Astro's image optimiser; social platforms
 *  require raster og:images) and wrap as a Response. Uint8Array because the DOM Response type
 *  doesn't accept Node's Buffer directly. */
export async function svgToPngResponse(svg: string): Promise<Response> {
  const pngBuffer = await sharp(Buffer.from(svg, "utf-8")).png().toBuffer();
  return new Response(new Uint8Array(pngBuffer), { headers: { "Content-Type": "image/png" } });
}
