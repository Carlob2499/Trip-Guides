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

test("addAsync keeps a permanent rejection pending and durable without apparent success", async ({ browser }) => {
  const backend = new CanonicalBackend();
  backend.mode = "permanent-error";
  const context = await browser.newContext();
  await installTransport(context, backend);
  const page = await context.newPage();
  await openProofPage(page);
  await joinAndObserve(page, "permanentroom001", "feedback");
  await captureSyncErrors(page);

  const result = await page.evaluate(async () => {
    const proof = globalThis as ProofWindow;
    const write = proof.__proofRoom?.collection("feedback").addAsync({ note: "Do not claim success" });
    if (!write) throw new Error("proof room was not loaded");
    return Promise.race([
      write.then(() => "resolved", () => "rejected"),
      new Promise<"pending">((resolve) => setTimeout(() => resolve("pending"), 50)),
    ]);
  });

  expect(result).toBe("pending");
  expect(await outboxPaths(page)).toEqual(["trips/permanentroom001/feedback/proof-key-0001"]);
  expect(backend.values.size).toBe(0);
  expect(await page.evaluate(() => (globalThis as ProofWindow).__proofSyncErrors)).toEqual([
    expect.objectContaining({ path: "trips/permanentroom001/feedback/proof-key-0001", permanent: true }),
  ]);
  await context.close();
});
