// Tests for scripts/lookup-venue.mjs — the venue → operating-truth verifier that keeps
// "is it still open" and posted hours out of the language model's hands (the MangoPlate
// class of defect). Two things are worth guarding here and both are cheap:
//
//  1. THE FIELD MASK IS THE BILL. Google charges per SKU tier touched, and the caps differ
//     by an order of magnitude (Essentials 10,000/mo · Pro 5,000 · Enterprise 1,000). A
//     field quietly moved between the tier arrays would silently spend the scarcest budget
//     on every lookup, and nothing at runtime would complain. These tests pin the mask.
//  2. It must NEVER throw. Every caller is a research agent mid-pass; a rejected promise
//     there kills a stage, so a missing key / HTTP error / dead network must all come back
//     as data.
//
// Zero network: the fetch seam is injected, exactly as verify-live.test.mjs does.

// @protects-file Venue details are taken from the source, never filled in from memory.

import { describe, it, expect } from "vitest";
import { lookupVenue, fieldMaskFor, skusFor, normalizePlace, CHECKS } from "../lookup-venue.mjs";

const okResponse = (payload) => ({ ok: true, status: 200, json: async () => payload });
const errResponse = (status, text = "") => ({ ok: false, status, text: async () => text });

// A realistic Places (New) searchText payload for --check hours.
const PLACE = {
  id: "ChIJtestplaceid",
  displayName: { text: "Daruma", languageCode: "ja" },
  formattedAddress: "2-3-1 Nakasu, Hakata Ward, Fukuoka",
  location: { latitude: 33.5934, longitude: 130.4048 },
  types: ["restaurant", "food"],
  businessStatus: "OPERATIONAL",
  regularOpeningHours: {
    openNow: true,
    weekdayDescriptions: ["Monday: 11:00 AM – 9:00 PM", "Tuesday: Closed"],
  },
  nationalPhoneNumber: "092-123-4567",
  websiteUri: "https://example-daruma.jp/",
};

describe("field mask — the cost knob (pinned deliberately)", () => {
  it("status check asks for Essentials + Pro only, never an Enterprise field", () => {
    const mask = fieldMaskFor("status");
    expect(mask).toContain("places.formattedAddress"); // Essentials
    expect(mask).toContain("places.businessStatus"); // Pro — the dead-venue check
    // The three Enterprise fields cost 5x the headroom; they must be absent here.
    expect(mask).not.toContain("regularOpeningHours");
    expect(mask).not.toContain("nationalPhoneNumber");
    expect(mask).not.toContain("websiteUri");
  });

  it("hours check adds the Enterprise fields", () => {
    const mask = fieldMaskFor("hours");
    expect(mask).toContain("places.businessStatus");
    expect(mask).toContain("places.regularOpeningHours");
    expect(mask).toContain("places.websiteUri");
  });

  it("an unknown check falls back to the cheap mask, never the expensive one", () => {
    expect(fieldMaskFor("nonsense")).toBe(fieldMaskFor("status"));
  });

  it("reports which SKUs each check bills, so a run can account for what it spent", () => {
    expect(skusFor("status")).toEqual(["Essentials", "Pro"]);
    expect(skusFor("hours")).toEqual(["Essentials", "Pro", "Enterprise"]);
  });

  it("exposes exactly the two supported checks", () => {
    expect(CHECKS).toEqual(["status", "hours"]);
  });
});

describe("normalizePlace (pure)", () => {
  it("flattens a hours-check place into the shape a guide fact wants", () => {
    const r = normalizePlace(PLACE, "hours", "Daruma, Fukuoka", "2026-08-02");
    expect(r.name).toBe("Daruma");
    expect(r.address).toBe("2-3-1 Nakasu, Hakata Ward, Fukuoka");
    expect(r.lat).toBeCloseTo(33.5934);
    expect(r.lng).toBeCloseTo(130.4048);
    expect(r.business_status).toBe("OPERATIONAL");
    expect(r.still_operating).toBe(true);
    expect(r.hours).toHaveLength(2);
    expect(r.verified_on).toBe("2026-08-02");
    // The venue's own site is the T0 citation the fact should carry.
    expect(r.source_url).toBe("https://example-daruma.jp/");
  });

  it("turns a permanently-closed venue into still_operating:false — the whole point", () => {
    const dead = { ...PLACE, businessStatus: "CLOSED_PERMANENTLY" };
    const r = normalizePlace(dead, "status", "MangoPlate pick", "2026-08-02");
    expect(r.still_operating).toBe(false);
    expect(r.business_status).toBe("CLOSED_PERMANENTLY");
  });

  it("distinguishes 'not returned' from 'closed' — an absent status is null, not false", () => {
    const { businessStatus: _drop, ...noStatus } = PLACE;
    const r = normalizePlace(noStatus, "status", "q", "2026-08-02");
    expect(r.still_operating).toBeNull();
    expect(r.business_status).toBeNull();
  });

  it("omits hours fields entirely on a status check, so callers can't read stale blanks as data", () => {
    const r = normalizePlace(PLACE, "status", "q", "2026-08-02");
    expect(r).not.toHaveProperty("hours");
    expect(r).not.toHaveProperty("source_url");
  });
});

describe("lookupVenue — never throws, always returns data", () => {
  it("returns a clean error when no key is configured (inert until configured)", async () => {
    const r = await lookupVenue("anything", { apiKey: "", fetch: () => { throw new Error("must not be called"); } });
    expect(r.error).toMatch(/PLACES_API_KEY not set/);
  });

  it("rejects an empty query without spending a call", async () => {
    let called = false;
    const r = await lookupVenue("   ", { apiKey: "k", fetch: () => { called = true; } });
    expect(r.error).toBe("empty query");
    expect(called).toBe(false);
  });

  it("surfaces Google's own reason on an HTTP error instead of throwing", async () => {
    const r = await lookupVenue("x", {
      apiKey: "k",
      fetch: async () => errResponse(403, '{ "error": { "message": "Places API has not been used" } }'),
    });
    expect(r.error).toMatch(/^Places HTTP 403/);
    expect(r.error).toMatch(/has not been used/);
  });

  it("never leaks the api key into an error string", async () => {
    const r = await lookupVenue("x", {
      apiKey: "SUPER-SECRET-KEY",
      fetch: async () => errResponse(400, "bad request"),
    });
    expect(JSON.stringify(r)).not.toContain("SUPER-SECRET-KEY");
  });

  it("turns a thrown network failure into an error result", async () => {
    const r = await lookupVenue("x", {
      apiKey: "k",
      fetch: async () => { throw new Error("ENOTFOUND"); },
    });
    expect(r.error).toMatch(/ENOTFOUND/);
  });

  it("reports notFound for an empty result set", async () => {
    const r = await lookupVenue("nowhere", { apiKey: "k", fetch: async () => okResponse({ places: [] }) });
    expect(r.notFound).toBe(true);
  });

  it("sends the key and mask as headers, and the query as a POST body", async () => {
    let seen = null;
    await lookupVenue("Daruma, Fukuoka", {
      apiKey: "k",
      cc: "Japan", // a country NAME must resolve to a region code
      check: "hours",
      today: "2026-08-02",
      fetch: async (url, init) => { seen = { url, init }; return okResponse({ places: [PLACE] }); },
    });
    expect(seen.url).toBe("https://places.googleapis.com/v1/places:searchText");
    expect(seen.init.method).toBe("POST");
    expect(seen.init.headers["x-goog-api-key"]).toBe("k");
    expect(seen.init.headers["x-goog-fieldmask"]).toBe(fieldMaskFor("hours"));
    const body = JSON.parse(seen.init.body);
    expect(body.textQuery).toBe("Daruma, Fukuoka");
    expect(body.regionCode).toBe("JP");
  });

  it("returns the normalized place on success", async () => {
    const r = await lookupVenue("Daruma", {
      apiKey: "k",
      check: "hours",
      today: "2026-08-02",
      fetch: async () => okResponse({ places: [PLACE] }),
    });
    expect(r.still_operating).toBe(true);
    expect(r.skus_billed).toEqual(["Essentials", "Pro", "Enterprise"]);
    expect(r.verified_on).toBe("2026-08-02");
  });
});
