/* The honest fallback map: an OpenStreetMap embed URL for a set of pins (design-system.md §15
   "a static/local fallback may exist"). Numbers in, an encoded URL out — never a string read back
   from the page. One home for the bbox math the itinerary workbench and the Trip cockpit both
   need; src/lib because two features share it and neither may deep-import the other. */
export interface EmbedPin { lat: number | null | undefined; lng: number | null | undefined }

export function osmEmbedUrl(pins: readonly EmbedPin[]): string | null {
  const pts = pins
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (!pts.length) return null;
  const lats = pts.map((p) => p.lat), lngs = pts.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const latPad = Math.max(0.006, (maxLat - minLat) * 0.18);
  const lngPad = Math.max(0.008, (maxLng - minLng) * 0.18);
  const part = (n: number) => encodeURIComponent(String(n));
  const bbox = [minLng - lngPad, minLat - latPad, maxLng + lngPad, maxLat + latPad].map(part).join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${part(pts[0].lat)}%2C${part(pts[0].lng)}`;
}
