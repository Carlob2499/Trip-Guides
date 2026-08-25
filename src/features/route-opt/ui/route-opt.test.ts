import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../lib/route-optimize", () => ({
  optimizeDayRoute: vi.fn(() => ({ order: [2, 1, 0], savedKm: 1.2 })),
}));
vi.mock("../../../scripts/util.js", () => ({
  reducedMotion: vi.fn(() => false),
  tapHaptic: vi.fn(),
  trapFocus: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

function button() {
  const attrs = new Map<string, string>();
  let click: (() => void) | undefined;
  return {
    attrs,
    textContent: "",
    type: "",
    className: "",
    onclick: undefined as (() => void) | undefined,
    setAttribute: vi.fn((name: string, value: string) => attrs.set(name, value)),
    getAttribute: vi.fn((name: string) => attrs.get(name) ?? null),
    addEventListener: vi.fn((event: string, handler: () => void) => { if (event === "click") click = handler; }),
    click: () => click?.(),
    focus: vi.fn(),
  };
}

describe("route optimization persistence", () => {
  it("discards a parseable primitive state instead of crashing when applying an order", async () => {
    const storage = { getItem: vi.fn(() => "true"), setItem: vi.fn() };
    const chip = button();
    const applyButton = button();
    const closeButton = button();
    const title = { textContent: "" };
    const order = { innerHTML: "", appendChild: vi.fn() };
    const sheet = {
      className: "",
      hidden: true,
      innerHTML: "",
      setAttribute: vi.fn(),
      addEventListener: vi.fn(),
      querySelector: vi.fn((selector: string) => ({
        ".ro-sheet-x": closeButton,
        ".ro-sheet-apply": applyButton,
        ".ro-sheet-title": title,
        ".ro-sheet-order": order,
      })[selector]),
    };
    const stop = (name: string) => ({
      getAttribute: vi.fn((key: string) => key === "data-lat" ? "55.6" : key === "data-lng" ? "12.5" : null),
      querySelector: vi.fn((selector: string) => selector === ".stop-num" ? { textContent: "" } : selector === ".stop-name" ? { textContent: name } : null),
    });
    const stops = [stop("A"), stop("B"), stop("C")];
    const list = { querySelectorAll: vi.fn(() => stops), appendChild: vi.fn() };
    const launcher = { appendChild: vi.fn() };
    const day = {
      getAttribute: vi.fn(() => "1"),
      querySelector: vi.fn((selector: string) => selector === ".stops" ? list : selector === ".b" ? launcher : null),
    };
    const body = {
      getAttribute: vi.fn(() => "denmark"),
      appendChild: vi.fn(),
      classList: { add: vi.fn(), remove: vi.fn() },
    };

    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("document", {
      body,
      activeElement: null,
      querySelectorAll: vi.fn(() => [day]),
      createElement: vi.fn((tag: string) => tag === "button" ? chip : tag === "div" ? sheet : { textContent: "" }),
      addEventListener: vi.fn(),
    });
    vi.stubGlobal("window", { scrollTo: vi.fn() });

    await import("./route-opt.js");
    expect(launcher.appendChild).toHaveBeenCalledWith(chip);

    chip.click();
    expect(applyButton.onclick).toBeTypeOf("function");
    expect(() => applyButton.onclick!()).not.toThrow();
    expect(storage.setItem).toHaveBeenCalled();
  });
});
