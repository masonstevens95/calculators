import type { DscrInputs, HomeInput } from './domain';
import type { Builder } from './models';

export type Preset = {
  id: string;
  label: string;
  homes: readonly HomeInput[];
};

// Preset portfolios, indexed by builder. Each preset's home list must use
// only models from that builder's catalog (validated in computeDscr).
export const PRESETS_BY_BUILDER: Readonly<Record<Builder, readonly Preset[]>> = {
  nationwide: [
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
  ],
  momohomes: [
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
  ],
};

export function presetsForBuilder(builder: Builder): readonly Preset[] {
  return PRESETS_BY_BUILDER[builder];
}

/** Default starter portfolio per builder — used when switching builders. */
export const DEFAULT_HOMES_BY_BUILDER: Readonly<Record<Builder, readonly HomeInput[]>> = {
  nationwide: Array.from({ length: 7 }, () => ({ modelId: 'cumberland' })),
  momohomes: PRESETS_BY_BUILDER.momohomes[0]!.homes.map((h) => ({ ...h })),
};

export const defaultInputs: DscrInputs = {
  builder: 'nationwide',
  homes: DEFAULT_HOMES_BY_BUILDER.nationwide.map((h) => ({ ...h })),
  kitTier: 'plus',
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
