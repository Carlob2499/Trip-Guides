/* Cross-guide search index (D20, PLAN_ATLAS_MIGRATION.md Stage B.6) — pure record shape and
   per-section builder, ported from the design-handoff prototype's own `buildSearchIndex`
   (the prototype code is the tie-break authority for exact shapes, per the plan's own rule).
   One deliberate departure: the prototype's `crumb` used a hardcoded slug -> display-name
   map (`NAME = { korea: "South Korea", ... }`) — a parallel registry CLAUDE.md's "content is
   king" principle forbids. Every one of those four values is already exactly the guide's own
   `title` field, so this reads `title` instead; verified against all four real guides before
   relying on it, not assumed.

   I/O (reading every guide, writing the built JSON) lives in scripts/build-search-index.ts;
   this file only shapes one guide's already-flattened sections into records. */

const SNIPPET_LEN = 150;

export interface SearchableSection {
  type?: string;
  group?: string;
  title?: string;
  body?: string;
  intro?: string;
  note?: string;
  items?: readonly unknown[];
  steps?: readonly unknown[];
  checklist?: readonly unknown[];
}

export interface SearchRecord {
  slug: string;
  group: string;
  /** "GUIDE TITLE · GROUP NAME", uppercased — the result row's breadcrumb. */
  crumb: string;
  title: string;
  /** Plain text, HTML stripped, capped at 150 chars with a trailing "…" when truncated. */
  snippet: string;
  /** Lowercased title + group + body text — what the search box actually matches against. */
  hay: string;
  /** This section's position in the guide's OWN flattened section list (GuideLayout's
      `_flat`/`o.i`, the same order `#sec-<i>` anchors use) — NOT this record's position in
      the output array, since empty sections are skipped and would desync the two. Lets a
      search result link straight at `#sec-<index>` (A10's hash auto-expand opens the panel
      and scrolls) rather than only "the right tab" (Stage C Gate 5's floor). */
  index: number;
}

/** Strip HTML tags and collapse whitespace — same two-step the prototype used, not a real
    sanitizer (nothing here is rendered as HTML; the result is plain search text only). */
function stripHtml(s: unknown): string {
  return String(s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** One list item's searchable text — a bare string, or an object's name/label/claim
    (heading) plus its body/correction/note (detail). Matches every item shape this repo's
    section types actually use (sights/venues names, divergences claims, checklist notes). */
function itemText(it: unknown): string {
  if (typeof it === "string") return it;
  if (it && typeof it === "object") {
    const o = it as Record<string, unknown>;
    const head = (o.name ?? o.label ?? o.claim ?? "") as string;
    const tail = (o.body ?? o.correction ?? o.note ?? "") as string;
    return `${head} ${tail}`.trim();
  }
  return "";
}

/** One section's search record, or null when it carries no searchable text at all (an empty
    scaffold section) — never an empty row a search can still "match" against nothing. */
export function buildSectionRecord(slug: string, guideTitle: string, section: SearchableSection, index = 0): SearchRecord | null {
  const group = section.group ?? "";
  const bits: string[] = [];
  for (const f of [section.title, section.body, section.intro, section.note]) if (f) bits.push(f);
  for (const it of section.items || []) bits.push(itemText(it));
  for (const t of section.steps || []) bits.push(itemText(t));
  for (const t of section.checklist || []) bits.push(itemText(t));

  const text = stripHtml(bits.join(" "));
  if (!text) return null;

  const title = section.title || group;
  const snippet = text.length > SNIPPET_LEN ? `${text.slice(0, SNIPPET_LEN)}…` : text;
  return {
    slug,
    group,
    crumb: `${guideTitle.toUpperCase()} · ${group.toUpperCase()}`,
    title,
    snippet,
    hay: `${title} ${group} ${text}`.toLowerCase(),
    index,
  };
}

/** One guide's whole index — every section that has searchable text, in section order. Each
    record's `index` is its position in `sections` itself (see SearchRecord's doc comment),
    not its position in the filtered output. */
export function buildGuideSearchIndex(
  slug: string,
  guideTitle: string,
  sections: readonly SearchableSection[],
): SearchRecord[] {
  const out: SearchRecord[] = [];
  sections.forEach((s, i) => {
    const rec = buildSectionRecord(slug, guideTitle, s, i);
    if (rec) out.push(rec);
  });
  return out;
}
