import { describe, expect, it, vi } from "vitest";
import { handleNote } from "../../worker/note-entry.mjs";

const OWNER_KEY = "0123456789abcdef0123456789abcdef";
const ORIGIN = "https://carlob2499.github.io";
const env = {
  OWNER_KEY,
  GH_TOKEN: "gh-test-token",
  REPO: "Carlob2499/Trip-Guides",
  ALLOWED_ORIGIN: ORIGIN,
};
const target = {
  slug: "uruguay",
  runId: "uruguay-20260823-9789de",
  issue: 77,
  note: "Please verify the airport transfer before the next pass.",
};

function request(body = target, headers = {}) {
  return new Request("https://worker.example/note", {
    method: "POST",
    headers: {
      Origin: ORIGIN,
      "Content-Type": "application/json",
      "X-Owner-Key": OWNER_KEY,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function runEnvelope(overrides = {}) {
  const run = {
    schemaVersion: "wp-run/2.1",
    slug: target.slug,
    runId: target.runId,
    issue: target.issue,
    ...overrides,
  };
  return { content: Buffer.from(JSON.stringify(run), "utf8").toString("base64") };
}

describe("Worker POST /note", () => {
  it("fails closed on a wrong owner key without touching GitHub", async () => {
    const fetchImpl = vi.fn();
    const res = await handleNote(request(target, { "X-Owner-Key": "x".repeat(32) }), env, fetchImpl);
    expect(res.status).toBe(401);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects a request from the wrong origin before authentication or GitHub I/O", async () => {
    const fetchImpl = vi.fn();
    const res = await handleNote(request(target, { Origin: "https://evil.example" }), env, fetchImpl);
    expect(res.status).toBe(403);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("refuses a stale browser target when the active V2 branch belongs to another run", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(runEnvelope({
      runId: "uruguay-20260823-newrun",
    })), { status: 200 }));
    const res = await handleNote(request(), env, fetchImpl);
    expect(res.status).toBe(409);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("posts only after the active V2 record proves the slug + runId + issue tuple", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(runEnvelope()), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 12345 }), { status: 201 }));

    const res = await handleNote(request(), env, fetchImpl);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, id: 12345 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    const [verifyUrl, verifyInit] = fetchImpl.mock.calls[0];
    expect(verifyUrl).toContain("guides-intake/uruguay/run.v2.json");
    expect(verifyUrl).toContain(encodeURIComponent("research-v2/uruguay"));
    expect(verifyInit.method).toBe("GET");

    const [commentUrl, commentInit] = fetchImpl.mock.calls[1];
    expect(commentUrl).toContain("/issues/77/comments");
    const posted = JSON.parse(commentInit.body);
    expect(posted.body).toContain(`waypoint-run-note:${target.runId}`);
    expect(posted.body).toContain(target.note);
    expect(posted.body).not.toContain(OWNER_KEY);
  });

  it("can verify a durable main record only when no active V2 branch record exists", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response("not found", { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(runEnvelope()), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 7 }), { status: 201 }));
    const res = await handleNote(request(), env, fetchImpl);
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("reports GitHub comment failure without pretending the note was sent", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(runEnvelope()), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "boom" }), { status: 500 }));
    const res = await handleNote(request(), env, fetchImpl);
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "could not send the note" });
  });
});
