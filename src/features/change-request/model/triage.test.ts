// @protects-file The maker's queue never prints a headline nobody wrote, never offers a start
// button the endpoint can't serve, never loses the weight hint off the end of a capped body, and
// never reports an unread queue as an empty one.

import { describe, it, expect } from "vitest";
import {
  toRequestCards,
  toProposalCards,
  mergeQueue,
  buildTriagePayload,
  headline,
  relativeWhen,
  whoLine,
  suggestionLine,
  dispatchNote,
  queueCountLine,
  unescapeFieldMarkers,
  SUGGESTION_NOTE,
  STARTED_NOTE,
  QUEUE_EMPTY,
  QUEUE_UNREAD,
  LOAD_FAILED,
  DISPATCH_IDLE,
  type RawTriageIssue,
  type TriageGuide,
} from "./triage";
import { CHANGE_MAX, renderModifyIssueBody } from "../../../lib/modify-schema.mjs";

const GUIDES: TriageGuide[] = [
  { slug: "south-korea", title: "South Korea", groups: ["Plan", "Days", "Food", "Getting around"] },
  // Deliberately no Plan/Days tab — the same sentence has to weigh less here, which is the only
  // way to show the weight is read off the guide rather than off the words.
  { slug: "denmark", title: "Denmark", groups: ["Food", "Budget"] },
];

/** Bodies come from the REAL renderer, not a hand-typed shape. Both sides read their labels out
    of MODIFY_FIELDS, and issue-forms.test.mjs already pins those against the checked-in template —
    so what this fixture asserts is the thing that actually matters: whatever the Worker files, the
    queue can read back. A hand-copied body here would only ever prove this file agrees with
    itself. (It also applies the real sanitiser, which is how the escaped-hash case below is real.) */
function modifyBody(slug: string, change: string, section = ""): string {
  return renderModifyIssueBody({ slug, change, section });
}

const NOW = new Date("2026-08-16T12:00:00Z");

function issue(over: Partial<RawTriageIssue> = {}): RawTriageIssue {
  return {
    number: 41,
    title: "Modify: south-korea",
    body: modifyBody("south-korea", "The 09:40 ferry doesn't run on Sundays any more."),
    created_at: "2026-08-16T10:00:00Z",
    ...over,
  };
}

describe("headline", () => {
  it("falls back to the guide's own title when the issue kept its template title", () => {
    expect(headline("Modify: south-korea", "south-korea", "South Korea")).toBe("South Korea");
  });

  it("keeps a title somebody actually wrote", () => {
    expect(headline("Modify: the Busan day is wrong", "south-korea", "South Korea"))
      .toBe("the Busan day is wrong");
  });

  it("treats the auto-filed proposal title as canonical too", () => {
    expect(headline("south-korea (feedback-driven)", "south-korea", "South Korea")).toBe("South Korea");
  });

  it("never returns empty", () => {
    expect(headline("", "", "")).toBe("Change request");
    expect(headline("   ", "denmark", "")).toBe("denmark");
  });
});

describe("relativeWhen", () => {
  it("reads coarsely, in the queue's own words", () => {
    expect(relativeWhen("2026-08-16T11:59:40Z", NOW)).toBe("just now");
    expect(relativeWhen("2026-08-16T11:58:00Z", NOW)).toBe("2 minutes ago");
    expect(relativeWhen("2026-08-16T11:00:00Z", NOW)).toBe("1 hour ago");
    expect(relativeWhen("2026-08-16T10:00:00Z", NOW)).toBe("2 hours ago");
    expect(relativeWhen("2026-08-15T10:00:00Z", NOW)).toBe("yesterday");
    expect(relativeWhen("2026-08-13T10:00:00Z", NOW)).toBe("3 days ago");
  });

  it("returns nothing rather than a guess for an unparseable or future stamp", () => {
    expect(relativeWhen("not a date", NOW)).toBe("");
    expect(relativeWhen("", NOW)).toBe("");
    expect(relativeWhen("2026-09-01T00:00:00Z", NOW)).toBe("");
  });
});

describe("whoLine", () => {
  it("never claims WHO filed it — a Worker-filed request carries the repo's identity, not a person's", () => {
    expect(whoLine("request", "2026-08-16T10:00:00Z", NOW)).toBe("Asked through the change form · 2 hours ago");
    expect(whoLine("proposal", "2026-08-15T10:00:00Z", NOW))
      .toBe("Raised automatically from trip feedback · yesterday");
  });

  it("drops the clause entirely when the timestamp says nothing", () => {
    expect(whoLine("request", "", NOW)).toBe("Asked through the change form");
  });
});

describe("unescapeFieldMarkers", () => {
  it("gives the requester their own hashes back", () => {
    expect(unescapeFieldMarkers("see \\#\\#\\# below")).toBe("see ### below");
  });

  it("leaves a single hash alone — one hash can never forge a field header", () => {
    expect(unescapeFieldMarkers("room \\#4")).toBe("room \\#4");
    expect(unescapeFieldMarkers("room #4")).toBe("room #4");
  });
});

describe("toRequestCards", () => {
  it("reads slug, words and section out of the issue form's own fields", () => {
    const [card] = toRequestCards([issue()], GUIDES);
    expect(card.kind).toBe("request");
    expect(card.slug).toBe("south-korea");
    expect(card.guide).toBe("South Korea");
    expect(card.title).toBe("South Korea");
    expect(card.body).toBe("The 09:40 ferry doesn't run on Sundays any more.");
    expect(card.section).toBe("");
    expect(card.issue).toBe(41);
  });

  it("drops pull requests — a PR carrying the label is not a request to triage", () => {
    expect(toRequestCards([issue({ pull_request: {} })], GUIDES)).toEqual([]);
  });

  it("drops an issue with no words on it — the words are the whole card", () => {
    expect(toRequestCards([issue({ body: modifyBody("south-korea", "") })], GUIDES)).toEqual([]);
  });

  it("keeps a request whose guide it doesn't know, with no slug to start it with", () => {
    const [card] = toRequestCards([issue({ body: modifyBody("", "Something is wrong with the ferry.") })], GUIDES);
    expect(card.slug).toBe("");
    expect(card.weight).toBe("—");
  });

  it("weighs against the guide's OWN tabs, never a hardcoded list", () => {
    const words = "The restaurant closed and our dates moved to October.";
    // Korea: "closed" rewrites Food, "dates" rewrites Plan AND Days ⇒ three ⇒ Bigger job.
    const heavy = modifyBody("south-korea", words);
    expect(toRequestCards([issue({ body: heavy })], GUIDES)[0].weight).toBe("Bigger job");
    // Denmark: same sentence, but no Plan or Days tab for "dates" to land on ⇒ Food alone ⇒
    // Quick fix. The words did not change; the guide did. That is the whole point.
    const light = modifyBody("denmark", words);
    expect(toRequestCards([issue({ body: light })], GUIDES)[0].weight).toBe("Quick fix");
  });

  it("labels a topic only when the requester raised it", () => {
    const [card] = toRequestCards([issue({ body: modifyBody("south-korea", "That restaurant has closed for good.") })], GUIDES);
    expect(card.category).toBe("closed");
    const [bare] = toRequestCards([issue({ body: modifyBody("south-korea", "Please have another look at this.") })], GUIDES);
    expect(bare.category).toBeNull();
  });

  it("sorts newest first", () => {
    const cards = toRequestCards(
      [
        issue({ number: 1, created_at: "2026-08-10T00:00:00Z" }),
        issue({ number: 2, created_at: "2026-08-14T00:00:00Z" }),
      ],
      GUIDES,
    );
    expect(cards.map((c) => c.issue)).toEqual([2, 1]);
  });

  it("falls back to the guide when the issue arrives with no title and no stamp", () => {
    const bare = { number: 9, body: modifyBody("south-korea", "The ferry timetable changed.") };
    const [card] = toRequestCards([bare as never], GUIDES);
    expect(card.title).toBe("South Korea");
    expect(card.who).toBe("Asked through the change form");
    expect(card.createdAt).toBe("");
  });

  it("survives null and junk without throwing", () => {
    expect(toRequestCards(null, GUIDES)).toEqual([]);
    expect(toRequestCards([{}, { number: 1.5 }], GUIDES)).toEqual([]);
    expect(toRequestCards([null, undefined] as never, GUIDES)).toEqual([]);
  });
});

describe("toProposalCards", () => {
  const proposal = {
    issue: 88,
    title: "south-korea (feedback-driven)",
    reason: "Eight travellers rated the Busan day 2 out of 5 and most skipped it.",
    createdAt: "2026-08-15T10:00:00Z",
  };

  it("carries the proposal's own words and the guide's own title", () => {
    const [card] = toProposalCards([proposal], "south-korea", GUIDES);
    expect(card.kind).toBe("proposal");
    expect(card.key).toBe("proposal-88");
    expect(card.title).toBe("South Korea");
    expect(card.who).toContain("Raised automatically from trip feedback");
    expect(card.body).toBe(proposal.reason);
  });

  it("names the guide by its slug when the queue has never heard of it", () => {
    const [card] = toProposalCards([{ ...proposal, title: "atlantis (feedback-driven)" }], "atlantis", GUIDES);
    expect(card.guide).toBe("atlantis");
    expect(card.title).toBe("atlantis");
    expect(card.weight).toBe("—"); // no tabs to weigh against, so no suggestion is offered
  });

  it("prints no field it wasn't given — 'undefined' on a card is a card that made something up", () => {
    const [card] = toProposalCards([{ issue: 7 } as never], "south-korea", GUIDES);
    expect(card.title).toBe("South Korea");
    expect(card.body).toBe("");
    expect(card.createdAt).toBe("");
    expect(card.who).toBe("Raised automatically from trip feedback");
    // Every string the card PRINTS. `category` is legitimately null — it is a token, not copy.
    for (const printed of [card.title, card.who, card.body, card.guide, card.weight]) {
      expect(printed).not.toMatch(/undefined|null|NaN/);
    }
  });

  it("survives null", () => {
    expect(toProposalCards(null, "south-korea", GUIDES)).toEqual([]);
    expect(toProposalCards([null, { issue: 1.5 }] as never, "south-korea", GUIDES)).toEqual([]);
  });
});

describe("mergeQueue", () => {
  it("interleaves both populations newest-first and drops duplicate keys", () => {
    const requests = toRequestCards([issue({ number: 5, created_at: "2026-08-16T09:00:00Z" })], GUIDES);
    const proposals = toProposalCards(
      [{ issue: 9, title: "x", reason: "why", createdAt: "2026-08-16T11:00:00Z" }],
      "south-korea",
      GUIDES,
    );
    const merged = mergeQueue(requests, proposals, proposals);
    expect(merged.map((c) => c.key)).toEqual(["proposal-9", "request-5"]);
  });

  it("holds two cards filed in the same second in the order they arrived", () => {
    const same = "2026-08-16T09:00:00Z";
    const cards = toRequestCards(
      [issue({ number: 5, created_at: same }), issue({ number: 6, created_at: same })],
      GUIDES,
    );
    expect(mergeQueue(cards).map((c) => c.issue)).toEqual([5, 6]);
  });

  it("skips a list that isn't there rather than failing the whole queue", () => {
    const cards = toRequestCards([issue({ number: 5 })], GUIDES);
    expect(mergeQueue(null, cards, undefined, [null] as never).map((c) => c.issue)).toEqual([5]);
  });
});

describe("suggestionLine", () => {
  it("says there is no suggestion rather than dressing '—' up as one", () => {
    expect(suggestionLine("Quick fix")).toBe("Suggested: quick fix");
    expect(suggestionLine("Bigger job")).toBe("Suggested: full re-check");
    expect(suggestionLine("—")).toContain("No suggestion");
  });
});

describe("dispatchNote", () => {
  it("counts what this browser started, and claims nothing about where to watch it", () => {
    expect(dispatchNote(0)).toBe(DISPATCH_IDLE);
    expect(dispatchNote(1)).toBe("1 under way. It runs on its own from here.");
    expect(dispatchNote(3)).toBe("3 under way. They run on their own from here.");
    // The design's "follow them on the Progress page" is deliberately absent: a change run lives
    // on change/<slug> and the progress page reads research/<slug> then main.
    expect(dispatchNote(2)).not.toContain("Progress page");
  });
});

describe("queueCountLine", () => {
  it("counts what is still to decide", () => {
    expect(queueCountLine(4)).toBe("4 still to decide");
    expect(queueCountLine(0)).toBe("0 still to decide");
    expect(queueCountLine(-3)).toBe("0 still to decide");
  });
});

describe("the empty states", () => {
  it("says something DIFFERENT when the queue could not be read", () => {
    expect(QUEUE_EMPTY).not.toBe(QUEUE_UNREAD);
    expect(QUEUE_UNREAD).not.toMatch(/nothing is waiting/i);
  });

  it("says nothing was sent when the lazy chunk never arrived — it is a non-event, not a refusal", () => {
    expect(LOAD_FAILED).toMatch(/nothing was sent/i);
    expect(LOAD_FAILED).not.toMatch(/key|reject|denied|unauthor/i);
  });
});

describe("STARTED_NOTE", () => {
  it("tells the truth about which issue clears itself, and the two differ", () => {
    expect(STARTED_NOTE.request).toContain("stays open");
    expect(STARTED_NOTE.proposal).toContain("closes itself");
  });
});

describe("buildTriagePayload", () => {
  it("sends the requester's words first and the weight as a stated suggestion", () => {
    const [card] = toRequestCards([issue()], GUIDES);
    const payload = buildTriagePayload(card, "quick");
    expect(payload.slug).toBe("south-korea");
    expect(payload.change.startsWith(card.body)).toBe(true);
    expect(payload.change).toContain(SUGGESTION_NOTE.quick);
    expect(payload.change).toContain("Triaged from request #41.");
  });

  it("phrases the weight as a suggestion, never as an instruction — pipeline plan decides scope", () => {
    expect(SUGGESTION_NOTE.quick).toMatch(/suggestion/i);
    expect(SUGGESTION_NOTE.full).toMatch(/suggestion/i);
  });

  it("trims the BODY, never the trailer, when the whole thing would exceed the cap", () => {
    const long = "x".repeat(CHANGE_MAX);
    const [card] = toRequestCards([issue({ body: modifyBody("south-korea", long) })], GUIDES);
    const payload = buildTriagePayload(card, "full");
    expect(payload.change.length).toBeLessThanOrEqual(CHANGE_MAX);
    expect(payload.change).toContain(SUGGESTION_NOTE.full);
    expect(payload.change).toContain("Triaged from request #41.");
  });
});
