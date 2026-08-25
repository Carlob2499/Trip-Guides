// Print the size and turn count of the current Claude Code session transcript(s) for this repo.
// Used at research checkpoints (research-efficiency.md, "Interactive fan-out limits"):
// above 5 MB or 100 user turns, hand off and resume in a fresh session.
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const LIMIT_BYTES = 5 * 1024 * 1024;
const LIMIT_TURNS = 100;
const projectKey = process.cwd().replace(/[^A-Za-z0-9-]/g, '-');
const dir = join(homedir(), '.claude', 'projects', projectKey);

let files;
try {
  files = readdirSync(dir).filter((f) => f.endsWith('.jsonl'));
} catch {
  console.error(`no transcript dir at ${dir}`);
  process.exit(2);
}

const rows = files
  .map((f) => {
    const p = join(dir, f);
    const st = statSync(p);
    return { id: f.slice(0, 8), bytes: st.size, mtime: st.mtimeMs, path: p };
  })
  .sort((a, b) => b.mtime - a.mtime)
  .slice(0, 3)
  .map((r) => {
    const turns = readFileSync(r.path, 'utf8').split('\n').filter((l) => l.includes('"type":"user"')).length;
    return { ...r, turns };
  });

let over = false;
for (const r of rows) {
  const mb = (r.bytes / 1024 / 1024).toFixed(1);
  const flag = r.bytes > LIMIT_BYTES || r.turns > LIMIT_TURNS ? '  <-- OVER LIMIT: hand off now' : '';
  if (flag) over = true;
  console.log(`${r.id}  ${mb} MB  ${r.turns} turns${flag}`);
}
process.exit(over ? 1 : 0);
