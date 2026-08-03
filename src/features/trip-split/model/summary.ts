// Budget summary — the printable record of what a trip actually cost, derived from the same
// members/expenses/payments the calculator holds. Pure: no DOM, no formatting, no currency
// symbols. Every figure the sheet prints is computed HERE and rendered verbatim by
// ui/budget-sheet.js, so what the traveller sends out is arithmetic the unit tests cover
// rather than numbers a renderer assembled on its way to the page.
//
// Shares come from expenseShares() — settle()'s own inner function — so the per-person
// breakdown can never disagree with the balances printed beside it.
//
// V2: all money is integer minor units of the base currency. Two additions: spend by
// category (the "where did it actually go" question), and an explicit count of expenses that
// could not be converted, so the sheet can admit a gap instead of quietly under-reporting.

import { settle, expenseShares, type SettleExpense, type SettlePayment } from "./settle";

export interface SummaryMemberInput { id: string; name?: string | null }
export interface SummaryExpenseInput extends SettleExpense {
  id?: string;
  desc?: string | null;
  category?: string | null;
  /** What was typed, in the expense's own currency — for the itemised list only. */
  amountMinor?: number | null;
  currency?: string;
}

export interface SummaryPerson {
  id: string;
  name: string;
  paid: number;   // what they put on their own card, base minor units
  share: number;  // what the split says was theirs
  net: number;    // paid - share, minus anything they have already settled
}
export interface SummaryTxn { from: string; to: string; fromName: string; toName: string; amtMinor: number }
export interface SummaryItem {
  desc: string;
  payerName: string;
  baseMinor: number;
  /** The amount as entered, when it differs from the base currency. null when it doesn't. */
  nativeMinor: number | null;
  nativeCurrency: string | null;
  category: string;
  sharerCount: number;
  sharerNames: string[];
}
export interface SummaryPersonItems {
  id: string;
  name: string;
  total: number;
  items: { desc: string; share: number }[];
}
export interface SummaryCategory { category: string; total: number; count: number }
export interface BudgetSummary {
  total: number;
  memberCount: number;
  expenseCount: number;
  perPerson: number;
  days: number | null;
  perDay: number | null;
  people: SummaryPerson[];
  txns: SummaryTxn[];
  items: SummaryItem[];
  byPerson: SummaryPersonItems[];
  byCategory: SummaryCategory[];
  /** Payments already recorded, and what they came to. */
  settledCount: number;
  settledMinor: number;
  /** Expenses excluded from every figure because no base-currency conversion was captured.
      Surfaced so the sheet can say so rather than print a total that quietly omits them. */
  unconvertedCount: number;
}

/** An expense with no description still has to be nameable in a printed list — the amount
    alone in a "what for" column reads as a rendering bug. */
const UNTITLED = "Unlabelled expense";
const UNCATEGORISED = "Uncategorised";

function displayName(m: SummaryMemberInput, i: number): string {
  const n = (m.name || "").trim();
  return n || "Person " + (i + 1);
}

/**
 * Build the printable summary. `days` is the trip's length in days (from the guide's own day
 * cards) and is optional: a guide with no dated days gets `perDay: null` and the sheet simply
 * omits that figure rather than dividing by a guessed number.
 */
export function buildBudgetSummary(
  members: SummaryMemberInput[],
  expenses: SummaryExpenseInput[],
  payments: SettlePayment[] = [],
  days?: number | null,
): BudgetSummary {
  const ids = members.map((m) => m.id);
  const nameOf: Record<string, string> = {};
  members.forEach((m, i) => { nameOf[m.id] = displayName(m, i); });

  // Half-typed rows are not spending. An expense whose foreign amount was never converted is
  // counted separately rather than silently dropped — see unconvertedCount.
  const real = expenses.filter((e) => (Number(e.baseMinor) || 0) > 0);
  const unconvertedCount = expenses.filter(
    (e) => !(Number(e.baseMinor) || 0) && (Number(e.amountMinor) || 0) > 0,
  ).length;

  const total = real.reduce((s, e) => s + (Number(e.baseMinor) || 0), 0);
  const calc = settle(ids, real, payments);

  const paid: Record<string, number> = {};
  const share: Record<string, number> = {};
  ids.forEach((id) => { paid[id] = 0; share[id] = 0; });

  const byPersonItems: Record<string, { desc: string; share: number }[]> = {};
  ids.forEach((id) => { byPersonItems[id] = []; });

  const catTotals: Record<string, { total: number; count: number }> = {};

  const items: SummaryItem[] = real.map((e) => {
    const baseMinor = Number(e.baseMinor) || 0;
    // Mirrors settle(): an unknown payer id falls back to the first member, so the printed
    // "paid by" column matches the balances rather than showing a blank.
    const payer = ids.indexOf(e.paidBy) !== -1 ? e.paidBy : ids[0];
    if (payer) paid[payer] += baseMinor;

    const shares = expenseShares(ids, e);
    const sharerIds = ids.filter((id) => (shares[id] || 0) > 0);
    const desc = (e.desc || "").trim() || UNTITLED;
    sharerIds.forEach((id) => {
      share[id] += shares[id];
      byPersonItems[id].push({ desc, share: shares[id] });
    });

    const category = (e.category || "").trim() || UNCATEGORISED;
    if (!catTotals[category]) catTotals[category] = { total: 0, count: 0 };
    catTotals[category].total += baseMinor;
    catTotals[category].count += 1;

    const nativeMinor = Number(e.amountMinor) || 0;
    const foreign = !!e.currency && nativeMinor > 0 && nativeMinor !== baseMinor;

    return {
      desc,
      payerName: payer ? nameOf[payer] : "—",
      baseMinor,
      nativeMinor: foreign ? nativeMinor : null,
      nativeCurrency: foreign ? e.currency! : null,
      category,
      sharerCount: sharerIds.length,
      sharerNames: sharerIds.map((id) => nameOf[id]),
    };
  });

  const people: SummaryPerson[] = members.map((m) => ({
    id: m.id,
    name: nameOf[m.id],
    paid: paid[m.id] || 0,
    share: share[m.id] || 0,
    net: calc.balances[m.id] || 0,
  }));

  const txns: SummaryTxn[] = calc.txns.map((t) => ({
    from: t.from, to: t.to, fromName: nameOf[t.from] || "?", toName: nameOf[t.to] || "?", amtMinor: t.amtMinor,
  }));

  const byPerson: SummaryPersonItems[] = members.map((m) => ({
    id: m.id,
    name: nameOf[m.id],
    total: share[m.id] || 0,
    items: byPersonItems[m.id] || [],
  }));

  // Biggest spend first — the order the question "where did it go" is actually asked in.
  const byCategory: SummaryCategory[] = Object.keys(catTotals)
    .map((category) => ({ category, total: catTotals[category].total, count: catTotals[category].count }))
    .sort((a, b) => b.total - a.total || (a.category < b.category ? -1 : 1));

  const settledMinor = payments.reduce((s, p) => s + (Math.round(Number(p.baseMinor)) || 0), 0);

  const d = typeof days === "number" && days > 0 ? days : null;
  return {
    total,
    memberCount: members.length,
    expenseCount: real.length,
    perPerson: members.length ? Math.round(total / members.length) : 0,
    days: d,
    perDay: d ? Math.round(total / d) : null,
    people,
    txns,
    items,
    byPerson,
    byCategory,
    settledCount: payments.length,
    settledMinor,
    unconvertedCount,
  };
}
