// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  computeRentSell,
  monthlyCashflow,
  breakEvenRent,
  remainingBalance,
  fixedCarryingCost,
  solveBreakevenSalePrice,
  validateRentSellInputs,
} from '../src/domain';
import type { RentSellInputs } from '../src/domain';
import { RENT_SELL_INITIAL_INPUTS } from '../src/constants';

const DOLLAR = 2;

const DEFAULTS: RentSellInputs = { ...RENT_SELL_INITIAL_INPUTS };

describe('fixedCarryingCost', () => {
  it('sums P+I + taxes + insurance + 1% maintenance/12', () => {
    // 826 + 280 + 275 + (0.01 * 305000 / 12) = 1381 + 254.17 ≈ 1635.17
    const expected = 826 + 280 + 275 + (0.01 * 305_000) / 12;
    expect(fixedCarryingCost(DEFAULTS)).toBeCloseTo(expected, DOLLAR);
  });
});

describe('monthlyCashflow', () => {
  it('at $2000 self-managed: rent − fixed − vacancy − accounting', () => {
    const cf = monthlyCashflow(DEFAULTS);
    const expected = 2000 - fixedCarryingCost(DEFAULTS) - 0.08 * 2000 - 200 / 12;
    expect(cf).toBeCloseTo(expected, DOLLAR);
  });

  it('at $2000 managed: subtracts mgmt fee additionally', () => {
    const cf = monthlyCashflow({ ...DEFAULTS, managed: true });
    const expected = 2000 - fixedCarryingCost(DEFAULTS) - 0.09 * 2000 - 0.08 * 2000 - 200 / 12;
    expect(cf).toBeCloseTo(expected, DOLLAR);
  });
});

describe('breakEvenRent', () => {
  it('self-managed: (fixed + accounting/12) / 0.92', () => {
    const fixed = fixedCarryingCost(DEFAULTS) + 200 / 12;
    expect(breakEvenRent(DEFAULTS)).toBeCloseTo(fixed / 0.92, DOLLAR);
  });

  it('managed: (fixed + accounting/12) / 0.83', () => {
    const fixed = fixedCarryingCost(DEFAULTS) + 200 / 12;
    expect(breakEvenRent({ ...DEFAULTS, managed: true })).toBeCloseTo(fixed / 0.83, DOLLAR);
  });
});

describe('remainingBalance', () => {
  it('returns the original balance at month 0', () => {
    expect(remainingBalance(0, DEFAULTS)).toBe(DEFAULTS.mortgageBalance);
  });

  it('decreases monotonically', () => {
    const b6 = remainingBalance(6, DEFAULTS);
    const b12 = remainingBalance(12, DEFAULTS);
    const b24 = remainingBalance(24, DEFAULTS);
    expect(b6).toBeLessThan(DEFAULTS.mortgageBalance);
    expect(b12).toBeLessThan(b6);
    expect(b24).toBeLessThan(b12);
  });

  it('is non-negative even at large month counts', () => {
    expect(remainingBalance(360, DEFAULTS)).toBeGreaterThanOrEqual(0);
    expect(remainingBalance(1000, DEFAULTS)).toBe(0);
  });
});

describe('computeRentSell (default scenario)', () => {
  it('returns ok with the canonical default input', () => {
    expect(computeRentSell(DEFAULTS).ok).toBe(true);
  });

  it('cashflow chart spans rent 1200..3200 in $50 steps (41 points)', () => {
    const r = computeRentSell(DEFAULTS);
    expect(r.ok && r.result.cashflowVsRent).toHaveLength(41);
    if (!r.ok) return;
    expect(r.result.cashflowVsRent[0]!.rent).toBe(1200);
    expect(r.result.cashflowVsRent[r.result.cashflowVsRent.length - 1]!.rent).toBe(3200);
  });

  it('wealth chart spans years 0..holdingYears', () => {
    const r = computeRentSell(DEFAULTS);
    expect(r.ok && r.result.wealthOverTime).toHaveLength(DEFAULTS.holdingYears + 1);
    if (!r.ok) return;
    expect(r.result.wealthOverTime[0]!.year).toBe(0);
    expect(r.result.wealthOverTime[DEFAULTS.holdingYears]!.year).toBe(DEFAULTS.holdingYears);
  });

  it('sensitivity sweep covers 0%..7% appreciation (8 points)', () => {
    const r = computeRentSell(DEFAULTS);
    expect(r.ok && r.result.sensitivity).toHaveLength(8);
    if (!r.ok) return;
    expect(r.result.sensitivity.map((s) => s.appRatePct)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('sensitivity is monotone increasing in appRate (higher appreciation favors renting)', () => {
    const r = computeRentSell(DEFAULTS);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const deltas = r.result.sensitivity.map((s) => s.rentMinusSellAtN);
    for (let i = 1; i < deltas.length; i++) {
      expect(deltas[i]).toBeGreaterThan(deltas[i - 1]!);
    }
  });

  it('sellBeatsRent reflects sellMinusRentAtN sign', () => {
    const r = computeRentSell(DEFAULTS);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.result.sellBeatsRent).toBe(r.result.sellMinusRentAtN > 0);
  });
});

describe('solveBreakevenSalePrice', () => {
  it('returns a finite price within the search range for default inputs', () => {
    const price = solveBreakevenSalePrice(DEFAULTS);
    expect(price).not.toBeNull();
    if (price == null) return;
    expect(price).toBeGreaterThan(50_000);
    expect(price).toBeLessThan(2_000_000);
  });

  it('at the breakeven price, sellWealth ≈ rentWealth', () => {
    const breakeven = solveBreakevenSalePrice(DEFAULTS);
    expect(breakeven).not.toBeNull();
    if (breakeven == null) return;
    const r = computeRentSell({ ...DEFAULTS, salePrice: breakeven });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Diff at breakeven should be small relative to wealth magnitudes
    const last = r.result.wealthOverTime[r.result.wealthOverTime.length - 1]!;
    const magnitude = Math.max(Math.abs(last.sellWealth), Math.abs(last.rentWealth), 1);
    expect(Math.abs(r.result.sellMinusRentAtN) / magnitude).toBeLessThan(0.01);
  });
});

describe('Section 121 timeline', () => {
  it('safe when moveout is 3+ years from current year', () => {
    const r = computeRentSell(DEFAULTS); // moveoutYear 2026, currentYear 2026
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.result.section121.urgency).toBe('safe');
  });

  it('critical when yearsLeft ≤ 1', () => {
    const r = computeRentSell({ ...DEFAULTS, moveoutYear: 2024 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.result.section121.urgency).toBe('critical');
  });

  it('warning when yearsLeft is 2', () => {
    const r = computeRentSell({ ...DEFAULTS, moveoutYear: 2025 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.result.section121.urgency).toBe('warning');
  });
});

describe('validateRentSellInputs', () => {
  it('accepts the canonical default input', () => {
    expect(validateRentSellInputs(DEFAULTS)).toEqual({});
  });

  it('rejects negative rent', () => {
    expect(validateRentSellInputs({ ...DEFAULTS, rent: -100 }).rent).toBeTruthy();
  });

  it('rejects NaN appRatePct', () => {
    expect(validateRentSellInputs({ ...DEFAULTS, appRatePct: Number.NaN }).appRatePct).toBeTruthy();
  });

  it('rejects zero or negative salePrice', () => {
    expect(validateRentSellInputs({ ...DEFAULTS, salePrice: 0 }).salePrice).toBeTruthy();
    expect(validateRentSellInputs({ ...DEFAULTS, salePrice: -1 }).salePrice).toBeTruthy();
  });

  it('rejects invalid s121 mode', () => {
    // @ts-expect-error — testing runtime guard for bad union value
    expect(validateRentSellInputs({ ...DEFAULTS, s121: 'family' }).s121).toBeTruthy();
  });
});
