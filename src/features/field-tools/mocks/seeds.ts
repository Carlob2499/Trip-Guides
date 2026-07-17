/**
 * Real-shaped seeds for the field-tools model tests — mirror what actually
 * lands in localStorage on a live guide, so a shape drift breaks a test.
 */

/* Checked-stops map: "<dayIndex>-<stopIndex>" → 1 (see field-tools.js §2). */
export const STOP_STATE = { "0-0": 1, "0-2": 1, "3-1": 1 } as const;

/* Trip-Split persisted blob (`tg-split-<storeKey>`), matching the shape
   trip-split/ui/trip-split.js writes: members + expenses (raw entered
   `amount`) + customSplit. Amounts here total 45012.5. */
export const SPLIT_STATE = {
  members: [
    { id: "m1", name: "Carlo" },
    { id: "m2", name: "Gaby" },
  ],
  expenses: [
    { id: "e1", paidBy: "m1", desc: "Gwangjang dinner", amount: 45000, split: {}, participants: null },
    { id: "e2", paidBy: "m2", desc: "Metro top-up", amount: "12.5", split: {}, participants: null },
    { id: "e3", paidBy: "m1", desc: "pending", amount: "", split: {}, participants: null },
  ],
  customSplit: false,
};
