// Tests for the Worker's ROUTING layer — worker/index.mjs itself, not just the pure cores it
// calls. Everything here is a property that only exists once the pieces are wired together, which
// is exactly the class the unit tests structurally cannot reach (CLAUDE.md, Boundary Checks):
//
//   · what an UNCONFIGURED guard does. The rate limit fails open by design, so the interesting
//     question is what it hands out while open — and the answer must not be the label that spends
//     an agent.
//   · that a wrong key is COUNTED, and that enough wrong keys stop being answered.
//   · that GitHub's own error text reaches the owner and not the anonymous public path.
//
// The Worker is driven the way Cloudflare drives it: a real Request in, a real Response out, with
// `fetch` and the KV binding stubbed. No network.

// @protects-file A half-configured Worker fails safe, and the owner key can't be guessed at speed.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import worker from "../../worker/index.mjs";
import { OWNER_KEY_HEADER, OWNER_FAIL_MAX, OWNER_KEY_MIN_LEN } from "../worker-api.mjs";

const OWNER_KEY = "k".repeat(OWNER_KEY_MIN_LEN);
const IP = "203.0.113.7";

/** An in-memory KV namespace with the two methods the Worker uses. */
function fakeKV(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    get: vi.fn(async (k) => (map.has(k) ? map.get(k) : null)),
    put: vi.fn(async (k, v) => { map.set(k, String(v)); }),
  };
}

const ALLOWED_ORIGIN = "https://example.test";

const baseEnv = (over = {}) => ({
  REPO: "owner/repo",
  GH_TOKEN: "gh-token",
  ALLOWED_ORIGIN,
  ...over,
});

/** A complete, valid intake body — the wizard's own field ids. */
const INTAKE = {
  country: "Slovenia",
  dates: "2027-04-02 to 2027-04-11",
  party: "2 adults",
  priorities: "Food, Hiking, Museums",
  pace: "Balanced",
  budget: "Mid-range",
  transport: "Trains",
  lodging: "Hotels",
  food: "Anything",
  notes: "",
};

/** A POST as the SITE makes it — from the allowed origin, which the Worker now checks
 *  server-side. Pass `Origin` in `headers` to model a caller that isn't the site. */
const post = (path, body, headers = {}) =>
  new Request(`https://worker.test${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CF-Connecting-IP": IP,
      Origin: ALLOWED_ORIGIN,
      ...headers,
    },
    body: JSON.stringify(body),
  });

/** Stub GitHub. Returns the recorded calls so a test can assert on what was actually sent. */
function stubGithub({ ok = true, status = 200, body = { number: 12, html_url: "https://github.test/i/12" }, text = "" } = {}) {
  const calls = [];
  vi.stubGlobal("fetch", vi.fn(async (url, init) => {
    calls.push({ url: String(url), body: init?.body ? JSON.parse(init.body) : null });
    return {
      ok,
      status,
      json: async () => body,
      text: async () => text,
    };
  }));
  return calls;
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// A live smoke test on 2026-08-15 POSTed to the deployed Worker with `Origin: https://evil.
// example` and it filed a real intake issue: CORS is enforced by the BROWSER on the RESPONSE,
// so the Access-Control-Allow-Origin header never stopped a direct POST. The origin check has
// to happen server-side, before any handler runs.
describe("ALLOWED_ORIGIN is enforced on the request, not just echoed in CORS headers", () => {
  it("refuses a POST from a foreign origin without calling GitHub", async () => {
    const calls = stubGithub();
    const res = await worker.fetch(post("/intake", INTAKE, { Origin: "https://evil.example" }), baseEnv());
    expect(res.status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it("refuses a POST with no Origin header at all (a non-browser caller)", async () => {
    const calls = stubGithub();
    const req = new Request("https://worker.test/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": IP },
      body: JSON.stringify(INTAKE),
    });
    const res = await worker.fetch(req, baseEnv());
    expect(res.status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it("guards the owner routes too, before the key is even compared", async () => {
    const calls = stubGithub();
    const res = await worker.fetch(
      post("/change", { slug: "japan", change: "x" }, { Origin: "https://evil.example", "X-Owner-Key": "k" }),
      baseEnv({ OWNER_KEY: "k" }),
    );
    expect(res.status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it("still allows the site's own origin through", async () => {
    stubGithub();
    const res = await worker.fetch(post("/intake", INTAKE), baseEnv());
    expect(res.status).toBe(200);
  });
});

describe("/intake with the rate-limit KV unbound — fails SAFE, not open", () => {
  it("files the issue but WITHOUT the auto-run label", async () => {
    const calls = stubGithub();
    const res = await worker.fetch(post("/intake", INTAKE), baseEnv());
    const json = await res.json();

    expect(res.status).toBe(200);
    // The traveler's request is never lost — that half still fails open.
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("/repos/owner/repo/issues");
    // But `new-guide` is what new-guide.yml fires on, and an uncounted request has not been shown
    // to be under the cap — it has been shown to be uncounted.
    expect(calls[0].body.labels).toEqual([]);
    expect(json.autoResearch).toBe(false);
    expect(json.slug).toBe("slovenia");
  });

  it("says so out loud on every unprotected request", async () => {
    stubGithub();
    await worker.fetch(post("/intake", INTAKE), baseEnv());
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("UNPROTECTED"));
  });

  it("labels normally once the counter is actually counting", async () => {
    const calls = stubGithub();
    const RATE = fakeKV();
    const res = await worker.fetch(post("/intake", INTAKE), baseEnv({ RATE }));

    expect(calls[0].body.labels).toEqual(["new-guide"]);
    expect((await res.json()).autoResearch).toBe(true);
    expect(RATE.put).toHaveBeenCalled();
  });

  it("still drops the label over the cap, for the other reason", async () => {
    const calls = stubGithub();
    const RATE = fakeKV();
    const req = post("/intake", INTAKE);
    const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    RATE.map.set(`rl:${IP}:${week}`, "5"); // AUTO_CAP default is 3
    await worker.fetch(req, baseEnv({ RATE }));
    expect(calls[0].body.labels).toEqual([]);
  });

  it("keeps GitHub's own error text off the public path", async () => {
    stubGithub({ ok: false, status: 403, text: "Resource not accessible by personal access token" });
    const res = await worker.fetch(post("/intake", INTAKE), baseEnv());
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.error).toContain("could not file the issue");
    expect(json.detail).toBeUndefined();
    // Not lost — the owner can still read it where only the owner looks.
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("Resource not accessible"));
  });
});

describe("owner-gate throttle", () => {
  const change = (key) => post("/change", { slug: "korea", change: "Admission is 3,000 won now." }, key ? { [OWNER_KEY_HEADER]: key } : {});

  it("counts a wrong key against the IP", async () => {
    stubGithub();
    const RATE = fakeKV();
    const res = await worker.fetch(change("wrong"), baseEnv({ OWNER_KEY, RATE }));

    expect(res.status).toBe(401);
    expect([...RATE.map.values()]).toEqual(["1"]);
    expect([...RATE.map.keys()][0]).toMatch(new RegExp(`^of:${IP}:`));
  });

  it("stops answering after the hourly budget of wrong keys", async () => {
    stubGithub();
    const RATE = fakeKV();
    const env = baseEnv({ OWNER_KEY, RATE });
    for (let i = 0; i < OWNER_FAIL_MAX; i++) {
      expect((await worker.fetch(change("wrong"), env)).status).toBe(401);
    }
    const res = await worker.fetch(change("wrong"), env);
    expect(res.status).toBe(429);
    expect((await res.json()).error).toContain("too many failed attempts");
  });

  it("throttles the RIGHT key too, once the budget is gone — the limit is on the IP", async () => {
    // Otherwise an attacker who runs out of guesses simply keeps guessing until one lands.
    stubGithub();
    const RATE = fakeKV();
    const env = baseEnv({ OWNER_KEY, RATE });
    for (let i = 0; i < OWNER_FAIL_MAX; i++) await worker.fetch(change("wrong"), env);
    expect((await worker.fetch(change(OWNER_KEY), env)).status).toBe(429);
  });

  it("does not count a correct key", async () => {
    const calls = stubGithub();
    const RATE = fakeKV();
    const res = await worker.fetch(change(OWNER_KEY), baseEnv({ OWNER_KEY, RATE }));

    expect(res.status).toBe(200);
    expect(RATE.map.size).toBe(0);
    expect(calls[0].body.labels).toEqual(["modify-request"]);
  });

  it("does not count a 503 — an unset OWNER_KEY has no secret to guess", async () => {
    stubGithub();
    const RATE = fakeKV();
    const res = await worker.fetch(change("anything"), baseEnv({ RATE }));
    expect(res.status).toBe(503);
    expect(RATE.map.size).toBe(0);
  });

  it("with no KV bound, skips the THROTTLE and never the gate", async () => {
    stubGithub();
    const env = baseEnv({ OWNER_KEY });
    for (let i = 0; i < OWNER_FAIL_MAX + 5; i++) {
      expect((await worker.fetch(change("wrong"), env)).status).toBe(401);
    }
    expect((await worker.fetch(change(OWNER_KEY), env)).status).toBe(200);
  });

  it("returns GitHub's detail on an owner route — the caller proved who they are", async () => {
    stubGithub({ ok: false, status: 403, text: "Resource not accessible by personal access token" });
    const res = await worker.fetch(change(OWNER_KEY), baseEnv({ OWNER_KEY }));
    const json = await res.json();
    expect(res.status).toBe(502);
    expect(json.detail).toContain("Resource not accessible");
  });
});

describe("GET /health", () => {
  const health = (env) => worker.fetch(new Request("https://worker.test/health"), env);

  it("reports OFF for what is not configured, without echoing anything", async () => {
    const json = await (await health(baseEnv())).json();
    expect(json).toMatchObject({ rateLimit: "OFF", ownerEndpoints: "OFF", repo: "owner/repo" });
  });

  it("reports WEAK for a key under the server-side minimum — routes fail closed", async () => {
    const short = "k".repeat(OWNER_KEY_MIN_LEN - 1);
    const json = await (await health(baseEnv({ OWNER_KEY: short }))).json();
    expect(json.ownerEndpoints).toBe("WEAK");
    expect(JSON.stringify(json)).not.toContain(short);

    stubGithub();
    const res = await worker.fetch(
      post("/change", { slug: "korea", change: "Admission is 3,000 won now." }, { [OWNER_KEY_HEADER]: short }),
      baseEnv({ OWNER_KEY: short }),
    );
    expect(res.status).toBe(503);
  });

  it("reports configured for a key at or over the minimum", async () => {
    const json = await (await health(baseEnv({ OWNER_KEY, RATE: fakeKV() }))).json();
    expect(json).toMatchObject({ rateLimit: "configured", ownerEndpoints: "configured" });
  });
});
