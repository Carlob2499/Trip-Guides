import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { buildSyncProofBundle } from "./fixtures/sync-proof-bundle";

type BackendMode = "offline" | "online" | "transient-error" | "permanent-error";
type TransportRequest = { op: "read" | "set"; path: string; value?: unknown };

class CanonicalBackend {
  mode: BackendMode = "online";
  acceptedWriteCount = 0;
  readonly setAttemptPaths: string[] = [];
  readonly values = new Map<string, unknown>();

  async handle(request: TransportRequest): Promise<unknown> {
    if (request.op === "read") {
      if (this.mode === "offline") throw new Error("unavailable");
      return this.read(request.path);
    }
    this.setAttemptPaths.push(request.path);
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
type ProofSurveyAttempt = { resolve: (key: string) => void; reject: (error: Error) => void };
type ProofWindow = typeof globalThis & {
  __proofSync?: ProofSync;
  __proofInitFeedback?: () => void;
  __proofRoom?: ProofRoom;
  __proofSurveyRoom?: ProofRoom;
  __proofSurveyAttempts?: ProofSurveyAttempt[];
  __proofSurveyInvocationCount?: number;
  __proofRecords?: Record<string, unknown>;
  __proofPending?: Promise<string>;
  __proofSyncErrors?: Array<{ path: string; permanent: boolean; code: string }>;
};

let bundle = "";
const OUTBOX_METADATA_KEY = "__waypoint_outbox_metadata_v1__";

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
    const proofModule = await import(moduleUrl) as unknown as ProofSync & { initFeedback: () => void };
    proof.__proofSync = proofModule;
    proof.__proofInitFeedback = proofModule.initFeedback;
  });
}

async function installControlledSurvey(page: Page) {
  await page.evaluate(() => {
    const proof = globalThis as ProofWindow;
    proof.__proofSurveyAttempts = [];
    proof.__proofSurveyInvocationCount = 0;
    proof.__proofSurveyRoom = {
      collection: () => ({
        onChange: () => () => {},
        add: () => "unused",
        addAsync: () => {
          proof.__proofSurveyInvocationCount = (proof.__proofSurveyInvocationCount || 0) + 1;
          return new Promise<string>((resolve, reject) => { proof.__proofSurveyAttempts?.push({ resolve, reject }); });
        },
      }),
    };
    document.body.insertAdjacentHTML("beforeend", `
      <button type="button" data-lnw-open hidden>Feedback</button>
      <div id="lnwModal" data-sk="survey-proof" hidden aria-hidden="true">
        <div class="lnw-dialog" tabindex="-1">
          <p class="lnw-eyebrow"></p><h2 id="lnwTitle"></h2>
          <div><div id="lnwBody"></div></div><div id="lnwNav"></div>
        </div>
      </div>`);
    proof.__proofInitFeedback?.();
  });
}

async function openSurveyToSubmit(page: Page) {
  await page.evaluate(() => {
    (document.querySelector("[data-lnw-open]") as HTMLButtonElement).click();
    (document.querySelector(".lnw-pill") as HTMLButtonElement).click();
    (document.querySelector(".lnw-next") as HTMLButtonElement).click();
    (document.querySelector(".lnw-next") as HTMLButtonElement).click();
  });
}

async function submitSurveyWithImmediateTimeout(page: Page) {
  await page.evaluate(async () => {
    const nativeSetTimeout = window.setTimeout;
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
      if (delay === 8000) {
        queueMicrotask(() => { if (typeof handler === "function") handler(...args); });
        return 1;
      }
      return nativeSetTimeout(handler, delay, ...args);
    }) as typeof window.setTimeout;
    (document.querySelector(".lnw-submit") as HTMLButtonElement).click();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    window.setTimeout = nativeSetTimeout;
  });
}

async function submitSurveyWithControlledAck(page: Page) {
  await installControlledSurvey(page);
  await openSurveyToSubmit(page);
  await submitSurveyWithImmediateTimeout(page);
}

async function rejectSurveyAttempt(page: Page, index: number, code: string) {
  await page.evaluate(({ attemptIndex, errorCode }) => {
    const error = new Error(errorCode);
    error.name = errorCode.startsWith("outbox-") ? "WaypointSyncDurabilityError" : "Error";
    (error as Error & { code: string }).code = errorCode;
    (globalThis as ProofWindow).__proofSurveyAttempts?.[attemptIndex]?.reject(error);
  }, { attemptIndex: index, errorCode: code });
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
  return page.evaluate((metadataKey) => Object.keys(
    JSON.parse(localStorage.getItem("tg-outbox") || "{}") as Record<string, unknown>,
  ).filter((path) => path !== metadataKey), OUTBOX_METADATA_KEY);
}

async function rawOutbox(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => JSON.parse(localStorage.getItem("tg-outbox") || "{}") as Record<string, unknown>);
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

test("a rejected-bucket storage failure retains caller truth without replay or capacity loss", async ({ browser }) => {
  const roomCode = "rejectedstorage001";
  const seedRoom = "rejectedstorageseed001";
  const permanentPath = `trips/${roomCode}/feedback/proof-key-0001`;
  const transientPath = `trips/${roomCode}/feedback/proof-key-0002`;
  const permanentPayload = {
    note: "Keep this even when rejected storage fails",
    traveler: { name: "Ari", constraints: ["step-free", "no shellfish"] },
  };
  const legitimatePaths = Array.from({ length: 49 }, (_, index) =>
    `trips/${seedRoom}/feedback/seed-key-${String(index + 1).padStart(4, "0")}`);
  const backend = new CanonicalBackend();
  backend.mode = "permanent-error";
  const context = await browser.newContext();
  await installTransport(context, backend);
  let page = await context.newPage();
  await openProofPage(page);
  await page.evaluate(({ paths }) => {
    const active = Object.fromEntries(paths.map((path, index) => [path, {
      createdBy: "proof-browser-user",
      createdAt: 1_700_000_000_000 + index,
      note: `Legitimate queued entry ${index + 1}`,
    }]));
    localStorage.setItem("tg-outbox", JSON.stringify(active));
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "tg-outbox-rejected") {
        throw new DOMException("Rejected bucket unavailable", "QuotaExceededError");
      }
      return originalSetItem.call(this, key, value);
    };
  }, { paths: legitimatePaths });
  await joinAndObserve(page, roomCode, "feedback");
  await captureSyncErrors(page);

  const permanentResult = await page.evaluate(async (payload) => {
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

  expect(permanentResult).toEqual({
    state: "rejected",
    name: "Error",
    code: "permission_denied",
    message: "permission_denied",
  });
  expect(await rejectedOutbox(page)).toEqual({});
  const rawAfterRejection = await rawOutbox(page);
  const terminalActive = rawAfterRejection[permanentPath];
  const terminalMetadata = rawAfterRejection[OUTBOX_METADATA_KEY];
  expect(terminalActive).toEqual({
    createdBy: "proof-browser-user",
    createdAt: expect.any(Number),
    ...permanentPayload,
  });
  expect(terminalMetadata).toEqual({
    rejected: {
      [permanentPath]: {
        queuedAt: expect.any(Number),
        rejectedAt: expect.any(Number),
        code: "permission_denied",
      },
    },
  });
  expect((terminalMetadata as { rejected: Record<string, { queuedAt: number }> }).rejected[permanentPath].queuedAt)
    .toBe((terminalActive as { createdAt: number }).createdAt);
  expect(await outboxPaths(page)).toEqual([...legitimatePaths, permanentPath]);
  expect(backend.setAttemptPaths).toEqual([permanentPath]);

  backend.mode = "transient-error";
  const transientResult = await page.evaluate(async () => {
    const proof = globalThis as ProofWindow;
    const write = proof.__proofRoom?.collection("feedback").addAsync({ note: "Use the remaining active slot" });
    if (!write) throw new Error("proof room was not loaded");
    return Promise.race([
      write.then(() => "resolved", () => "rejected"),
      new Promise<"pending">((resolve) => setTimeout(() => resolve("pending"), 50)),
    ]);
  });
  expect(transientResult).toBe("pending");
  expect(await outboxPaths(page)).toEqual([...legitimatePaths, permanentPath, transientPath]);
  expect(backend.setAttemptPaths).toEqual([permanentPath, transientPath]);

  await page.close();
  backend.mode = "online";
  page = await context.newPage();
  await openProofPage(page);
  await joinAndObserve(page, roomCode, "feedback");
  await expect.poll(() => backend.acceptedWriteCount).toBe(1);
  expect(backend.setAttemptPaths).toEqual([permanentPath, transientPath, transientPath]);
  expect([...backend.values.keys()]).toEqual([transientPath]);
  expect(await outboxPaths(page)).toEqual([...legitimatePaths, permanentPath]);
  expect((await rawOutbox(page))[permanentPath]).toEqual(terminalActive);
  expect((await rawOutbox(page))[OUTBOX_METADATA_KEY]).toEqual(terminalMetadata);
  expect(await page.evaluate(() => localStorage.getItem("tg-proof-push-seq"))).toBe("2");

  await page.reload({ waitUntil: "domcontentloaded" });
  await openProofPage(page);
  await joinAndObserve(page, roomCode, "feedback");
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(backend.setAttemptPaths).toEqual([permanentPath, transientPath, transientPath]);
  expect(backend.acceptedWriteCount).toBe(1);
  expect([...backend.values.keys()]).toEqual([transientPath]);
  expect(await outboxPaths(page)).toEqual([...legitimatePaths, permanentPath]);
  expect((await rawOutbox(page))[OUTBOX_METADATA_KEY]).toEqual(terminalMetadata);
  await context.close();

  const noTerminalBackend = new CanonicalBackend();
  noTerminalBackend.mode = "permanent-error";
  const noTerminalContext = await browser.newContext();
  await installTransport(noTerminalContext, noTerminalBackend);
  const noTerminalPage = await noTerminalContext.newPage();
  await openProofPage(noTerminalPage);
  await joinAndObserve(noTerminalPage, "noterminalstorage001", "feedback");
  await captureSyncErrors(noTerminalPage);
  const noTerminalPath = "trips/noterminalstorage001/feedback/proof-key-0001";
  const noTerminalResult = await noTerminalPage.evaluate(async ({ path, metadataKey }) => {
    const proof = globalThis as ProofWindow;
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "tg-outbox-rejected") {
        throw new DOMException("Rejected bucket unavailable", "QuotaExceededError");
      }
      if (key === "tg-outbox") {
        const metadata = (JSON.parse(value) as Record<string, {
          rejected?: Record<string, unknown>;
        }>)[metadataKey];
        if (metadata?.rejected && path in metadata.rejected) {
          throw new DOMException("Terminal fallback unavailable", "QuotaExceededError");
        }
      }
      return originalSetItem.call(this, key, value);
    };
    const write = proof.__proofRoom?.collection("feedback").addAsync({ note: "Never claim terminal durability" });
    if (!write) throw new Error("proof room was not loaded");
    return write.then(
      () => ({ state: "resolved" as const }),
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
  }, { path: noTerminalPath, metadataKey: OUTBOX_METADATA_KEY });
  expect(noTerminalResult).toEqual({
    state: "rejected",
    name: "WaypointSyncDurabilityError",
    code: "outbox-rejection-state-failed",
    message: `Could not durably mark ${noTerminalPath} as permanently rejected`,
  });
  expect(await noTerminalPage.evaluate((path) => {
    const active = JSON.parse(localStorage.getItem("tg-outbox") || "{}") as Record<string, unknown>;
    return active[path];
  }, noTerminalPath)).toEqual({
    createdBy: "proof-browser-user",
    createdAt: expect.any(Number),
    note: "Never claim terminal durability",
  });
  expect(noTerminalBackend.setAttemptPaths).toEqual([noTerminalPath]);
  expect(await noTerminalPage.evaluate(() => (globalThis as ProofWindow).__proofSyncErrors)).toEqual([
    { path: noTerminalPath, permanent: true, code: "outbox-rejection-state-failed" },
  ]);

  await submitSurveyWithControlledAck(noTerminalPage);
  await expect(noTerminalPage.locator("#lnwTitle")).toHaveText("Saved — still syncing.");
  expect(await noTerminalPage.evaluate(() => (globalThis as ProofWindow).__proofSurveyInvocationCount)).toBe(1);
  await rejectSurveyAttempt(noTerminalPage, 0, "outbox-rejection-state-failed");
  await expect(noTerminalPage.locator("#lnwTitle")).toHaveText("Sync needs attention.");
  await expect(noTerminalPage.locator(".lnw-submit")).toHaveCount(0);
  await expect(noTerminalPage.locator(".lnw-done")).toBeVisible();
  expect(await noTerminalPage.evaluate(() => (globalThis as ProofWindow).__proofSurveyInvocationCount)).toBe(1);

  await noTerminalPage.locator(".lnw-done").click();
  await openSurveyToSubmit(noTerminalPage);
  await submitSurveyWithImmediateTimeout(noTerminalPage);
  await expect(noTerminalPage.locator("#lnwTitle")).toHaveText("Saved — still syncing.");
  expect(await noTerminalPage.evaluate(() => (globalThis as ProofWindow).__proofSurveyInvocationCount)).toBe(2);
  await rejectSurveyAttempt(noTerminalPage, 1, "outbox-ack-cleanup-failed");
  await expect(noTerminalPage.locator("#lnwTitle")).toHaveText("Sync needs attention.");
  await expect(noTerminalPage.locator(".lnw-submit")).toHaveCount(0);
  await expect(noTerminalPage.locator(".lnw-done")).toBeVisible();
  expect(await noTerminalPage.evaluate(() => (globalThis as ProofWindow).__proofSurveyInvocationCount)).toBe(2);

  // A failure from an older queued submission cannot overwrite a newer modal attempt.
  await noTerminalPage.locator(".lnw-done").click();
  await openSurveyToSubmit(noTerminalPage);
  await submitSurveyWithImmediateTimeout(noTerminalPage);
  await expect(noTerminalPage.locator("#lnwTitle")).toHaveText("Saved — still syncing.");
  await noTerminalPage.locator(".lnw-done").click();
  await noTerminalPage.locator("[data-lnw-open]").click();
  await expect(noTerminalPage.locator("#lnwTitle")).toHaveText("How did the plan hold up?");
  await rejectSurveyAttempt(noTerminalPage, 2, "outbox-rejection-state-failed");
  await expect(noTerminalPage.locator("#lnwTitle")).toHaveText("How did the plan hold up?");
  expect(await noTerminalPage.evaluate(() => (globalThis as ProofWindow).__proofSurveyInvocationCount)).toBe(3);

  await noTerminalPage.locator("#lnwModal").press("Escape");
  await noTerminalPage.locator("[data-lnw-open]").click();
  await expect(noTerminalPage.locator("#lnwTitle")).toHaveText("Sync needs attention.");
  await expect(noTerminalPage.locator(".lnw-submit")).toHaveCount(0);
  await expect(noTerminalPage.locator(".lnw-done")).toBeVisible();

  // An immediate ordinary permanent rejection is dead-lettered and cannot replay, so retry is safe.
  await noTerminalPage.locator(".lnw-done").click();
  await openSurveyToSubmit(noTerminalPage);
  await noTerminalPage.evaluate(async () => {
    const nativeSetTimeout = window.setTimeout;
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
      if (delay === 8000) return 1;
      return nativeSetTimeout(handler, delay, ...args);
    }) as typeof window.setTimeout;
    (document.querySelector(".lnw-submit") as HTMLButtonElement).click();
    await Promise.resolve();
    await Promise.resolve();
    window.setTimeout = nativeSetTimeout;
  });
  await expect.poll(() => noTerminalPage.evaluate(() => (globalThis as ProofWindow).__proofSurveyInvocationCount)).toBe(4);
  await rejectSurveyAttempt(noTerminalPage, 3, "permission_denied");
  await expect(noTerminalPage.locator(".lnw-submit")).toBeEnabled();
  await expect(noTerminalPage.locator(".lnw-submit")).toHaveText("Retry — couldn't reach the group");

  await noTerminalPage.evaluate(async () => {
    const nativeSetTimeout = window.setTimeout;
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
      if (delay === 8000) return 1;
      return nativeSetTimeout(handler, delay, ...args);
    }) as typeof window.setTimeout;
    (document.querySelector(".lnw-submit") as HTMLButtonElement).click();
    await Promise.resolve();
    await Promise.resolve();
    window.setTimeout = nativeSetTimeout;
  });
  await expect.poll(() => noTerminalPage.evaluate(() => (globalThis as ProofWindow).__proofSurveyInvocationCount)).toBe(5);
  await noTerminalPage.evaluate(() => (globalThis as ProofWindow).__proofSurveyAttempts?.[4]?.resolve("proof-key-0005"));
  await expect(noTerminalPage.locator("#lnwTitle")).toHaveText("Thanks — logged for the post-mortem.");
  await noTerminalContext.close();

  const collisionRoom = "terminalshapepayload001";
  const collisionPath = `trips/${collisionRoom}/feedback/proof-key-0001`;
  const markerShapedTravelerPayload = {
    __waypointOutboxState: "rejected-v1",
    value: { note: "This is traveler data, not system metadata" },
    queuedAt: 1_700_000_100_001,
    rejectedAt: 1_700_000_100_002,
    code: "traveler-authored-value",
  };
  const collisionBackend = new CanonicalBackend();
  collisionBackend.mode = "offline";
  const collisionContext = await browser.newContext();
  await installTransport(collisionContext, collisionBackend);
  let collisionPage = await collisionContext.newPage();
  await openProofPage(collisionPage);
  await joinAndObserve(collisionPage, collisionRoom, "feedback");
  await collisionPage.evaluate((payload) => {
    const proof = globalThis as ProofWindow;
    proof.__proofPending = proof.__proofRoom?.collection("feedback").addAsync(payload);
  }, markerShapedTravelerPayload);
  await expect.poll(() => outboxPaths(collisionPage)).toEqual([collisionPath]);
  expect(collisionBackend.setAttemptPaths).toEqual([collisionPath]);

  await collisionPage.close();
  collisionBackend.mode = "online";
  collisionPage = await collisionContext.newPage();
  await openProofPage(collisionPage);
  await joinAndObserve(collisionPage, collisionRoom, "feedback");
  await expect.poll(() => collisionBackend.acceptedWriteCount).toBe(1);
  expect(collisionBackend.setAttemptPaths).toEqual([collisionPath, collisionPath]);
  expect(collisionBackend.read(collisionPath)).toEqual({
    createdBy: "proof-browser-user",
    createdAt: expect.any(Number),
    ...markerShapedTravelerPayload,
  });
  await expect.poll(() => outboxPaths(collisionPage)).toEqual([]);
  await collisionContext.close();
});
