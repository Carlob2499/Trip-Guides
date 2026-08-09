// @protects-file Money is stored and split in whole minor units, so nothing is lost to rounding.

import { describe, expect, it } from 'vitest';
import { computeSplits, formatMinor, SplitError, toBaseMinor, type SplitParticipant } from './money';

describe('toBaseMinor', () => {
  it('converts won to cents at the guide rate', () => {
    // ₩45,000 at ₩1,444 = $1 → $31.16
    expect(toBaseMinor(45_000, 'KRW', 1444)).toBe(3116);
  });

  it('handles a two-decimal foreign currency', () => {
    // 625.50 DKK at 6.9 DKK = $1 → $90.65
    expect(toBaseMinor(62_550, 'DKK', 6.9)).toBe(9065);
  });

  it('passes a base-currency amount straight through, rate or no rate', () => {
    expect(toBaseMinor(9640, 'USD', null)).toBe(9640);
    expect(toBaseMinor(9640, 'USD', 1444)).toBe(9640);
  });

  it('refuses to invent a number when the rate is missing or nonsense', () => {
    expect(toBaseMinor(45_000, 'KRW', null)).toBeNull();
    expect(toBaseMinor(45_000, 'KRW', 0)).toBeNull();
    expect(toBaseMinor(45_000, 'KRW', -3)).toBeNull();
    expect(toBaseMinor(45_000, 'KRW', Infinity)).toBeNull();
  });

  it('refuses an unknown currency rather than guessing its decimal places', () => {
    expect(toBaseMinor(1000, 'XYZ', 2)).toBeNull();
  });

  it('rejects a non-integer amount — minor units are whole by definition', () => {
    expect(toBaseMinor(1000.5, 'KRW', 1444)).toBeNull();
  });

  it('rounds to the nearest cent rather than truncating', () => {
    // ₩1 at ₩1,444 = $1 is $0.000692… → rounds to 0 cents, not a fractional cent.
    expect(toBaseMinor(1, 'KRW', 1444)).toBe(0);
    // ₩8 → $0.00554 → 1 cent.
    expect(toBaseMinor(8, 'KRW', 1444)).toBe(1);
  });
});

describe('formatMinor', () => {
  it('respects zero-decimal currencies (KRW minor unit = won)', () => {
    const s = formatMinor(45_000, 'KRW');
    expect(s).toContain('45,000');
    expect(s).not.toContain('.');
  });

  it('respects two-decimal currencies (DKK minor unit = øre)', () => {
    expect(formatMinor(62_550, 'DKK')).toContain('625.50');
    expect(formatMinor(4_500, 'EUR')).toContain('45.00');
  });

  it('fails loudly on unknown currencies instead of guessing the exponent', () => {
    expect(() => formatMinor(100, 'XYZ')).toThrow(/unknown currency/);
  });
});

const p = (memberId: string, weight?: number): SplitParticipant => ({ memberId, weight });
const sumOf = (splits: { amountMinor: number }[]) =>
  splits.reduce((a, s) => a + s.amountMinor, 0);

describe('computeSplits — EQUAL', () => {
  it('splits an indivisible amount deterministically (10000 / 3)', () => {
    const splits = computeSplits(10000, 'EQUAL', [p('a'), p('b'), p('c')]);
    expect(splits).toEqual([
      { memberId: 'a', amountMinor: 3334 },
      { memberId: 'b', amountMinor: 3333 },
      { memberId: 'c', amountMinor: 3333 },
    ]);
  });

  it('splits a divisible amount evenly (13500 / 3)', () => {
    const splits = computeSplits(13500, 'EQUAL', [p('a'), p('b'), p('c')]);
    expect(splits.map((s) => s.amountMinor)).toEqual([4500, 4500, 4500]);
  });

  it('always sums exactly to the total (invariant sweep)', () => {
    const amounts = [0, 1, 2, 3, 10, 99, 100, 101, 9999, 45000, 62550, 1234567];
    for (const amount of amounts) {
      for (let n = 1; n <= 5; n++) {
        const participants = Array.from({ length: n }, (_, i) => p(`m${i}`));
        expect(sumOf(computeSplits(amount, 'EQUAL', participants))).toBe(amount);
      }
    }
  });
});

describe('computeSplits — SHARES', () => {
  it('splits 45000 KRW by 2/1/1 shares', () => {
    const splits = computeSplits(45000, 'SHARES', [p('a', 2), p('b', 1), p('c', 1)]);
    expect(splits.map((s) => s.amountMinor)).toEqual([22500, 11250, 11250]);
  });

  it('sums exactly with awkward share ratios', () => {
    const splits = computeSplits(1000, 'SHARES', [p('a', 3), p('b', 7), p('c', 11)]);
    expect(sumOf(splits)).toBe(1000);
  });
});

describe('computeSplits — PERCENTAGE', () => {
  it('splits 62550 øre 60/40', () => {
    const splits = computeSplits(62550, 'PERCENTAGE', [p('a', 60), p('b', 40)]);
    expect(splits.map((s) => s.amountMinor)).toEqual([37530, 25020]);
  });

  it('handles fractional percentages and still sums exactly', () => {
    const splits = computeSplits(100, 'PERCENTAGE', [
      p('a', 33.33),
      p('b', 33.33),
      p('c', 33.34),
    ]);
    expect(sumOf(splits)).toBe(100);
  });

  it('rejects percentages that do not sum to 100', () => {
    expect(() => computeSplits(100, 'PERCENTAGE', [p('a', 60), p('b', 30)])).toThrow(
      SplitError,
    );
  });
});

describe('computeSplits — EXACT', () => {
  it('passes through exact minor-unit amounts', () => {
    const splits = computeSplits(87000, 'EXACT', [
      p('a', 40000),
      p('b', 27000),
      p('c', 20000),
    ]);
    expect(splits.map((s) => s.amountMinor)).toEqual([40000, 27000, 20000]);
  });

  it('rejects exact amounts that do not sum to the total', () => {
    expect(() =>
      computeSplits(87000, 'EXACT', [p('a', 40000), p('b', 27000), p('c', 19999)]),
    ).toThrow(/sum to 86999, expected 87000/);
  });

  it('rejects non-integer exact weights', () => {
    expect(() => computeSplits(100, 'EXACT', [p('a', 50.5), p('b', 49.5)])).toThrow(
      SplitError,
    );
  });
});

describe('computeSplits — input validation', () => {
  it('rejects a negative total', () => {
    expect(() => computeSplits(-1, 'EQUAL', [p('a')])).toThrow(SplitError);
  });

  it('rejects a non-integer total', () => {
    expect(() => computeSplits(10.5, 'EQUAL', [p('a')])).toThrow(SplitError);
  });

  it('rejects an empty participant list', () => {
    expect(() => computeSplits(100, 'EQUAL', [])).toThrow(SplitError);
  });

  it('rejects duplicate members', () => {
    expect(() => computeSplits(100, 'EQUAL', [p('a'), p('a')])).toThrow(SplitError);
  });

  it('rejects missing weights for weighted methods', () => {
    expect(() => computeSplits(100, 'SHARES', [p('a'), p('b', 1)])).toThrow(SplitError);
  });

  it('rejects all-zero weights', () => {
    expect(() => computeSplits(100, 'SHARES', [p('a', 0), p('b', 0)])).toThrow(
      SplitError,
    );
  });

  it('exposes a machine-readable error code', () => {
    try {
      computeSplits(100, 'PERCENTAGE', [p('a', 50)]);
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(SplitError);
      expect((e as SplitError).code).toBe('SUM_MISMATCH');
    }
  });
});

describe('computeSplits — who gets the leftover cent', () => {
  /* Mutation testing found the tie-break untested: reversing the sort, or dropping the
     index tie-break entirely, changed nobody's total and broke no test. It decides which
     real person is charged the extra cent, and it must be the same person every time —
     otherwise a re-render silently moves a penny between two people's balances. */
  it('hands the leftover to the largest remainder, not to whoever happens to be first', () => {
    // weights 1:2:3 of 10 → raw 1.667 / 3.333 / 5.0, floors 1/3/5 = 9, one cent spare.
    // The biggest fraction is 'a' at .667, so 'a' takes it.
    expect(computeSplits(10, 'SHARES', [p('a', 1), p('b', 2), p('c', 3)]).map((s) => s.amountMinor))
      .toEqual([2, 3, 5]);
  });

  it('breaks an exact tie by input order, so the same person pays it every time', () => {
    // Two equal shares of 3 → both remainders are exactly .5. Nothing distinguishes them
    // but position, and position must win consistently rather than by sort stability.
    expect(computeSplits(3, 'EQUAL', [p('a'), p('b')]).map((s) => s.amountMinor)).toEqual([2, 1]);
    expect(computeSplits(5, 'EQUAL', [p('a'), p('b'), p('c')]).map((s) => s.amountMinor)).toEqual([2, 2, 1]);
  });
});

describe('computeSplits — determinism', () => {
  it('returns identical output for identical input', () => {
    const participants = [p('a', 3), p('b', 3), p('c', 3)];
    const first = computeSplits(10001, 'SHARES', participants);
    const second = computeSplits(10001, 'SHARES', participants);
    expect(first).toEqual(second);
  });
});
