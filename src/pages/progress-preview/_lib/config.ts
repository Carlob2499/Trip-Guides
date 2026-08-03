/* PREVIEW-ONLY build-time config for the /progress/ design study.

   The real /progress/ page is static — the slug and country arrive in the query string at
   RUNTIME, after the guide's own content exists anywhere. So the two identity facts every
   other surface resolves at build time (the guide's accent, the destination's time zone)
   have to be resolvable client-side here instead.

   The honest way to do that is to ship the same table every other surface reads, not to
   invent a colour from the slug: src/data/countries.mjs is the single source of truth for
   country accents and IANA zones, and src/lib/accent-tokens.ts is the ONE derivation of the
   contrast-gated ink shades. Both run at build; this emits their output for the 59 known
   countries (~7 KB raw, ~1.5 KB over the wire) and the client does a lookup, nothing more.
   An unknown or absent country resolves to the house accent and no time zone — the honest
   blank, not a guess.

   NOTE for whichever direction ships: the extracted-cover-palette tier of the site's accent
   precedence (src/lib/palettes.ts) is deliberately absent here and cannot be otherwise — a
   guide mid-pipeline has no cover photo to extract from yet. Country accent is the correct
   and complete answer at this point in a guide's life. */
import { countryData, DEFAULT_ACCENT, COUNTRY_CODES } from "../../../data/countries.mjs";
import { accentTokens } from "../../../lib/accent-tokens";

export interface CountryIdentity {
  /** Guide accent — identity, never contrast-gated. */
  a: string;
  /** Accent as text, light mode (>=4.5:1 on every light surface). */
  il: string;
  /** Accent as text, dark mode. */
  id: string;
  /** Text on an accent fill. */
  oa: string;
  /** IANA zone for the destination's real local hour, or "" when we have none. */
  tz: string;
}

export type CountryTable = Record<string, CountryIdentity>;

function identity(accent: string, tz: string): CountryIdentity {
  const t = accentTokens(accent);
  return { a: t.accent, il: t.ink, id: t.inkDark, oa: t.onAccent, tz };
}

/** country name (lowercased) -> identity. Keys are lowercased so a `?country=south korea`
 *  from the new-guide modal matches the table's "South Korea" without a second normaliser. */
export function countryTable(): CountryTable {
  const out: CountryTable = {};
  for (const name of Object.keys(COUNTRY_CODES)) {
    const d = countryData(name);
    if (!d) continue;
    out[name.toLowerCase()] = identity(d.accent || DEFAULT_ACCENT, d.tz || "");
  }
  return out;
}

/** The house fallback, emitted alongside so the client never has to hardcode a hex. */
export function houseIdentity(): CountryIdentity {
  return identity(DEFAULT_ACCENT, "");
}
