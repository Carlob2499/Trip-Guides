// Tests for the structural venue gate (standard S1). Zero network — lookup is injected.
// The semantics under test are the wolf-crying boundaries: only CLOSED_PERMANENTLY blocks;
// fuzzy misses and temporary closures advise; a missing key or a full outage is n/a, never
// a silent pass or a spurious fail.

import { describe, it, expect } from "vitest";
import { checkVenueStatus, collectVenues, queryFor } from "../audit/check-venue-status.mjs";

const GUIDE = {
  country: "Japan",
  sections: [
    {
      type: "venues", group: "Food", title: "Ramen",
      items: [{ name: "Shin Shin", area: "Tenjin" }, { name: "Ganso Nagahamaya", area: "Nagahama" }],
    },
    { type: "map", title: "Orientation", points: [{ name: "Canal City" }] },
    { type: "sights", group: "Sights", items: [{ name: "A Palace" }] }, // deliberately not checked
    { type: "prose", group: "Plan", body: "<p>x</p>" },
  ],
};

const ok = (status) => async () => ({ business_status: status, name: "match", still_operating: status === "OPERATIONAL" });

describe("collectVenues", () => {
  it("collects venues items and named map points, not sights or prose", () => {
    const v = collectVenues(GUIDE);
    expect(v.map((x) => x.name)).toEqual(["Shin Shin", "Ganso Nagahamaya", "Canal City"]);
  });
  it("builds a scoped query", () => {
    expect(queryFor({ name: "Shin Shin", area: "Tenjin" }, "Japan")).toBe("Shin Shin, Tenjin, Japan");
    expect(queryFor({ name: "Canal City", area: null }, "Japan")).toBe("Canal City, Japan");
  });
});

describe("checkVenueStatus", () => {
  it("is n/a with no key — inert until configured, never a silent pass", async () => {
    const r = await checkVenueStatus(GUIDE, { apiKey: "", throttleMs: 0 });
    expect(r.status).toBe("n/a");
    expect(r.reason).toMatch(/PLACES_API_KEY/);
  });

  it("passes when everything is OPERATIONAL", async () => {
    const r = await checkVenueStatus(GUIDE, { apiKey: "k", throttleMs: 0, lookup: ok("OPERATIONAL") });
    expect(r.status).toBe("pass");
    expect(r.checked).toBe(3);
    expect(r.closed).toEqual([]);
  });

  it("BLOCKS on CLOSED_PERMANENTLY — the MangoPlate class", async () => {
    const lookup = async (q) => q.startsWith("Ganso")
      ? { business_status: "CLOSED_PERMANENTLY", name: "Ganso Nagahamaya" }
      : { business_status: "OPERATIONAL", name: "x" };
    const r = await checkVenueStatus(GUIDE, { apiKey: "k", throttleMs: 0, lookup });
    expect(r.status).toBe("fail");
    expect(r.closed).toHaveLength(1);
    expect(r.closed[0].name).toBe("Ganso Nagahamaya");
  });

  it("only ADVISES on notFound — a fuzzy query miss must not block a guide", async () => {
    const lookup = async (q) => q.startsWith("Canal") ? { notFound: true } : { business_status: "OPERATIONAL", name: "x" };
    const r = await checkVenueStatus(GUIDE, { apiKey: "k", throttleMs: 0, lookup });
    expect(r.status).toBe("pass");
    expect(r.flagged).toHaveLength(1);
    expect(r.flagged[0].why).toMatch(/no Places match/);
  });

  it("only ADVISES on CLOSED_TEMPORARILY", async () => {
    const r = await checkVenueStatus(GUIDE, { apiKey: "k", throttleMs: 0, lookup: ok("CLOSED_TEMPORARILY") });
    expect(r.status).toBe("pass");
    expect(r.flagged).toHaveLength(3);
  });

  it("treats a full outage as n/a, not a clean bill — fail-closed like the link checker", async () => {
    const r = await checkVenueStatus(GUIDE, { apiKey: "k", throttleMs: 0, lookup: async () => ({ error: "Places HTTP 500" }) });
    expect(r.status).toBe("n/a");
    expect(r.reason).toMatch(/all 3 Places calls failed/);
  });

  it("a single API error skips that venue without inventing a finding", async () => {
    const lookup = async (q) => q.startsWith("Shin") ? { error: "Places HTTP 500" } : { business_status: "OPERATIONAL", name: "x" };
    const r = await checkVenueStatus(GUIDE, { apiKey: "k", throttleMs: 0, lookup });
    expect(r.status).toBe("pass");
    expect(r.checked).toBe(2);
  });

  it("passes trivially on a guide with no venues at all", async () => {
    const r = await checkVenueStatus({ country: "Japan", sections: [] }, { apiKey: "k", throttleMs: 0, lookup: ok("OPERATIONAL") });
    expect(r.status).toBe("pass");
    expect(r.checked).toBe(0);
  });
});
