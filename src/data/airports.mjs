// Airport gazetteer — IATA code -> coordinates + label. D14/ADR 0003 (Traveler origin): the
// ONLY thing that resolves a guide's `traveler-origin` fact row (an IATA code) into a point
// the globe can draw a route traverse from. Plain ESM (matches src/data/countries.mjs) so it
// can be imported by both the Astro/TS site code and plain-Node scripts.
//
// STABLE FACTS ONLY — an airport's location doesn't change. Coordinates are each airport's own
// reference point, verified against Wikipedia's infobox (which mirrors official aeronautical
// data) on 2026-08-08:
//   EWR — https://en.wikipedia.org/wiki/Newark_Liberty_International_Airport
//   JFK — https://en.wikipedia.org/wiki/John_F._Kennedy_International_Airport
//
// Only CONFIRMED-in-use codes get an entry — same verified-or-absent discipline as
// countries.mjs's EMERGENCY table. A traveler-origin row citing a code with no gazetteer entry
// resolves to no traverse (honest absence), never a guessed point.
export const AIRPORTS = {
  EWR: { lat: 40.69250, lng: -74.16861, label: "Newark Liberty (EWR)" },
  JFK: { lat: 40.63972, lng: -73.77889, label: "John F. Kennedy Intl (JFK)" },
};

/** The gazetteer entry for an IATA code, or null if it isn't in the table. Case-insensitive —
    a guide's facts.json row is authored text, not a validated enum. */
export function airportFor(iata) {
  if (!iata) return null;
  return AIRPORTS[String(iata).trim().toUpperCase()] ?? null;
}
