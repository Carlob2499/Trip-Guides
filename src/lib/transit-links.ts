// "Get me there" transit deep-links (docs/archive/FEATURES.md #1) — one-tap open-in links for a
// verified coordinate, built from each provider's OWN current developer documentation
// (verified 2026-07-18; re-check if either provider's scheme changes):
//   Google — https://developers.google.com/maps/documentation/urls/get-started
//            `api=1` required; `destination` accepts "lat,lng"; optional `destination_place_id`.
//   Apple  — https://developer.apple.com/documentation/mapkit/unified-map-urls (iOS 18.4+/
//            macOS 15.4+ unified scheme; `destination` accepts a "lat,lng" pair directly, per
//            the doc's own worked example). Both resolve on the web when no app is installed.
//
// Country-native apps (Naver Map for Korea) are ADDITIVE, opt-in per country — the whole
// point per the Korea trip's own post-mortem: Google Maps has known turn-by-turn gaps there,
// and Naver is the app locals actually navigate with. Naver's scheme is confirmed against its
// official NAVER Cloud Platform docs (guide.ncloud-docs.com/docs/en/maps-url-scheme) but has
// NO web fallback — the custom `nmap://` URI silently does nothing if the app isn't installed,
// so it's always offered LAST, clearly labelled, alongside links that always work.
//
// Kakao Map (Korea's other major nav app) is deliberately OMITTED: no authoritative source
// documents its deep-link URL format as of 2026-07 verification — ship/flag/omit, never guess
// a URL a traveler might actually tap while lost.
//
// Only countries with a CONFIRMED scheme get an entry here — same discipline as
// `EMERGENCY` in countries.mjs (verified-or-absent, never guessed).

export type TransitLink = { label: string; href: string };

type NativeAppId = "naver";

const NATIVE_APPS_BY_COUNTRY: Record<string, NativeAppId[]> = {
  "South Korea": ["naver"],
};

const NATIVE_BUILDERS: Record<NativeAppId, (lat: number, lng: number, name: string, origin: string) => TransitLink> = {
  naver: (lat, lng, name, origin) => ({
    label: "Naver Map",
    href: `nmap://route/walk?dlat=${lat}&dlng=${lng}&dname=${encodeURIComponent(name || "")}&appname=${encodeURIComponent(origin)}`,
  }),
};

/** Google + Apple — offered for every guide, every country, no config needed. */
export function universalTransitLinks(lat: number, lng: number, placeId?: string | null): TransitLink[] {
  const g = [`api=1`, `destination=${lat},${lng}`, `travelmode=walking`];
  if (placeId) g.push(`destination_place_id=${encodeURIComponent(placeId)}`);
  return [
    { label: "Google Maps", href: `https://www.google.com/maps/dir/?${g.join("&")}` },
    { label: "Apple Maps", href: `https://maps.apple.com/directions?destination=${lat},${lng}&mode=walking` },
  ];
}

/** Country-native apps — empty array for any country with no confirmed scheme. */
export function nativeTransitLinks(country: string, lat: number, lng: number, name: string, origin: string): TransitLink[] {
  const apps = NATIVE_APPS_BY_COUNTRY[country] || [];
  return apps.map((id) => NATIVE_BUILDERS[id](lat, lng, name, origin));
}

/** The full "Get me there" set for a place: universal links first, native app(s) last. */
export function transitLinks(
  country: string,
  lat: number,
  lng: number,
  name: string,
  placeId: string | null | undefined,
  origin: string
): TransitLink[] {
  return [...universalTransitLinks(lat, lng, placeId), ...nativeTransitLinks(country, lat, lng, name, origin)];
}

/** One stop on a day's route — only those carrying real coordinates ever reach here. */
export type RoutePoint = { lat: number; lng: number };

/**
 * The WHOLE-DAY route link (R5 COMPONENTS.md §12): every stop of one day chained into a single
 * multi-stop Google Maps direction, on top of the per-stop links each stop already carries.
 *
 * Why a whole-day link at all: a route you cannot walk is a table. The per-stop links answer
 * "how do I get to this one"; this answers "how do I do today", which is the question actually
 * being asked at 9am with a phone in one hand.
 *
 * Google Maps leads here because Korea's own field log records Naver and Kakao underperforming
 * it on that trip — a recorded observation, not a preference.
 *
 * Returns null rather than a partial route when there is nothing honest to link:
 *   · fewer than two stops carry coordinates — one point is not a route, and a "route" drawn
 *     through a single stop would imply the others were checked and found unreachable
 *   · no stops at all
 * A stop WITHOUT coordinates is silently skipped rather than guessed at from its name: a maps
 * link built from a place-name string is the product inventing a location.
 */
export function dayRouteLink(points: Array<Partial<RoutePoint>> | null | undefined): string | null {
  const fixed = (points ?? []).filter(
    (p): p is RoutePoint => Number.isFinite(p?.lat) && Number.isFinite(p?.lng),
  );
  if (fixed.length < 2) return null;

  const at = (p: RoutePoint) => `${p.lat},${p.lng}`;
  const origin = fixed[0];
  const destination = fixed[fixed.length - 1];
  const params = [
    "api=1",
    `origin=${encodeURIComponent(at(origin))}`,
    `destination=${encodeURIComponent(at(destination))}`,
    "travelmode=transit",
  ];
  // Everything between the ends. Google's own URL contract joins these with a literal pipe,
  // which has to survive encoding as a separator rather than becoming %7C inside one value —
  // so each point is encoded and the pipes are added after.
  const middle = fixed.slice(1, -1);
  if (middle.length > 0) {
    params.push(`waypoints=${middle.map((p) => encodeURIComponent(at(p))).join("|")}`);
  }
  return `https://www.google.com/maps/dir/?${params.join("&")}`;
}
