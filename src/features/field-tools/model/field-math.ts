/**
 * Pure logic behind the field-tools UI — the money math, the share-link
 * codec, and the burn total. Extracted from ui/field-tools.js so the
 * bug-prone bits (currency branching, base64 round-trip, tolerant summing)
 * are testable without a DOM. The UI keeps only formatting + wiring.
 */

/* ── Currency quick-converter ──────────────────────────────────────────────
   Mirrors the rate-pill converter's branching exactly:
     · no live rate  → "no-rate"  (renders "Live rate not loaded")
     · rate, no input → "empty"   (renders "Type an amount")
     · both present   → the two conversions, USD⇄local.
   `rate` is USD→local (1 USD = rate local), matching the pill. A rate of 0 or
   null is "not loaded" — never a divide-by-zero. Pins the warm-cache seeding
   fix from the sibling `getLastRate()` path: once seeded, a typed amount must
   compute, not sit on "not loaded". */
export type ConvertResult =
  | { state: "no-rate" }
  | { state: "empty" }
  | { state: "ok"; usdToLocal: number; localToUsd: number };

export function convertRate(amount: number, rate: number | null | undefined): ConvertResult {
  if (!rate) return { state: "no-rate" };
  if (Number.isNaN(amount)) return { state: "empty" };
  return { state: "ok", usdToLocal: amount * rate, localToUsd: amount / rate };
}

/* ── Progress-share codec ──────────────────────────────────────────────────
   Checked stops travel in a link as base64(JSON). Only well-formed
   "<day>-<idx>" keys survive decode, so a hand-tampered ?stops= can neither
   inject arbitrary localStorage keys nor pollute the prototype (a key that
   would collide with Object internals can't match the digit-dash-digit shape).
   Any malformed payload decodes to {} rather than throwing. */
const STOP_KEY = /^\d+-\d+$/;
export type StopState = Record<string, number>;

/* `unescape`/`escape` here are flagged deprecated by TypeScript and stay ON PURPOSE — same reason
   as vote-link.ts: btoa() throws above U+00FF, so this is the standard UTF-8-safe base64 idiom.
   The ?stops= param it produces travels in URLs travellers share mid-trip; changing the encoding
   would invalidate links already sent. Replace only behind round-trip tests. */
export function encodeStops(state: StopState): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

export function decodeStops(param: string): StopState {
  try {
    const incoming = JSON.parse(decodeURIComponent(escape(atob(param))));
    if (!incoming || typeof incoming !== "object") return {};
    const out: StopState = {};
    for (const k of Object.keys(incoming)) {
      if (STOP_KEY.test(k)) out[k] = 1;
    }
    return out;
  } catch {
    return {};
  }
}

/* ── Budget burn total ──────────────────────────────────────────────────────
   Sum of logged expense amounts from the Trip-Split state blob (the masthead
   "burn" tile). Reads another feature's persisted state, so it tolerates a
   missing/partial blob and non-numeric amounts rather than throwing — a blank
   or malformed amount counts as 0. */
export function burnTotal(split: unknown): number {
  const expenses =
    split && typeof split === "object" && Array.isArray((split as { expenses?: unknown }).expenses)
      ? (split as { expenses: unknown[] }).expenses
      : [];
  return expenses.reduce<number>(
    (sum, ex) => sum + (parseFloat((ex as { amount?: unknown })?.amount as string) || 0),
    0,
  );
}
