// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  computeDscr,
  monthlyPayment,
  validateDscrInputs,
} from '../src/domain';
import { fixtures } from './fixtures';

const CURRENCY_EPSILON = 2; // $0.005
// PITIA at 7+ homes can drift ~$1 cumulatively due to (1+r)^n; use $5 tolerance.
const PITIA_EPSILON = -1;
const RENT_EPSILON = -1;

describe('monthlyPayment', () => {
  it('matches the textbook 30-year mortgage formula at 6% on $100k', () => {
    expect(monthlyPayment(100_000, 6, 30)).toBeCloseTo(599.55, 2);
  });

  it('degenerates to principal/months at 0% rate', () => {
    expect(monthlyPayment(360_000, 0, 30)).toBeCloseTo(1000, 4);
  });

  it('returns 0 for non-positive principal', () => {
    expect(monthlyPayment(0, 7, 30)).toBe(0);
    expect(monthlyPayment(-1, 7, 30)).toBe(0);
  });
});

describe('computeDscr (fixture-driven, AE3 coverage)', () => {
  for (const fixture of fixtures) {
    it(fixture.name, () => {
      const result = computeDscr(fixture.input);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const { result: r } = result;
      const e = fixture.expected;

      expect(r.perHome).toHaveLength(e.perHomeCount);
      expect(r.totals.sqft).toBe(e.sqftTotal);
      expect(r.totals.kit).toBeCloseTo(e.kitTotal, CURRENCY_EPSILON);
      expect(r.totals.build).toBeCloseTo(e.buildTotal, CURRENCY_EPSILON);
      expect(r.totals.totalCost).toBeCloseTo(e.totalCost, CURRENCY_EPSILON);
      expect(r.totals.down).toBeCloseTo(e.downTotal, CURRENCY_EPSILON);
      expect(r.totals.pitia).toBeCloseTo(e.pitiaTotal, PITIA_EPSILON);
      expect(r.totals.rent).toBeCloseTo(e.rentTotal, RENT_EPSILON);

      expect(r.summary.avgRentPerHome).toBeCloseTo(e.avgRentPerHome, RENT_EPSILON);
      expect(r.summary.annualRent).toBeCloseTo(e.annualRent, RENT_EPSILON);
      expect(r.summary.kitBeforeDiscount).toBeCloseTo(e.kitBeforeDiscount, CURRENCY_EPSILON);
      expect(r.summary.discountSavings).toBeCloseTo(e.discountSavings, CURRENCY_EPSILON);
      expect(r.summary.ltvPct).toBeCloseTo(e.ltvPct, CURRENCY_EPSILON);

      expect(r.cash.loanAmount).toBeCloseTo(e.loanAmount, CURRENCY_EPSILON);
      expect(r.cash.origCost).toBeCloseTo(e.origCost, CURRENCY_EPSILON);
      expect(r.cash.totalClosing).toBeCloseTo(e.totalClosing, CURRENCY_EPSILON);
      expect(r.cash.reserves).toBeCloseTo(e.reserves, RENT_EPSILON);
      expect(r.cash.totalCashNeeded).toBeCloseTo(e.totalCashNeeded, RENT_EPSILON);
    });
  }
});

describe('computeDscr edge cases', () => {
  it('returns a typed error for empty homes array', () => {
    const result = computeDscr({
      ...fixtures[0]!.input,
      homes: [],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveProperty('homes');
  });

  it('returns a typed error for unknown modelId', () => {
    const result = computeDscr({
      ...fixtures[0]!.input,
      homes: [{ modelId: 'no_such_model' }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveProperty('homes');
  });

  it('treats negative numeric input as a typed validation error', () => {
    const result = computeDscr({
      ...fixtures[0]!.input,
      ratePct: -1,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveProperty('ratePct');
  });

  it('treats NaN as a typed validation error', () => {
    const result = computeDscr({
      ...fixtures[0]!.input,
      dscrTarget: Number.NaN,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveProperty('dscrTarget');
  });

  it('honors per-home buildOverride when supplied', () => {
    const inputs = {
      ...fixtures[0]!.input,
      homes: [{ modelId: 'cumberland', buildOverride: 50_000 }],
      infraTotal: 0,
    };
    const result = computeDscr(inputs);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.totals.build).toBe(50_000);
  });

  it('rentNeededPerHome equals home pitia × dscrTarget', () => {
    const result = computeDscr({
      ...fixtures[0]!.input,
      homes: [{ modelId: 'cumberland' }],
      infraTotal: 0,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const home = result.result.perHome[0]!;
    expect(home.rentNeeded).toBeCloseTo(home.pitia * 1.25, 4);
  });
});

describe('validateDscrInputs', () => {
  it('accepts the canonical default input', () => {
    expect(validateDscrInputs(fixtures[0]!.input)).toEqual({});
  });

  it('rejects negative ratePct', () => {
    const errors = validateDscrInputs({ ...fixtures[0]!.input, ratePct: -0.1 });
    expect(errors.ratePct).toBeTruthy();
  });

  it('rejects empty homes', () => {
    const errors = validateDscrInputs({ ...fixtures[0]!.input, homes: [] });
    expect(errors.homes).toBeTruthy();
  });

  it('accepts boundary dscrTarget = 1', () => {
    const errors = validateDscrInputs({ ...fixtures[0]!.input, dscrTarget: 1 });
    expect(errors).toEqual({});
  });
});
