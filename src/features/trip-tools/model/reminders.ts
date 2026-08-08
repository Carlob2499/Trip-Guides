/* Reminders — the trip's booking list, DERIVED from the guide's own `checklist` arrays.
   Nothing here is authored by the interface (design-handoff README §5): every line is a
   checklist item some section already carries, so a reminder can never assert something
   the guide does not.

   Two jobs beyond collecting them:
   1. **Booking-related items sort first and carry a BOOK AHEAD flag.** A checklist mixes
      "bring a plug adapter" with "reserve the ryokan" — only one of those has a door that
      closes. The flag is recognised from the item's own words, never invented.
   2. **A `due` date is a perishable fact** (content.config.ts enforces source_url +
      verified_on beside it), so it travels with its provenance rather than being restated
      as a bare date the reader cannot check.

   Ordering within each half is stable — guide order, which is the order a traveller read
   them in — except that dated items lead undated ones, soonest first. */

/** A checklist entry as the schema allows it: a bare string, or an object with a due date. */
export type RawChecklistItem =
  | string
  | { text: string; due?: string; note?: string; source_url?: string; verified_on?: string };

export interface ReminderItem {
  /** The item's own words, verbatim. */
  text: string;
  /** Which section it came from — a reminder with no home is not checkable. */
  from: string;
  /** True when the item's own wording is about securing something in advance. */
  book: boolean;
  due: string | null;
  note: string | null;
  sourceUrl: string | null;
  verifiedOn: string | null;
  /** Stable id for the per-device tick state. Derived from the text, so a re-ordered
      guide does not silently reset which items the traveller has already done. */
  id: string;
}

/* The vocabulary of "this has a door that closes". Deliberately a word list rather than a
   schema field: guides have been writing checklists for months and none of them carry a
   flag, so inferring from the words the guide already chose is the only reading that does
   not require rewriting content. It over-matches rather than under-matches on purpose — a
   false BOOK AHEAD costs a glance; a missed one costs the booking. */
const BOOKING_WORDS = [
  "book", "booking", "reserve", "reservation", "buy", "purchase", "ticket",
  "pre-order", "preorder", "apply", "permit", "visa", "register", "sign up",
  "advance", "in advance", "sold out", "deadline",
];

export function isBookingItem(text: string): boolean {
  const t = String(text || "").toLowerCase();
  return BOOKING_WORDS.some((w) => t.includes(w));
}

/** A slug-ish, collision-resistant id from the item's own text. */
function idFor(text: string): string {
  const base = String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  // Two different items can normalise to the same slug (long items truncated at 48). A
  // cheap sum of the FULL text disambiguates them without pulling in a hash dependency.
  let sum = 0;
  for (let i = 0; i < text.length; i++) sum = (sum * 31 + text.charCodeAt(i)) >>> 0;
  return `${base || "item"}-${sum.toString(36)}`;
}

function normalise(raw: RawChecklistItem, from: string): ReminderItem | null {
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return null;
    return { text, from, book: isBookingItem(text), due: null, note: null, sourceUrl: null, verifiedOn: null, id: idFor(text) };
  }
  if (!raw || typeof raw.text !== "string" || !raw.text.trim()) return null;
  const text = raw.text.trim();
  return {
    text, from,
    book: isBookingItem(text),
    due: raw.due ?? null,
    note: raw.note ?? null,
    sourceUrl: raw.source_url ?? null,
    verifiedOn: raw.verified_on ?? null,
    id: idFor(text),
  };
}

/** A section as this module needs it — any object that may carry a title and a checklist. */
export interface ChecklistSource {
  type?: string;
  title?: string;
  group?: string;
  checklist?: RawChecklistItem[];
  items?: { checklist?: RawChecklistItem[]; title?: string; date?: string }[];
}

/**
 * Collect every checklist item a guide carries, from section-level `checklist` arrays and
 * from the per-day checklists inside a `days` section. Booking items first; within each
 * half, dated before undated, soonest first, then guide order.
 */
export function buildReminders(sections: ChecklistSource[] | null | undefined): ReminderItem[] {
  if (!Array.isArray(sections)) return [];
  const out: ReminderItem[] = [];
  const seen = new Set<string>();

  const push = (raw: RawChecklistItem, from: string) => {
    const item = normalise(raw, from);
    // The same instruction can legitimately appear on a section AND on the day it applies
    // to. Showing it twice would read as two separate errands.
    if (!item || seen.has(item.id)) return;
    seen.add(item.id);
    out.push(item);
  };

  for (const s of sections) {
    if (!s || typeof s !== "object") continue;
    const label = s.title || s.group || s.type || "The guide";
    if (Array.isArray(s.checklist)) for (const c of s.checklist) push(c, label);
    if (Array.isArray(s.items)) {
      for (const it of s.items) {
        if (!it || !Array.isArray(it.checklist)) continue;
        const dayLabel = it.date && it.title ? `${it.date} — ${it.title}` : (it.title || label);
        for (const c of it.checklist) push(c, dayLabel);
      }
    }
  }

  return out
    .map((item, i) => ({ item, i }))
    .sort((a, b) => {
      if (a.item.book !== b.item.book) return a.item.book ? -1 : 1;
      if (!!a.item.due !== !!b.item.due) return a.item.due ? -1 : 1;
      if (a.item.due && b.item.due && a.item.due !== b.item.due) return a.item.due < b.item.due ? -1 : 1;
      return a.i - b.i;
    })
    .map(({ item }) => item);
}
