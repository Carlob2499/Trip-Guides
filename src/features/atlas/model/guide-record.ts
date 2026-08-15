/* Per-guide atlas record (docs/archive/INDEX.md → PLAN_ATLAS_MIGRATION Stage B.4) — ONE pure, build-time
   derivation. "Content is king" (CLAUDE.md binding principle 1): every field comes from the
   guide's own already-published content — its sections, its facts.json, its `country` — never
   a parallel hand-filled registry. This record is meant to be the ONLY thing the Atlas hub
   (Stage C) consumes; nothing downstream should reach back into raw guide sections itself.

   `ordinal` is the one field this module does NOT compute — src/lib/sheet-order.ts already
   derives it (chronologically, across ALL guides at once), and threading that cross-guide
   computation through here would make this function no longer per-guide-pure. Callers derive
   ordinals once via sheetOrder() and pass this guide's own number in. */

import { tripWindow, tripWindowInYear } from "../../../lib/trip-dates";
import { yearFromKicker } from "../../../lib/sheet-order";
import { isoNumericFor } from "../../../data/countries.mjs";
import { airportFor } from "../../../data/airports.mjs";

export type TripStatus = "upcoming" | "ongoing" | "past" | "undated";

export interface GuideOrigin {
  lat: number;
  lng: number;
  label: string;
  iata: string;
  /** false for a state:"unconfirmed" row — the caller (the globe) must not draw a route arc
      for it (ADR 0003: "an unconfirmed origin draws no route arc"), but the point still
      resolves so a future UI can say WHAT is unconfirmed rather than nothing at all. */
  confirmed: boolean;
}

export interface GuideAtlasRecord {
  slug: string;
  title: string;
  dek: string | null;
  /** The guide's first `map` section center, in file order. Null for a guide with no map
      section yet (a fresh scaffold) — honest absence, never a guessed point. */
  anchor: { lat: number; lng: number } | null;
  /** The anchor's place name, e.g. "Seoul" — derived from the guide's own `kicker` (its
      leading segment before the first separator), never typed twice. Null when the guide has
      no kicker to derive from. */
  anchorLabel: string | null;
  countryId: number | null;
  ordinal: number | null;
  start: Date | null;
  end: Date | null;
  status: TripStatus;
  tz: string | null;
  origin: GuideOrigin | null;
  /** A still image URL resolved from `guide.cover` only (file -> Commons, src, or video
      poster) — NOT the richer cover -> first-sight-photo -> Painted-Atlas-mini fallback
      chain the masthead and (per the plan) the Stage C hub card eventually use; that chain is
      Stage C's own job. Null here just means "no explicit cover", not "no image at all". */
  coverImg: string | null;
}

/** Minimal cover shape this module reads — narrower than the full zod-inferred cover so a
    test can hand-build one without importing Astro's content-collection types. */
export interface CoverLike {
  file?: string | null;
  src?: string | null;
  video?: { poster?: string | null } | null;
}

export interface SectionLike {
  /** Optional, not required — flatten() below only ever checks `sections`, and a section
      lacking a `type` should still walk instead of tripping a type error on defensive code. */
  type?: string;
  sections?: readonly SectionLike[] | null;
  [key: string]: unknown;
}

export interface MapSectionLike extends SectionLike {
  type: "map";
  center?: { lat: number; lng: number } | null;
}

export interface FactLike {
  value?: string | null;
  state?: string | null;
}

export interface GuideRecordInput {
  slug: string;
  title: string;
  dek?: string | null;
  kicker?: string | null;
  country?: string | null;
  tz?: string | null;
  cover?: CoverLike | null;
  sections?: readonly SectionLike[] | null;
  facts?: Record<string, FactLike> | null;
  ordinal?: number | null;
}

/* Recursive flatten — mirrors the same small helper duplicated at
   src/features/exports/model/exports.ts, scripts/fetch-holidays.mjs, and
   GuideLayout.astro's local flatSections(): the schema has no nested-sections member today,
   but guide data isn't schema-checked at this layer, so this stays defensive. Kept local
   because the nearest existing copy lives inside the EXPORTS feature silo — importing it
   would couple atlas→exports across a feature boundary for six lines (shared `src/lib/`
   imports like trip-dates are fine; another feature's internals are not, and even its
   index.ts door isn't worth opening for this). If a sixth copy ever appears, promote ONE
   into src/lib/ and migrate all of them in the same pass. */
function flatten(sections: readonly SectionLike[] | null | undefined, out: SectionLike[] = []): SectionLike[] {
  for (const s of sections || []) {
    if (s && Array.isArray(s.sections)) flatten(s.sections, out);
    else if (s) out.push(s);
  }
  return out;
}

/** The guide's first `map` section center, in file order — the anchor point (D6: Fukuoka
    resolves for japan naturally here, since its Fukuoka map section is the first one in file
    order across all of japan's section files). */
export function firstMapCenter(sections: readonly SectionLike[] | null | undefined): { lat: number; lng: number } | null {
  const flat = flatten(sections);
  const map = flat.find((s): s is MapSectionLike => s.type === "map" && !!(s as MapSectionLike).center);
  return map?.center ? { lat: map.center.lat, lng: map.center.lng } : null;
}

/** The anchor's place-name label from the guide's own `kicker` — every real kicker in this
    repo follows "City[, Region][ · City2...] — date range" (e.g. "Seoul · Daejeon · Busan —
    Jul 8–15, 2026", "Sedona, Arizona — Sep 2–8, 2026"); the leading city is everything before
    the first `,`, `·`, or em dash. Null for a guide with no kicker — never invented. */
export function anchorLabelFromKicker(kicker: string | null | undefined): string | null {
  if (!kicker) return null;
  const cut = kicker.search(/[,·—]/);
  const label = (cut === -1 ? kicker : kicker.slice(0, cut)).trim();
  return label || null;
}

/** Trip status from tripWindow()'s own verdicts — one small enum the hub can key display
    copy off, instead of re-deriving isPast/isOngoing at every call site. `now` is injected:
    date logic that reaches for the real clock can't be tested. */
export function statusFor(win: ReturnType<typeof tripWindow>): TripStatus {
  if (!win.hasDates) return "undated";
  if (win.isPast) return "past";
  if (win.isOngoing) return "ongoing";
  return "upcoming";
}

/** Resolve the traveler-origin fact row (Stage B.2's reserved id) through the airport
    gazetteer. Null when there's no row, the row's code isn't in the gazetteer yet, or the
    code doesn't look like an IATA code — every one of those is an honest "we don't have a
    point for this guide yet", never a guessed one. */
export function originFor(facts: Record<string, FactLike> | null | undefined): GuideOrigin | null {
  const row = facts?.["traveler-origin"];
  if (!row?.value) return null;
  const iata = row.value.trim().toUpperCase();
  const airport = airportFor(iata);
  if (!airport) return null;
  return { lat: airport.lat, lng: airport.lng, label: airport.label, iata, confirmed: row.state === "confirmed" };
}

/** A still image URL from `guide.cover` alone — see CoverLike's doc comment for what this
    deliberately does NOT chase. */
export function coverImgFor(cover: CoverLike | null | undefined): string | null {
  if (!cover) return null;
  if (cover.file) return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(cover.file)}`;
  if (cover.src) return cover.src;
  if (cover.video?.poster) return cover.video.poster;
  return null;
}

/**
 * Derive one guide's atlas record. Pure — `now` is injected (trip status depends on the
 * clock), everything else comes straight from `input`.
 */
export function deriveGuideRecord(input: GuideRecordInput, now: Date): GuideAtlasRecord {
  // Year pinned from the kicker when it states one (yearFromKicker's doc explains why the
  // now-relative inference is wrong here): a June 2026 trip must stay start=2026/status=past
  // on every future build, not roll into "upcoming 2027" once it's 180 days behind us.
  const first = firstDayDateOf(input.sections);
  const last = lastDayDateOf(input.sections);
  const year = yearFromKicker(input.kicker);
  const win = year != null ? tripWindowInYear(first, last, year, now) : tripWindow(first, last, now);
  return {
    slug: input.slug,
    title: input.title,
    dek: input.dek ?? null,
    anchor: firstMapCenter(input.sections),
    anchorLabel: anchorLabelFromKicker(input.kicker),
    countryId: isoNumericFor(input.country ?? null),
    ordinal: input.ordinal ?? null,
    start: win.start,
    end: win.end,
    status: statusFor(win),
    tz: input.tz ?? null,
    origin: originFor(input.facts),
    coverImg: coverImgFor(input.cover),
  };
}

/* tripWindow() wants each end's raw day-label string ("Wed Jul 8"), the same shape
   src/pages/index.astro already extracts from a guide's `days` section(s). EXPORTED (via
   the silo's index.ts) so consumers that need a guide's trip-date labels — GuideLayout's
   sheet-ordinal inputs — reuse this one extraction instead of keeping their own copy. */
function daysItems(sections: readonly SectionLike[] | null | undefined): Array<{ date?: string }> {
  const flat = flatten(sections);
  const days = flat.find((s) => s.type === "days" && Array.isArray((s as { items?: unknown }).items));
  return ((days as { items?: Array<{ date?: string }> })?.items) ?? [];
}
export function firstDayDateOf(sections: readonly SectionLike[] | null | undefined): string | null {
  return daysItems(sections)[0]?.date ?? null;
}
export function lastDayDateOf(sections: readonly SectionLike[] | null | undefined): string | null {
  const items = daysItems(sections);
  return items[items.length - 1]?.date ?? firstDayDateOf(sections);
}
