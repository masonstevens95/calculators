// LGS Home Builders / Nationwide Homes models — extracted from
// reference/html-originals/lgs-dscr-calculator.html.

export type ModelCategory = 'SFH' | 'Cape';

export type LgsModel = {
  id: string;
  category: ModelCategory;
  name: string;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  /** Module price (before bulk discount). */
  modulePrice: number;
  /** Suggested build cost (overridable per home). */
  defaultBuild: number;
  /** Optional building dimensions string (informational). */
  dims?: string;
};

export const MODELS: readonly LgsModel[] = [
  {
    id: 'farmhouse_v_cape',
    category: 'SFH',
    name: 'Farmhouse V Cape',
    sqft: 1344,
    bedrooms: 1,
    bathrooms: 1,
    modulePrice: 221_760,
    defaultBuild: 20_752,
  },
  {
    id: 'horizon_i',
    category: 'SFH',
    name: 'Horizon I',
    sqft: 1548,
    bedrooms: 3,
    bathrooms: 2,
    modulePrice: 263_160,
    defaultBuild: 22_384,
  },
  {
    id: 'cumberland',
    category: 'SFH',
    name: 'Cumberland',
    sqft: 1664,
    bedrooms: 3,
    bathrooms: 2,
    modulePrice: 282_880,
    defaultBuild: 23_312,
    dims: "62' x 27'8\"",
  },
  {
    id: 'whitfield',
    category: 'SFH',
    name: 'Whitfield',
    sqft: 1902,
    bedrooms: 3,
    bathrooms: 2,
    modulePrice: 323_340,
    defaultBuild: 25_216,
    dims: "60' x 41.5'",
  },
  {
    id: 'horizon_ii_cape',
    category: 'Cape',
    name: 'Horizon II Cape',
    sqft: 2748,
    bedrooms: 3,
    bathrooms: 2,
    modulePrice: 453_420,
    defaultBuild: 31_984,
  },
  {
    id: 'horizon_i_cape',
    category: 'Cape',
    name: 'Horizon I Cape',
    sqft: 2813,
    bedrooms: 3,
    bathrooms: 2,
    modulePrice: 464_145,
    defaultBuild: 32_504,
  },
];

export const MODELS_BY_ID: Readonly<Record<string, LgsModel>> = MODELS.reduce(
  (acc, m) => {
    acc[m.id] = m;
    return acc;
  },
  {} as Record<string, LgsModel>,
);

export function findModel(id: string): LgsModel | undefined {
  return MODELS_BY_ID[id];
}
