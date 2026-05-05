// Unified model catalog covering both Nationwide Homes (formerly LGS) and
// Momohomes (formerly Olamina) builders.
//
// The two builders price kits differently — Nationwide quotes a single
// module price per model, Momohomes quotes Plus/Max tiers with per-model
// fallbacks. Both shapes are encoded here behind the same `getKitPrice`
// helper so the domain math stays builder-agnostic.

export type Builder = 'nationwide' | 'momohomes';
export type KitTier = 'plus' | 'max';
export type ModelCategory = 'SFH' | 'Cape' | 'ADU' | 'SPH';

/**
 * Per-tier kit pricing (Momohomes-style). When a tier price is unavailable
 * for a model the other tier's price is used as a fallback (matches the
 * original Olamina behavior).
 */
export type KitTiers = {
  plus: number | null;
  max: number | null;
};

export type DscrModel = {
  id: string;
  builder: Builder;
  category: ModelCategory;
  name: string;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  /** Suggested per-home build cost (overridable per home). */
  defaultBuild: number;
  /** Single fixed kit price (Nationwide). Mutually exclusive with `tiers`. */
  kitPrice?: number;
  /** Tiered kit pricing (Momohomes). Mutually exclusive with `kitPrice`. */
  tiers?: KitTiers;
  /** Optional building dimensions string (informational, Nationwide). */
  dims?: string;
  /** Whether the model includes garage (Momohomes). */
  garage?: boolean;
  /** Whether the model is a release-pending preview (Momohomes). */
  upcoming?: boolean;
};

// Nationwide Homes (formerly LGS) — 6 SFH/Cape models, single-tier pricing.
const NATIONWIDE_MODELS: readonly DscrModel[] = [
  {
    id: 'farmhouse_v_cape',
    builder: 'nationwide',
    category: 'SFH',
    name: 'Farmhouse V Cape',
    sqft: 1344,
    bedrooms: 1,
    bathrooms: 1,
    kitPrice: 221_760,
    defaultBuild: 20_752,
  },
  {
    id: 'horizon_i',
    builder: 'nationwide',
    category: 'SFH',
    name: 'Horizon I',
    sqft: 1548,
    bedrooms: 3,
    bathrooms: 2,
    kitPrice: 263_160,
    defaultBuild: 22_384,
  },
  {
    id: 'cumberland',
    builder: 'nationwide',
    category: 'SFH',
    name: 'Cumberland',
    sqft: 1664,
    bedrooms: 3,
    bathrooms: 2,
    kitPrice: 282_880,
    defaultBuild: 23_312,
    dims: "62' x 27'8\"",
  },
  {
    id: 'whitfield',
    builder: 'nationwide',
    category: 'SFH',
    name: 'Whitfield',
    sqft: 1902,
    bedrooms: 3,
    bathrooms: 2,
    kitPrice: 323_340,
    defaultBuild: 25_216,
    dims: "60' x 41.5'",
  },
  {
    id: 'horizon_ii_cape',
    builder: 'nationwide',
    category: 'Cape',
    name: 'Horizon II Cape',
    sqft: 2748,
    bedrooms: 3,
    bathrooms: 2,
    kitPrice: 453_420,
    defaultBuild: 31_984,
  },
  {
    id: 'horizon_i_cape',
    builder: 'nationwide',
    category: 'Cape',
    name: 'Horizon I Cape',
    sqft: 2813,
    bedrooms: 3,
    bathrooms: 2,
    kitPrice: 464_145,
    defaultBuild: 32_504,
  },
];

// Momohomes (formerly Olamina) — 13 ADU/SPH models, tiered pricing.
const MOMOHOMES_MODELS: readonly DscrModel[] = [
  // ADU
  { id: 'seed_studio', builder: 'momohomes', category: 'ADU', name: 'Seed Studio', sqft: 400, bedrooms: 1, bathrooms: 1, tiers: { plus: 94_000, max: 115_000 }, garage: false, upcoming: false, defaultBuild: 25_000 },
  { id: 'seed_1br', builder: 'momohomes', category: 'ADU', name: 'Seed 1 BDRM', sqft: 563, bedrooms: 1, bathrooms: 1, tiers: { plus: 115_000, max: 145_000 }, garage: false, upcoming: false, defaultBuild: 29_000 },
  { id: 'umbra_1br', builder: 'momohomes', category: 'ADU', name: 'Umbra 1 BDRM', sqft: 707, bedrooms: 1, bathrooms: 1, tiers: { plus: 149_000, max: 175_000 }, garage: false, upcoming: false, defaultBuild: 32_000 },
  { id: 'seed_2br_xl', builder: 'momohomes', category: 'ADU', name: 'Seed 2 BDRM XL', sqft: 834, bedrooms: 2, bathrooms: 2, tiers: { plus: 149_000, max: 188_000 }, garage: false, upcoming: false, defaultBuild: 35_000 },
  { id: 'umbra_2br_xl', builder: 'momohomes', category: 'ADU', name: 'Umbra 2 BDRM XL', sqft: 976, bedrooms: 2, bathrooms: 2, tiers: { plus: null, max: 205_000 }, garage: false, upcoming: false, defaultBuild: 38_000 },
  // SPH
  { id: 'co_live', builder: 'momohomes', category: 'SPH', name: 'Co-live', sqft: 1203, bedrooms: 2, bathrooms: 2.5, tiers: { plus: 180_000, max: 220_000 }, garage: true, upcoming: false, defaultBuild: 44_000 },
  { id: 'otium', builder: 'momohomes', category: 'SPH', name: 'Otium Bungalow', sqft: 1120, bedrooms: 2, bathrooms: 2, tiers: { plus: null, max: 232_000 }, garage: false, upcoming: false, defaultBuild: 42_000 },
  { id: 'montana', builder: 'momohomes', category: 'SPH', name: 'Montana', sqft: 1564, bedrooms: 3, bathrooms: 2, tiers: { plus: 225_000, max: 270_000 }, garage: true, upcoming: false, defaultBuild: 53_000 },
  { id: 'birmingham', builder: 'momohomes', category: 'SPH', name: 'Birmingham', sqft: 1712, bedrooms: 4, bathrooms: 2, tiers: { plus: 235_000, max: 280_000 }, garage: false, upcoming: false, defaultBuild: 56_000 },
  { id: 'coastal', builder: 'momohomes', category: 'SPH', name: 'Coastal', sqft: 1818, bedrooms: 4, bathrooms: 2, tiers: { plus: null, max: 285_000 }, garage: true, upcoming: true, defaultBuild: 59_000 },
  { id: 'luna', builder: 'momohomes', category: 'SPH', name: 'Luna', sqft: 2733, bedrooms: 5, bathrooms: 3.5, tiers: { plus: 349_000, max: 415_000 }, garage: true, upcoming: false, defaultBuild: 81_000 },
  { id: 'penumbra', builder: 'momohomes', category: 'SPH', name: 'Penumbra', sqft: 4010, bedrooms: 5.5, bathrooms: 5.5, tiers: { plus: null, max: 465_000 }, garage: true, upcoming: true, defaultBuild: 111_000 },
  { id: 'alpenumbra', builder: 'momohomes', category: 'SPH', name: 'Alpenumbra', sqft: 3962, bedrooms: 5.5, bathrooms: 5.5, tiers: { plus: null, max: 480_000 }, garage: true, upcoming: true, defaultBuild: 110_000 },
];

export const MODELS: readonly DscrModel[] = [...NATIONWIDE_MODELS, ...MOMOHOMES_MODELS];

const MODELS_BY_ID: Readonly<Record<string, DscrModel>> = MODELS.reduce(
  (acc, m) => {
    acc[m.id] = m;
    return acc;
  },
  {} as Record<string, DscrModel>,
);

export function findModel(id: string): DscrModel | undefined {
  return MODELS_BY_ID[id];
}

export function modelsForBuilder(builder: Builder): readonly DscrModel[] {
  return MODELS.filter((m) => m.builder === builder);
}

export const BUILDER_LABELS: Readonly<Record<Builder, string>> = {
  nationwide: 'Nationwide Homes',
  momohomes: 'Momohomes',
};

/**
 * Resolve a kit price for a model. For single-price models the tier is
 * ignored; for tiered models, falls back across tiers if the requested
 * tier isn't offered (matches the original Olamina behavior).
 */
export function getKitPrice(model: DscrModel, tier: KitTier = 'plus'): number {
  if (typeof model.kitPrice === 'number') return model.kitPrice;
  if (model.tiers) {
    if (tier === 'plus') return model.tiers.plus ?? model.tiers.max ?? 0;
    return model.tiers.max ?? model.tiers.plus ?? 0;
  }
  return 0;
}

/** Whether ANY home in a portfolio uses tier-based pricing (drives UI). */
export function portfolioHasTiers(homes: ReadonlyArray<{ modelId: string }>): boolean {
  return homes.some((h) => {
    const m = findModel(h.modelId);
    return m !== undefined && m.tiers !== undefined;
  });
}
