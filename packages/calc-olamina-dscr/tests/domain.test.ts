// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { computeDscr, monthlyPayment, validateDscrInputs } from '../src/domain';
import { getKitPrice, findModel } from '../src/models';
import { fixtures } from './fixtures';

const CURRENCY_EPSILON = 2;
const PITIA_EPSILON = -1;
const RENT_EPSILON = -1;

describe('monthlyPayment (independent port from LGS per KTD #4)', () => {
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

describe('getKitPrice (Olamina-specific addon, KTD #4)', () => {
  it('returns kitPlus when tier="plus" and kitPlus is set', () => {
    const m = findModel('birmingham');
    expect(m).toBeTruthy();
    expect(getKitPrice(m!, 'plus')).toBe(235_000);
  });

  it('returns kitMax when tier="max"', () => {
    const m = findModel('birmingham');
    expect(getKitPrice(m!, 'max')).toBe(280_000);
  });

  it('falls back to kitMax when tier="plus" is null (otium)', () => {
    const m = findModel('otium');
    expect(m!.kitPlus).toBeNull();
    expect(getKitPrice(m!, 'plus')).toBe(232_000); // kitMax
  });

  it('falls back to kitPlus when tier="max" is null (none in current catalog, theoretical)', () => {
    // Build a synthetic model where Max is null
    const synthetic = { ...findModel('birmingham')!, kitMax: null };
    expect(getKitPrice(synthetic, 'max')).toBe(235_000);
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
  it('rejects empty homes array', () => {
    const r = computeDscr({ ...fixtures[0]!.input, homes: [] });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors).toHaveProperty('homes');
  });

  it('rejects unknown modelId', () => {
    const r = computeDscr({ ...fixtures[0]!.input, homes: [{ modelId: 'no_such' }] });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors).toHaveProperty('homes');
  });

  it('rejects invalid kitTier', () => {
    const r = computeDscr({
      ...fixtures[0]!.input,
      kitTier: 'invalid' as never,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors).toHaveProperty('kitTier');
  });

  it('honors per-home buildOverride', () => {
    const r = computeDscr({
      ...fixtures[0]!.input,
      homes: [{ modelId: 'birmingham', buildOverride: 99_999 }],
      infraTotal: 0,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.result.totals.build).toBe(99_999);
  });

  it('rentNeeded = pitia × dscrTarget per home', () => {
    const r = computeDscr({
      ...fixtures[0]!.input,
      homes: [{ modelId: 'birmingham' }],
      infraTotal: 0,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const home = r.result.perHome[0]!;
    expect(home.rentNeeded).toBeCloseTo(home.pitia * 1.25, 4);
  });
});

describe('validateDscrInputs', () => {
  it('accepts default canonical input', () => {
    expect(validateDscrInputs(fixtures[0]!.input)).toEqual({});
  });

  it('rejects negative discountPct', () => {
    const errors = validateDscrInputs({ ...fixtures[0]!.input, discountPct: -1 });
    expect(errors.discountPct).toBeTruthy();
  });
});
