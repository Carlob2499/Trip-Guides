import { describe, expect, it, vi } from "vitest";
import { RuntimeOverlayClient, type OverlayCache } from "./runtime-overlay";

function memoryCache(): OverlayCache {
  const values = new Map<string, string>();
  return { get: (k) => values.get(k) ?? null, set: (k, v) => values.set(k, v), remove: (k) => values.delete(k) };
}

const valid = (value: unknown): value is { minutes: number } =>
  !!value && typeof (value as { minutes?: unknown }).minutes === "number";

describe("RuntimeOverlayClient", () => {
  it("is inert when its provider is not configured", async () => {
    const load = vi.fn(async () => ({ minutes: 8 }));
    const result = await new RuntimeOverlayClient({ source: "routes", enabled: false, ttlMs: 1000 }).load({ cacheKey: "a", load, validate: valid });
    expect(result).toMatchObject({ status: "unconfigured", stale: false, value: null, source: "routes" });
    expect(load).not.toHaveBeenCalled();
  });

  it("deduplicates concurrent requests and serves a fresh cached overlay", async () => {
    const cache = memoryCache();
    const load = vi.fn(async () => ({ minutes: 8 }));
    const client = new RuntimeOverlayClient({ source: "routes", enabled: true, ttlMs: 1000, cache, now: () => 1_000 });
    const [a, b] = await Promise.all([
      client.load({ cacheKey: "a", load, validate: valid }),
      client.load({ cacheKey: "a", load, validate: valid }),
    ]);
    const c = await client.load({ cacheKey: "a", load, validate: valid });
    expect(load).toHaveBeenCalledTimes(1);
    expect(a.value).toEqual({ minutes: 8 });
    expect(b.value).toEqual({ minutes: 8 });
    expect(c.status).toBe("available");
    expect(Object.isFrozen(c.value)).toBe(true);
  });

  it("does not freeze or mutate provider-owned data while making the projection readonly", async () => {
    const providerValue = { minutes: 8 };
    const result = await new RuntimeOverlayClient({ source: "routes", enabled: true, ttlMs: 100 }).load({ cacheKey: "owned", load: async () => providerValue, validate: valid });
    expect(Object.isFrozen(providerValue)).toBe(false);
    expect(result.value).not.toBe(providerValue);
  });

  it("uses stale data after provider failure without rewriting it", async () => {
    let now = 1_000;
    const cache = memoryCache();
    const client = new RuntimeOverlayClient({ source: "places", enabled: true, ttlMs: 100, staleTtlMs: 1000, cache, now: () => now });
    await client.load({ cacheKey: "x", load: async () => ({ minutes: 4 }), validate: valid });
    now = 1_200;
    const stale = await client.load({ cacheKey: "x", load: async () => { throw new Error("quota"); }, validate: valid });
    expect(stale).toMatchObject({ status: "stale", stale: true, value: { minutes: 4 } });
  });

  it("distinguishes offline with and without a stale cached value", async () => {
    const onlineCache = memoryCache();
    let now = 1_000;
    const online = new RuntimeOverlayClient({ source: "weather", enabled: true, ttlMs: 100, staleTtlMs: 1000, cache: onlineCache, now: () => now });
    await online.load({ cacheKey: "x", load: async () => ({ minutes: 2 }), validate: valid });
    now = 1_200;
    const offline = new RuntimeOverlayClient({ source: "weather", enabled: true, ttlMs: 100, staleTtlMs: 1000, cache: onlineCache, now: () => now, online: () => false });
    expect(await offline.load({ cacheKey: "x", load: async () => ({ minutes: 9 }), validate: valid })).toMatchObject({ status: "offline", stale: true, value: { minutes: 2 } });
    expect(await offline.load({ cacheKey: "missing", load: async () => ({ minutes: 9 }), validate: valid })).toMatchObject({ status: "offline", stale: false, value: null });
  });

  it("fails closed on invalid provider data", async () => {
    const result = await new RuntimeOverlayClient({ source: "routes", enabled: true, ttlMs: 100 }).load<{ minutes: number }>({ cacheKey: "bad", load: async () => ({ minutes: "eight" } as unknown as { minutes: number }), validate: valid });
    expect(result.status).toBe("error");
    expect(result.value).toBeNull();
  });

  it("bounds a hung provider request and releases its in-flight slot", async () => {
    const client = new RuntimeOverlayClient({ source: "routes", enabled: true, ttlMs: 100, timeoutMs: 5 });
    const load = vi.fn((_signal: AbortSignal) => new Promise<{ minutes: number }>(() => {}));
    const result = await client.load({ cacheKey: "hung", load, validate: valid });
    expect(result).toMatchObject({ status: "error", error: "provider request timed out" });
    const retry = await client.load({ cacheKey: "hung", load: async () => ({ minutes: 3 }), validate: valid });
    expect(retry.status).toBe("available");
  });
});
