import { describe, it, expect } from "vitest";
import { atWidth, srcsetFor } from "./img-width";

const COMMONS = "https://commons.wikimedia.org/wiki/Special:FilePath/Nyhavn-Copenhagen.JPG";

describe("atWidth", () => {
  it("asks Commons for a server-rendered thumbnail", () => {
    expect(atWidth(COMMONS, 112)).toBe(`${COMMONS}?width=112`);
  });

  it("substitutes a direct CDN URL's own {w} token, everywhere it appears", () => {
    expect(atWidth("https://cdn.example/{w}/pic-{w}.jpg", 224)).toBe("https://cdn.example/224/pic-224.jpg");
  });

  it("leaves a single-size URL alone rather than inventing a parameter for it", () => {
    const plain = "https://cdn.example/pic.jpg";
    expect(atWidth(plain, 112)).toBe(plain);
  });

  it("does not append a second width when the caller already set one", () => {
    expect(atWidth(`${COMMONS}?width=800`, 112)).toBe(`${COMMONS}?width=800`);
  });

  it("joins with & when the URL already carries a query", () => {
    expect(atWidth(`${COMMONS}?foo=1`, 112)).toBe(`${COMMONS}?foo=1&width=112`);
  });

  it("rounds a fractional width — the endpoint takes integers", () => {
    expect(atWidth(COMMONS, 112.6)).toBe(`${COMMONS}?width=113`);
  });

  it("passes null/undefined straight through", () => {
    expect(atWidth(null, 112)).toBeNull();
    expect(atWidth(undefined, 112)).toBeNull();
    expect(atWidth("", 112)).toBeNull();
  });
});

describe("srcsetFor", () => {
  it("offers 1x and 2x for a resizable URL", () => {
    expect(srcsetFor(COMMONS, 56)).toBe(`${COMMONS}?width=56 1x, ${COMMONS}?width=112 2x`);
  });

  it("returns null when the URL already pins a width — both entries would be the same file", () => {
    expect(srcsetFor(`${COMMONS}?width=800`, 56)).toBeNull();
  });

  it("returns null for a single-size URL — a srcset of one size is a lie about choice", () => {
    expect(srcsetFor("https://cdn.example/pic.jpg", 56)).toBeNull();
    expect(srcsetFor(null, 56)).toBeNull();
  });
});
