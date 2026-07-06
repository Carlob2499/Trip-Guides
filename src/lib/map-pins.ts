// Build-time pin derivation for the interactive itinerary maps (Leaflet).
// Pure + tested: given a guide's sections, returns the pins each `map` section
// should render. Convention (mirrors "weather binds to the first map section"):
// the FIRST map section is the guide's primary map and additionally receives
// every sights coordinate guide-wide; later map sections show only their own
// center + named points. Nothing is invented — pins exist only where the
// content already carries verified coordinates.
import { flattenSections } from "./exports";

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

const hasCoords = (o: any) =>
  o && Number.isFinite(o.lat) && Number.isFinite(o.lng);

// Planner data for the day-synced Plan view: per-day stop lists + a day-indexed
// pin set for the planner map. When no day has coords, `hasCoords` is false and
// the planner map falls back to the guide-level pins (or renders nothing on
// scaffolds) — waypoint adoption is purely incremental content work.
export type PlannerStop = { name: string; time: string | null; note: string | null; lat: number | null; lng: number | null };
export type PlannerDay = { idx: number; date: string; title: string; energy: string; stops: PlannerStop[] };
export type PlannerPin = Pin & { dayIdx: number; time: string | null };

export function derivePlannerData(sections: any[]): { days: PlannerDay[]; pins: PlannerPin[]; hasCoords: boolean } {
  const flat = flattenSections(sections || []);
  const daysSec = flat.find((s: any) => s.type === "days" && s.items?.length);
  const days: PlannerDay[] = (daysSec?.items || []).map((d: any, idx: number) => ({
    idx, date: d.date, title: d.title, energy: d.energy || "balanced",
    stops: (d.waypoints || []).map((w: any) => ({
      name: w.name, time: w.time ?? null, note: w.note ?? null,
      lat: Number.isFinite(w.lat) ? w.lat : null, lng: Number.isFinite(w.lng) ? w.lng : null,
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

export function derivePins(sections: any[]): Map<any, Pin[]> {
  const flat = flattenSections(sections || []);
  const maps = flat.filter((s: any) => s.type === "map" && hasCoords(s.center));
  const sightPins: Pin[] = flat
    .filter((s: any) => s.type === "sights")
    .flatMap((s: any) => s.items || [])
    .filter((it: any) => hasCoords(it.map))
    .map((it: any) => ({
      id: pinSlug(it.name), name: it.name,
      lat: it.map.lat, lng: it.map.lng, local: null, kind: "sight" as const,
    }));

  const out = new Map<any, Pin[]>();
  maps.forEach((sec: any, i: number) => {
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
