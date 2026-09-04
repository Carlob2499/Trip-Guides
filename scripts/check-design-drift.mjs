#!/usr/bin/env node
/* eslint-disable no-undef, @typescript-eslint/no-unused-expressions -- vendored reference
   tool (docs/design-handoff), not app source; process/console are real Node globals here. */
// Waypoint drift check. Run: node check-drift.mjs [srcDir]
// Exit 1 on any violation. Wire into CI / pre-commit so drift cannot merge.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.argv[2] || 'src';
const EXT = new Set(['.astro', '.css', '.html', '.ts', '.tsx', '.js', '.mjs', '.svelte', '.vue', '.jsx', '.scss']);
const files = [];
(function walk(d){ for (const e of readdirSync(d)) {
  const p = join(d, e);
  if (e === 'node_modules' || e.startsWith('.')) continue;
  statSync(p).isDirectory() ? walk(p) : EXT.has(extname(e)) && files.push(p);
}})(ROOT);

const violations = [];
const V = (file, line, rule, text) => violations.push({ file, line, rule, text: text.trim().slice(0, 90) });

const APPROVED_HEX = new Set(['#9c4421','#dfe3d9','#f8faf3','#d2d7c8','#171d24','#4e5747','#bec6b2','#a3ac98','#80371b','#0f1317','#242c34','#1a2129','#e8ece3','#9aa392','#38414b','#4e5865','#c78f78','#6aab76','#396345','#7f4a07','#d9923f','#f0d2c7']);

for (const f of files) {
  const isTokens = f.endsWith('tokens.css');
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((ln, i) => {
    const n = i + 1;
    // 1. radius is a ROLE (design-system.md §31): var(--r-*) tokens, 0 (a flush edge), 50% (a
    //    dot) or the pill. A typed px radius is drift — the family is the only source of shape.
    // `}` ends the value as surely as `;` does: minified CSS drops the last declaration's
    // semicolon, so `…;border-radius:0}` used to capture "0}" and report a correctly-zeroed
    // rule as drift (src/styles/guide.css's .hol-clear, .lb-img).
    const rad = ln.match(/border-radius:\s*([^;"'}]+)/g);
    if (rad) for (const r of rad) {
      const v = r.split(':')[1].trim();
      if (!v.split(/\s+/).every((t) => /^(0|999px|50%|inherit|var\(--r-(inset|compact|card|pane|pill|round)\))$/.test(t))) V(f, n, 'RADIUS — use the --r-* role family (design-system.md §31)', ln);
    }
    // 2. no hex outside the approved set, and none at all outside tokens.css
    for (const m of ln.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
      const hex = m[0].toLowerCase();
      if (!APPROVED_HEX.has(hex)) V(f, n, `COLOUR — ${hex} is not a Waypoint token`, ln);
      else if (!isTokens && hex !== '#9c4421') V(f, n, 'COLOUR — use var(), not a literal (oxide #9c4421 tolerated)', ln);
    }
    // 3. bare env() without max() wrapper
    if (/[^(]env\(safe-area/.test(ln) && !/max\([^)]*env\(/.test(ln) && !isTokens)
      V(f, n, 'SAFE-AREA — wrap env() in max(reserved, …)', ln);
    // 4. third font family
    if (/font-family/.test(ln) && !/var\(--font-(display|data|body)\)|var\(--f[ds]\)|Literata|Atkinson/.test(ln))
      V(f, n, 'TYPE — only Literata and Atkinson Hyperlegible Next exist (design-system.md §2)', ln);
    if (/\b(monospace|Menlo|Consolas|Courier|Inter|Roboto)\b/.test(ln) && /font/.test(ln))
      V(f, n, 'TYPE — forbidden family', ln);
    // 5. animating layout properties
    if (/transition:[^;]*\b(left|top|width|height)\b/.test(ln) && !/max-height/.test(ln))
      V(f, n, 'MOTION — transform/opacity only; never left/top/width/height', ln);
    // 6. elevation is a ROLE (§31): var(--shadow-float|lift) or none. A typed shadow is drift.
    if (/box-shadow:\s*(?!none|var\(--shadow-(float|lift)\))/.test(ln)) V(f, n, 'ELEVATION — use --shadow-float / --shadow-lift or none (design-system.md §31)', ln);
  });
}

if (violations.length) {
  console.error(`\n✗ ${violations.length} drift violation(s)\n`);
  for (const v of violations) console.error(`  ${v.file}:${v.line}  [${v.rule}]\n    ${v.text}`);
  process.exit(1);
}
console.log(`✓ no drift across ${files.length} files`);
