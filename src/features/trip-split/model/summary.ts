// Budget summary — the printable record of what a trip actually cost, derived from the same
// members/expenses the calculator holds. Pure: no DOM, no formatting, no currency symbols.
// Every figure the sheet prints is computed HERE and rendered verbatim by ui/budget-sheet.js,
// so what the traveller sends out is arithmetic the unit tests cover rather than numbers a
// renderer assembled on its way to the page.
//
// Shares come from expenseShares() — settle()'s own inner function — so the per-person
// breakdown can never disagree with the balances printed beside it.

import { settle, expenseShares, type SettleExpense } from "./settle";

export interface SummaryMemberInput { id: string; name?: string | null }
export interface SummaryExpenseInput extends SettleExpense { id?: string; desc?: string | null }

export interface SummaryPerson {
  id: string;
  name: string;
  paid: number;   // what they put on their own card
  share: number;  // what the split says was theirs
  net: number;    // paid - share (>0 they are owed, <0 they owe)
}
export interface SummaryTxn { from: string; to: string; fromName: string; toName: string; amt: number }
export interface SummaryItem {
  desc: string;
  payerName: string;
  amount: number;
  sharerCount: number;
  sharerNames: string[];
}
export interface SummaryPersonItems {
  id: string;
  name: string;
  total: number;
  items: { desc: string; share: number }[];
}
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
}

/** An expense with no description still has to be nameable in a printed list — the amount
    alone in a "what for" column reads as a rendering bug. */
const UNTITLED = "Unlabelled expense";

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
  customSplit: boolean,
  days?: number | null,
): BudgetSummary {
  const ids = members.map((m) => m.id);
  const nameOf: Record<string, string> = {};
  members.forEach((m, i) => { nameOf[m.id] = displayName(m, i); });

  // Expenses with no amount are half-typed rows, not spending: they are excluded from the
  // count and the itemised list, exactly as settle() already skips them in the balances.
  const real = expenses.filter((e) => (Number(e.amount) || 0) > 0);
  const total = real.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const calc = settle(ids, real, customSplit);

  const paid: Record<string, number> = {};
  const share: Record<string, number> = {};
  ids.forEach((id) => { paid[id] = 0; share[id] = 0; });

  const byPersonItems: Record<string, { desc: string; share: number }[]> = {};
  ids.forEach((id) => { byPersonItems[id] = []; });

  const items: SummaryItem[] = real.map((e) => {
    const amount = Number(e.amount) || 0;
    // Mirrors settle(): an unknown payer id falls back to the first member, so the printed
    // "paid by" column matches the balances rather than showing a blank.
    const payer = ids.indexOf(e.paidBy) !== -1 ? e.paidBy : ids[0];
    if (payer) paid[payer] += amount;

    const shares = expenseShares(ids, e, customSplit);
    const sharerIds = ids.filter((id) => (shares[id] || 0) > 0);
    sharerIds.forEach((id) => {
      share[id] += shares[id];
      byPersonItems[id].push({ desc: (e.desc || "").trim() || UNTITLED, share: shares[id] });
    });

    return {
      desc: (e.desc || "").trim() || UNTITLED,
      payerName: payer ? nameOf[payer] : "—",
      amount,
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
    from: t.from, to: t.to, fromName: nameOf[t.from] || "?", toName: nameOf[t.to] || "?", amt: t.amt,
  }));

  const byPerson: SummaryPersonItems[] = members.map((m) => ({
    id: m.id,
    name: nameOf[m.id],
    total: share[m.id] || 0,
    items: byPersonItems[m.id] || [],
  }));

  const d = typeof days === "number" && days > 0 ? days : null;
  return {
    total,
    memberCount: members.length,
    expenseCount: real.length,
    perPerson: members.length ? total / members.length : 0,
    days: d,
    perDay: d ? total / d : null,
    people,
    txns,
    items,
    byPerson,
  };
}
