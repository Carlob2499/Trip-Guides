/**
 * Deterministic split computation for the expense engine.
 *
 * Contract (mirrors the schema invariant on ExpenseSplit):
 *   - All amounts are integers in ISO-4217 minor units. No floats in, no
 *     floats out.
 *   - The returned shares ALWAYS sum exactly to amountMinor.
 *   - Same input → same output. Leftover minor units from division are
 *     assigned by largest fractional remainder, ties broken by input order.
 */

export type SplitMethod = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES';

/**
 * ISO-4217 minor-unit exponents for currencies Wayfinder handles today.
 * Extend as trips demand; unknown currencies fail loudly rather than
 * silently misplacing a decimal point.
 */
export const CURRENCY_EXPONENT: Record<string, number> = {
  KRW: 0,
  JPY: 0,
  DKK: 2,
  EUR: 2,
  USD: 2,
  GBP: 2,
  SEK: 2,
  NOK: 2,
};

/** Render integer minor units as a localized currency string (fixed 'en'
 *  locale so server render is deterministic). */
export function formatMinor(amountMinor: number, currency: string): string {
  const exponent = CURRENCY_EXPONENT[currency];
  if (exponent === undefined) {
    throw new Error(`unknown currency "${currency}" — add it to CURRENCY_EXPONENT`);
  }
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent,
  }).format(amountMinor / 10 ** exponent);
}

export interface SplitParticipant {
  memberId: string;
  /**
   * EXACT: share in minor units (integer).
   * PERCENTAGE: 0–100; all weights must sum to 100.
   * SHARES: positive proportional weight (e.g. 2 vs 1).
   * EQUAL: ignored.
   */
  weight?: number;
}

export interface SplitResult {
  memberId: string;
  amountMinor: number;
}

export class SplitError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'INVALID_AMOUNT'
      | 'NO_PARTICIPANTS'
      | 'DUPLICATE_MEMBER'
      | 'INVALID_WEIGHT'
      | 'SUM_MISMATCH'
      | 'ZERO_WEIGHT'
      | 'INTERNAL',
  ) {
    super(message);
    this.name = 'SplitError';
  }
}

export function computeSplits(
  amountMinor: number,
  method: SplitMethod,
  participants: SplitParticipant[],
): SplitResult[] {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    throw new SplitError(
      `amountMinor must be a non-negative integer in minor units, got ${amountMinor}`,
      'INVALID_AMOUNT',
    );
  }
  if (participants.length === 0) {
    throw new SplitError('at least one participant is required', 'NO_PARTICIPANTS');
  }
  const ids = new Set(participants.map((p) => p.memberId));
  if (ids.size !== participants.length) {
    throw new SplitError('duplicate memberId in participants', 'DUPLICATE_MEMBER');
  }

  if (method === 'EXACT') {
    const amounts = participants.map((p) => {
      if (p.weight === undefined || !Number.isSafeInteger(p.weight) || p.weight < 0) {
        throw new SplitError(
          `EXACT requires a non-negative integer minor-unit weight per participant, got ${p.weight} for ${p.memberId}`,
          'INVALID_WEIGHT',
        );
      }
      return p.weight;
    });
    const sum = amounts.reduce((a, b) => a + b, 0);
    if (sum !== amountMinor) {
      throw new SplitError(
        `EXACT splits sum to ${sum}, expected ${amountMinor}`,
        'SUM_MISMATCH',
      );
    }
    return participants.map((p, i) => ({ memberId: p.memberId, amountMinor: amounts[i] ?? 0 }));
  }

  let weights: number[];
  if (method === 'EQUAL') {
    weights = participants.map(() => 1);
  } else {
    weights = participants.map((p) => {
      if (p.weight === undefined || !Number.isFinite(p.weight) || p.weight < 0) {
        throw new SplitError(
          `${method} requires a non-negative finite weight per participant, got ${p.weight} for ${p.memberId}`,
          'INVALID_WEIGHT',
        );
      }
      return p.weight;
    });
    if (method === 'PERCENTAGE') {
      const total = weights.reduce((a, b) => a + b, 0);
      if (Math.abs(total - 100) > 1e-6) {
        throw new SplitError(`percentages sum to ${total}, expected 100`, 'SUM_MISMATCH');
      }
    }
  }

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) {
    throw new SplitError('total weight must be positive', 'ZERO_WEIGHT');
  }

  // Largest-remainder allocation: floor each raw proportional share, then
  // hand the leftover minor units out by descending fractional remainder
  // (ties broken by input order). Deterministic and sums exactly.
  const raw = weights.map((w) => (amountMinor * w) / totalWeight);
  const floors = raw.map(Math.floor);
  const remainder = amountMinor - floors.reduce((a, b) => a + b, 0);
  if (remainder < 0 || remainder > participants.length) {
    throw new SplitError(
      `internal: remainder ${remainder} outside [0, ${participants.length}]`,
      'INTERNAL',
    );
  }
  const order = raw
    .map((r, i) => ({ i, frac: r - (floors[i] ?? 0) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  const result = [...floors];
  for (let k = 0; k < remainder; k++) {
    const slot = order[k];
    if (!slot) throw new SplitError('internal: allocation slot missing', 'INTERNAL');
    result[slot.i] = (result[slot.i] ?? 0) + 1;
  }

  return participants.map((p, i) => ({ memberId: p.memberId, amountMinor: result[i] ?? 0 }));
}
