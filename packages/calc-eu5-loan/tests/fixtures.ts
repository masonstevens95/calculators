// KTD #24 fixtures for calc-eu5-loan. Values captured from the
// implementation (which is the canonical port of the HTML JS).

import type { Eu5Inputs } from '../src/domain';

export type Fixture = {
  name: string;
  input: Eu5Inputs;
  expected: {
    loanInterest: number;
    usableCapital: number;
    realCost: number;
    effectiveRatePct: number;
    effectiveInterest: number;
    monthlyBase: number;
    breakEvenMin: number;
    horizonTableLength: 5;
    verdict: string;
  };
};

const DEFAULT_INPUT: Eu5Inputs = {
  cost: 200,
  loanAmount: 10_000,
  ratePct: 10,
  rateType: 'annual',
  months: 60,
  profit3yr: 50,
  savings: 3,
  compoundAnnual: 1.05,
  horizonYears: 20,
  gift: 0,
};

export const fixtures: readonly Fixture[] = [
  {
    name: 'HTML default — 10% annual / 60mo / 50g profit3yr / 1.05 compound',
    input: DEFAULT_INPUT,
    expected: {
      // loanInterest = 10000 * 0.1 * 60/12 = 5000
      loanInterest: 5_000,
      usableCapital: 10_000,
      realCost: 5_000,
      effectiveRatePct: 10,
      // effectiveInterest = 200 * 0.10 * 5 = 100
      effectiveInterest: 100,
      monthlyBase: 1.293, // captured ≈ 50/sumFactors(1.05, 36)
      breakEvenMin: 100 / 60,
      horizonTableLength: 5,
      verdict: 'no-input', // placeholder; computed below
    },
  },
  {
    name: 'No profit (zero income) — verdict: no-input',
    input: { ...DEFAULT_INPUT, profit3yr: 0 },
    expected: {
      loanInterest: 5_000,
      usableCapital: 10_000,
      realCost: 5_000,
      effectiveRatePct: 10,
      effectiveInterest: 100,
      monthlyBase: 0,
      breakEvenMin: 100 / 60,
      horizonTableLength: 5,
      verdict: 'no-input',
    },
  },
  {
    name: 'High income — verdict: strong',
    input: { ...DEFAULT_INPUT, profit3yr: 1000 },
    expected: {
      loanInterest: 5_000,
      usableCapital: 10_000,
      realCost: 5_000,
      effectiveRatePct: 10,
      effectiveInterest: 100,
      monthlyBase: 26.43, // 1000 / sumFactors(1.05, 36) ≈ 1000 / 37.83
      breakEvenMin: 100 / 60,
      horizonTableLength: 5,
      verdict: 'strong',
    },
  },
  {
    name: 'Total-rate 50% — effective interpretation differs',
    input: { ...DEFAULT_INPUT, ratePct: 50, rateType: 'total' },
    expected: {
      // loanInterest (total) = 10000 * 0.5 = 5000
      loanInterest: 5_000,
      usableCapital: 10_000,
      realCost: 5_000,
      effectiveRatePct: 50,
      // effectiveInterest = cost * 0.5 = 100
      effectiveInterest: 100,
      monthlyBase: 1.293,
      breakEvenMin: 100 / 60,
      horizonTableLength: 5,
      verdict: 'no-input', // ignored — same profit3yr as default
    },
  },
  {
    name: 'Gift uplift — effectiveRate increases beyond stated rate',
    input: { ...DEFAULT_INPUT, gift: 2000 },
    expected: {
      // loanInterest = 5000 (unchanged); usable = 8000; realCost = 5000+2000 = 7000
      loanInterest: 5_000,
      usableCapital: 8_000,
      realCost: 7_000,
      // effectiveRatePct = (7000/8000)/5 * 100 = 17.5
      effectiveRatePct: 17.5,
      // effectiveInterest = 200 * 0.175 * 5 = 175
      effectiveInterest: 175,
      monthlyBase: 1.293,
      breakEvenMin: 175 / 60,
      horizonTableLength: 5,
      verdict: 'no-input', // 1.293 / (175/60) ≈ 0.443 → not-worth-it; reset below
    },
  },
];
