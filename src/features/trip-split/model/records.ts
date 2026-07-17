/* Record shapes for Trip Split — the single definition of what a member and an expense
   ARE, on every path.

   Why this file exists, in one sentence: a hand-copied field list in the Firebase sync
   echo silently dropped `participants`, which quietly un-did subset expense splits for
   every group using the shared room — the flagship feature of that release, broken in its
   primary mode, invisible to the whole unit-test suite because the suite only tested pure
   settlement math.

   The rule these encode: a record has ONE shape, defined once. Adding a field means
   editing exactly this file, and it then exists on the local path, the sync-write path and
   the sync-echo path together. A normalizer that omits a field DROPS it — that is the
   point (it's what makes the shape authoritative) and also the hazard, which is why the
   shape lives here with tests rather than inline in a mapper nobody reads. */

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
  /** null (not 0) when unset — 0 is a real amount and must stay distinguishable. */
  amount: number | null;
  /** Custom per-person amounts, id-keyed. null when the expense splits evenly. */
  split: Record<string, number> | null;
  /** The subset sharing this expense. null means everyone — NOT "nobody". */
  participants: string[] | null;
  order?: number;
}

/** Normalize one member record from any source (local add, sync echo, migration). */
export function normalizeMember(m: any): SplitMember {
  return {
    id: m.id,
    name: m.name || "",
    payment: m.payment || "",
    order: m.order,
  };
}

/** Normalize one expense record from any source. */
export function normalizeExpense(e: any): SplitExpense {
  return {
    id: e.id,
    paidBy: e.paidBy || "",
    desc: e.desc || "",
    // `!= null` on purpose: amount 0 is a real, enterable value and must survive.
    amount: e.amount != null ? e.amount : null,
    split: e.split || null,
    participants: e.participants || null,
    order: e.order,
  };
}
