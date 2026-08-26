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

    expect(() => gateway.add({ text: "Confirm rail seat" })).not.toThrow();
    const [, persisted] = storage.setItem.mock.calls.at(-1)!;
    expect(Object.values(JSON.parse(persisted))).toEqual([
      expect.objectContaining({ text: "Confirm rail seat" }),
    ]);
  });

  it("discards non-record reminder entries before exposing or mutating local state", async () => {
    const storage = {
      getItem: vi.fn(() => JSON.stringify({
        x: true,
        valid: { text: "Confirm rail seat", pinned: false },
      })),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    vi.stubGlobal("localStorage", storage);

    const { createGateway } = await import("./gateway.js");
    const gateway = createGateway("denmark");
    const onChange = vi.fn();
    gateway.onChange(onChange);
    await gateway.connect();

    const emitted = onChange.mock.calls.at(-1)![0];
    expect(emitted.valid).toEqual(expect.objectContaining({ text: "Confirm rail seat", pinned: false }));
    expect(Object.keys(emitted)).toEqual(["valid"]);
    expect(() => gateway.setPinned("x", true)).not.toThrow();
  });

  it("emits prototype-safe local maps and reminder records for hostile storage keys", async () => {
    const storage = {
      getItem: vi.fn(() => '{"__proto__":{"text":"Named proto"},"safe":{"text":"Legit","__proto__":{"polluted":true},"constructor":{"polluted":true},"prototype":{"polluted":true}}}'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    vi.stubGlobal("localStorage", storage);

    const { createGateway } = await import("./gateway.js");
    const gateway = createGateway("denmark");
    const onChange = vi.fn();
    gateway.onChange(onChange);
    await gateway.connect();

    const emitted = onChange.mock.calls.at(-1)![0];
    expect(Object.getPrototypeOf(emitted)).toBeNull();
    expect(Object.keys(emitted)).toEqual(["__proto__", "safe"]);
    expect(Object.getPrototypeOf(emitted.__proto__)).toBeNull();
    expect(Object.getPrototypeOf(emitted.safe)).toBeNull();
    expect(emitted.safe.text).toBe("Legit");
    expect(emitted.safe.polluted).toBeUndefined();
    for (const key of ["__proto__", "constructor", "prototype"]) {
      expect(Object.prototype.hasOwnProperty.call(emitted.safe, key)).toBe(false);
    }

    expect(() => gateway.setPinned("__proto__", true)).not.toThrow();
    expect(onChange.mock.calls.at(-1)![0].__proto__.pinned).toBe(true);
  });

  it("rejects object text and omits a non-numeric createdAt before exposing local reminders", async () => {
    const storage = {
      getItem: vi.fn(() => '{"badText":{"text":{"toString":null},"createdAt":1},"safe":{"text":"Meet at Exit 5","label":{"toString":null},"kind":{"toString":null},"pinned":"yes","createdAt":{"valueOf":null,"toString":null}}}'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    vi.stubGlobal("localStorage", storage);

    const { createGateway } = await import("./gateway.js");
    const gateway = createGateway("denmark");
    const onChange = vi.fn();
    gateway.onChange(onChange);
    await gateway.connect();

    const emitted = onChange.mock.calls.at(-1)![0];
    expect(Object.keys(emitted)).toEqual(["safe"]);
    expect(emitted.safe).toEqual({
      text: "Meet at Exit 5",
      label: "",
      kind: "note",
      pinned: true,
    });
    expect(Object.getPrototypeOf(emitted.safe)).toBeNull();
    expect(() => Number(emitted.safe.createdAt)).not.toThrow();
  });
});
