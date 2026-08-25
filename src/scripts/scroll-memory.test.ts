import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./util.js", () => ({
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
});
