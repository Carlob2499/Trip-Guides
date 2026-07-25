/* Room-code guard. Every guide must declare a valid roomId, and changing one must be deliberate.

   The incident: denmark and korea declared no roomId, so GuideLayout's `guide.roomId ?? storeKey`
   fallback handed Firebase the guide slug. rules.json requires a 16–40 char room code, so every
   write was permission_denied — while the panel rendered live and editable. Then, fixing that, a
   fresh roomId was generated for korea WITHOUT checking whether the old room held anything. It
   held three people and 23 expenses. Nothing was destroyed, but the guide showed a confident
   empty budget, which is the exact "honest blank" violation CLAUDE.md warns about: a blank is
   only honest when there is genuinely nothing there.

   WHAT THIS CANNOT DO, stated rather than implied: it cannot ask Firebase whether the old room is
   populated. A build has no credentials, CI has no network to that database, and a build that
   depends on a live datastore is its own hazard. So the historical check below compares the
   WORKING TREE against HEAD — which is precisely the moment the mistake was made, editing then
   committing — and is a no-op once committed and running in CI. The two checks that ARE
   unconditional (valid, and unique) are the ones that make the original bug impossible. */
import { describe, expect, test } from "vitest";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const GUIDES_DIR = join(REPO, "src/content/guides");

/** Mirrors rules.json's own `$code.length >= 16 && <= 40` and content.config.ts's regex. */
const ROOM_ID_RE = /^[a-z0-9]{16,40}$/;

const slugs = readdirSync(GUIDES_DIR).filter((e) => statSync(join(GUIDES_DIR, e)).isDirectory());
const read = (slug) => JSON.parse(readFileSync(join(GUIDES_DIR, slug, "_guide.json"), "utf8"));

/** The committed version of a guide's meta, or null when it is new (or git is unavailable). */
function committed(slug) {
  try {
    const out = execFileSync("git", ["show", `HEAD:src/content/guides/${slug}/_guide.json`], {
      cwd: REPO,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return JSON.parse(out);
  } catch {
    return null; // new guide, or not a git checkout — not a failure, just nothing to compare
  }
}

describe("guide room codes", () => {
  test("there is at least one guide to check (guards a vacuous pass)", () => {
    expect(slugs.length, `no guide directories under ${GUIDES_DIR}`).toBeGreaterThan(0);
  });

  test("every guide declares a roomId matching what the RTDB rules require", () => {
    const bad = slugs
      .map((slug) => ({ slug, roomId: read(slug).roomId }))
      .filter((g) => !(typeof g.roomId === "string" && ROOM_ID_RE.test(g.roomId)))
      .map((g) => `${g.slug}: ${g.roomId === undefined ? "missing" : JSON.stringify(g.roomId)}`);

    expect(
      bad,
      "A guide has no valid roomId. rules.json requires 16-40 lowercase alphanumerics, and the " +
        "code is the ONLY thing protecting that trip's budget once anyone can sign in " +
        "anonymously — a short or guessable one is a security bug, not a style issue. " +
        "scaffold-guide.mjs generates one for new guides.",
    ).toEqual([]);
  });

  test("no two guides share a room code — one code is one trip's budget", () => {
    const seen = new Map();
    const dupes = [];
    for (const slug of slugs) {
      const id = read(slug).roomId;
      if (seen.has(id)) dupes.push(`${slug} shares ${id} with ${seen.get(id)}`);
      else seen.set(id, slug);
    }
    expect(dupes, "Two guides pointing at one room means two trips editing one budget").toEqual([]);
  });

  test("an uncommitted roomId change is declared, not silent", () => {
    const undeclared = [];
    for (const slug of slugs) {
      const before = committed(slug);
      if (!before || before.roomId === undefined) continue; // new guide, or first time getting one
      const after = read(slug);
      if (before.roomId === after.roomId) continue;
      if (after.roomMigratedFrom === before.roomId) continue; // declared — the old room is named
      undeclared.push(`${slug}: ${before.roomId} -> ${after.roomId}`);
    }

    expect(
      undeclared,
      "A guide's roomId changed without declaring where it came from. That switch points the " +
        "guide at an EMPTY room while the old one keeps its data, and the reader just sees an " +
        "empty budget — korea lost sight of 3 people and 23 expenses exactly this way. If the " +
        "change is intended: copy the old room's data across FIRST, then record the old code as " +
        "`roomMigratedFrom` in _guide.json so the trail survives",
    ).toEqual([]);
  });
});
