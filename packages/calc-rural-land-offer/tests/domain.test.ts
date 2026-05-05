// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  computeOffer,
  monthlyPayment,
  netProceedsCalc,
  concessionLimit,
  validateOfferInputs,
} from '../src/domain';
import { fixtures } from './fixtures';

// `toBeCloseTo(expected, n)` allows a difference < 10^-n / 2.
//   CURRENCY_EPSILON = 2 → tolerance $0.005 (cents-level for whole-dollar fields)
//   MONTHLY_EPSILON  = 0 → tolerance $0.50 (PMT involves (1+r)^n, sub-dollar drift OK)
const CURRENCY_EPSILON = 2;
const MONTHLY_EPSILON = 0;

describe('monthlyPayment', () => {
  it('matches the textbook 30-year mortgage formula at 6% on $100k', () => {
    // Industry-standard textbook value: $599.55/mo
    expect(monthlyPayment(100_000, 6, 30)).toBeCloseTo(599.55, 2);
  });

  it('degenerates to principal/months when rate is 0', () => {
    expect(monthlyPayment(311_250, 0, 30)).toBeCloseTo(311_250 / 360, 4);
  });

  it('returns 0 when principal is 0', () => {
    expect(monthlyPayment(0, 6.75, 30)).toBe(0);
  });

  it('returns 0 when principal is negative (defensive)', () => {
    expect(monthlyPayment(-100, 6.75, 30)).toBe(0);
  });
});

describe('netProceedsCalc', () => {
  it('matches the HTML default: $97,400 for the canonical sale fixture', () => {
    expect(netProceedsCalc(280_000, 163_000, 6, 1)).toBeCloseTo(97_400, CURRENCY_EPSILON);
  });

  it('returns 0 when sale equals payoff and no costs', () => {
    expect(netProceedsCalc(100_000, 100_000, 0, 0)).toBe(0);
  });
});

describe('concessionLimit (conventional-loan brackets)', () => {
  it('returns 9% for LTV ≤ 75', () => {
    expect(concessionLimit(0)).toBe(9);
    expect(concessionLimit(50)).toBe(9);
    expect(concessionLimit(75)).toBe(9);
  });

  it('returns 6% for LTV 75 < x ≤ 80', () => {
    expect(concessionLimit(75.01)).toBe(6);
    expect(concessionLimit(80)).toBe(6);
  });

  it('returns 3% for LTV > 80', () => {
    expect(concessionLimit(80.01)).toBe(3);
    expect(concessionLimit(95)).toBe(3);
    expect(concessionLimit(100)).toBe(3);
  });
});

describe('computeOffer (fixture-driven, AE3 coverage)', () => {
  for (const fixture of fixtures) {
    it(fixture.name, () => {
      const result = computeOffer(fixture.input);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const { result: r } = result;
      const e = fixture.expected;
      expect(r.netProceeds).toBeCloseTo(e.netProceeds, CURRENCY_EPSILON);
      expect(r.downAmt).toBeCloseTo(e.downAmt, CURRENCY_EPSILON);
      expect(r.loan).toBeCloseTo(e.loan, CURRENCY_EPSILON);
      expect(r.ltvPct).toBeCloseTo(e.ltvPct, CURRENCY_EPSILON);
      expect(r.pi).toBeCloseTo(e.pi, MONTHLY_EPSILON);
      expect(r.tax).toBeCloseTo(e.tax, CURRENCY_EPSILON);
      expect(r.ins).toBeCloseTo(e.ins, CURRENCY_EPSILON);
      expect(r.pmiMo).toBeCloseTo(e.pmiMo, MONTHLY_EPSILON);
      expect(r.piti).toBeCloseTo(e.piti, MONTHLY_EPSILON);
      expect(r.concession).toBeCloseTo(e.concession, CURRENCY_EPSILON);
      expect(r.closingAmt).toBeCloseTo(e.closingAmt, CURRENCY_EPSILON);
      expect(r.repairCash).toBeCloseTo(e.repairCash, CURRENCY_EPSILON);
      expect(r.afterDown).toBeCloseTo(e.afterDown, CURRENCY_EPSILON);
      expect(r.totalCash).toBeCloseTo(e.totalCash, CURRENCY_EPSILON);
      expect(r.reserve).toBeCloseTo(e.reserve, CURRENCY_EPSILON);
      expect(r.concessionLimitPct).toBe(e.concessionLimitPct);
    });
  }
});

describe('computeOffer edge cases', () => {
  it('does not produce NaN for the all-zero scenario', () => {
    const allZero = fixtures.find((f) => f.name.startsWith('All-zero'));
    if (!allZero) throw new Error('all-zero fixture missing');
    const result = computeOffer(allZero.input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const [key, value] of Object.entries(result.result)) {
      expect(Number.isFinite(value), `${key} should be finite`).toBe(true);
    }
  });

  it('treats negative numeric inputs as a typed validation error, not a throw', () => {
    const result = computeOffer({
      ...fixtures[0]!.input,
      offerPrice: -1,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveProperty('offerPrice');
  });

  it('treats non-finite inputs as a typed validation error', () => {
    const result = computeOffer({
      ...fixtures[0]!.input,
      ratePct: Number.NaN,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveProperty('ratePct');
  });
});

describe('validateOfferInputs', () => {
  it('accepts the canonical default input', () => {
    expect(validateOfferInputs(fixtures[0]!.input)).toEqual({});
  });

  it('rejects negative offerPrice with a deterministic message', () => {
    const errors = validateOfferInputs({ ...fixtures[0]!.input, offerPrice: -1 });
    expect(errors.offerPrice).toBeTruthy();
  });

  it('rejects NaN downPct', () => {
    const errors = validateOfferInputs({ ...fixtures[0]!.input, downPct: Number.NaN });
    expect(errors.downPct).toBeTruthy();
  });

  it('accepts boundary 0 for percentage fields', () => {
    const errors = validateOfferInputs({
      ...fixtures[0]!.input,
      concPct: 0,
      taxRatePct: 0,
      insRatePct: 0,
      transferPct: 0,
    });
    expect(errors).toEqual({});
  });
});
