// @protects-file The Tools screen's reminders are that trip's own, not another trip's.

import { describe, it, expect } from "vitest";
import { buildReminders, isBookingItem } from "../model/reminders";

describe("isBookingItem", () => {
  it("recognises the words a guide actually uses for securing something", () => {
    expect(isBookingItem("Reserve the ryokan")).toBe(true);
    expect(isBookingItem("Buy Shinkansen tickets")).toBe(true);
    expect(isBookingItem("Apply for the visa")).toBe(true);
    expect(isBookingItem("Book AHEAD — sells out")).toBe(true);
  });

  it("leaves packing-list items alone", () => {
    expect(isBookingItem("Pack a plug adapter")).toBe(false);
    expect(isBookingItem("Bring cash for the market")).toBe(false);
  });
});

describe("buildReminders", () => {
  it("collects section-level and per-day checklists into one list", () => {
    const items = buildReminders([
      { type: "panel", title: "Before you go", checklist: ["Pack a plug adapter"] },
      { type: "days", title: "The days", items: [{ date: "Thu Oct 15", title: "Arrival", checklist: ["Bring cash for the market"] }] },
    ]);
    expect(items.map((i) => i.text)).toEqual(["Pack a plug adapter", "Bring cash for the market"]);
    expect(items[1].from).toBe("Thu Oct 15 — Arrival");
  });

  it("puts booking items first and flags them", () => {
    const items = buildReminders([
      { title: "Before you go", checklist: ["Pack a plug adapter", "Reserve the ryokan"] },
    ]);
    expect(items.map((i) => i.text)).toEqual(["Reserve the ryokan", "Pack a plug adapter"]);
    expect(items[0].book).toBe(true);
    expect(items[1].book).toBe(false);
  });

  it("sorts dated booking items soonest first, ahead of undated ones", () => {
    const items = buildReminders([
      { title: "Plan", checklist: [
        { text: "Book the late thing", due: "2026-09-01", source_url: "https://example.com", verified_on: "2026-08-08" },
        "Reserve the undated thing",
        { text: "Book the early thing", due: "2026-07-01", source_url: "https://example.com", verified_on: "2026-08-08" },
      ] },
    ]);
    expect(items.map((i) => i.text)).toEqual([
      "Book the early thing", "Book the late thing", "Reserve the undated thing",
    ]);
  });

  it("carries a due date's provenance rather than restating a bare date", () => {
    const [item] = buildReminders([
      { title: "Plan", checklist: [
        { text: "Buy MSI tickets", due: "2026-06-01", note: "≈$45 fee", source_url: "https://example.com/t", verified_on: "2026-08-08" },
      ] },
    ]);
    expect(item.due).toBe("2026-06-01");
    expect(item.sourceUrl).toBe("https://example.com/t");
    expect(item.verifiedOn).toBe("2026-08-08");
    expect(item.note).toBe("≈$45 fee");
  });

  it("shows an instruction once when a section and its day both carry it", () => {
    const items = buildReminders([
      { title: "Before you go", checklist: ["Reserve the ryokan"] },
      { type: "days", items: [{ date: "Thu Oct 15", title: "Arrival", checklist: ["Reserve the ryokan"] }] },
    ]);
    expect(items).toHaveLength(1);
  });

  it("gives two long items that share a 48-char prefix different ids", () => {
    const long = "Reserve the extremely well regarded riverside ryokan";
    const items = buildReminders([{ title: "Plan", checklist: [`${long} in Kyoto`, `${long} in Nara`] }]);
    expect(items).toHaveLength(2);
    expect(items[0].id).not.toBe(items[1].id);
  });

  it("survives malformed input instead of throwing", () => {
    expect(buildReminders(null)).toEqual([]);
    expect(buildReminders([null, {}, { checklist: ["", "  "] }] as never)).toEqual([]);
  });
});
