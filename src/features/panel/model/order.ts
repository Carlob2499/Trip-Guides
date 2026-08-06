/* Pure logic for the reader's own Panel order.

   A traveler puts the Panels that matter most to them at the top, and that order is
   still there the next time they open the guide. Like collapse, the memory is
   per-DEVICE and per-SCOPE — one guide's layout preferences never leak into another's —
   and the persisted artifact is deliberately dumb: the full id sequence as the reader
   left it. The saved order is the TIE-BREAK inside the grid's sort; the grid's own
   rules (full-width first, open before collapsed) always re-assert on top of it.

   Panels come and go between visits (a guide gains a section, the maker renames one),
   so the saved sequence is reconciled against what the page actually has: saved ids
   that still exist keep their saved order, ids the page no longer has are dropped, and
   NEW ids append after the saved ones in their own declared order — a new section is
   discoverable at the end, never silently shuffled into the reader's arrangement. */

import { MAX_ID_LEN, MAX_PANELS } from "./collapse";

/** Parse a persisted order blob defensively — storage is user-writable and may be junk. */
export function parseOrder(raw: unknown): string[] {
  let arr: unknown = raw;
  if (typeof raw === "string") {
    try { arr = JSON.parse(raw); } catch { return []; }
  }
  if (!Array.isArray(arr)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of arr) {
    if (typeof v !== "string" || !v || v.length > MAX_ID_LEN) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (out.length >= MAX_PANELS) break;
  }
  return out;
}

/** The string to persist. */
export function serializeOrder(order: readonly string[]): string {
  return JSON.stringify(order);
}

/**
 * Reconcile the saved order against the ids the page actually has, in their declared
 * order. Saved ids that exist keep their saved sequence; unknown saved ids drop; new
 * ids append at the end in declared order. No saved order (empty array) returns the
 * declared order untouched.
 */
export function effectiveOrder(declared: readonly string[], saved: readonly string[]): string[] {
  if (!saved.length) return declared.slice();
  const present = new Set(declared);
  const kept = saved.filter((id) => present.has(id));
  const placed = new Set(kept);
  return kept.concat(declared.filter((id) => !placed.has(id)));
}

/**
 * Move `id` to `toIndex` in the sequence. Immutable, and returns the SAME array when
 * nothing changes — the no-op (dropping a Panel where it already was), an unknown id,
 * or an empty sequence — so callers can skip a write. An out-of-bounds `toIndex` is
 * clamped to the sequence's ends: "before the start" means first, "past the end" means
 * last, never a throw and never a dropped Panel.
 */
export function movePanel(order: readonly string[], id: string, toIndex: number): string[] {
  const from = order.indexOf(id);
  if (from < 0 || !Number.isFinite(toIndex)) return order as string[];
  const to = Math.max(0, Math.min(Math.floor(toIndex), order.length - 1));
  if (to === from) return order as string[];
  const out = order.slice();
  out.splice(from, 1);
  out.splice(to, 0, id);
  return out;
}

/** The storage key for one scope's order — sibling of collapse's `scopeKey`, distinct
    so a corrupted blob in one never takes the other down with it. */
export function orderKey(scope?: string | null): string {
  const s = String(scope || "").replace(/\W+/g, "").toLowerCase();
  return "tg-panelorder-" + (s || "guide");
}
