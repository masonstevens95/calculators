// Pure domain for the Rent vs Sell calculator.

import { RENT_SELL_DEFAULTS } from './constants';
import type { RentSellConstants } from './constants';

export type RentSellInputs = {
  /** Monthly rent in dollars. */
  rent: number;
  /** Property-management mode. */
  managed: boolean;
  /** Annual home appreciation rate (decimal, e.g. 0.02 = 2%). */
  appRate: number;
  /** Annual investment return on sale proceeds (decimal). */
  invRate: number;
  /** Calendar year you'd move out (drives Section 121 timeline). */
  moveoutYear: number;
};

export type WealthPoint = { year: number; sellWealth: number; rentWealth: number };
export type CashflowPoint = { rent: number; managedCf: number; selfCf: number };
export type SensitivityPoint = { appRatePct: number; rentMinusSellAt10: number };
export type Section121 = {
  moveoutYear: number;
  deadlineYear: number;
  yearsLeft: number;
  /** 0–100. */
  progressPct: number;
  urgency: 'safe' | 'warning' | 'critical';
  message: string;
};

export type RentSellOutput = {
  fixedCarrying: number;
  monthlyCashflow: number;
  breakEvenRent: number;
  cashflowVsRent: CashflowPoint[];
  wealthOverTime: WealthPoint[];
  sensitivity: SensitivityPoint[];
  rentBeatsSellAt10: boolean;
  rentVsSellAt10Delta: number;
  section121: Section121;
};

export type ComputeRentSellResult =
  | { ok: true; result: RentSellOutput }
  | { ok: false; errors: Partial<Record<keyof RentSellInputs, string>> };

export function fixedCarryingCost(c: RentSellConstants = RENT_SELL_DEFAULTS): number {
  return c.monthlyPI + c.taxes + c.insurance + c.maintenance;
}

/** Net monthly cash flow at a given rent and management mode. */
export function monthlyCashflow(
  rent: number,
  managed: boolean,
  c: RentSellConstants = RENT_SELL_DEFAULTS,
): number {
  const mgmt = managed ? (c.managedPct / 100) * rent : 0;
  const vacancy = (c.vacancyPct / 100) * rent;
  return rent - fixedCarryingCost(c) - mgmt - vacancy;
}

/** Break-even rent (cashflow = 0) given the management mode. */
export function breakEvenRent(
  managed: boolean,
  c: RentSellConstants = RENT_SELL_DEFAULTS,
): number {
  const retainedRate = managed
    ? 1 - c.managedPct / 100 - c.vacancyPct / 100
    : 1 - c.vacancyPct / 100;
  return retainedRate > 0 ? fixedCarryingCost(c) / retainedRate : Number.POSITIVE_INFINITY;
}

/** Remaining mortgage balance after `months` of standard amortization. */
export function remainingBalance(
  months: number,
  c: RentSellConstants = RENT_SELL_DEFAULTS,
): number {
  if (months <= 0) return c.balance;
  let balance = c.balance;
  const monthlyRate = c.rate / 12;
  for (let m = 0; m < months; m++) {
    const principalPaid = c.monthlyPI - balance * monthlyRate;
    balance -= principalPaid;
    if (balance <= 0) return 0;
  }
  return Math.max(0, balance);
}

const NUMERIC_FIELDS: readonly (keyof RentSellInputs)[] = [
  'rent',
  'appRate',
  'invRate',
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
  if (typeof inputs.managed !== 'boolean') {
    errors.managed = 'managed must be true or false.';
  }
  return errors;
}

function computeSection121(
  moveoutYear: number,
  c: RentSellConstants = RENT_SELL_DEFAULTS,
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

export function computeRentSell(
  inputs: RentSellInputs,
  c: RentSellConstants = RENT_SELL_DEFAULTS,
): ComputeRentSellResult {
  const errors = validateRentSellInputs(inputs);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const fixedCarrying = fixedCarryingCost(c);
  const cf = monthlyCashflow(inputs.rent, inputs.managed, c);
  const beR = breakEvenRent(inputs.managed, c);

  // Chart 1: cashflow over rent range
  const cashflowVsRent: CashflowPoint[] = [];
  for (let r = 1200; r <= 3200; r += 50) {
    cashflowVsRent.push({
      rent: r,
      managedCf: monthlyCashflow(r, true, c),
      selfCf: monthlyCashflow(r, false, c),
    });
  }

  // Chart 2: wealth over 10 years
  const wealthOverTime: WealthPoint[] = [];
  let cumCf = 0;
  for (let yr = 0; yr <= 10; yr++) {
    const sellWealth = c.netProceeds * Math.pow(1 + inputs.invRate, yr);
    const homeVal = c.homeValue * Math.pow(1 + inputs.appRate, yr);
    const equity = homeVal - remainingBalance(yr * 12, c);
    cumCf += cf * 12;
    const rentWealth = equity + cumCf;
    wealthOverTime.push({ year: yr, sellWealth, rentWealth });
  }

  // Chart 3: sensitivity sweep — appreciation rate 0..7%
  const sensitivity: SensitivityPoint[] = [];
  const sellAt10 = c.netProceeds * Math.pow(1 + inputs.invRate, 10);
  for (let ap = 0; ap <= 7; ap++) {
    const homeVal10 = c.homeValue * Math.pow(1 + ap / 100, 10);
    const equity10 = homeVal10 - remainingBalance(120, c);
    const rentAt10 = equity10 + cf * 12 * 10;
    sensitivity.push({ appRatePct: ap, rentMinusSellAt10: rentAt10 - sellAt10 });
  }

  const last = wealthOverTime[wealthOverTime.length - 1]!;
  const rentVsSellAt10Delta = last.rentWealth - last.sellWealth;
  const rentBeatsSellAt10 = rentVsSellAt10Delta > 0;

  return {
    ok: true,
    result: {
      fixedCarrying,
      monthlyCashflow: cf,
      breakEvenRent: beR,
      cashflowVsRent,
      wealthOverTime,
      sensitivity,
      rentBeatsSellAt10,
      rentVsSellAt10Delta,
      section121: computeSection121(inputs.moveoutYear, c),
    },
  };
}
