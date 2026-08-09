/* Ink on a coloured FILL must come from that fill's own token, never a literal.

   Three separate call sites shipped this bug and each was found by hand, one at a time:
   `#fff` on `--green` (2.73:1 in dark), `--accent-ink` on `--accent` (1.45–2.30:1, every
   guide), and `#fff` on `--accent` (3.69:1 on denmark, which only that guide's lighter
   extracted palette exposed). They are the same mistake, so this is the gate for the mistake
   rather than a fourth patch for a fourth instance.

   Why a literal is specifically wrong here: `--accent` and `--accent-ink` are EXTRACTED PER
   GUIDE (src/lib/accent-tokens.ts), and `--green`/`--warn`/`--crit` re-map per theme. A literal
   is a bet that every present and future palette happens to contrast with it. `--on-accent` is
   `readableOn(accent, 4.5)` — correct by construction rather than by luck.

   This is a static scan, so it cannot judge contrast; it judges PROVENANCE, which is the part
   that generalises. Runtime ratios are measured in the Playwright gates. */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("..", import.meta.url));

function cssFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) cssFiles(p, out);
    else if (name.endsWith(".css")) out.push(p);
  }
  return out;
}

/* The fills whose ink is theme- or guide-dependent. A literal on any of these is a bet.
   Deliberately NOT including fixed grounds like rgba(12,15,18,.8) — a photo scrim is a known
   constant, and `#fff` on it is a correct answer, not a guess. */
const RISKY_FILL = /background(?:-color)?:\s*[^;}]*var\(--(accent|green|warn|crit-fill|ink)\b/;

/* src/styles/budget-sheet.css is the PRINT sheet: paper is white whatever theme the reader is
   in, so its --bs-* palette is literal on purpose and that file documents why. */
const EXEMPT = ["budget-sheet.css", "progress-preview"];

const FILES = [...cssFiles(join(SRC, "styles")), ...cssFiles(join(SRC, "features"))].filter(
  (f) => !EXEMPT.some((e) => f.replace(/\\/g, "/").includes(e)),
);

describe("ink on a coloured fill", () => {
  it("found stylesheets to scan", () => {
    expect(FILES.length).toBeGreaterThan(20);
  });

  it("never sets a literal colour in a rule that paints a token-driven fill", () => {
    const bad: string[] = [];
    for (const file of FILES) {
      const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
      for (const m of css.matchAll(/\{([^{}]*)\}/g)) {
        const body = m[1];
        if (!RISKY_FILL.test(body)) continue;
        const colour = body.match(/(?:^|;)\s*color:\s*([^;]+)/);
        if (!colour) continue;
        const v = colour[1].trim();
        if (v.startsWith("var(") || v === "inherit" || v === "currentColor") continue;
        const line = css.slice(0, m.index).split("\n").length;
        bad.push(`${file.slice(SRC.length).replace(/\\/g, "/")}:${line}  color:${v} on a token-driven fill`);
      }
    }
    expect(
      bad,
      "A rule paints a fill from --accent/--green/--warn/--crit-fill/--ink and sets its text " +
        "colour to a literal. Those fills change per guide (accent is extracted) or per theme, " +
        "so a literal only contrasts by luck — three shipped bugs came from exactly this. Use " +
        "the fill's own --on-* token: --on-accent, --on-green, --on-crit, or --bg for --ink.",
    ).toEqual([]);
  });
});
