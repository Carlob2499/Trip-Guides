// @protects-file A day's whole-route link only exists when the guide really knows the route.

import { describe, expect, it } from "vitest";
import { dayRouteLink } from "./transit-links";

const P = (lat: number, lng: number) => ({ lat, lng });

describe("dayRouteLink", () => {
  it("chains every stop between the first and the last", () => {
    const url = dayRouteLink([P(37.5, 126.9), P(37.6, 127.0), P(37.7, 127.1), P(37.8, 127.2)])!;
    expect(url).toContain("origin=37.5%2C126.9");
    expect(url).toContain("destination=37.8%2C127.2");
    // The two middle stops, pipe-separated — the pipe is the separator and must not be encoded.
    expect(url).toContain("waypoints=37.6%2C127%7C37.7%2C127.1".replace("%7C", "|"));
  });

  it("omits the waypoints parameter entirely for a two-stop day", () => {
    // Not an empty waypoints=, which Google reads as a malformed request.
    const url = dayRouteLink([P(1, 2), P(3, 4)])!;
    expect(url).not.toContain("waypoints");
    expect(url).toContain("origin=1%2C2");
  });

  it("skips a stop with no coordinates rather than guessing one from its name", () => {
    const url = dayRouteLink([P(1, 2), { lat: undefined, lng: undefined }, P(5, 6)])!;
    expect(url).toContain("origin=1%2C2");
    expect(url).toContain("destination=5%2C6");
    expect(url).not.toContain("waypoints");
  });

  it("returns null when fewer than two stops are locatable — a point is not a route", () => {
    /* The honest blank. Drawing a "route" through one stop would imply the others had been
       checked and found unreachable, when in fact they were never located at all. */
    expect(dayRouteLink([P(1, 2)])).toBeNull();
    expect(dayRouteLink([{ lat: 1 }, { lng: 2 }])).toBeNull();
    expect(dayRouteLink([])).toBeNull();
    expect(dayRouteLink(null)).toBeNull();
    expect(dayRouteLink(undefined)).toBeNull();
  });

  it("rejects NaN and Infinity, which are numbers but not places", () => {
    expect(dayRouteLink([P(NaN, 2), P(3, 4)])).toBeNull();
    expect(dayRouteLink([P(Infinity, 2), P(3, 4)])).toBeNull();
  });
});
