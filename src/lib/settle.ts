// Trip Split settlement math — pure functions, no I/O, no client code. Extracted from the
// old inline calculator so it can be unit-tested and shared by both the local and the
// Firebase-synced budget. Keyed by member ID (not array index) to match the concurrent-
// safe sync model. Mirrors the original algorithm exactly: each expense credits its payer
// and debits the split; then a minimum-transfers greedy settle.

// A rounding threshold below which a balance/transfer is treated as zero (cents noise).
const EPS = 0.005;

export interface SettleExpense {
  paidBy: string; // member id
  amount: number | null;
  // Custom split: member id -> that person's share (normalized to the total). null/absent = even.
  split?: Record<string, number> | null;
}

export interface SettleTxn { from: string; to: string; amt: number }
export interface SettleResult {
  balances: Record<string, number>; // member id -> net (>0 owed to them, <0 they owe)
  txns: SettleTxn[];
}

export function settle(
  memberIds: string[],
  expenses: SettleExpense[],
  customSplit: boolean,
): SettleResult {
  const balances: Record<string, number> = {};
  for (const id of memberIds) balances[id] = 0;
  const n = memberIds.length;
  if (!n) return { balances, txns: [] };

  for (const exp of expenses) {
    const total = Number(exp.amount) || 0;
    if (!total) continue;
    // Fall back to the first member if the payer id is unknown (mirrors the old `payer >= n → 0`).
    const payer = memberIds.indexOf(exp.paidBy) !== -1 ? exp.paidBy : memberIds[0];
    balances[payer] += total;

    if (customSplit && exp.split) {
      const shares = memberIds.map((id) => Number(exp.split![id]) || 0);
      const sum = shares.reduce((a, b) => a + b, 0);
      memberIds.forEach((id, i) => {
        balances[id] -= sum > 0 ? total * (shares[i] / sum) : total / n;
      });
    } else {
      const share = total / n;
      for (const id of memberIds) balances[id] -= share;
    }
  }

  // Minimum-transfers greedy match: repeatedly settle the largest creditor against the
  // largest debtor.
  const creds = memberIds.filter((id) => balances[id] > EPS).map((id) => ({ id, amt: balances[id] }));
  const debts = memberIds.filter((id) => balances[id] < -EPS).map((id) => ({ id, amt: -balances[id] }));
  creds.sort((a, b) => b.amt - a.amt);
  debts.sort((a, b) => b.amt - a.amt);

  const txns: SettleTxn[] = [];
  let ci = 0, di = 0;
  while (ci < creds.length && di < debts.length) {
    const pay = Math.min(creds[ci].amt, debts[di].amt);
    if (pay > EPS) txns.push({ from: debts[di].id, to: creds[ci].id, amt: pay });
    creds[ci].amt -= pay;
    debts[di].amt -= pay;
    if (creds[ci].amt < EPS) ci++;
    if (debts[di].amt < EPS) di++;
  }
  return { balances, txns };
}
