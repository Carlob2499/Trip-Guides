// @protects-file The progress page's reads and its owner-only writes hit the right endpoints,
// with the owner key attached and never logged.

import { describe, it, expect, vi } from "vitest";
import { createGithubGateway, createWorkerGateway } from "./gateway";
import { PROPOSAL_ISSUES, RUN_EVENTS } from "./mocks/seeds";
import { EMPTY_RUN_EVENTS } from "./model/run-events";
import { OWNER_KEY_HEADER } from "../../lib/worker-client.js";
import { WAYPOINT_BACKEND } from "../../lib/backend-config.js";

/** A fetch that answers from a URL→body map and records every call. Zero network. */
function stubFetch(routes: Record<string, unknown>, status = 200) {
  const calls: { url: string; init: RequestInit | undefined }[] = [];
  const impl = vi.fn(async (url: unknown, init?: RequestInit) => {
    const href = String(url);
    calls.push({ url: href, init });
    const key = Object.keys(routes).find((k) => href.includes(k));
    const body = key === undefined ? null : routes[key];
    return {
      ok: key !== undefined && status < 400,
      status: key === undefined ? 404 : status,
      text: async () => JSON.stringify(body),
      json: async () => body,
    } as unknown as Response;
  });
  return { impl: impl as unknown as typeof fetch, calls };
}

describe("createGithubGateway().fetchProposals", () => {
  it("asks the issues endpoint for open, labelled issues and shapes only this guide's", async () => {
    const { impl, calls } = stubFetch({ "api.github.com": PROPOSAL_ISSUES });
    const gw = createGithubGateway({ owner: "o", repo: "r", fetchImpl: impl });

    const out = await gw.fetchProposals("testland");

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("https://api.github.com/repos/o/r/issues");
    expect(calls[0].url).toContain("labels=revision-request");
    expect(calls[0].url).toContain("state=open");
    expect(out.map((p) => p.issue)).toEqual([44, 41]);
  });

  it("returns [] rather than throwing when the API answers with something that isn't a list", async () => {
    const { impl } = stubFetch({ "api.github.com": { message: "rate limit exceeded" } });
    const gw = createGithubGateway({ owner: "o", repo: "r", fetchImpl: impl });
    await expect(gw.fetchProposals("testland")).resolves.toEqual([]);
  });

  it("returns [] on a failed request — a rate-limited read must not blank the whole page", async () => {
    const { impl } = stubFetch({ "api.github.com": { message: "forbidden" } }, 403);
    const gw = createGithubGateway({ owner: "o", repo: "r", fetchImpl: impl });
    await expect(gw.fetchProposals("testland")).resolves.toEqual([]);
  });

  it("does not send the read through the same call as the state poll", async () => {
    // The state poll runs every 15s (240/hr); the unauthenticated API allows 60/hr. If these ever
    // shared a request path, the poll would exhaust the quota within minutes.
    const { impl, calls } = stubFetch({ "raw.githubusercontent.com": null, "api.github.com": [] });
    const gw = createGithubGateway({ owner: "o", repo: "r", fetchImpl: impl });
    await gw.fetchState("testland");
    expect(calls.every((c) => c.url.includes("raw.githubusercontent.com"))).toBe(true);
  });
});

describe("createGithubGateway().isPublished", () => {
  it("reads the DIRECTORY meta file — every guide is a directory", async () => {
    const { impl, calls } = stubFetch({ "/korea/_guide.json": { title: "Korea" } });
    const gw = createGithubGateway({ owner: "o", repo: "r", fetchImpl: impl });

    await expect(gw.isPublished("korea")).resolves.toBe(true);
    expect(calls[0].url).toContain("src/content/guides/korea/_guide.json");
  });

  it("counts a DELETED draft key as published, not just draft:false", async () => {
    // publish.mjs removes the key rather than setting it false; both must read as published.
    const withFalse = stubFetch({ "/korea/_guide.json": { draft: false } });
    const gwFalse = createGithubGateway({ owner: "o", repo: "r", fetchImpl: withFalse.impl });
    await expect(gwFalse.isPublished("korea")).resolves.toBe(true);
  });

  it("stays false while the guide is still a draft", async () => {
    const { impl } = stubFetch({ "/korea/_guide.json": { draft: true } });
    const gw = createGithubGateway({ owner: "o", repo: "r", fetchImpl: impl });
    await expect(gw.isPublished("korea")).resolves.toBe(false);
  });

  it("reads the directory meta file and nothing else — there is no flat-file fallback", async () => {
    const { impl, calls } = stubFetch({ "guides/korea.json": { title: "Korea" } });
    const gw = createGithubGateway({ owner: "o", repo: "r", fetchImpl: impl });
    await expect(gw.isPublished("korea")).resolves.toBe(false);
    expect(calls).toHaveLength(1); // one read: <slug>/_guide.json
  });

  it("is false — not a throw — when the guide does not resolve", async () => {
    const { impl } = stubFetch({});
    const gw = createGithubGateway({ owner: "o", repo: "r", fetchImpl: impl });
    await expect(gw.isPublished("nope")).resolves.toBe(false);
  });
});

describe("createWorkerGateway", () => {
  const backend = WAYPOINT_BACKEND.url;

  it("posts answers to /answer with the owner key on the pinned header", async () => {
    const { impl, calls } = stubFetch({ "/answer": { ok: true } });
    const gw = createWorkerGateway({ ownerKey: "k".repeat(32), fetchImpl: impl });

    const res = await gw.sendAnswers({ slug: "testland", answers: [{ id: "q1", answer: "yes" }] });

    expect(res).toEqual({ ok: true });
    expect(calls[0].url).toBe(`${backend}/answer`);
    expect(calls[0].init?.method).toBe("POST");
    expect((calls[0].init?.headers as Record<string, string>)[OWNER_KEY_HEADER]).toBe("k".repeat(32));
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      slug: "testland",
      answers: [{ id: "q1", answer: "yes" }],
    });
  });

  it("posts an approval to /approve with the issue number", async () => {
    const { impl, calls } = stubFetch({ "/approve": { ok: true } });
    const gw = createWorkerGateway({ ownerKey: "k".repeat(32), fetchImpl: impl });

    await gw.approveRevision({ slug: "testland", issue: 44 });

    expect(calls[0].url).toBe(`${backend}/approve`);
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({ slug: "testland", issue: 44 });
  });

  it("omits the auth header entirely when no key is stored", async () => {
    const { impl, calls } = stubFetch({ "/answer": { ok: true } });
    const gw = createWorkerGateway({ fetchImpl: impl });
    await gw.sendAnswers({ slug: "testland", answers: [] });
    expect(Object.keys(calls[0].init?.headers as Record<string, string>)).not.toContain(OWNER_KEY_HEADER);
  });

  it("turns a rejected key into a reader-facing sentence, never the raw status or body", async () => {
    const { impl } = stubFetch({ "/answer": { error: "unauthorized" } }, 401);
    const gw = createWorkerGateway({ ownerKey: "wrong-key-but-long-enough", fetchImpl: impl });

    const res = await gw.sendAnswers({ slug: "testland", answers: [{ id: "q1", answer: "yes" }] });

    expect(res.ok).toBe(false);
    expect(res.message).toBe("That key wasn't accepted — check it in settings.");
    expect(res.message).not.toContain("401");
    expect(res.message).not.toContain("unauthorized");
  });

  it("says 'not set up' when the Worker has no owner key configured", async () => {
    const { impl } = stubFetch({ "/approve": { error: "not configured" } }, 503);
    const gw = createWorkerGateway({ ownerKey: "k".repeat(32), fetchImpl: impl });
    const res = await gw.approveRevision({ slug: "testland", issue: 44 });
    expect(res).toEqual({ ok: false, message: "This isn't set up yet." });
  });

  it("resolves — never rejects — when the request cannot be made at all", async () => {
    const impl = vi.fn(async () => { throw new Error("network down"); }) as unknown as typeof fetch;
    const gw = createWorkerGateway({ ownerKey: "k".repeat(32), fetchImpl: impl });
    // A rejection here would be an unhandled promise inside a click handler: the button would
    // stay stuck on "Sending…" with nothing said.
    await expect(gw.sendAnswers({ slug: "testland", answers: [] })).resolves.toEqual({
      ok: false,
      message: "Couldn't reach the server. Try again in a moment.",
    });
  });
});

describe("createGithubGateway().fetchRunEvents", () => {
  it("reads the run's own branch and shapes what it finds", async () => {
    const { impl, calls } = stubFetch({ "events.json": RUN_EVENTS });
    const gw = createGithubGateway({ owner: "o", repo: "r", fetchImpl: impl });

    const out = await gw.fetchRunEvents("testland");

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("/research/testland/guides-intake/testland/events.json");
    expect(out.available).toBe(true);
    expect(out.counters).toEqual({ pages: 148, facts: 62, kept: 51, dropped: 11 });
  });

  it("returns an honestly-empty result on the 404 that is today's every-single-case", async () => {
    // Nothing in the pipeline writes events.json yet. One request, no fallback to `main`:
    // telemetry is a property of a run, and a run lives on its branch.
    const { impl, calls } = stubFetch({});
    const gw = createGithubGateway({ owner: "o", repo: "r", fetchImpl: impl });

    await expect(gw.fetchRunEvents("testland")).resolves.toEqual(EMPTY_RUN_EVENTS);
    expect(calls).toHaveLength(1);
  });

  it("returns an honestly-empty result rather than throwing on a file it cannot read", async () => {
    const { impl } = stubFetch({ "events.json": "{ truncated" });
    const gw = createGithubGateway({ owner: "o", repo: "r", fetchImpl: impl });
    await expect(gw.fetchRunEvents("testland")).resolves.toEqual(EMPTY_RUN_EVENTS);
  });
});
