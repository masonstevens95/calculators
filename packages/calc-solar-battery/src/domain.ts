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

export type SizingProfile = 'minimal' | 'essentials' | 'bestRoi' | 'totalCoverage' | 'offGrid';

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
  /** Years the panels have already been in service — for a secondhand purchase, shifts the degradation curve forward. */
  panelAgeYears: number;
  // Battery
  batteryCapacityKwh: number;
  batteryCostMode: BatteryCostMode;
  batteryCostPerKwh: number;
  batteryTotalCost: number;
  /** Energy out / energy in for a full charge-discharge cycle. */
  batteryRoundTripEffPct: number;
  // Battery TOU arbitrage — charge at the cheap rate, discharge to avoid the expensive
  // rate. Off by default: it only pays off on a time-of-use rate plan, not a flat rate.
  touArbitrageEnabled: boolean;
  /** Rate paid to charge the battery during the cheapest TOU window. */
  touOffPeakRatePerKwh: number;
  /** Retail rate avoided by discharging instead of buying grid power during the on-peak window. */
  touOnPeakRatePerKwh: number;
  /** Days/year the arbitrage cycle applies — on-peak windows are typically weekdays only. */
  touDaysPerYear: number;
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
  /** Flat $/kWh credit for exported energy — utilities typically pay an avoided-cost rate, well below retail. */
  exportRatePerKwh: number;
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
  arbitrageValue: number;
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
  /** First-year TOU arbitrage value — 0 unless touArbitrageEnabled. */
  year1ArbitrageValue: number;
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

/**
 * Solar production for a given analysis year (1-indexed), net of cumulative panel degradation.
 * panelAgeYears shifts the degradation curve forward — a secondhand panel already carries
 * years of prior wear, so year 1 here starts partway down the same degradation curve a new
 * panel would follow.
 */
export function annualProductionKwh(inputs: SolarBatteryInputs, year: number): number {
  const totalAge = Math.max(0, inputs.panelAgeYears) + year - 1;
  const degradationFactor = Math.pow(1 - inputs.systemDegradationPct / 100, totalAge);
  return inputs.solarSizeKw * inputs.productionPerKw * degradationFactor;
}

/** Utility bill offset: self-consumed kWh at the escalated retail rate + exported kWh at the flat sell-back rate. */
export function annualBillSavings(inputs: SolarBatteryInputs, year: number): number {
  const production = annualProductionKwh(inputs, year);
  const selfConsumedKwh = production * (inputs.selfConsumptionPct / 100);
  const exportedKwh = production - selfConsumedKwh;
  const escalatedRate =
    inputs.utilityRatePerKwh * Math.pow(1 + inputs.rateEscalationPct / 100, year - 1);
  return selfConsumedKwh * escalatedRate + exportedKwh * inputs.exportRatePerKwh;
}

/**
 * Value of cycling the battery on a time-of-use rate: charge from the grid during the
 * cheap off-peak window, discharge to avoid buying grid power during the expensive
 * on-peak window. Independent of solar — this is what a battery earns on its own.
 *
 * Simplifying assumptions: one full charge/discharge cycle per applicable day, using the
 * full battery capacity, with no contention from backup or solar self-consumption use of
 * the same capacity. Charging cost is grid power at the off-peak rate divided by
 * round-trip efficiency (you must buy more than you get back); discharge value is the
 * on-peak retail rate avoided. Both rates escalate with rateEscalationPct like the main
 * utility rate. Requires enrollment in a TOU rate plan — off by default.
 */
export function annualArbitrageValue(inputs: SolarBatteryInputs, year: number): number {
  if (!inputs.touArbitrageEnabled || inputs.batteryCapacityKwh <= 0) return 0;
  const escalation = Math.pow(1 + inputs.rateEscalationPct / 100, year - 1);
  const efficiency = Math.max(0.01, inputs.batteryRoundTripEffPct / 100);
  const chargeCostPerKwh = (inputs.touOffPeakRatePerKwh * escalation) / efficiency;
  const dischargeValuePerKwh = inputs.touOnPeakRatePerKwh * escalation;
  const netValuePerKwhCycled = Math.max(0, dischargeValuePerKwh - chargeCostPerKwh);
  return netValuePerKwhCycled * inputs.batteryCapacityKwh * inputs.touDaysPerYear;
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
    const arbitrageValue = annualArbitrageValue(inputs, year);
    const debtService = year <= loanYears ? annualDebtService : 0;
    const net = billSavings + arbitrageValue - debtService;
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
      arbitrageValue: annualArbitrageValue(inputs, year),
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
  'panelAgeYears',
  'batteryCapacityKwh',
  'batteryCostPerKwh',
  'batteryTotalCost',
  'batteryRoundTripEffPct',
  'touOffPeakRatePerKwh',
  'touOnPeakRatePerKwh',
  'touDaysPerYear',
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
  'exportRatePerKwh',
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
  if (inputs.panelAgeYears < 0 || inputs.panelAgeYears > 40) {
    errors.panelAgeYears = 'panelAgeYears must be between 0 and 40.';
  }
  if (inputs.batteryCapacityKwh < 0) {
    errors.batteryCapacityKwh = 'batteryCapacityKwh must be zero or greater.';
  }
  if (inputs.batteryRoundTripEffPct <= 0 || inputs.batteryRoundTripEffPct > 100) {
    errors.batteryRoundTripEffPct = 'batteryRoundTripEffPct must be between 0 and 100.';
  }
  if (inputs.touOffPeakRatePerKwh < 0) {
    errors.touOffPeakRatePerKwh = 'touOffPeakRatePerKwh must be zero or greater.';
  }
  if (inputs.touOnPeakRatePerKwh < 0) {
    errors.touOnPeakRatePerKwh = 'touOnPeakRatePerKwh must be zero or greater.';
  }
  if (inputs.touDaysPerYear < 0 || inputs.touDaysPerYear > 366) {
    errors.touDaysPerYear = 'touDaysPerYear must be between 0 and 366.';
  }
  if (typeof inputs.touArbitrageEnabled !== 'boolean') {
    errors.touArbitrageEnabled = 'touArbitrageEnabled must be true or false.';
  }
  if (inputs.exportRatePerKwh < 0) {
    errors.exportRatePerKwh = 'exportRatePerKwh must be zero or greater.';
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
  const year1ArbitrageValue = annualArbitrageValue(inputs, 1);
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
      year1ArbitrageValue,
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

// ---------- sizing suggestions ----------
//
// Given a house size, estimate solar array (kW) and battery (kWh) sizing for
// four common coverage goals. Usage is estimated from house size via
// SolarBatteryConstants.usagePerSqFtKwh (see constants.ts for sourcing); solar
// size targets a percentage of that usage; battery size targets a number of
// backup days at a fraction of average daily load (whole-house vs
// essential-circuits-only).

export type SizingProfileConfig = {
  label: string;
  description: string;
  /** % of estimated annual usage the solar array should be sized to produce. */
  usageCoveragePct: number;
  /** Days of backup autonomy the battery should be sized to cover. */
  backupDays: number;
  /** Fraction of average daily load the backup targets (1 = whole house). */
  loadFractionForBackup: number;
};

export const SIZING_PROFILES: Record<SizingProfile, SizingProfileConfig> = {
  minimal: {
    label: 'Minimal',
    description: 'Smallest system worth installing: offsets ~30% of usage, a few hours of backup.',
    usageCoveragePct: 30,
    backupDays: 0.25,
    loadFractionForBackup: 0.3,
  },
  essentials: {
    label: 'Essentials',
    description:
      'Offsets ~60% of usage; battery covers key circuits (fridge, wifi, some lights) for about a day.',
    usageCoveragePct: 60,
    backupDays: 1,
    loadFractionForBackup: 0.3,
  },
  bestRoi: {
    label: 'Most cost-effective (best ROI)',
    description:
      'Sized to the self-consumption sweet spot (~85% of usage) with a small backup buffer — optimized for payback, not backup depth.',
    usageCoveragePct: 85,
    backupDays: 0.5,
    loadFractionForBackup: 0.3,
  },
  totalCoverage: {
    label: 'Total coverage',
    description: 'Offsets all usage plus margin; battery covers ~2 days of whole-house backup.',
    usageCoveragePct: 110,
    backupDays: 2,
    loadFractionForBackup: 1,
  },
  offGrid: {
    label: 'Totally off-grid',
    description:
      'Solar oversized for winter/cloudy days (~150% of usage) with ~3 days of whole-house battery autonomy — sized for self-sufficiency, but still grid-tied to sell back excess.',
    usageCoveragePct: 150,
    backupDays: 3,
    loadFractionForBackup: 1,
  },
};

export type SizingSuggestion = {
  estimatedAnnualUsageKwh: number;
  solarSizeKw: number;
  batteryCapacityKwh: number;
};

function roundToTenth(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Suggests solar (kW) and battery (kWh) sizing for a house size + coverage goal. */
export function suggestSystemSizing(
  houseSqFt: number,
  profile: SizingProfile,
  productionPerKw: number,
  c: SolarBatteryConstants = SOLAR_BATTERY_DEFAULTS,
): SizingSuggestion {
  const cfg = SIZING_PROFILES[profile];
  const estimatedAnnualUsageKwh = Math.max(0, houseSqFt) * c.usagePerSqFtKwh;
  const targetProductionKwh = estimatedAnnualUsageKwh * (cfg.usageCoveragePct / 100);
  const solarSizeKw = productionPerKw > 0 ? roundToTenth(targetProductionKwh / productionPerKw) : 0;
  const dailyUsageKwh = estimatedAnnualUsageKwh / 365;
  const batteryCapacityKwh = roundToTenth(dailyUsageKwh * cfg.loadFractionForBackup * cfg.backupDays);

  return {
    estimatedAnnualUsageKwh: Math.round(estimatedAnnualUsageKwh),
    solarSizeKw,
    batteryCapacityKwh,
  };
}
