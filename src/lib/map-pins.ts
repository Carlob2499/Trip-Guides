// Build-time pin derivation for the interactive itinerary maps.
// Pure + tested: given a guide's sections, returns the pins each `map` section
// should render. Convention (mirrors "weather binds to the first map section"):
// the FIRST map section is the guide's primary map and additionally receives
// every sights coordinate guide-wide; later map sections show only their own
// center + named points. Nothing is invented — pins exist only where the
// content already carries verified coordinates.
import { flattenSections } from "../features/exports/index";
import type { DayItem, Section, SectionOf } from "./guide-types";

export type Pin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  local: string | null;   // native-script name (taxi display), when present
  kind: "center" | "point" | "sight";
};

// Stable, human-readable pin id from a display name; shared with SightsBlock so
// sight cards and their map pins agree on the anchor id.
export function pinSlug(name: string): string {
  return String(name || "")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "pin";
}

type MaybeCoords = { lat?: unknown; lng?: unknown } | null | undefined;
const hasCoords = (o: MaybeCoords): o is { lat: number; lng: number } =>
  !!o && Number.isFinite(o.lat) && Number.isFinite(o.lng);

// Planner data for the day-synced Plan view: per-day stop lists + a day-indexed
// pin set for the planner map. When no day has coords, `hasCoords` is false and
// the planner map falls back to the guide-level pins (or renders nothing on
// scaffolds) — waypoint adoption is purely incremental content work.
export type PlannerStop = { name: string; time: string | null; note: string | null; lat: number | null; lng: number | null };
/* M6: `energy` was typed `string` here while the schema has always been a three-value enum, and
   the stop coords were typed `number | null` while the mapping could yield `undefined`. Both
   were invisible until the derived types were threaded through — exactly the class of drift a
   hand-written type accumulates against the schema it is supposed to mirror. */
export type PlannerDay = { idx: number; date: string; title: string; energy: DayItem["energy"]; stops: PlannerStop[] };
export type PlannerPin = Pin & { dayIdx: number; time: string | null };

export function derivePlannerData(sections: Section[]): { days: PlannerDay[]; pins: PlannerPin[]; hasCoords: boolean } {
  const flat = flattenSections(sections || []);
  const daysSec = flat.find((s): s is SectionOf<"days"> => s.type === "days" && !!s.items?.length);
  const days: PlannerDay[] = (daysSec?.items || []).map((d, idx: number) => ({
    idx, date: d.date, title: d.title, energy: d.energy || "balanced",
    stops: (d.waypoints || []).map((w) => ({
      name: w.name, time: w.time ?? null, note: w.note ?? null,
      lat: Number.isFinite(w.lat) ? (w.lat as number) : null,
      lng: Number.isFinite(w.lng) ? (w.lng as number) : null,
    })),
  }));
  const pins: PlannerPin[] = [];
  for (const day of days) {
    day.stops.forEach((s, si) => {
      if (s.lat == null || s.lng == null) return;
      pins.push({
        id: `d${day.idx}-${pinSlug(s.name)}-${si}`, name: s.name,
        lat: s.lat, lng: s.lng, local: null, kind: "point",
        dayIdx: day.idx, time: s.time,
      });
    });
  }
  return { days, pins, hasCoords: pins.length > 0 };
}

export function derivePins(sections: Section[]): Map<SectionOf<"map">, Pin[]> {
  const flat = flattenSections(sections || []);
  const maps = flat.filter((s): s is SectionOf<"map"> => s.type === "map" && hasCoords(s.center));
  const sightPins: Pin[] = flat
    .filter((s): s is SectionOf<"sights"> => s.type === "sights")
    .flatMap((s) => s.items || [])
    .filter((it) => hasCoords(it.map))
    .map((it) => ({
      id: pinSlug(it.name), name: it.name,
      lat: it.map!.lat, lng: it.map!.lng, local: null, kind: "sight" as const,
    }));

  const out = new Map<SectionOf<"map">, Pin[]>();
  maps.forEach((sec, i: number) => {
    const pins: Pin[] = [{
      id: `center-${i}`, name: sec.title || "Map area",
      lat: sec.center.lat, lng: sec.center.lng, local: null, kind: "center",
    }];
    for (const p of sec.points || []) {
      if (!hasCoords(p)) continue;
      pins.push({
        id: pinSlug(p.name), name: p.name, lat: p.lat, lng: p.lng,
        local: p.local_script_name || null, kind: "point",
      });
    }
    if (i === 0) pins.push(...sightPins);
    out.set(sec, pins);
  });
  return out;
}
