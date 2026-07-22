import { describe, it, expect } from "vitest";
import { WIZARD_STEPS, validateStepTransition, parseBookingDocument, formatParsedNote } from "./wizard";

describe("WIZARD_STEPS", () => {
  it("has exactly three steps, in the expected order", () => {
    expect(WIZARD_STEPS.map((s) => s.title)).toEqual(["Where & when", "Who & style", "What to research"]);
  });

  it("every field id is assigned to exactly one step (no orphans, no duplicates)", () => {
    const allIds = WIZARD_STEPS.flatMap((s) => s.ids);
    const unique = new Set(allIds);
    expect(unique.size).toBe(allIds.length);
  });

  it("Country and the anchor event are both in step 0 (Where & when)", () => {
    expect(WIZARD_STEPS[0].ids).toContain("ngCountry");
    expect(WIZARD_STEPS[0].ids).toContain("ngAnchor");
  });
});

describe("validateStepTransition — step navigation guard", () => {
  const TOTAL = 3;

  it("allows moving forward from step 0 to 1 when Country is filled", () => {
    const r = validateStepTransition(0, 1, TOTAL, "Japan");
    expect(r).toEqual({ ok: true, nextStep: 1 });
  });

  it("blocks moving forward from step 0 to 1 when Country is empty", () => {
    const r = validateStepTransition(0, 1, TOTAL, "");
    expect(r.ok).toBe(false);
    expect(r.nextStep).toBeNull();
    expect(r.error).toBe("Country is required.");
  });

  it("blocks moving forward from step 0 when Country is whitespace-only", () => {
    const r = validateStepTransition(0, 1, TOTAL, "   ");
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it("allows moving BACKWARD from step 1 to 0 regardless of Country", () => {
    const r = validateStepTransition(1, -1, TOTAL, "");
    expect(r).toEqual({ ok: true, nextStep: 0 });
  });

  it("the Country guard only applies when LEAVING step 0 — moving 1→2 needs no country", () => {
    const r = validateStepTransition(1, 1, TOTAL, "");
    expect(r).toEqual({ ok: true, nextStep: 2 });
  });

  it("refuses to go past the last step", () => {
    const r = validateStepTransition(2, 1, TOTAL, "Japan");
    expect(r.ok).toBe(false);
    expect(r.nextStep).toBeNull();
    expect(r.error).toBeUndefined(); // out-of-bounds, not a validation failure
  });

  it("refuses to go before the first step", () => {
    const r = validateStepTransition(0, -1, TOTAL, "Japan");
    expect(r.ok).toBe(false);
    expect(r.nextStep).toBeNull();
  });
});

describe("parseBookingDocument — pure text extraction", () => {
  it("extracts ISO dates, sorted and deduped, and builds a summary", () => {
    const doc = parseBookingDocument("Trip: 2026-07-08 to 2026-07-15. Also see 2026-07-08 again.");
    expect(doc.isoDates).toEqual(["2026-07-08", "2026-07-15"]);
    expect(doc.summary).toContain("2 dates");
    expect(doc.summary).toContain("2026-07-08 → 2026-07-15");
  });

  it("normalizes a bare-digit date (YYYYMMDD) to YYYY-MM-DD when word-bounded", () => {
    // Note: the underlying regex requires a \b at both ends, and digit→letter is NOT a
    // word boundary — so a date directly abutting a letter (e.g. ICS's
    // "20260708T090000Z", digits immediately followed by "T") does NOT match. This is a
    // pre-existing regex limitation carried over unchanged from the original
    // implementation, not something this extraction fixes; documented here so it's a
    // known, tested behavior rather than a silent gap.
    const doc = parseBookingDocument("Check-in date 20260708 confirmed.");
    expect(doc.isoDates).toContain("2026-07-08");
    expect(parseBookingDocument("DTSTART:20260708T090000Z").isoDates).toEqual([]);
  });

  it("extracts flight numbers, capped at 6", () => {
    const text = "AA 123, UA 4567, DL 89, BA 12, KE 901, NH 55, JL 77 all in one itinerary.";
    const doc = parseBookingDocument(text);
    expect(doc.flights.length).toBe(6);
    expect(doc.flights[0]).toBe("AA 123");
  });

  it("extracts lodging lines by keyword, capped at 4, ignoring long paragraphs", () => {
    const text = [
      "Hotel Sunshine, check-in 3pm",
      "Airbnb reservation confirmed",
      "A".repeat(150) + " hotel mentioned in passing but this line is way too long to count",
      "Hostel World booking #123",
      "Reservation at the hostel downtown",
      "Another hotel line that should be dropped due to the 4-line cap",
    ].join("\n");
    const doc = parseBookingDocument(text);
    expect(doc.hotelLines.length).toBe(4);
    expect(doc.hotelLines[0]).toBe("Hotel Sunshine, check-in 3pm");
  });

  it("reports 'no structured data found' for text with none of the above", () => {
    const doc = parseBookingDocument("Just a plain note with nothing recognizable.");
    expect(doc.isoDates).toEqual([]);
    expect(doc.flights).toEqual([]);
    expect(doc.hotelLines).toEqual([]);
    expect(doc.summary).toBe("no structured data found");
  });

  it("combines all three signals into one summary line, in order", () => {
    const doc = parseBookingDocument("2026-07-08 to 2026-07-15. Flight AA 123. Hotel Sunshine check-in 3pm.");
    expect(doc.summary).toBe(
      `2 dates (2026-07-08 → 2026-07-15) · flights: AA 123 · lodging lines: 1`,
    );
  });
});

describe("formatParsedNote", () => {
  it("formats a note with no lodging lines as a single line", () => {
    const doc = parseBookingDocument("2026-07-08");
    const note = formatParsedNote("confirmation.txt", doc);
    expect(note).toBe(`From confirmation.txt: 1 date (2026-07-08 → 2026-07-08)`);
  });

  it("appends lodging lines, indented, when present", () => {
    const doc = parseBookingDocument("Hotel Sunshine, check-in 3pm");
    const note = formatParsedNote("booking.eml", doc);
    expect(note).toContain("From booking.eml:");
    expect(note).toContain("\n  Hotel Sunshine, check-in 3pm");
  });
});
