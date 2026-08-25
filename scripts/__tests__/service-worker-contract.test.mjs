import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const SW_PATH = path.join(ROOT, "public/sw.js");
const GEN_PATH = path.join(ROOT, "scripts/gen-sw-precache.mjs");
const sw = readFileSync(SW_PATH, "utf8");

describe("offline service-worker contract", () => {
  it("bounds network-first HTML navigation and falls back to cached content", () => {
    expect(sw).toMatch(/const HTML_NETWORK_TIMEOUT_MS = \d+;/);
    expect(sw).toMatch(/new AbortController\(\)/);
    expect(sw).toMatch(/setTimeout\(\(\) => controller\.abort\(\), HTML_NETWORK_TIMEOUT_MS\)/);
    expect(sw).toMatch(/fetch\(request, \{ signal: controller\.signal \}\)/);
    expect(sw).toMatch(/caches\.match\(req\).*caches\.match\(BASE \+ "\/"\)/s);
  });

  it("never persists failed HTML or asset responses", () => {
    const okChecks = sw.match(/if \(res\.ok\)/g) || [];
    expect(okChecks.length).toBeGreaterThanOrEqual(2);
    expect(sw).not.toMatch(/cache\.put\([^\n]+\).*without/i);
  });

  it("keeps HTML network-first and static assets cache-first", () => {
    const htmlBranch = sw.slice(sw.indexOf("if (isHTML)"), sw.indexOf("// assets/images/fonts"));
    expect(htmlBranch.indexOf("fetchHtmlWithTimeout(req)")).toBeLessThan(htmlBranch.indexOf("caches.match(req)"));

    const assetBranch = sw.slice(sw.indexOf("// assets/images/fonts"));
    expect(assetBranch.indexOf("caches.match(req)")).toBeLessThan(assetBranch.indexOf("fetch(req)"));
  });
});

describe("generated service-worker precache", () => {
  it("derives guide pages from the built output and content-versions the cache", () => {
    const temp = mkdtempSync(path.join(tmpdir(), "waypoint-sw-"));
    try {
      const dist = path.join(temp, "dist");
      mkdirSync(path.join(dist, "guides", "alpha"), { recursive: true });
      mkdirSync(path.join(dist, "guides", "zeta"), { recursive: true });
      mkdirSync(path.join(dist, "_astro"), { recursive: true });

      writeFileSync(path.join(dist, "sw.js"), sw);
      writeFileSync(path.join(dist, "index.html"), "<html>home</html>");
      writeFileSync(path.join(dist, "guides", "alpha", "index.html"), "<html>alpha</html>");
      writeFileSync(path.join(dist, "guides", "zeta", "index.html"), "<html>zeta</html>");
      writeFileSync(path.join(dist, "_astro", "entry.123.js"), "console.log('x')");

      const run = spawnSync(process.execPath, [GEN_PATH], {
        cwd: temp,
        encoding: "utf8",
      });
      expect(run.status, run.stderr || run.stdout).toBe(0);

      const generated = readFileSync(path.join(dist, "sw.js"), "utf8");
      expect(generated).toContain('BASE + "/guides/alpha/"');
      expect(generated).toContain('BASE + "/guides/zeta/"');
      expect(generated).toContain('BASE + "/data/countries-110m.json"');
      expect(generated).toMatch(/const CACHE = "tripguides-[0-9a-f]{12}";/);
      expect(generated).not.toContain('const CACHE = "tripguides-dev";');
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });
});
