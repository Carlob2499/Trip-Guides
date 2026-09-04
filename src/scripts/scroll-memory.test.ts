import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./util.js", async (importOriginal) => ({
  ...await importOriginal<typeof import("./util.js")>(),
  migrateStorageKey: vi.fn(),
  reducedMotion: vi.fn(() => false),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

/* D7: scroll memory keys on the shown DESTINATION (body[data-dest]) and lands through the
   router's tg:dest event, not on a tab bar. */
function stubDocument(dest: string, listeners: Record<string, (e: unknown) => void>) {
  const content = { getBoundingClientRect: vi.fn(() => ({ top: 100 })) };
  vi.stubGlobal("document", {
    body: { getAttribute: vi.fn((key: string) => key === "data-storekey" ? "denmark" : key === "data-dest" ? dest : null) },
    getElementById: vi.fn((id: string) => id === "content" ? content : null),
    querySelector: vi.fn((sel: string) => sel === "[data-dest-nav]" ? {} : null),
    addEventListener: vi.fn((event: string, handler: (e: unknown) => void) => { listeners[event] = handler; }),
  });
}

describe("scroll-memory persistence", () => {
  it("discards a parseable primitive state instead of crashing on scroll save", async () => {
    let scrollHandler: (() => void) | undefined;
    const storage = { getItem: vi.fn(() => "true"), setItem: vi.fn() };
    vi.stubGlobal("localStorage", storage);
    stubDocument("itinerary", {});
    vi.stubGlobal("performance", { getEntriesByType: vi.fn(() => [{ type: "navigate" }]) });
    vi.stubGlobal("location", { hash: "" });
    vi.stubGlobal("window", {
      scrollY: 440,
      addEventListener: vi.fn((event: string, handler: () => void) => { if (event === "scroll") scrollHandler = handler; }),
      scrollTo: vi.fn(),
    });
    vi.stubGlobal("requestAnimationFrame", (callback: () => void) => callback());

    await import("./scroll-memory.js");
    expect(scrollHandler).toBeTypeOf("function");
    expect(() => scrollHandler!()).not.toThrow();
    expect(storage.setItem).toHaveBeenCalledWith("tg-d7-scrollmem-denmark", JSON.stringify({ itinerary: 440 }));
  });

  it("treats a non-numeric saved offset as absent during reload restore", async () => {
    const storage = {
      getItem: vi.fn(() => '{"itinerary":{"valueOf":null,"toString":null}}'),
      setItem: vi.fn(),
    };
    vi.stubGlobal("localStorage", storage);
    stubDocument("itinerary", {});
    vi.stubGlobal("performance", { getEntriesByType: vi.fn(() => [{ type: "reload" }]) });
    vi.stubGlobal("location", { hash: "" });
    vi.stubGlobal("window", { scrollY: 0, addEventListener: vi.fn(), scrollTo: vi.fn() });
    vi.stubGlobal("requestAnimationFrame", (callback: () => void) => callback());

    await expect(import("./scroll-memory.js")).resolves.toBeDefined();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("lands a switched-to destination on its saved spot and leaves hash reveals alone", async () => {
    const listeners: Record<string, (e: unknown) => void> = {};
    const storage = { getItem: vi.fn(() => JSON.stringify({ map: 900 })), setItem: vi.fn() };
    vi.stubGlobal("localStorage", storage);
    stubDocument("trip", listeners);
    vi.stubGlobal("performance", { getEntriesByType: vi.fn(() => [{ type: "navigate" }]) });
    vi.stubGlobal("location", { hash: "" });
    const scrollTo = vi.fn();
    vi.stubGlobal("window", { scrollY: 0, addEventListener: vi.fn(), scrollTo });
    vi.stubGlobal("requestAnimationFrame", (callback: () => void) => callback());

    await import("./scroll-memory.js");
    listeners["tg:dest"]({ detail: { dest: "map", reason: "hash" } });
    expect(scrollTo).not.toHaveBeenCalled();
    listeners["tg:dest"]({ detail: { dest: "map", reason: "nav" } });
    expect(scrollTo).toHaveBeenCalledWith({ top: 900, behavior: "smooth" });
  });
});
