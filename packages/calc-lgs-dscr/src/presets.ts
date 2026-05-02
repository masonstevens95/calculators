import type { DscrInputs, HomeInput } from './domain';

export type Preset = {
  id: string;
  label: string;
  homes: readonly HomeInput[];
};

// Mirrors the HTML original's a/b/c presets.
export const presets: readonly Preset[] = [
  {
    id: 'a',
    label: 'Mixed: 3× Cumberland, 2× Whitfield, 2× Horizon I Cape',
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
  {
    id: 'b',
    label: 'Whitfield-heavy: 2× Cumberland, 5× Whitfield',
    homes: [
      { modelId: 'cumberland' },
      { modelId: 'cumberland' },
      { modelId: 'whitfield' },
      { modelId: 'whitfield' },
      { modelId: 'whitfield' },
      { modelId: 'whitfield' },
      { modelId: 'whitfield' },
    ],
  },
  {
    id: 'c',
    label: 'Smaller mix: 3× Horizon I, 4× Cumberland',
    homes: [
      { modelId: 'horizon_i' },
      { modelId: 'horizon_i' },
      { modelId: 'horizon_i' },
      { modelId: 'cumberland' },
      { modelId: 'cumberland' },
      { modelId: 'cumberland' },
      { modelId: 'cumberland' },
    ],
  },
];

export const defaultInputs: DscrInputs = {
  homes: Array.from({ length: 7 }, () => ({ modelId: 'cumberland' })),
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
