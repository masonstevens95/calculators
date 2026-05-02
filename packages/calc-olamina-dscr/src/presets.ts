import type { DscrInputs, HomeInput } from './domain';

export type Preset = {
  id: string;
  label: string;
  homes: readonly HomeInput[];
};

// Mirrors HTML original presets a–e exactly.
export const presets: readonly Preset[] = [
  {
    id: 'a',
    label: '3× Birmingham + 4× Co-live',
    homes: [
      ...Array.from({ length: 3 }, (): HomeInput => ({ modelId: 'birmingham' })),
      ...Array.from({ length: 4 }, (): HomeInput => ({ modelId: 'co_live' })),
    ],
  },
  {
    id: 'b',
    label: '3× Birmingham + 2× Co-live + 2× Otium',
    homes: [
      ...Array.from({ length: 3 }, (): HomeInput => ({ modelId: 'birmingham' })),
      ...Array.from({ length: 2 }, (): HomeInput => ({ modelId: 'co_live' })),
      ...Array.from({ length: 2 }, (): HomeInput => ({ modelId: 'otium' })),
    ],
  },
  {
    id: 'c',
    label: '3× Luna + 4× Birmingham',
    homes: [
      ...Array.from({ length: 3 }, (): HomeInput => ({ modelId: 'luna' })),
      ...Array.from({ length: 4 }, (): HomeInput => ({ modelId: 'birmingham' })),
    ],
  },
  {
    id: 'd',
    label: '3× Luna + 2× Birmingham + 2× Otium',
    homes: [
      ...Array.from({ length: 3 }, (): HomeInput => ({ modelId: 'luna' })),
      ...Array.from({ length: 2 }, (): HomeInput => ({ modelId: 'birmingham' })),
      ...Array.from({ length: 2 }, (): HomeInput => ({ modelId: 'otium' })),
    ],
  },
  {
    id: 'e',
    label: '7× Montana (uniform)',
    homes: Array.from({ length: 7 }, (): HomeInput => ({ modelId: 'montana' })),
  },
];

export const defaultInputs: DscrInputs = {
  homes: presets[0]!.homes.map((h) => ({ ...h })),
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
