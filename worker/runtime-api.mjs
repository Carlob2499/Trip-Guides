const ROUTE_MODES = new Set(["WALK", "DRIVE", "BICYCLE", "TRANSIT"]);
const LIVE_PATHS = new Set([
  "/runtime/routes", "/runtime/route-matrix", "/runtime/places", "/runtime/weather-alerts",
]);
const pending = new Map();

const json = (data, status, cors) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors },
});

const point = (value) => value && Number.isFinite(value.latitude) && value.latitude >= -90 && value.latitude <= 90 &&
  Number.isFinite(value.longitude) && value.longitude >= -180 && value.longitude <= 180;

function durationSeconds(value) {
  const match = /^(\d+(?:\.\d+)?)s$/.exec(String(value || ""));
  return match ? Math.round(Number(match[1])) : null;
}

async function cacheKey(path, raw) {
  const input = new TextEncoder().encode(`${path}:${JSON.stringify(raw)}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return `live:${path}:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

async function cached(env, path, raw, ttlSeconds, load) {
  const key = await cacheKey(path, raw);
  if (env.LIVE_CACHE) {
    const hit = await env.LIVE_CACHE.get(key, "json").catch(() => null);
    if (hit) return hit;
  }
  if (pending.has(key)) return pending.get(key);
  const promise = load().then(async (value) => {
    if (env.LIVE_CACHE) await env.LIVE_CACHE.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds }).catch(() => {});
    return value;
  }).finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}

async function rateGate(request, env) {
  const limiter = env.RUNTIME_LIMITER;
  if (!limiter || typeof limiter.limit !== "function") return { ok: false, status: 503, error: "runtime cost guard is not configured" };
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const result = await limiter.limit({ key: `runtime:${ip}` });
  if (!result?.success) return { ok: false, status: 429, error: "live-data request limit reached" };
  return { ok: true };
}

function googleHeaders(env, fieldMask) {
  return {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": env.GOOGLE_SERVER_KEY,
    "X-Goog-FieldMask": fieldMask,
  };
}

async function googleJson(url, init, fetchImpl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetchImpl(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`provider ${response.status}`);
    // Keep the abort deadline active until the body has finished downloading.
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function waypoint(pointValue) {
  return { location: { latLng: { latitude: pointValue.latitude, longitude: pointValue.longitude } } };
}

function validateRoute(raw) {
  return raw && point(raw.origin) && point(raw.destination) && ROUTE_MODES.has(raw.travelMode) &&
    (!raw.departureTime || Number.isFinite(Date.parse(raw.departureTime)));
}

async function routes(raw, env, fetchImpl) {
  if (!validateRoute(raw)) throw Object.assign(new Error("invalid route request"), { status: 400 });
  const body = { origin: waypoint(raw.origin), destination: waypoint(raw.destination), travelMode: raw.travelMode };
  if (raw.departureTime) body.departureTime = raw.departureTime;
  const data = await googleJson("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: googleHeaders(env, "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline"),
    body: JSON.stringify(body),
  }, fetchImpl);
  const route = data?.routes?.[0];
  const duration = durationSeconds(route?.duration);
  if (duration === null || !Number.isFinite(route?.distanceMeters)) throw new Error("provider returned no route");
  return { durationSeconds: duration, distanceMeters: route.distanceMeters, encodedPolyline: route.polyline?.encodedPolyline, attribution: "Google" };
}

function validateMatrix(raw) {
  return raw && Array.isArray(raw.stops) && raw.stops.length >= 2 && raw.stops.length <= 8 &&
    raw.stops.every((stop) => stop && typeof stop.id === "string" && stop.id.length <= 160 && point(stop)) && ROUTE_MODES.has(raw.travelMode);
}

async function matrix(raw, env, fetchImpl) {
  if (!validateMatrix(raw)) throw Object.assign(new Error("invalid route-matrix request"), { status: 400 });
  const locations = raw.stops.map((stop) => ({ waypoint: waypoint(stop) }));
  const rows = await googleJson("https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix", {
    method: "POST",
    headers: googleHeaders(env, "originIndex,destinationIndex,duration,distanceMeters,status,condition"),
    body: JSON.stringify({ origins: locations, destinations: locations, travelMode: raw.travelMode }),
  }, fetchImpl);
  if (!Array.isArray(rows)) throw new Error("provider returned no matrix");
  const cells = rows.flatMap((row) => {
    const duration = durationSeconds(row.duration);
    return duration !== null && Number.isFinite(row.distanceMeters) && row.condition !== "ROUTE_NOT_FOUND"
      ? [{ originIndex: row.originIndex, destinationIndex: row.destinationIndex, durationSeconds: duration, distanceMeters: row.distanceMeters }]
      : [];
  });
  return { cells, attribution: "Google" };
}

function validatePlaces(raw) {
  return raw && Array.isArray(raw.places) && raw.places.length > 0 && raw.places.length <= 8 && raw.places.every((place) =>
    place && typeof place.waypointId === "string" && place.waypointId.length <= 160 &&
    typeof place.googlePlaceId === "string" && /^[A-Za-z0-9_-]{3,256}$/.test(place.googlePlaceId));
}

async function places(raw, env, fetchImpl) {
  if (!validatePlaces(raw)) throw Object.assign(new Error("invalid places request"), { status: 400 });
  return Promise.all(raw.places.map(async ({ waypointId, googlePlaceId }) => {
    const data = await googleJson(`https://places.googleapis.com/v1/places/${encodeURIComponent(googlePlaceId)}`, {
      headers: googleHeaders(env, "id,businessStatus,currentOpeningHours.openNow,currentOpeningHours.nextOpenTime,currentOpeningHours.nextCloseTime"),
    }, fetchImpl);
    return {
      waypointId,
      googlePlaceId: data.id || googlePlaceId,
      businessStatus: data.businessStatus || null,
      openNow: typeof data.currentOpeningHours?.openNow === "boolean" ? data.currentOpeningHours.openNow : null,
      nextOpenTime: data.currentOpeningHours?.nextOpenTime || null,
      nextCloseTime: data.currentOpeningHours?.nextCloseTime || null,
    };
  }));
}

function validateAlerts(raw) {
  return raw && point(raw) && (!raw.languageCode || /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/.test(raw.languageCode));
}

async function weatherAlerts(raw, env, fetchImpl) {
  if (!validateAlerts(raw)) throw Object.assign(new Error("invalid weather-alert request"), { status: 400 });
  const query = new URLSearchParams({
    key: env.GOOGLE_SERVER_KEY,
    "location.latitude": String(raw.latitude),
    "location.longitude": String(raw.longitude),
    languageCode: raw.languageCode || "en",
    pageSize: "20",
  });
  const data = await googleJson(`https://weather.googleapis.com/v1/publicAlerts:lookup?${query}`, {}, fetchImpl);
  return (data.weatherAlerts || []).map((alert) => ({
    id: String(alert.alertId || ""),
    title: String(alert.alertTitle?.text || alert.eventType || "Weather alert"),
    severity: ["MINOR", "MODERATE", "SEVERE", "EXTREME"].includes(alert.severity) ? alert.severity : "UNKNOWN",
    urgency: String(alert.urgency || "UNKNOWN"),
    startsAt: alert.startTime || null,
    expiresAt: alert.expirationTime || null,
    instruction: Array.isArray(alert.instruction) ? alert.instruction.filter((line) => typeof line === "string").slice(0, 8) : [],
    source: String(alert.dataSource?.publisher || alert.dataSource?.name || "public weather authority"),
  })).filter((alert) => alert.id);
}

const HANDLERS = {
  // A route may start at an ephemeral current position, so it is deduplicated in-flight but
  // never written to shared KV. Authored-stop matrices remain cacheable.
  "/runtime/routes": { ttl: 0, validate: validateRoute, fn: routes },
  "/runtime/route-matrix": { ttl: 600, validate: validateMatrix, fn: matrix },
  // Google Places content must not be retained; Place IDs are the sole caching exception.
  "/runtime/places": { ttl: 0, validate: validatePlaces, fn: places },
  "/runtime/weather-alerts": { ttl: 300, validate: validateAlerts, fn: weatherAlerts },
};

export async function handleRuntimeRequest(path, request, env, raw, cors, fetchImpl = fetch) {
  if (!LIVE_PATHS.has(path)) return null;
  if (!env.GOOGLE_SERVER_KEY) return json({ error: "live provider is not configured" }, 503, cors);
  const handler = HANDLERS[path];
  if (!handler.validate(raw)) return json({ error: "invalid live-data request" }, 400, cors);
  const gate = await rateGate(request, env);
  if (!gate.ok) return json({ error: gate.error }, gate.status, cors);
  try {
    const value = handler.ttl > 0
      ? await cached(env, path, raw, handler.ttl, () => handler.fn(raw, env, fetchImpl))
      : await handler.fn(raw, env, fetchImpl);
    return json(value, 200, cors);
  } catch (error) {
    const status = error?.status === 400 ? 400 : 502;
    return json({ error: status === 400 ? error.message : "live provider unavailable" }, status, cors);
  }
}
