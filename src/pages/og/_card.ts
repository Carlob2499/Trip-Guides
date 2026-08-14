/* Shared plumbing for the two SVG→PNG card endpoints (og/ and recap/) — the escape,
   truncation, accent/label derivation and rasterisation they had each copy-pasted
   (audit dedup, 2026-08-14). Underscore-prefixed: not a route. */
import { accentForGuide } from "../../lib/palettes";
import sharp from "sharp";

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
  return {
    title,
    accent: accentForGuide(slug, data.theme, country),
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
