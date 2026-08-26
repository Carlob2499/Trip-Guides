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

describe("scroll-memory persistence", () => {
  it("discards a parseable primitive state instead of crashing on scroll save", async () => {
    let scrollHandler: (() => void) | undefined;
    const storage = { getItem: vi.fn(() => "true"), setItem: vi.fn() };
    const tabs = {
      querySelector: vi.fn(() => ({ getAttribute: vi.fn(() => "itinerary") })),
      addEventListener: vi.fn(),
    };
    const content = { getBoundingClientRect: vi.fn(() => ({ top: 100 })) };

    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("document", {
      body: { getAttribute: vi.fn((key: string) => key === "data-storekey" ? "denmark" : null) },
      getElementById: vi.fn((id: string) => id === "guideTabs" ? tabs : id === "content" ? content : null),
      querySelector: vi.fn(() => null),
    });
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
    expect(storage.setItem).toHaveBeenCalledWith("tg-scrollmem-denmark", JSON.stringify({ itinerary: 440 }));
  });

  it("treats a non-numeric saved offset as absent during reload restore", async () => {
    const storage = {
      getItem: vi.fn(() => '{"itinerary":{"valueOf":null,"toString":null}}'),
      setItem: vi.fn(),
    };
    const tabs = {
      querySelector: vi.fn(() => ({ getAttribute: vi.fn(() => "itinerary") })),
      addEventListener: vi.fn(),
    };
    const content = { getBoundingClientRect: vi.fn(() => ({ top: 100 })) };

    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("document", {
      body: { getAttribute: vi.fn((key: string) => key === "data-storekey" ? "denmark" : null) },
      getElementById: vi.fn((id: string) => id === "guideTabs" ? tabs : id === "content" ? content : null),
      querySelector: vi.fn(() => null),
    });
    vi.stubGlobal("performance", { getEntriesByType: vi.fn(() => [{ type: "reload" }]) });
    vi.stubGlobal("location", { hash: "" });
    vi.stubGlobal("window", {
      scrollY: 0,
      addEventListener: vi.fn(),
      scrollTo: vi.fn(),
    });
    vi.stubGlobal("requestAnimationFrame", (callback: () => void) => callback());

    await expect(import("./scroll-memory.js")).resolves.toBeDefined();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
