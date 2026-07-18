import { describe, expect, it } from "vitest";
import { decodeVote, encodeVote, isVoteState } from "./vote-link";

const STATE = { options: [{ text: "Gwangjang Market", votes: 3 }, { text: "Myeongdong", votes: 1 }] };

describe("encodeVote / decodeVote", () => {
  it("round-trips a vote state through the URL-safe payload", () => {
    expect(decodeVote(encodeVote(STATE))).toEqual(STATE);
  });

  it("produces a URL-safe payload (no + / = that a query string would mangle)", () => {
    const p = encodeVote(STATE);
    expect(p).not.toMatch(/[+/=]/);
  });

  it("round-trips non-ASCII option text (Hangul survives the utf-8 base64)", () => {
    const s = { options: [{ text: "광장시장", votes: 2 }] };
    expect(decodeVote(encodeVote(s))).toEqual(s);
  });

  it("returns null for garbage or a non-vote payload instead of throwing", () => {
    expect(decodeVote("not%%%base64")).toBeNull();
    expect(decodeVote(encodeVote({ nope: 1 }))).toBeNull(); // valid base64, wrong shape
    expect(decodeVote(encodeVote(null))).toBeNull();
    expect(decodeVote("")).toBeNull();
  });
});

describe("isVoteState", () => {
  it("accepts only objects carrying an options array", () => {
    expect(isVoteState({ options: [] })).toBe(true);
    expect(isVoteState({ options: {} })).toBe(false);
    expect(isVoteState(null)).toBe(false);
    expect(isVoteState("x")).toBe(false);
  });
});
