/* Every var() a stylesheet reads must resolve to something.

   Written because of a real one. `.learn-tally-row` in the learnings silo asked for
   `1px solid var(--line)` — a token this product has never defined. CSS does not warn about
   that: the declaration is invalid at computed-value time, `border-color` falls back to its
   initial value, and the row quietly drew its frame in whatever colour its text happened to
   be. It renders. It just renders wrong, in a way no unit test of any module could see and no
   screenshot obviously flags.

   So this reads every stylesheet the product ships, collects what each one DECLARES, and
   asserts that every name any of them READS resolves. A var() carrying a FALLBACK is exempt by
   construction — an undeclared name there resolves to the fallback, which is the documented way
   to read something optional. Only the bare form can silently invalidate its own declaration. */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("..", import.meta.url));

function cssFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) cssFiles(p, out);
    else if (name.endsWith(".css")) out.push(p);
  }
  return out;
}

/* Properties written from JS or an inline style attribute, which a static scan cannot see.
   EMPTY today, and that is the finding rather than an oversight: every runtime-written property
   in this codebase — --ring-frac, --mn-ind-x, --scrub-x, --i, --tp-past — is already read
   through a fallback, so none of them needs an exemption. An entry here should be a deliberate
   statement that something at runtime writes a property read bare, not a way to quiet this. */
const RUNTIME_SET = new Map<string, string>([]);

const FILES = [...cssFiles(join(SRC, "styles")), ...cssFiles(join(SRC, "features"))];
const ALL = FILES.map((f) => ({ file: f.slice(SRC.length).replace(/\\/g, "/"), css: readFileSync(f, "utf8") }));

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
