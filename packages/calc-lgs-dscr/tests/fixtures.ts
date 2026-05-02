// KTD #24 — canonical inputs/outputs for calc-lgs-dscr derived from
// reference/html-originals/lgs-dscr-calculator.html.
//
// Domain math is independently authored (NOT shared with calc-olamina-dscr
// per KTD #4). Both packages have full TDD coverage; cross-package agreement
// for shared formulas (monthlyPayment textbook case) is asserted in U6.

import type { DscrInputs } from '../src/domain';

export type Fixture = {
  name: string;
  input: DscrInputs;
  expected: {
    perHomeCount: number;
    sqftTotal: number;
    moduleTotal: number;
    buildTotal: number;
    totalCost: number;
    downTotal: number;
    pitiaTotal: number;
    rentTotal: number;
    avgRentPerHome: number;
    annualRent: number;
    moduleBeforeDiscount: number;
    discountSavings: number;
    loanAmount: number;
    origCost: number;
    totalClosing: number;
    reserves: number;
    totalCashNeeded: number;
    ltvPct: number;
  };
};

// HTML default: 7 homes, all cumberland by default.
const DEFAULT_HOMES = Array.from({ length: 7 }, () => ({ modelId: 'cumberland' as const }));

const DEFAULT_INPUT: DscrInputs = {
  homes: DEFAULT_HOMES,
  ratePct: 7,
  downPct: 20,
  dscrTarget: 1.25,
  termYears: 30,
  discountPct: 5,
  infraTotal: 100_000,
  taxRatePct: 1.0,
  insRatePct: 0.35,
  reserveMonths: 6,
  origFeePct: 1,
  otherClosing: 12_000,
};

export const fixtures: readonly Fixture[] = [
  {
    name: 'HTML default — 7× Cumberland, 7% rate, 20% down, 1.25 DSCR',
    input: DEFAULT_INPUT,
    expected: {
      perHomeCount: 7,
      sqftTotal: 1664 * 7, // 11,648
      // discountedModule per home = 282880 * 0.95 = 268736; total = 268736*7 = 1,881,152
      moduleTotal: 268_736 * 7,
      buildTotal: 23_312 * 7, // 163,184
      // totalCost per home = 268736 + 23312 + 100000/7 = 306,333.43; ×7 = 2,144,333
      totalCost: 268_736 * 7 + 23_312 * 7 + 100_000,
      // down = totalCost * 0.20 = 428,866.6
      downTotal: (268_736 * 7 + 23_312 * 7 + 100_000) * 0.2,
      // pitia/rent computed by porting per-home math and summing — captured
      // from the implementation (which is the canonical port of the HTML JS;
      // independently verified via the textbook monthlyPayment unit test).
      pitiaTotal: 13_825.4347,
      rentTotal: 17_281.7934,
      avgRentPerHome: 2_468.8276,
      annualRent: 207_381.521,
      // moduleBeforeDiscount = moduleTotal / 0.95
      moduleBeforeDiscount: (268_736 * 7) / 0.95,
      discountSavings: (268_736 * 7) / 0.95 - 268_736 * 7,
      loanAmount:
        (268_736 * 7 + 23_312 * 7 + 100_000) - (268_736 * 7 + 23_312 * 7 + 100_000) * 0.2,
      origCost:
        ((268_736 * 7 + 23_312 * 7 + 100_000) * 0.8) * 0.01,
      totalClosing:
        ((268_736 * 7 + 23_312 * 7 + 100_000) * 0.8) * 0.01 + 12_000,
      reserves: 82_952.6084,
      totalCashNeeded: 112_107.2964,
      ltvPct: 80,
    },
  },
  {
    name: 'Single home — Whitfield, 5% discount, no infra',
    input: {
      ...DEFAULT_INPUT,
      homes: [{ modelId: 'whitfield' }],
      infraTotal: 0,
    },
    expected: {
      perHomeCount: 1,
      sqftTotal: 1902,
      // discountedModule = 323340 * 0.95 = 307173
      moduleTotal: 307_173,
      buildTotal: 25_216,
      // totalCost = 307173 + 25216 + 0 = 332389
      totalCost: 332_389,
      // down = 66477.8
      downTotal: 332_389 * 0.2,
      pitiaTotal: 2_143.0515,
      rentTotal: 2_678.8143,
      avgRentPerHome: 2_678.8143,
      annualRent: 32_145.7721,
      moduleBeforeDiscount: 307_173 / 0.95,
      discountSavings: 307_173 / 0.95 - 307_173,
      loanAmount: 332_389 * 0.8,
      origCost: 332_389 * 0.8 * 0.01,
      totalClosing: 332_389 * 0.8 * 0.01 + 12_000,
      reserves: 12_858.3088,
      totalCashNeeded: 27_517.4208,
      ltvPct: 80,
    },
  },
  {
    name: 'Zero rate — pitia degenerates (P&I = principal/n)',
    input: {
      ...DEFAULT_INPUT,
      homes: [{ modelId: 'cumberland' }],
      ratePct: 0,
      infraTotal: 0,
    },
    expected: {
      perHomeCount: 1,
      sqftTotal: 1664,
      moduleTotal: 268_736,
      buildTotal: 23_312,
      totalCost: 292_048,
      downTotal: 292_048 * 0.2,
      // loan = 233638.4; pi = 233638.4/360 = 649.0; tax = 292048*0.01/12=243.37; ins=292048*0.0035/12=85.18
      pitiaTotal: 977.55, // approx
      rentTotal: 977.55 * 1.25,
      avgRentPerHome: 977.55 * 1.25,
      annualRent: 977.55 * 1.25 * 12,
      moduleBeforeDiscount: 268_736 / 0.95,
      discountSavings: 268_736 / 0.95 - 268_736,
      loanAmount: 292_048 * 0.8,
      origCost: 292_048 * 0.8 * 0.01,
      totalClosing: 292_048 * 0.8 * 0.01 + 12_000,
      reserves: 977.55 * 6,
      totalCashNeeded: 292_048 * 0.8 * 0.01 + 12_000 + 977.55 * 6,
      ltvPct: 80,
    },
  },
  {
    name: 'Mixed-model preset: 3× Cumberland + 2× Whitfield + 2× Horizon I Cape',
    input: {
      ...DEFAULT_INPUT,
      homes: [
        { modelId: 'cumberland' },
        { modelId: 'cumberland' },
        { modelId: 'cumberland' },
        { modelId: 'whitfield' },
        { modelId: 'whitfield' },
        { modelId: 'horizon_i_cape' },
        { modelId: 'horizon_i_cape' },
      ],
    },
    expected: {
      perHomeCount: 7,
      sqftTotal: 1664 * 3 + 1902 * 2 + 2813 * 2,
      // module: 282880*0.95*3 + 323340*0.95*2 + 464145*0.95*2 = 268736*3 + 307173*2 + 440937.75*2
      moduleTotal: 268_736 * 3 + 307_173 * 2 + 440_937.75 * 2,
      buildTotal: 23_312 * 3 + 25_216 * 2 + 32_504 * 2,
      totalCost:
        268_736 * 3 + 307_173 * 2 + 440_937.75 * 2 + 23_312 * 3 + 25_216 * 2 + 32_504 * 2 + 100_000,
      downTotal:
        (268_736 * 3 +
          307_173 * 2 +
          440_937.75 * 2 +
          23_312 * 3 +
          25_216 * 2 +
          32_504 * 2 +
          100_000) *
        0.2,
      pitiaTotal: 16_684.6688,
      rentTotal: 20_855.836,
      avgRentPerHome: 2_979.4051,
      annualRent: 250_270.0326,
      moduleBeforeDiscount:
        (268_736 * 3 + 307_173 * 2 + 440_937.75 * 2) / 0.95,
      discountSavings:
        (268_736 * 3 + 307_173 * 2 + 440_937.75 * 2) / 0.95 -
        (268_736 * 3 + 307_173 * 2 + 440_937.75 * 2),
      loanAmount:
        (268_736 * 3 +
          307_173 * 2 +
          440_937.75 * 2 +
          23_312 * 3 +
          25_216 * 2 +
          32_504 * 2 +
          100_000) *
        0.8,
      origCost:
        (268_736 * 3 +
          307_173 * 2 +
          440_937.75 * 2 +
          23_312 * 3 +
          25_216 * 2 +
          32_504 * 2 +
          100_000) *
        0.8 *
        0.01,
      totalClosing:
        (268_736 * 3 +
          307_173 * 2 +
          440_937.75 * 2 +
          23_312 * 3 +
          25_216 * 2 +
          32_504 * 2 +
          100_000) *
          0.8 *
          0.01 +
        12_000,
      reserves: 100_108.013,
      totalCashNeeded: 132_810.457,
      ltvPct: 80,
    },
  },
  {
    name: 'High-down (40%) lowers LTV and total cash needed',
    input: { ...DEFAULT_INPUT, downPct: 40 },
    expected: {
      perHomeCount: 7,
      sqftTotal: 1664 * 7,
      moduleTotal: 268_736 * 7,
      buildTotal: 23_312 * 7,
      totalCost: 268_736 * 7 + 23_312 * 7 + 100_000,
      downTotal: (268_736 * 7 + 23_312 * 7 + 100_000) * 0.4,
      pitiaTotal: 10_972.1705,
      rentTotal: 13_715.2132,
      avgRentPerHome: 1_959.3162,
      annualRent: 164_582.5582,
      moduleBeforeDiscount: (268_736 * 7) / 0.95,
      discountSavings: (268_736 * 7) / 0.95 - 268_736 * 7,
      loanAmount: (268_736 * 7 + 23_312 * 7 + 100_000) * 0.6,
      origCost: (268_736 * 7 + 23_312 * 7 + 100_000) * 0.6 * 0.01,
      totalClosing: (268_736 * 7 + 23_312 * 7 + 100_000) * 0.6 * 0.01 + 12_000,
      reserves: 65_833.0233,
      totalCashNeeded: 90_699.0393,
      ltvPct: 60,
    },
  },
];
