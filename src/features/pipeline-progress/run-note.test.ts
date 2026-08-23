import { describe, expect, it, vi } from "vitest";
import {
  createRunNoteWorkerGateway,
  resolveRunNoteTarget,
  runNoteFailureMessage,
} from "./run-note";

const slug = "uruguay";
const runId = "uruguay-20260823-9789de";
const issue = 77;

type ResolveArgs = Parameters<typeof resolveRunNoteTarget>[0];
type IdentitySnapshot = Awaited<ReturnType<ResolveArgs["gateway"]["fetchRun"]>>;

function gateway(snapshot: IdentitySnapshot): ResolveArgs["gateway"] {
  return {
    fetchRun: vi.fn().mockResolvedValue(snapshot),
  };
}

function makeFetchMock() {
  type FetchFn = (...args: Parameters<typeof fetch>) => Promise<Response>;
  const mock = vi.fn<FetchFn>();
  const fetchImpl: typeof fetch = (...args) => mock(...args);
  return { mock, fetchImpl };
}

function envelope(overrides: Record<string, unknown> = {}) {
  const raw = {
    schemaVersion: "wp-run/2.1",
    slug,
    runId,
    issue,
    ...overrides,
  };
  return { content: Buffer.from(JSON.stringify(raw), "utf8").toString("base64") };
}

describe("Progress run-note client", () => {
  it("never asks for an issue when the generation authority says V1", async () => {
    const { mock, fetchImpl } = makeFetchMock();
    const result = await resolveRunNoteTarget({
      slug,
      gateway: gateway({ version: 1, runId: null, malformed: false, conflict: false }),
      owner: "Carlob2499",
      repo: "Trip-Guides",
      fetchImpl,
    });
    expect(result).toEqual({ ok: false, reason: "not-v2" });
    expect(mock).not.toHaveBeenCalled();
  });

  it("refuses conflict and malformed snapshots before any raw-record lookup", async () => {
    for (const snapshot of [
      { version: 2 as const, runId, malformed: false, conflict: true },
      { version: 2 as const, runId, malformed: true, conflict: false },
    ]) {
      const { mock, fetchImpl } = makeFetchMock();
      const result = await resolveRunNoteTarget({
        slug,
        gateway: gateway(snapshot),
        owner: "Carlob2499",
        repo: "Trip-Guides",
        fetchImpl,
      });
      expect(result.ok).toBe(false);
      expect(mock).not.toHaveBeenCalled();
    }
  });

  it("returns the durable issue only when the V2 raw record matches the resolved run", async () => {
    const { mock, fetchImpl } = makeFetchMock();
    mock.mockResolvedValueOnce(new Response(JSON.stringify(envelope()), { status: 200 }));
    const result = await resolveRunNoteTarget({
      slug,
      gateway: gateway({ version: 2, runId, malformed: false, conflict: false }),
      owner: "Carlob2499",
      repo: "Trip-Guides",
      fetchImpl,
    });
    expect(result).toEqual({ ok: true, target: { slug, runId, issue } });
  });

  it("does not fall through to main when an active V2 branch belongs to another run", async () => {
    const { mock, fetchImpl } = makeFetchMock();
    mock.mockResolvedValueOnce(
      new Response(JSON.stringify(envelope({ runId: "uruguay-20260823-new" })), { status: 200 }),
    );
    const result = await resolveRunNoteTarget({
      slug,
      gateway: gateway({ version: 2, runId, malformed: false, conflict: false }),
      owner: "Carlob2499",
      repo: "Trip-Guides",
      fetchImpl,
    });
    expect(result).toEqual({ ok: false, reason: "stale" });
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("uses main only when the active V2 branch record is absent", async () => {
    const { mock, fetchImpl } = makeFetchMock();
    mock
      .mockResolvedValueOnce(new Response("missing", { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(envelope()), { status: 200 }));
    const result = await resolveRunNoteTarget({
      slug,
      gateway: gateway({ version: 2, runId, malformed: false, conflict: false }),
      owner: "Carlob2499",
      repo: "Trip-Guides",
      fetchImpl,
    });
    expect(result).toEqual({ ok: true, target: { slug, runId, issue } });
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it("sends the exact run tuple through the shared Worker client with owner auth", async () => {
    const { mock, fetchImpl } = makeFetchMock();
    mock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, id: 42 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const worker = createRunNoteWorkerGateway({
      ownerKey: "0123456789abcdef0123456789abcdef",
      fetchImpl,
    });
    const result = await worker.sendNote({ slug, runId, issue }, "Check the transfer.");
    expect(result.ok).toBe(true);
    const [url, init] = mock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(String(url)).toMatch(/\/note$/);
    expect(headers.get("X-Owner-Key")).toBe("0123456789abcdef0123456789abcdef");
    const body = typeof init?.body === "string" ? init.body : "{}";
    expect(JSON.parse(body)).toEqual({ slug, runId, issue, note: "Check the transfer." });
  });

  it("keeps auth, setup, network and stale-run failures honest", () => {
    expect(runNoteFailureMessage({ ok: false, status: 401, error: "bad key" })).toMatch(/key wasn't accepted/i);
    expect(runNoteFailureMessage({ ok: false, status: 503, error: "not configured" })).toMatch(/isn't set up/i);
    expect(runNoteFailureMessage({ ok: false, status: 0, error: "offline" })).toMatch(/Couldn't reach/i);
    expect(runNoteFailureMessage({ ok: false, status: 409, error: "stale" })).toMatch(/run changed/i);
  });
});
