// Tests for scripts/verify-live.mjs. The two pure cores get fixture-driven unit tests
// (no network): discoverPublishedSlugs() against a real temp guides dir — both guide
// shapes and the draft rule — and diagnose() against synthetic "what the site returned"
// snapshots. checkLive()'s retry loop is exercised with an injected fake fetch so the
// propagation-lag behavior is covered without a real deploy or a real clock.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  discoverPublishedSlugs,
  diagnose,
  homepageLists,
  checkLive,
  PROBLEM,
} from "../verify-live.mjs";

describe("discoverPublishedSlugs (pure, real temp dir)", () => {
  let dir;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "guides-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const flat = (slug, obj) => writeFile(path.join(dir, `${slug}.json`), JSON.stringify(obj));
  const dirGuide = async (slug, obj) => {
    await mkdir(path.join(dir, slug), { recursive: true });
    await writeFile(path.join(dir, slug, "_guide.json"), JSON.stringify(obj));
  };

  it("includes flat and directory guides with no draft flag", async () => {
    await flat("us", { title: "Sedona" });
    await dirGuide("korea", { title: "Korea" });
    expect(discoverPublishedSlugs(dir)).toEqual(["korea", "us"]);
  });

  it("excludes guides marked draft:true, in either shape", async () => {
    await flat("live", { title: "Live" });
    await flat("hidden", { title: "Hidden", draft: true });
    await dirGuide("draftdir", { title: "Draft dir", draft: true });
    expect(discoverPublishedSlugs(dir)).toEqual(["live"]);
  });

  it("treats draft:false and a missing draft key as published", async () => {
    await flat("a", { draft: false });
    await flat("b", {});
    expect(discoverPublishedSlugs(dir)).toEqual(["a", "b"]);
  });

  it("skips a directory with no _guide.json and malformed JSON without throwing", async () => {
    await mkdir(path.join(dir, "empty"), { recursive: true });
    await writeFile(path.join(dir, "broken.json"), "{ not json");
    await flat("ok", { title: "OK" });
    expect(discoverPublishedSlugs(dir)).toEqual(["ok"]);
  });

  it("returns [] for a nonexistent dir", () => {
    expect(discoverPublishedSlugs(path.join(dir, "nope"))).toEqual([]);
  });
});

describe("homepageLists (pure)", () => {
  it("matches the slug-anchored guide href", () => {
    expect(homepageLists('<a href="/Trip-Guides/guides/korea/">', "korea")).toBe(true);
  });
  it("does not match a different slug or a partial", () => {
    expect(homepageLists('<a href="/guides/korea/">', "kore")).toBe(false);
    expect(homepageLists('<a href="/guides/denmark/">', "korea")).toBe(false);
  });
  it("is safe on non-string input", () => {
    expect(homepageLists(null, "korea")).toBe(false);
  });
});

describe("diagnose (pure verdict)", () => {
  const homepage = 'links: /guides/korea/ /guides/denmark/ /guides/us/';

  it("is ok when every published guide is reachable and listed", () => {
    const r = diagnose(["korea", "denmark", "us"], {
      homepageHtml: homepage,
      guideStatus: { korea: 200, denmark: 200, us: 200 },
    });
    expect(r).toEqual({ ok: true, problems: [] });
  });

  it("flags a guide whose own URL does not return 200 as unreachable", () => {
    const r = diagnose(["korea", "us"], {
      homepageHtml: homepage,
      guideStatus: { korea: 200, us: 404 },
    });
    expect(r.ok).toBe(false);
    expect(r.problems).toEqual([
      { slug: "us", kind: PROBLEM.UNREACHABLE, detail: "GET /guides/us/ → 404" },
    ]);
  });

  it("flags a reachable-but-unlinked guide as unlisted (the Sedona failure mode)", () => {
    const r = diagnose(["korea", "us"], {
      homepageHtml: "links: /guides/korea/", // us is live but the homepage never links it
      guideStatus: { korea: 200, us: 200 },
    });
    expect(r.ok).toBe(false);
    expect(r.problems).toEqual([
      { slug: "us", kind: PROBLEM.UNLISTED, detail: "/guides/us/ is live but the homepage does not link it" },
    ]);
  });

  it("does not check listing for a guide that itself 404s (one problem, not two)", () => {
    const r = diagnose(["us"], { homepageHtml: null, guideStatus: { us: 404 } });
    expect(r.problems).toHaveLength(1);
    expect(r.problems[0].kind).toBe(PROBLEM.UNREACHABLE);
  });

  it("reports no-homepage when a reachable guide can't be listing-checked", () => {
    const r = diagnose(["us"], { homepageHtml: null, guideStatus: { us: 200 } });
    expect(r.problems[0].kind).toBe(PROBLEM.NO_HOMEPAGE);
  });

  it("treats a missing status entry as unreachable", () => {
    const r = diagnose(["ghost"], { homepageHtml: homepage, guideStatus: {} });
    expect(r.problems[0]).toMatchObject({ slug: "ghost", kind: PROBLEM.UNREACHABLE });
  });
});

describe("checkLive (shell, injected fetch — no network, no real clock)", () => {
  // Injected fetch keyed by URL substring; returns a Response-like object.
  const makeFetch = (routes) => async (url) => {
    for (const [needle, resp] of routes) {
      if (url.includes(needle)) {
        return { status: resp.status, text: async () => resp.body ?? "" };
      }
    }
    return { status: 404, text: async () => "" };
  };
  const noSleep = () => Promise.resolve();
  // discoverPublishedSlugs is exercised on its own above; here we pass slugs explicitly by
  // pointing checkLive at a dir we control via a tiny wrapper. Simpler: stub the dir with a
  // real temp dir per test.

  let dir;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "vl-shell-"));
    await writeFile(path.join(dir, "korea.json"), JSON.stringify({ title: "Korea" }));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("returns ok on the first attempt when the site is healthy (no retries)", async () => {
    let attempts = 0;
    const fetchImpl = async (url) => {
      if (url.includes("/guides/korea/")) return { status: 200, text: async () => "" };
      attempts++;
      return { status: 200, text: async () => "home /guides/korea/ home" };
    };
    const r = await checkLive({ base: "https://x", guidesDir: dir, fetchImpl, sleep: noSleep, delayMs: 0 });
    expect(r.ok).toBe(true);
    expect(r.expected).toEqual(["korea"]);
    expect(attempts).toBe(1); // homepage fetched exactly once ⇒ no retry loop ran
  });

  it("retries while unlisted, then succeeds once propagation catches up", async () => {
    let round = 0;
    const fetchImpl = async (url) => {
      if (url.includes("/guides/korea/")) return { status: 200, text: async () => "" };
      // homepage: first call omits the link, second call includes it
      round++;
      return { status: 200, text: async () => (round >= 2 ? "home /guides/korea/" : "home (empty)") };
    };
    const r = await checkLive({ base: "https://x", guidesDir: dir, fetchImpl, sleep: noSleep, delayMs: 0, retries: 3 });
    expect(r.ok).toBe(true);
    expect(round).toBeGreaterThanOrEqual(2);
  });

  it("gives up after the retry budget and reports the problem", async () => {
    const fetchImpl = async (url) => {
      if (url.includes("/guides/korea/")) return { status: 404, text: async () => "" };
      return { status: 200, text: async () => "home (no link ever)" };
    };
    const r = await checkLive({ base: "https://x", guidesDir: dir, fetchImpl, sleep: noSleep, delayMs: 0, retries: 2 });
    expect(r.ok).toBe(false);
    expect(r.problems[0].kind).toBe(PROBLEM.UNREACHABLE);
  });

  it("is a no-op (ok) when there are no published guides", async () => {
    await rm(path.join(dir, "korea.json"));
    const r = await checkLive({ base: "https://x", guidesDir: dir, fetchImpl: makeFetch([]), sleep: noSleep });
    expect(r).toMatchObject({ ok: true, expected: [] });
  });
});
