/* The guard that keeps geocoding honest.

   Places always returns its best guess, so "no result" is the rare failure and "confidently
   the wrong place" is the common one. A guide that silently pins a restaurant to a
   same-named business in another district is wrong in the way this repo's whole verification
   discipline exists to prevent — plausible, internally consistent, and undetectable by
   reading the guide. acceptMatch is what stands between the two, so it is tested harder than
   the rest of the script combined. */
import { describe, it, expect } from "vitest";
import { acceptMatch, buildQuery, flagOutliers, haversineKm, isCategoryName, normalizeName, pendingItems } from "../geocode-venues.mjs";

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

/* THE GUARD NAME-MATCHING CANNOT PROVIDE — found on the first real Korea run, not by reasoning.
   "Konbini (7-Eleven, Lawson, FamilyMart)" in the Tokyo section resolved to Staten Island, New
   York, and "Gyudon chains (…)" to Osaka. Both passed acceptMatch, because a brand name DOES
   match a real store — somewhere on earth. Nothing had checked where. */
describe("isCategoryName", () => {
  it("refuses a class of thing that is, by design, everywhere", () => {
    expect(isCategoryName("Konbini (7-Eleven, Lawson, FamilyMart)")).toBe(true);
    expect(isCategoryName("Gyudon chains (Yoshinoya, Sukiya, Matsuya)")).toBe(true);
    expect(isCategoryName("Paris Baguette / Tous les Jours")).toBe(true);
    expect(isCategoryName("Convenience store (GS25 / CU)")).toBe(true);
  });

  it("leaves real venues alone, including parenthetical local-script names", () => {
    expect(isCategoryName("Ossi Kalguksu Doryong (오씨칼국수 도룡점)")).toBe(false);
    expect(isCategoryName("LoL Park (now CHZZK LoL Park)")).toBe(false);
    expect(isCategoryName("Gyeongbokgung")).toBe(false);
  });

  it("is enforced by acceptMatch before any name comparison", () => {
    const v = acceptMatch({ name: "Konbini (7-Eleven, Lawson, FamilyMart)" }, ok("Konbini", 40.6, -74.1));
    expect(v).toMatchObject({ ok: false, why: "reads as a category, not a single place" });
  });
});

describe("flagOutliers", () => {
  const at = (name, lat, lng) => ({ ok: true, item: { name }, res: { name, lat, lng } });
  // Nine real Tokyo results plus the two that escaped to Osaka and New York.
  const tokyo = [
    at("Shibuya Crossing", 35.65948, 139.70056), at("Shibuya Sky", 35.65867, 139.70198),
    at("Senso-ji", 35.71477, 139.79666), at("Meiji Jingu", 35.6764, 139.69933),
    at("teamLab", 35.64912, 139.78977), at("Uobei", 35.65943, 139.69792),
    at("Ichiran", 35.66112, 139.70098), at("Tsukiji", 35.66477, 139.77025),
    at("Omoide Yokocho", 35.6927, 139.69958),
  ];

  it("rejects a same-named place on another continent", () => {
    const out = flagOutliers([...tokyo, at("Konbini", 40.61211, -74.13287)]);
    const konbini = out.find((r) => r.item.name === "Konbini");
    expect(konbini.ok).toBe(false);
    expect(konbini.why).toMatch(/km from the rest of this file/);
  });

  it("rejects a same-named place in another city of the same country", () => {
    const out = flagOutliers([...tokyo, at("Gyudon", 34.66441, 135.5033)]);   // Osaka
    expect(out.find((r) => r.item.name === "Gyudon").ok).toBe(false);
  });

  it("keeps every genuine result in the file", () => {
    const out = flagOutliers([...tokyo, at("Konbini", 40.61211, -74.13287)]);
    expect(out.filter((r) => r.ok)).toHaveLength(tokyo.length);
  });

  it("declines to judge when there are too few results to establish a centre", () => {
    const two = [at("A", 35.6, 139.7), at("B", 40.6, -74.1)];
    expect(flagOutliers(two).every((r) => r.ok)).toBe(true);
  });

  it("leaves already-rejected rows untouched", () => {
    const rows = [...tokyo, { ok: false, item: { name: "X" }, why: "not found" }];
    expect(flagOutliers(rows).find((r) => r.item.name === "X").why).toBe("not found");
  });
});

describe("haversineKm", () => {
  it("measures the Tokyo→Osaka gap that motivated the check", () => {
    const km = haversineKm({ lat: 35.66, lng: 139.70 }, { lat: 34.664, lng: 135.503 });
    expect(km).toBeGreaterThan(380);
    expect(km).toBeLessThan(420);
  });
});
