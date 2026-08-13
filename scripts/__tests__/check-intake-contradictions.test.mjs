// Tests for scripts/audit/check-intake-contradictions.mjs (C2, docs/PLAN_EVIDENCE_FIRST.md):
// deterministic date/party/person contradiction extraction over an intake doc's full text.
//
// THE FALSE-POSITIVE GUARD IS THE POINT of this file, not an afterthought — A1 found that the
// plan's original framing of the Japan intake as a "birthday contradiction" was wrong: it is
// two travellers' two birthdays, correctly handled (fixture case 1a, a permanent negative
// test). Every real, shipped intake doc is asserted clean below, not just the fixture.

// @protects-file A genuine intake contradiction becomes a traveler question; a multi-traveller
// intake's normal per-person variation never does.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFile, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractDateRange, extractHeadcount,
  birthdayConflicts, dateRangeAmbiguity, anchorOutsideWindow, partySizeMismatch,
  checkIntakeContradictions, applyContradictions,
} from "../audit/check-intake-contradictions.mjs";

const FIXTURE_INTAKE = fileURLToPath(
  new URL("../../tests/fixtures/japan-regression/intake/japan.md", import.meta.url),
);

async function realIntake(slug) {
  const p = fileURLToPath(new URL(`../../guides-intake/${slug}.md`, import.meta.url));
  return readFile(p, "utf8");
}

describe("extractDateRange", () => {
  it("reads the pre-C1 'Exact dates (start–end):' bullet", () => {
    expect(extractDateRange("- Exact dates (start–end): 2026-10-15 – 2026-11-10")).toEqual({
      start: "2026-10-15", end: "2026-11-10",
    });
  });

  it("reads the C1 '**Dates (<certainty>):**' bullet", () => {
    expect(extractDateRange("- **Dates (target):** 2026-06-01 – 2026-06-10")).toEqual({
      start: "2026-06-01", end: "2026-06-10",
    });
  });

  it("returns nulls when no date bullet is present", () => {
    expect(extractDateRange("nothing here")).toEqual({ start: null, end: null });
  });
});

describe("birthdayConflicts", () => {
  it("does NOT flag two different possessive markers with different dates (the case 1a shape)", () => {
    const text = "His birthday is Sept 25. Traveler's own birthday, Oct 24, also falls inside the window.";
    expect(birthdayConflicts(text)).toEqual([]);
  });

  it("DOES flag the SAME marker used with two different dates", () => {
    const text = "His birthday is Sept 25. Later note: his birthday is actually Oct 3.";
    const found = birthdayConflicts(text);
    expect(found).toHaveLength(1);
    expect(found[0].marker).toBe("his");
    expect(found[0].dates).toEqual(["Sept 25", "Oct 3"]);
  });

  it("does not flag the same marker repeating the SAME date", () => {
    const text = "His birthday is Sept 25. As noted, his birthday (Sept 25) is before the trip.";
    expect(birthdayConflicts(text)).toEqual([]);
  });

  it("is silent when there is no birthday mention at all", () => {
    expect(birthdayConflicts("Nothing about birthdays here.")).toEqual([]);
  });
});

describe("dateRangeAmbiguity", () => {
  it("flags when the structured start matches ONE of two 'or'-joined dates", () => {
    const text = "the traveler is still narrowing (Oct 15 or Oct 22, both ending around Nov 10)";
    expect(dateRangeAmbiguity(text, "2026-10-15")).toEqual([{ committed: "Oct 15", other: "Oct 22" }]);
  });

  it("does not flag when neither side of the pair matches the structured start", () => {
    const text = "deciding between Oct 15 or Oct 22";
    expect(dateRangeAmbiguity(text, "2026-01-01")).toEqual([]);
  });

  it("does not flag when there is no 'or'-joined date pair", () => {
    expect(dateRangeAmbiguity("just a plain sentence", "2026-10-15")).toEqual([]);
  });

  it("returns nothing when no start date was extracted", () => {
    expect(dateRangeAmbiguity("Oct 15 or Oct 22", null)).toEqual([]);
  });
});

describe("anchorOutsideWindow", () => {
  it("is silent when the anchor's dated day falls inside the window", () => {
    const anchor = "Wild Area — Sendai, Nov 6–8 2026 (verify against the official source)";
    expect(anchorOutsideWindow(anchor, "2026-10-15", "2026-11-10")).toBeNull();
  });

  it("flags when the anchor's dated day falls outside the window", () => {
    const anchor = "Concert — Dec 25 2026";
    const r = anchorOutsideWindow(anchor, "2026-10-15", "2026-11-10");
    expect(r).not.toBeNull();
    expect(r.window).toBe("2026-10-15 – 2026-11-10");
  });

  it("does not guess when the anchor names no year", () => {
    const anchor = "Wild Area — Sendai, Nov 6–8 (exact year TBD)";
    expect(anchorOutsideWindow(anchor, "2026-10-15", "2026-11-10")).toBeNull();
  });

  it("does not fire when there is no anchor, or no window", () => {
    expect(anchorOutsideWindow(null, "2026-10-15", "2026-11-10")).toBeNull();
    expect(anchorOutsideWindow("Concert — Dec 25 2026", null, null)).toBeNull();
  });
});

describe("extractHeadcount + partySizeMismatch", () => {
  it("reads a leading number word ('Two 27-year-olds...')", () => {
    expect(extractHeadcount("Two 27-year-olds with closely matched tastes")).toBe(2);
  });

  it("reads 'single'/'solo' as 1", () => {
    expect(extractHeadcount("single traveler, 52F, first solo trip")).toBe(1);
  });

  it("reads 'family of N'", () => {
    expect(extractHeadcount("a family of 5 visiting grandparents")).toBe(5);
  });

  it("reads 'couple' as 2", () => {
    expect(extractHeadcount("a couple celebrating an anniversary")).toBe(2);
  });

  it("returns null when no headcount phrasing is recognized", () => {
    expect(extractHeadcount("Adventurous foodies who love hiking")).toBeNull();
  });

  it("flags when the named headcount disagrees with the structured travelers count", () => {
    expect(partySizeMismatch("Two of us are gaming fans", 3)).toEqual({ named: 2, stated: 3 });
  });

  it("does not flag when they agree", () => {
    expect(partySizeMismatch("Two 27-year-olds", 2)).toBeNull();
  });

  it("does not flag when no headcount could be extracted from the party text", () => {
    expect(partySizeMismatch("Adventurous foodies", 3)).toBeNull();
  });
});

describe("checkIntakeContradictions — the frozen Japan fixture", () => {
  it("fires ONLY the start-date finding (case 2) and stays silent on birthdays (case 1a)", async () => {
    const text = await readFile(FIXTURE_INTAKE, "utf8");
    const r = checkIntakeContradictions(text);
    expect(r.status).toBe("advisory");
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0].id).toBe("dates-range");
    expect(r.findings[0].q).toContain("Oct 15");
    expect(r.findings[0].q).toContain("Oct 22");
  });
});

describe("checkIntakeContradictions — every real, shipped intake doc is clean", () => {
  for (const slug of ["korea", "us"]) {
    it(`${slug} produces zero findings`, async () => {
      const text = await realIntake(slug);
      expect(checkIntakeContradictions(text)).toEqual({ status: "clean", findings: [] });
    });
  }
});

describe("checkIntakeContradictions — synthetic multi-flag coverage", () => {
  it("fires all four flag classes together when genuinely present", () => {
    const text = [
      "- **Dates (target):** 2026-06-01 – 2026-06-10",
      "- **Anchor event:** Big Concert — Dec 25 2026",
      "- **Who is this for / party:** Two friends celebrating",
      "- Number of travelers: 3",
      "His birthday is Jun 3. Later notes: his birthday is actually Jun 5.",
      "still deciding: Jun 1 or Jun 8, both about a week long",
    ].join("\n");
    const r = checkIntakeContradictions(text);
    const ids = r.findings.map((f) => f.id).sort();
    expect(ids).toEqual(["anchor-outside-window", "birthday-his", "dates-range", "party-size-mismatch"]);
  });
});

describe("applyContradictions — file mutation", () => {
  let dir;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "c2-fixture-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const DOC = (extra) => `# New Guide Intake — Testland

## 2. Trip Shape
- **Dates (target):** 2026-10-15 – 2026-11-10
- Number of travelers: 2

the traveler is still narrowing (Oct 15 or Oct 22, both ending around Nov 10)
${extra ?? ""}
`;

  it("appends a new '## Questions for the traveler' section when none exists", async () => {
    await writeFile(path.join(dir, "t.md"), DOC());
    const r = await applyContradictions("t", dir);
    expect(r.applied).toBe(1);
    const out = await readFile(path.join(dir, "t.md"), "utf8");
    expect(out).toContain("### q-t-dates-range");
    expect(out).toContain("- **Status:** open");
    expect(out).toContain("## Contradictions");
  });

  it("fills the scaffold template's '(none yet)' placeholder instead of duplicating the heading", async () => {
    const templated = DOC() + `
## Questions for the traveler (research emits; traveler answers on the progress page)
> Traveler-framed only — no pipeline vocabulary.

(none yet)
`;
    await writeFile(path.join(dir, "t.md"), templated);
    await applyContradictions("t", dir);
    const out = await readFile(path.join(dir, "t.md"), "utf8");
    expect(out).toContain("### q-t-dates-range");
    expect(out).not.toContain("(none yet)");
    // Exactly one Questions heading — the template's own, not a second appended copy.
    expect(out.match(/## Questions for the traveler/g)).toHaveLength(1);
  });

  it("is idempotent — a second run on the same doc appends nothing new", async () => {
    await writeFile(path.join(dir, "t.md"), DOC());
    const r1 = await applyContradictions("t", dir);
    const r2 = await applyContradictions("t", dir);
    expect(r1.applied).toBe(1);
    expect(r2.applied).toBe(0);
    const out = await readFile(path.join(dir, "t.md"), "utf8");
    expect(out.match(/### q-t-dates-range/g)).toHaveLength(1); // not duplicated
  });

  it("never throws on a missing intake doc — applies nothing", async () => {
    const r = await applyContradictions("does-not-exist", dir);
    expect(r).toEqual({ applied: 0, findings: [] });
  });

  it("applies nothing to a clean doc", async () => {
    await writeFile(path.join(dir, "clean.md"), "# New Guide Intake — Testland\n\nNothing contradictory here.\n");
    const r = await applyContradictions("clean", dir);
    expect(r.applied).toBe(0);
  });
});
