/* The one place that decides whether a photograph is served from this site or from someone
   else's. Every image URL a page emits passes through `local()`.

   scripts/fetch-media.mjs downloads the guide photographs at build time and writes
   media-manifest.json, keyed by the exact remote URL. `local()` swaps a hit for the local
   path and returns a miss untouched — so a photo that failed to download, or a width outside
   the fetched ladder, behaves exactly as it did before any of this existed. There is no state
   in which this function makes an image worse.

   Deliberately keyed on the finished URL rather than on (file, width). The four call sites
   that build Commons URLs (guide-view.ts twice, SightsBlock.astro, atlas/guide-record.ts) each
   assemble theirs slightly differently, and img-width.ts appends widths to already-built URLs.
   Keying on the output means this module needs to know none of that, and none of them need to
   change shape to adopt it. */

import manifest from "./media-manifest.json";

const MAP = manifest as Record<string, string>;

/* Astro serves public/ from the site base, which is "/Trip-Guides/" here — the same
   import.meta.env.BASE_URL rule the project applies to every other internal link. */
const base = () => {
  const b = import.meta.env?.BASE_URL ?? "/";
  return b.endsWith("/") ? b : `${b}/`;
};

/** A local path when this exact URL was fetched into the build; the URL itself when not. */
export function local<T extends string | null | undefined>(url: T): T | string {
  if (!url) return url;
  const hit = MAP[url];
  return hit ? `${base()}${hit}` : url;
}

/** srcset convenience: rewrites every URL in a `… 480w, … 800w` list through `local()`. */
export function localSrcset<T extends string | null | undefined>(srcset: T): T | string {
  if (!srcset) return srcset;
  return srcset
    .split(",")
    .map((part) => {
      const t = part.trim();
      const sp = t.lastIndexOf(" ");
      if (sp < 0) return local(t);
      return `${local(t.slice(0, sp))} ${t.slice(sp + 1)}`;
    })
    .join(", ");
}

/** How many renditions the build actually carries — used by the media coverage test. */
export const localCount = () => Object.keys(MAP).length;
