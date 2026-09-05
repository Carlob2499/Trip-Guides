/* The search index — one record per canonical traveler-facing object (design-system.md
   D6-24/D6-26): a guide section, a place or venue, an itinerary day, a stop, a knowledge
   module. Built at build time from the guide's own flattened sections, and consumed two ways:
   embedded per guide (the current trip searches offline) and merged across published guides
   into dist/data/search-index.json (Atlas / "Other trips").

   Every record deep-links to the canonical object's own anchor — the same `#sec-N`,
   `#sight-<slug>`, `#venue-<slug>`, `#day-N` ids the page renders — so a result lands on the
   thing, not merely on the right destination. Nothing here is a rendered HTML string; the
   overlay renders records itself. */

import { pinSlug } from "../../../lib/map-pins";

const SNIPPET_LEN = 150;

export type SearchKind = "section" | "place" | "venue" | "day" | "stop" | "module";

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
  module?: { id: string; kind: string } | null;
}

export interface SearchRecord {
  slug: string;
  /** Traveler-facing object type — decides the result group and its action label. */
  kind: SearchKind;
  group: string;
  /** "GUIDE TITLE · GROUP NAME", uppercased — the result row's breadcrumb. */
  crumb: string;
  title: string;
  /** Plain text, HTML stripped, capped at 150 chars with a trailing "…" when truncated. */
  snippet: string;
  /** Lowercased title + group + body text — what the query matches against. */
  hay: string;
  /** This section's position in the guide's OWN flattened section list (`#sec-<index>`). */
  index: number;
  /** In-page anchor of the canonical object (without the `#`). */
  anchor: string;
  /** The place's own repository photograph (a small rendition), when its card carries one. */
  img?: string;
}

/** Strip HTML tags and collapse whitespace — plain search text only, never rendered as HTML. */
function stripHtml(s: unknown): string {
  return String(s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** One list item's searchable text — a bare string, or an object's name/label/claim plus its
    body/correction/note. Matches every item shape this repo's section types actually use. */
function itemText(it: unknown): string {
  if (typeof it === "string") return it;
  if (it && typeof it === "object") {
    const o = it as Record<string, unknown>;
    const head = (o.name ?? o.label ?? o.claim ?? o.text ?? "") as string;
    const tail = (o.body ?? o.correction ?? o.note ?? o.why ?? "") as string;
    return `${head} ${tail}`.trim();
  }
  return "";
}

function snippetOf(text: string): string {
  return text.length > SNIPPET_LEN ? `${text.slice(0, SNIPPET_LEN)}…` : text;
}

function record(slug: string, guideTitle: string, section: SearchableSection, index: number, kind: SearchKind, title: string, text: string, anchor: string, img?: string | null): SearchRecord | null {
  const group = section.group ?? "";
  if (!title && !text) return null;
  const r: SearchRecord = {
    slug, kind, group,
    crumb: `${guideTitle.toUpperCase()} · ${group.toUpperCase()}`,
    title, snippet: snippetOf(text),
    hay: `${title} ${group} ${text}`.toLowerCase(),
    index, anchor,
  };
  if (img) r.img = img;
  return r;
}

/** Resolves a place name to its repository photograph; null when the guide has none. */
export type ImageLookup = (name: string) => { src: string } | null;

/** One section's own record, or null when it carries no searchable text at all (an empty
    scaffold section) — never an empty row a search can still "match" against nothing. */
export function buildSectionRecord(slug: string, guideTitle: string, section: SearchableSection, index = 0): SearchRecord | null {
  const bits: string[] = [];
  for (const f of [section.title, section.body, section.intro, section.note]) if (f) bits.push(f);
  for (const it of section.items || []) bits.push(itemText(it));
  for (const t of section.steps || []) bits.push(itemText(t));
  for (const t of section.checklist || []) bits.push(itemText(t));
  const text = stripHtml(bits.join(" "));
  if (!text) return null;
  const title = section.title || section.group || "";
  return record(slug, guideTitle, section, index, section.module ? "module" : "section", title, text, `sec-${index}`);
}

/** Per-item records for the object types a traveler searches for by name: places (sights),
    venues, itinerary days and their stops. Each links to the object's own anchor when the
    page renders one (a sight/venue card gets an id only when it carries coordinates — the
    same rule SightsBlock/VenueBlock apply), else to its section. */
export function buildItemRecords(slug: string, guideTitle: string, section: SearchableSection, index = 0, imageFor: ImageLookup | null = null): SearchRecord[] {
  const photo = (name: string) => (imageFor ? imageFor(name)?.src ?? null : null);
  const out: SearchRecord[] = [];
  const items = (section.items || []) as Record<string, unknown>[];
  if (section.type === "sights" || section.type === "venues") {
    const kind: SearchKind = section.type === "sights" ? "place" : "venue";
    const prefix = section.type === "sights" ? "sight" : "venue";
    for (const it of items) {
      const name = String(it.name ?? "");
      if (!name) continue;
      const text = stripHtml([it.kicker, it.area, it.body, it.why, it.hours, it.price, it.address].filter(Boolean).join(" · "));
      const anchor = it.map ? `${prefix}-${pinSlug(name)}` : `sec-${index}`;
      const r = record(slug, guideTitle, section, index, kind, name, text, anchor, photo(name));
      if (r) out.push(r);
    }
  }
  if (section.type === "days") {
    items.forEach((d, di) => {
      const date = String(d.date ?? "");
      const title = String(d.title ?? date);
      const text = stripHtml([date, d.tldr, d.pace].filter(Boolean).join(" · "));
      const day = record(slug, guideTitle, section, index, "day", title, text, `day-${di}`);
      if (day) out.push(day);
      const stops = [
        ...((d.waypoints as Record<string, unknown>[] | undefined) ?? []),
        ...(((d.branches as { waypoints?: Record<string, unknown>[] }[] | undefined) ?? []).flatMap((b) => b.waypoints ?? [])),
      ];
      for (const w of stops) {
        const name = String(w.name ?? "");
        if (!name) continue;
        const text = stripHtml([date, w.time, w.note].filter(Boolean).join(" · "));
        const r = record(slug, guideTitle, section, index, "stop", name, text, `day-${di}`, photo(name));
        if (r) out.push(r);
      }
    });
  }
  return out;
}

/** One guide's whole index — every section that has searchable text plus its item-level
    objects, in section order. Each record's `index` is its section's position in `sections`
    itself, not its position in the filtered output. */
export function buildGuideSearchIndex(
  slug: string,
  guideTitle: string,
  sections: readonly SearchableSection[],
  imageFor: ImageLookup | null = null,
): SearchRecord[] {
  const out: SearchRecord[] = [];
  sections.forEach((s, i) => {
    const rec = buildSectionRecord(slug, guideTitle, s, i);
    if (rec) out.push(rec);
    out.push(...buildItemRecords(slug, guideTitle, s, i, imageFor));
  });
  return out;
}
