// Pure domain for the Rent vs Sell calculator.
//
// Solves for the breakeven sale price S at which:
//   sellWealth(S, N) == rentWealth(S, N)
//
// where N is the holding period. The sell path invests net after-tax proceeds
// at the market rate for N years; the rent path holds the home N years,
// reinvests annual cash flow + depreciation tax shield, then sells at the
// appreciated price minus commission, closing, depreciation recapture, and
// LTCG (conditional on the Section 121 window).

import { RENT_SELL_DEFAULTS } from './constants';
import type { RentSellConstants } from './constants';

export type S121Mode = 'none' | 'single' | 'mfj';

export type RentSellInputs = {
  // Property
  mortgageBalance: number;
  mortgageRatePct: number;
  monthlyPI: number;
  /** Today's sale price — focal "what-if" knob and starting home value. */
  salePrice: number;
  appRatePct: number;
  // Rental
  rent: number;
  taxesMonthly: number;
  insuranceMonthly: number;
  maintenancePctYr: number;
  vacancyPct: number;
  managed: boolean;
  managedPct: number;
  accountingAnnual: number;
  marginalTaxPct: number;
  // Sale costs / cap gain
  purchasePrice: number;
  commissionPct: number;
  closingPct: number;
  s121: S121Mode;
  ltcgPct: number;
  landValue: number;
  // Investment
  invRatePct: number;
  holdingYears: number;
  // Section 121 timeline
  moveoutYear: number;
};

export type WealthPoint = { year: number; sellWealth: number; rentWealth: number };
export type CashflowPoint = { rent: number; managedCf: number; selfCf: number };
export type SensitivityPoint = { appRatePct: number; rentMinusSellAtN: number };
export type Section121 = {
  moveoutYear: number;
  deadlineYear: number;
  yearsLeft: number;
  progressPct: number;
  urgency: 'safe' | 'warning' | 'critical';
  message: string;
};

export type RentSellOutput = {
  fixedCarrying: number;
  monthlyCashflow: number;
  breakEvenRent: number;
  /** Breakeven sale price S* such that sellWealth(S*) == rentWealth(S*). */
  breakevenSalePrice: number | null;
  /** Whether the current `salePrice` favors selling at year N. */
  sellBeatsRent: boolean;
  /** sellWealth(salePrice, N) − rentWealth(salePrice, N). */
  sellMinusRentAtN: number;
  cashflowVsRent: CashflowPoint[];
  wealthOverTime: WealthPoint[];
  sensitivity: SensitivityPoint[];
  section121: Section121;
};

export type ComputeRentSellResult =
  | { ok: true; result: RentSellOutput }
  | { ok: false; errors: Partial<Record<keyof RentSellInputs, string>> };

// ---------- carrying-cost & cash-flow primitives ----------

export function fixedCarryingCost(inputs: RentSellInputs): number {
  const maintMonthly = (inputs.maintenancePctYr / 100) * inputs.salePrice / 12;
  return inputs.monthlyPI + inputs.taxesMonthly + inputs.insuranceMonthly + maintMonthly;
}

export function monthlyCashflow(inputs: RentSellInputs): number {
  const mgmt = inputs.managed ? (inputs.managedPct / 100) * inputs.rent : 0;
  const vacancy = (inputs.vacancyPct / 100) * inputs.rent;
  const accountingMonthly = inputs.accountingAnnual / 12;
  return inputs.rent - fixedCarryingCost(inputs) - mgmt - vacancy - accountingMonthly;
}

export function breakEvenRent(inputs: RentSellInputs): number {
  const retainedRate = inputs.managed
    ? 1 - inputs.managedPct / 100 - inputs.vacancyPct / 100
    : 1 - inputs.vacancyPct / 100;
  if (retainedRate <= 0) return Number.POSITIVE_INFINITY;
  const fixed = fixedCarryingCost(inputs) + inputs.accountingAnnual / 12;
  return fixed / retainedRate;
}

export function remainingBalance(months: number, inputs: RentSellInputs): number {
  if (months <= 0) return inputs.mortgageBalance;
  let balance = inputs.mortgageBalance;
  const monthlyRate = inputs.mortgageRatePct / 100 / 12;
  for (let m = 0; m < months; m++) {
    const principalPaid = inputs.monthlyPI - balance * monthlyRate;
    balance -= principalPaid;
    if (balance <= 0) return 0;
  }
  return Math.max(0, balance);
}

// ---------- Section 121 helpers ----------

function s121ExclusionAmount(mode: S121Mode, c: RentSellConstants): number {
  if (mode === 'single') return c.s121Single;
  if (mode === 'mfj') return c.s121MFJ;
  return 0;
}

function computeSection121(
  moveoutYear: number,
  c: RentSellConstants,
): Section121 {
  const deadlineYear = moveoutYear + 3;
  const yearsLeft = deadlineYear - c.currentYear;
  const elapsed = Math.max(0, c.currentYear - moveoutYear);
  const progressPct = Math.min(100, Math.max(0, (elapsed / 3) * 100));
  let urgency: Section121['urgency'];
  let message: string;
  if (yearsLeft <= 1) {
    urgency = 'critical';
    message =
      "Less than 1 year remaining on the exclusion window. Sell soon or you'll owe up to ~$37k in capital gains tax.";
  } else if (yearsLeft <= 2) {
    urgency = 'warning';
    message = `~${yearsLeft} years remaining. Don't let renting drift past the deadline.`;
  } else {
    urgency = 'safe';
    message = `${yearsLeft} years remaining. You have time — but keep the ${deadlineYear} deadline in mind if you decide to rent first.`;
  }
  return { moveoutYear, deadlineYear, yearsLeft, progressPct, urgency, message };
}

// ---------- Sell-and-invest path ----------

function sellPathWealth(
  salePrice: number,
  inputs: RentSellInputs,
  years: number,
  c: RentSellConstants,
): number {
  const commission = inputs.commissionPct / 100;
  const closing = inputs.closingPct / 100;
  const ltcg = inputs.ltcgPct / 100;
  const grossProceeds = salePrice * (1 - commission - closing) - inputs.mortgageBalance;
  const capitalGain = salePrice - inputs.purchasePrice;
  const exclusion = s121ExclusionAmount(inputs.s121, c);
  const taxableGain = Math.max(0, capitalGain - exclusion);
  const afterTaxProceeds = grossProceeds - taxableGain * ltcg;
  if (years <= 0) return afterTaxProceeds;
  const r = inputs.invRatePct / 100;
  const fv = afterTaxProceeds * Math.pow(1 + r, years);
  // Liquidate stock at year N: LTCG only on the gain over the basis (afterTaxProceeds).
  const stockGain = Math.max(0, fv - afterTaxProceeds);
  return fv - stockGain * ltcg;
}

// ---------- Keep-as-rental path ----------

function rentPathWealth(
  startValue: number,
  inputs: RentSellInputs,
  years: number,
  c: RentSellConstants,
): number {
  const cfMonthly = monthlyCashflow({ ...inputs, salePrice: startValue });
  const cfAnnual = cfMonthly * 12;
  const annualRent = inputs.rent * 12;
  const marginalRate = inputs.marginalTaxPct / 100;
  const invRate = inputs.invRatePct / 100;
  const appRate = inputs.appRatePct / 100;
  const depreciableBasis = Math.max(0, startValue - inputs.landValue);
  const annualDepreciation = depreciableBasis / c.depreciationYears;
  // Tax shield capped at the rental income for the year (proxy for passive-activity limit).
  const annualTaxShield = Math.min(annualDepreciation, annualRent) * marginalRate;

  if (years <= 0) return startValue - inputs.mortgageBalance;

  // Reinvested cash-flow + tax-shield stack, year y compounds for (N-y) years.
  let reinvestedStack = 0;
  for (let y = 1; y <= years; y++) {
    const contribution = cfAnnual + annualTaxShield;
    reinvestedStack += contribution * Math.pow(1 + invRate, years - y);
  }

  const finalHomeValue = startValue * Math.pow(1 + appRate, years);
  const commission = inputs.commissionPct / 100;
  const closing = inputs.closingPct / 100;
  const grossSale = finalHomeValue * (1 - commission - closing);
  const remainingDebt = remainingBalance(years * 12, inputs);
  const accumulatedDepreciation = Math.min(depreciableBasis, annualDepreciation * years);
  const recapture = accumulatedDepreciation * (c.recapturePct / 100);

  // Section 121 exclusion applies only if sold within 3 years of move-out.
  const sellCalendarYear = c.currentYear + years;
  const s121Available =
    inputs.s121 !== 'none' && sellCalendarYear <= inputs.moveoutYear + 3;
  const exclusion = s121Available ? s121ExclusionAmount(inputs.s121, c) : 0;
  const capitalGain = Math.max(0, finalHomeValue - inputs.purchasePrice);
  const taxableGain = Math.max(0, capitalGain - exclusion);
  const ltcg = taxableGain * (inputs.ltcgPct / 100);

  const afterTaxSale = grossSale - remainingDebt - recapture - ltcg;
  return afterTaxSale + reinvestedStack;
}

// ---------- Breakeven solver (bisection) ----------

function diffAt(price: number, inputs: RentSellInputs, c: RentSellConstants): number {
  const N = Math.max(0, Math.floor(inputs.holdingYears));
  return (
    sellPathWealth(price, { ...inputs, salePrice: price }, N, c) -
    rentPathWealth(price, { ...inputs, salePrice: price }, N, c)
  );
}

export function solveBreakevenSalePrice(
  inputs: RentSellInputs,
  c: RentSellConstants = RENT_SELL_DEFAULTS,
): number | null {
  let lo = c.solverMinPrice;
  let hi = c.solverMaxPrice;
  const fLo = diffAt(lo, inputs, c);
  const fHi = diffAt(hi, inputs, c);
  if (!Number.isFinite(fLo) || !Number.isFinite(fHi)) return null;
  if (fLo === 0) return lo;
  if (fHi === 0) return hi;
  if (Math.sign(fLo) === Math.sign(fHi)) return null; // no sign change in range

  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const fMid = diffAt(mid, inputs, c);
    if (Math.abs(fMid) < 1 || hi - lo < 1) return Math.round(mid);
    if (Math.sign(fMid) === Math.sign(fLo)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return Math.round((lo + hi) / 2);
}

// ---------- Validation ----------

const NUMERIC_FIELDS: readonly (keyof RentSellInputs)[] = [
  'mortgageBalance',
  'mortgageRatePct',
  'monthlyPI',
  'salePrice',
  'appRatePct',
  'rent',
  'taxesMonthly',
  'insuranceMonthly',
  'maintenancePctYr',
  'vacancyPct',
  'managedPct',
  'accountingAnnual',
  'marginalTaxPct',
  'purchasePrice',
  'commissionPct',
  'closingPct',
  'ltcgPct',
  'landValue',
  'invRatePct',
  'holdingYears',
  'moveoutYear',
];

export function validateRentSellInputs(
  inputs: RentSellInputs,
): Partial<Record<keyof RentSellInputs, string>> {
  const errors: Partial<Record<keyof RentSellInputs, string>> = {};
  for (const field of NUMERIC_FIELDS) {
    const value = inputs[field];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors[field] = `${field} must be a finite number.`;
    }
  }
  if (inputs.rent < 0) errors.rent = 'rent must be zero or greater.';
  if (inputs.salePrice <= 0) errors.salePrice = 'salePrice must be greater than zero.';
  if (inputs.holdingYears < 0 || inputs.holdingYears > 50) {
    errors.holdingYears = 'holdingYears must be between 0 and 50.';
  }
  if (typeof inputs.managed !== 'boolean') {
    errors.managed = 'managed must be true or false.';
  }
  if (inputs.s121 !== 'none' && inputs.s121 !== 'single' && inputs.s121 !== 'mfj') {
    errors.s121 = 's121 must be none, single, or mfj.';
  }
  return errors;
}

// ---------- Top-level entry ----------

export function computeRentSell(
  inputs: RentSellInputs,
  c: RentSellConstants = RENT_SELL_DEFAULTS,
): ComputeRentSellResult {
  const errors = validateRentSellInputs(inputs);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const N = Math.max(0, Math.floor(inputs.holdingYears));
  const fixedCarrying = fixedCarryingCost(inputs);
  const cf = monthlyCashflow(inputs);
  const beR = breakEvenRent(inputs);

  // Chart 1: cashflow over rent range
  const cashflowVsRent: CashflowPoint[] = [];
  for (let r = 1200; r <= 3200; r += 50) {
    cashflowVsRent.push({
      rent: r,
      managedCf: monthlyCashflow({ ...inputs, rent: r, managed: true }),
      selfCf: monthlyCashflow({ ...inputs, rent: r, managed: false }),
    });
  }

  // Chart 2: wealth over the holding period using full sell- and rent-path math
  const wealthOverTime: WealthPoint[] = [];
  for (let yr = 0; yr <= N; yr++) {
    wealthOverTime.push({
      year: yr,
      sellWealth: sellPathWealth(inputs.salePrice, inputs, yr, c),
      rentWealth: rentPathWealth(inputs.salePrice, inputs, yr, c),
    });
  }

  // Chart 3: rent minus sell at year N as appreciation rate sweeps 0..7%
  const sensitivity: SensitivityPoint[] = [];
  for (let ap = 0; ap <= 7; ap++) {
    const sweepInputs = { ...inputs, appRatePct: ap };
    const sell = sellPathWealth(inputs.salePrice, sweepInputs, N, c);
    const rent = rentPathWealth(inputs.salePrice, sweepInputs, N, c);
    sensitivity.push({ appRatePct: ap, rentMinusSellAtN: rent - sell });
  }

  const breakeven = solveBreakevenSalePrice(inputs, c);
  const last = wealthOverTime[wealthOverTime.length - 1]!;
  const sellMinusRentAtN = last.sellWealth - last.rentWealth;
  const sellBeatsRent = sellMinusRentAtN > 0;

  return {
    ok: true,
    result: {
      fixedCarrying,
      monthlyCashflow: cf,
      breakEvenRent: beR,
      breakevenSalePrice: breakeven,
      sellBeatsRent,
      sellMinusRentAtN,
      cashflowVsRent,
      wealthOverTime,
      sensitivity,
      section121: computeSection121(inputs.moveoutYear, c),
    },
  };
}
