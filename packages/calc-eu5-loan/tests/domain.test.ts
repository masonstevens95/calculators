// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  computeEu5,
  sumFactors,
  calcIncome,
  monthlyBaseFromProfit3yr,
  validateEu5Inputs,
} from '../src/domain';
import { fixtures } from './fixtures';

const EPS = 2;

describe('sumFactors', () => {
  it('sums to N when there is no growth', () => {
    expect(sumFactors(1.0, 12)).toBeCloseTo(12, 6);
    expect(sumFactors(1.0, 36)).toBeCloseTo(36, 6);
  });

  it('returns 0 for non-positive total months', () => {
    expect(sumFactors(1.05, 0)).toBe(0);
    expect(sumFactors(1.05, -10)).toBe(0);
  });

  it('grows at the expected pace at 5% annual compounding', () => {
    // Year 1: 12 (factor 1)
    // Year 2: 12 * 1.05 = 12.6
    // Year 3: 12 * 1.05^2 = 13.23
    // Total over 36mo = 12 + 12.6 + 13.23 = 37.83
    expect(sumFactors(1.05, 36)).toBeCloseTo(37.83, 2);
  });
});

describe('calcIncome', () => {
  it('equals monthlyBase × sumFactors', () => {
    const sf = sumFactors(1.05, 60);
    expect(calcIncome(2.5, 1.05, 60)).toBeCloseTo(2.5 * sf, 6);
  });

  it('returns 0 for zero monthly base', () => {
    expect(calcIncome(0, 1.05, 60)).toBe(0);
  });
});

describe('monthlyBaseFromProfit3yr', () => {
  it('inverts back to a positive monthly base for positive profit3yr', () => {
    expect(monthlyBaseFromProfit3yr(50, 1.05)).toBeCloseTo(50 / sumFactors(1.05, 36), 6);
  });

  it('returns 0 for zero or negative profit', () => {
    expect(monthlyBaseFromProfit3yr(0, 1.05)).toBe(0);
    expect(monthlyBaseFromProfit3yr(-1, 1.05)).toBe(0);
  });
});

describe('computeEu5 (fixture-driven, AE3 coverage)', () => {
  for (const fixture of fixtures) {
    it(fixture.name, () => {
      const result = computeEu5(fixture.input);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const r = result.result;
      const e = fixture.expected;

      expect(r.loanInterest).toBeCloseTo(e.loanInterest, EPS);
      expect(r.usableCapital).toBeCloseTo(e.usableCapital, EPS);
      expect(r.realCost).toBeCloseTo(e.realCost, EPS);
      expect(r.effectiveRatePct).toBeCloseTo(e.effectiveRatePct, EPS);
      expect(r.effectiveInterest).toBeCloseTo(e.effectiveInterest, EPS);
      expect(r.monthlyBase).toBeCloseTo(e.monthlyBase, 1);
      expect(r.breakEvenMin).toBeCloseTo(e.breakEvenMin, EPS);
      expect(r.horizonTable).toHaveLength(e.horizonTableLength);
    });
  }
});

describe('computeEu5 derived metrics', () => {
  it('verdict: no-input when profit3yr=0', () => {
    const r = computeEu5({ ...fixtures[0]!.input, profit3yr: 0 });
    expect(r.ok && r.result.verdict).toBe('no-input');
  });

  it('verdict: strong when income ≥ 3× breakEven', () => {
    const r = computeEu5({ ...fixtures[0]!.input, profit3yr: 1000 });
    expect(r.ok && r.result.verdict).toBe('strong');
  });

  it('verdict: viable when income ≥ breakEven', () => {
    // breakEven = 100/60 ≈ 1.667/mo. Need monthlyBase between 1.667 and 5
    // monthlyBase ≈ profit3yr/37.83. Pick profit3yr ≈ 80 → base ≈ 2.11
    const r = computeEu5({ ...fixtures[0]!.input, profit3yr: 80 });
    expect(r.ok && r.result.verdict).toBe('viable');
  });

  it('verdict: not-worth-it when income << breakEven', () => {
    // monthlyBase << 0.83 (half of 1.667). Pick profit3yr=20 → base=0.529
    const r = computeEu5({ ...fixtures[0]!.input, profit3yr: 20 });
    expect(r.ok && r.result.verdict).toBe('not-worth-it');
  });

  it('horizonTable rows include all five horizons in order', () => {
    const r = computeEu5(fixtures[0]!.input);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.result.horizonTable.map((h) => h.months)).toEqual([12, 24, 60, 120, 240]);
  });

  it('payback is 0 when effectiveInterest is 0 (no rate, no gift)', () => {
    const r = computeEu5({ ...fixtures[0]!.input, ratePct: 0 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.result.paybackMonths).toBe(0);
  });

  it('borrowBetter is true when borrowNet > waitNet', () => {
    // Strong income → borrowing dominates
    const r = computeEu5({ ...fixtures[0]!.input, profit3yr: 1000 });
    expect(r.ok && r.result.borrowBetter).toBe(true);
  });
});

describe('validateEu5Inputs', () => {
  it('accepts default canonical input', () => {
    expect(validateEu5Inputs(fixtures[0]!.input)).toEqual({});
  });

  it('rejects negative cost', () => {
    expect(validateEu5Inputs({ ...fixtures[0]!.input, cost: -1 }).cost).toBeTruthy();
  });

  it('rejects months=0', () => {
    expect(validateEu5Inputs({ ...fixtures[0]!.input, months: 0 }).months).toBeTruthy();
  });

  it('rejects invalid rateType', () => {
    expect(
      validateEu5Inputs({ ...fixtures[0]!.input, rateType: 'bogus' as never }).rateType,
    ).toBeTruthy();
  });
});
