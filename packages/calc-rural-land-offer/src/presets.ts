import type { OfferInputs } from './domain';

export type Preset = {
  label: string;
  /** Subset of inputs the preset overrides; remaining inputs persist. */
  overrides: Pick<OfferInputs, 'offerPrice' | 'downPct' | 'concPct'>;
  /** Marks the "headline" preset for visual highlight. */
  highlight?: boolean;
};

// Mirrors the HTML original's preset row.
export const presets: readonly Preset[] = [
  {
    label: '$375k · 20% · 6%',
    overrides: { offerPrice: 375_000, downPct: 20, concPct: 6 },
  },
  {
    label: '$400k · 20% · 6%',
    overrides: { offerPrice: 400_000, downPct: 20, concPct: 6 },
  },
  {
    label: '$415k · 25% · 9% ★',
    overrides: { offerPrice: 415_000, downPct: 25, concPct: 9 },
    highlight: true,
  },
  {
    label: '$425k · 25% · 9%',
    overrides: { offerPrice: 425_000, downPct: 25, concPct: 9 },
  },
];

export const defaultInputs: OfferInputs = {
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
  equipment: 25_000,
};
