import { describe, it, expect } from "vitest";
import { splitLead, moreDetailLabel } from "./lead-split";

describe("splitLead", () => {
  it("keeps short bodies whole", () => {
    const r = splitLead("<p>One line.</p><p>Short tail.</p>");
    expect(r.more).toBeNull();
    expect(r.lead).toContain("Short tail");
  });
  it("splits at the first paragraph when the remainder is substantial", () => {
    const tail = "<p>" + "Long verified detail. ".repeat(20) + "</p>";
    const r = splitLead("<p>The lead sentence.</p>" + tail);
    expect(r.lead).toBe("<p>The lead sentence.</p>");
    expect(r.more).toContain("Long verified detail");
    expect(r.moreParagraphCount).toBe(1);
    expect(r.morePreview).toContain("Long verified detail");
  });
  it("never drops content — lead + more re-compose the body", () => {
    const tail = "<p>" + "Long verified detail with plenty of prose to cross the threshold. ".repeat(6) + "</p>";
    const body = "<p>Lead.</p>" + tail;
    const r = splitLead(body);
    expect((r.lead + (r.more || "")).replace(/\s+/g, "")).toBe(body.replace(/\s+/g, ""));
  });
  it("handles empty/undefined", () => {
    expect(splitLead(undefined).more).toBeNull();
    expect(splitLead("").lead).toBe("");
  });

  // M4/creator priority: a fold must never hide a warning or an operational procedure —
  // the site's Honest property applies to layout, not just to content.
  it("refuses to fold a remainder carrying a ⚠ flag — shows everything instead", () => {
    const tail = "<p>" + "Verified detail with enough prose to pass the length threshold easily here. ".repeat(6) + "⚠ Hours unconfirmed for this season.</p>";
    const body = "<p>Lead.</p>" + tail;
    const r = splitLead(body);
    expect(r.more).toBeNull();
    expect(r.lead).toBe(body);
  });
  it("refuses to fold a remainder carrying a <ul> (steps) — shows everything instead", () => {
    const tail = "<ul>" + "<li>Item with plenty of text to cross the threshold easily.</li>".repeat(8) + "</ul>";
    const body = "<p>Lead.</p>" + tail;
    const r = splitLead(body);
    expect(r.more).toBeNull();
    expect(r.lead).toBe(body);
  });
  it("refuses to fold a remainder carrying an <ol> (numbered procedure)", () => {
    const tail = "<ol>" + "<li>Step with plenty of text to cross the threshold easily here.</li>".repeat(8) + "</ol>";
    const body = "<p>Lead.</p>" + tail;
    const r = splitLead(body);
    expect(r.more).toBeNull();
  });

  // `fold: false` — the maker's veto for remainders that are operational in a way no regex can
  // see (an embassy's 24/7 line, a 24-hour pharmacy's night bell, a fine). Without it, those
  // fold silently, which is how a guide hides its emergency numbers one tap deep.
  it("fold:false vetoes a split that would otherwise happen", () => {
    const body = "<p>Emergencies: dial 119.</p><p>" + "US Embassy Seoul, emergency line, open around the clock. ".repeat(8) + "</p>";
    const folded = splitLead(body);
    expect(folded.more).not.toBeNull(); // control: this body DOES fold by default

    const r = splitLead(body, false);
    expect(r.more).toBeNull();
    expect(r.lead).toBe(body);
    expect(r.morePreview).toBe("");
    expect(r.moreParagraphCount).toBe(0);
  });

  it("leaves folding untouched when fold is undefined or true (veto only, never a force)", () => {
    const body = "<p>Lead.</p><p>" + "Ordinary secondary prose that comfortably clears the threshold. ".repeat(6) + "</p>";
    expect(splitLead(body, undefined).more).not.toBeNull();
    expect(splitLead(body, true).more).not.toBeNull();
    // …and a short body still never folds, flag or no flag.
    expect(splitLead("<p>Lead.</p><p>Too short.</p>", true).more).toBeNull();
  });
});

describe("moreDetailLabel", () => {
  it("uses a custom label verbatim, no count suffix", () => {
    expect(moreDetailLabel("Ticketing fine print", 3)).toBe("Ticketing fine print");
  });
  it("falls back to an honest computed count when unlabeled", () => {
    expect(moreDetailLabel(undefined, 2)).toBe("More detail · 2 more paragraphs");
    expect(moreDetailLabel(null, 1)).toBe("More detail · 1 more paragraph");
  });
  it("drops the count when it can't be computed (0)", () => {
    expect(moreDetailLabel(undefined, 0)).toBe("More detail");
  });
});
