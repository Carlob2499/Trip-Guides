import { describe, expect, it } from 'vitest';
import { computeSplits, formatMinor, SplitError, type SplitParticipant } from './money';

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
    expect(() => formatMinor(100, 'XYZ')).toThrowError(/unknown currency/);
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
    expect(() => computeSplits(100, 'PERCENTAGE', [p('a', 60), p('b', 30)])).toThrowError(
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
    ).toThrowError(/sum to 86999, expected 87000/);
  });

  it('rejects non-integer exact weights', () => {
    expect(() => computeSplits(100, 'EXACT', [p('a', 50.5), p('b', 49.5)])).toThrowError(
      SplitError,
    );
  });
});

describe('computeSplits — input validation', () => {
  it('rejects a negative total', () => {
    expect(() => computeSplits(-1, 'EQUAL', [p('a')])).toThrowError(SplitError);
  });

  it('rejects a non-integer total', () => {
    expect(() => computeSplits(10.5, 'EQUAL', [p('a')])).toThrowError(SplitError);
  });

  it('rejects an empty participant list', () => {
    expect(() => computeSplits(100, 'EQUAL', [])).toThrowError(SplitError);
  });

  it('rejects duplicate members', () => {
    expect(() => computeSplits(100, 'EQUAL', [p('a'), p('a')])).toThrowError(SplitError);
  });

  it('rejects missing weights for weighted methods', () => {
    expect(() => computeSplits(100, 'SHARES', [p('a'), p('b', 1)])).toThrowError(SplitError);
  });

  it('rejects all-zero weights', () => {
    expect(() => computeSplits(100, 'SHARES', [p('a', 0), p('b', 0)])).toThrowError(
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

describe('computeSplits — determinism', () => {
  it('returns identical output for identical input', () => {
    const participants = [p('a', 3), p('b', 3), p('c', 3)];
    const first = computeSplits(10001, 'SHARES', participants);
    const second = computeSplits(10001, 'SHARES', participants);
    expect(first).toEqual(second);
  });
});
