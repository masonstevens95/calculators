// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  computeSolarBattery,
  systemCost,
  solarHardwareCost,
  batteryHardwareCost,
  softCostAmount,
  monthlyLoanPayment,
  financeDetails,
  annualProductionKwh,
  annualBillSavings,
  annualArbitrageValue,
  cashFlowSeries,
  indexFundSeries,
  solvePaybackYears,
  sensitivitySweep,
  validateSolarBatteryInputs,
  suggestSystemSizing,
  SIZING_PROFILES,
} from '../src/domain';
import type { SizingProfile, SolarBatteryInputs } from '../src/domain';
import { SOLAR_BATTERY_DEFAULTS, SOLAR_BATTERY_INITIAL_INPUTS } from '../src/constants';

const DOLLAR = 2;

const DEFAULTS: SolarBatteryInputs = { ...SOLAR_BATTERY_INITIAL_INPUTS };

describe('solarHardwareCost', () => {
  it('per-watt mode: size (W) times cost per watt', () => {
    expect(solarHardwareCost(DEFAULTS)).toBeCloseTo(
      DEFAULTS.solarSizeKw * 1000 * DEFAULTS.solarCostPerWatt,
      DOLLAR,
    );
  });

  it('total mode: uses the flat total cost, ignoring size and per-watt cost', () => {
    const totalMode: SolarBatteryInputs = {
      ...DEFAULTS,
      solarCostMode: 'total',
      solarTotalCost: 19_999,
    };
    expect(solarHardwareCost(totalMode)).toBe(19_999);
  });
});

describe('batteryHardwareCost', () => {
  it('per-kWh mode: capacity times cost per kWh', () => {
    expect(batteryHardwareCost(DEFAULTS)).toBeCloseTo(
      DEFAULTS.batteryCapacityKwh * DEFAULTS.batteryCostPerKwh,
      DOLLAR,
    );
  });

  it('total mode: uses the flat total cost, ignoring capacity and per-kWh cost', () => {
    const totalMode: SolarBatteryInputs = {
      ...DEFAULTS,
      batteryCostMode: 'total',
      batteryTotalCost: 8_888,
    };
    expect(batteryHardwareCost(totalMode)).toBe(8_888);
  });
});

describe('softCostAmount', () => {
  it('percent mode: a percentage of hardware cost', () => {
    expect(softCostAmount(DEFAULTS, 30_000)).toBeCloseTo(30_000 * (DEFAULTS.softCostsPct / 100), DOLLAR);
  });

  it('flat mode: the flat dollar amount, independent of hardware cost', () => {
    const flatMode: SolarBatteryInputs = { ...DEFAULTS, softCostsMode: 'flat', softCostsFlat: 2_500 };
    expect(softCostAmount(flatMode, 30_000)).toBe(2_500);
    expect(softCostAmount(flatMode, 999_999)).toBe(2_500);
  });
});

describe('systemCost', () => {
  it('sums hardware, applies soft costs, ITC, and rebate', () => {
    const hardware = solarHardwareCost(DEFAULTS) + batteryHardwareCost(DEFAULTS);
    const soft = softCostAmount(DEFAULTS, hardware);
    const gross = hardware + soft;
    const itc = gross * (DEFAULTS.federalItcPct / 100);
    const net = gross - itc - DEFAULTS.stateRebate;

    const result = systemCost(DEFAULTS);
    expect(result.hardwareCost).toBeCloseTo(hardware, DOLLAR);
    expect(result.grossCost).toBeCloseTo(gross, DOLLAR);
    expect(result.itcAmount).toBeCloseTo(itc, DOLLAR);
    expect(result.netCost).toBeCloseTo(net, DOLLAR);
  });

  it('matches between equivalent per-unit and total-cost inputs', () => {
    const perUnit = systemCost(DEFAULTS);
    const totalMode: SolarBatteryInputs = {
      ...DEFAULTS,
      solarCostMode: 'total',
      solarTotalCost: DEFAULTS.solarSizeKw * 1000 * DEFAULTS.solarCostPerWatt,
      batteryCostMode: 'total',
      batteryTotalCost: DEFAULTS.batteryCapacityKwh * DEFAULTS.batteryCostPerKwh,
    };
    expect(systemCost(totalMode).netCost).toBeCloseTo(perUnit.netCost, DOLLAR);
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

  it('a secondhand panel with N years of age starts where a new panel would be at year N+1', () => {
    const secondhand: SolarBatteryInputs = { ...DEFAULTS, panelAgeYears: 10 };
    expect(annualProductionKwh(secondhand, 1)).toBeCloseTo(annualProductionKwh(DEFAULTS, 11), DOLLAR);
  });

  it('panel age produces strictly less output than new panels at the same analysis year', () => {
    const secondhand: SolarBatteryInputs = { ...DEFAULTS, panelAgeYears: 5 };
    expect(annualProductionKwh(secondhand, 1)).toBeLessThan(annualProductionKwh(DEFAULTS, 1));
  });
});

describe('annualBillSavings', () => {
  it('splits self-consumed and exported kWh at their respective rates', () => {
    const production = annualProductionKwh(DEFAULTS, 1);
    const selfConsumed = production * (DEFAULTS.selfConsumptionPct / 100);
    const exported = production - selfConsumed;
    const expected =
      selfConsumed * DEFAULTS.utilityRatePerKwh + exported * DEFAULTS.exportRatePerKwh;
    expect(annualBillSavings(DEFAULTS, 1)).toBeCloseTo(expected, DOLLAR);
  });

  it('exported kWh is credited at the flat sell-back rate, not the retail rate', () => {
    const highExportRate: SolarBatteryInputs = {
      ...DEFAULTS,
      exportRatePerKwh: DEFAULTS.utilityRatePerKwh * 2,
    };
    const lowExportRate: SolarBatteryInputs = { ...DEFAULTS, exportRatePerKwh: 0 };
    expect(annualBillSavings(highExportRate, 1)).toBeGreaterThan(annualBillSavings(DEFAULTS, 1));
    expect(annualBillSavings(lowExportRate, 1)).toBeLessThan(annualBillSavings(DEFAULTS, 1));
  });

  it('grows with the escalated utility rate in later years', () => {
    const y1 = annualBillSavings(DEFAULTS, 1);
    const y5 = annualBillSavings(DEFAULTS, 5);
    expect(y5).toBeGreaterThan(y1);
  });
});

describe('annualArbitrageValue', () => {
  const arbitrageOn: SolarBatteryInputs = { ...DEFAULTS, touArbitrageEnabled: true };

  it('is 0 when arbitrage is disabled, regardless of rates', () => {
    expect(annualArbitrageValue(DEFAULTS, 1)).toBe(0);
  });

  it('is 0 when the battery has no capacity', () => {
    expect(annualArbitrageValue({ ...arbitrageOn, batteryCapacityKwh: 0 }, 1)).toBe(0);
  });

  it('matches (onPeak - offPeak/efficiency) * capacity * days when enabled', () => {
    const efficiency = arbitrageOn.batteryRoundTripEffPct / 100;
    const netPerKwh = arbitrageOn.touOnPeakRatePerKwh - arbitrageOn.touOffPeakRatePerKwh / efficiency;
    const expected = netPerKwh * arbitrageOn.batteryCapacityKwh * arbitrageOn.touDaysPerYear;
    expect(annualArbitrageValue(arbitrageOn, 1)).toBeCloseTo(expected, DOLLAR);
  });

  it('is never negative even if off-peak/efficiency costs exceed the on-peak rate', () => {
    const unprofitable: SolarBatteryInputs = {
      ...arbitrageOn,
      touOffPeakRatePerKwh: 0.5,
      touOnPeakRatePerKwh: 0.1,
    };
    expect(annualArbitrageValue(unprofitable, 1)).toBe(0);
  });

  it('scales with battery capacity', () => {
    const doubled: SolarBatteryInputs = {
      ...arbitrageOn,
      batteryCapacityKwh: arbitrageOn.batteryCapacityKwh * 2,
    };
    expect(annualArbitrageValue(doubled, 1)).toBeCloseTo(annualArbitrageValue(arbitrageOn, 1) * 2, DOLLAR);
  });

  it('escalates with the utility rate escalation over time', () => {
    const y1 = annualArbitrageValue(arbitrageOn, 1);
    const y10 = annualArbitrageValue(arbitrageOn, 10);
    expect(y10).toBeGreaterThan(y1);
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
    const shortLoan: SolarBatteryInputs = {
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
    expect(yearSixNet).toBeCloseTo(billSavingsYearSix, DOLLAR);
    expect(annualDebtService).toBeGreaterThan(0);
  });
});

describe('indexFundSeries', () => {
  it('starts at 0 gain in year 0 and compounds the upfront cash at the index fund rate', () => {
    const { netCost } = systemCost(DEFAULTS);
    const { upfrontCash } = financeDetails(DEFAULTS, netCost);
    const series = indexFundSeries(DEFAULTS);
    expect(series[0]).toEqual({ year: 0, cumulative: 0, net: 0 });

    const r = DEFAULTS.indexFundReturnPct / 100;
    const expectedFinalGain = upfrontCash * Math.pow(1 + r, DEFAULTS.analysisYears) - upfrontCash;
    expect(series[series.length - 1]!.cumulative).toBeCloseTo(expectedFinalGain, DOLLAR);
  });

  it('has analysisYears + 1 points, matching cashFlowSeries', () => {
    const series = indexFundSeries(DEFAULTS);
    expect(series).toHaveLength(DEFAULTS.analysisYears + 1);
  });

  it('gain is monotonically increasing for a positive return', () => {
    const series = indexFundSeries(DEFAULTS);
    for (let i = 1; i < series.length; i++) {
      expect(series[i]!.cumulative).toBeGreaterThan(series[i - 1]!.cumulative);
    }
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
    const neverPaysBack: SolarBatteryInputs = {
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
    const zeroDown: SolarBatteryInputs = {
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

describe('suggestSystemSizing', () => {
  const HOUSE_SQFT = 1_800;
  const PRODUCTION_PER_KW = 1_500;

  it('estimates annual usage from house size via usagePerSqFtKwh', () => {
    const suggestion = suggestSystemSizing(HOUSE_SQFT, 'bestRoi', PRODUCTION_PER_KW);
    expect(suggestion.estimatedAnnualUsageKwh).toBe(
      Math.round(HOUSE_SQFT * SOLAR_BATTERY_DEFAULTS.usagePerSqFtKwh),
    );
  });

  it('solar sizing follows usageCoveragePct / productionPerKw for every profile', () => {
    const profiles: readonly SizingProfile[] = [
      'minimal',
      'essentials',
      'bestRoi',
      'totalCoverage',
      'offGrid',
    ];
    for (const profile of profiles) {
      const suggestion = suggestSystemSizing(HOUSE_SQFT, profile, PRODUCTION_PER_KW);
      const cfg = SIZING_PROFILES[profile];
      const expectedKw =
        (suggestion.estimatedAnnualUsageKwh * (cfg.usageCoveragePct / 100)) / PRODUCTION_PER_KW;
      expect(suggestion.solarSizeKw).toBeCloseTo(expectedKw, 0);
    }
  });

  it('orders solar sizing from smallest to largest: minimal < essentials < bestRoi <= totalCoverage < offGrid', () => {
    const minimal = suggestSystemSizing(HOUSE_SQFT, 'minimal', PRODUCTION_PER_KW);
    const essentials = suggestSystemSizing(HOUSE_SQFT, 'essentials', PRODUCTION_PER_KW);
    const bestRoi = suggestSystemSizing(HOUSE_SQFT, 'bestRoi', PRODUCTION_PER_KW);
    const totalCoverage = suggestSystemSizing(HOUSE_SQFT, 'totalCoverage', PRODUCTION_PER_KW);
    const offGrid = suggestSystemSizing(HOUSE_SQFT, 'offGrid', PRODUCTION_PER_KW);

    expect(minimal.solarSizeKw).toBeLessThan(essentials.solarSizeKw);
    expect(essentials.solarSizeKw).toBeLessThan(bestRoi.solarSizeKw);
    expect(bestRoi.solarSizeKw).toBeLessThanOrEqual(totalCoverage.solarSizeKw);
    expect(totalCoverage.solarSizeKw).toBeLessThan(offGrid.solarSizeKw);

    expect(minimal.batteryCapacityKwh).toBeLessThan(essentials.batteryCapacityKwh);
    expect(totalCoverage.batteryCapacityKwh).toBeGreaterThan(essentials.batteryCapacityKwh);
    expect(offGrid.batteryCapacityKwh).toBeGreaterThan(totalCoverage.batteryCapacityKwh);
  });

  it('returns zeroed sizing for a house with no square footage', () => {
    const suggestion = suggestSystemSizing(0, 'bestRoi', PRODUCTION_PER_KW);
    expect(suggestion.estimatedAnnualUsageKwh).toBe(0);
    expect(suggestion.solarSizeKw).toBe(0);
    expect(suggestion.batteryCapacityKwh).toBe(0);
  });

  it('clamps negative house size to zero rather than producing negative sizing', () => {
    const suggestion = suggestSystemSizing(-500, 'bestRoi', PRODUCTION_PER_KW);
    expect(suggestion.estimatedAnnualUsageKwh).toBe(0);
    expect(suggestion.solarSizeKw).toBe(0);
    expect(suggestion.batteryCapacityKwh).toBe(0);
  });

  it('returns 0 solar sizing rather than dividing by zero when productionPerKw is 0', () => {
    const suggestion = suggestSystemSizing(HOUSE_SQFT, 'bestRoi', 0);
    expect(suggestion.solarSizeKw).toBe(0);
  });
});

describe('validateSolarBatteryInputs', () => {
  it('accepts the canonical default input', () => {
    expect(validateSolarBatteryInputs(DEFAULTS)).toEqual({});
  });

  it('flags a negative solar size', () => {
    const errors = validateSolarBatteryInputs({ ...DEFAULTS, solarSizeKw: -1 });
    expect(errors.solarSizeKw).toBeDefined();
  });

  it('flags an out-of-range analysis period', () => {
    const errors = validateSolarBatteryInputs({ ...DEFAULTS, analysisYears: 0 });
    expect(errors.analysisYears).toBeDefined();
  });

  it('flags an out-of-range panel age', () => {
    expect(validateSolarBatteryInputs({ ...DEFAULTS, panelAgeYears: -1 }).panelAgeYears).toBeDefined();
    expect(validateSolarBatteryInputs({ ...DEFAULTS, panelAgeYears: 41 }).panelAgeYears).toBeDefined();
  });

  it('flags a negative sell-back rate', () => {
    const errors = validateSolarBatteryInputs({ ...DEFAULTS, exportRatePerKwh: -0.01 });
    expect(errors.exportRatePerKwh).toBeDefined();
  });

  it('flags an out-of-range battery round-trip efficiency', () => {
    expect(
      validateSolarBatteryInputs({ ...DEFAULTS, batteryRoundTripEffPct: 0 }).batteryRoundTripEffPct,
    ).toBeDefined();
    expect(
      validateSolarBatteryInputs({ ...DEFAULTS, batteryRoundTripEffPct: 101 }).batteryRoundTripEffPct,
    ).toBeDefined();
  });

  it('flags negative TOU rates and an out-of-range days/year', () => {
    expect(
      validateSolarBatteryInputs({ ...DEFAULTS, touOffPeakRatePerKwh: -0.01 }).touOffPeakRatePerKwh,
    ).toBeDefined();
    expect(
      validateSolarBatteryInputs({ ...DEFAULTS, touOnPeakRatePerKwh: -0.01 }).touOnPeakRatePerKwh,
    ).toBeDefined();
    expect(
      validateSolarBatteryInputs({ ...DEFAULTS, touDaysPerYear: 400 }).touDaysPerYear,
    ).toBeDefined();
  });

  it('flags an invalid touArbitrageEnabled', () => {
    const errors = validateSolarBatteryInputs({ ...DEFAULTS, touArbitrageEnabled: 'yes' as never });
    expect(errors.touArbitrageEnabled).toBeDefined();
  });

  it('flags an invalid financeMode', () => {
    const errors = validateSolarBatteryInputs({
      ...DEFAULTS,
      financeMode: 'other' as never,
    });
    expect(errors.financeMode).toBeDefined();
  });

  it('flags an invalid solarCostMode', () => {
    const errors = validateSolarBatteryInputs({ ...DEFAULTS, solarCostMode: 'other' as never });
    expect(errors.solarCostMode).toBeDefined();
  });

  it('flags an invalid batteryCostMode', () => {
    const errors = validateSolarBatteryInputs({ ...DEFAULTS, batteryCostMode: 'other' as never });
    expect(errors.batteryCostMode).toBeDefined();
  });

  it('flags an invalid softCostsMode', () => {
    const errors = validateSolarBatteryInputs({ ...DEFAULTS, softCostsMode: 'other' as never });
    expect(errors.softCostsMode).toBeDefined();
  });
});

describe('computeSolarBattery (default scenario)', () => {
  it('returns ok with the canonical default input', () => {
    expect(computeSolarBattery(DEFAULTS).ok).toBe(true);
  });

  it('returns errors for invalid input', () => {
    const result = computeSolarBattery({ ...DEFAULTS, solarSizeKw: Number.NaN });
    expect(result.ok).toBe(false);
  });

  it('lifetimeNetProfit matches the final cash flow cumulative value', () => {
    const result = computeSolarBattery(DEFAULTS);
    if (!result.ok) throw new Error('expected ok result');
    const series = cashFlowSeries(DEFAULTS);
    expect(result.result.lifetimeNetProfit).toBeCloseTo(series[series.length - 1]!.cumulative, DOLLAR);
  });

  it('annualBreakdown is capped at the configured breakdown window', () => {
    const result = computeSolarBattery(DEFAULTS);
    if (!result.ok) throw new Error('expected ok result');
    expect(result.result.annualBreakdown.length).toBeLessThanOrEqual(15);
  });

  it('cash purchase costs more upfront but owes no ongoing debt service', () => {
    const cashResult = computeSolarBattery({ ...DEFAULTS, financeMode: 'cash' });
    if (!cashResult.ok) throw new Error('expected ok result');
    expect(cashResult.result.annualDebtService).toBe(0);
    expect(cashResult.result.upfrontCash).toBeCloseTo(cashResult.result.netCost, DOLLAR);
  });

  it('annualProductionKwh scales automatically with solar array size', () => {
    const base = computeSolarBattery(DEFAULTS);
    const doubled = computeSolarBattery({ ...DEFAULTS, solarSizeKw: DEFAULTS.solarSizeKw * 2 });
    if (!base.ok || !doubled.ok) throw new Error('expected ok results');
    expect(doubled.result.annualProductionKwh).toBeCloseTo(base.result.annualProductionKwh * 2, DOLLAR);
  });

  it('indexFundGain matches the final index fund series value, and the verdict compares it to lifetimeNetProfit', () => {
    const result = computeSolarBattery(DEFAULTS);
    if (!result.ok) throw new Error('expected ok result');
    const series = indexFundSeries(DEFAULTS);
    expect(result.result.indexFundGain).toBeCloseTo(series[series.length - 1]!.cumulative, DOLLAR);
    expect(result.result.solarBeatsIndexFund).toBe(
      result.result.lifetimeNetProfit > result.result.indexFundGain,
    );
  });

  it('year1ArbitrageValue is 0 by default and positive once TOU arbitrage is enabled', () => {
    const off = computeSolarBattery(DEFAULTS);
    const on = computeSolarBattery({ ...DEFAULTS, touArbitrageEnabled: true });
    if (!off.ok || !on.ok) throw new Error('expected ok results');
    expect(off.result.year1ArbitrageValue).toBe(0);
    expect(on.result.year1ArbitrageValue).toBeGreaterThan(0);
  });

  it('enabling TOU arbitrage improves lifetimeNetProfit without changing net system cost', () => {
    const off = computeSolarBattery(DEFAULTS);
    const on = computeSolarBattery({ ...DEFAULTS, touArbitrageEnabled: true });
    if (!off.ok || !on.ok) throw new Error('expected ok results');
    expect(on.result.netCost).toBeCloseTo(off.result.netCost, DOLLAR);
    expect(on.result.lifetimeNetProfit).toBeGreaterThan(off.result.lifetimeNetProfit);
  });
});
