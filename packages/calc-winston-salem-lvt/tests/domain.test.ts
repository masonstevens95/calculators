// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  computeLvt,
  computeRates,
  computeParcelBill,
  validateLvtInputs,
} from '../src/domain';
import { SAMPLE_PARCELS, WS_BASE } from '../src/parcels';
import { fixtures } from './fixtures';

const RATE_EPS = 8;
const DOLLAR_EPS = 2;

describe('computeRates (split-rate inversion)', () => {
  it('returns uniform rate at shift 0', () => {
    const r = computeRates(0);
    expect(r.landRate).toBeCloseTo(WS_BASE.rate, RATE_EPS);
    expect(r.impRate).toBeCloseTo(WS_BASE.rate, RATE_EPS);
  });

  it('returns pure LVT at shift 1 (impRate = 0)', () => {
    const r = computeRates(1);
    expect(r.impRate).toBeCloseTo(0, RATE_EPS);
    expect(r.landRate).toBeCloseTo(r.pureLvtRate, RATE_EPS);
    expect(r.impliedK).toBe(Number.POSITIVE_INFINITY);
  });

  it('clamps shift > 1 to 1', () => {
    expect(computeRates(2.5).impRate).toBe(0);
  });

  it('clamps shift < 0 to 0', () => {
    expect(computeRates(-0.5).landRate).toBeCloseTo(WS_BASE.rate, RATE_EPS);
  });

  it('shift 0.5 produces rates that are exact midpoints between uniform and pure', () => {
    const r = computeRates(0.5);
    const expectedLand = 0.5 * WS_BASE.rate + 0.5 * r.pureLvtRate;
    const expectedImp = 0.5 * WS_BASE.rate;
    expect(r.landRate).toBeCloseTo(expectedLand, RATE_EPS);
    expect(r.impRate).toBeCloseTo(expectedImp, RATE_EPS);
  });

  it('revenue target equals (L + I) × current uniform rate', () => {
    const r = computeRates(0);
    expect(r.target).toBeCloseTo((WS_BASE.L + WS_BASE.I) * WS_BASE.rate, DOLLAR_EPS);
  });

  it('revenueScale 1.5 raises target by 50% and scales rates accordingly', () => {
    const baseline = computeRates(0);
    const scaled = computeRates(0, WS_BASE, 1.5);
    expect(scaled.target).toBeCloseTo(baseline.target * 1.5, DOLLAR_EPS);
    expect(scaled.uniformRate).toBeCloseTo(WS_BASE.rate * 1.5, RATE_EPS);
    expect(scaled.landRate).toBeCloseTo(WS_BASE.rate * 1.5, RATE_EPS);
    expect(scaled.impRate).toBeCloseTo(WS_BASE.rate * 1.5, RATE_EPS);
  });

  it('revenueScale defaults to 1 when omitted', () => {
    const baseline = computeRates(0);
    const explicit = computeRates(0, WS_BASE, 1);
    expect(explicit.target).toBeCloseTo(baseline.target, DOLLAR_EPS);
  });
});

describe('computeParcelBill', () => {
  it('today bill = (land + imp) × current uniform rate', () => {
    const rates = computeRates(0);
    const bill = computeParcelBill({ name: 'x', land: 100_000, imp: 300_000 }, rates, WS_BASE.rate);
    expect(bill.today).toBeCloseTo(400_000 * WS_BASE.rate, DOLLAR_EPS);
  });

  it('vacant lot pays the same today and next under shift 0', () => {
    const rates = computeRates(0);
    const bill = computeParcelBill({ name: 'lot', land: 50_000, imp: 0 }, rates, WS_BASE.rate);
    expect(bill.delta).toBeCloseTo(0, DOLLAR_EPS);
  });

  it('vacant lot pays MORE than today under pure LVT (delta > 0)', () => {
    const rates = computeRates(1);
    const bill = computeParcelBill({ name: 'lot', land: 50_000, imp: 0 }, rates, WS_BASE.rate);
    expect(bill.delta).toBeGreaterThan(0);
  });

  it('improvement-heavy parcel pays LESS under pure LVT (delta < 0)', () => {
    const rates = computeRates(1);
    const bill = computeParcelBill(
      { name: 'apt', land: 100_000, imp: 5_000_000 },
      rates,
      WS_BASE.rate,
    );
    expect(bill.delta).toBeLessThan(0);
  });
});

describe('computeLvt (fixture-driven, AE3 coverage)', () => {
  for (const fixture of fixtures) {
    it(fixture.name, () => {
      const result = computeLvt(fixture.input);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const { result: r } = result;
      const e = fixture.expected;
      expect(r.rates.landRate).toBeCloseTo(e.landRate, RATE_EPS);
      expect(r.rates.impRate).toBeCloseTo(e.impRate, RATE_EPS);
      expect(r.rates.pureLvtRate).toBeCloseTo(e.pureLvtRate, RATE_EPS);
      expect(Number.isFinite(r.rates.impliedK)).toBe(e.impliedKFinite);
      expect(r.sampleBills).toHaveLength(e.sampleBillsCount);
      if (fixture.input.myParcel) {
        expect(r.myBill).toBeDefined();
      }
    });
  }
});

describe('validateLvtInputs', () => {
  it('accepts shift in [0, 1]', () => {
    expect(validateLvtInputs({ shift: 0 })).toEqual({});
    expect(validateLvtInputs({ shift: 0.5 })).toEqual({});
    expect(validateLvtInputs({ shift: 1 })).toEqual({});
  });

  it('accepts shift outside [0, 1] (clamped downstream in computeRates)', () => {
    expect(validateLvtInputs({ shift: 1.5 })).toEqual({});
    expect(validateLvtInputs({ shift: -0.1 })).toEqual({});
  });

  it('rejects NaN shift', () => {
    expect(validateLvtInputs({ shift: Number.NaN }).shift).toBeTruthy();
  });

  it('rejects negative myParcel.land', () => {
    const errors = validateLvtInputs({
      shift: 0,
      myParcel: { name: 'x', land: -1, imp: 0 },
    });
    expect(errors.myParcel).toBeTruthy();
  });

  it('rejects non-positive revenueScale', () => {
    expect(validateLvtInputs({ shift: 0, revenueScale: 0 }).revenueScale).toBeTruthy();
    expect(validateLvtInputs({ shift: 0, revenueScale: -1 }).revenueScale).toBeTruthy();
    expect(validateLvtInputs({ shift: 0, revenueScale: Number.NaN }).revenueScale).toBeTruthy();
  });

  it('accepts a positive revenueScale', () => {
    expect(validateLvtInputs({ shift: 0, revenueScale: 1.5 })).toEqual({});
  });
});

describe('SAMPLE_PARCELS catalog', () => {
  it('contains the 7 parcels from the HTML original', () => {
    expect(SAMPLE_PARCELS).toHaveLength(7);
    expect(SAMPLE_PARCELS.map((p) => p.name)).toContain('Vacant infill lot');
    expect(SAMPLE_PARCELS.map((p) => p.name)).toContain('Surface parking (downtown)');
  });
});
