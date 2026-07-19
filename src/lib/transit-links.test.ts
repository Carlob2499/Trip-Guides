import { describe, it, expect } from "vitest";
import { universalTransitLinks, nativeTransitLinks, transitLinks } from "./transit-links";

describe("universalTransitLinks", () => {
  it("builds Google Maps + Apple Maps directions links from lat/lng", () => {
    const links = universalTransitLinks(37.5796, 126.977);
    expect(links).toHaveLength(2);
    expect(links[0].label).toBe("Google Maps");
    expect(links[0].href).toBe("https://www.google.com/maps/dir/?api=1&destination=37.5796,126.977&travelmode=walking");
    expect(links[1].label).toBe("Apple Maps");
    expect(links[1].href).toBe("https://maps.apple.com/directions?destination=37.5796,126.977&mode=walking");
  });

  it("appends destination_place_id to the Google link when a place_id is given", () => {
    const links = universalTransitLinks(37.5796, 126.977, "ChIJ_test123");
    expect(links[0].href).toContain("destination_place_id=ChIJ_test123");
  });

  it("omits destination_place_id when no place_id is given", () => {
    const links = universalTransitLinks(37.5796, 126.977, null);
    expect(links[0].href).not.toContain("destination_place_id");
  });
});

describe("nativeTransitLinks", () => {
  it("returns Naver Map for South Korea with the confirmed nmap:// scheme", () => {
    const links = nativeTransitLinks("South Korea", 37.5796, 126.977, "Gyeongbokgung Palace", "https://carlob2499.github.io/Trip-Guides");
    expect(links).toHaveLength(1);
    expect(links[0].label).toBe("Naver Map");
    expect(links[0].href).toBe(
      "nmap://route/walk?dlat=37.5796&dlng=126.977&dname=Gyeongbokgung%20Palace&appname=https%3A%2F%2Fcarlob2499.github.io%2FTrip-Guides"
    );
  });

  it("returns an empty array for a country with no confirmed native scheme", () => {
    expect(nativeTransitLinks("Denmark", 55.6761, 12.5683, "Nyhavn", "https://example.com")).toEqual([]);
    expect(nativeTransitLinks("Japan", 35.0, 139.0, "Tokyo Tower", "https://example.com")).toEqual([]);
  });

  it("never guesses Kakao Map — no entry exists for South Korea beyond Naver", () => {
    const links = nativeTransitLinks("South Korea", 37.5796, 126.977, "x", "https://example.com");
    expect(links.some((l) => /kakao/i.test(l.label))).toBe(false);
  });
});

describe("transitLinks", () => {
  it("orders universal links first, native apps last", () => {
    const links = transitLinks("South Korea", 37.5796, 126.977, "Palace", "place123", "https://example.com");
    expect(links.map((l) => l.label)).toEqual(["Google Maps", "Apple Maps", "Naver Map"]);
  });

  it("is just the universal pair for a country with no native app", () => {
    const links = transitLinks("Denmark", 55.6761, 12.5683, "Nyhavn", null, "https://example.com");
    expect(links.map((l) => l.label)).toEqual(["Google Maps", "Apple Maps"]);
  });
});
