/* One derivation for the guide surface (design-system.md D6-03). GuideLayout and the
   component gallery both render the five destinations from THIS record, so what the Trip,
   Itinerary, Map and Guide destinations receive has exactly one owner. Nothing here authors
   content: every value is read or counted from the guide's own record. */
import { buildHolidayInfo, deriveTripYear, type HolidayInfo } from "./holidays";
import { COUNTRY_CODES, currencyFor, tzFor } from "./themes";
import { computeGuideStats, latestVerifiedOn } from "./guide-stats";
import { cityLine, dateLine } from "./plate-line";
import { emergencyFor } from "../data/countries.mjs";
import { collectWaypoints, collectDayEvents, buildSummary, flattenSections } from "../features/exports/index";
import { derivePins, derivePlannerData, pinSlug } from "./map-pins";
import { deriveTripDays, deriveReadiness, deriveRecap } from "../features/trip/index";
import { buildGuideSearchIndex } from "../features/search/index";

/* The guide record is the zod schema's output; this derivation walks it loosely, as
   GuideLayout always has (eslint ratchet entry). */
export type LatLng = { lat: number; lng: number };
export interface ChapterPin { id: string; name: string; lat: number; lng: number; local: string | null; kind: string; cat: string | null; placeId: string | null }
export interface Chapter {
  key: string; name: string; descriptor: string | null; sub: string;
  entries: { s: any; i: number }[]; imgs: { src: string; alt: string }[];
  isPanelGroup: boolean; pins: ChapterPin[]; center: LatLng | null; span: number | null;
  reference: boolean; arrival: boolean;
}
export type ModuleLink = { id: string; title: string; kind: string; critical: boolean; anchor: string };

export const hasCoords = (o: any): o is LatLng => !!o && Number.isFinite(o.lat) && Number.isFinite(o.lng);
export const centroid = (pins: LatLng[]): LatLng | null => pins.length
  ? { lat: pins.reduce((a, p) => a + p.lat, 0) / pins.length, lng: pins.reduce((a, p) => a + p.lng, 0) / pins.length }
  : null;
export const spanOf = (pins: LatLng[]): number => {
  if (pins.length < 2) return 0.05;
  const lats = pins.map((p) => p.lat), lngs = pins.map((p) => p.lng);
  return Math.max(0.03, Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs)) * 0.6);
};
const collapseSubPrefixes = (parts: string[]): string[] => {
  if (parts.length < 2) return parts;
  const splits = parts.map((p) => p.split(/ — | – /, 2));
  if (!splits.every((x) => x.length === 2)) return parts;
  const prefix = splits[0][0];
  if (!splits.every((x) => x[0] === prefix)) return parts;
  return [prefix + " — " + splits.map((x) => x[1]).join(", ")];
};
const isSources = (s: any) => /^(sources?|references?|evidence|verification)$/.test(String(s.group || "").trim().toLowerCase())
  || /^(sources?|references?|evidence|verification)$/.test(String(s.type || ""));

export function deriveGuideView(guide: any, slug: string, base: string, holidayData: Record<string, any[]>) {
  const storeKey = (slug || "guide").replace(/\W+/g, "").toLowerCase();
  const legacyStoreKey = (guide.title || "guide").replace(/\W+/g, "").toLowerCase();
  const flat = flattenSections(guide.sections || []) as any[];
  const localCur = currencyFor(guide.country);
  const destTzIana: string | null = guide.tz || tzFor(guide.country) || null;

  /* ── Cover ── */
  const heroSight = flat.filter((s) => s.type === "sights").flatMap((s) => s.items || []).find((it: any) => it?.img?.file || it?.img?.src);
  const cover = guide.cover;
  const coverStill = (cover?.src || cover?.file)
    ? { file: cover.file ?? null, src: cover.src ?? null, credit: cover.credit, creditUrl: cover.creditUrl }
    : { file: heroSight?.img?.file ?? null, src: heroSight?.img?.src ?? null, credit: heroSight?.img?.credit, creditUrl: heroSight?.img?.creditUrl };
  const coverDirect = (coverStill.src as string | undefined) ?? null;
  const coverFile = (coverStill.file as string | undefined) ?? null;
  const mastSrcAt = (w: number) =>
    coverDirect ? coverDirect.replace("{w}", String(w))
    : coverFile ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(coverFile)}?width=${w}` : null;
  const heroSrc = mastSrcAt(1600);
  const hero = {
    src: heroSrc,
    srcset: (coverFile || coverDirect?.includes("{w}"))
      ? `${mastSrcAt(480)} 480w, ${mastSrcAt(800)} 800w, ${mastSrcAt(1200)} 1200w, ${mastSrcAt(1600)} 1600w`
      : null,
    alt: (cover?.alt ?? heroSight?.img?.alt ?? heroSight?.name ?? "") as string,
    focal: (cover?.focal ?? null) as string | null,
    credit: coverFile
      ? { href: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(coverFile)}`, label: "Photo: Wikimedia Commons" }
      : coverDirect && coverStill.credit
      ? { href: (coverStill.creditUrl as string | undefined) ?? null, label: `Photo: ${coverStill.credit}` }
      : null,
    video: cover?.video ?? null,
    tz: destTzIana,
    painted: !heroSrc,
  };
  const thumbSrc = (im: { file?: string; src?: string }) =>
    im.src ? im.src.replace("{w}", "320")
    : `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(im.file!)}?width=320`;

  /* ── The itinerary, canonical (features/trip) ── */
  const daysSec = flat.find((s) => s.type === "days" && s.items?.length) ?? null;
  const rawDays: any[] = daysSec?.items ?? [];
  const tripDays = deriveTripDays(rawDays);
  const firstDayDate = (rawDays[0]?.date as string) ?? null;
  const lastDayDate = (rawDays[rawDays.length - 1]?.date as string) ?? firstDayDate;
  const daysForBanner = rawDays.map((d: any) => ({ date: d.date, title: d.title, fit: d.fit ?? null, env: d.env ?? null }));

  /* ── Maps: every verified coordinate the guide carries ── */
  const mapSec = flat.find((s) => s.type === "map" && s.center?.lat) ?? null;
  const mapCenter: LatLng | null = mapSec ? { lat: mapSec.center.lat, lng: mapSec.center.lng } : null;
  const pinMap = derivePins(guide.sections);
  const planner = derivePlannerData(guide.sections);
  const seen = new Set<string>();
  const allPins: any[] = [];
  for (const pins of pinMap.values()) for (const p of pins) { if (!seen.has(p.id)) { seen.add(p.id); allPins.push(p); } }
  for (const p of planner.pins) { if (!seen.has(p.id)) { seen.add(p.id); allPins.push(p); } }
  const located = allPins.filter((p) => p.kind !== "center");
  const globalCenter = mapCenter ?? centroid(located);
  const globalSpan = mapCenter ? (mapSec?.span ?? spanOf(located)) : spanOf(located);
  const itinCenter = planner.hasCoords ? centroid(planner.pins) : globalCenter;
  const itinSpan = planner.hasCoords ? spanOf(planner.pins) : globalSpan;

  /* ── Guide chapters: the authored groups, in the guide's own order ── */
  const sections = guide.sections as any[];
  const groupOrder: string[] = [];
  for (const s of sections) {
    if (s.type === "days" || isSources(s)) continue;
    if (!groupOrder.includes(s.group)) groupOrder.push(s.group);
  }
  const entriesOf = (g: string) => sections.map((s, i) => ({ s, i })).filter(({ s }) => s.group === g && s.type !== "days" && !isSources(s));
  const sources = sections.map((s, i) => ({ s, i })).filter(({ s }) => isSources(s));
  const daysOnlyExtras = sections.map((s, i) => ({ s, i })).filter(({ s }) => s.group === (daysSec?.group ?? "Days") && s.type !== "days");
  const panelGroups: string[] = guide.panelGroups ?? [];
  const descriptors: Record<string, string> = guide.descriptors ?? {};
  const referenceGroup = groupOrder.find((g) => /essential|plan|basics|before/i.test(g)) ?? groupOrder[0];
  let arrivalGroup: string | null = null;
  for (const g of groupOrder) for (const { s } of entriesOf(g)) {
    const t = String(s.title ?? s.name ?? "");
    if (arrivalGroup === null && /jet[\s-]?lag|arriv|when you land/i.test(t)) arrivalGroup = g;
  }
  if (arrivalGroup === null) arrivalGroup = referenceGroup;
  const chapters: Chapter[] = groupOrder.map((g, gi) => {
    const entries = entriesOf(g);
    // Sections authored in the Days group that are not the itinerary itself (a "solo menu",
    // alternatives) read as reference material and join the first chapter that follows.
    const withExtras = gi === 0 ? [...daysOnlyExtras, ...entries] : entries;
    const imgs = withExtras.filter((e) => e.s.type === "sights").flatMap((e) => e.s.items || [])
      .filter((it: any) => it?.img?.file || it?.img?.src).slice(0, 3)
      .map((it: any) => ({ src: thumbSrc(it.img), alt: it.img.alt || it.name || "" }));
    const pins: ChapterPin[] = withExtras
      .filter((e) => e.s.type === "sights" || e.s.type === "venues")
      .flatMap((e) => (e.s.items || []).filter((it: any) => hasCoords(it.map)).map((it: any) => ({
        id: pinSlug(it.name), name: it.name, lat: it.map.lat, lng: it.map.lng, local: null,
        kind: e.s.type === "sights" ? "sight" : "venue", cat: g, placeId: it.place_id || null,
      })));
    const mapSecs = withExtras.filter((e) => e.s.type === "map" && hasCoords(e.s.center));
    const solo = withExtras.length === 1;
    const subParts = solo || descriptors[g] ? [] : withExtras.map((e) => e.s.title || e.s.name || "").filter((t: string) => t && t !== g);
    return {
      key: `${g.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "chapter"}-${gi}`,
      name: g, descriptor: descriptors[g] ?? null,
      sub: collapseSubPrefixes(subParts.slice(0, 4)).join(" · ") + (subParts.length > 4 ? ` · +${subParts.length - 4} more` : ""),
      entries: withExtras, imgs,
      isPanelGroup: withExtras.every((e) => panelGroups.includes(e.s.group)),
      pins,
      center: mapSecs.length ? { lat: mapSecs[0].s.center.lat, lng: mapSecs[0].s.center.lng } : centroid(pins),
      span: mapSecs.length ? (mapSecs[0].s.span ?? spanOf(pins)) : spanOf(pins),
      reference: g === referenceGroup, arrival: g === arrivalGroup,
    };
  });

  /* Knowledge modules → days (D6-53), deterministically by the module's own relations. */
  const modulesByDate: Record<string, ModuleLink[]> = {};
  sections.forEach((s, i) => {
    if (!s.module) return;
    const link: ModuleLink = { id: s.module.id, title: s.title || s.group, kind: s.module.kind, critical: !!s.module.critical, anchor: `sec-${i}` };
    const dates = new Set<string>(s.module.relates?.days ?? []);
    for (const place of s.module.relates?.places ?? []) {
      for (const d of tripDays) if (d.stops.some((w) => w.name === place)) dates.add(d.date);
    }
    for (const d of dates) (modulesByDate[d] ??= []).push(link);
  });

  /* ── Trip: readiness, recap, holidays, files ── */
  const readiness = deriveReadiness(flat as any);
  const recap = deriveRecap(tripDays, guide.learnings ?? null);
  const cc = COUNTRY_CODES[guide.country] ?? null;
  const holSec = flat.find((s) => s.type === "holidays") as any;
  const holYear = holSec?.year || deriveTripYear(firstDayDate, new Date());
  const holRows = cc ? holidayData[`../data/holidays/${cc}-${holYear}.json`] : null;
  const holidayInfo: HolidayInfo | null = holSec ? buildHolidayInfo(holRows ?? null, firstDayDate, lastDayDate, holYear) : null;
  const exports = { gpx: collectWaypoints(guide).length > 0, ics: collectDayEvents(guide).length > 0 };
  const hasWeatherSection = flat.some((s) => s.type === "weather");

  /* ── Plate line + colophon (counted, never typed) ── */
  const platelineCities = cityLine(guide.kicker ?? null);
  const platelineDates = dateLine(guide.kicker ?? null);
  const verifiedWarning: string | null = guide.verified?.trimStart().startsWith("⚠") ? guide.verified : null;
  const verifiedDate: string | null = guide.verified?.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
  const colophon = computeGuideStats([guide]);
  const colophonChecked = verifiedDate ?? latestVerifiedOn([guide]);
  const expected: string[] = [];
  const walk = (obj: any) => {
    if (!obj || typeof obj !== "object") return;
    if (obj.expected && typeof obj.expected === "string") expected.push(obj.expected);
    if (Array.isArray(obj)) obj.forEach(walk); else Object.values(obj).forEach(walk);
  };
  walk(guide.sections);
  const nextRecheck = expected.sort()[0] ?? null;
  const eyebrow = platelineDates || (((guide.region || guide.country) !== guide.title) ? (guide.region || guide.country) : null);
  const plate = {
    dates: platelineDates, cities: platelineCities, eyebrow, checked: colophonChecked,
    facts: colophon.verifiedFactCount, sources: colophon.sourceCount,
    emergency: emergencyFor(guide.country), currency: localCur,
  };

  return {
    slug, base, storeKey, legacyStoreKey, flat, localCur, destTzIana,
    hero, daysSec, rawDays, tripDays, firstDayDate, lastDayDate, daysForBanner,
    mapCenter, pinMap, planner, allPins, globalCenter, globalSpan, itinCenter, itinSpan,
    chapters, sources, modulesByDate,
    readiness, recap, holidayInfo, exports, hasWeatherSection, tripSummary: buildSummary(guide),
    verifiedWarning, verifiedDate, colophon, colophonChecked, nextRecheck, plate,
    searchIndex: buildGuideSearchIndex(slug, guide.title, guide.sections),
    destinations: [
      { key: "trip" as const, label: "Trip" },
      { key: "itinerary" as const, label: "Itinerary" },
      { key: "map" as const, label: "Map" },
      { key: "guide" as const, label: "Guide" },
      { key: "split" as const, label: "Split" },
    ],
  };
}
export type GuideView = ReturnType<typeof deriveGuideView>;
