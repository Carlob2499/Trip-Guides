import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("Tools reminder persistence", () => {
  it("discards a parseable primitive store value instead of crashing a reminder change", async () => {
    let changeHandler: ((this: { checked: boolean; closest: () => unknown }) => void) | undefined;
    const storage = {
      getItem: vi.fn(() => "true"),
      setItem: vi.fn(),
    };
    const row = { classList: { add: vi.fn(), toggle: vi.fn() } };
    const box = {
      checked: false,
      getAttribute: vi.fn(() => "visa-check"),
      closest: vi.fn(() => row),
      addEventListener: vi.fn((_event: string, handler: typeof changeHandler) => { changeHandler = handler; }),
    };
    const list = {
      getAttribute: vi.fn(() => "denmark"),
      querySelectorAll: vi.fn(() => [box]),
    };

    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("document", {
      querySelector: vi.fn((selector: string) => selector === "[data-tools-reminders]" ? list : null),
    });

    await import("./tools-reminders.js");
    expect(changeHandler).toBeTypeOf("function");

    box.checked = true;
    expect(() => changeHandler!.call(box)).not.toThrow();
    expect(storage.setItem).toHaveBeenCalledWith("tg-toolsrem-denmark", JSON.stringify({ "visa-check": 1 }));
    expect(row.classList.toggle).toHaveBeenCalledWith("tools-rem-row--done", true);
  });
});
