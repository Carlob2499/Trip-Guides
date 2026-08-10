/* Ask an already-resolved image URL for a specific pixel width.

   Two URL shapes reach this, and they take their width differently:
   · a Wikimedia Commons `Special:FilePath/...` URL, which accepts `?width=N` and returns a
     server-rendered thumbnail — verified against the live endpoint 2026-08-08: the Nyhavn
     cover is 258 KB at full size and 14.5 KB at width=224;
   · a direct royalty-free CDN URL, which the schema lets a guide write with a `{w}` token
     (content.config.ts, `img.src`). No token means the URL is single-size and is returned
     untouched — substituting a width into a URL that does not declare one would be
     inventing an interface the CDN never offered.

   The same two-shape logic is inlined in SightsBlock.astro and GuideLayout.astro, each
   with its own srcset needs. This module is the version the hub uses; folding those two
   into it is a worthwhile cleanup but not one to bundle into a visual change. */

const COMMONS_FILEPATH = "commons.wikimedia.org/wiki/Special:FilePath/";

/** The URL at `w` CSS pixels, or the original when it cannot be resized. */
export function atWidth(url: string | null | undefined, w: number): string | null {
  if (!url) return null;
  if (url.includes("{w}")) return url.replace(/\{w\}/g, String(Math.round(w)));
  if (url.includes(COMMONS_FILEPATH)) {
    // Respect a width the caller already put there rather than appending a second one.
    return /[?&]width=/.test(url) ? url : `${url}${url.includes("?") ? "&" : "?"}width=${Math.round(w)}`;
  }
  return url;
}

/**
 * Width-descriptor srcset (`… 56w, … 448w`) for a resizable URL; null when single-size.
 *
 * The 1x/2x form below cannot serve the hub's up-next card, where the SAME <img> is a 56px
 * plate on desktop and a full-bleed 96px-tall cover on a phone — a pixel-descriptor srcset
 * has no way to say "the layout width itself changes". Pair this with a `sizes` attribute.
 */
export function srcsetWidths(url: string | null | undefined, widths: number[]): string | null {
  if (!url) return null;
  if (!url.includes("{w}") && !url.includes(COMMONS_FILEPATH)) return null;
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const w of widths) {
    const u = atWidth(url, w);
    // A Commons URL carrying its own ?width= comes back unchanged at every size, which would
    // promise the browser four assets that are one file. Same honesty rule as srcsetFor.
    if (!u || seen.has(u)) return null;
    seen.add(u);
    parts.push(`${u} ${Math.round(w)}w`);
  }
  return parts.join(", ");
}

/** `1x, 2x` srcset for a resizable URL; null when the URL is single-size (no srcset). */
export function srcsetFor(url: string | null | undefined, w: number): string | null {
  if (!url) return null;
  const resizable = url.includes("{w}") || url.includes(COMMONS_FILEPATH);
  if (!resizable) return null;
  const one = atWidth(url, w);
  const two = atWidth(url, w * 2);
  // A Commons URL that already carries its own ?width= is left alone by atWidth, so both
  // entries would be the same file — a srcset that promises a 2x asset and serves the 1x one.
  // Saying nothing is honest; saying "2x" about a 1x image is not.
  if (!one || !two || one === two) return null;
  return `${one} 1x, ${two} 2x`;
}
