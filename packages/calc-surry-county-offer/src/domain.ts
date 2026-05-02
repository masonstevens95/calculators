// Pure domain for the Surry County Offer calculator. No React imports —
// the Vitest node environment for domain.test.ts surfaces accidental DOM
// coupling as a test failure.
//
// Behavior reference: reference/html-originals/Surry County Offer Calculator.html

export type OfferInputs = {
  /** Birchwood sale price (input). */
  salePrice: number;
  /** Mortgage payoff. */
  payoff: number;
  /** Realtor commission, percent of sale (e.g. 6 = 6%). */
  realtorPct: number;
  /** Transfer + closing costs on the sell side, percent of sale. */
  transferPct: number;

  /** Offer price for the Surry County purchase. */
  offerPrice: number;
  /** Down payment as a percent of the offer (e.g. 25 = 25%). */
  downPct: number;
  /** Seller concession as a percent of the offer (e.g. 9 = 9%). */
  concPct: number;
  /** Mortgage rate, percent (annual, 30-year fixed). */
  ratePct: number;
  /** Property tax, percent of offer per year. */
  taxRatePct: number;
  /** Insurance, percent of offer per year. */
  insRatePct: number;
  /** Buyer closing costs, percent of offer. */
  closingPct: number;
  /** Equipment budget, dollars. */
  equipment: number;
};

export type ScenarioOutput = {
  /** Mirror of the offerPrice input — convenient for scenario tables. */
  offerPrice: number;
  netProceeds: number;
  downAmt: number;
  loan: number;
  ltvPct: number;
  /** P&I monthly. */
  pi: number;
  /** Property tax monthly. */
  tax: number;
  /** Insurance monthly. */
  ins: number;
  /** PMI monthly (0 when LTV ≤ 80). */
  pmiMo: number;
  /** Total monthly housing payment (P&I + tax + ins + PMI). */
  piti: number;
  concession: number;
  closingAmt: number;
  /** Concession − closing costs (can be negative for the math layer; UI clamps for the cash-summary). */
  repairCash: number;
  /** Net proceeds − down payment. */
  afterDown: number;
  /** afterDown + max(0, repairCash). */
  totalCash: number;
  /** totalCash − equipment budget. */
  reserve: number;
  /** Conventional-loan max concession (%) at this LTV. */
  concessionLimitPct: number;
};

export type ComputeOfferResult =
  | { ok: true; result: ScenarioOutput }
  | { ok: false; errors: Partial<Record<keyof OfferInputs, string>> };

const MORTGAGE_TERM_YEARS = 30;
const PMI_RATE = 0.007;

/**
 * Standard amortization formula: M = P*r*(1+r)^n / ((1+r)^n − 1) where
 * r is monthly rate (annual %/100/12) and n is months. Degenerate at r=0
 * collapses to P/n. Returns 0 for non-positive principal so callers don't
 * have to defend at every site.
 */
export function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  if (principal <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}

export function netProceedsCalc(
  sale: number,
  payoff: number,
  realtorPct: number,
  transferPct: number,
): number {
  return sale - payoff - sale * (realtorPct / 100) - sale * (transferPct / 100);
}

/**
 * Conventional-loan max concession brackets:
 *   LTV ≤ 75%  → 9%
 *   LTV ≤ 80%  → 6%
 *   LTV > 80%  → 3%
 */
export function concessionLimit(ltvPct: number): number {
  if (ltvPct <= 75) return 9;
  if (ltvPct <= 80) return 6;
  return 3;
}

const NUMERIC_FIELDS: readonly (keyof OfferInputs)[] = [
  'salePrice',
  'payoff',
  'realtorPct',
  'transferPct',
  'offerPrice',
  'downPct',
  'concPct',
  'ratePct',
  'taxRatePct',
  'insRatePct',
  'closingPct',
  'equipment',
];

export function validateOfferInputs(
  inputs: OfferInputs,
): Partial<Record<keyof OfferInputs, string>> {
  const errors: Partial<Record<keyof OfferInputs, string>> = {};
  for (const field of NUMERIC_FIELDS) {
    const value = inputs[field];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors[field] = `${field} must be a finite number.`;
      continue;
    }
    if (value < 0) {
      errors[field] = `${field} must be zero or greater.`;
    }
  }
  return errors;
}

export function computeOffer(inputs: OfferInputs): ComputeOfferResult {
  const errors = validateOfferInputs(inputs);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const netProceeds = netProceedsCalc(
    inputs.salePrice,
    inputs.payoff,
    inputs.realtorPct,
    inputs.transferPct,
  );

  const downAmt = inputs.offerPrice * (inputs.downPct / 100);
  const loan = inputs.offerPrice - downAmt;
  const ltvPct = inputs.offerPrice > 0 ? (loan / inputs.offerPrice) * 100 : 0;

  const pi = monthlyPayment(loan, inputs.ratePct, MORTGAGE_TERM_YEARS);
  const tax = (inputs.offerPrice * inputs.taxRatePct) / 100 / 12;
  const ins = (inputs.offerPrice * inputs.insRatePct) / 100 / 12;
  const pmiMo = ltvPct > 80 ? (loan * PMI_RATE) / 12 : 0;
  const piti = pi + tax + ins + pmiMo;

  const concession = inputs.offerPrice * (inputs.concPct / 100);
  const closingAmt = inputs.offerPrice * (inputs.closingPct / 100);
  const repairCash = concession - closingAmt;

  const afterDown = netProceeds - downAmt;
  const totalCash = afterDown + Math.max(0, repairCash);
  const reserve = totalCash - inputs.equipment;

  return {
    ok: true,
    result: {
      offerPrice: inputs.offerPrice,
      netProceeds,
      downAmt,
      loan,
      ltvPct,
      pi,
      tax,
      ins,
      pmiMo,
      piti,
      concession,
      closingAmt,
      repairCash,
      afterDown,
      totalCash,
      reserve,
      concessionLimitPct: concessionLimit(ltvPct),
    },
  };
}
