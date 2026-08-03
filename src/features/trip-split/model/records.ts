/* Record shapes for Trip Split — the single definition of what a member, an expense and a
   settlement payment ARE, on every path.

   Why this file exists, in one sentence: a hand-copied field list in the Firebase sync
   echo silently dropped `participants`, which quietly un-did subset expense splits for
   every group using the shared room — the flagship feature of that release, broken in its
   primary mode, invisible to the whole unit-test suite because the suite only tested pure
   settlement math.

   The rule these encode: a record has ONE shape, defined once. Adding a field means
   editing exactly this file, and it then exists on the local path, the sync-write path and
   the sync-echo path together. A normalizer that omits a field DROPS it — that is the
   point (it's what makes the shape authoritative) and also the hazard, which is why the
   shape lives here with tests rather than inline in a mapper nobody reads.

   ─ V2 (2026-08-02) ─────────────────────────────────────────────────────────────────────
   Three defects drove a shape change, and doing them in one pass means one migration of
   everyone's saved data rather than three:

   1. MONEY IS INTEGER MINOR UNITS. `amount` was a float in dollars, split by
      `total / n` through toFixed(2) — $100 three ways stored 33.33 each and lost a cent.
      Amounts are now `amountMinor` in `currency`, and shares come from computeSplits(),
      which is guaranteed to sum exactly to the total.
   2. PARTICIPANTS ARE SNAPSHOTTED. `participants: null` used to mean "everyone, as the
      group stands right now", so adding a fourth traveller on day 5 retroactively made
      them owe for a day-1 dinner they never attended. New records always carry an explicit
      list. null survives ONLY as the legacy reading of old records.
   3. THE SPLIT METHOD BELONGS TO THE EXPENSE. It used to be one trip-wide boolean, so
      dinner-split-evenly and hotel-split-70/30 could not coexist. Each expense now names
      its own method and carries its own weights.

   Migration is split by what each layer can know. Amount, currency and method DEFAULTS are
   per-record and migrate here. The old trip-wide custom-split flag lives in trip meta, not
   on the record, so converting it into per-expense EXACT methods happens in
   ui/trip-split.js's migrate(), which is the only place that flag is in scope. */

import { BASE_CURRENCY, CURRENCY_EXPONENT, type SplitMethod } from "./money";

export interface SplitMember {
  id: string;
  name: string;
  payment: string;
  /** Firebase ordering key. Absent on locally-created records — that's legitimate;
      orderedFrom() falls back to createdAt, then to insertion order. */
  order?: number;
}

export interface SplitExpense {
  id: string;
  paidBy: string;
  desc: string;
  /** Integer minor units of `currency`. null (not 0) when unset — 0 is a real amount and
      must stay distinguishable from "nothing typed yet". */
  amountMinor: number | null;
  /** What the traveller actually paid in. Defaults to BASE_CURRENCY. */
  currency: string;
  /** Units of `currency` per 1 BASE_CURRENCY, captured AT ENTRY. Kept beside the amount so
      the sheet can state where the number came from, and so a later rate move never
      rewrites history. null for base-currency expenses. */
  rate: number | null;
  rateDate: string | null;
  /** The amount converted to BASE_CURRENCY minor units at `rate`, computed once at entry.
      This is what settlement consumes: one trip nets to one set of transfers. */
  baseMinor: number | null;
  /** How this ONE expense divides. */
  method: SplitMethod;
  /** Per-member weights, id-keyed, interpreted by `method`: EXACT = minor units of
      `currency`, PERCENTAGE = 0–100, SHARES = proportional. Ignored by EQUAL. */
  weights: Record<string, number> | null;
  /** The subset sharing this expense, snapshotted when it was created. null means "this is
      a legacy record from before snapshots" and is read as the whole group — never write
      null on a new record. */
  participants: string[] | null;
  /** Free-form spend category ("Food", "Transport"). "" when uncategorised. */
  category: string;
  order?: number;
}

/** A settlement that actually happened: Riley handed Sam the cash. Without this the tool
    recomputes the same suggestion forever and can never say a trip is done. */
export interface SplitPayment {
  id: string;
  from: string;
  to: string;
  /** Always BASE_CURRENCY minor units — balances are settled in one currency. */
  baseMinor: number;
  /** ISO date the payment was recorded. */
  on: string;
  note: string;
  order?: number;
}

const METHODS: SplitMethod[] = ["EQUAL", "EXACT", "PERCENTAGE", "SHARES"];

/** Normalize one member record from any source (local add, sync echo, migration). */
export function normalizeMember(m: any): SplitMember {
  return {
    id: m.id,
    name: m.name || "",
    payment: m.payment || "",
    order: m.order,
  };
}

/** Legacy float dollars -> integer cents. Rounds at the boundary, once. */
function legacyAmountToMinor(amount: any): number | null {
  if (amount == null || amount === "") return null;
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

/** Normalize one expense record from any source, migrating a pre-V2 record on the way in.
    Reading an old record must never lose money, so the legacy float amount is converted
    here rather than anywhere a caller might forget. */
export function normalizeExpense(e: any): SplitExpense {
  const currency = typeof e.currency === "string" && CURRENCY_EXPONENT[e.currency] !== undefined
    ? e.currency
    : BASE_CURRENCY;

  // `!= null` on purpose: 0 is a real, enterable value and must survive.
  const amountMinor = e.amountMinor != null && Number.isFinite(Number(e.amountMinor))
    ? Math.round(Number(e.amountMinor))
    : legacyAmountToMinor(e.amount);

  const rate = e.rate != null && Number.isFinite(Number(e.rate)) && Number(e.rate) > 0
    ? Number(e.rate)
    : null;

  // A base-currency expense IS its own base amount. A foreign one keeps whatever was
  // captured at entry; if a legacy record somehow carries a foreign currency with no
  // stored conversion, baseMinor stays null and settlement skips it rather than guessing
  // a rate that would silently invent a number.
  let baseMinor: number | null;
  if (e.baseMinor != null && Number.isFinite(Number(e.baseMinor))) {
    baseMinor = Math.round(Number(e.baseMinor));
  } else if (currency === BASE_CURRENCY) {
    baseMinor = amountMinor;
  } else {
    baseMinor = null;
  }

  const method: SplitMethod = METHODS.indexOf(e.method) !== -1 ? e.method : "EQUAL";

  // Legacy `split` was a float map of per-person dollar shares. It becomes EXACT weights in
  // minor units; whether the expense USES them is the trip-level flag's business (see the
  // V2 note at the top), so the method above is not forced here.
  let weights: Record<string, number> | null = null;
  if (e.weights && typeof e.weights === "object") {
    weights = {};
    for (const k of Object.keys(e.weights)) {
      const v = Number(e.weights[k]);
      if (Number.isFinite(v)) weights[k] = v;
    }
  } else if (e.split && typeof e.split === "object") {
    weights = {};
    for (const k of Object.keys(e.split)) {
      const v = Number(e.split[k]);
      if (Number.isFinite(v)) weights[k] = Math.round(v * 100);
    }
  }

  return {
    id: e.id,
    paidBy: e.paidBy || "",
    desc: e.desc || "",
    amountMinor,
    currency,
    rate,
    rateDate: e.rateDate || null,
    baseMinor,
    method,
    weights,
    participants: e.participants || null,
    category: e.category || "",
    order: e.order,
  };
}

/** Normalize one settlement payment from any source. */
export function normalizePayment(p: any): SplitPayment {
  const n = Number(p.baseMinor);
  return {
    id: p.id,
    from: p.from || "",
    to: p.to || "",
    baseMinor: Number.isFinite(n) ? Math.round(n) : 0,
    on: p.on || "",
    note: p.note || "",
    order: p.order,
  };
}
