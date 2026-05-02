// KTD #24 — canonical inputs/outputs for calc-olamina-dscr.
// Values captured from the implementation (per the canonical port of the
// HTML original; textbook monthlyPayment unit test independently verifies
// formula correctness).

import type { DscrInputs } from '../src/domain';

export type Fixture = {
  name: string;
  input: DscrInputs;
  expected: {
    perHomeCount: number;
    sqftTotal: number;
    kitTotal: number;
    buildTotal: number;
    totalCost: number;
    downTotal: number;
    pitiaTotal: number;
    rentTotal: number;
    avgRentPerHome: number;
    annualRent: number;
    kitBeforeDiscount: number;
    discountSavings: number;
    loanAmount: number;
    origCost: number;
    totalClosing: number;
    reserves: number;
    totalCashNeeded: number;
    ltvPct: number;
  };
};

const DEFAULT_INPUT: DscrInputs = {
  homes: [
    { modelId: 'birmingham' },
    { modelId: 'birmingham' },
    { modelId: 'birmingham' },
    { modelId: 'co_live' },
    { modelId: 'co_live' },
    { modelId: 'co_live' },
    { modelId: 'co_live' },
  ],
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
  kitTier: 'plus',
};

export const fixtures: readonly Fixture[] = [
  {
    name: 'Default Olamina preset (3× Birmingham + 4× Co-live, plus tier)',
    input: DEFAULT_INPUT,
    // discountedKit per Birmingham = 235000 * 0.95 = 223250
    // discountedKit per Co-live   = 180000 * 0.95 = 171000
    // total kit = 223250*3 + 171000*4 = 669750 + 684000 = 1,353,750
    // build = 56000*3 + 44000*4 = 168000 + 176000 = 344000
    // totalCost = 1353750 + 344000 + 100000 = 1,797,750
    expected: {
      perHomeCount: 7,
      sqftTotal: 1712 * 3 + 1203 * 4,
      kitTotal: 1_353_750,
      buildTotal: 344_000,
      totalCost: 1_797_750,
      downTotal: 1_797_750 * 0.2,
      pitiaTotal: 11_590.8492,
      rentTotal: 14_488.5615,
      avgRentPerHome: 2_069.7945,
      annualRent: 173_862.7385,
      kitBeforeDiscount: 1_353_750 / 0.95,
      discountSavings: 1_353_750 / 0.95 - 1_353_750,
      loanAmount: 1_797_750 * 0.8,
      origCost: 1_797_750 * 0.8 * 0.01,
      totalClosing: 1_797_750 * 0.8 * 0.01 + 12_000,
      reserves: 69_545.0954,
      totalCashNeeded: 95_927.0954,
      ltvPct: 80,
    },
  },
  {
    name: 'Single Luna home, max tier, no infra, no discount',
    input: {
      ...DEFAULT_INPUT,
      homes: [{ modelId: 'luna' }],
      infraTotal: 0,
      discountPct: 0,
      kitTier: 'max',
    },
    // luna kit max = 415000; no discount → 415000
    // build = 81000; total = 496000
    expected: {
      perHomeCount: 1,
      sqftTotal: 2733,
      kitTotal: 415_000,
      buildTotal: 81_000,
      totalCost: 496_000,
      downTotal: 496_000 * 0.2,
      pitiaTotal: 3_197.9203,
      rentTotal: 3_997.4004,
      avgRentPerHome: 3_997.4004,
      annualRent: 47_968.8045,
      kitBeforeDiscount: 415_000,
      discountSavings: 0,
      loanAmount: 496_000 * 0.8,
      origCost: 496_000 * 0.8 * 0.01,
      totalClosing: 496_000 * 0.8 * 0.01 + 12_000,
      reserves: 19_187.5218,
      totalCashNeeded: 35_155.5218,
      ltvPct: 80,
    },
  },
  {
    name: 'Single Otium (kitPlus is null — falls back to Max)',
    input: {
      ...DEFAULT_INPUT,
      homes: [{ modelId: 'otium' }],
      infraTotal: 0,
      kitTier: 'plus',
    },
    // otium kitPlus = null, falls back to kitMax = 232000
    // discounted = 232000 * 0.95 = 220400
    // build = 42000; total = 262400
    expected: {
      perHomeCount: 1,
      sqftTotal: 1120,
      kitTotal: 220_400,
      buildTotal: 42_000,
      totalCost: 262_400,
      downTotal: 52_480,
      pitiaTotal: 1_691.803,
      rentTotal: 2_114.7537,
      avgRentPerHome: 2_114.7537,
      annualRent: 25_377.045,
      kitBeforeDiscount: 220_400 / 0.95,
      discountSavings: 220_400 / 0.95 - 220_400,
      loanAmount: 209_920,
      origCost: 2_099.2,
      totalClosing: 14_099.2,
      reserves: 10_150.818,
      totalCashNeeded: 24_250.018,
      ltvPct: 80,
    },
  },
  {
    name: 'Zero rate — degenerate amortization',
    input: {
      ...DEFAULT_INPUT,
      homes: [{ modelId: 'birmingham' }],
      infraTotal: 0,
      ratePct: 0,
    },
    // kit = 235000 * 0.95 = 223250; build = 56000; total = 279250
    // down = 55850; loan = 223400; pi = 223400/360 = 620.5556
    // tax = 279250 * 0.01/12 = 232.7083; ins = 279250 * 0.0035/12 = 81.4479
    // pitia = 934.7118
    expected: {
      perHomeCount: 1,
      sqftTotal: 1712,
      kitTotal: 223_250,
      buildTotal: 56_000,
      totalCost: 279_250,
      downTotal: 55_850,
      pitiaTotal: 934.7118,
      rentTotal: 1_168.3897,
      avgRentPerHome: 1_168.3897,
      annualRent: 14_020.6766,
      kitBeforeDiscount: 235_000,
      discountSavings: 11_750,
      loanAmount: 223_400,
      origCost: 2_234.0,
      totalClosing: 14_234.0,
      reserves: 5_608.2706,
      totalCashNeeded: 19_842.2706,
      ltvPct: 80,
    },
  },
  {
    name: 'Plus vs Max tier produces different kit totals (parameter sweep)',
    input: {
      ...DEFAULT_INPUT,
      homes: [{ modelId: 'birmingham' }],
      infraTotal: 0,
      kitTier: 'max',
      discountPct: 0,
    },
    expected: {
      perHomeCount: 1,
      sqftTotal: 1712,
      // kitMax birmingham = 280000 (vs kitPlus 235000)
      kitTotal: 280_000,
      buildTotal: 56_000,
      totalCost: 336_000,
      downTotal: 67_200,
      pitiaTotal: 2_166.3331,
      rentTotal: 2_707.9164,
      avgRentPerHome: 2_707.9164,
      annualRent: 32_494.9966,
      kitBeforeDiscount: 280_000,
      discountSavings: 0,
      loanAmount: 268_800,
      origCost: 2_688,
      totalClosing: 14_688,
      reserves: 12_997.9986,
      totalCashNeeded: 27_685.9986,
      ltvPct: 80,
    },
  },
];
