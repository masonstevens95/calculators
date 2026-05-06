// KTD #24 — canonical input/output pairs derived from the HTML original at
// reference/html-originals/Surry County Offer Calculator.html. Both
// domain.test.ts and the U10 federation contract test consume these.
//
// PITI / monthly-payment values are computed by the same amortization
// formula the original JS uses; assertions tolerate sub-dollar rounding
// via toBeCloseTo. The HTML's hardcoded display values for proceeds,
// loan, ltv, repairCash, totalCash, reserve are exact.

import type { OfferInputs } from '../src/domain';

export type Fixture = {
  name: string;
  input: OfferInputs;
  expected: {
    netProceeds: number;
    downAmt: number;
    loan: number;
    ltvPct: number;
    /** Monthly. Allow ~$1 epsilon. */
    pi: number;
    tax: number;
    ins: number;
    pmiMo: number;
    /** Monthly. Allow ~$2 epsilon. */
    piti: number;
    concession: number;
    closingAmt: number;
    repairCash: number;
    afterDown: number;
    totalCash: number;
    reserve: number;
    concessionLimitPct: number;
  };
};

// Defaults match HTML originals' initial slider/input values exactly.
const DEFAULT_INPUT: OfferInputs = {
  salePrice: 280_000,
  payoff: 163_000,
  realtorPct: 6,
  transferPct: 1,
  offerPrice: 415_000,
  downPct: 25,
  concPct: 9,
  ratePct: 6.75,
  taxRatePct: 0.65,
  insRatePct: 0.45,
  closingPct: 2.5,
  expenditures: [{ id: 'equipment', label: 'Equipment', amount: 25_000 }],
};

export const fixtures: readonly Fixture[] = [
  {
    name: 'HTML default scenario — $415k offer, 25% down, 9% concession',
    input: DEFAULT_INPUT,
    expected: {
      netProceeds: 97_400,
      downAmt: 103_750,
      loan: 311_250,
      ltvPct: 75,
      pi: 2018.74,
      tax: 224.7917,
      ins: 155.625,
      pmiMo: 0,
      piti: 2399.16,
      concession: 37_350,
      closingAmt: 10_375,
      repairCash: 26_975,
      afterDown: -6_350,
      totalCash: 20_625,
      reserve: -4_375,
      concessionLimitPct: 9,
    },
  },
  {
    name: 'High LTV (5% down) — PMI applies',
    input: { ...DEFAULT_INPUT, downPct: 5 },
    expected: {
      netProceeds: 97_400,
      downAmt: 20_750,
      loan: 394_250,
      ltvPct: 95,
      pi: 2557.51,
      tax: 224.7917,
      ins: 155.625,
      // pmiMo = 394250 * 0.007 / 12 = 230.0
      pmiMo: 229.9792,
      piti: 3167.91,
      concession: 37_350,
      closingAmt: 10_375,
      repairCash: 26_975,
      afterDown: 76_650,
      totalCash: 103_625,
      reserve: 78_625,
      concessionLimitPct: 3,
    },
  },
  {
    name: 'Zero rate — PMT degenerates to principal/months',
    input: { ...DEFAULT_INPUT, ratePct: 0 },
    expected: {
      netProceeds: 97_400,
      downAmt: 103_750,
      loan: 311_250,
      ltvPct: 75,
      // pi = loan / (years * 12) = 311250 / 360 = 864.5833
      pi: 864.5833,
      tax: 224.7917,
      ins: 155.625,
      pmiMo: 0,
      piti: 1245.0,
      concession: 37_350,
      closingAmt: 10_375,
      repairCash: 26_975,
      afterDown: -6_350,
      totalCash: 20_625,
      reserve: -4_375,
      concessionLimitPct: 9,
    },
  },
  {
    name: 'All-zero scenario — no crashes, all-zero outputs',
    input: {
      salePrice: 0,
      payoff: 0,
      realtorPct: 0,
      transferPct: 0,
      offerPrice: 0,
      downPct: 0,
      concPct: 0,
      ratePct: 0,
      taxRatePct: 0,
      insRatePct: 0,
      closingPct: 0,
      expenditures: [],
    },
    expected: {
      netProceeds: 0,
      downAmt: 0,
      loan: 0,
      ltvPct: 0,
      pi: 0,
      tax: 0,
      ins: 0,
      pmiMo: 0,
      piti: 0,
      concession: 0,
      closingAmt: 0,
      repairCash: 0,
      afterDown: 0,
      totalCash: 0,
      reserve: 0,
      // ltv 0 → first bucket (≤75) returns 9
      concessionLimitPct: 9,
    },
  },
  {
    name: 'Larger offer — $475k, 20% down, 6% concession (preset-like)',
    input: { ...DEFAULT_INPUT, offerPrice: 475_000, downPct: 20, concPct: 6 },
    expected: {
      netProceeds: 97_400,
      downAmt: 95_000,
      loan: 380_000,
      ltvPct: 80,
      pi: 2464.53,
      // tax = 475000 * 0.0065 / 12 = 257.2917
      tax: 257.2917,
      // ins = 475000 * 0.0045 / 12 = 178.125
      ins: 178.125,
      pmiMo: 0,
      piti: 2899.94,
      concession: 28_500,
      // closingAmt = 475000 * 0.025 = 11875
      closingAmt: 11_875,
      // repairCash = 28500 - 11875 = 16625
      repairCash: 16_625,
      // afterDown = 97400 - 95000 = 2400
      afterDown: 2_400,
      // totalCash = 2400 + max(0, 16625) = 19025
      totalCash: 19_025,
      // reserve = 19025 - 25000 = -5975
      reserve: -5_975,
      // ltv 80 → second bucket (≤80) returns 6
      concessionLimitPct: 6,
    },
  },
  {
    name: 'Concession exceeds limit at 95% LTV (3% max)',
    input: { ...DEFAULT_INPUT, downPct: 5, concPct: 6 },
    expected: {
      netProceeds: 97_400,
      downAmt: 20_750,
      loan: 394_250,
      ltvPct: 95,
      pi: 2557.51,
      tax: 224.7917,
      ins: 155.625,
      pmiMo: 229.9792,
      piti: 3167.91,
      // concession = 415000 * 0.06 = 24900
      concession: 24_900,
      closingAmt: 10_375,
      // repairCash = 24900 - 10375 = 14525
      repairCash: 14_525,
      afterDown: 76_650,
      // totalCash = 76650 + 14525 = 91175
      totalCash: 91_175,
      // reserve = 91175 - 25000 = 66175
      reserve: 66_175,
      // ltv 95 → 3% limit; the input concPct of 6 exceeds it but the
      // scenario still computes — exceeded-limit reporting belongs in
      // the Component layer (warning UI), not in the math.
      concessionLimitPct: 3,
    },
  },
];
