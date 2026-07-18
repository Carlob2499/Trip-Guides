/**
 * Pure logic for anonymous usage telemetry — the counter-path builder, the name
 * sanitizer, and the aggregation that turns the raw RTDB tree into a ranked summary the
 * guide-author reads. No DOM, no network; the UI and the aggregation script wrap this.
 *
 * What it counts: how often each content tab and each tool tab is OPENED, per guide. No
 * ids, no timings, no PII — just counts, so the maker learns what travelers actually use
 * (goal 6) and the tab-budget decisions can cite evidence instead of doctrine.
 */

export type CounterKind = "tabs" | "tools";

/**
 * A stable, rules-safe key from a human label: lowercase, diacritics stripped, every run
 * of non-alphanumerics collapsed to a single dash, trimmed, capped at 40 chars (the rules'
 * `$name` charset is /^[a-z0-9_-]{1,40}$/). "Getting around" → "getting-around";
 * "Pokémon GO" → "pokemon-go". Empty/garbage → "" (caller skips those).
 */
export function sanitizeName(label: string): string {
  return String(label ?? "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, ""); // a trailing dash from the slice
}

/** The RTDB path a counter lives at, or null if guide/name don't sanitize to a valid key. */
export function counterPath(guide: string, kind: CounterKind, name: string): string | null {
  const g = sanitizeName(guide);
  const n = sanitizeName(name);
  if (!g || !n) return null;
  return `telemetry/${g}/${kind}/${n}`;
}

export interface RankedEntry {
  name: string;
  count: number;
}
export interface GuideSummary {
  guide: string;
  tabs: RankedEntry[];
  tools: RankedEntry[];
  totalOpens: number;
}

/**
 * Turn the raw `telemetry` subtree ({ guide: { tabs: {name:count}, tools: {...} } }) into a
 * per-guide summary with tabs/tools ranked by count (desc, then name asc for stable ties).
 * Tolerant of missing/partial/garbage nodes — a non-numeric count is dropped, not thrown on.
 */
export function summarize(raw: unknown): GuideSummary[] {
  const tree = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const rank = (node: unknown): RankedEntry[] => {
    const obj = node && typeof node === "object" ? (node as Record<string, unknown>) : {};
    return Object.keys(obj)
      .map((name) => ({ name, count: typeof obj[name] === "number" ? (obj[name] as number) : 0 }))
      .filter((e) => e.count > 0)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  };
  return Object.keys(tree)
    .map((guide) => {
      const g = tree[guide] && typeof tree[guide] === "object" ? (tree[guide] as Record<string, unknown>) : {};
      const tabs = rank(g.tabs);
      const tools = rank(g.tools);
      const totalOpens = [...tabs, ...tools].reduce((s, e) => s + e.count, 0);
      return { guide, tabs, tools, totalOpens };
    })
    .sort((a, b) => b.totalOpens - a.totalOpens || a.guide.localeCompare(b.guide));
}
