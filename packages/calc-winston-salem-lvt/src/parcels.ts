// Sample parcels mirror the HTML original — common Winston-Salem property
// archetypes used to illustrate how a split-rate land/improvement tax shifts
// burden across property types.

export type Parcel = {
  name: string;
  /** Assessed land value, dollars. */
  land: number;
  /** Assessed improvement value, dollars. */
  imp: number;
};

export const SAMPLE_PARCELS: readonly Parcel[] = [
  { name: 'Median home (18% land)', land: 50_000, imp: 230_000 },
  { name: 'Premium home (15% land)', land: 90_000, imp: 510_000 },
  { name: 'Vacant infill lot', land: 90_000, imp: 0 },
  { name: 'Surface parking (downtown)', land: 400_000, imp: 0 },
  { name: 'Dense apartment building', land: 500_000, imp: 4_500_000 },
  { name: 'Underused commercial strip', land: 600_000, imp: 800_000 },
  { name: 'Single-tenant big-box', land: 1_500_000, imp: 3_000_000 },
];

// Static W-S tax base from the HTML original (sourced from the
// PWA_PUBLIC_VIEW Access database referenced there).
export const WS_BASE = {
  /** Total assessed land value across W-S. */
  L: 7_460_000_000,
  /** Total assessed improvement value (buildings + other). */
  I: 29_200_000_000,
  /** Personal + business personal property base (informational; not used in math). */
  P: 5_810_000_000,
  /** Current uniform rate (decimal: $0.5266 / $100). */
  rate: 0.005266,
} as const;

/** Winston-Salem city population, 2020 U.S. Census. Used for per-resident dividend math. */
export const WS_POPULATION = 249_545;

/** Winston-Salem occupied households, 2020 U.S. Census. Used for per-household rebate math. */
export const WS_HOUSEHOLDS = 96_376;
