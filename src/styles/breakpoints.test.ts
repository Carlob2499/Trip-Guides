/* Breakpoint drift guard. src/lib/breakpoints.ts is the source; JS imports it, CSS cannot (see
   that file for why), so a stylesheet keeps its literal and marks it `bp:NAME` above the query
   and this test makes the mark mean something. Same contract as type-scale.test.ts and
   atlas-tokens.test.ts: the source is IMPORTED, never hand-copied here, so a value edited in one
   place cannot report green while the stylesheets say something else. */
// @protects-file One number decides the phone/tablet cut, so no two surfaces can disagree about it.

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { MOBILE_MAX, TABLET_MIN, DESKTOP_MIN } from "../lib/breakpoints";

const SRC = fileURLToPath(new URL("..", import.meta.url));
const VALUE: Record<string, number> = { MOBILE_MAX, TABLET_MIN, DESKTOP_MIN };

function sources(dir: string, match: RegExp, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) sources(p, match, out);
    else if (match.test(name)) out.push(p);
  }
  return out;
}
const rel = (p: string) => p.slice(SRC.length).replace(/\\/g, "/");

const CSS = sources(SRC, /\.css$/).map((f) => ({ file: rel(f), css: readFileSync(f, "utf8") }));

/* The closed list of marked sites, in the ALLOWED/TARGET_BASELINE idiom this repo already uses:
   adding or removing one is a decision, and the diff is where it gets made. A rule that quietly
   loses its marker is a rule that has quietly left the source. */
const EXPECTED: Record<string, string[]> = {
  // D7 (2026-09): the R5 rail, mobile-nav and story sheets are gone; the five-destination
  // shell's sheets each carry the one breakpoint they recompose on.
  "features/search/styles.css": ["MOBILE_MAX+1"],
  "styles/chrome.css": ["MOBILE_MAX+1"],
  "styles/flight.css": ["MOBILE_MAX"],
  "styles/guide-dest.css": ["TABLET_MIN", "DESKTOP_MIN"],
  "styles/guide.css": ["MOBILE_MAX+1", "TABLET_MIN", "DESKTOP_MIN", "MOBILE_MAX"],
  "styles/itinerary.css": ["DESKTOP_MIN"],
  "styles/map.css": ["DESKTOP_MIN"],
  "styles/trip-split.css": ["MOBILE_MAX"],
  "styles/trip.css": ["MOBILE_MAX+1"],
};

const MARKER = /\/\*\s*bp:([A-Z_]+)(\+1)?\b[\s\S]*?\*\//g;
const WIDTH = /\(\s*(?:min|max)-width:\s*(\d+)px\s*\)/;

type Mark = { file: string; name: string; plusOne: boolean; declared: number | null };

const marks: Mark[] = [];
for (const { file, css } of CSS) {
  for (const m of css.matchAll(MARKER)) {
    const after = css.slice((m.index ?? 0) + m[0].length);
    const w = after.match(WIDTH);
    marks.push({
      file, name: m[1], plusOne: Boolean(m[2]),
      /* Only a width in the query the marker introduces counts — `after` is the rest of the
         sheet, so a marker over a rule with no query at all would otherwise borrow the next
         one's number and pass. 200 chars is comfortably past a prelude and nowhere near the
         following rule's own query. */
      declared: w && (w.index ?? 0) < 200 ? Number(w[1]) : null,
    });
  }
}

describe("every breakpoint literal traces to src/lib/breakpoints.ts", () => {
  it("found the stylesheets and their markers at all", () => {
    expect(CSS.length).toBeGreaterThan(20);
    expect(marks.length).toBe(Object.values(EXPECTED).flat().length);
  });

  it("⌁ no marked query has drifted from the constant it names", () => {
    /* ⌁ The regression: 744 and 899 were literals in ten files. Nothing stopped the eleventh,
       and nothing would have caught the first one edited alone — which is precisely how the
       rail, the day scrubber and the body ended up able to disagree about which model applied
       at one width. */
    const drifted = marks
      .filter((m) => {
        const want = VALUE[m.name];
        return want === undefined || m.declared !== want + (m.plusOne ? 1 : 0);
      })
      .map((m) => `${m.file}  bp:${m.name}${m.plusOne ? "+1" : ""} → ${m.declared ?? "no query found"}`);
    expect(
      drifted,
      "a marked query no longer matches src/lib/breakpoints.ts. Change the constant, not the " +
        "literal — every other surface reads the constant and only this one would move.",
    ).toEqual([]);
  });

  it("⌁ the marked sites are exactly the documented ones", () => {
    const found: Record<string, string[]> = {};
    for (const m of marks) {
      (found[m.file] ??= []).push(m.name + (m.plusOne ? "+1" : ""));
    }
    expect(
      found,
      "a bp: marker was added or removed. Both are fine and both are decisions — record it here.",
    ).toEqual(EXPECTED);
  });

  it("⌁ every @container guide query carries a marker", () => {
    // The guide body's own thresholds are the ones with no viewport to fall back on, so an
    // unmarked one is a literal with nothing holding it to the other three.
    const bare: string[] = [];
    for (const { file, css } of CSS) {
      /* Preludes are found in a comment-BLANKED copy (same length, newlines kept, the idiom
         var-defined.test.ts uses) — these stylesheets explain themselves at length and one of
         them quotes this very query shape in prose. Offsets stay honest, so the marker lookup
         below still reads the real text. */
      const blanked = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
      for (const m of blanked.matchAll(/@container\s+guide\s*\([^)]*\)/g)) {
        const before = css.slice(0, m.index ?? 0);
        if (!/\/\*\s*bp:[A-Z_]+(\+1)?\b[\s\S]*?\*\/\s*$/.test(before)) bare.push(`${file}  ${m[0]}`);
      }
    }
    expect(bare, "an @container guide query with no bp: marker above it").toEqual([]);
  });

  it("⌁ no script re-hardcodes a shared breakpoint in a matchMedia query", () => {
    /* JS has no excuse — it can import the number. A width baked into the query STRING is the
       tenth copy coming back, and it is invisible to the CSS half of this gate. Other numbers
       are other decisions (the hub's own 759 is not this cut) and are left to
       scripts/__tests__/no-device-checks.test.mjs, which is where reading a width is justified. */
    const shared = new Set([MOBILE_MAX, MOBILE_MAX + 1, TABLET_MIN, DESKTOP_MIN]);
    const baked: string[] = [];
    for (const f of sources(SRC, /\.(js|ts|astro)$/)) {
      if (rel(f) === "lib/breakpoints.ts") continue;
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/matchMedia\(\s*["'`]([^"'`]*)["'`]/g)) {
        const w = m[1].match(/(?:min|max)-width:\s*(\d+)px/);
        if (w && shared.has(Number(w[1]))) baked.push(`${rel(f)}  matchMedia("${m[1]}")`);
      }
    }
    expect(baked, "import the constant from src/lib/breakpoints.ts instead").toEqual([]);
  });
});
