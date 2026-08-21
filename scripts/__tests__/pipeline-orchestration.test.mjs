// Tests for the orchestration modules the workflows call instead of inline bash:
// scripts/pipeline/{prompt,gate,questions}.mjs.
//
// None of this had a test before, because none of it was code — it was heredocs inside YAML `run:`
// blocks, which no linter reads and no suite can execute. Moving it into modules is only worth
// anything if the parts that decide something get pinned, so what is tested here is exactly that:
// the substitution that could silently send an agent at the wrong guide, the artifact checks that
// decide whether a run is allowed to land, and the fork gate's pause semantics.

// @protects-file The automation's own checks do what they claim before a run is allowed to land.

import { describe, it, expect } from "vitest";
import { render, varsFromEnv } from "../pipeline/prompt.mjs";
import { missingArtifacts, attemptsOf, forkComment, CAPS } from "../pipeline/gate.mjs";
import { parseQuestions, unaskedOpen, formatComment } from "../pipeline/questions.mjs";

describe("prompt composition", () => {
  it("maps WP_* env vars to lowercase placeholder names", () => {
    expect(varsFromEnv({ WP_SLUG: "korea", WP_SECTION: "Money", PATH: "/usr/bin" })).toEqual({
      slug: "korea",
      section: "Money",
    });
  });

  it("substitutes every occurrence", () => {
    const { text, missing } = render("Guide {{slug}} — run {{slug}} now", { slug: "korea" });
    expect(text).toBe("Guide korea — run korea now");
    expect(missing).toEqual([]);
  });

  it("REPORTS an unresolved placeholder rather than rendering it", () => {
    // This is the whole reason composition is code. A prompt that quietly ships
    // "Guide slug: {{slug}}" sends an agent to research a guide that does not exist, and
    // every downstream check passes because the agent did produce output.
    const { text, missing } = render("Guide {{slug}} section {{section}}", { slug: "korea" });
    expect(missing).toEqual(["section"]);
    expect(text).toContain("{{section}}"); // left visible, not blanked
  });

  it("treats an empty string as missing — a blank slug is not a slug", () => {
    expect(render("{{slug}}", { slug: "" }).missing).toEqual(["slug"]);
  });

  it("is case- and whitespace-tolerant in the template", () => {
    expect(render("{{ SLUG }}", { slug: "korea" }).text).toBe("korea");
  });

  it("leaves non-placeholder braces alone", () => {
    expect(render('{"draft": true}', {}).text).toBe('{"draft": true}');
  });
});

describe("missingArtifacts — the record that proves the protocol ran", () => {
  const critic = (extra = "") => `## Critic findings\n\nSomething to fix.\n\n## Citation audit\n\nOK.\n${extra}`;

  it("passes a complete critic record", () => {
    expect(missingArtifacts(critic("\n#### Continuity sweep — critic execution\n\ngrepped X"), "critic")).toEqual([]);
  });

  it("names each missing critic heading", () => {
    expect(missingArtifacts("nothing at all", "critic")).toEqual(
      expect.arrayContaining(["## Critic findings", "## Citation audit"]),
    );
  });

  it("requires the sweep record when there ARE findings", () => {
    expect(missingArtifacts(critic(), "critic")).toContain("#### Continuity sweep — critic execution");
  });

  it("does NOT require the sweep record on a clean pass — nothing was edited to ripple", () => {
    const clean = "## Critic findings\n\nNone — the guide holds.\n\n## Citation audit\n\nOK.";
    expect(missingArtifacts(clean, "critic")).toEqual([]);
  });

  it("requires the change agent's sweep record UNCONDITIONALLY", () => {
    // A change run that edited nothing has nothing to land, so there is always something to
    // sweep for. "No ripples" is a valid entry; no entry is not.
    expect(missingArtifacts("## Summary\n\nchanged the price", "change")).toEqual(["## Continuity sweep"]);
    expect(missingArtifacts("## Continuity sweep\n\nGrepped ₩14,000 — no other mentions.", "change")).toEqual([]);
  });

  it("throws on an unknown stage rather than passing everything", () => {
    expect(() => missingArtifacts("x", "vibes")).toThrow(/unknown artifact stage/);
  });
});

describe("attempt budget", () => {
  it("counts research and change attempts separately", () => {
    const state = { attempts: 4, change: { attempts: 1 } };
    expect(attemptsOf(state, "research")).toBe(4);
    expect(attemptsOf(state, "change")).toBe(1);
  });

  it("treats a state with no counter as zero attempts", () => {
    expect(attemptsOf(undefined, "research")).toBe(0);
    expect(attemptsOf({}, "change")).toBe(0);
  });

  it("a change run is capped tighter than research — it reruns from scratch", () => {
    expect(CAPS.change).toBeLessThan(CAPS.research);
  });
});

describe("forkComment — the Clarifying-Questions Doctrine, headless", () => {
  const forks = [
    { id: "F1", question: "Keep the splurge night, or spend it on the extra day?", options: ["keep", "move"], affects: "Days, Budget" },
  ];

  it("says the run is paused and that nothing was written", () => {
    const body = forkComment(forks, "korea");
    expect(body).toContain("Paused");
    expect(body).toContain("nothing was written");
    expect(body).toContain("korea");
  });

  it("lists the options and what the decision affects", () => {
    const body = forkComment(forks, "korea");
    expect(body).toContain("keep");
    expect(body).toContain("Affects: Days, Budget");
  });

  it("falls back to the fork id when there is no question text", () => {
    expect(forkComment([{ id: "F9" }], "korea")).toContain("F9");
  });

  it("pluralizes honestly", () => {
    expect(forkComment(forks, "korea")).toContain("a decision");
    expect(forkComment([...forks, { id: "F2", question: "and?" }], "korea")).toContain("2 decisions");
  });
});

describe("traveler questions — surface, never gate", () => {
  const ledger = [
    "## Research reconciliation",
    "",
    "AGREE: everything.",
    "",
    "## Questions for the traveler",
    "",
    "### Q1",
    "**Status:** open",
    "**Q:** Rail pass or single tickets?",
    "**Assumed:** single tickets (cheaper for 4 legs)",
    "**Context:** Getting around, Budget",
    "",
    "### Q2",
    "**Status:** answered",
    "**Q:** Two travellers or three?",
    "",
    "## Amendments",
    "",
    "### Q3",
    "**Status:** open",
  ].join("\n");

  it("parses the cards and stops at the next section", () => {
    const cards = parseQuestions(ledger);
    expect(cards.map((c) => c.id)).toEqual(["Q1", "Q2"]); // Q3 is under Amendments
    expect(cards[0]).toMatchObject({ status: "open", q: "Rail pass or single tickets?" });
  });

  it("returns nothing when the ledger has no questions section", () => {
    expect(parseQuestions("## Amendments\n\nnone")).toEqual([]);
    expect(parseQuestions("")).toEqual([]);
  });

  it("only OPEN cards are surfaced", () => {
    expect(unaskedOpen(parseQuestions(ledger)).map((c) => c.id)).toEqual(["Q1"]);
  });

  it("dedupes against what the issue was already told — a resumed run never re-asks", () => {
    expect(unaskedOpen(parseQuestions(ledger), "…<sub>Q1</sub>…")).toEqual([]);
  });

  it("the comment states the assumption and stays truthful about a possibly-active run (amended scar)", () => {
    // Amended (correction pass): the old copy said "your guide is complete either way" — posted
    // while research may still be RUNNING, and it invited "reply here" though no issue-comment
    // ingestion path exists. The surfaced-not-blocking contract stays; the claims are now true.
    const body = formatComment(unaskedOpen(parseQuestions(ledger)));
    expect(body).toContain("Built on: single tickets");
    expect(body).toContain("carries on either way"); // it surfaces, it does not block
    expect(body).not.toMatch(/guide is complete|reply here/i); // no false completeness, no dead reply channel
    expect(body).toContain("progress page"); // points at the REAL answer route
    expect(body).toContain("<sub>Q1</sub>"); // the dedup key travels in the comment
  });

  it("says nothing when there is nothing open", () => {
    expect(formatComment([])).toBe("");
  });
});
