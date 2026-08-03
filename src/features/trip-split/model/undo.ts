/* Reversing a deletion — the pure half.

   Deleting an expense is a one-record change and reverses trivially. Deleting a PERSON is
   not: they may have paid for things, carry weights on split rules, and be named in
   participant snapshots, so removing them REWRITES other records. That ripple was written
   twice in ui/trip-split.js — once for the shared room, once for the on-device path — and
   the two had already drifted (the room path issued three separate updates per expense; the
   local one mutated in place). Undo needs the exact before-state of every field the removal
   touches, and capturing that twice is how the two copies would drift again.

   So the ripple is planned ONCE, here, as data: `patches` is what the removal changes,
   `restore` is the same expenses' prior values. Applying `patches` removes the person;
   applying `restore` and putting the member record back is the exact inverse. Both callers
   apply the same plan — the room by writing the patch, the device by assigning it. */

import type { SplitExpense, SplitMember } from "./records";

/** The subset of an expense a member removal can rewrite. A key is PRESENT only when that
    field actually changes, so `restore` never re-writes an untouched field. */
export interface ExpensePatch {
  id: string;
  paidBy?: string;
  weights?: Record<string, number> | null;
  participants?: string[] | null;
}

export interface MemberRemoval {
  /** Apply these to remove every reference to the departed member. */
  patches: ExpensePatch[];
  /** The same expenses' values BEFORE the patches — apply to reverse the removal. */
  restore: ExpensePatch[];
}

/** Plan the expense-side ripple of removing one member. Pure: nothing is mutated, and the
    member list is only read to decide who inherits their expenses. */
export function planMemberRemoval(
  members: SplitMember[],
  expenses: SplitExpense[],
  id: string,
): MemberRemoval {
  // An expense with no payer has no meaning, so the first remaining person inherits it.
  // "" when the group is now empty — the same fallback the UI used before this file.
  const fallback = (members.filter((m) => m.id !== id)[0] || { id: "" }).id || "";
  const patches: ExpensePatch[] = [];
  const restore: ExpensePatch[] = [];

  for (const e of expenses) {
    const to: ExpensePatch = { id: e.id };
    const from: ExpensePatch = { id: e.id };
    let touched = false;

    if (e.paidBy === id) {
      to.paidBy = fallback;
      from.paidBy = e.paidBy;
      touched = true;
    }
    if (e.weights && Object.prototype.hasOwnProperty.call(e.weights, id)) {
      const next = Object.assign({}, e.weights);
      delete next[id];
      to.weights = next;
      from.weights = Object.assign({}, e.weights);
      touched = true;
    }
    if (e.participants && e.participants.indexOf(id) !== -1) {
      const pruned = e.participants.filter((x) => x !== id);
      // If they were the ONLY sharer, clear the list rather than leave an expense shared by
      // nobody: null reads as "the whole group", which is at least a meaning.
      to.participants = pruned.length ? pruned : null;
      from.participants = e.participants.slice();
      touched = true;
    }

    if (touched) {
      patches.push(to);
      restore.push(from);
    }
  }
  return { patches, restore };
}

/** Apply one patch to an expense record, in place. Used by the on-device path and by undo;
    the shared room sends the same object as a Firebase update instead. */
export function applyExpensePatch(expense: SplitExpense, patch: ExpensePatch): void {
  if ("paidBy" in patch) expense.paidBy = patch.paidBy as string;
  if ("weights" in patch) expense.weights = patch.weights as Record<string, number> | null;
  if ("participants" in patch) expense.participants = patch.participants as string[] | null;
}
