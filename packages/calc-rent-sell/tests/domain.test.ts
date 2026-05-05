// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  computeRentSell,
  monthlyCashflow,
  breakEvenRent,
  remainingBalance,
  fixedCarryingCost,
  validateRentSellInputs,
} from '../src/domain';
import { RENT_SELL_DEFAULTS } from '../src/constants';

const DOLLAR = 2;

describe('fixedCarryingCost', () => {
  it('matches the HTML constant: $1,635/mo', () => {
    expect(fixedCarryingCost()).toBeCloseTo(825.74 + 280 + 275 + 254, DOLLAR);
  });
});

describe('monthlyCashflow', () => {
  it('at $2000 self-managed: rent − fixed − vacancy', () => {
    const cf = monthlyCashflow(2000, false);
    // 2000 - 1634.74 - 160 = 205.26
    expect(cf).toBeCloseTo(2000 - fixedCarryingCost() - 160, DOLLAR);
  });

  it('at $2000 managed: subtracts mgmt fee additionally', () => {
    const cf = monthlyCashflow(2000, true);
    // 2000 - fixed - 9% - 8% = 2000 - 1634.74 - 180 - 160 = 25.26
    expect(cf).toBeCloseTo(2000 - fixedCarryingCost() - 180 - 160, DOLLAR);
  });
});

describe('breakEvenRent', () => {
  it('self-managed: fixed / 0.92', () => {
    expect(breakEvenRent(false)).toBeCloseTo(fixedCarryingCost() / 0.92, DOLLAR);
  });

  it('managed: fixed / 0.83', () => {
    expect(breakEvenRent(true)).toBeCloseTo(fixedCarryingCost() / 0.83, DOLLAR);
  });
});

describe('remainingBalance', () => {
  it('returns the original balance at month 0', () => {
    expect(remainingBalance(0)).toBe(RENT_SELL_DEFAULTS.balance);
  });

  it('decreases monotonically', () => {
    const b6 = remainingBalance(6);
    const b12 = remainingBalance(12);
    const b24 = remainingBalance(24);
    expect(b6).toBeLessThan(RENT_SELL_DEFAULTS.balance);
    expect(b12).toBeLessThan(b6);
    expect(b24).toBeLessThan(b12);
  });

  it('is non-negative even at large month counts', () => {
    expect(remainingBalance(360)).toBeGreaterThanOrEqual(0);
    expect(remainingBalance(1000)).toBe(0);
  });
});

describe('computeRentSell (default scenario)', () => {
  const DEFAULT_INPUT = {
    rent: 2000,
    managed: false,
    appRate: 0.02,
    invRate: 0.07,
    moveoutYear: 2026,
  };

  it('returns ok with the canonical default input', () => {
    const r = computeRentSell(DEFAULT_INPUT);
    expect(r.ok).toBe(true);
  });

  it('cashflow chart spans rent 1200..3200 in $50 steps (41 points)', () => {
    const r = computeRentSell(DEFAULT_INPUT);
    expect(r.ok && r.result.cashflowVsRent).toHaveLength(41);
    if (!r.ok) return;
    expect(r.result.cashflowVsRent[0]!.rent).toBe(1200);
    expect(r.result.cashflowVsRent[r.result.cashflowVsRent.length - 1]!.rent).toBe(3200);
  });

  it('wealth chart spans years 0..10 (11 points)', () => {
    const r = computeRentSell(DEFAULT_INPUT);
    expect(r.ok && r.result.wealthOverTime).toHaveLength(11);
    if (!r.ok) return;
    expect(r.result.wealthOverTime[0]!.year).toBe(0);
    expect(r.result.wealthOverTime[10]!.year).toBe(10);
    // At year 0, sellWealth = netProceeds (no investment growth yet)
    expect(r.result.wealthOverTime[0]!.sellWealth).toBeCloseTo(RENT_SELL_DEFAULTS.netProceeds, DOLLAR);
  });

  it('sensitivity sweep covers 0%..7% appreciation (8 points)', () => {
    const r = computeRentSell(DEFAULT_INPUT);
    expect(r.ok && r.result.sensitivity).toHaveLength(8);
    if (!r.ok) return;
    expect(r.result.sensitivity.map((s) => s.appRatePct)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('sensitivity is monotone increasing in appRate (higher appreciation favors renting)', () => {
    const r = computeRentSell(DEFAULT_INPUT);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const deltas = r.result.sensitivity.map((s) => s.rentMinusSellAt10);
    for (let i = 1; i < deltas.length; i++) {
      expect(deltas[i]).toBeGreaterThan(deltas[i - 1]!);
    }
  });

  it('rentBeatsSellAt10 reflects rentVsSellAt10Delta sign', () => {
    const r = computeRentSell(DEFAULT_INPUT);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.result.rentBeatsSellAt10).toBe(r.result.rentVsSellAt10Delta > 0);
  });
});

describe('Section 121 timeline', () => {
  it('safe when moveout is 4+ years out (yearsLeft > 2)', () => {
    const r = computeRentSell({
      rent: 2000,
      managed: false,
      appRate: 0.02,
      invRate: 0.07,
      moveoutYear: 2026,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // 2026 + 3 = 2029; yearsLeft = 2029 - 2026 = 3 → safe
    expect(r.result.section121.urgency).toBe('safe');
  });

  it('critical when yearsLeft ≤ 1', () => {
    // moveout 2024 → deadline 2027 → yearsLeft = 2027 - 2026 = 1 → critical
    const r = computeRentSell({
      rent: 2000,
      managed: false,
      appRate: 0.02,
      invRate: 0.07,
      moveoutYear: 2024,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.result.section121.urgency).toBe('critical');
  });

  it('warning when yearsLeft is 2', () => {
    // moveout 2025 → deadline 2028 → yearsLeft = 2 → warning
    const r = computeRentSell({
      rent: 2000,
      managed: false,
      appRate: 0.02,
      invRate: 0.07,
      moveoutYear: 2025,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.result.section121.urgency).toBe('warning');
  });
});

describe('validateRentSellInputs', () => {
  it('accepts default canonical input', () => {
    expect(
      validateRentSellInputs({
        rent: 2000,
        managed: false,
        appRate: 0.02,
        invRate: 0.07,
        moveoutYear: 2026,
      }),
    ).toEqual({});
  });

  it('rejects negative rent', () => {
    expect(
      validateRentSellInputs({
        rent: -100,
        managed: false,
        appRate: 0.02,
        invRate: 0.07,
        moveoutYear: 2026,
      }).rent,
    ).toBeTruthy();
  });

  it('rejects NaN appRate', () => {
    expect(
      validateRentSellInputs({
        rent: 2000,
        managed: false,
        appRate: Number.NaN,
        invRate: 0.07,
        moveoutYear: 2026,
      }).appRate,
    ).toBeTruthy();
  });
});
