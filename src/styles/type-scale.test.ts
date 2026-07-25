/* Type-scale drift guard.

   The scale reached 93% adoption (360 of 388 font-size declarations) only after three
   migration passes, and it got to 82 distinct hardcoded values in the first place because
   nothing ever stopped the next one. Adoption is not a state you reach, it is a state you
   hold — so this fails the build on a bare font-size literal that isn't explicitly justified.

   Deliberately NOT flagged, because they are categorically different from "a hardcoded step":
     · var(--text-*)  — the whole point.
     · clamp(...)     — fluid display sizing, which scales with viewport by design.
     · em             — intentionally relative to its own parent, not to the scale.
     · pt             — physical print units; print has no viewport and no user font preference.
   Only a bare rem/px literal is a candidate for drift, because that is the thing someone types
   when they want "a bit smaller than that other one" instead of reaching for a step.

   Mirrors the allowlist shape of tests/visual/a11y.spec.ts on purpose: a closed list, every
   entry carrying its own WHY, and anything unrecognised failing loudly rather than being
   silently absorbed. */
import { describe, expect, test } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("..", import.meta.url));

/** The declared scale, mirrored from base.css purely to make failure messages useful.
    For the fluid heading steps this is the clamp's MAX (its desktop rendering). */
const SCALE: Record<string, number> = {
  "--text-nano": 0.6,
  "--text-micro": 0.68,
  "--text-control-sm": 0.72,
  "--text-caption": 0.78,
  "--text-control": 0.82,
  "--text-small": 0.88,
  "--text-body": 1.02,
  "--text-lead": 1.15,
  "--text-h4": 1.3,
  "--text-h3": 1.6,
  "--text-h2": 2.0,
};

type Exception = { marker: string; value: string; why: string };

/* Each entry is a size that is load-bearing for something OTHER than the type role, so
   putting it on a step would trade a real property for tidiness. Adding to this list is
   allowed — silently is not. */
const ALLOWED: Exception[] = [
  {
    marker: "summary::before",
    value: ".68rem",
    why: 'sizes content:"▶", a disclosure glyph, not a micro-label — it should track the marker, not the label scale',
  },
  {
    marker: "summary::before",
    value: ".65rem",
    why: "same disclosure glyph on the second collapsible variant",
  },
  {
    marker: ".day-num",
    value: "2rem",
    why: "contrast-gated: planner.css documents this numeral as LARGE text (3:1) rather than small (4.5:1); shrinking it re-grades the contrast bar",
  },
  {
    marker: ".day-num",
    value: "1.2rem",
    why: "the mobile half of the same contrast gate — 19.2px bold = 14.4pt, just above axe's 14pt bold-large cutoff, and only 4.3% from --text-lead",
  },
  {
    marker: ".sos-num",
    value: "1.7rem",
    why: "the emergency phone number; snapping down 6% to --text-h3 trades real legibility for tidiness on the one number read in an emergency",
  },
  {
    marker: ".wx-date",
    value: ".54rem",
    why: "8.64px, genuinely below the scale's floor (10% under --text-nano) — a deliberate outlier, not drift",
  },
  {
    marker: ".hubcard-cover-initial",
    value: "4.6rem",
    why: "a decorative cover letter, display-scale rather than a heading; --text-h2 is 130% away",
  },
];

/* Print is a different medium entirely — physical units, no viewport, no user font
   preference. Screen tokens have no business governing it. */
const ALLOWED_FILES = ["styles/print-day.css"];

function cssFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) cssFiles(p, out);
    else if (p.endsWith(".css")) out.push(p);
  }
  return out;
}

const toRem = (v: string): number | null => {
  const rem = v.match(/^([\d.]+)rem$/);
  if (rem) return parseFloat(rem[1]);
  const px = v.match(/^([\d.]+)px$/);
  if (px) return parseFloat(px[1]) / 16;
  return null;
};

/** Nearest step, so a failure tells you which token to reach for instead of just "no". */
function suggest(value: string): string {
  const rem = toRem(value);
  if (rem === null) return "no rem/px equivalent";
  let best: { name: string; pct: number } | null = null;
  for (const [name, val] of Object.entries(SCALE)) {
    const pct = ((rem - val) / val) * 100;
    if (!best || Math.abs(pct) < Math.abs(best.pct)) best = { name, pct };
  }
  const shift = best!.pct >= 0 ? `${best!.pct.toFixed(1)}% smaller` : `${Math.abs(best!.pct).toFixed(1)}% larger`;
  return `var(${best!.name}) would render ${shift}`;
}

describe("type scale", () => {
  test("no bare font-size literal outside the declared scale or the justified exceptions", () => {
    const offenders: string[] = [];

    for (const file of cssFiles(SRC)) {
      const rel = relative(SRC, file).replace(/\\/g, "/");
      if (ALLOWED_FILES.includes(rel)) continue;

      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, i) => {
          const matches = line.matchAll(/font-size:\s*([\d.]+(?:rem|px))(?=[;}\s])/g);
          for (const m of matches) {
            const value = m[1];
            const excused = ALLOWED.some((a) => line.includes(a.marker) && a.value === value);
            if (!excused) offenders.push(`${rel}:${i + 1}  font-size:${value}  ->  ${suggest(value)}`);
          }
        });
    }

    expect(
      offenders,
      "A raw font-size slipped past the type scale. Either put it on the nearest step " +
        "(the suggestion after each arrow), or — if its size is load-bearing for something " +
        "other than the type role, the way .day-num's is contrast-gated — add it to ALLOWED " +
        "in this file WITH the reason. The list is closed on purpose: 82 distinct values " +
        "accumulated once already because nothing said no",
    ).toEqual([]);
  });

  /* iOS Safari zooms the whole page in when a text-entry control smaller than 16px takes
     focus, and never zooms back out — the reader is left on a magnified, sideways-scrolling
     page after tapping a search box. So 16px is a behavioural floor for controls, not a
     stylistic preference, and it is worth a gate of its own.
     Matched by selector text, which means this only guards controls it can recognise: element
     selectors, plus the class-named ones listed here. A genuinely new control class needs
     adding — the browser knows what an <input> is, a stylesheet does not. */
  const CONTROL_SELECTORS = [
    ".cur-in",
    ".hub-search",
    ".pal-input",
    ".jl-select",
    ".share-url-txt",
    ".tk-entry-select",
    ".rm-in",
    ".lnw-ta",
  ];

  test("text-entry controls are >=16px, so iOS does not zoom the page on focus", () => {
    const tooSmall: string[] = [];

    for (const file of cssFiles(SRC)) {
      const rel = relative(SRC, file).replace(/\\/g, "/");
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, i) => {
          const isControl =
            /(^|[\s,{])(input|select|textarea)[\s,{:]/.test(line) ||
            CONTROL_SELECTORS.some((s) => line.includes(s + "{") || line.includes(s + " ") || line.includes(s + ","));
          if (!isControl) return;

          const token = line.match(/font-size:\s*var\((--text-[\w-]+)\)/);
          if (token) {
            const rem = SCALE[token[1]];
            if (rem !== undefined && rem * 16 < 16) {
              tooSmall.push(`${rel}:${i + 1}  var(${token[1]}) = ${(rem * 16).toFixed(2)}px`);
            }
            return;
          }
          const literal = line.match(/font-size:\s*([\d.]+)(rem|px)(?=[;}\s])/);
          if (literal) {
            const px = literal[2] === "rem" ? parseFloat(literal[1]) * 16 : parseFloat(literal[1]);
            if (px < 16) tooSmall.push(`${rel}:${i + 1}  ${literal[1]}${literal[2]} = ${px.toFixed(2)}px`);
          }
        });
    }

    expect(
      tooSmall,
      "A text-entry control is under 16px. iOS Safari will zoom the page in when it takes " +
        "focus and will not zoom back out, stranding the reader on a magnified page after a " +
        "single tap. Use var(--text-body) (16.32px). This is a behavioural threshold, not a " +
        "size preference — do not 'fix' it by shrinking the requirement",
    ).toEqual([]);
  });

  test("every --text-* token referenced anywhere in src is actually declared in base.css", () => {
    const declared = new Set(
      [...readFileSync(join(SRC, "styles/base.css"), "utf8").matchAll(/(--text-[\w-]+)\s*:/g)].map((m) => m[1]),
    );

    const dangling: string[] = [];
    for (const file of cssFiles(SRC)) {
      const rel = relative(SRC, file).replace(/\\/g, "/");
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, i) => {
          for (const m of line.matchAll(/var\((--text-[\w-]+)/g)) {
            if (!declared.has(m[1])) dangling.push(`${rel}:${i + 1}  var(${m[1]})`);
          }
        });
    }

    expect(
      dangling,
      "A --text-* token is used but never declared in base.css. This is the silent one: an " +
        "undeclared custom property doesn't error, it just yields nothing, so font-size falls " +
        "back to the inherited value and the text renders at the wrong size with no warning",
    ).toEqual([]);
  });
});
