import { describe, expect, it, vi } from "vitest";
import { EphemeralGeolocation } from "./geolocation";

describe("EphemeralGeolocation", () => {
  it("does not request location during construction, permission checks, or peek", async () => {
    const getCurrentPosition = vi.fn();
    const service = new EphemeralGeolocation({ getCurrentPosition }, { query: vi.fn(async () => ({ state: "prompt" as const })) });
    expect(service.peek()).toBeNull();
    expect(await service.permission()).toBe("prompt");
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("captures exact coordinates only after an explicit contextual request", async () => {
    const service = new EphemeralGeolocation({
      getCurrentPosition(success) { success({ coords: { latitude: 41.9, longitude: 12.5, accuracy: 18 }, timestamp: 5_000 }); },
    });
    const result = await service.request("map");
    expect(result).toEqual({
      status: "available",
      context: "map",
      location: { latitude: 41.9, longitude: 12.5, accuracyMeters: 18, capturedAt: "1970-01-01T00:00:05.000Z" },
    });
    expect(service.peek()).toBe(result.location);
    service.clear();
    expect(service.peek()).toBeNull();
  });

  it.each([[1, "denied"], [2, "unavailable"], [3, "timeout"]] as const)("maps browser error %s to %s without a substitute location", async (code, status) => {
    const service = new EphemeralGeolocation({ getCurrentPosition(_ok, fail) { fail({ code }); } });
    expect(await service.request("sos")).toEqual({ status, context: "sos", location: null });
    expect(service.peek()).toBeNull();
  });

  it("reports unsupported without touching another surface", async () => {
    const service = new EphemeralGeolocation(null);
    expect(await service.request("search")).toEqual({ status: "unsupported", context: "search", location: null });
  });
});

