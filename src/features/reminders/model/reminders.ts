/* Pure model for Reminders / Notable Items — no DOM, no Firebase, unit-testable.
   The group's shared scratchpad: door codes, agreed meetup times, links, "don't forget"s.
   Authored by the travellers at trip time, not by the guide maker — so this is data the app
   holds, not guide content. */

export type ReminderKind = "note" | "code" | "time" | "link";

export interface ReminderInput {
  text?: string;
  label?: string;
  kind?: string;
  pinned?: unknown;
}
export interface Reminder {
  label: string;
  text: string;
  kind: ReminderKind;
  pinned: boolean;
}

const TEXT_MAX = 500;
const LABEL_MAX = 60;
const KINDS: ReminderKind[] = ["note", "code", "time", "link"];

/* Infer what a reminder IS from what was typed, so the traveller never has to pick a type
   from a dropdown mid-trip. Order matters: a URL is a link even if it contains digits; a
   time needs clock punctuation so a door code like "4821" is never mistaken for one. */
export function inferKind(text: string): ReminderKind {
  const t = String(text || "").trim();
  if (/^https?:\/\/\S+$/i.test(t) || /^www\.\S+$/i.test(t)) return "link";
  if (/\b\d{1,2}[:.]\d{2}\s*(am|pm)?\b/i.test(t) || /\b\d{1,2}\s*(am|pm)\b/i.test(t)) return "time";
  // A bare short alphanumeric token with at least one digit reads as a code (door, wifi, PIN).
  if (/^[A-Za-z0-9#*-]{3,12}$/.test(t) && /\d/.test(t)) return "code";
  return "note";
}

export function buildReminder(input: ReminderInput): Reminder | null {
  const text = String((input && input.text) || "").trim().slice(0, TEXT_MAX);
  if (!text) return null; // a reminder with no body is nothing
  const label = String((input && input.label) || "").trim().slice(0, LABEL_MAX);
  const kind = KINDS.indexOf(input?.kind as ReminderKind) !== -1
    ? (input!.kind as ReminderKind)
    : inferKind(text);
  return { label, text, kind, pinned: !!(input && input.pinned) };
}

/* Pinned first, then newest — the thing you pinned is the thing you're about to need at a
   station entrance, so it must never sink below a later note. Ties keep insertion order. */
export function sortReminders<T extends { pinned?: unknown; createdAt?: unknown }>(list: T[]): T[] {
  return (list || []).slice().sort((a, b) => {
    const ap = a && a.pinned ? 1 : 0, bp = b && b.pinned ? 1 : 0;
    if (ap !== bp) return bp - ap;
    const at = Number(a && a.createdAt) || 0, bt = Number(b && b.createdAt) || 0;
    return bt - at;
  });
}
