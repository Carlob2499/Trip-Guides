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
