/* Build docs/generated/what-the-tests-protect.md — the test suite, readable by someone who does not
   read code.

   The suite already has a plain-English layer: test names. What it lacks is the reason any of
   them matter, which has been living in long block comments only a coder ever opens. So each
   test carries one `// @protects <plain sentence>` line, and this turns the pair into a
   document: the promise, then the checks that hold it up.

   Run: node scripts/test-index.mjs          (writes the doc)
        node scripts/test-index.mjs --check  (fails if the doc is stale) */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOTS = ["tests", "src", "scripts"];
const IS_TEST = /\.(test|spec)\.(ts|mjs|js)$/;

/** Where a file's tests belong in the document, in the order a reader would want them. */
/* Every pattern is anchored. An earlier draft wrote /^tests\/visual\/a11y|contrast|palette/,
   which JS reads as (^tests/visual/a11y) OR (contrast) OR (palette) — so src/lib/palettes.test.ts
   landed under "Can everyone read it". Alternation binds looser than the anchor; the groups are
   not optional. */
const AREAS = [
  [/^tests\/visual\/(a11y|contrast|palette)/, "Can everyone read it"],
  [/^tests\/visual\/(atlas|hub)/, "The hub — the globe and the trip list"],
  [/^tests\/visual\/(itinerary|journey|story|field-tools|route-opt|sos)/, "Using a guide on the road"],
  [/^tests\/visual\/(trip-split|budget|trip-tools|exports)/, "Money, tools and taking it with you"],
  [/^tests\/visual\/(share|change-request|offline|safe-area|panels|hint|no-h-overflow|progress)/, "The guide page itself"],
  [/^tests\/visual\//, "Other browser checks"],
  [/^src\/features\//, "Feature logic"],
  [/^src\/(styles|lib|scripts|data)\//, "Design system and shared rules"],
  [/^src\//, "Content rules"],
  [/^scripts\//, "Build and publishing rules"],
  [/./, "Everything else"],
];

const areaOf = (rel) => (AREAS.find(([re]) => re.test(rel)) || [null, "Everything else"])[1];

function testFiles(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    if (name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) testFiles(p, out);
    else if (IS_TEST.test(name)) out.push(p);
  }
  return out;
}

/* A test name is a JS string literal, so it can contain the quote character of the OTHER two
   kinds — "the ping sheet's grip" truncated at the apostrophe until this matched per-quote.
   Template literals are kept verbatim, `${...}` and all: a parameterised test genuinely has no
   single name, and printing the shape is more honest than printing one arbitrary expansion. */
const TEST_RE = /(?:^|\s)(?:test|it)(?:\.\w+)?\s*\(\s*(?:(`)((?:\\.|[^`\\])*)`|(")((?:\\.|[^"\\])*)"|(')((?:\\.|[^'\\])*)')/gm;
const PROTECTS_RE = /\/\/\s*@protects\s+(.+?)\s*$/;

/* A spec file is usually about ONE surface, so `@protects-file` states that surface's promise
   once at the top and every test in the file inherits it. A per-test `@protects` overrides it.
   This is not a shortcut around the work — it is the more honest shape: a file-level line I can
   state accurately beats 40 per-test lines each risking a confident, wrong description. */
const PROTECTS_FILE_RE = /\/\/\s*@protects-file\s+(.+?)\s*$/m;

/** Every test in one file, each with the @protects line in force above it. */
export function parseTests(src) {
  const lines = src.split("\n");
  const fileLevel = src.match(PROTECTS_FILE_RE)?.[1] ?? null;
  const out = [];
  for (const m of src.matchAll(TEST_RE)) {
    /* A parameterised test's name is a template literal, so `${scheme}` etc. would print raw.
       Showing the placeholder as the thing it stands for keeps the line readable without
       pretending the test has one fixed name — it genuinely runs once per case. */
    const name = (m[2] ?? m[4] ?? m[6] ?? "")
      .replace(/\\(.)/g, "$1")
      .replace(/\$\{[^}]*\}/g, "…")
      .replace(/\s*\(…(?:,\s*…)*\)\s*$/, "")
      .replace(/[—-]\s*…\s*$/, "")
      .trim()
      .replace(/\s{2,}/g, " ");
    const line = src.slice(0, m.index).split("\n").length;
    /* Walk UP for the nearest @protects, skipping blank lines and other comments. A `for`
       loop's parameterised tests share the one above the loop, which is correct — they are one
       promise checked several ways, not several promises. */
    let promise = null;
    for (let i = line - 2; i >= 0 && i > line - 12; i--) {
      const t = lines[i].trim();
      const hit = t.match(PROTECTS_RE);
      if (hit) { promise = hit[1]; break; }
      if (t && !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*") && !t.startsWith("for ") && !t.startsWith("}")) break;
    }
    out.push({ name, line, promise: promise ?? fileLevel });
  }
  return out;
}

export function collect() {
  const files = ROOTS.flatMap((r) => testFiles(r));
  return files
    .map((f) => {
      const rel = relative(".", f).replace(/\\/g, "/");
      return { rel, area: areaOf(rel), tests: parseTests(readFileSync(f, "utf8")) };
    })
    .filter((f) => f.tests.length);
}

export function render(files) {
  const total = files.reduce((n, f) => n + f.tests.length, 0);
  const covered = files.reduce((n, f) => n + f.tests.filter((t) => t.promise).length, 0);

  const out = [
    "# What the tests protect",
    "",
    "**Generated — do not edit.** `node scripts/test-index.mjs` rebuilds it; CI fails if it is stale.",
    "",
    "Every line below is a check that runs on every push. A **bold** line is a promise this",
    "product makes to whoever is holding it on a trip; the lines under it are the specific ways",
    "that promise is verified. If a promise ever stops being true, one of its checks goes red and",
    "nothing ships.",
    "",
    `${total} checks · ${covered} carry a stated promise · ${files.length} files`,
    "",
  ];

  for (const area of [...new Set(files.map((f) => f.area))]) {
    out.push(`## ${area}`, "");
    const inArea = files.filter((f) => f.area === area);
    // Group by promise so the same guarantee, checked five ways, reads as one thing.
    const byPromise = new Map();
    for (const f of inArea) {
      for (const t of f.tests) {
        const key = t.promise || "(no stated promise yet)";
        if (!byPromise.has(key)) byPromise.set(key, []);
        byPromise.get(key).push({ ...t, rel: f.rel });
      }
    }
    // Unstated promises last — they are the debt, not the headline.
    const keys = [...byPromise.keys()].sort((a, b) =>
      a.startsWith("(no stated") ? 1 : b.startsWith("(no stated") ? -1 : a.localeCompare(b));
    for (const key of keys) {
      out.push(`**${key}**`, "");
      for (const t of byPromise.get(key)) out.push(`- ${t.name}  <sub>${t.rel}:${t.line}</sub>`);
      out.push("");
    }
  }
  return out.join("\n") + "\n";
}

const DOC = "docs/generated/what-the-tests-protect.md";

if (process.argv[1]?.endsWith("test-index.mjs")) {
  const doc = render(collect());
  if (process.argv.includes("--check")) {
    let existing = "";
    try { existing = readFileSync(DOC, "utf8"); } catch { /* first run */ }
    if (existing !== doc) {
      console.error(`[test-index] ${DOC} is stale — run: node scripts/test-index.mjs`);
      process.exit(1);
    }
    console.log("[test-index] up to date");
  } else {
    writeFileSync(DOC, doc);
    const files = collect();
    const total = files.reduce((n, f) => n + f.tests.length, 0);
    const covered = files.reduce((n, f) => n + f.tests.filter((t) => t.promise).length, 0);
    console.log(`[test-index] ${DOC}: ${total} checks, ${covered} with a stated promise (${Math.round((100 * covered) / total)}%)`);
  }
}
