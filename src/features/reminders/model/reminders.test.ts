import { describe, it, expect } from "vitest";
import { buildReminder, inferKind, sortReminders } from "./reminders";

describe("inferKind", () => {
  it("reads a URL as a link", () => {
    expect(inferKind("https://airbnb.com/rooms/123")).toBe("link");
    expect(inferKind("www.naver.com")).toBe("link");
  });

  it("reads a clock time as a time", () => {
    expect(inferKind("Meet 8:30 at Exit 5")).toBe("time");
    expect(inferKind("21:15 dinner")).toBe("time");
    expect(inferKind("meet at 9pm")).toBe("time");
  });

  it("reads a short alphanumeric token with a digit as a code", () => {
    expect(inferKind("4821")).toBe("code");
    expect(inferKind("B12-9X")).toBe("code");
  });

  it("does NOT mistake a door code for a time (no clock punctuation)", () => {
    expect(inferKind("4821")).not.toBe("time");
  });

  it("prefers link over code/time when the text is a URL containing digits", () => {
    expect(inferKind("https://x.com/a1b2")).toBe("link");
  });

  it("falls back to a plain note", () => {
    expect(inferKind("bring an umbrella")).toBe("note");
    expect(inferKind("")).toBe("note");
  });
});

describe("buildReminder", () => {
  it("rejects an empty body", () => {
    expect(buildReminder({})).toBeNull();
    expect(buildReminder({ text: "   " })).toBeNull();
    expect(buildReminder({ label: "Airbnb", text: "" })).toBeNull();
  });

  it("keeps the label + trims, and infers the kind", () => {
    const r = buildReminder({ label: "  Airbnb door  ", text: "  4821  " })!;
    expect(r.label).toBe("Airbnb door");
    expect(r.text).toBe("4821");
    expect(r.kind).toBe("code");
    expect(r.pinned).toBe(false);
  });

  it("honours an explicit valid kind over inference", () => {
    expect(buildReminder({ text: "4821", kind: "note" })!.kind).toBe("note");
  });

  it("ignores a bogus kind and infers instead", () => {
    expect(buildReminder({ text: "4821", kind: "banana" })!.kind).toBe("code");
  });

  it("caps runaway text/label", () => {
    const r = buildReminder({ text: "x".repeat(900), label: "y".repeat(200) })!;
    expect(r.text.length).toBe(500);
    expect(r.label.length).toBe(60);
  });

  it("coerces pinned to a real boolean", () => {
    expect(buildReminder({ text: "a", pinned: 1 })!.pinned).toBe(true);
    expect(buildReminder({ text: "a" })!.pinned).toBe(false);
  });
});

describe("sortReminders", () => {
  it("puts pinned first, then newest — a pin never sinks below a later note", () => {
    const out = sortReminders([
      { id: "old", createdAt: 1, pinned: false },
      { id: "new", createdAt: 9, pinned: false },
      { id: "pin", createdAt: 2, pinned: true },
    ]);
    expect(out.map((x: any) => x.id)).toEqual(["pin", "new", "old"]);
  });

  it("orders multiple pins newest-first among themselves", () => {
    const out = sortReminders([
      { id: "p1", createdAt: 1, pinned: true },
      { id: "p2", createdAt: 5, pinned: true },
    ]);
    expect(out.map((x: any) => x.id)).toEqual(["p2", "p1"]);
  });

  it("does not mutate the input and survives empty/missing fields", () => {
    const src = [{ id: "a" }, { id: "b" }];
    const out = sortReminders(src as any);
    expect(src.map((x: any) => x.id)).toEqual(["a", "b"]);
    expect(out).toHaveLength(2);
    expect(sortReminders([])).toEqual([]);
  });
});

/* The mocks are the contract for what a room record looks like. If the stored shape or the
   kind inference drifts from these seeds, this fails before any device ever syncs bad data. */
import seeds from "../mocks/reminders.sample.json";

describe("mocks/reminders.sample.json — real-shaped room records", () => {
  const records = Object.values(seeds as Record<string, any>);

  it("every seed carries the full stored shape (model fields + sync-added fields)", () => {
    expect(records.length).toBeGreaterThan(0);
    for (const r of records) {
      expect(typeof r.label).toBe("string");
      expect(typeof r.text).toBe("string");
      expect(["note", "code", "time", "link"]).toContain(r.kind);
      expect(typeof r.pinned).toBe("boolean");
      expect(typeof r.createdAt).toBe("number"); // set by the sync layer
      expect(typeof r.createdBy).toBe("string"); // set by the sync layer
    }
  });

  it("each seed's stored kind matches what inferKind derives from its text", () => {
    for (const r of records) expect(r.kind).toBe(inferKind(r.text));
  });

  it("buildReminder round-trips each seed's authorable fields unchanged", () => {
    for (const r of records) {
      const built = buildReminder({ text: r.text, label: r.label, pinned: r.pinned });
      expect(built).toEqual({ label: r.label, text: r.text, kind: r.kind, pinned: r.pinned });
    }
  });
});
