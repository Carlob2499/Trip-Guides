/* Pre-trip readiness (design-system.md D6-30) — only material, unresolved actions get weight.
   Every line here is something the guide itself already carries: a checklist item, a dated
   deadline, an entry rule, a weekly closure. The stack is DERIVED, never authored by the
   interface, and a guide with nothing pending renders an honest "nothing left" rather than a
   synthetic readiness score. */

import { buildReminders, type ReminderItem, type ChecklistSource } from "./booking-reminders";
import { buildClosures, closureCount, type ClosureDay } from "./closures";

export interface ReadinessStack {
  /** Booking-flagged items first (a door that closes), then everything else — guide order. */
  reminders: ReminderItem[];
  bookAhead: ReminderItem[];
  other: ReminderItem[];
  closures: ClosureDay[];
  closurePlaceCount: number;
}

export function deriveReadiness(sections: ChecklistSource[] | null | undefined): ReadinessStack {
  const list = Array.isArray(sections) ? sections : [];
  const reminders = buildReminders(list);
  const closures = buildClosures(list as Parameters<typeof buildClosures>[0]);
  return {
    reminders,
    bookAhead: reminders.filter((r) => r.book),
    other: reminders.filter((r) => !r.book),
    closures,
    closurePlaceCount: closureCount(closures),
  };
}

/** How many of a stack's items are still open, given the per-device tick state. Used for the
    collapsed "N of M done" summary — completed items recede, they do not disappear. */
export function openCount(items: readonly ReminderItem[], ticked: Record<string, unknown>): number {
  return items.filter((r) => !ticked[r.id]).length;
}
