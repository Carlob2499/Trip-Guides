// Prep timeline / "book by" deadlines (docs/PLAN_TRAVELER_FEATURES.md F1) — turns the
// scattered dated checklist items across a guide's panel + day-kit checklists into one
// T-minus timeline. Reads ONLY items that were upgraded to carry a `due` date
// (content.config.ts's `checklistItem` union); a guide with no dated items returns an
// empty list — never invented, matching every other Trip Kit card's honest-blank rule.

export type BookByBucket = "overdue" | "soon" | "later";

export type BookByItem = {
  text: string;
  due: string; // YYYY-MM-DD
  daysUntil: number; // negative once past due
  bucket: BookByBucket;
  note: string | null;
  source_url: string | null;
};

// A deadline inside this many days is "soon" — worth a traveler's attention now, distinct
// from something months out. Two weeks matches the shortest realistic non-perishable
// booking-lock window (timed-entry tickets, restaurant reservations) without being so
// short it's indistinguishable from "overdue".
const SOON_WINDOW_DAYS = 14;

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function bucketFor(daysUntil: number): BookByBucket {
  if (daysUntil < 0) return "overdue";
  if (daysUntil <= SOON_WINDOW_DAYS) return "soon";
  return "later";
}

function collectChecklists(sections: any[] | null | undefined): any[] {
  if (!Array.isArray(sections)) return [];
  const out: any[] = [];
  for (const s of sections) {
    if (!s) continue;
    if (s.type === "panel" && Array.isArray(s.checklist)) out.push(...s.checklist);
    if (s.type === "days" && Array.isArray(s.items)) {
      for (const day of s.items) {
        if (Array.isArray(day?.checklist)) out.push(...day.checklist);
      }
    }
  }
  return out;
}

export function deriveBookByTimeline(sections: any[] | null | undefined, now: Date = new Date()): BookByItem[] {
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dated = collectChecklists(sections).filter(
    (it): it is { text: string; due: string; note?: string; source_url?: string } =>
      typeof it === "object" && it != null && typeof it.due === "string",
  );
  const items = dated.map((it) => {
    const daysUntil = Math.round((parseISODate(it.due).getTime() - todayMid.getTime()) / 86400000);
    return {
      text: it.text,
      due: it.due,
      daysUntil,
      bucket: bucketFor(daysUntil),
      note: it.note ?? null,
      source_url: it.source_url ?? null,
    };
  });
  items.sort((a, b) => a.daysUntil - b.daysUntil);
  return items;
}
