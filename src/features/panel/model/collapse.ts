/* Pure logic for the Atlas Panel's collapsed state.

   A reader collapses a Panel they are done with so the rest of the page is scannable,
   and it stays collapsed when they come back. That memory is per-DEVICE and per-SCOPE:
   collapsing Denmark's budget Panel must never collapse South Korea's, so every read and
   write goes through `scopeKey` — the same normalisation GuideLayout uses for storeKey —
   and there is deliberately no global key to fall back to.

   The store holds the reader's own DECISIONS, both ways — `false` is meaningful, not noise.
   A Panel can ship collapsed from markup, and a reader who opens it must find it open on
   the next visit; a store that could only say "collapsed" would silently re-collapse it
   every load. Absence of a key means the reader has never touched that Panel, and only then
   does the markup default decide. */

/** The reader's decisions: true = collapsed, false = opened. Absence = never touched. */
export type CollapseState = Record<string, boolean>;

/** Ids come from markup, not from a user — a longer one is corruption, not a Panel. */
export const MAX_ID_LEN = 120;
/** No page has hundreds of Panels; a blob that does was hand-edited or is junk. */
export const MAX_PANELS = 200;

/** Parse a persisted blob defensively — storage is user-writable and may be junk. */
export function parseCollapsed(raw: unknown): CollapseState {
  let obj: unknown = raw;
  if (typeof raw === "string") {
    try { obj = JSON.parse(raw); } catch { return {}; }
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
  const out: CollapseState = {};
  let n = 0;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    // Booleans only. A truthy 1 or "true" here would let a corrupted store collapse
    // Panels the reader never touched.
    if (typeof v !== "boolean") continue;
    if (!k || k.length > MAX_ID_LEN) continue;
    out[k] = v;
    if (++n >= MAX_PANELS) break;
  }
  return out;
}

/** The string to persist. */
export function serializeCollapsed(state: CollapseState): string {
  const out: CollapseState = {};
  for (const [k, v] of Object.entries(state)) if (typeof v === "boolean") out[k] = v;
  return JSON.stringify(out);
}

/**
 * Is this Panel collapsed? `dflt` is the markup's own starting state, used only where the
 * reader has never decided — their decision, once made, always outranks it.
 */
export function isCollapsed(state: CollapseState, id: string, dflt = false): boolean {
  return typeof state[id] === "boolean" ? state[id] : dflt;
}

/**
 * Immutable set — returns the SAME object when nothing changes, so callers can skip a write.
 * Rejects exactly what `parseCollapsed` would drop: a decision that cannot survive the round
 * trip must never be shown as taken, or the Panel silently reverts on the next load and the
 * reader reads it as the toggle being ignored.
 */
export function setCollapsed(state: CollapseState, id: string, collapsed: boolean): CollapseState {
  if (!id || id.length > MAX_ID_LEN) return state;
  if (state[id] === collapsed) return state;
  if (!(id in state) && Object.keys(state).length >= MAX_PANELS) return state;
  return { ...state, [id]: collapsed };
}

/** Immutable toggle, against the markup default where the reader has never decided. */
export function toggleCollapsed(state: CollapseState, id: string, dflt = false): CollapseState {
  if (!id) return state;
  return setCollapsed(state, id, !isCollapsed(state, id, dflt));
}

/**
 * The storage key for one scope. Scope is normalised exactly as GuideLayout derives
 * `storeKey` (non-word characters stripped, lowercased) so a Panel on a guide page and
 * this feature agree on the key without passing the raw slug around.
 */
export function scopeKey(scope?: string | null): string {
  const s = String(scope || "").replace(/\W+/g, "").toLowerCase();
  return "tg-panelcollapse-" + (s || "guide");
}
