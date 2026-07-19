// Single source of per-country data for the whole project. Plain ESM so it can be
// imported by both the TypeScript site code (src/lib/themes.ts) AND plain-Node
// scripts (scripts/fetch-holidays.mjs, scripts/scaffold-guide.mjs) — which was the
// reason those previously kept a duplicate COUNTRY_CODES map.
//
// STABLE FACTS ONLY. Each row carries values that do not change month to month:
//   iso2     — ISO 3166-1 alpha-2 (drives the Nager.Date public-holiday lookup)
//   accent   — the guide's accent colour (aesthetic choice)
//   currency — { code (ISO 4217), symbol, name }
//   tz       — IANA time zone of the capital (DST-correct via Intl.DateTimeFormat)
//   capital  — { lat, lng } of the capital, so the weather API works out-of-the-box
//              for a brand-new guide even before anyone sets a map coordinate
//
// ⚠ Exchange RATES are perishable and are deliberately NOT stored per country. The
// live Frankfurter service (see GuideLayout) is the source of truth. A small set of
// rough, clearly-approximate fallback rates lives in FALLBACK_RATES below — only for
// currencies that already had one — used until the live rate loads. Re-verify before
// relying on any of them.

export const DEFAULT_ACCENT = "#9c4421";

// Rough fallback FX vs USD (1 USD ≈ N units). APPROX — the live rate overrides these.
// Only currencies that had a hardcoded fallback before this refactor are listed, so
// existing guides are unchanged; others rely on the live service.
export const FALLBACK_RATES = {
  KRW: 1535, DKK: 6.9, EUR: 0.93, JPY: 150,
};

// Verified emergency numbers — SOS sheet data. ONLY countries whose numbers
// have been verified get an entry (KR corroborated by the korea guide's own
// researched Health & safety section; DK/EU-wide 112 is statutory). A country
// without an entry simply gets no SOS button — never guessed numbers.
export const EMERGENCY = {
  "South Korea": {
    lines: [
      { label: "Police", num: "112" },
      { label: "Fire / Ambulance (free, say 'English please')", num: "119" },
      { label: "Korea Travel Hotline — 24/7 English, interprets & connects", num: "1330" },
      { label: "Medical line — locates the nearest ER", num: "1339" },
    ],
    note: "Your location is auto-detected on 119 calls. Full detail in Health & safety.",
  },
  "Denmark": {
    lines: [
      { label: "All emergencies (EU-wide)", num: "112" },
      { label: "Police (non-urgent)", num: "114" },
    ],
    note: "112 works in Denmark, Sweden and Norway alike. Full detail in Health & safety.",
  },
};

// Countries where 112 is the statutory universal emergency number: EU law makes
// it the single European emergency number in every member state, and it is
// equally live in the EEA states, the UK and Switzerland. A durable legal fact,
// not a perishable one. Keys must match COUNTRIES rows exactly. Used ONLY as a
// labeled fallback below — a traveler in Norway must never get silence, but the
// fallback never pretends to be a fully-researched emergency sheet.
export const EU112_COUNTRIES = new Set([
  "Austria", "Belgium", "Croatia", "Czechia", "Denmark", "Finland", "France",
  "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Netherlands",
  "Norway", "Poland", "Portugal", "Spain", "Sweden", "Switzerland",
  "United Kingdom",
]);

// SOS data selector: a verified entry wins; an EU/EEA country without one gets
// the honest 112-only fallback (flagged `fallback: true` — the SOS sheet renders
// it warn-toned); anywhere else gets null and no SOS button — never guessed.
export function emergencyFor(country) {
  if (EMERGENCY[country]) return EMERGENCY[country];
  if (EU112_COUNTRIES.has(country)) {
    return {
      fallback: true,
      lines: [{ label: "All emergencies — universal EU number", num: "112" }],
      note: "112 is the statutory EU/EEA-wide emergency number and works in " + country +
            ". Local extras (non-urgent police, medical hotlines) are not verified for this guide yet — check Health & safety before relying on them.",
    };
  }
  return null;
}

// Canonical rows, keyed by the exact `country` string used in guide JSON.
export const COUNTRIES = {
  // ── Existing curated set (values preserved exactly from the old themes.ts) ──
  "Denmark":        { iso2: "DK", accent: "#a4332a", currency: { code: "DKK", symbol: "kr", name: "Danish Krone" },   tz: "Europe/Copenhagen", capital: { lat: 55.6761, lng: 12.5683 } },
  "South Korea":    { iso2: "KR", accent: "#2b5d86", currency: { code: "KRW", symbol: "₩",  name: "Korean Won" },     tz: "Asia/Seoul",        capital: { lat: 37.5665, lng: 126.9780 } },
  "Japan":          { iso2: "JP", accent: "#b23a48", currency: { code: "JPY", symbol: "¥",  name: "Japanese Yen" },   tz: "Asia/Tokyo",        capital: { lat: 35.6762, lng: 139.6503 } },
  "Germany":        { iso2: "DE", accent: "#8a6a1f", currency: { code: "EUR", symbol: "€",  name: "Euro" },           tz: "Europe/Berlin",     capital: { lat: 52.5200, lng: 13.4050 } },
  "Portugal":       { iso2: "PT", accent: "#2f6f4f", currency: { code: "EUR", symbol: "€",  name: "Euro" },           tz: "Europe/Lisbon",     capital: { lat: 38.7223, lng: -9.1393 } },

  // ── Europe ──
  "Iceland":        { iso2: "IS", accent: "#3a6ea5", currency: { code: "ISK", symbol: "kr", name: "Icelandic Króna" }, tz: "Atlantic/Reykjavik", capital: { lat: 64.1466, lng: -21.9426 } },
  "Norway":         { iso2: "NO", accent: "#34507a", currency: { code: "NOK", symbol: "kr", name: "Norwegian Krone" }, tz: "Europe/Oslo",       capital: { lat: 59.9139, lng: 10.7522 } },
  "Sweden":         { iso2: "SE", accent: "#8a6a1f", currency: { code: "SEK", symbol: "kr", name: "Swedish Krona" },  tz: "Europe/Stockholm",  capital: { lat: 59.3293, lng: 18.0686 } },
  "Finland":        { iso2: "FI", accent: "#2b5d86", currency: { code: "EUR", symbol: "€",  name: "Euro" },           tz: "Europe/Helsinki",   capital: { lat: 60.1699, lng: 24.9384 } },
  "United Kingdom": { iso2: "GB", accent: "#34507a", currency: { code: "GBP", symbol: "£",  name: "Pound Sterling" }, tz: "Europe/London",     capital: { lat: 51.5074, lng: -0.1278 } },
  "Ireland":        { iso2: "IE", accent: "#2f6f4f", currency: { code: "EUR", symbol: "€",  name: "Euro" },           tz: "Europe/Dublin",     capital: { lat: 53.3498, lng: -6.2603 } },
  "France":         { iso2: "FR", accent: "#33518a", currency: { code: "EUR", symbol: "€",  name: "Euro" },           tz: "Europe/Paris",      capital: { lat: 48.8566, lng: 2.3522 } },
  "Spain":          { iso2: "ES", accent: "#b07a1f", currency: { code: "EUR", symbol: "€",  name: "Euro" },           tz: "Europe/Madrid",     capital: { lat: 40.4168, lng: -3.7038 } },
  "Italy":          { iso2: "IT", accent: "#2f6f4f", currency: { code: "EUR", symbol: "€",  name: "Euro" },           tz: "Europe/Rome",       capital: { lat: 41.9028, lng: 12.4964 } },
  "Netherlands":    { iso2: "NL", accent: "#b5651d", currency: { code: "EUR", symbol: "€",  name: "Euro" },           tz: "Europe/Amsterdam",  capital: { lat: 52.3676, lng: 4.9041 } },
  "Belgium":        { iso2: "BE", accent: "#7a3b2e", currency: { code: "EUR", symbol: "€",  name: "Euro" },           tz: "Europe/Brussels",   capital: { lat: 50.8503, lng: 4.3517 } },
  "Switzerland":    { iso2: "CH", accent: "#9c2f2a", currency: { code: "CHF", symbol: "Fr", name: "Swiss Franc" },    tz: "Europe/Zurich",     capital: { lat: 46.9480, lng: 7.4474 } },
  "Austria":        { iso2: "AT", accent: "#8a6a1f", currency: { code: "EUR", symbol: "€",  name: "Euro" },           tz: "Europe/Vienna",     capital: { lat: 48.2082, lng: 16.3738 } },
  "Greece":         { iso2: "GR", accent: "#2b5d9e", currency: { code: "EUR", symbol: "€",  name: "Euro" },           tz: "Europe/Athens",     capital: { lat: 37.9838, lng: 23.7275 } },
  "Poland":         { iso2: "PL", accent: "#9c2f2a", currency: { code: "PLN", symbol: "zł", name: "Polish Złoty" },   tz: "Europe/Warsaw",     capital: { lat: 52.2297, lng: 21.0122 } },
  "Czechia":        { iso2: "CZ", accent: "#34507a", currency: { code: "CZK", symbol: "Kč", name: "Czech Koruna" },   tz: "Europe/Prague",     capital: { lat: 50.0755, lng: 14.4378 } },
  "Hungary":        { iso2: "HU", accent: "#2f6f4f", currency: { code: "HUF", symbol: "Ft", name: "Hungarian Forint" }, tz: "Europe/Budapest", capital: { lat: 47.4979, lng: 19.0402 } },
  "Croatia":        { iso2: "HR", accent: "#2b5d86", currency: { code: "EUR", symbol: "€",  name: "Euro" },           tz: "Europe/Zagreb",     capital: { lat: 45.8150, lng: 15.9819 } },
  "Turkey":         { iso2: "TR", accent: "#b23a48", currency: { code: "TRY", symbol: "₺",  name: "Turkish Lira" },   tz: "Europe/Istanbul",   capital: { lat: 39.9334, lng: 32.8597 } },

  // ── Americas ──
  "United States":  { iso2: "US", accent: "#34507a", currency: { code: "USD", symbol: "$",  name: "US Dollar" },      tz: "America/New_York",  capital: { lat: 38.9072, lng: -77.0369 } },
  // Hawaii gets its own row rather than reusing "United States": the mainland tz/capital
  // are wrong for it by 5–6 hours and ~4,800 miles — the one-tz-per-country model breaks
  // for a US state whose local time and geography differ this much from the rest of the
  // country. iso2 stays "US" (Hawaii observes the same federal holiday set for
  // fetch-holidays.mjs); tz is Hawaii-Aleutian (no DST); capital is Honolulu, verified via
  // Nominatim (scripts/lookup-place.mjs "Honolulu, Hawaii" --cc US).
  "Hawaii":         { iso2: "US", accent: "#048096", currency: { code: "USD", symbol: "$",  name: "US Dollar" },      tz: "Pacific/Honolulu",  capital: { lat: 21.304547, lng: -157.855676 } },
  // Same reasoning as Hawaii above: Arizona (outside the Navajo Nation) has observed
  // Mountain Standard Time year-round since 1968 — it never springs forward, so
  // "United States" → America/New_York would be off by 1-2 hours depending on the season.
  // capital is Phoenix (Arizona's actual capital, matching every other row's convention),
  // verified via Nominatim (scripts/lookup-place.mjs "Phoenix, Arizona" --cc US).
  "Arizona":        { iso2: "US", accent: "#a2681c", currency: { code: "USD", symbol: "$",  name: "US Dollar" },      tz: "America/Phoenix",   capital: { lat: 33.4484367, lng: -112.074141 } },
  "Canada":         { iso2: "CA", accent: "#a4332a", currency: { code: "CAD", symbol: "$",  name: "Canadian Dollar" }, tz: "America/Toronto",  capital: { lat: 45.4215, lng: -75.6972 } },
  "Mexico":         { iso2: "MX", accent: "#2f6f4f", currency: { code: "MXN", symbol: "$",  name: "Mexican Peso" },   tz: "America/Mexico_City", capital: { lat: 19.4326, lng: -99.1332 } },
  "Brazil":         { iso2: "BR", accent: "#2e7d4f", currency: { code: "BRL", symbol: "R$", name: "Brazilian Real" }, tz: "America/Sao_Paulo", capital: { lat: -15.7939, lng: -47.8828 } },
  "Argentina":      { iso2: "AR", accent: "#3a6ea5", currency: { code: "ARS", symbol: "$",  name: "Argentine Peso" }, tz: "America/Argentina/Buenos_Aires", capital: { lat: -34.6037, lng: -58.3816 } },
  "Peru":           { iso2: "PE", accent: "#9c2f2a", currency: { code: "PEN", symbol: "S/", name: "Peruvian Sol" },   tz: "America/Lima",      capital: { lat: -12.0464, lng: -77.0428 } },
  "Chile":          { iso2: "CL", accent: "#7a3b2e", currency: { code: "CLP", symbol: "$",  name: "Chilean Peso" },   tz: "America/Santiago",  capital: { lat: -33.4489, lng: -70.6693 } },
  "Colombia":       { iso2: "CO", accent: "#b07a1f", currency: { code: "COP", symbol: "$",  name: "Colombian Peso" }, tz: "America/Bogota",    capital: { lat: 4.7110, lng: -74.0721 } },
  "Costa Rica":     { iso2: "CR", accent: "#2f6f4f", currency: { code: "CRC", symbol: "₡",  name: "Costa Rican Colón" }, tz: "America/Costa_Rica", capital: { lat: 9.9281, lng: -84.0907 } },

  // ── Asia ──
  "China":          { iso2: "CN", accent: "#9c2f2a", currency: { code: "CNY", symbol: "¥",  name: "Chinese Yuan" },   tz: "Asia/Shanghai",     capital: { lat: 39.9042, lng: 116.4074 } },
  "Hong Kong":      { iso2: "HK", accent: "#b23a48", currency: { code: "HKD", symbol: "$",  name: "Hong Kong Dollar" }, tz: "Asia/Hong_Kong",  capital: { lat: 22.3193, lng: 114.1694 } },
  "Taiwan":         { iso2: "TW", accent: "#2b5d86", currency: { code: "TWD", symbol: "$",  name: "New Taiwan Dollar" }, tz: "Asia/Taipei",     capital: { lat: 25.0330, lng: 121.5654 } },
  "Thailand":       { iso2: "TH", accent: "#2e4a86", currency: { code: "THB", symbol: "฿",  name: "Thai Baht" },      tz: "Asia/Bangkok",      capital: { lat: 13.7563, lng: 100.5018 } },
  "Vietnam":        { iso2: "VN", accent: "#9c2f2a", currency: { code: "VND", symbol: "₫",  name: "Vietnamese Đồng" }, tz: "Asia/Ho_Chi_Minh", capital: { lat: 21.0278, lng: 105.8342 } },
  "Singapore":      { iso2: "SG", accent: "#b23a48", currency: { code: "SGD", symbol: "$",  name: "Singapore Dollar" }, tz: "Asia/Singapore",  capital: { lat: 1.3521, lng: 103.8198 } },
  "Malaysia":       { iso2: "MY", accent: "#2f6f4f", currency: { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" }, tz: "Asia/Kuala_Lumpur", capital: { lat: 3.1390, lng: 101.6869 } },
  "Indonesia":      { iso2: "ID", accent: "#b07a1f", currency: { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" }, tz: "Asia/Jakarta",   capital: { lat: -6.2088, lng: 106.8456 } },
  "Philippines":    { iso2: "PH", accent: "#2b5d9e", currency: { code: "PHP", symbol: "₱",  name: "Philippine Peso" }, tz: "Asia/Manila",      capital: { lat: 14.5995, lng: 120.9842 } },
  "India":          { iso2: "IN", accent: "#b5651d", currency: { code: "INR", symbol: "₹",  name: "Indian Rupee" },   tz: "Asia/Kolkata",      capital: { lat: 28.6139, lng: 77.2090 } },
  "United Arab Emirates": { iso2: "AE", accent: "#7a3b2e", currency: { code: "AED", symbol: "د.إ", name: "UAE Dirham" }, tz: "Asia/Dubai",     capital: { lat: 24.4539, lng: 54.3773 } },
  "Israel":         { iso2: "IL", accent: "#34507a", currency: { code: "ILS", symbol: "₪",  name: "Israeli Shekel" }, tz: "Asia/Jerusalem",    capital: { lat: 31.7683, lng: 35.2137 } },

  // ── Oceania & Africa ──
  "Australia":      { iso2: "AU", accent: "#2f6f4f", currency: { code: "AUD", symbol: "$",  name: "Australian Dollar" }, tz: "Australia/Sydney", capital: { lat: -35.2809, lng: 149.1300 } },
  "New Zealand":    { iso2: "NZ", accent: "#2b5d86", currency: { code: "NZD", symbol: "$",  name: "New Zealand Dollar" }, tz: "Pacific/Auckland", capital: { lat: -41.2865, lng: 174.7762 } },
  "Egypt":          { iso2: "EG", accent: "#b07a1f", currency: { code: "EGP", symbol: "£",  name: "Egyptian Pound" }, tz: "Africa/Cairo",      capital: { lat: 30.0444, lng: 31.2357 } },
  "Morocco":        { iso2: "MA", accent: "#9c2f2a", currency: { code: "MAD", symbol: "DH", name: "Moroccan Dirham" }, tz: "Africa/Casablanca", capital: { lat: 34.0209, lng: -6.8416 } },
  "South Africa":   { iso2: "ZA", accent: "#2e7d4f", currency: { code: "ZAR", symbol: "R",  name: "South African Rand" }, tz: "Africa/Johannesburg", capital: { lat: -25.7479, lng: 28.2293 } },
  "Kenya":          { iso2: "KE", accent: "#7a3b2e", currency: { code: "KES", symbol: "Sh", name: "Kenyan Shilling" }, tz: "Africa/Nairobi",   capital: { lat: -1.2921, lng: 36.8219 } },
};

// Alternate spellings → canonical key.
export const ALIASES = {
  "Korea": "South Korea",
  "USA": "United States",
  "US": "United States",
  "U.S.": "United States",
  "UK": "United Kingdom",
  "U.K.": "United Kingdom",
  "UAE": "United Arab Emirates",
  "Czech Republic": "Czechia",
};

// Resolve a guide `country` string (following aliases) to its data row, or null.
export function countryData(country) {
  if (!country) return null;
  const key = ALIASES[country] || country;
  return COUNTRIES[key] || null;
}

// ISO alpha-2 for the holiday lookup (null when unknown).
export function isoCodeFor(country) {
  return countryData(country)?.iso2 ?? null;
}

/* ── Continents ────────────────────────────────────────────────────────────────
   The axis the hub filters on: as the library grows, "which continent" is how you
   actually browse trips — country chips just restate the list.

   Kept as explicit data rather than derived from each row's IANA `tz`, because the
   tz prefix lies in exactly the cases that matter: Iceland is Atlantic/Reykjavik
   (Europe), and every American zone is `America/` with no North/South split.
   Every key here must exist in COUNTRIES — countries.test.ts enforces that, so a
   new country can't be added with a missing or stale continent. */
export const CONTINENTS = {
  // Europe (Turkey sits on both sides; its zone and its travel centre are European)
  "Denmark": "Europe", "Germany": "Europe", "Portugal": "Europe", "Iceland": "Europe",
  "Norway": "Europe", "Sweden": "Europe", "Finland": "Europe", "United Kingdom": "Europe",
  "Ireland": "Europe", "France": "Europe", "Spain": "Europe", "Italy": "Europe",
  "Netherlands": "Europe", "Belgium": "Europe", "Switzerland": "Europe", "Austria": "Europe",
  "Greece": "Europe", "Poland": "Europe", "Czechia": "Europe", "Hungary": "Europe",
  "Croatia": "Europe", "Turkey": "Europe",
  // Asia
  "South Korea": "Asia", "Japan": "Asia", "China": "Asia", "Hong Kong": "Asia",
  "Taiwan": "Asia", "Thailand": "Asia", "Vietnam": "Asia", "Singapore": "Asia",
  "Malaysia": "Asia", "Indonesia": "Asia", "Philippines": "Asia", "India": "Asia",
  "United Arab Emirates": "Asia", "Israel": "Asia",
  // North America (Costa Rica is Central America — conventionally grouped north)
  "United States": "North America", "Hawaii": "North America", "Arizona": "North America",
  "Canada": "North America", "Mexico": "North America", "Costa Rica": "North America",
  // South America
  "Brazil": "South America", "Argentina": "South America", "Peru": "South America",
  "Chile": "South America", "Colombia": "South America",
  // Oceania
  "Australia": "Oceania", "New Zealand": "Oceania",
  // Africa
  "Egypt": "Africa", "Morocco": "Africa", "South Africa": "Africa", "Kenya": "Africa",
};

// Display order for continent filters — roughly by where this traveler actually goes,
// so the chips don't reshuffle alphabetically as the library grows.
export const CONTINENT_ORDER = ["Asia", "Europe", "North America", "South America", "Oceania", "Africa"];

// Continent for a guide `country` string (following the same aliases), or null when
// unknown — callers must handle null rather than guess a continent.
export function continentFor(country) {
  if (!country) return null;
  const key = ALIASES[country] || country;
  return CONTINENTS[key] ?? null;
}

// Back-compat shape: { [country]: "XX" } for callers that want the flat map.
export const COUNTRY_CODES = Object.fromEntries(
  [...Object.entries(COUNTRIES).map(([k, v]) => [k, v.iso2]),
   ...Object.entries(ALIASES).map(([k, canon]) => [k, COUNTRIES[canon]?.iso2]).filter(([, v]) => v)]
);
