// KTD #24 fixtures for calc-winston-salem-lvt. Numbers come from the
// formulas — independently checked against the HTML's hardcoded outputs
// where present (rate panel under each shift).

import type { LvtInputs } from '../src/domain';

export type Fixture = {
  name: string;
  input: LvtInputs;
  expected: {
    landRate: number;
    impRate: number;
    pureLvtRate: number;
    impliedKFinite: boolean;
    sampleBillsCount: 7;
  };
};

const TARGET = (7_460_000_000 + 29_200_000_000) * 0.005266;

export const fixtures: readonly Fixture[] = [
  {
    name: 'Shift 0 (current uniform practice)',
    input: { shift: 0 },
    expected: {
      landRate: 0.005266,
      impRate: 0.005266,
      pureLvtRate: TARGET / 7_460_000_000,
      impliedKFinite: true,
      sampleBillsCount: 7,
    },
  },
  {
    name: 'Shift 0.5 (split-rate halfway)',
    input: { shift: 0.5 },
    expected: {
      // landRate = 0.5 * 0.005266 + 0.5 * pureLvtRate
      landRate: 0.5 * 0.005266 + 0.5 * (TARGET / 7_460_000_000),
      impRate: 0.5 * 0.005266,
      pureLvtRate: TARGET / 7_460_000_000,
      impliedKFinite: true,
      sampleBillsCount: 7,
    },
  },
  {
    name: 'Shift 1 (pure LVT)',
    input: { shift: 1 },
    expected: {
      landRate: TARGET / 7_460_000_000,
      impRate: 0,
      pureLvtRate: TARGET / 7_460_000_000,
      impliedKFinite: false,
      sampleBillsCount: 7,
    },
  },
  {
    name: 'Shift clamped above 1',
    input: { shift: 1.5 },
    expected: {
      landRate: TARGET / 7_460_000_000,
      impRate: 0,
      pureLvtRate: TARGET / 7_460_000_000,
      impliedKFinite: false,
      sampleBillsCount: 7,
    },
  },
  {
    name: 'With user parcel: $50k land + $200k imp',
    input: { shift: 0.3, myParcel: { name: 'My home', land: 50_000, imp: 200_000 } },
    expected: {
      landRate: 0.7 * 0.005266 + 0.3 * (TARGET / 7_460_000_000),
      impRate: 0.7 * 0.005266,
      pureLvtRate: TARGET / 7_460_000_000,
      impliedKFinite: true,
      sampleBillsCount: 7,
    },
  },
];
