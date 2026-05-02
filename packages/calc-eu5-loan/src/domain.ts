// Pure domain for the EU5 Loan Break-Even calculator.
// Behavior reference: reference/html-originals/eu5-loan-calculator.html.
//
// Note: EU5 is one of the three pure form/calc calcs. The original renders
// "Net Profit Over Time" as a numeric horizon table, not a chart — no
// @calc/charts consumption.

export type RateType = 'annual' | 'total';

export type Eu5Inputs = {
  /** Building cost in gold (g). */
  cost: number;
  /** Loan principal (defaults to cost when omitted in UI; here it's required). */
  loanAmount: number;
  /** Stated interest rate, percent (interpretation depends on rateType). */
  ratePct: number;
  rateType: RateType;
  /** Loan term in months. */
  months: number;
  /** Cumulative income earned in the first 36 months (used to back-derive monthly base). */
  profit3yr: number;
  /** Monthly savings rate (gold/month) — drives the Wait alternative. */
  savings: number;
  /** Annual income compounding multiplier (e.g. 1.05 = 5% annual growth). */
  compoundAnnual: number;
  /** Horizon for ROI / wait-vs-borrow comparison, in years. */
  horizonYears: number;
  /** "Gifted" portion of the loan — interest accrues on full loanAmount but only (loanAmount − gift) is usable. */
  gift: number;
};

export type HorizonRow = {
  months: number;
  income: number;
  interest: number;
  net: number;
  status: 'profitable' | 'breakeven' | 'loss';
};

export type Verdict = 'no-input' | 'strong' | 'viable' | 'marginal' | 'not-worth-it';

export type Eu5Output = {
  loanInterest: number;
  usableCapital: number;
  realCost: number;
  effectiveRatePct: number;
  effectiveInterest: number;

  monthlyBase: number;
  breakEvenMin: number;
  surplusDuringLoan: number;
  paybackMonths: number;
  roiAtLoanPct: number;
  roiAtHorizonPct: number;

  verdict: Verdict;
  horizonTable: HorizonRow[];

  // Wait vs borrow
  waitMonths: number;
  borrowTotalIncome: number;
  waitTotalIncome: number;
  borrowNet: number;
  waitNet: number;
  borrowBetter: boolean;
  breakEvenIncomePerMonth: number;
};

export type ComputeEu5Result =
  | { ok: true; result: Eu5Output }
  | { ok: false; errors: Partial<Record<keyof Eu5Inputs, string>> };

/** Sum of compound-growth multipliers over `totalMonths` (income per 1g/mo base). */
export function sumFactors(compoundAnnual: number, totalMonths: number): number {
  if (totalMonths <= 0) return 0;
  let total = 0;
  let current = 1;
  for (let m = 1; m <= totalMonths; m++) {
    total += current;
    if (m % 12 === 0) current *= compoundAnnual;
  }
  return total;
}

/** Total income with annual compounding from monthlyBase. */
export function calcIncome(monthlyBase: number, compoundAnnual: number, totalMonths: number): number {
  return monthlyBase * sumFactors(compoundAnnual, totalMonths);
}

/** Back-derives a monthly base from a 3-year cumulative income at a given compounding rate. */
export function monthlyBaseFromProfit3yr(profit3yr: number, compoundAnnual: number): number {
  if (profit3yr <= 0) return 0;
  const sf = sumFactors(compoundAnnual, 36);
  return sf > 0 ? profit3yr / sf : 0;
}

const NUMERIC_FIELDS: readonly (keyof Eu5Inputs)[] = [
  'cost',
  'loanAmount',
  'ratePct',
  'months',
  'profit3yr',
  'savings',
  'compoundAnnual',
  'horizonYears',
  'gift',
];

export function validateEu5Inputs(inputs: Eu5Inputs): Partial<Record<keyof Eu5Inputs, string>> {
  const errors: Partial<Record<keyof Eu5Inputs, string>> = {};
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
  if (inputs.rateType !== 'annual' && inputs.rateType !== 'total') {
    errors.rateType = 'rateType must be "annual" or "total".';
  }
  if (inputs.months <= 0) {
    errors.months = 'months must be greater than zero.';
  }
  return errors;
}

function statusFor(net: number): HorizonRow['status'] {
  if (net > 0) return 'profitable';
  if (net > -10) return 'breakeven';
  return 'loss';
}

function computeVerdict(profit3yr: number, monthlyBase: number, breakEvenMin: number): Verdict {
  if (profit3yr === 0) return 'no-input';
  if (monthlyBase >= breakEvenMin * 3) return 'strong';
  if (monthlyBase >= breakEvenMin) return 'viable';
  if (monthlyBase >= breakEvenMin * 0.5) return 'marginal';
  return 'not-worth-it';
}

export function computeEu5(inputs: Eu5Inputs): ComputeEu5Result {
  const errors = validateEu5Inputs(inputs);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const loanAmount = Math.max(1, inputs.loanAmount);
  const loanInterest =
    inputs.rateType === 'annual'
      ? loanAmount * (inputs.ratePct / 100) * (inputs.months / 12)
      : loanAmount * (inputs.ratePct / 100);

  const usable = Math.max(1, loanAmount - inputs.gift);
  const realCost = loanInterest + inputs.gift;

  const effectiveRatePct =
    inputs.rateType === 'annual'
      ? (realCost / usable / (inputs.months / 12)) * 100
      : (realCost / usable) * 100;

  const effectiveInterest =
    inputs.rateType === 'annual'
      ? inputs.cost * (effectiveRatePct / 100) * (inputs.months / 12)
      : inputs.cost * (effectiveRatePct / 100);

  const monthlyBase = monthlyBaseFromProfit3yr(inputs.profit3yr, inputs.compoundAnnual);
  const breakEvenMin = inputs.months > 0 ? effectiveInterest / inputs.months : 0;

  const incomeDuringLoan = calcIncome(monthlyBase, inputs.compoundAnnual, inputs.months);
  const surplus = incomeDuringLoan - effectiveInterest;

  // payback: first month where running income covers effective interest
  let paybackMonths = Number.POSITIVE_INFINITY;
  if (monthlyBase > 0 && effectiveInterest > 0) {
    let running = 0;
    let current = monthlyBase;
    for (let m = 1; m <= 9999; m++) {
      running += current;
      if (m % 12 === 0) current *= inputs.compoundAnnual;
      if (running >= effectiveInterest) {
        paybackMonths = m;
        break;
      }
    }
  } else if (effectiveInterest <= 0) {
    paybackMonths = 0;
  }

  const horizons = [12, 24, 60, 120, 240];
  const horizonTable: HorizonRow[] = horizons.map((h) => {
    const income = calcIncome(monthlyBase, inputs.compoundAnnual, h);
    const interest = h >= inputs.months ? effectiveInterest : effectiveInterest * (h / inputs.months);
    const net = income - interest;
    return { months: h, income, interest, net, status: statusFor(net) };
  });

  const horizonMonths = Math.round(Math.max(1, inputs.horizonYears) * 12);
  const roiAtLoanPct = inputs.cost > 0 ? (surplus / inputs.cost) * 100 : 0;
  const incomeAtHorizon = calcIncome(monthlyBase, inputs.compoundAnnual, horizonMonths);
  const roiAtHorizonPct = inputs.cost > 0 ? ((incomeAtHorizon - effectiveInterest) / inputs.cost) * 100 : 0;

  const verdict = computeVerdict(inputs.profit3yr, monthlyBase, breakEvenMin);

  // Wait vs borrow
  const waitMonths = inputs.savings > 0 ? Math.ceil(inputs.cost / inputs.savings) : Number.POSITIVE_INFINITY;
  const borrowTotalIncome = calcIncome(monthlyBase, inputs.compoundAnnual, horizonMonths);
  const waitTotalIncome = Number.isFinite(waitMonths)
    ? calcIncome(monthlyBase, inputs.compoundAnnual, Math.max(0, horizonMonths - waitMonths))
    : 0;
  const borrowNet = borrowTotalIncome - effectiveInterest;
  const waitNet = waitTotalIncome;
  const borrowBetter = borrowNet > waitNet;

  const sfBorrow = sumFactors(inputs.compoundAnnual, horizonMonths);
  const sfWait = Number.isFinite(waitMonths)
    ? sumFactors(inputs.compoundAnnual, Math.max(0, horizonMonths - waitMonths))
    : 0;
  const sfDiff = sfBorrow - sfWait;
  const breakEvenIncomePerMonth = sfDiff > 0 ? effectiveInterest / sfDiff : Number.POSITIVE_INFINITY;

  return {
    ok: true,
    result: {
      loanInterest,
      usableCapital: usable,
      realCost,
      effectiveRatePct,
      effectiveInterest,
      monthlyBase,
      breakEvenMin,
      surplusDuringLoan: surplus,
      paybackMonths,
      roiAtLoanPct,
      roiAtHorizonPct,
      verdict,
      horizonTable,
      waitMonths,
      borrowTotalIncome,
      waitTotalIncome,
      borrowNet,
      waitNet,
      borrowBetter,
      breakEvenIncomePerMonth,
    },
  };
}
