import { describe, expect, it, vi } from "vitest";
import { handleRuntimeRequest } from "../../worker/runtime-api.mjs";

function kv() {
  const values = new Map();
  return {
    get: vi.fn(async (key, type) => {
      const value = values.get(key) ?? null;
      return type === "json" && value ? JSON.parse(value) : value;
    }),
    put: vi.fn(async (key, value) => values.set(key, String(value))),
  };
}

const limiter = () => ({ limit: vi.fn(async () => ({ success: true })) });
const env = () => ({ GOOGLE_SERVER_KEY: "server-secret", RUNTIME_LIMITER: limiter(), LIVE_CACHE: kv() });
const request = () => new Request("https://worker.test/runtime", { headers: { "CF-Connecting-IP": "203.0.113.1" } });
const cors = { "Access-Control-Allow-Origin": "https://example.test" };

describe("runtime worker boundary", () => {
  it("keeps the provider timeout active while reading the response body", async () => {
    vi.useFakeTimers();
    let signal;
    try {
      const fetchPort = vi.fn(async (_url, init) => {
        signal = init.signal;
        return { ok: true, json: () => new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new Error("body aborted")), { once: true });
        }) };
      });
      const pending = handleRuntimeRequest("/runtime/routes", request(), env(), {
        origin: { latitude: 40, longitude: -73 }, destination: { latitude: 40.01, longitude: -73.01 }, travelMode: "WALK",
      }, cors, fetchPort);
      await vi.advanceTimersByTimeAsync(12_000);
      expect(signal?.aborted).toBe(true);
      const response = await pending;
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ error: "live provider unavailable" });
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("fails closed when the server key or runtime cost guard is absent", async () => {
    const raw = { origin: { latitude: 40, longitude: -73 }, destination: { latitude: 40.01, longitude: -73.01 }, travelMode: "WALK" };
    expect((await handleRuntimeRequest("/runtime/routes", request(), { RUNTIME_LIMITER: limiter() }, raw, cors)).status).toBe(503);
    expect((await handleRuntimeRequest("/runtime/routes", request(), { GOOGLE_SERVER_KEY: "x" }, raw, cors)).status).toBe(503);
  });

  it("fails closed when the atomic limiter rejects a burst", async () => {
    const fetchPort = vi.fn();
    const raw = { origin: { latitude: 40, longitude: -73 }, destination: { latitude: 40.01, longitude: -73.01 }, travelMode: "WALK" };
    const response = await handleRuntimeRequest("/runtime/routes", request(), {
      GOOGLE_SERVER_KEY: "server-secret",
      RUNTIME_LIMITER: { limit: vi.fn(async () => ({ success: false })) },
    }, raw, cors, fetchPort);
    expect(response.status).toBe(429);
    expect(fetchPort).not.toHaveBeenCalled();
  });

  it("sends a minimal field mask for a bounded route request", async () => {
    const calls = [];
    const fetchPort = vi.fn(async (url, init) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ routes: [{ duration: "600s", distanceMeters: 1500, polyline: { encodedPolyline: "abc" } }] }), { status: 200 });
    });
    const response = await handleRuntimeRequest("/runtime/routes", request(), env(), {
      origin: { latitude: 40, longitude: -73 }, destination: { latitude: 40.01, longitude: -73.01 }, travelMode: "WALK",
    }, cors, fetchPort);
    const body = await response.json();
    expect(body).toEqual({ durationSeconds: 600, distanceMeters: 1500, encodedPolyline: "abc", attribution: "Google" });
    expect(calls[0].init.headers["X-Goog-FieldMask"]).toBe("routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline");
    expect(JSON.stringify(body)).not.toContain("server-secret");
  });

  it("rejects an oversized matrix before spending provider quota", async () => {
    const fetchPort = vi.fn();
    const stops = Array.from({ length: 9 }, (_, i) => ({ id: String(i), latitude: 40, longitude: -73 }));
    const response = await handleRuntimeRequest("/runtime/route-matrix", request(), env(), { stops, travelMode: "WALK" }, cors, fetchPort);
    expect(response.status).toBe(400);
    expect(fetchPort).not.toHaveBeenCalled();
  });

  it("returns only operational Place fields and no ratings, reviews, summaries, or alternatives", async () => {
    const fetchPort = vi.fn(async () => new Response(JSON.stringify({
      id: "ChIJ123", businessStatus: "CLOSED_TEMPORARILY", currentOpeningHours: { openNow: false }, rating: 5, reviews: ["x"], generativeSummary: "x",
    }), { status: 200 }));
    const response = await handleRuntimeRequest("/runtime/places", request(), env(), { places: [{ waypointId: "museum", googlePlaceId: "ChIJ123" }] }, cors, fetchPort);
    const body = await response.json();
    expect(body).toEqual([{ waypointId: "museum", googlePlaceId: "ChIJ123", businessStatus: "CLOSED_TEMPORARILY", openNow: false, nextOpenTime: null, nextCloseTime: null }]);
    expect(JSON.stringify(body)).not.toMatch(/rating|review|summary|alternative/i);
  });
});
