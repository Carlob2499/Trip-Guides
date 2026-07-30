/* Pure logic for the mobile bottom tab bar.

   The bar promotes a small number of CONTENT GROUPS into thumb reach. Which ones is
   decided here, from THIS DEVICE'S OWN tab-open counts (creator's call 2026-07-30) —
   not from the telemetry silo, which is write-only on the client (`bumpCounter`
   posts to Firebase and nothing reads it back) and is a cross-visitor aggregate
   anyway. A stranger's average is not this traveler's habit.

   Two rules make the bar honest:
     1. The CURRENT group always holds a slot, so the bar can never show a set of
        groups that excludes where the reader actually is.
     2. Until a group has been opened, its count is simply absent — ranking falls
        back to the guide's own order rather than inventing a preference. */

/** Per-guide open counts, keyed by the group's FULL name (stable across reorders). */
export type Counts = Record<string, number>;

/** Parse a persisted counts blob defensively — storage is user-writable and may be junk. */
export function parseCounts(raw: unknown): Counts {
  let obj: unknown = raw;
  if (typeof raw === "string") {
    try { obj = JSON.parse(raw); } catch { return {}; }
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
  const out: Counts = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    // Reject anything that isn't a finite positive number: a NaN or a string here
    // would silently poison every comparison in rankOrder below.
    if (typeof v === "number" && Number.isFinite(v) && v > 0) out[k] = Math.floor(v);
  }
  return out;
}

/** Immutable bump — returns a NEW counts object with `name` incremented. */
export function recordOpen(counts: Counts, name: string): Counts {
  if (!name) return counts;
  return { ...counts, [name]: (counts[name] || 0) + 1 };
}

/**
 * Group indices ordered most-used first, ties broken by the guide's own order.
 * Guide order is the tie-break (not insertion order of the counts object) so two
 * never-opened groups always sort the way the maker arranged them.
 */
export function rankOrder(counts: Counts, order: string[]): number[] {
  return order
    .map((g, i) => ({ i, n: counts[g] || 0 }))
    .sort((a, b) => (b.n - a.n) || (a.i - b.i))
    .map((e) => e.i);
}

/**
 * The group indices the bar shows, `slots` of them.
 * `current` is the active content-group index, or -1 when a tool panel is open
 * (no content group is current, so the bar simply shows the top-ranked ones).
 */
export function promoted(counts: Counts, order: string[], current: number, slots = 2): number[] {
  const valid = (i: number) => Number.isInteger(i) && i >= 0 && i < order.length;
  const out: number[] = [];
  if (valid(current)) out.push(current);
  for (const i of rankOrder(counts, order)) {
    if (out.length >= slots) break;
    if (!out.includes(i)) out.push(i);
  }
  return out.slice(0, Math.max(0, slots));
}

/**
 * Place `next` into the slot positions, keeping anything already on screen WHERE IT IS.
 *
 * Without this the bar churns: `promoted` puts the current group first, so tapping the
 * right-hand slot would make its label jump to the left-hand one and the group you just
 * left slide right — the two buttons trading places under the thumb that tapped them.
 * A slot with no group left to hold gets null (the caller hides it).
 */
export function seat(prev: Array<number | null>, next: number[]): Array<number | null> {
  const out: Array<number | null> = prev.map((p) => (p != null && next.includes(p) ? p : null));
  const spare = next.filter((n) => !out.includes(n));
  for (let i = 0; i < out.length; i++) if (out[i] == null) out[i] = spare.shift() ?? null;
  return out;
}

/**
 * Bar-slot label. The tab strip's own `shortLabel` (GuideLayout) still runs to 13
 * chars — too wide for a fifth of a 320px phone — so a slot gets the head of a
 * compound name, then a word-boundary truncation with an ellipsis. Display only:
 * the full name stays in the accessible name, the sheet, and the chapter opener.
 */
export function slotLabel(name: string, max = 9): string {
  if (!name) return "";
  let s = String(name).trim();
  const split = /\s+(?:&|and|\+|·|—|–)\s+/i.exec(s);
  if (split && s.length > max) s = s.slice(0, split.index).trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  // Only honour a word boundary that leaves a readable stub — "Ge…" is worse than
  // a mid-word cut of the whole phrase.
  return (sp >= Math.ceil(max * 0.6) ? cut.slice(0, sp) : cut).trim() + "…";
}

/**
 * The sheet's resume line for one group: where the reader left off.
 * Returns null when there is nothing remembered — an honest blank, never a
 * fabricated "start here" (CLAUDE.md: the reality layer only appears when there
 * IS reality to show).
 */
export function resumeLine(section: unknown): string | null {
  if (typeof section !== "string") return null;
  const s = section.replace(/\s+/g, " ").trim();
  if (!s) return null;
  return "you were at " + (s.length > 42 ? s.slice(0, 41).trim() + "…" : s);
}
