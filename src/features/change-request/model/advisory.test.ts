// @protects-file The change page's advisory never names a tab the guide doesn't have, never
// labels a request with a topic the requester didn't raise, and never claims a turnaround
// nothing measures. It is a suggestion the requester can overrule — and it must read like one.

import { describe, it, expect } from "vitest";
import {
  affectedGroups,
  matchedCategories,
  deriveWeight,
  sectionTouches,
  CATEGORY_LABEL,
  CATEGORY_TONE,
  WEIGHT_NOTE,
  TOUCH_LEGEND,
  ADVISORY_EMPTY,
  ADVISORY_MIN,
  advisoryEmptyLine,
  type AdvisoryCategory,
  type Weight,
} from "./advisory";
import { CHANGE_MIN } from "../../../lib/modify-schema.mjs";

/* The two published guides' REAL tab groups, read off src/content/guides/<slug>/. Hardcoded on
   purpose: if a guide's tabs are renamed, this file should be the thing that notices. */
const DENMARK = ["Plan", "Essentials", "Transit", "Days", "Sights", "Food & shopping", "Day trips", "Sources"];
const KOREA = [
  "Plan", "Essentials", "Transit", "Days", "Sights",
  "Daejeon & MSI", "Gaming & anime", "Food & shopping", "Pokémon GO", "Tokyo", "Sources",
];

const names = (text: string, groups = DENMARK, dropped?: string[]) =>
  affectedGroups(text, groups, dropped).map((a) => a.group);

describe("affectedGroups", () => {
  it("only ever names tabs the guide actually has", () => {
    // The prototype's rules pointed at "Weather" and "Where to stay". Neither guide has either.
    const all = new Set([...DENMARK, ...KOREA]);
    for (const text of [
      "The dates moved to October, a week later than planned.",
      "My father uses a wheelchair and can't manage stairs.",
      "The restaurant on day three is permanently closed now.",
      "This is more expensive than our budget allows.",
      "We need vegetarian dinner options every night.",
      "Our hotel booking changed to a different room.",
      "The airport bus route is different from what's written.",
    ]) {
      for (const g of [...affectedGroups(text, DENMARK), ...affectedGroups(text, KOREA)]) {
        expect(all.has(g.group), `${g.group} is not a real tab`).toBe(true);
      }
    }
  });

  it("says nothing until there is enough text to act on", () => {
    expect(affectedGroups("dates", DENMARK)).toEqual([]);
    expect(affectedGroups("   ", DENMARK)).toEqual([]);
    expect(affectedGroups(null as unknown as string, DENMARK)).toEqual([]);
    expect(names("The dates moved to October now.")).not.toEqual([]);
  });

  it("turns on at exactly the length the Worker will accept — not before", () => {
    expect(ADVISORY_MIN).toBe(CHANGE_MIN);
    const short = "date " + "x".repeat(ADVISORY_MIN - 6); // one char under
    expect(short.trim().length).toBe(ADVISORY_MIN - 1);
    expect(affectedGroups(short, DENMARK)).toEqual([]);
    expect(affectedGroups(short + "x", DENMARK).length).toBeGreaterThan(0);
  });

  it("routes a date change to the planning and day tabs", () => {
    const hit = names("The dates moved to October, a week later than planned.");
    expect(hit).toContain("Plan");
    expect(hit).toContain("Days");
    expect(hit).not.toContain("Sources");
  });

  it("routes a closure to the tabs that hold venues", () => {
    const hit = names("The bakery on day two is permanently closed.");
    expect(hit).toContain("Food & shopping");
    expect(hit).toContain("Sights");
  });

  it("keeps the guide's own nav order, so the list matches the tab map under it", () => {
    const hit = names("The dates moved and the restaurant is closed and it's expensive.");
    const order = hit.map((g) => DENMARK.indexOf(g));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("lets 'rewrite' win over 'check' when both rules point at one tab", () => {
    // "Transit" is a check for the transport rule and a rewrite for the access rule.
    const hit = affectedGroups("My mother can't manage stairs on the metro with her walking frame.", DENMARK);
    expect(hit.find((a) => a.group === "Transit")?.kind).toBe("rewrite");
  });

  it("leaves a tab as 'check' when only check rules reach it", () => {
    const hit = affectedGroups("This trip is far more expensive than we can afford.", DENMARK);
    expect(hit.find((a) => a.group === "Essentials")?.kind).toBe("check");
    expect(hit.every((a) => a.kind === "check")).toBe(true);
  });

  it("stays 'check' when two different check rules both reach one tab", () => {
    const hit = affectedGroups("The bus fare is far more expensive than the guide says.", [
      "Budget & getting around",
    ]);
    expect(hit).toEqual([{ group: "Budget & getting around", kind: "check" }]);
  });

  it("obeys the requester's veto — they know things a keyword map cannot", () => {
    const before = names("The dates moved to October, a week later than planned.");
    expect(before).toContain("Plan");
    const after = names("The dates moved to October, a week later than planned.", DENMARK, ["Plan"]);
    expect(after).not.toContain("Plan");
    expect(after.length).toBe(before.length - 1);
  });

  it("matches no tab at all rather than guessing, when the guide has no such tab", () => {
    // Neither published guide has an accommodation tab, and inventing one would be the lie.
    expect(names("Our hotel is actually a hostel with shared rooms.")).toEqual([]);
    expect(ADVISORY_EMPTY.none).toMatch(/still sends/i);
  });

  it("survives a guide with no groups, and a blank group name", () => {
    const text = "The dates moved to October, a week later than planned.";
    expect(affectedGroups(text, null)).toEqual([]);
    expect(affectedGroups(text, [])).toEqual([]);
    expect(affectedGroups(text, ["", "Plan"], null).map((a) => a.group)).toEqual(["Plan"]);
  });

  it("does not fire on a word that merely contains a keyword", () => {
    // "update" contains "date"; "carpet" contains "car". Word boundaries, not substrings.
    expect(names("Please update the carpeted areas mentioned in this guide.")).toEqual([]);
  });
});

describe("matchedCategories", () => {
  it("labels a request with the topics it actually raised", () => {
    expect(matchedCategories("The dates moved to October, a week later.")).toEqual(["dates"]);
    expect(matchedCategories("The bakery is permanently closed now.")).toEqual(["closed"]);
    expect(matchedCategories("We need vegetarian dinner options.")).toEqual(["taste"]);
  });

  it("raises more than one when the request really is about more than one", () => {
    const cats = matchedCategories("The dates moved and it's now too expensive for our budget.");
    expect(cats).toContain("dates");
    expect(cats).toContain("money");
  });

  it("never labels a hotel complaint 'Access needs' or a transport one 'When?'", () => {
    // The prototype did both. A chip is the requester's words handed back — the wrong words are
    // worse than no words, so these two rules route without labelling.
    expect(matchedCategories("Our hotel is actually a hostel with shared rooms.")).toEqual([]);
    expect(matchedCategories("The airport bus route is not what's written here.")).toEqual([]);
  });

  it("says nothing before there is enough text", () => {
    expect(matchedCategories("dates")).toEqual([]);
    expect(matchedCategories(null as unknown as string)).toEqual([]);
  });

  it("gives every category a label and a real token, and never invents a hue", () => {
    const cats: AdvisoryCategory[] = ["dates", "access", "closed", "money", "taste"];
    for (const c of cats) {
      expect(CATEGORY_LABEL[c]).toBeTruthy();
      expect(CATEGORY_TONE[c]).toMatch(/^(accent|crit|green|warn)$/);
    }
    // README decision 1: no purple. dates and access share the accent and differ by their words.
    expect(CATEGORY_TONE.dates).toBe("accent");
    expect(CATEGORY_TONE.access).toBe("accent");
    expect(CATEGORY_LABEL.dates).not.toBe(CATEGORY_LABEL.access);
  });
});

describe("deriveWeight", () => {
  it("has nothing to say about nothing", () => {
    expect(deriveWeight([])).toBe("—");
    expect(deriveWeight(null)).toBe("—");
    expect(deriveWeight(undefined)).toBe("—");
  });

  it("calls one rewrite a quick fix", () => {
    expect(deriveWeight([{ group: "Food & shopping", kind: "rewrite" }])).toBe("Quick fix");
  });

  it("calls a pile of checks a quick fix too — reading is not rewriting", () => {
    expect(
      deriveWeight([
        { group: "Plan", kind: "check" },
        { group: "Essentials", kind: "check" },
        { group: "Transit", kind: "check" },
      ]),
    ).toBe("Quick fix");
  });

  it("actually reaches 'Bigger job' — the prototype's stamp never could", () => {
    // Its counter looked for kind "re-research", which no rule emitted, so every request in
    // every demo read "Quick fix", including ones that rewrote six tabs.
    expect(
      deriveWeight([
        { group: "Plan", kind: "rewrite" },
        { group: "Days", kind: "rewrite" },
      ]),
    ).toBe("Bigger job");
    expect(deriveWeight(affectedGroups("The dates moved to October, a week later than planned.", DENMARK)))
      .toBe("Bigger job");
  });

  it("promises time it can keep — the edit's length, never the wait", () => {
    const weights: Weight[] = ["—", "Quick fix", "Bigger job"];
    for (const w of weights) expect(WEIGHT_NOTE[w]).toBeTruthy();
    const all = Object.values(WEIGHT_NOTE).join(" ");
    expect(all).not.toMatch(/\b\d+\s*minutes?\b/i); // no "about 10 minutes"
    expect(all).not.toMatch(/notif|we'?ll (let you know|email|tell you)/i);
    expect(WEIGHT_NOTE["Quick fix"]).toMatch(/minutes rather than hours/i);
  });
});

describe("sectionTouches", () => {
  it("lists EVERY tab, because the untouched ones are the reassurance", () => {
    const touches = sectionTouches(DENMARK, affectedGroups("The bakery is permanently closed.", DENMARK));
    expect(touches.map((t) => t.group)).toEqual(DENMARK);
    expect(touches.some((t) => t.tag === "Untouched")).toBe(true);
    expect(touches.find((t) => t.group === "Sources")!.tag).toBe("Untouched");
  });

  it("tags a rewrite Redone and a check Checked, and drives the bar off the same fact", () => {
    const touches = sectionTouches(["A", "B", "C"], [
      { group: "A", kind: "rewrite" },
      { group: "B", kind: "check" },
    ]);
    expect(touches).toEqual([
      { group: "A", tag: "Redone", bar: 1 },
      { group: "B", tag: "Checked", bar: 1 },
      { group: "C", tag: "Untouched", bar: 0 },
    ]);
  });

  it("shows a whole untouched guide when nothing matched", () => {
    const touches = sectionTouches(KOREA, []);
    expect(touches).toHaveLength(KOREA.length);
    expect(touches.every((t) => t.tag === "Untouched" && t.bar === 0)).toBe(true);
    expect(sectionTouches(KOREA, null).every((t) => t.bar === 0)).toBe(true);
  });

  it("survives no groups and skips a blank one", () => {
    expect(sectionTouches(null, [])).toEqual([]);
    expect(sectionTouches(["", "Plan"], []).map((t) => t.group)).toEqual(["Plan"]);
  });

  it("uses the legend's three words and no others", () => {
    for (const word of ["Redone", "Checked", "untouched"]) expect(TOUCH_LEGEND).toContain(word);
    const tags = new Set(sectionTouches(DENMARK, [{ group: "Plan", kind: "rewrite" }]).map((t) => t.tag));
    for (const tag of tags) expect(TOUCH_LEGEND.toLowerCase()).toContain(tag.toLowerCase());
  });
});

describe("advisoryEmptyLine", () => {
  it("asks for more words below the floor instead of promising the request sends", () => {
    // Caught in the browser: one typed character used to be answered with "the request still
    // sends", which the send button rejects at that length. The panel would have been
    // contradicting the button it sits next to.
    expect(advisoryEmptyLine("")).toBe(ADVISORY_EMPTY.short);
    expect(advisoryEmptyLine("n")).toBe(ADVISORY_EMPTY.short);
    expect(advisoryEmptyLine("x".repeat(ADVISORY_MIN - 1))).toBe(ADVISORY_EMPTY.short);
    expect(advisoryEmptyLine("   " + "x".repeat(ADVISORY_MIN - 1) + "   ")).toBe(ADVISORY_EMPTY.short);
  });

  it("reassures once the text clears the same floor the send button uses", () => {
    expect(advisoryEmptyLine("x".repeat(ADVISORY_MIN))).toBe(ADVISORY_EMPTY.none);
    expect(advisoryEmptyLine("Our hotel is actually a hostel with shared rooms.")).toBe(
      ADVISORY_EMPTY.none,
    );
  });

  it("switches at exactly ADVISORY_MIN, so the panel and the button turn on together", () => {
    const at = (n: number) => advisoryEmptyLine("x".repeat(n));
    expect(at(ADVISORY_MIN - 1)).not.toBe(at(ADVISORY_MIN));
    expect(ADVISORY_MIN).toBe(CHANGE_MIN);
  });
});

describe("the advisory's own honesty", () => {
  it("frames itself as a suggestion, not a plan", () => {
    expect(ADVISORY_EMPTY.short).toMatch(/would touch/i);
    expect(ADVISORY_EMPTY.none).toMatch(/editor reads the whole guide/i);
  });

  it("never claims to have read the guide's content", () => {
    const copy = [TOUCH_LEGEND, ...Object.values(WEIGHT_NOTE), ...Object.values(ADVISORY_EMPTY)].join(" ");
    expect(copy).not.toMatch(/we (found|checked|verified)\b/i);
  });
});
