/* A var() with no fallback that names nothing is invalid at computed-value time: the whole
   declaration is dropped and the property silently falls back to its initial value. CSS does
   not warn. KNOWN LIMIT: `declared` is one repo-wide set, so this proves a name EXISTS, not
   that it is in scope where it is read — scope needs a cascade, which is a browser. */
// @protects-file No stylesheet reads a design value that does not exist.

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("..", import.meta.url));

/* .astro files carry <style> blocks, and those are stylesheets the product ships too. Leaving
   them out was a real hole: the two preview pages alone hold ~55 bare var() reads this gate
   could not see. */
function styleSources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) styleSources(p, out);
    else if (name.endsWith(".css") || name.endsWith(".astro")) out.push(p);
  }
  return out;
}

/** An .astro file's CSS is only what is inside its <style> blocks; the rest is markup and TS. */
function cssOf(file: string): string {
  const raw = readFileSync(file, "utf8");
  if (!file.endsWith(".astro")) return raw;
  let css = "";
  const blank = (s: string) => s.replace(/[^\n]/g, " ");
  for (const m of raw.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    // Keep the offsets honest so reported line numbers still point into the real file.
    css += blank(raw.slice(css.length, m.index)) + m[1];
  }
  return css + blank(raw.slice(css.length));
}

/* Properties written from JS or an inline style attribute, which a static scan cannot see.
   EMPTY today, and that is the finding rather than an oversight: every runtime-written property
   in this codebase — --ring-frac, --mn-ind-x, --scrub-x, --i, --tp-past, and the two added this
   arc, --spine-fill and --pg-progress — is already read through a fallback, so none needs an
   exemption. An entry here should be a deliberate
   statement that something at runtime writes a property read bare, not a way to quiet this. */
const RUNTIME_SET = new Map<string, string>([]);

const FILES = [
  ...styleSources(join(SRC, "styles")),
  ...styleSources(join(SRC, "features")),
  ...styleSources(join(SRC, "pages")),
  ...styleSources(join(SRC, "layouts")),
  ...styleSources(join(SRC, "components")),
];
const ALL = FILES.map((f) => ({ file: f.slice(SRC.length).replace(/\\/g, "/"), css: cssOf(f) }));

/* Blank out comments before scanning — the long explanatory comments throughout these
   stylesheets name tokens in prose. Replaced with same-length whitespace (newlines kept) so
   reported line numbers still point at the real line in the real file. */
const stripped = ALL.map((f) => ({
  ...f,
  css: f.css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")),
}));

const declared = new Set<string>();
for (const { css } of stripped) for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:/gi)) declared.add(m[1]);

describe("every var() resolves", () => {
  it("found the stylesheets and their declarations at all", () => {
    expect(FILES.length).toBeGreaterThan(20);
    expect(declared.has("--ink")).toBe(true);
    expect(declared.has("--rule")).toBe(true);
  });

  it("reads no custom property that nothing declares", () => {
    const orphans: string[] = [];
    for (const { file, css } of stripped) {
      /* A var() that supplies a fallback is safe by construction — an undeclared name there
         resolves to the fallback, which is the documented way to read something optional. Only
         the bare, no-fallback form can silently invalidate its declaration. */
      for (const m of css.matchAll(/var\(\s*(--[a-z0-9-]+)\s*([,)])/gi)) {
        const name = m[1];
        if (m[2] === ",") continue;
        if (declared.has(name) || RUNTIME_SET.has(name)) continue;
        const line = css.slice(0, m.index).split("\n").length;
        orphans.push(`${file}:${line}  var(${name}) — nothing declares it`);
      }
    }
    expect(
      [...new Set(orphans)],
      "A stylesheet reads a custom property no stylesheet declares. CSS does not error on this: " +
        "the declaration is invalid at computed-value time and the property silently falls back " +
        "to its initial value. Either fix the name, declare the token, or — if something at " +
        "runtime writes it — add it to RUNTIME_SET in this file with who writes it.",
    ).toEqual([]);
  });
});
