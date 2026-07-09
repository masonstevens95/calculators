// Pure domain for the Solar + Battery calculator.
//
// Models the upfront cost (solar + battery hardware, soft costs, incentives,
// financing) against the annual value it produces: utility bill offset from
// solar production (self-consumed + net-metered export) minus any loan debt
// service. Walks the resulting year-by-year cash flow to solve for the
// payback year (first point the cumulative cash flow crosses zero) and
// lifetime ROI.

import { SOLAR_BATTERY_DEFAULTS } from './constants';
import type { SolarBatteryConstants } from './constants';

export type FinanceMode = 'cash' | 'loan';
export type SolarCostMode = 'perWatt' | 'total';
export type BatteryCostMode = 'perKwh' | 'total';
export type SoftCostMode = 'percent' | 'flat';

export type SolarBatteryInputs = {
  // Solar
  solarSizeKw: number;
  solarCostMode: SolarCostMode;
  solarCostPerWatt: number;
  solarTotalCost: number;
  // Battery
  batteryCapacityKwh: number;
  batteryCostMode: BatteryCostMode;
  batteryCostPerKwh: number;
  batteryTotalCost: number;
  // Costs & incentives
  softCostsMode: SoftCostMode;
  softCostsPct: number;
  softCostsFlat: number;
  federalItcPct: number;
  stateRebate: number;
  // Financing
  financeMode: FinanceMode;
  downPaymentPct: number;
  loanRatePct: number;
  loanTermYears: number;
  /** Annual return assumed for investing the upfront cash in an index fund instead. */
  indexFundReturnPct: number;
  // Energy / usage
  annualUsageKwh: number;
  utilityRatePerKwh: number;
  rateEscalationPct: number;
  productionPerKw: number;
  selfConsumptionPct: number;
  netMeteringPct: number;
  systemDegradationPct: number;
  // Analysis
  analysisYears: number;
};

export type SystemCost = {
  hardwareCost: number;
  grossCost: number;
  itcAmount: number;
  netCost: number;
};

export type FinanceDetails = {
  upfrontCash: number;
  loanAmount: number;
  annualDebtService: number;
};

export type CashFlowPoint = { year: number; cumulative: number; net: number };
export type AnnualBreakdownPoint = {
  year: number;
  billSavings: number;
  debtService: number;
};
export type SensitivityPoint = { rateEscalationPct: number; paybackYears: number | null };

export type SolarBatteryOutput = {
  hardwareCost: number;
  grossCost: number;
  itcAmount: number;
  netCost: number;
  upfrontCash: number;
  loanAmount: number;
  annualDebtService: number;
  year1Savings: number;
  /** First-year solar production (kWh), before degradation — scales automatically with solarSizeKw. */
  annualProductionKwh: number;
  /** Fractional year the cumulative cash flow first reaches zero, or null if it never does within analysisYears. */
  paybackYears: number | null;
  lifetimeNetProfit: number;
  roiPct: number;
  cashFlowOverTime: CashFlowPoint[];
  /** Same upfront cash compounding in an index fund instead — cumulative is the gain over principal. */
  indexFundOverTime: CashFlowPoint[];
  indexFundGain: number;
  solarBeatsIndexFund: boolean;
  annualBreakdown: AnnualBreakdownPoint[];
  sensitivity: SensitivityPoint[];
};

export type ComputeSolarBatteryResult =
  | { ok: true; result: SolarBatteryOutput }
  | { ok: false; errors: Partial<Record<keyof SolarBatteryInputs, string>> };

// ---------- cost & financing primitives ----------

export function solarHardwareCost(inputs: SolarBatteryInputs): number {
  return inputs.solarCostMode === 'total'
    ? inputs.solarTotalCost
    : inputs.solarSizeKw * 1000 * inputs.solarCostPerWatt;
}

export function batteryHardwareCost(inputs: SolarBatteryInputs): number {
  return inputs.batteryCostMode === 'total'
    ? inputs.batteryTotalCost
    : inputs.batteryCapacityKwh * inputs.batteryCostPerKwh;
}

export function softCostAmount(inputs: SolarBatteryInputs, hardwareCost: number): number {
  return inputs.softCostsMode === 'flat'
    ? inputs.softCostsFlat
    : hardwareCost * (inputs.softCostsPct / 100);
}

export function systemCost(inputs: SolarBatteryInputs): SystemCost {
  const hardwareCost = solarHardwareCost(inputs) + batteryHardwareCost(inputs);
  const grossCost = hardwareCost + softCostAmount(inputs, hardwareCost);
  const itcAmount = grossCost * (inputs.federalItcPct / 100);
  const netCost = Math.max(0, grossCost - itcAmount - inputs.stateRebate);
  return { hardwareCost, grossCost, itcAmount, netCost };
}

export function monthlyLoanPayment(principal: number, annualRatePct: number, termYears: number): number {
  const n = Math.round(termYears * 12);
  if (n <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export function financeDetails(inputs: SolarBatteryInputs, netCost: number): FinanceDetails {
  if (inputs.financeMode === 'cash') {
    return { upfrontCash: netCost, loanAmount: 0, annualDebtService: 0 };
  }
  const downPayment = netCost * (inputs.downPaymentPct / 100);
  const loanAmount = Math.max(0, netCost - downPayment);
  const monthly = monthlyLoanPayment(loanAmount, inputs.loanRatePct, inputs.loanTermYears);
  return { upfrontCash: downPayment, loanAmount, annualDebtService: monthly * 12 };
}

// ---------- annual energy & cost primitives ----------

/** Solar production for a given analysis year (1-indexed), net of cumulative panel degradation. */
export function annualProductionKwh(inputs: SolarBatteryInputs, year: number): number {
  const degradationFactor = Math.pow(1 - inputs.systemDegradationPct / 100, year - 1);
  return inputs.solarSizeKw * inputs.productionPerKw * degradationFactor;
}

/** Utility bill offset: self-consumed kWh at the escalated retail rate + exported kWh at the net-metering rate. */
export function annualBillSavings(inputs: SolarBatteryInputs, year: number): number {
  const production = annualProductionKwh(inputs, year);
  const selfConsumedKwh = production * (inputs.selfConsumptionPct / 100);
  const exportedKwh = production - selfConsumedKwh;
  const escalatedRate =
    inputs.utilityRatePerKwh * Math.pow(1 + inputs.rateEscalationPct / 100, year - 1);
  const exportRate = escalatedRate * (inputs.netMeteringPct / 100);
  return selfConsumedKwh * escalatedRate + exportedKwh * exportRate;
}

// ---------- cash-flow series & solvers ----------

export function cashFlowSeries(inputs: SolarBatteryInputs): CashFlowPoint[] {
  const { netCost } = systemCost(inputs);
  const { upfrontCash, annualDebtService } = financeDetails(inputs, netCost);
  const loanYears = inputs.financeMode === 'loan' ? inputs.loanTermYears : 0;
  const N = Math.max(0, Math.floor(inputs.analysisYears));

  const points: CashFlowPoint[] = [{ year: 0, cumulative: -upfrontCash, net: -upfrontCash }];
  let cumulative = -upfrontCash;
  for (let year = 1; year <= N; year++) {
    const billSavings = annualBillSavings(inputs, year);
    const debtService = year <= loanYears ? annualDebtService : 0;
    const net = billSavings - debtService;
    cumulative += net;
    points.push({ year, cumulative, net });
  }
  return points;
}

/**
 * The same upfront cash, compounding in an index fund instead of buying the system.
 * cumulative(year) is the gain over principal (0 at year 0), so it's directly comparable
 * to cashFlowSeries' cumulative — both read as "net position change from doing nothing."
 */
export function indexFundSeries(inputs: SolarBatteryInputs): CashFlowPoint[] {
  const { netCost } = systemCost(inputs);
  const { upfrontCash } = financeDetails(inputs, netCost);
  const r = inputs.indexFundReturnPct / 100;
  const N = Math.max(0, Math.floor(inputs.analysisYears));

  const points: CashFlowPoint[] = [];
  let prevValue = upfrontCash;
  for (let year = 0; year <= N; year++) {
    const value = upfrontCash * Math.pow(1 + r, year);
    points.push({ year, cumulative: value - upfrontCash, net: year === 0 ? 0 : value - prevValue });
    prevValue = value;
  }
  return points;
}

export function annualBreakdownSeries(
  inputs: SolarBatteryInputs,
  c: SolarBatteryConstants = SOLAR_BATTERY_DEFAULTS,
): AnnualBreakdownPoint[] {
  const { netCost } = systemCost(inputs);
  const { annualDebtService } = financeDetails(inputs, netCost);
  const loanYears = inputs.financeMode === 'loan' ? inputs.loanTermYears : 0;
  const N = Math.min(Math.max(0, Math.floor(inputs.analysisYears)), c.breakdownYears);

  const points: AnnualBreakdownPoint[] = [];
  for (let year = 1; year <= N; year++) {
    points.push({
      year,
      billSavings: annualBillSavings(inputs, year),
      debtService: year <= loanYears ? annualDebtService : 0,
    });
  }
  return points;
}

/** First fractional year the cumulative cash flow reaches zero, via linear interpolation between year-end points. */
export function solvePaybackYears(inputs: SolarBatteryInputs): number | null {
  const points = cashFlowSeries(inputs);
  const first = points[0]!;
  if (first.cumulative >= 0) return 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    if (prev.cumulative < 0 && curr.cumulative >= 0) {
      const span = curr.cumulative - prev.cumulative;
      if (span === 0) return curr.year;
      return prev.year + -prev.cumulative / span;
    }
  }
  return null;
}

export function sensitivitySweep(
  inputs: SolarBatteryInputs,
  c: SolarBatteryConstants = SOLAR_BATTERY_DEFAULTS,
): SensitivityPoint[] {
  const points: SensitivityPoint[] = [];
  for (let pct = c.sweepStartPct; pct <= c.sweepEndPct; pct += c.sweepStepPct) {
    const swept: SolarBatteryInputs = { ...inputs, rateEscalationPct: pct };
    points.push({ rateEscalationPct: pct, paybackYears: solvePaybackYears(swept) });
  }
  return points;
}

// ---------- validation ----------

const NUMERIC_FIELDS: readonly (keyof SolarBatteryInputs)[] = [
  'solarSizeKw',
  'solarCostPerWatt',
  'solarTotalCost',
  'batteryCapacityKwh',
  'batteryCostPerKwh',
  'batteryTotalCost',
  'softCostsPct',
  'softCostsFlat',
  'federalItcPct',
  'stateRebate',
  'downPaymentPct',
  'loanRatePct',
  'loanTermYears',
  'indexFundReturnPct',
  'annualUsageKwh',
  'utilityRatePerKwh',
  'rateEscalationPct',
  'productionPerKw',
  'selfConsumptionPct',
  'netMeteringPct',
  'systemDegradationPct',
  'analysisYears',
];

export function validateSolarBatteryInputs(
  inputs: SolarBatteryInputs,
): Partial<Record<keyof SolarBatteryInputs, string>> {
  const errors: Partial<Record<keyof SolarBatteryInputs, string>> = {};
  for (const field of NUMERIC_FIELDS) {
    const value = inputs[field];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors[field] = `${field} must be a finite number.`;
    }
  }
  if (inputs.solarSizeKw < 0) errors.solarSizeKw = 'solarSizeKw must be zero or greater.';
  if (inputs.batteryCapacityKwh < 0) {
    errors.batteryCapacityKwh = 'batteryCapacityKwh must be zero or greater.';
  }
  if (inputs.analysisYears <= 0 || inputs.analysisYears > 40) {
    errors.analysisYears = 'analysisYears must be between 1 and 40.';
  }
  if (inputs.loanTermYears < 0 || inputs.loanTermYears > 40) {
    errors.loanTermYears = 'loanTermYears must be between 0 and 40.';
  }
  if (inputs.financeMode !== 'cash' && inputs.financeMode !== 'loan') {
    errors.financeMode = 'financeMode must be cash or loan.';
  }
  if (inputs.solarCostMode !== 'perWatt' && inputs.solarCostMode !== 'total') {
    errors.solarCostMode = 'solarCostMode must be perWatt or total.';
  }
  if (inputs.batteryCostMode !== 'perKwh' && inputs.batteryCostMode !== 'total') {
    errors.batteryCostMode = 'batteryCostMode must be perKwh or total.';
  }
  if (inputs.softCostsMode !== 'percent' && inputs.softCostsMode !== 'flat') {
    errors.softCostsMode = 'softCostsMode must be percent or flat.';
  }
  return errors;
}

// ---------- top-level entry ----------

export function computeSolarBattery(
  inputs: SolarBatteryInputs,
  c: SolarBatteryConstants = SOLAR_BATTERY_DEFAULTS,
): ComputeSolarBatteryResult {
  const errors = validateSolarBatteryInputs(inputs);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const { hardwareCost, grossCost, itcAmount, netCost } = systemCost(inputs);
  const { upfrontCash, loanAmount, annualDebtService } = financeDetails(inputs, netCost);
  const cashFlowOverTime = cashFlowSeries(inputs);
  const indexFundOverTime = indexFundSeries(inputs);
  const annualBreakdown = annualBreakdownSeries(inputs, c);
  const sensitivity = sensitivitySweep(inputs, c);
  const paybackYears = solvePaybackYears(inputs);
  const year1Savings = annualBillSavings(inputs, 1);
  const annualProduction = annualProductionKwh(inputs, 1);
  const lifetimeNetProfit = cashFlowOverTime[cashFlowOverTime.length - 1]!.cumulative;
  const indexFundGain = indexFundOverTime[indexFundOverTime.length - 1]!.cumulative;
  const roiPct = netCost > 0 ? (lifetimeNetProfit / netCost) * 100 : 0;

  return {
    ok: true,
    result: {
      hardwareCost,
      grossCost,
      itcAmount,
      netCost,
      upfrontCash,
      loanAmount,
      annualDebtService,
      year1Savings,
      annualProductionKwh: annualProduction,
      paybackYears,
      lifetimeNetProfit,
      roiPct,
      cashFlowOverTime,
      indexFundOverTime,
      indexFundGain,
      solarBeatsIndexFund: lifetimeNetProfit > indexFundGain,
      annualBreakdown,
      sensitivity,
    },
  };
}
