/* Colour-drift guard — the D2 sibling of type-scale.test.ts's font-size gate.

   D2's audit (2026-08-29) found the same "authors reaching past the scale" shape
   type-scale.test.ts documents, just for colour: six independently hand-picked near-black
   RGB triples — rgba(0,0,0,·), (16,20,24,·), (10,14,18,·), (8,11,14,·), (12,15,18,·) and
   (10,13,16,·) — scattered across 30 box-shadow/backdrop declarations in 16 files, none of
   them a deliberate choice, all of them "a bit darker than that other one". They are now
   ONE token, --shadow-rgb (base.css), read as rgba(var(--shadow-rgb),alpha) so each site
   keeps its own alpha (a real per-use decision) while the base colour stops drifting.

   This test is the ratchet that keeps it that way: it fails the build on a bare hex or
   rgb(a) literal outside the token core, so the next "just a bit darker" has to go through
   base.css instead of being typed inline. Every literal that legitimately remains — a fixed
   photo-scrim ink, a themed-mode's own palette, print's forced paper-white — is either
   file-exempt (matching the precedent on-fill.test.ts already set for budget-sheet.css) or
   named in ALLOWED with its reason. The list is closed on purpose, same as type-scale's. */
// @protects-file No new raw colour value is introduced outside the token core unnoticed.

import { describe, expect, test } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("..", import.meta.url));

/* Files that are themselves a self-contained, documented colour source and not the shared
   core: each is a closed, one-purpose palette rather than scattered drift.
     - print.css: a different medium — physical paper, forced light, no theme.
     - budget-sheet.css: the PRINT sheet (on-fill.test.ts's own precedent) — paper is white
       whatever theme the reader is in, and its --bs-* tokens are literal on purpose.
     - painted-atlas.css: the Painted Atlas themed mode's OWN palette (sky/ground/orb hues
       per time-of-day) — declared once here as that mode's tokens, not duplicated
       elsewhere, which is exactly what "surfaces are themes of the core" allows. */
const EXEMPT_FILES = ["styles/print.css", "styles/budget-sheet.css", "styles/painted-atlas.css"];

type Exception = { marker: string; value: string; why: string };

const ALLOWED: Exception[] = [
  {
    marker: "rgba(156,68,33,.22)",
    value: "rgba(156,68,33,.22)",
    why: "progressive-enhancement fallback for browsers without color-mix() — the very next declaration overrides it with color-mix(in srgb,var(--accent) 22%,transparent); the literal must equal --accent's own RGB by construction, not a second colour",
  },
  {
    marker: ".grail-stop{border:0;background:transparent;color:#000",
    value: "#000",
    why: "inside @media print — the rail becomes a plain list on paper; same forced-paper reasoning as print.css",
  },
  {
    marker: "mask-image:linear-gradient(to right,transparent 0,#000",
    value: "#000",
    why: "an alpha mask stop, not a fill colour — mask-image only reads the stop's opacity, so #000/transparent is the idiom, not a paint decision",
  },
  // --- Fixed photo-scrim ink: text/border painted on the near-black --shadow-rgb scrim over
  // media. on-fill.test.ts already rules this correct ("a photo scrim is a known constant,
  // and #fff on it is a correct answer, not a guess") — these are that same constant's ink.
  {
    marker: ".tag--onphoto{color:#e9ede2",
    value: "#e9ede2",
    why: "photo-scrim ink — fixed regardless of theme, the scrim itself never re-maps",
  },
  { marker: ".sight-name--onphoto{color:#fff", value: "#fff", why: "photo-scrim ink" },
  {
    marker: ".prov-dot--onphoto{color:rgba(255,255,255,.75)",
    value: "rgba(255,255,255,.75)",
    why: "photo-scrim ink",
  },
  {
    marker: "border-color:rgba(255,255,255,.75)",
    value: "rgba(255,255,255,.75)",
    why: "photo-scrim ink, same rule's border",
  },
  {
    marker: ".prov-dot--onphoto:hover,.sight-media.media-ok .prov-dot--onphoto:focus-visible{color:#fff",
    value: "#fff",
    why: "photo-scrim ink",
  },
  { marker: "border-color:#fff}", value: "#fff", why: "photo-scrim ink, hover/focus border" },
  {
    marker: ".imgcredit--onphoto{position:absolute",
    value: "rgba(248,250,243,.85)",
    why: "photo-scrim ink",
  },
  { marker: ".imgcredit--onphoto:hover{background", value: "#fff", why: "photo-scrim ink" },
  { marker: ".sight-media-cap{position:static", value: "#111", why: "photo-scrim ink, print/no-media fallback" },
  {
    marker: ".sight-name--onphoto,.tag--onphoto{color:#111",
    value: "#111",
    why: "photo-scrim ink, print/no-media fallback",
  },
  { marker: ".mast-pause{position:absolute", value: "rgba(248,250,243,.92)", why: "photo-scrim ink" },
  { marker: ".mast-pause:hover{color:#fff", value: "#fff", why: "photo-scrim ink" },
  { marker: ".mast-credit{position:absolute", value: "rgba(248,250,243,.82)", why: "photo-scrim ink" },
  { marker: ".mast-credit:hover{color:#fff", value: "#fff", why: "photo-scrim ink" },
  {
    marker: ".mast-title,.mast-dek,.mast-eyebrow{color:#111",
    value: "#111",
    why: "no-media fallback: forces dark ink when hero media fails to load",
  },
  { marker: ".mast-cities,.mast-nextleg{color:#111", value: "#111", why: "no-media fallback ink" },
  { marker: ".mast-live-prog{color:#111", value: "#111", why: "no-media fallback ink" },
  {
    marker: "padding: 3px 7px; background: rgba(var(--shadow-rgb),.74); color: #f4f6f1;",
    value: "#f4f6f1",
    why: "photo-scrim ink on the map attribution chip",
  },
  // --- Story mode: a fixed dark takeover register in BOTH themes (base.css's --dark-*
  // block documents why it never re-maps). White at partial opacity for progress segments
  // is a one-component decorative choice on that fixed ground, not page ink.
  { marker: ".sm-seg{flex:1 1 0", value: "rgba(255,255,255,.24)", why: "story mode's fixed dark register — progress segment, not page ink" },
  { marker: ".sm-seg.done{background:rgba(255,255,255,.6)", value: "rgba(255,255,255,.6)", why: "story mode's fixed dark register" },
];

function styleSources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) styleSources(p, out);
    else if (name.endsWith(".css") || name.endsWith(".astro")) out.push(p);
  }
  return out;
}

/** An .astro file's CSS is only what is inside its <style> blocks — a meta tag's literal
    theme-color or a <script>'s JS string is not a stylesheet declaration. */
function cssOf(file: string): string {
  const raw = readFileSync(file, "utf8");
  if (!file.endsWith(".astro")) return raw;
  let css = "";
  for (const m of raw.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) css += m[1] + "\n";
  return css;
}

/** Blank out comments and @media print blocks (same treatment: prose that names hex values,
    and a different medium entirely) so line numbers stay real but neither is scanned. */
function stripNonSource(css: string): string {
  const out = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  // Blank the body of every `@media print{...}` block (bracket-matched from each match
  // start) — print is a different medium entirely, same reasoning as print.css's own
  // file-level exemption, just scattered across component files instead of one place.
  let result = "";
  let i = 0;
  while (i < out.length) {
    const start = out.indexOf("@media print", i);
    if (start === -1) {
      result += out.slice(i);
      break;
    }
    result += out.slice(i, start);
    const open = out.indexOf("{", start);
    if (open === -1) {
      result += out.slice(start).replace(/[^\n]/g, " ");
      break;
    }
    let depth = 1;
    let k = open + 1;
    while (k < out.length && depth > 0) {
      if (out[k] === "{") depth++;
      else if (out[k] === "}") depth--;
      k++;
    }
    result += out.slice(start, k).replace(/[^\n]/g, " ");
    i = k;
  }
  return result;
}

const FILES = [
  ...styleSources(join(SRC, "styles")),
  ...styleSources(join(SRC, "features")),
  ...styleSources(join(SRC, "layouts")),
  ...styleSources(join(SRC, "components")),
];

describe("colour scale", () => {
  test("found the stylesheets to scan", () => {
    expect(FILES.length).toBeGreaterThan(20);
  });

  test("no raw hex/rgb(a) literal outside the token core or a justified exception", () => {
    const offenders: string[] = [];

    for (const file of FILES) {
      const rel = relative(SRC, file).replace(/\\/g, "/");
      if (EXEMPT_FILES.includes(rel)) continue;
      if (rel === "styles/base.css") continue; // the token core itself

      const css = stripNonSource(cssOf(file));
      css.split(/\r?\n/).forEach((line, i) => {
        // rgba(var(--shadow-rgb),...) and any other var()/color-mix() reference is fine —
        // only a literal hex or a numeric rgb(a)(N,N,N[,N]) is a candidate for drift.
        const hexMatches = [...line.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]);
        const rgbMatches = [...line.matchAll(/rgba?\(\s*\d[\d.\s,%]*\)/g)].map((m) => m[0]);
        for (const value of [...hexMatches, ...rgbMatches]) {
          const excused = ALLOWED.some((a) => line.includes(a.marker) && line.includes(a.value));
          if (!excused) offenders.push(`${rel}:${i + 1}  ${value}  —  ${line.trim()}`);
        }
      });
    }

    expect(
      offenders,
      "A raw hex or rgb(a) colour literal slipped past the token core. Either reuse an " +
        "existing token (base.css is the only place a new one may be declared — see " +
        "--shadow-rgb's 2026-08-29 comment for why a shadow/scrim tint got its own, " +
        "non-remapping entry there), or — if the literal is genuinely fixed regardless of " +
        "theme, like the photo-scrim ink above — add it to ALLOWED in this file WITH the " +
        "reason. The list is closed on purpose: six near-black RGB triples accumulated once " +
        "already because nothing said no",
    ).toEqual([]);
  });
});
