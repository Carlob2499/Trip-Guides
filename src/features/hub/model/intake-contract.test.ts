// The PIPELINE CONTRACT intake.ts's header declares, made mechanical. The /new page borrows its
// whole vocabulary from scripts/intake-schema.mjs (the intake single source of truth) and never
// re-invents it; until now that was defended by a comment plus hardcoded copies of the enum and the
// id list in intake.test.ts — a copy drifts exactly the way the comment did. Two seams, two silent
// failures if either drifts:
//   · priority values — the issue form only accepts its own dropdown option strings, so a
//     "friendlified" card value files as blank and the traveler's #1 priority reaches research
//     as nothing at all.
//   · field ids — intake.ts names DOM ids (ngCountry…); intake-submit.js reads those ids and emits
//     issue-form keys. Rename either end alone and the answer is collected into nothing.
// Asserted against FIELDS and against intake-submit.js's own source, never against a local list.

// @protects-file Every answer the guide-request screen asks for reaches the person building it.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FIELDS, NULLISH_VALUES } from "../../../../scripts/intake-schema.mjs";
import { RANK_CARDS, NICHE_VALUE, TOPIC_CHIPS, TAIL_STEPS, rankToFields, manifestSegments } from "./intake";

const FIELD_IDS = FIELDS.map((f) => f.id);
const PRIORITY_FIELDS = FIELDS.filter((f) => f.special === "priority");
// The board's vocabulary is the priority dropdowns' options minus the null-ish "unset" choice —
// the board says "unset" with an unfilled rank, not with a card.
const PRIORITY_ENUM = [...new Set(PRIORITY_FIELDS.flatMap((f) => f.options ?? []))]
  .filter((o) => !NULLISH_VALUES.includes(o));

// The submit seam, read from source: intake-submit.js is DOM glue (importing it would need a
// document, and its ids live in string literals either way). Only the machine-meaningful shape —
// which DOM ids it reads via val(), and which issue-form keys collectRaw emits.
const SUBMIT_SRC = readFileSync(fileURLToPath(new URL("../ui/intake-submit.js", import.meta.url)), "utf8");
const COLLECT_RAW_AT = SUBMIT_SRC.indexOf("function collectRaw");
const COLLECTED_IDS = [...SUBMIT_SRC.matchAll(/\bval\("(\w+)"\)/g)].map((m) => m[1]);
const EMITTED_KEYS = [...SUBMIT_SRC.slice(COLLECT_RAW_AT, SUBMIT_SRC.indexOf("\n}", COLLECT_RAW_AT))
  .matchAll(/^ {4}"?([\w-]+)"?[,:]/gm)].map((m) => m[1]);

// An extractor that quietly matched nothing would pass every check below vacuously.
describe("the extractors above found real seams", () => {
  it("read the priority options and both halves of the submit seam", () => {
    expect(PRIORITY_ENUM.length).toBeGreaterThan(1);
    expect(COLLECTED_IDS).toContain("ngCountry");
    expect(EMITTED_KEYS).toContain("passport-countries"); // the quoted, non-identifier key
  });
});

describe("intake board ↔ intake-schema priority options", () => {
  it("every rank-card value is an exact priority option string", () => {
    for (const c of RANK_CARDS) expect(PRIORITY_ENUM).toContain(c.value);
  });

  it("covers the option set — no priority silently unreachable from the board", () => {
    expect(RANK_CARDS.map((c) => c.value).sort()).toEqual([...PRIORITY_ENUM].sort());
  });

  it("the priority fields share one option set — a card fits any rank", () => {
    expect(new Set(PRIORITY_FIELDS.map((f) => JSON.stringify(f.options))).size).toBe(1);
  });

  it("NICHE_VALUE is the schema's own niche option, not a lookalike", () => {
    expect(PRIORITY_ENUM).toContain(NICHE_VALUE);
  });

  it("topic chips claim no priority seat (they are the also-research tier)", () => {
    for (const t of TOPIC_CHIPS) expect(PRIORITY_ENUM).not.toContain(t);
  });
});

describe("intake field ids ↔ intake-schema FIELDS", () => {
  it("rankToFields writes real FIELDS ids, one per schema priority field", () => {
    const keys = Object.keys(rankToFields([]));
    expect(keys).toHaveLength(PRIORITY_FIELDS.length); // a schema priority4 would file as nothing
    for (const key of keys) expect(FIELD_IDS).toContain(key);
  });

  it("every DOM id intake.ts names is one intake-submit.js collects", () => {
    // A Proxy answering every id makes manifestSegments take all its optional branches, so this
    // sees every field the paragraph can bind — a hardcoded filled record would drift again.
    const filled = new Proxy({} as Record<string, string>, { get: () => "x" });
    const named = new Set([
      ...TAIL_STEPS.flatMap((s) => s.ids),
      ...manifestSegments(filled).map((s) => s.field).filter(Boolean),
    ]);
    expect(named.size).toBeGreaterThan(10);
    for (const id of named) expect(COLLECTED_IDS).toContain(id);
  });

  it("every key intake-submit.js emits is a FIELDS id", () => {
    // One-way on purpose: the schema carries fields /new does not ask (departure-airport, the
    // three certainties). An unknown key is the bug; an unasked field is a scope decision.
    for (const key of EMITTED_KEYS) expect(FIELD_IDS).toContain(key);
  });
});
