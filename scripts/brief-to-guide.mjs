// Maps a GuideBrief (src/schemas/guideSchema.ts — produced by Groq, grounded on
// Wikivoyage) into the site's real sections-array guide shape (src/content.config.ts).
// Pure function: no fs, no network. All the checkable specifics it emits (coords, photo
// filenames, currency, source URLs) come from AUTHORITATIVE sources passed in via
// `opts`, never from the language model:
//   - opts.enrichment[name] = { lat, lng, place_id, imgFile }  (OSM Nominatim + Commons)
//   - opts.sources = [{ name, url }]                           (Wikivoyage/Wikipedia)
//   - opts.unsupported = { activities:Set, restaurants:Set }   (self-critique flags)
//   - opts.date = "YYYY-MM-DD"
// Country facts (currency/coords/ISO) come from src/data/countries.mjs.
//
// Every generated guide lands as draft:true with an explicit ⚠ AI-provenance stamp — a
// human runs the verify/graduate pass before anything reaches the curated grid.

import { countryData, isoCodeFor } from "../src/data/countries.mjs";

const P = (group, title, extra = {}) => ({ type: "panel", group, title, body: "", ...extra });
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function buildGuideFromBrief(brief, country, opts = {}) {
  const { enrichment = {}, sources = [], unsupported = {}, date = "" } = opts;
  const unsupportedActs = unsupported.activities instanceof Set ? unsupported.activities : new Set(unsupported.activities || []);
  const unsupportedRests = unsupported.restaurants instanceof Set ? unsupported.restaurants : new Set(unsupported.restaurants || []);

  const data = countryData(country);
  const iso = isoCodeFor(country);
  const coords = data?.capital || null;
  const sections = [];

  // Plan — overview + country-driven live sections (only when data is real, never invented)
  sections.push({
    type: "infogrid", group: "Plan", title: "Overview",
    cards: [
      { icon: "💰", label: "Cost tier", body: brief.cost },
      { icon: "✨", label: "Vibe", body: brief.vibe },
    ],
  });
  if (coords) sections.push({ type: "weather", group: "Plan", title: "Weather for your dates" });
  if (iso)    sections.push({ type: "holidays", group: "Plan", title: "Public holidays & closures" });

  // Money & budget — authoritative currency from countryData when known; exchange_advice
  // is AI text (grounded but unverified) kept as-is.
  const currencySym  = data?.currency?.symbol || brief.currency.code || "$";
  const currencyName = data?.currency?.name   || brief.currency.name;
  const currencyCode = data?.currency?.code   || brief.currency.code;
  const currencyNote = data
    ? `<p><b>${esc(currencyName)} (${esc(currencyCode)}).</b> ${esc(brief.currency.exchange_advice)}</p>`
    : `<p><b>${esc(currencyName)} (${esc(currencyCode)}).</b> ${esc(brief.currency.exchange_advice)} ` +
      `<i>⚠ Currency code/name not cross-checked against site data — country not in the curated list.</i></p>`;
  sections.push({ type: "prose", group: "Money & budget", title: "Money & currency", body: currencyNote });
  sections.push({
    type: "budget", group: "Money & budget", title: "Budget & daily costs",
    intro: `Rough per-person estimates for a ${esc(brief.cost)} trip — replace the zeros with researched figures.`,
    currency: currencySym,
    items: [
      { label: "Lodging, per night", basis: "day", est: 0 },
      { label: "Food & drink, per day", basis: "day", est: 0 },
      { label: "Local transport, per day", basis: "day", est: 0 },
      { label: "Sights & activities, per day", basis: "day", est: 0 },
      { label: "Flights — round trip", basis: "trip", est: 0 },
    ],
  });

  // Etiquette & language
  sections.push(P("Etiquette & language", "Etiquette & culture tips", { checklist: brief.culture_tips }));

  // Sights — must-do activities. Because we now enrich with a VERIFIED Commons photo and
  // real OSM coords, these become a real `sights` section (photo + map link) instead of a
  // photo-less infogrid. img.file is only ever set to a Commons-confirmed filename
  // (CLAUDE.md photo rule); coords only from Nominatim. Items lacking either simply omit it.
  sections.push({
    type: "sights", group: "Sights", title: "Must-do activities",
    items: brief.must_do_activities.map((a) => {
      const e = enrichment[a.name] || {};
      const flag = unsupportedActs.has(a.name) ? " ⚠ Not clearly supported by the source text — verify this exists." : "";
      const booking = a.booking_required ? " <b>⚠ Advance booking typically required.</b>" : "";
      const item = { name: a.name, body: `${esc(a.description)}${booking}${flag}` };
      if (e.imgFile) item.img = { file: e.imgFile, alt: a.name };
      if (Number.isFinite(e.lat) && Number.isFinite(e.lng)) item.map = { lat: e.lat, lng: e.lng };
      return item;
    }),
  });

  // Food & shopping — restaurants (optional). The brief has no address/transit, so each
  // card is explicitly flagged as missing what the 4-question standard requires.
  if (brief.restaurants?.length) {
    sections.push({
      type: "infogrid", group: "Food & shopping", title: "Restaurants to consider",
      note: "⚠ AI-suggested — none of these have a verified address, transit route, hours, or booking status yet.",
      cards: brief.restaurants.map((r) => {
        const flag = unsupportedRests.has(r.name) ? " ⚠ Not clearly supported by the source text — verify this exists." : "";
        return {
          icon: "🍽️", label: `${esc(r.name)} (${esc(r.price_tier)})`,
          body: `${esc(r.cuisine)} — ${esc(r.why_go)} <b>⚠ address, transit route, and booking status not yet verified — required before this guide graduates.</b>${flag}`,
        };
      }),
    });
  }

  // Health & safety — emergency contacts (optional), tel: markup matches the site's guides.
  if (brief.emergency_contacts?.length) {
    const body = "<p>" + brief.emergency_contacts
      .map((c) => `<b>${esc(c.service)}:</b> <a href='tel:${esc(c.number)}'><b>${esc(c.number)}</b></a>`)
      .join(". ") + ".</p>";
    sections.push(P("Health & safety", "Emergency contacts", { body }));
  }

  // Getting around — orientation map, only when real capital coords exist
  if (coords) {
    sections.push({
      type: "map", group: "Getting around", title: "Orientation map",
      center: { lat: coords.lat, lng: coords.lng }, span: 0.08,
    });
  }

  // References — seeded with the real grounding source URLs (Wikivoyage/Wikipedia). A
  // human adds primary sources during verification.
  const refBody = sources.length
    ? "<p>Grounding sources for this AI draft (starting points — a human replaces these with primary sources during verification):</p><ul>" +
      sources.map((s) => `<li><a href='${esc(s.url)}' target='_blank' rel='noopener noreferrer'>${esc(s.name)}</a></li>`).join("") + "</ul>"
    : "";
  sections.push({ type: "prose", group: "References", title: "Sources & further reading", body: refBody });

  const stamp = `⚠ AI draft (Groq, grounded on Wikivoyage${date ? ` ${date}` : ""}) — content was summarized by a ` +
    `language model from public travel wikis and is NOT verified. Every price, hour, address, and fact must be ` +
    `checked against a primary source before this guide graduates (see CLAUDE.md).`;

  return {
    // Kicker invariant (see CLAUDE.md "Uniform application across surfaces" +
    // the waypoint-guide-author block-types rules): the kicker must never
    // repeat title/country — the layout suppresses a country eyebrow when
    // title === country, so the kicker is the masthead's only context line.
    // On graduation, replace with the route + dates pattern
    // ("Seoul · Daejeon · Busan — Jul 8–15, 2026").
    kicker: "AI draft",
    title: brief.title,
    dek: "",
    country,
    draft: true,
    verified: stamp,
    footer: "",
    sections,
  };
}
