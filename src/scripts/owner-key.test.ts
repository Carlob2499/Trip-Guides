// @protects-file The creator's key stops working on its own, and is never left readable forever.

// The owner key is the whole authorization story for /change, /answer and /approve — there is no
// account behind it — and localStorage is an origin-wide store with no expiry, on an origin
// (<user>.github.io) shared with every other Pages site. So the only thing bounding a forgotten
// copy is this module's own clock, which is what these tests pin.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  readOwnerKey, hasOwnerKey, storeOwnerKey, clearOwnerKey, OWNER_KEY_MIN, OWNER_KEY_TTL_MS,
} from "./owner-key.js";

const KEY = "0123456789abcdef0123456789abcdef"; // 32 chars — what the README tells you to generate
const STORAGE_KEY = "wp-owner-key";

/** Minimal localStorage — the module only ever get/set/removes one entry. */
function fakeStore() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => { map.set(k, String(v)); },
    removeItem: (k: string) => { map.delete(k); },
  };
}

let store: ReturnType<typeof fakeStore>;

beforeEach(() => {
  store = fakeStore();
  vi.stubGlobal("localStorage", store);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("storing", () => {
  it("stores {key, exp}, never a bare secret", () => {
    expect(storeOwnerKey(KEY)).toBe(true);
    const entry = JSON.parse(store.map.get(STORAGE_KEY)!);
    expect(entry.key).toBe(KEY);
    expect(entry.exp).toBeGreaterThan(Date.now());
  });

  it("rejects a value too short to be a paste of a real key", () => {
    expect(storeOwnerKey("x".repeat(OWNER_KEY_MIN - 1))).toBe(false);
    expect(storeOwnerKey("   ")).toBe(false);
    expect(store.map.has(STORAGE_KEY)).toBe(false);
  });

  it("reads back exactly what was stored, within the window", () => {
    storeOwnerKey(` ${KEY} `);
    expect(readOwnerKey()).toBe(KEY);
    expect(hasOwnerKey()).toBe(true);
  });
});

describe("expiry", () => {
  it("stops answering once 30 days have passed, and REMOVES the entry", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-15T00:00:00Z"));
    storeOwnerKey(KEY);

    vi.setSystemTime(new Date("2026-08-15T00:00:00Z").getTime() + OWNER_KEY_TTL_MS - 1000);
    expect(readOwnerKey()).toBe(KEY); // still inside the window

    vi.setSystemTime(new Date("2026-08-15T00:00:00Z").getTime() + OWNER_KEY_TTL_MS + 1);
    expect(readOwnerKey()).toBe("");
    expect(hasOwnerKey()).toBe(false);
    // Not merely ignored: an expired key left in the store is still a readable secret on a
    // shared machine, which is the whole thing this expiry exists to bound.
    expect(store.map.has(STORAGE_KEY)).toBe(false);
  });

  it("re-pasting the same key restarts the clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-15T00:00:00Z"));
    storeOwnerKey(KEY);
    const first = JSON.parse(store.map.get(STORAGE_KEY)!).exp;

    vi.setSystemTime(new Date("2026-08-20T00:00:00Z"));
    storeOwnerKey(KEY);
    expect(JSON.parse(store.map.get(STORAGE_KEY)!).exp).toBeGreaterThan(first);
  });
});

describe("anything that isn't a live entry reads as no key", () => {
  it("treats a legacy bare-string key as expired rather than adopting it", () => {
    // Pre-expiry format. Its age is unknowable, so it cannot be shown to be inside the window —
    // and the whole point is that an old copy stops working. One re-paste is the cost.
    store.map.set(STORAGE_KEY, KEY);
    expect(readOwnerKey()).toBe("");
    expect(store.map.has(STORAGE_KEY)).toBe(false);
  });

  it("survives a hand-edited or half-written entry", () => {
    for (const junk of ["{", "null", '{"key":"' + KEY + '"}', '{"exp":99999999999999}', '{"key":"","exp":99999999999999}']) {
      store.map.set(STORAGE_KEY, junk);
      expect(readOwnerKey()).toBe("");
    }
  });

  it("reads as no key when the store throws (Safari private mode)", () => {
    vi.stubGlobal("localStorage", {
      getItem() { throw new Error("SecurityError"); },
      setItem() { throw new Error("SecurityError"); },
      removeItem() { throw new Error("SecurityError"); },
    });
    expect(readOwnerKey()).toBe("");
    expect(hasOwnerKey()).toBe(false);
    expect(storeOwnerKey(KEY)).toBe(false);
    expect(() => clearOwnerKey()).not.toThrow();
  });
});

describe("forgetting", () => {
  it("clears the entry", () => {
    storeOwnerKey(KEY);
    clearOwnerKey();
    expect(readOwnerKey()).toBe("");
  });
});
