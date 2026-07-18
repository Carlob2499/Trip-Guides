// Generate a salted, unguessable room id for a guide's shared Trip-Split / feedback /
// reminders sync. 16 lowercase-alphanumeric characters from crypto randomness — that length
// satisfies the RTDB rules' write gate (`code length >= 16`), so a salted room is BOTH
// writable and unguessable, while the short legacy guide-slug rooms stay frozen read-only.
//
// Committed to the guide's _guide.json ONCE and never regenerated (a fresh salt every build
// would orphan the room on every deploy). scaffold-guide.mjs stamps one onto every new guide;
// the CLI below can add one to an existing guide that predates the field.
//
// Usage:
//   node scripts/gen-room-id.mjs                → print a fresh id (does nothing else)
//   node scripts/gen-room-id.mjs --slug <slug>  → add roomId to that guide's _guide.json if
//                                                  missing (idempotent; never overwrites)

import { randomInt } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** A crypto-random lowercase-alphanumeric id; default 16 chars (>= the rules' write gate). */
export function genRoomId(len = 16) {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

// CLI — only runs when invoked directly, so importing genRoomId() elsewhere is side-effect-free.
// pathToFileURL normalizes Windows drive letters/backslashes; the argv[1] guard skips `node -e`.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const slugFlag = process.argv.indexOf("--slug");
  if (slugFlag === -1) {
    console.log(genRoomId());
  } else {
    const slug = process.argv[slugFlag + 1];
    if (!slug) { console.error("gen-room-id: --slug needs a guide slug"); process.exit(1); }
    const metaPath = path.join("src/content/guides", slug, "_guide.json");
    let raw;
    try { raw = await readFile(metaPath, "utf8"); }
    catch { console.error(`gen-room-id: no _guide.json at ${metaPath}`); process.exit(1); }
    const meta = JSON.parse(raw);
    if (meta.roomId) {
      console.log(`gen-room-id: ${slug} already has roomId ${meta.roomId} — unchanged`);
    } else {
      meta.roomId = genRoomId();
      await writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n");
      console.log(`gen-room-id: added roomId ${meta.roomId} to ${metaPath}`);
    }
  }
}
