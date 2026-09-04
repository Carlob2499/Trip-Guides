// @protects-file The fallback embed is built from numbers, never from page text.
import { describe, it, expect } from "vitest";
import { osmEmbedUrl } from "./map-embed";

describe("osmEmbedUrl", () => {
  it("frames the pins with padding and marks the first", () => {
    const url = osmEmbedUrl([{ lat: 37.58, lng: 126.98 }, { lat: 37.55, lng: 127.0 }])!;
    expect(url.startsWith("https://www.openstreetmap.org/export/embed.html?bbox=")).toBe(true);
    expect(url).toContain("marker=37.58%2C126.98");
  });
  it("is null with nothing to frame and ignores unlocated pins", () => {
    expect(osmEmbedUrl([])).toBeNull();
    expect(osmEmbedUrl([{ lat: null, lng: null }])).toBeNull();
    expect(osmEmbedUrl([{ lat: "x" as unknown as number, lng: 1 }, { lat: 1, lng: 2 }])).toContain("marker=1%2C2");
  });
});
