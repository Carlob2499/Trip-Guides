import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../firebase/index.js", () => ({
  hasFirebase: vi.fn(() => false),
  joinTrip: vi.fn(),
  roomId: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("reminder gateway local persistence", () => {
  it("discards a parseable primitive item map instead of crashing a later add", async () => {
    const storage = {
      getItem: vi.fn(() => "true"),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    vi.stubGlobal("localStorage", storage);

    const { createGateway } = await import("./gateway.js");
    const gateway = createGateway("denmark");
    await gateway.connect();

    expect(() => gateway.add({ title: "Confirm rail seat" })).not.toThrow();
    const [, persisted] = storage.setItem.mock.calls.at(-1)!;
    expect(Object.values(JSON.parse(persisted))).toEqual([
      expect.objectContaining({ title: "Confirm rail seat" }),
    ]);
  });
});
