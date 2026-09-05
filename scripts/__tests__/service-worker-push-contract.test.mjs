import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";

async function harness() {
  const source = await readFile(new URL("../../public/sw.js", import.meta.url), "utf8");
  const listeners = new Map();
  const showNotification = vi.fn(async () => undefined);
  const openWindow = vi.fn(async () => undefined);
  const self = {
    location: { origin: "https://example.test" },
    registration: { showNotification },
    clients: { matchAll: vi.fn(async () => []), openWindow },
    addEventListener: (name, handler) => listeners.set(name, handler),
    skipWaiting: vi.fn(),
  };
  vm.runInNewContext(source, {
    self, caches: {}, fetch: vi.fn(), AbortController, URL, URLSearchParams,
    Request, Response, setTimeout, clearTimeout, Promise, Set,
  });
  return { listeners, showNotification, openWindow };
}

describe("service worker push contract", () => {
  it("shows an actionable notification and preserves its same-app target", async () => {
    const { listeners, showNotification } = await harness();
    let pending;
    listeners.get("push")({
      data: { json: () => ({ kind: "severe-weather", title: "Flood warning", body: "Move uphill", eventId: "wx-1", url: "/Trip-Guides/guides/korea/" }) },
      waitUntil: (promise) => { pending = promise; },
    });
    await pending;
    expect(showNotification).toHaveBeenCalledWith("Flood warning", expect.objectContaining({
      body: "Move uphill", tag: "waypoint:severe-weather:wx-1", data: { url: "/Trip-Guides/guides/korea/" },
    }));
  });

  it("ignores engagement events and cross-app navigation", async () => {
    const { listeners, showNotification, openWindow } = await harness();
    const waitUntil = vi.fn();
    listeners.get("push")({
      data: { json: () => ({ kind: "promotion", title: "Come back", body: "We miss you", eventId: "ad", url: "/Trip-Guides/" }) },
      waitUntil,
    });
    expect(waitUntil).not.toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();
    listeners.get("notificationclick")({ notification: { close: vi.fn(), data: { url: "https://evil.test/" } }, waitUntil });
    expect(openWindow).not.toHaveBeenCalled();
  });
});
