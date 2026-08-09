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

/* Each entry: why this hit is not real. Order matters only for reporting — a hit is exempt if
 * ANY rule claims it. Every one of these is written down in CLAUDE.md or in the prototype's own
 * markup; none of them is "this was noisy". */
export const EXEMPTIONS = [
  {
    id: "type-token-naming",
    why: "The kit expects the token names --fd/--fs. This repo shipped --font-data/--font-display/--font-body. Every TYPE hit against those is a naming mismatch, not a third typeface.",
    test: (v) => v.category === "TYPE" && /var\(--font-(data|display|body)\)/.test(v.text),
  },
  {
    id: "in-a-comment",
    why: "The checker scans raw lines, so a rule discussed in a comment trips the rule it describes — a note recording a measured contrast ratio, or base.css's own explanation of why a font-family is set where it is. Documentation, not paint.",
    test: (v) => /^(COLOUR|TYPE|RADIUS|ELEVATION)$/.test(v.category) && isInsideComment(v),
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
    why: "The checker's regex captures to end-of-line when the declaration ends a block, so `border-radius:0}` is read as the value `0}` and fails its own valid-value test. The value is legal.",
    test: (v) => {
      if (v.category !== "RADIUS") return false;
      const vals = [...v.text.matchAll(/border-radius:\s*([^;"']+)/g)].map((m) => m[1].replace(/[}\s]+$/, "").trim());
      return vals.length > 0 && vals.every((x) => /^(0|999px|99px|50%)( .*)?$/.test(x));
    },
  },
  {
    id: "overlay-shadow-is-approved",
    why: "The kit's blanket 'no elevation' rule is outranked by the approved prototype's own markup, which gives the FAB, the menu sheet and the ping sheet real shadows. Extended to the other overlays built in that language: bottom sheets, modals, popovers, toasts and the drag state.",
    test: (v) =>
      v.category === "ELEVATION" &&
      /(menufab|menusheet|pingsheet|\.sheet|sos-|modal|-pop|toast|drag|resume-chip|offline-pill|pal-|sm-|lnw-|cr-|share-)/.test(blockOf(v)),
  },
  {
    id: "unshipped-design-study",
    why: "src/styles/progress-preview/ holds design studies that never shipped and are drawn in the pre-Atlas language on purpose. They are documented as exempt in the Stage G closeout.",
    test: (v) => v.file.includes("progress-preview"),
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
      const starts = t.startsWith("/*") || t.startsWith("*") || t.startsWith("//");
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
