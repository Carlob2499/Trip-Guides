// Trip Split settlement math — pure functions, no I/O, no client code. Keyed by member ID
// (not array index) to match the concurrent-safe sync model. Each expense credits its payer
// and debits its sharers; recorded payments then discharge what has actually been handed
// over; finally a minimum-transfers greedy settle turns net balances into transfers.
//
// V2 (2026-08-02) — three changes, all correctness:
//
// 1. INTEGER MINOR UNITS THROUGHOUT. Shares come from computeSplits(), which allocates
//    leftover minor units by largest remainder and is guaranteed to sum EXACTLY to the
//    total. The old float path divided and rounded to 2dp, so $100 three ways came to
//    $99.99 and the missing cent surfaced as a phantom balance. With integers there is no
//    rounding noise at all, which is why the old EPS float tolerance is gone.
// 2. PAYMENTS ARE FIRST-CLASS. Settlement used to be a suggestion recomputed forever, so a
//    debt paid in cash stayed on the screen. A payment discharges the payer's debt.
// 3. THE SPLIT METHOD BELONGS TO THE EXPENSE, not to the trip.

import { computeSplits, type SplitMethod } from "./money";

export interface SettleExpense {
  paidBy: string; // member id
  /** BASE_CURRENCY minor units. null/0 means "not a real expense yet" and is skipped. */
  baseMinor: number | null;
  /** Defaults to EQUAL. */
  method?: SplitMethod;
  /** Per-member weights, id-keyed. EXACT = minor units, PERCENTAGE = 0–100, SHARES =
      proportional. Ignored by EQUAL. */
  weights?: Record<string, number> | null;
  /** Who shares it. Absent/empty is the LEGACY reading — "the whole group as it stands" —
      which is exactly the bug that made a late arrival owe for a day-1 dinner. New records
      always carry an explicit snapshot; this fallback exists only to keep old records
      settling as they always did. */
  participants?: string[] | null;
}

/** A settlement that actually happened. */
export interface SettlePayment {
  from: string;
  to: string;
  /** BASE_CURRENCY minor units. */
  baseMinor: number;
}

export interface SettleTxn { from: string; to: string; amtMinor: number }
export interface SettleResult {
  /** member id -> net minor units (>0 they are owed, <0 they owe). */
  balances: Record<string, number>;
  txns: SettleTxn[];
}

/**
 * What ONE expense charges each member, id-keyed, in BASE_CURRENCY minor units. Shared with
 * the summary sheet so a printed breakdown can never disagree with the balances beside it.
 *
 * Every non-EQUAL method is resolved as PROPORTIONAL weights over the base amount rather
 * than by calling computeSplits' EXACT branch. That is deliberate: EXACT weights are typed
 * in the expense's OWN currency, so validating them against a converted base total would
 * reject correct input, and a throw here would happen inside a render. Proportional
 * allocation preserves the intended ratio, always sums exactly to the total, and reduces to
 * precisely the typed amounts when the expense is already in the base currency. Telling the
 * traveller their typed shares don't add up is the entry form's job, not the engine's.
 */
export function expenseShares(
  memberIds: string[],
  exp: SettleExpense,
): Record<string, number> {
  const out: Record<string, number> = {};
  const total = Number(exp.baseMinor) || 0;
  if (!total) return out;

  const named = (exp.participants || []).filter((id) => memberIds.indexOf(id) !== -1);
  const sharers = named.length ? named : memberIds;
  if (!sharers.length) return out;

  const method: SplitMethod = exp.method || "EQUAL";
  let shares;
  if (method === "EQUAL") {
    shares = computeSplits(total, "EQUAL", sharers.map((id) => ({ memberId: id })));
  } else {
    const weighted = sharers.map((id) => ({
      memberId: id,
      weight: Math.max(0, Number(exp.weights?.[id]) || 0),
    }));
    const sum = weighted.reduce((a, p) => a + p.weight, 0);
    // No weights typed yet → fall back to an even split, which is what the traveller sees
    // in the form before they start filling amounts in.
    shares = sum > 0
      ? computeSplits(total, "SHARES", weighted)
      : computeSplits(total, "EQUAL", sharers.map((id) => ({ memberId: id })));
  }

  for (const s of shares) if (s.amountMinor) out[s.memberId] = s.amountMinor;
  return out;
}

export function settle(
  memberIds: string[],
  expenses: SettleExpense[],
  payments: SettlePayment[] = [],
): SettleResult {
  const balances: Record<string, number> = {};
  for (const id of memberIds) balances[id] = 0;
  if (!memberIds.length) return { balances, txns: [] };

  for (const exp of expenses) {
    const total = Number(exp.baseMinor) || 0;
    if (!total) continue;
    // Fall back to the first member if the payer id is unknown (a member can be deleted
    // after the expense was recorded).
    const payer = memberIds.indexOf(exp.paidBy) !== -1 ? exp.paidBy : memberIds[0];
    balances[payer] += total;

    const shares = expenseShares(memberIds, exp);
    for (const id of memberIds) balances[id] -= shares[id] || 0;
  }

  // A recorded payment discharges debt: the payer owes that much less, the recipient is
  // owed that much less. Unknown ids are ignored rather than allowed to unbalance the trip.
  for (const p of payments) {
    const amt = Math.round(Number(p.baseMinor) || 0);
    if (!amt) continue;
    if (memberIds.indexOf(p.from) === -1 || memberIds.indexOf(p.to) === -1) continue;
    balances[p.from] += amt;
    balances[p.to] -= amt;
  }

  // Minimum-transfers greedy match: repeatedly settle the largest creditor against the
  // largest debtor. Integers, so a balance is either zero or it isn't — no tolerance band.
  const creds = memberIds.filter((id) => balances[id] > 0).map((id) => ({ id, amt: balances[id] }));
  const debts = memberIds.filter((id) => balances[id] < 0).map((id) => ({ id, amt: -balances[id] }));
  creds.sort((a, b) => b.amt - a.amt || (a.id < b.id ? -1 : 1));
  debts.sort((a, b) => b.amt - a.amt || (a.id < b.id ? -1 : 1));

  const txns: SettleTxn[] = [];
  let ci = 0, di = 0;
  while (ci < creds.length && di < debts.length) {
    const pay = Math.min(creds[ci].amt, debts[di].amt);
    if (pay > 0) txns.push({ from: debts[di].id, to: creds[ci].id, amtMinor: pay });
    creds[ci].amt -= pay;
    debts[di].amt -= pay;
    if (creds[ci].amt <= 0) ci++;
    if (debts[di].amt <= 0) di++;
  }
  return { balances, txns };
}
