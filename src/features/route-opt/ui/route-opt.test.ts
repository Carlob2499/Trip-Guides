import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../lib/route-optimize", () => ({
  optimizeDayRoute: vi.fn(() => ({ order: [2, 1, 0], savedKm: 1.2 })),
}));
vi.mock("../../../scripts/util.js", async (importOriginal) => ({
  ...await importOriginal<typeof import("../../../scripts/util.js")>(),
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

async function mountRouteOpt(storedState: string) {
  const storage = { getItem: vi.fn(() => storedState), setItem: vi.fn() };
  const chip = button();
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
    createElement: vi.fn(() => chip),
    addEventListener: vi.fn(),
  });
  vi.stubGlobal("window", { scrollTo: vi.fn() });

  await expect(import("./route-opt.js")).resolves.toBeDefined();
  expect(launcher.appendChild).toHaveBeenCalledWith(chip);
  return { storage, chip, stops, list };
}

describe("route optimization persistence", () => {
  it("restores a valid full permutation without cleaning persisted state", async () => {
    const { storage, chip, stops, list } = await mountRouteOpt('{"1":[2,1,0]}');

    expect(list.appendChild.mock.calls.map(([stop]) => stop)).toEqual([stops[2], stops[1], stops[0]]);
    expect(chip.attrs.get("aria-pressed")).toBe("true");
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("discards a duplicate order without changing the authored stop order", async () => {
    const { storage, chip, list } = await mountRouteOpt('{"1":[0,0,2]}');

    expect(list.appendChild).not.toHaveBeenCalled();
    expect(chip.attrs.get("aria-pressed")).toBe("false");
    expect(storage.setItem).toHaveBeenCalledWith("tg-routeopt-denmark", "{}");
  });

  it("discards an out-of-range order without changing the authored stop order", async () => {
    const { storage, chip, list } = await mountRouteOpt('{"1":[999]}');

    expect(list.appendChild).not.toHaveBeenCalled();
    expect(chip.attrs.get("aria-pressed")).toBe("false");
    expect(storage.setItem).toHaveBeenCalledWith("tg-routeopt-denmark", "{}");
  });
});
