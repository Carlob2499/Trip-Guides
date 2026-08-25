import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { buildSyncProofBundle } from "./fixtures/sync-proof-bundle";

type BackendMode = "offline" | "online" | "transient-error" | "permanent-error";
type TransportRequest = { op: "read" | "set"; path: string; value?: unknown };

class CanonicalBackend {
  mode: BackendMode = "online";
  acceptedWriteCount = 0;
  readonly values = new Map<string, unknown>();

  async handle(request: TransportRequest): Promise<unknown> {
    if (request.op === "read") {
      if (this.mode === "offline") throw new Error("unavailable");
      return this.read(request.path);
    }
    if (this.mode === "offline") return new Promise<never>(() => {});
    if (this.mode === "transient-error") throw new Error("unavailable");
    if (this.mode === "permanent-error") throw new Error("permission_denied");
    this.acceptedWriteCount += 1;
    if (request.value === null) this.values.delete(request.path);
    else this.values.set(request.path, structuredClone(request.value));
    return null;
  }

  read(path: string): unknown {
    if (this.values.has(path)) return structuredClone(this.values.get(path));
    const prefix = path + "/";
    const children: Record<string, unknown> = {};
    for (const [candidate, value] of this.values) {
      if (!candidate.startsWith(prefix)) continue;
      const child = candidate.slice(prefix.length);
      if (!child || child.includes("/")) continue;
      children[child] = structuredClone(value);
    }
    return children;
  }
}

type ProofCollection = {
  onChange(callback: (value: Record<string, unknown>) => void): () => void;
  add(value: Record<string, unknown>): string;
  addAsync(value: Record<string, unknown>): Promise<string>;
};
type ProofRoom = { collection(name: string): ProofCollection };
type ProofSync = { joinTrip(code: string): Promise<ProofRoom> };
type ProofWindow = typeof globalThis & {
  __proofSync?: ProofSync;
  __proofRoom?: ProofRoom;
  __proofRecords?: Record<string, unknown>;
  __proofPending?: Promise<string>;
  __proofSyncErrors?: Array<{ path: string; permanent: boolean; code: string }>;
};

let bundle = "";

test.beforeAll(async () => {
  bundle = await buildSyncProofBundle();
});

async function installTransport(context: BrowserContext, backend: CanonicalBackend) {
  await context.exposeFunction("__waypointProofTransport", (request: TransportRequest) => backend.handle(request));
  await context.route("**/__sync-proof.js*", (route) => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: bundle,
  }));
}

async function openProofPage(page: Page) {
  const response = await page.goto("/Trip-Guides/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);
  await page.evaluate(async () => {
    const moduleUrl = "/__sync-proof.js?browser-proof";
    const proof = globalThis as ProofWindow;
    proof.__proofSync = await import(moduleUrl) as unknown as ProofSync;
  });
}

async function joinAndObserve(page: Page, roomCode: string, collectionName = "expenses") {
  await page.evaluate(async ({ code, name }) => {
    const proof = globalThis as ProofWindow;
    const room = await proof.__proofSync?.joinTrip(code);
    if (!room) throw new Error("proof sync module was not loaded");
    proof.__proofRoom = room;
    room.collection(name).onChange((records) => { proof.__proofRecords = records; });
  }, { code: roomCode, name: collectionName });
}

async function outboxPaths(page: Page): Promise<string[]> {
  return page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("tg-outbox") || "{}") as Record<string, unknown>));
}

async function rejectedOutbox(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => JSON.parse(localStorage.getItem("tg-outbox-rejected") || "{}") as Record<string, unknown>);
}

async function acknowledgedOutbox(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => JSON.parse(localStorage.getItem("tg-outbox-acked") || "{}") as Record<string, unknown>);
}

test("offline collection.add survives tab recreation, drains once, and converges in a second client", async ({ browser }) => {
  const roomCode = "offlineproofroom1";
  const backend = new CanonicalBackend();
  backend.mode = "offline";
  const firstContext = await browser.newContext();
  await installTransport(firstContext, backend);

  let page = await firstContext.newPage();
  await openProofPage(page);
  await joinAndObserve(page, roomCode);
  const id = await page.evaluate(() => {
    const proof = globalThis as ProofWindow;
    return proof.__proofRoom?.collection("expenses").add({ label: "Airport train", amount: 21 });
  });
  expect(id).toBe("proof-key-0001");
  if (!id) throw new Error("collection.add did not return a stable record id");
  await expect.poll(() => page.evaluate(() => Object.keys((globalThis as ProofWindow).__proofRecords || {}).length)).toBe(1);
  expect(await outboxPaths(page)).toEqual([`trips/${roomCode}/expenses/${id}`]);
  expect(backend.values.size).toBe(0);

  await page.close();
  backend.mode = "online";
  page = await firstContext.newPage();
  await openProofPage(page);
  await joinAndObserve(page, roomCode);
  await expect.poll(() => outboxPaths(page)).toEqual([]);
  await expect.poll(() => backend.acceptedWriteCount).toBe(1);
  expect(Object.keys(backend.read(`trips/${roomCode}/expenses`) as Record<string, unknown>)).toEqual([id]);
  expect(backend.read(`trips/${roomCode}/expenses/${id}`)).toEqual({
    createdBy: "proof-browser-user",
    createdAt: expect.any(Number),
    label: "Airport train",
    amount: 21,
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  await openProofPage(page);
  await joinAndObserve(page, roomCode);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await outboxPaths(page)).toEqual([]);
  expect(backend.acceptedWriteCount).toBe(1);

  const secondContext = await browser.newContext();
  await installTransport(secondContext, backend);
  const secondPage = await secondContext.newPage();
  await openProofPage(secondPage);
  await joinAndObserve(secondPage, roomCode);
  await expect.poll(() => secondPage.evaluate(() => Object.keys((globalThis as ProofWindow).__proofRecords || {}).length)).toBe(1);
  expect(await secondPage.evaluate(() => Object.keys((globalThis as ProofWindow).__proofRecords || {}))).toEqual([id]);
  expect(await secondPage.evaluate((recordId) => (globalThis as ProofWindow).__proofRecords?.[recordId], id)).toEqual({
    createdBy: "proof-browser-user",
    createdAt: expect.any(Number),
    label: "Airport train",
    amount: 21,
  });

  await secondContext.close();
  await firstContext.close();
});

test("offline collection.addAsync survives recreation, drains once, and converges without duplication", async ({ browser }) => {
  const roomCode = "asyncproofroom001";
  const backend = new CanonicalBackend();
  backend.mode = "offline";
  const firstContext = await browser.newContext();
  await installTransport(firstContext, backend);
  let page = await firstContext.newPage();
  await openProofPage(page);
  await joinAndObserve(page, roomCode, "feedback");

  await page.evaluate(() => {
    const proof = globalThis as ProofWindow;
    proof.__proofPending = proof.__proofRoom?.collection("feedback").addAsync({ note: "Keep this locally" });
  });

  await expect.poll(() => page.evaluate(() => Object.keys((globalThis as ProofWindow).__proofRecords || {}).length)).toBe(1);
  const pendingPaths = await outboxPaths(page);
  expect(pendingPaths, "a timed-out addAsync write must already be durable before the tab can close").toEqual([
    `trips/${roomCode}/feedback/proof-key-0001`,
  ]);
  expect(backend.values.size).toBe(0);

  await page.close();
  backend.mode = "online";
  page = await firstContext.newPage();
  await openProofPage(page);
  await joinAndObserve(page, roomCode, "feedback");
  await expect.poll(() => outboxPaths(page)).toEqual([]);
  await expect.poll(() => backend.acceptedWriteCount).toBe(1);
  expect(Object.keys(backend.read(`trips/${roomCode}/feedback`) as Record<string, unknown>)).toEqual(["proof-key-0001"]);
  expect(backend.read(`trips/${roomCode}/feedback/proof-key-0001`)).toEqual({
    createdBy: "proof-browser-user",
    createdAt: expect.any(Number),
    note: "Keep this locally",
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  await openProofPage(page);
  await joinAndObserve(page, roomCode, "feedback");
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await outboxPaths(page)).toEqual([]);
  expect(backend.acceptedWriteCount).toBe(1);

  const secondContext = await browser.newContext();
  await installTransport(secondContext, backend);
  const secondPage = await secondContext.newPage();
  await openProofPage(secondPage);
  await joinAndObserve(secondPage, roomCode, "feedback");
  await expect.poll(() => secondPage.evaluate(() => Object.keys((globalThis as ProofWindow).__proofRecords || {}).length)).toBe(1);
  expect(await secondPage.evaluate(() => Object.keys((globalThis as ProofWindow).__proofRecords || {}))).toEqual(["proof-key-0001"]);
  expect(await secondPage.evaluate(() => (globalThis as ProofWindow).__proofRecords?.["proof-key-0001"])).toEqual({
    createdBy: "proof-browser-user",
    createdAt: expect.any(Number),
    note: "Keep this locally",
  });

  await secondContext.close();
  await firstContext.close();
});

async function captureSyncErrors(page: Page) {
  await page.evaluate(() => {
    const proof = globalThis as ProofWindow;
    proof.__proofSyncErrors = [];
    document.addEventListener("tg:sync-error", ((event: CustomEvent<{ path: string; permanent: boolean; code: string }>) => {
      proof.__proofSyncErrors?.push(event.detail);
    }) as EventListener);
  });
}

test("addAsync keeps a transient rejection pending and durable without apparent success", async ({ browser }) => {
  const backend = new CanonicalBackend();
  backend.mode = "transient-error";
  const context = await browser.newContext();
  await installTransport(context, backend);
  const page = await context.newPage();
  await openProofPage(page);
  await joinAndObserve(page, "transientroom001", "feedback");
  await captureSyncErrors(page);

  const result = await page.evaluate(async () => {
    const proof = globalThis as ProofWindow;
    const write = proof.__proofRoom?.collection("feedback").addAsync({ note: "Retry this" });
    if (!write) throw new Error("proof room was not loaded");
    return Promise.race([
      write.then(() => "resolved", () => "rejected"),
      new Promise<"pending">((resolve) => setTimeout(() => resolve("pending"), 50)),
    ]);
  });

  expect(result).toBe("pending");
  expect(await outboxPaths(page)).toEqual(["trips/transientroom001/feedback/proof-key-0001"]);
  expect(backend.values.size).toBe(0);
  expect(await page.evaluate(() => (globalThis as ProofWindow).__proofSyncErrors)).toEqual([
    expect.objectContaining({ path: "trips/transientroom001/feedback/proof-key-0001", permanent: false }),
  ]);
  await context.close();
});

test("collection adds stop before the backend when initial active persistence fails", async ({ browser }) => {
  const roomCode = "persistencefail001";
  const backend = new CanonicalBackend();
  const context = await browser.newContext();
  await installTransport(context, backend);
  const page = await context.newPage();
  await openProofPage(page);
  await joinAndObserve(page, roomCode, "feedback");
  await captureSyncErrors(page);

  const result = await page.evaluate(async () => {
    const proof = globalThis as ProofWindow;
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "tg-outbox") throw new DOMException("Storage quota unavailable", "QuotaExceededError");
      return originalSetItem.call(this, key, value);
    };
    try {
      const write = proof.__proofRoom?.collection("feedback").addAsync({ note: "Must be durable first" });
      if (!write) throw new Error("proof room was not loaded");
      const asyncResult = await write.then(
        (key) => ({ state: "resolved" as const, key }),
        (error: unknown) => {
          const candidate = error as { name?: unknown; code?: unknown; message?: unknown };
          return {
            state: "rejected" as const,
            name: String(candidate?.name || ""),
            code: String(candidate?.code || ""),
            message: String(candidate?.message || error),
          };
        },
      );
      let addResult: { state: "returned"; key: string } | { state: "threw"; name: string; code: string; message: string };
      try {
        const key = proof.__proofRoom?.collection("feedback").add({ note: "Must also be durable first" });
        addResult = { state: "returned", key: String(key) };
      } catch (error) {
        const candidate = error as { name?: unknown; code?: unknown; message?: unknown };
        addResult = {
          state: "threw",
          name: String(candidate?.name || ""),
          code: String(candidate?.code || ""),
          message: String(candidate?.message || error),
        };
      }
      return { asyncResult, addResult };
    } finally {
      Storage.prototype.setItem = originalSetItem;
    }
  });

  expect(result).toEqual({
    asyncResult: {
      state: "rejected",
      name: "WaypointSyncDurabilityError",
      code: "outbox-write-failed",
      message: "Could not persist trips/persistencefail001/feedback/proof-key-0001 before sending",
    },
    addResult: {
      state: "threw",
      name: "WaypointSyncDurabilityError",
      code: "outbox-write-failed",
      message: "Could not persist trips/persistencefail001/feedback/proof-key-0002 before sending",
    },
  });
  expect(await outboxPaths(page)).toEqual([]);
  expect(backend.acceptedWriteCount).toBe(0);
  expect(backend.values.size).toBe(0);
  expect(await page.evaluate(() => Object.keys((globalThis as ProofWindow).__proofRecords || {}))).toEqual([]);
  expect(await page.evaluate(() => (globalThis as ProofWindow).__proofSyncErrors)).toEqual([
    { path: `trips/${roomCode}/feedback/proof-key-0001`, permanent: true, code: "outbox-write-failed" },
    { path: `trips/${roomCode}/feedback/proof-key-0002`, permanent: true, code: "outbox-write-failed" },
  ]);
  await context.close();
});

test("an ack-removal storage failure is surfaced and cannot replay a duplicate canonical write", async ({ browser }) => {
  const roomCode = "ackcleanupfail001";
  const fullPath = `trips/${roomCode}/feedback/proof-key-0001`;
  const backend = new CanonicalBackend();
  const context = await browser.newContext();
  await installTransport(context, backend);
  const page = await context.newPage();
  await openProofPage(page);
  await joinAndObserve(page, roomCode, "feedback");
  await captureSyncErrors(page);

  const result = await page.evaluate(async (path) => {
    const proof = globalThis as ProofWindow;
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "tg-outbox" && !(path in (JSON.parse(value) as Record<string, unknown>))) {
        throw new DOMException("Storage quota unavailable", "QuotaExceededError");
      }
      return originalSetItem.call(this, key, value);
    };
    const write = proof.__proofRoom?.collection("feedback").addAsync({ note: "Accepted exactly once" });
    if (!write) throw new Error("proof room was not loaded");
    return write.then(
      (key) => ({ state: "resolved" as const, key }),
      (error: unknown) => {
        const candidate = error as { name?: unknown; code?: unknown; message?: unknown };
        return {
          state: "rejected" as const,
          name: String(candidate?.name || ""),
          code: String(candidate?.code || ""),
          message: String(candidate?.message || error),
        };
      },
    );
  }, fullPath);

  expect(result).toEqual({
    state: "rejected",
    name: "WaypointSyncDurabilityError",
    code: "outbox-ack-cleanup-failed",
    message: `Server acknowledged ${fullPath}, but its active retry entry could not be removed`,
  });
  expect(backend.acceptedWriteCount).toBe(1);
  expect(await outboxPaths(page)).toEqual([fullPath]);
  expect(await acknowledgedOutbox(page)).toEqual({ [fullPath]: true });
  expect(await page.evaluate(() => (globalThis as ProofWindow).__proofSyncErrors)).toEqual([
    { path: fullPath, permanent: true, code: "outbox-ack-cleanup-failed" },
  ]);

  await page.reload({ waitUntil: "domcontentloaded" });
  await openProofPage(page);
  await joinAndObserve(page, roomCode, "feedback");
  await expect.poll(() => outboxPaths(page)).toEqual([]);
  await expect.poll(() => acknowledgedOutbox(page)).toEqual({});
  expect(backend.acceptedWriteCount).toBe(1);
  expect([...backend.values.keys()]).toEqual([fullPath]);
  expect(backend.read(fullPath)).toEqual({
    createdBy: "proof-browser-user",
    createdAt: expect.anything(),
    note: "Accepted exactly once",
  });
  await context.close();
});

test("a terminal entry left active cannot evict legitimate queued capacity", async ({ browser }) => {
  const roomCode = "terminalcapacity001";
  const seedRoom = "terminalcapacityseed001";
  const permanentPath = `trips/${roomCode}/feedback/proof-key-0001`;
  const transientPath = `trips/${roomCode}/feedback/proof-key-0002`;
  const permanentPayload = { note: "Preserve this rejected payload", nested: { traveler: "Ari" } };
  const legitimatePaths = Array.from({ length: 49 }, (_, index) =>
    `trips/${seedRoom}/feedback/seed-key-${String(index + 1).padStart(4, "0")}`);
  const backend = new CanonicalBackend();
  backend.mode = "permanent-error";
  const context = await browser.newContext();
  await installTransport(context, backend);
  const page = await context.newPage();
  await openProofPage(page);
  await page.evaluate(({ paths, terminalPath }) => {
    const active = Object.fromEntries(paths.map((path, index) => [path, {
      createdBy: "proof-browser-user",
      createdAt: 1_700_000_000_000 + index,
      note: `Legitimate queued entry ${index + 1}`,
    }]));
    localStorage.setItem("tg-outbox", JSON.stringify(active));
    const originalSetItem = Storage.prototype.setItem;
    let failedTerminalRemoval = false;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (
        !failedTerminalRemoval
        && key === "tg-outbox"
        && !(terminalPath in (JSON.parse(value) as Record<string, unknown>))
      ) {
        failedTerminalRemoval = true;
        throw new DOMException("Selective active prune failure", "QuotaExceededError");
      }
      return originalSetItem.call(this, key, value);
    };
  }, { paths: legitimatePaths, terminalPath: permanentPath });
  await joinAndObserve(page, roomCode, "feedback");

  const permanentResult = await page.evaluate(async (payload) => {
    const proof = globalThis as ProofWindow;
    const write = proof.__proofRoom?.collection("feedback").addAsync(payload);
    if (!write) throw new Error("proof room was not loaded");
    return write.then(
      () => "resolved",
      (error: unknown) => String((error as { code?: unknown; message?: unknown })?.code
        || (error as { message?: unknown })?.message
        || error),
    );
  }, permanentPayload);
  expect(permanentResult).toBe("permission_denied");
  expect(await outboxPaths(page)).toEqual([...legitimatePaths, permanentPath]);
  expect(await rejectedOutbox(page)).toEqual({
    [permanentPath]: {
      value: {
        createdBy: "proof-browser-user",
        createdAt: expect.any(Number),
        ...permanentPayload,
      },
      queuedAt: expect.any(Number),
      rejectedAt: expect.any(Number),
      code: "permission_denied",
    },
  });

  backend.mode = "transient-error";
  const transientResult = await page.evaluate(async () => {
    const proof = globalThis as ProofWindow;
    const write = proof.__proofRoom?.collection("feedback").addAsync({ note: "Keep all legitimate capacity" });
    if (!write) throw new Error("proof room was not loaded");
    return Promise.race([
      write.then(() => "resolved", () => "rejected"),
      new Promise<"pending">((resolve) => setTimeout(() => resolve("pending"), 50)),
    ]);
  });

  expect(transientResult).toBe("pending");
  expect(await outboxPaths(page)).toEqual([...legitimatePaths, transientPath]);
  expect(await rejectedOutbox(page)).toEqual({
    [permanentPath]: expect.objectContaining({
      value: expect.objectContaining(permanentPayload),
      code: "permission_denied",
    }),
  });
  expect(backend.acceptedWriteCount).toBe(0);
  await context.close();
});

test("addAsync isolates a permanent rejection without consuming active capacity or retrying it", async ({ browser }) => {
  const roomCode = "permanentroom001";
  const permanentPath = `trips/${roomCode}/feedback/proof-key-0001`;
  const transientPath = `trips/${roomCode}/feedback/proof-key-0002`;
  const seedRoom = "capacityseed001";
  const permanentPayload = {
    note: "Do not claim success",
    traveler: { name: "Ari", constraints: ["step-free", "no shellfish"] },
  };
  const backend = new CanonicalBackend();
  backend.mode = "permanent-error";
  const context = await browser.newContext();
  await installTransport(context, backend);
  let page = await context.newPage();
  await openProofPage(page);
  await page.evaluate(({ otherRoom }) => {
    const active: Record<string, unknown> = {};
    for (let index = 1; index <= 49; index += 1) {
      const key = `seed-key-${String(index).padStart(4, "0")}`;
      active[`trips/${otherRoom}/feedback/${key}`] = {
        createdBy: "proof-browser-user",
        createdAt: 1_700_000_000_000 + index,
        note: `Legitimate queued entry ${index}`,
      };
    }
    localStorage.setItem("tg-outbox", JSON.stringify(active));
  }, { otherRoom: seedRoom });
  await joinAndObserve(page, roomCode, "feedback");
  await captureSyncErrors(page);

  const result = await page.evaluate(async (payload) => {
    const proof = globalThis as ProofWindow;
    const write = proof.__proofRoom?.collection("feedback").addAsync(payload);
    if (!write) throw new Error("proof room was not loaded");
    return Promise.race([
      write.then(
        (key) => ({ state: "resolved" as const, key }),
        (error: unknown) => {
          const candidate = error as { name?: unknown; code?: unknown; message?: unknown };
          return {
            state: "rejected" as const,
            name: String(candidate?.name || ""),
            code: String(candidate?.code || candidate?.message || error),
            message: String(candidate?.message || error),
          };
        },
      ),
      new Promise<{ state: "pending" }>((resolve) => setTimeout(() => resolve({ state: "pending" }), 50)),
    ]);
  }, permanentPayload);

  const activeAfterRejection = await outboxPaths(page);
  const rejectedAfterRejection = await rejectedOutbox(page);
  expect({ result, activePaths: activeAfterRejection, rejected: rejectedAfterRejection }).toEqual({
    result: {
      state: "rejected",
      name: "Error",
      code: "permission_denied",
      message: "permission_denied",
    },
    activePaths: Array.from({ length: 49 }, (_, index) =>
      `trips/${seedRoom}/feedback/seed-key-${String(index + 1).padStart(4, "0")}`),
    rejected: {
      [permanentPath]: {
        value: {
          createdBy: "proof-browser-user",
          createdAt: expect.any(Number),
          ...permanentPayload,
        },
        queuedAt: expect.any(Number),
        rejectedAt: expect.any(Number),
        code: "permission_denied",
      },
    },
  });
  const rejectedPermanent = rejectedAfterRejection[permanentPath] as {
    value: { createdAt: number };
    queuedAt: number;
    rejectedAt: number;
  };
  expect(rejectedPermanent.queuedAt).toBe(rejectedPermanent.value.createdAt);
  expect(rejectedPermanent.rejectedAt).toBeGreaterThanOrEqual(rejectedPermanent.queuedAt);
  expect(backend.values.size).toBe(0);
  expect(await page.evaluate(() => (globalThis as ProofWindow).__proofSyncErrors)).toEqual([
    expect.objectContaining({ path: permanentPath, permanent: true, code: "permission_denied" }),
  ]);

  backend.mode = "transient-error";
  const transientResult = await page.evaluate(async () => {
    const proof = globalThis as ProofWindow;
    const write = proof.__proofRoom?.collection("feedback").addAsync({ note: "Replay this once" });
    if (!write) throw new Error("proof room was not loaded");
    return Promise.race([
      write.then(() => "resolved", () => "rejected"),
      new Promise<"pending">((resolve) => setTimeout(() => resolve("pending"), 50)),
    ]);
  });
  expect(transientResult).toBe("pending");
  expect(await outboxPaths(page)).toEqual([
    ...Array.from({ length: 49 }, (_, index) =>
      `trips/${seedRoom}/feedback/seed-key-${String(index + 1).padStart(4, "0")}`),
    transientPath,
  ]);

  await page.close();
  backend.mode = "online";
  page = await context.newPage();
  await openProofPage(page);
  await joinAndObserve(page, roomCode, "feedback");
  await expect.poll(() => outboxPaths(page)).toEqual(Array.from({ length: 49 }, (_, index) =>
    `trips/${seedRoom}/feedback/seed-key-${String(index + 1).padStart(4, "0")}`));
  await expect.poll(() => backend.acceptedWriteCount).toBe(1);
  expect([...backend.values.keys()]).toEqual([transientPath]);
  expect(backend.read(`trips/${roomCode}/feedback`)).toEqual({
    "proof-key-0002": {
      createdBy: "proof-browser-user",
      createdAt: expect.any(Number),
      note: "Replay this once",
    },
  });
  expect(await rejectedOutbox(page)).toEqual(rejectedAfterRejection);
  expect(await page.evaluate(() => localStorage.getItem("tg-proof-push-seq"))).toBe("2");
  await context.close();
});
