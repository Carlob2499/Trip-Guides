/* The guard that keeps geocoding honest.

   Places always returns its best guess, so "no result" is the rare failure and "confidently
   the wrong place" is the common one. A guide that silently pins a restaurant to a
   same-named business in another district is wrong in the way this repo's whole verification
   discipline exists to prevent — plausible, internally consistent, and undetectable by
   reading the guide. acceptMatch is what stands between the two, so it is tested harder than
   the rest of the script combined. */
import { describe, it, expect } from "vitest";
import { acceptMatch, buildQuery, normalizeName, pendingItems } from "../geocode-venues.mjs";

const ok = (name, lat = 37.5, lng = 127) => ({ name, lat, lng, place_id: "ChIJx" });

describe("normalizeName", () => {
  it("ignores case, accents and punctuation", () => {
    expect(normalizeName("Café  Nørrebro!")).toBe("cafe norrebro");
    expect(normalizeName("N Seoul Tower (Namsan)")).toBe("n seoul tower namsan");
  });
});

describe("buildQuery", () => {
  const ctx = { country: "South Korea", city: "Seoul" };

  it("prefers a written address — the strongest disambiguator the guide already holds", () => {
    expect(buildQuery({ name: "Tosokchon", address: "5 Jahamun-ro 5-gil", area: "Jongno" }, ctx))
      .toBe("Tosokchon, 5 Jahamun-ro 5-gil");
  });

  it("falls back through area, then city, then country", () => {
    expect(buildQuery({ name: "Tosokchon", area: "Jongno" }, ctx)).toBe("Tosokchon, Jongno");
    expect(buildQuery({ name: "Tosokchon" }, ctx)).toBe("Tosokchon, Seoul");
    expect(buildQuery({ name: "Tosokchon" }, { country: "South Korea" })).toBe("Tosokchon, South Korea");
  });

  it("sends the bare name when the guide offers no context at all", () => {
    expect(buildQuery({ name: "Tosokchon" }, {})).toBe("Tosokchon");
  });
});

describe("acceptMatch", () => {
  it("accepts an exact match", () => {
    expect(acceptMatch({ name: "Tosokchon" }, ok("Tosokchon")).ok).toBe(true);
  });

  it("accepts a longer official name containing the guide's name", () => {
    // The common, benign case: guides write the short name people say out loud.
    expect(acceptMatch({ name: "Gyeongbokgung" }, ok("Gyeongbokgung Palace")).ok).toBe(true);
  });

  it("accepts word-order and article differences via token overlap", () => {
    expect(acceptMatch({ name: "The Round Tower" }, ok("Round Tower Copenhagen")).ok).toBe(true);
  });

  it("REJECTS a substitution — the failure that would ship a wrong coordinate", () => {
    const v = acceptMatch({ name: "Melody House" }, ok("Melody Cafe"));
    expect(v.ok).toBe(false);
    expect(v.why).toMatch(/name mismatch/);
  });

  it("rejects a result with no coordinates rather than writing a partial record", () => {
    expect(acceptMatch({ name: "X" }, { name: "X", lat: null, lng: null }).ok).toBe(false);
  });

  it("rejects lookup errors and not-founds, carrying the reason through", () => {
    expect(acceptMatch({ name: "X" }, { error: "PLACES_API_KEY not set" }))
      .toMatchObject({ ok: false, why: "PLACES_API_KEY not set" });
    expect(acceptMatch({ name: "X" }, { notFound: true }).ok).toBe(false);
    expect(acceptMatch({ name: "X" }, null).ok).toBe(false);
  });

  it("does not accept on short-word overlap alone", () => {
    // "the" / "bar" style noise must not carry a match; tokens under 3 chars are ignored.
    expect(acceptMatch({ name: "Bar Cham" }, ok("Bar Pimm")).ok).toBe(false);
  });
});

describe("pendingItems", () => {
  const files = [{
    file: "05-sights.json",
    json: {
      0: { type: "sights", group: "Sights", items: [
        { name: "Complete", map: { lat: 1, lng: 2 }, place_id: "ChIJ" },   // skipped
        { name: "Needs both" },
        { name: "Has coords only", map: { lat: 1, lng: 2 } },
      ]},
      1: { type: "prose", body: "not a place section" },
    },
  }];

  it("returns only items still missing something, and says which", () => {
    const p = pendingItems(files);
    expect(p.map((r) => r.item.name)).toEqual(["Needs both", "Has coords only"]);
    expect(p[0]).toMatchObject({ needsCoords: true, needsId: true });
    expect(p[1]).toMatchObject({ needsCoords: false, needsId: true });
  });

  it("ignores sections that do not describe places", () => {
    expect(pendingItems(files).every((r) => r.sec.type === "sights")).toBe(true);
  });
});

/* Nordic letters are NOT accented Latin — ø, æ and å survive NFKD intact and were being
   stripped as punctuation, so "Nørrebro" normalized to "n rrebro" and failed to match itself.
   Denmark's guide is full of them; this is the regression that caught it. */
describe("normalizeName — non-decomposing letters", () => {
  it("folds Nordic letters instead of shredding the word", () => {
    expect(normalizeName("Nørrebro")).toBe("norrebro");
    expect(normalizeName("Rådhuspladsen")).toBe("radhuspladsen");
    expect(normalizeName("Æbleskiver")).toBe("aebleskiver");
  });

  it("lets a Danish venue match itself", () => {
    expect(acceptMatch({ name: "Kødbyens Fiskebar" }, ok("Kødbyens Fiskebar")).ok).toBe(true);
  });
});
