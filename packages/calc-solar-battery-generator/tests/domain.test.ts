// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  computeSolarBatteryGenerator,
  systemCost,
  monthlyLoanPayment,
  financeDetails,
  annualProductionKwh,
  annualBillSavings,
  annualGeneratorCost,
  cashFlowSeries,
  solvePaybackYears,
  sensitivitySweep,
  validateSolarBatteryGeneratorInputs,
} from '../src/domain';
import type { SolarBatteryGeneratorInputs } from '../src/domain';
import { SOLAR_BATTERY_GENERATOR_INITIAL_INPUTS } from '../src/constants';

const DOLLAR = 2;

const DEFAULTS: SolarBatteryGeneratorInputs = { ...SOLAR_BATTERY_GENERATOR_INITIAL_INPUTS };

describe('systemCost', () => {
  it('sums hardware, applies soft costs, ITC, and rebate', () => {
    const solar = DEFAULTS.solarSizeKw * 1000 * DEFAULTS.solarCostPerWatt;
    const battery = DEFAULTS.batteryCapacityKwh * DEFAULTS.batteryCostPerKwh;
    const hardware = solar + battery + DEFAULTS.generatorCost;
    const gross = hardware * (1 + DEFAULTS.softCostsPct / 100);
    const itc = gross * (DEFAULTS.federalItcPct / 100);
    const net = gross - itc - DEFAULTS.stateRebate;

    const result = systemCost(DEFAULTS);
    expect(result.hardwareCost).toBeCloseTo(hardware, DOLLAR);
    expect(result.grossCost).toBeCloseTo(gross, DOLLAR);
    expect(result.itcAmount).toBeCloseTo(itc, DOLLAR);
    expect(result.netCost).toBeCloseTo(net, DOLLAR);
  });

  it('never returns a negative net cost even with a large rebate', () => {
    const result = systemCost({ ...DEFAULTS, stateRebate: 10_000_000 });
    expect(result.netCost).toBe(0);
  });
});

describe('monthlyLoanPayment', () => {
  it('matches the standard amortization formula for a nonzero rate', () => {
    const principal = 20_000;
    const rate = 6;
    const years = 10;
    const r = rate / 100 / 12;
    const n = years * 12;
    const expected = (principal * r) / (1 - Math.pow(1 + r, -n));
    expect(monthlyLoanPayment(principal, rate, years)).toBeCloseTo(expected, 4);
  });

  it('divides evenly when the rate is zero', () => {
    expect(monthlyLoanPayment(12_000, 0, 10)).toBeCloseTo(100, 4);
  });

  it('returns 0 for a zero-length term', () => {
    expect(monthlyLoanPayment(10_000, 5, 0)).toBe(0);
  });
});

describe('financeDetails', () => {
  it('cash mode: upfront cash equals net cost, no loan', () => {
    const { netCost } = systemCost(DEFAULTS);
    const details = financeDetails({ ...DEFAULTS, financeMode: 'cash' }, netCost);
    expect(details.upfrontCash).toBeCloseTo(netCost, DOLLAR);
    expect(details.loanAmount).toBe(0);
    expect(details.annualDebtService).toBe(0);
  });

  it('loan mode: upfront cash is the down payment, debt service is nonzero', () => {
    const { netCost } = systemCost(DEFAULTS);
    const details = financeDetails(DEFAULTS, netCost);
    expect(details.upfrontCash).toBeCloseTo(netCost * (DEFAULTS.downPaymentPct / 100), DOLLAR);
    expect(details.loanAmount).toBeCloseTo(netCost - details.upfrontCash, DOLLAR);
    expect(details.annualDebtService).toBeGreaterThan(0);
  });
});

describe('annualProductionKwh', () => {
  it('year 1 uses full nameplate production (no degradation applied)', () => {
    expect(annualProductionKwh(DEFAULTS, 1)).toBeCloseTo(
      DEFAULTS.solarSizeKw * DEFAULTS.productionPerKw,
      DOLLAR,
    );
  });

  it('declines year over year with panel degradation', () => {
    const y1 = annualProductionKwh(DEFAULTS, 1);
    const y10 = annualProductionKwh(DEFAULTS, 10);
    expect(y10).toBeLessThan(y1);
  });
});

describe('annualBillSavings', () => {
  it('splits self-consumed and exported kWh at their respective rates', () => {
    const production = annualProductionKwh(DEFAULTS, 1);
    const selfConsumed = production * (DEFAULTS.selfConsumptionPct / 100);
    const exported = production - selfConsumed;
    const expected =
      selfConsumed * DEFAULTS.utilityRatePerKwh +
      exported * DEFAULTS.utilityRatePerKwh * (DEFAULTS.netMeteringPct / 100);
    expect(annualBillSavings(DEFAULTS, 1)).toBeCloseTo(expected, DOLLAR);
  });

  it('grows with the escalated utility rate in later years', () => {
    const y1 = annualBillSavings(DEFAULTS, 1);
    const y5 = annualBillSavings(DEFAULTS, 5);
    expect(y5).toBeGreaterThan(y1);
  });
});

describe('annualGeneratorCost', () => {
  it('is maintenance + fuel burn in a non-replacement year', () => {
    const fuel =
      DEFAULTS.annualOutageHours * DEFAULTS.generatorBurnRateGalPerHr * DEFAULTS.fuelCostPerGallon;
    expect(annualGeneratorCost(DEFAULTS, 1)).toBeCloseTo(
      DEFAULTS.generatorMaintenanceAnnual + fuel,
      DOLLAR,
    );
  });

  it('adds the replacement lump sum in the replacement year', () => {
    const withoutReplacement = annualGeneratorCost(DEFAULTS, DEFAULTS.generatorReplaceYear - 1);
    const withReplacement = annualGeneratorCost(DEFAULTS, DEFAULTS.generatorReplaceYear);
    expect(withReplacement - withoutReplacement).toBeCloseTo(DEFAULTS.generatorReplaceCost, DOLLAR);
  });
});

describe('cashFlowSeries', () => {
  it('starts at year 0 with negative cumulative equal to -upfrontCash', () => {
    const { netCost } = systemCost(DEFAULTS);
    const { upfrontCash } = financeDetails(DEFAULTS, netCost);
    const series = cashFlowSeries(DEFAULTS);
    expect(series[0]).toEqual({ year: 0, cumulative: -upfrontCash, net: -upfrontCash });
  });

  it('has analysisYears + 1 points', () => {
    const series = cashFlowSeries(DEFAULTS);
    expect(series).toHaveLength(DEFAULTS.analysisYears + 1);
  });

  it('stops charging debt service once the loan term ends', () => {
    const shortLoan: SolarBatteryGeneratorInputs = {
      ...DEFAULTS,
      financeMode: 'loan',
      loanTermYears: 5,
      analysisYears: 10,
    };
    const series = cashFlowSeries(shortLoan);
    const { netCost } = systemCost(shortLoan);
    const { annualDebtService } = financeDetails(shortLoan, netCost);
    const yearSixNet = series[6]!.net;
    const billSavingsYearSix = annualBillSavings(shortLoan, 6);
    const generatorCostYearSix = annualGeneratorCost(shortLoan, 6);
    expect(yearSixNet).toBeCloseTo(billSavingsYearSix - generatorCostYearSix, DOLLAR);
    expect(annualDebtService).toBeGreaterThan(0);
  });
});

describe('solvePaybackYears', () => {
  it('finds a fractional payback year for the default scenario', () => {
    const payback = solvePaybackYears(DEFAULTS);
    expect(payback).not.toBeNull();
    expect(payback!).toBeGreaterThan(0);
    expect(payback!).toBeLessThanOrEqual(DEFAULTS.analysisYears);
  });

  it('returns null when the system never breaks even in the analysis window', () => {
    const neverPaysBack: SolarBatteryGeneratorInputs = {
      ...DEFAULTS,
      analysisYears: 1,
      solarSizeKw: 20,
      solarCostPerWatt: 10,
      batteryCapacityKwh: 40,
      batteryCostPerKwh: 2000,
    };
    expect(solvePaybackYears(neverPaysBack)).toBeNull();
  });

  it('returns 0 when upfront cash is already non-negative', () => {
    const zeroDown: SolarBatteryGeneratorInputs = {
      ...DEFAULTS,
      financeMode: 'loan',
      downPaymentPct: 0,
    };
    expect(solvePaybackYears(zeroDown)).toBe(0);
  });
});

describe('sensitivitySweep', () => {
  it('sweeps rate escalation 0..8% in 1% steps (9 points)', () => {
    const points = sensitivitySweep(DEFAULTS);
    expect(points).toHaveLength(9);
    expect(points[0]!.rateEscalationPct).toBe(0);
    expect(points[points.length - 1]!.rateEscalationPct).toBe(8);
  });

  it('higher rate escalation never lengthens the payback period', () => {
    const points = sensitivitySweep(DEFAULTS);
    const paybacks = points.map((p) => p.paybackYears ?? Infinity);
    for (let i = 1; i < paybacks.length; i++) {
      expect(paybacks[i]!).toBeLessThanOrEqual(paybacks[i - 1]!);
    }
  });
});

describe('validateSolarBatteryGeneratorInputs', () => {
  it('accepts the canonical default input', () => {
    expect(validateSolarBatteryGeneratorInputs(DEFAULTS)).toEqual({});
  });

  it('flags a negative solar size', () => {
    const errors = validateSolarBatteryGeneratorInputs({ ...DEFAULTS, solarSizeKw: -1 });
    expect(errors.solarSizeKw).toBeDefined();
  });

  it('flags an out-of-range analysis period', () => {
    const errors = validateSolarBatteryGeneratorInputs({ ...DEFAULTS, analysisYears: 0 });
    expect(errors.analysisYears).toBeDefined();
  });

  it('flags an invalid financeMode', () => {
    const errors = validateSolarBatteryGeneratorInputs({
      ...DEFAULTS,
      financeMode: 'other' as never,
    });
    expect(errors.financeMode).toBeDefined();
  });
});

describe('computeSolarBatteryGenerator (default scenario)', () => {
  it('returns ok with the canonical default input', () => {
    expect(computeSolarBatteryGenerator(DEFAULTS).ok).toBe(true);
  });

  it('returns errors for invalid input', () => {
    const result = computeSolarBatteryGenerator({ ...DEFAULTS, solarSizeKw: Number.NaN });
    expect(result.ok).toBe(false);
  });

  it('lifetimeNetProfit matches the final cash flow cumulative value', () => {
    const result = computeSolarBatteryGenerator(DEFAULTS);
    if (!result.ok) throw new Error('expected ok result');
    const series = cashFlowSeries(DEFAULTS);
    expect(result.result.lifetimeNetProfit).toBeCloseTo(series[series.length - 1]!.cumulative, DOLLAR);
  });

  it('annualBreakdown is capped at the configured breakdown window', () => {
    const result = computeSolarBatteryGenerator(DEFAULTS);
    if (!result.ok) throw new Error('expected ok result');
    expect(result.result.annualBreakdown.length).toBeLessThanOrEqual(15);
  });

  it('cash purchase costs more upfront but owes no ongoing debt service', () => {
    const cashResult = computeSolarBatteryGenerator({ ...DEFAULTS, financeMode: 'cash' });
    if (!cashResult.ok) throw new Error('expected ok result');
    expect(cashResult.result.annualDebtService).toBe(0);
    expect(cashResult.result.upfrontCash).toBeCloseTo(cashResult.result.netCost, DOLLAR);
  });
});
