/* Which of check-drift's complaints are real.
 *
 * `docs/design-handoff/enforcement/check-drift.mjs` is a vendored kit tool. It emits ~1377 lines
 * against this repo and roughly nine in ten are known false positives — which is not a
 * criticism of it, it is a tool written against the kit's own export, not against what shipped.
 * The cost is real though: two genuine MOTION violations sat in that noise through an entire
 * closeout stage because nobody reads 1377 lines twice.
 *
 * So this classifies. Every exemption below is a NAMED, justified class, not a mute button —
 * if a class is wrong, it is wrong visibly and in one place. What survives is recorded in
 * drift-baseline.json and the gate fails on anything new.
 *
 * Run: node scripts/drift-real.mjs            report
 *      node scripts/drift-real.mjs --update    rewrite the baseline
 */
import { execFileSync } from "node:child_process";
import { closeSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHECKER = "docs/design-handoff/enforcement/check-drift.mjs";
const ROOTS = ["src/styles", "src/features", "src/components", "src/layouts", "src/pages", "src/scripts", "src/lib"];

/* check-drift prints "  file:line  [rule]" then the source line — but truncated to 100 chars.
   Classifying off that echo silently misreads every long CSS rule, which in this repo is most
   of them: `font-family:var(--font-data)` sits at column 150 of a one-line selector block, so
   the naming-mismatch class saw nothing and 60-odd false positives came through as real. Read
   the file. */
const fileLines = new Map();
function linesOf(file) {
  if (!fileLines.has(file)) {
    let src = "";
    try { src = readFileSync(file, "utf8"); } catch { /* deleted or generated */ }
    fileLines.set(file, src.split("\n"));
  }
  return fileLines.get(file);
}
export const sourceLine = (v) => linesOf(v.file)[v.line - 1] ?? v.echo ?? "";

export function parseOutput(text) {
  const out = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s{2}(\S.*?):(\d+)\s{2}\[(.+?)\]\s*$/);
    if (!m) continue;
    const v = {
      file: m[1].replace(/\\/g, "/"),
      line: Number(m[2]),
      rule: m[3],
      category: m[3].split(" ")[0],
      echo: (lines[i + 1] ?? "").trim(),
    };
    v.text = sourceLine(v).trim();
    out.push(v);
  }
  return out;
}

/** The nearest selector above a declaration — the flagged line is often just `box-shadow: …`. */
function blockOf(v) {
  const lines = linesOf(v.file);
  for (let i = v.line - 1; i >= 0 && i > v.line - 12; i--) {
    if (/[.#&][\w-]+[^;]*\{/.test(lines[i])) return lines[i];
  }
  return v.text;
}

/** blockOf's "nearest CSS-selector-shaped line" assumption doesn't fit JS/Astro — a `const tc =
 * document.querySelector('meta[name="theme-color"]')` line has no `{`, so blockOf falls back to
 * v.text alone and misses context sitting one line above. For non-CSS exemptions, just join a
 * plain window of source lines and search that instead. */
function nearbyText(v, before = 3, after = 1) {
  const lines = linesOf(v.file);
  return lines.slice(Math.max(0, v.line - 1 - before), v.line + after).join("\n");
}

/** Split a CSS value on top-level commas only — a color-mix()/rgba() argument list must not be
 * mistaken for a multi-layer box-shadow list. Depth-tracked, not regex: nested parens (var()
 * inside color-mix()) defeat any non-recursive regex attempt at this. */
function splitTopLevelCommas(value) {
  const out = [];
  let depth = 0, cur = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

/** A box-shadow with zero offset AND zero blur on every layer is geometrically a RING, not a
 * drop shadow — there is no depth illusion to read, only a flat-spread outline drawn outside the
 * border box. Handles multi-layer (comma-separated) values, e.g. a double halo, and a bare `0`
 * spread (a pulse animation's start frame, e.g. `0 0 0 0 …` growing to `0 0 0 6px …`) alongside
 * a unit-bearing one — both are legal CSS for a zero length. */
function isRingShadow(value) {
  const segs = splitTopLevelCommas(value.trim());
  return segs.length > 0 && segs.every((seg) => /^0\s+0\s+0\s+(?:0|[\d.]+(?:px|rem))\s+\S/.test(seg.trim()));
}

/* Each entry: why this hit is not real. Order matters only for reporting — a hit is exempt if
 * ANY rule claims it. Every one of these is written down in CLAUDE.md or in the prototype's own
 * markup; none of them is "this was noisy". */
export const EXEMPTIONS = [
  {
    id: "progress-line-is-a-sanctioned-motion-exception",
    why: "R5 BEHAVIOR.md §2 names exactly two departures from transform/opacity and this is one: the phone progress line's left+width. It is not a per-frame path — it is ONE 280ms transition fired on a discrete station change, and the fill has to be positioned in the flow rather than transformed because its width is (100/stationCount)% of a container whose width the container query changes. A transform-based fill would need that percentage recomputed in JS on every resize, which is more moving parts for the same pixels.",
    test: (v) => v.category === "MOTION" && /(^|\/)guide-rail\/styles\.css$/.test(v.file) && /grail-fill/.test(blockOf(v)),
  },
  {
    id: "ring-shadow-is-not-elevation",
    why: "The kit reads every box-shadow as elevation. A box-shadow with zero offset AND zero blur on every comma-separated layer is geometry, not a drop shadow — there is no depth illusion to read, only a flat-spread ring drawn outside the border box, and box-shadow is the only way to draw one there. First named for the guide rail's station dot (the 2px ring in the page ground that makes the spine line appear to pass BEHIND the dot, and the active dot's halo — both a flat spread per COMPONENTS.md §2); generalized 2026-08-13 after finding the identical shape and identical purpose (an accent halo marking an active/current state) unexempted in `guide.css`'s `.day-today` and `mobile-nav.css`'s `.bslot-mark`/`.sheet-cat.active::before` — same reasoning, same shape, different files, so the test is now structural rather than file-scoped. A real elevation shadow (offset and/or blur, e.g. `.card`'s resting `0 1px 3px` or its hover `0 6px 24px`) still fails this and stays real. Fixed again same day: the extraction regex didn't stop at `}`, so a `@keyframes` step's `box-shadow` — packed onto one compressed line as `0%,100%{box-shadow:…}50%{box-shadow:…}` — captured past its own rule's close brace into the NEXT step's selector-like text as garbage, failing the ring test on a value that was actually a clean ring (`planner.css`'s `nowPulse`). Now stops at `}` like check-drift's own radius extraction already does.",
    test: (v) => {
      if (v.category !== "ELEVATION") return false;
      const m = v.text.match(/box-shadow:\s*([^;"'}]+)/);
      return !!m && isRingShadow(m[1].replace(/[}\s]+$/, ""));
    },
  },
  {
    id: "type-token-naming",
    why: "The kit expects the token names --fd/--fs. This repo shipped --font-data/--font-display/--font-body. Every TYPE hit against those is a naming mismatch, not a third typeface.",
    test: (v) => v.category === "TYPE" && /var\(--font-(data|display|body)\)/.test(v.text),
  },
  {
    id: "in-a-comment",
    why: "The checker scans raw lines, so a rule discussed in a comment trips the rule it describes — a note recording a measured contrast ratio, or base.css's own explanation of why a font-family is set where it is. Documentation, not paint. Widened 2026-08-13 to include SAFE-AREA and MOTION (previously COLOUR/TYPE/RADIUS/ELEVATION only, for no stated reason — the same 'scans raw lines' mechanism trips on prose discussing ANY rule, not just those four) after finding GuideLayout.astro:414's own comment, EXPLAINING why viewport-fit=cover matters for env(safe-area-inset-*), tripped the SAFE-AREA rule it was explaining — invisible to this exemption even after fixing isInsideComment's Astro `{/* */}` recognition, because SAFE-AREA wasn't in the category allowlist calling it at all.",
    test: (v) => /^(COLOUR|TYPE|RADIUS|ELEVATION|SAFE-AREA|MOTION)$/.test(v.category) && isInsideComment(v),
  },
  {
    id: "safe-area-token-definition",
    why: "`--safe-*` are DEFINED as the raw env() in base.css and asserted as raw in the token test. The max(reserved, …) wrapping is the contract at the consumption site; wrapping the definition too would double-apply the floor to every consumer.",
    test: (v) => v.category === "SAFE-AREA" && /--safe-(top|bottom|left|right)\s*[:`]|--safe-\$\{/.test(v.text),
  },
  {
    id: "hex-in-test",
    why: "A test that asserts a token's value has to name the value. That is the test doing its job.",
    test: (v) => v.category === "COLOUR" && /\.(test|spec)\.(ts|mjs|js)$/.test(v.file),
  },
  {
    id: "hex-is-the-source-of-truth",
    why: "base.css IS the shipped, contrast-tested token contract. CLAUDE.md's standing ruling: where the kit's export disagrees with a value base.css documents as a deliberate tested decision, the shipped value wins. A literal here is the definition, not drift from it.",
    test: (v) => v.category === "COLOUR" && /(^|\/)(base|tokens)\.css$/.test(v.file),
  },
  {
    id: "radius-brace-capture",
    why: "The checker's regex captures to end-of-line when the declaration ends a block, so `border-radius:0}` is read as the value `0}` and fails its own valid-value test. The value is legal. Fixed 2026-08-13: the previous test's `( .*)?$` tail matched ANY trailing text after a valid first token, so a genuine asymmetric-radius violation like `border-radius:0 6px 6px 0` (starts with the legal token `0`) was silently exempted as a false positive it is not — found via `guide.css`'s `.day-planb`. Every space-separated token must now be individually valid, mirroring check-drift's own per-token check.",
    test: (v) => {
      if (v.category !== "RADIUS") return false;
      const vals = [...v.text.matchAll(/border-radius:\s*([^;"']+)/g)].map((m) => m[1].replace(/[}\s]+$/, "").trim());
      return vals.length > 0 && vals.every((x) => x.split(/\s+/).every((t) => /^(0|999px|99px|50%)$/.test(t)));
    },
  },
  {
    id: "overlay-shadow-is-approved",
    why: "The kit's blanket 'no elevation' rule is outranked by the approved prototype's own markup, which gives the FAB, the menu sheet and the ping sheet real shadows. Extended to the other overlays built in that language: bottom sheets, modals, popovers, toasts and the drag state. Extended again 2026-08-13 to two more, each with its OWN comment stating the same functional reason (a floating chrome element needs the shadow to read as lifted off the page, not docked to it) rather than any new judgment call here: `flight.css`'s `.nav-hint` ('It has its own background + shadow so it reads as a floating strip, not a layout row' — position:absolute, out of flow, already differentiated further by a dashed border + tinted background) and `mobile-nav.css`'s `.botbar` at the >=600px breakpoint only, where its own comment says 'Float it as a centred pill instead' — the shadow is scoped to exactly that media query, absent from the docked phone-width bar that doesn't need it.",
    test: (v) =>
      v.category === "ELEVATION" &&
      /(menufab|menusheet|pingsheet|\.sheet|sos-|modal|-pop|toast|drag|resume-chip|offline-pill|pal-|sm-|lnw-|cr-|share-|pincard|nav-hint|botbar)/.test(blockOf(v)),
  },
  {
    id: "map-marker-sits-on-tile-imagery",
    why: "Same reasoning as pincard-credit-sits-on-a-photograph, one category over: map.css's .map-chip (the filter row) and .map-cluster (the pin count marker) both paint OVER live map tiles — ocean blue, forest green, satellite grey, whatever OpenStreetMap/Google Maps renders underneath — not the site's own controlled page background. A 1px border alone doesn't guarantee separation against unpredictable tile colour the way it does on flat page paper; the shadow is the same 'read as a mark floating over imagery, not part of it' job the pincard credit chip already has an approved exemption for, just on the guide's own itinerary map instead of the hub's globe.",
    test: (v) => v.category === "ELEVATION" && /(map-chip|map-cluster)/.test(blockOf(v)),
  },
  {
    id: "pincard-credit-sits-on-a-photograph",
    why: "The globe pin card's image credit is the one chip in this system whose background is a PHOTOGRAPH, and neither theme controls how bright that photograph is. A themed pair would invert with the page and put dark text on a dark cover half the time; the fixed dark scrim and near-white type hold their contrast over any image, which is the same reasoning every map attribution chip uses. The design screenshots draw it this way in both the light and the dark board.",
    test: (v) => v.category === "COLOUR" && /pincard-credit/.test(blockOf(v)),
  },
  {
    id: "unshipped-design-study",
    why: "src/styles/progress-preview/ holds design studies that never shipped and are drawn in the pre-Atlas language on purpose. They are documented as exempt in the Stage G closeout. Extended 2026-08-13 to src/styles/panel-preview/preview-chrome.css: its own header comment says it is 'a deliberate copy of src/styles/progress-preview/preview-chrome.css, not an import of it' for the identical reason ('deliberately plain and deliberately NOT in the site's voice — it must read as scaffolding', 'delete this whole folder with the study') — panel-preview briefly has a live route during its study period where progress-preview does not, but both are the same class of temporary, intentionally-off-system tool chrome, not product surface, and both carry the same 'delete this whole folder with the study' instruction.",
    test: (v) => v.file.includes("progress-preview") || v.file.includes("panel-preview"),
  },
  {
    id: "painted-atlas-is-generative-art-not-chrome",
    why: "painted-atlas.css (component: PaintedAtlas.astro) is a generative painter's-sky illustration — 'the living cover every guide is born with', per its own header comment and docs/reference/motion.md's 'the overture, then the heartbeat' doctrine — not flat UI chrome, and the binary-radius/no-elevation/token-only rules this gate otherwise enforces are written for chrome. Two categories, both load-bearing to the art itself, not driftable to the flat system without breaking it: COLOUR — the four mood palettes (day/night/dawn/dusk sky1/sky2/ground) and the sun/moon orb's own colour are FIXED PAINTERLY BASES the component's own comment says are 'pulled ~12-16% toward the guide's accent' at render time via color-mix() — they are the un-mixed input to that blend, the same 'this literal IS the definition' role hex-is-the-source-of-truth already grants base.css, just for one component's private palette instead of the shared one (base.css's shared tokens are the wrong home for an illustration-specific palette nothing else reads). ELEVATION — the orb's box-shadow is a light-glow (0 blur-radius on the shape itself, all in the shadow's spread+blur) simulating a sun/moon's luminance halo, not a drop shadow implying page depth; removing it turns a glowing celestial body into a flat dead sticker, which is a different visual claim than 'no elevation' was ever about. RADIUS (`.paint-atlas--mini{border-radius:inherit}`) is excluded from this exemption on purpose — that one is a plain false positive (inherit defers to whatever shape the containing card already resolved, transitively 0 or 999px, not a new literal) and is covered by its own entry below instead, because the reasoning is generic, not specific to this file being art.",
    test: (v) => v.file.endsWith("painted-atlas.css") && (v.category === "COLOUR" || v.category === "ELEVATION"),
  },
  {
    id: "radius-inherit-defers-to-parent",
    why: "`border-radius:inherit` is not a literal — it resolves to whatever radius the containing element already has, which in this system is always 0 or 999px (there is no third value to inherit). The checker's per-token regex only recognizes literal values, so `inherit` reads as an unrecognized third radius when it is actually zero new radii: a transitive reference, not a violation.",
    test: (v) => v.category === "RADIUS" && /border-radius:\s*inherit\s*[;}!]/.test(v.text),
  },
  {
    id: "box-shadow-none-is-not-elevation",
    why: "check-drift's own ELEVATION regex is `/box-shadow:\\s*(?!none)/` — a negative lookahead meant to skip `box-shadow:none`. It doesn't: `\\s*` is greedy but backtracks, and JS regex `.test()` accepts the FIRST successful match across all backtrack paths, so the zero-width match of `\\s*` (matching before the space, where the next four characters are ` non` not `none`) satisfies the lookahead and the whole pattern matches anyway — found via `firebase/styles.css`'s `box-shadow: none;` (the split-live-dot's default/offline state, explicitly no shadow). This is a bug in the vendored checker itself, not editable here; exempted at the classification layer instead.",
    test: (v) => v.category === "ELEVATION" && /box-shadow:\s*none\s*[;}!]/.test(v.text),
  },
  {
    id: "js-reads-live-token-with-defensive-fallback",
    why: "Three call sites read a CSS custom property at RUNTIME via getComputedStyle(...).getPropertyValue(...) and fall back to a literal only if that read comes back empty — `atlas-map.js`'s canvas globe renderer (canvas 2D context can't take var(), needs resolved hex; all six fallbacks match current shipped tokens exactly), `gmaps-render.js`'s generic cssVar() helper (feeds Google's async Maps API, which needs real hex before the library even loads — its one fallback is a defensive last-resort for the pre-paint/script-before-CSS edge case, not meant to match any specific token), and `util.js`'s qrColors() (a QR code needs literal RGB for both light and dark ink regardless of the CURRENT theme, since the code is generated once and must stay scannable). None of these can hold a var() reference — the value has to be a resolved string at the point JS reads it — so the literal is the necessary fallback for when the live read fails, not drift from a token.",
    test: (v) => /atlas-map\.js$|gmaps-render\.js$|util\.js$/.test(v.file) && v.category === "COLOUR" && /cssVar\(|read\(|getComputedStyle/.test(v.text),
  },
  {
    id: "third-party-sdk-requires-literal-hex",
    why: "gmaps-render.js's PinElement config (borderColor/glyphColor) is passed directly into Google's Maps JavaScript SDK, a JS object the library consumes — not CSS, so var() was never an option there regardless of the token system.",
    test: (v) => v.file.endsWith("gmaps-render.js") && v.category === "COLOUR" && /(borderColor|glyphColor)\s*:/.test(v.text),
  },
  {
    id: "meta-attribute-requires-literal",
    why: "A <meta> tag's content/attribute value is a plain string in the DOM, not a CSS context — it can never hold var(). PwaHead.astro's theme-color is the whole-site default (used wherever GuideLayout's own re-sync script, immediately below, doesn't run); GuideLayout.astro's inline script sets the SAME attribute per-theme, in the same breath as the data-theme attribute, specifically to beat the flash-of-wrong-chrome-color a later, computed-style-driven re-sync would miss on first paint. Both literals match their corresponding --bg value exactly.",
    test: (v) => (v.file.endsWith("PwaHead.astro") || v.file.endsWith("GuideLayout.astro")) && v.category === "COLOUR" && /theme-color/.test(nearbyText(v)),
  },
  {
    id: "sights-onphoto-text-sits-on-a-confirmed-photograph",
    why: "Same reasoning as pincard-credit-sits-on-a-photograph, one component over: `.media-ok .tag--onphoto`/`.sight-name--onphoto` only apply once an onload handler has confirmed a real photo is painted behind the caption (the file's own comment walks through why — the DEFAULT state already uses var(--ink), safe against the loading skeleton; this near-white pair is opt-in, gated, and exists only for the photograph case, which no theme token controls the brightness of).",
    test: (v) => v.file.endsWith("sights.css") && v.category === "COLOUR" && /--onphoto/.test(blockOf(v)),
  },
  {
    id: "accent-tokens-is-a-tested-derivation-source",
    why: "src/lib/accent-tokens.ts's LIGHT_SURFACES/DARK_SURFACES are not drift — they're the algorithm base.css's own comment names as deriving --accent-ink ('Recomputed by running the function, never hand-picked, and accent-tokens.test.ts pins this file's literals to its live output'). Same role hex-is-the-source-of-truth already grants base.css/tokens.css by filename; this is the same class of file — the canonical definition, tested against its own output — just named differently.",
    test: (v) => v.file.endsWith("accent-tokens.ts") && v.category === "COLOUR",
  },
];

/* Comment lines, including the continuation lines of a block comment — those do not look like
   comments on their own. A line with code BEFORE the `/*` is deliberately NOT exempt: the flagged
   value is on the code side of it. */
const commentCache = new Map();
function isInsideComment(v) {
  let set = commentCache.get(v.file);
  if (!set) {
    set = new Set();
    let open = false;
    linesOf(v.file).forEach((ln, i) => {
      const t = ln.trim();
      // `{/* … */}` is Astro/JSX's comment syntax — the SAME /* … */ comment, just wrapped in an
      // expression brace so the template compiler drops it instead of rendering literal text.
      // Missing this meant a comment's own OPENING line (the one starting `{/*`, not `/*`) was
      // never marked, only its continuation lines were — caught via GuideLayout.astro:414, whose
      // comment discusses `env(safe-area-inset-*)` in prose and tripped the SAFE-AREA rule meant
      // for real CSS.
      const starts = t.startsWith("/*") || t.startsWith("*") || t.startsWith("//") || t.startsWith("{/*");
      if (open || starts) set.add(i + 1);
      if (t.includes("/*") && !t.includes("*/")) open = true;
      if (t.includes("*/")) open = false;
    });
    commentCache.set(v.file, set);
  }
  return set.has(v.line);
}

export function classify(violations) {
  const real = [], exempt = [];
  for (const v of violations) {
    const hit = EXEMPTIONS.find((e) => e.test(v));
    if (hit) exempt.push({ ...v, exemption: hit.id });
    else real.push(v);
  }
  return { real, exempt };
}

/** Stable keys — file + category, not line, so unrelated edits above do not churn the baseline. */
export function summarize(real) {
  const out = {};
  for (const v of real) {
    const key = `${v.file}::${v.category}`;
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

export function regressions(current, baseline) {
  const bad = [];
  for (const [key, n] of Object.entries(current)) {
    const was = baseline[key];
    if (was === undefined) bad.push(`NEW  ${key} — ${n} violation(s)`);
    else if (n > was) bad.push(`MORE ${key} — ${n} now, ${was} in the baseline`);
  }
  return bad;
}

/* The checker's stderr goes to a FILE, not a pipe, and this is not a style choice.
   check-drift calls process.exit(1) immediately after console.error-ing its report. On Linux a
   pipe write from Node is asynchronous, so exit() discards whatever has not flushed; on Windows
   it is synchronous and everything lands. Piped, CI therefore saw 465 of the 788 violations
   this machine saw — the biggest root, src/styles at 592 hits and 105 KB, was the one cut off.
   A file descriptor is written synchronously on both. */
export function run() {
  const out = join(tmpdir(), "waypoint-drift.txt");
  let text = "";
  for (const root of ROOTS) {
    const fd = openSync(out, "w");
    try {
      execFileSync("node", [CHECKER, root], { stdio: ["ignore", fd, fd] });
    } catch {
      // Exit 1 with the report is its success path when drift exists; the report is in the file.
    } finally {
      closeSync(fd);
    }
    text += readFileSync(out, "utf8");
  }
  return classify(parseOutput(text));
}

const BASELINE = "scripts/drift-baseline.json";

if (process.argv[1]?.endsWith("drift-real.mjs")) {
  const { real, exempt } = run();
  const summary = summarize(real);
  if (process.argv.includes("--update")) {
    writeFileSync(BASELINE, JSON.stringify(summary, null, 2) + "\n");
    console.log(`[drift] baseline written: ${real.length} real, ${exempt.length} exempt`);
  } else {
    console.log(`[drift] ${real.length} real · ${exempt.length} exempt (${EXEMPTIONS.length} named classes)`);
    const byClass = {};
    for (const e of exempt) byClass[e.exemption] = (byClass[e.exemption] || 0) + 1;
    for (const [k, n] of Object.entries(byClass).sort((a, b) => b[1] - a[1])) console.log(`   exempt ${n.toString().padStart(4)}  ${k}`);
    console.log("");
    for (const v of real) console.log(`  ${v.file}:${v.line}  [${v.rule}]\n    ${v.text.slice(0, 100)}`);
  }
}
