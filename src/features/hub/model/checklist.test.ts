// The /new preflight checklist's pure half. The bugs this catches are the ones a screenshot
// cannot: a section that reads "done" with a blank in it, a meter that counts a rider, a
// podium padded with a category nobody picked, and a fork gate that fires when the answers
// raised no fork at all.

// @protects-file The checklist reports the intake honestly — never fuller than it is.

import { describe, it, expect } from "vitest";
import {
  SECTIONS, SECTION_IDS, sectionUnits, filledUnits, sectionState, allStates, meterFill,
  clearedLabel, blankCount, blanksLine, nextSection, MATCH_CATEGORIES, MATCHUPS, tally,
  rankFromPicks, deriveForks, forksCleared, MAX_FORKS, STAMP_LABEL,
} from "./checklist";
import { NICHE_VALUE } from "./intake";

const trip = SECTIONS[0];
const budget = SECTIONS.find((s) => s.id === "budget")!;
const priorities = SECTIONS.find((s) => s.id === "priorities")!;

describe("the six sections", () => {
  it("is the designed grouping, in the designed order", () => {
    expect(SECTION_IDS).toEqual(["trip", "who", "priorities", "budget", "constraints", "tone"]);
  });

  it("every field names at least one DOM id, and no DOM id is claimed twice", () => {
    const seen: string[] = [];
    for (const s of SECTIONS) {
      for (const f of s.fields) {
        expect(f.dom.length, `${f.id} names no DOM id`).toBeGreaterThan(0);
        for (const d of f.dom) {
          expect(seen, `${d} is claimed by two fields`).not.toContain(d);
          seen.push(d);
        }
      }
    }
  });

  it("every non-derived field asks a question and says what it changes", () => {
    for (const s of SECTIONS) {
      for (const f of s.fields) {
        if (f.derived) continue;
        expect(f.question, `${f.id} has no question`).toBeTruthy();
        expect(f.changes, `${f.id} never says what it changes`).toBeTruthy();
      }
    }
  });

  it("the 'what this changes' notes stay in traveller language", () => {
    // The failure this closes is a paste from the schema's own descriptions, which are written
    // for the pipeline. A traveller does not know what an ADR or the Atlas globe is.
    const architecture = /\bADR\b|\bD1[0-9]\b|UNCONFIRMED|issue form|scaffold|pipeline|zod|Atlas globe/i;
    for (const s of SECTIONS) {
      for (const f of s.fields) {
        if (!f.changes) continue;
        expect(architecture.test(f.changes), `${f.id}: ${f.changes}`).toBe(false);
      }
    }
  });
});

describe("countable units", () => {
  it("a certainty rider never counts — its select is never blank", () => {
    // Trip holds 7 fields; the two certainty riders are not two more things to answer.
    expect(trip.fields).toHaveLength(7);
    expect(sectionUnits(trip)).toEqual(["country", "cities", "dates", "departure-airport", "anchor"]);
    expect(sectionUnits(budget)).toEqual(["budget"]);
  });

  it("the three priority slots are one answer, not three", () => {
    expect(sectionUnits(priorities)).toEqual(["priorities", "niche"]);
  });

  it("either half of the dates field fills it", () => {
    expect(filledUnits(trip, { ngStart: "2026-03-01" })).toBe(1);
    expect(filledUnits(trip, { ngEnd: "2026-03-08" })).toBe(1);
    expect(filledUnits(trip, { ngStart: "2026-03-01", ngEnd: "2026-03-08" })).toBe(1);
  });

  it("whitespace is not an answer", () => {
    expect(filledUnits(trip, { ngCountry: "   " })).toBe(0);
  });
});

describe("section status", () => {
  it("reads todo, part done and done off the real values", () => {
    expect(sectionState(trip, {}, [])).toBe("todo");
    expect(sectionState(trip, { ngCountry: "Brazil" }, [])).toBe("part");
    expect(sectionState(trip, {
      ngCountry: "Brazil", ngCities: "Rio", ngStart: "2026-03-01",
      ngDepartureAirport: "EWR", ngAnchor: "Carnival",
    }, [])).toBe("done");
  });

  it("a rider left at its default cannot hold a section back", () => {
    // dates-certainty is "assumed" here and forever if nobody touches it; a section that could
    // never read done would make the whole meter unreachable.
    expect(sectionState(budget, { ngBudget: "Mid-range ($75–150/day)", ngBudgetCertainty: "assumed" }, []))
      .toBe("done");
  });

  it("skipping reads as assumed, not as not-started — even with answers in it", () => {
    expect(sectionState(trip, { ngCountry: "Brazil" }, ["trip"])).toBe("assumed");
  });

  it("every state has a word beside its mark", () => {
    for (const state of ["todo", "part", "done", "assumed"] as const) {
      expect(STAMP_LABEL[state]).toMatch(/^[A-Z ]+$/);
    }
  });
});

describe("the meter", () => {
  it("is empty on an untouched intake and full when every section is done", () => {
    expect(meterFill(allStates({}, []))).toBe(0);
    expect(meterFill(["done", "done", "done", "done", "done", "done"])).toBe(1);
  });

  it("counts a skipped section as a partial move, not as nothing and not as done", () => {
    const fill = meterFill(["assumed", "todo", "todo", "todo", "todo", "todo"]);
    expect(fill).toBeGreaterThan(0);
    expect(fill).toBeLessThan(1 / 6);
  });

  it("says how many are done and how many were skipped", () => {
    expect(clearedLabel(["done", "done", "todo", "part", "todo", "todo"])).toBe("2 of 6 done");
    expect(clearedLabel(["done", "assumed", "todo", "part", "assumed", "todo"]))
      .toBe("1 of 6 done · 2 skipped");
  });

  it("reports blanks instead of inventing a time or a cost", () => {
    // The design puts "est. 1h 40m · ~$11.80" in this slot. Neither is knowable before the
    // research runs, and a confident wrong figure is the exact failure the accuracy rules name.
    const line = blanksLine({});
    expect(line).not.toMatch(/\$|\bmin\b|\bh\b|hour|est\./i);
    expect(line).toContain(String(blankCount({})));
    expect(blankCount({})).toBe(18); // + familiarity, guide audience, guide reading style
  });

  it("says nothing is blank only when nothing is", () => {
    const full: Record<string, string> = {};
    for (const s of SECTIONS) for (const f of s.fields) for (const d of f.dom) full[d] = "x";
    expect(blankCount(full)).toBe(0);
    expect(blanksLine(full)).toBe("Nothing left blank");
  });
});

describe("what to open next", () => {
  it("points past the section just finished to the next unfinished one", () => {
    const states = allStates({}, []);
    expect(nextSection(states, "trip")?.id).toBe("who");
  });

  it("is null once nothing is left unfinished", () => {
    expect(nextSection(["done", "done", "assumed", "done", "assumed", "done"], null)).toBeNull();
  });
});

describe("head-to-head priorities", () => {
  it("runs six categories over five matchups, every category appearing at least once", () => {
    expect(MATCH_CATEGORIES).toHaveLength(6);
    expect(MATCHUPS).toHaveLength(5);
    const appear = new Set(MATCHUPS.flat());
    expect(appear.size).toBe(MATCH_CATEGORIES.length);
    for (const [a, b] of MATCHUPS) {
      expect(a).toBeLessThan(MATCH_CATEGORIES.length);
      expect(b).toBeLessThan(MATCH_CATEGORIES.length);
      expect(a).not.toBe(b);
    }
  });

  it("never offers the niche option as a matchup — it is a thread, not a category", () => {
    expect(MATCH_CATEGORIES.map((c) => c.value)).not.toContain(NICHE_VALUE);
  });

  it("tallies a point per win and ranks by score", () => {
    const food = MATCH_CATEGORIES[0].value, culture = MATCH_CATEGORIES[1].value;
    const picks = [food, MATCH_CATEGORIES[2].value, food, culture, food];
    expect(tally(picks)[food]).toBe(3);
    expect(rankFromPicks(picks)[0]).toBe(food);
  });

  it("ranks only what actually won — no podium padded from the leftovers", () => {
    const food = MATCH_CATEGORIES[0].value;
    expect(rankFromPicks([food])).toEqual([food]);
    expect(rankFromPicks([])).toEqual([]);
  });

  it("breaks a tie the same way every time", () => {
    const picks = [MATCH_CATEGORIES[1].value, MATCH_CATEGORIES[2].value];
    expect(rankFromPicks(picks)).toEqual(rankFromPicks(picks));
    expect(rankFromPicks(picks)).toEqual([MATCH_CATEGORIES[1].value, MATCH_CATEGORIES[2].value]);
  });

  it("never returns more than the three seats the schema has", () => {
    const picks = MATCH_CATEGORIES.slice(0, 5).map((c) => c.value);
    expect(rankFromPicks(picks).length).toBeLessThanOrEqual(3);
  });
});

describe("the fork gate", () => {
  const answered = { ngPace: "balanced", ngTravelStyle: "Balanced" };

  it("raises nothing when the answers raise nothing", () => {
    expect(deriveForks(answered)).toEqual([]);
    expect(forksCleared([], {})).toBe(true);
  });

  it("asks about a certainty only once the thing it qualifies exists", () => {
    expect(deriveForks({ ...answered, ngAnchorCertainty: "assumed" })).toEqual([]);
    const forks = deriveForks({ ...answered, ngAnchor: "Carnival", ngAnchorCertainty: "assumed" });
    expect(forks.map((f) => f.id)).toEqual(["anchor-certainty"]);
  });

  it("stops asking once the traveller has already said", () => {
    expect(deriveForks({ ...answered, ngStart: "2026-03-01", ngDatesCertainty: "fixed" })).toEqual([]);
  });

  it("never asks more than the two the gate has room for", () => {
    const forks = deriveForks({ ngStart: "2026-03-01", ngAnchor: "Carnival", ngBudget: "Luxury ($300+/day)" });
    expect(forks).toHaveLength(MAX_FORKS);
  });

  it("every fork writes a real field and recommends with a reason", () => {
    const forks = deriveForks({});
    expect(forks.length).toBeGreaterThan(0);
    for (const f of forks) {
      expect(f.dom).toMatch(/^ng[A-Z]/);
      expect(f.recommend).toBeTruthy();
      expect(f.why.length).toBeGreaterThan(20);
      // A reason, not a fabricated statistic — "most travellers", "9 out of 10", "68%".
      expect(f.why).not.toMatch(/\d+\s*%|most (travel|people|trips)|\bstudies\b/i);
    }
  });

  it("clears only when every raised fork has an answer", () => {
    const forks = deriveForks({});
    expect(forksCleared(forks, {})).toBe(false);
    expect(forksCleared(forks, { [forks[0].id]: "balanced" })).toBe(false);
    const all: Record<string, string> = {};
    for (const f of forks) all[f.id] = f.recommend;
    expect(forksCleared(forks, all)).toBe(true);
  });

  it("counts 'leave it open' as an answer, not as silence", () => {
    // pace/travel-style say undecided with an EMPTY option value. Reading that back as
    // unanswered would lock the send button behind a decision already made.
    const forks = deriveForks({});
    const open: Record<string, string> = {};
    for (const f of forks) open[f.id] = "";
    expect(forksCleared(forks, open)).toBe(true);
  });

  it("asks two questions per session, not two at a time", () => {
    // Caught in the browser: with five candidate rules and a cap counted over OPEN forks only,
    // answering both raised the next two and "All set" receded forever. The budget spends on
    // answers, so a cleared gate stays cleared.
    const vals = { ngStart: "2026-03-01", ngAnchor: "Carnival", ngBudget: "Luxury ($300+/day)" };
    const first = deriveForks(vals);
    expect(first).toHaveLength(MAX_FORKS);
    const picks: Record<string, string> = {};
    for (const f of first) picks[f.id] = f.recommend;
    expect(deriveForks(vals, picks)).toEqual([]);
    expect(forksCleared(deriveForks(vals, picks), picks)).toBe(true);
  });

  it("an answered fork stops being asked even when its rule still fires", () => {
    // "leave it open" writes the empty value pace's own dropdown uses for undecided, so the
    // rule that raised it fires again on the next render. Without the answered-check that is
    // an infinite loop of one question.
    const picks = { pace: "" };
    const forks = deriveForks({ ngTravelStyle: "Balanced" }, picks);
    expect(forks.map((f) => f.id)).not.toContain("pace");
  });
});
