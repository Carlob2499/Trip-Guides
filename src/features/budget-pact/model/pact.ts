// Budget pact: plan vs. actual (docs/PLAN_TRAVELER_FEATURES.md F2). Joins the guide's OWN
// already-numeric Budget-tab plan (per-item `basis: "day"|"trip"` estimates) against the
// SAME section's own "your spend" actual entries — not Trip Split, which the plan doc names
// but which (checked against the real silo before building this) tracks only a single
// running grand total with no per-day breakdown and no currency field at all, so it can't
// support a "Day N: over/under plan" framing. The Budget tab's own plan + actual are already
// numeric, already per-day-aware (`basis`), and already in the guide's own currency — joining
// those two halves of the SAME section needs no new backend and no currency conversion.
//
// The comparison is prorated, not "actual so far vs. the whole trip" (which would read
// "under plan" every single day until the last one): only the days that have actually
// elapsed count toward the day-basis portion of the plan; one-off `trip`-basis costs
// (flights, a rental car reserved once) count as committed from day one.

export type PactBasisItem = { basis: "day" | "trip"; est: number };

export interface PactInput {
  items: PactBasisItem[];
  days: number; // the budget section's own trip-length multiplier
  daysElapsed: number; // whole days of the trip so far; 0 before departure
  actualSoFar: number; // sum of every entered "your spend" figure
  currency: string;
}

export interface PactResult {
  planSoFar: number;
  actualSoFar: number;
  deltaAmount: number; // actualSoFar - planSoFar; positive = over
  status: "under" | "on" | "over";
  dayLabel: string; // "Before you go" | "Day N"
  currency: string;
}

export function computeBudgetPact(input: PactInput): PactResult | null {
  if (!input.items.length) return null;
  if (!(input.actualSoFar > 0)) return null; // nothing entered yet — honest blank, nothing to compare

  const elapsed = Math.max(0, Math.min(input.daysElapsed, input.days));
  const planSoFar = input.items.reduce((total, it) => {
    if (it.basis === "trip") return total + it.est; // one-off costs are committed from day 1
    return total + it.est * elapsed; // day-basis costs only accrue for elapsed days
  }, 0);

  const deltaAmount = Math.round(input.actualSoFar - planSoFar);
  const status: PactResult["status"] = Math.abs(deltaAmount) < 1 ? "on" : deltaAmount > 0 ? "over" : "under";

  return {
    planSoFar: Math.round(planSoFar),
    actualSoFar: Math.round(input.actualSoFar),
    deltaAmount: Math.abs(deltaAmount),
    status,
    dayLabel: elapsed > 0 ? `Day ${elapsed}` : "Before you go",
    currency: input.currency,
  };
}
