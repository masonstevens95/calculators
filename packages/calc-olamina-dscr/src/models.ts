// Olamina (Momo Homes) models — extracted from
// reference/html-originals/olamina-dscr-calculator.html.
//
// Each model has two kit-tier prices (Plus, Max). When a tier price is
// unavailable for a model, the other tier's price is used as a fallback.

export type ModelCategory = 'ADU' | 'SPH';
export type KitTier = 'plus' | 'max';

export type OlaminaModel = {
  id: string;
  category: ModelCategory;
  name: string;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  /** Momo Plus kit price; null when only Max is offered. */
  kitPlus: number | null;
  /** Momo Max kit price; null when only Plus is offered. */
  kitMax: number | null;
  garage: boolean;
  upcoming: boolean;
  defaultBuild: number;
};

export const MODELS: readonly OlaminaModel[] = [
  // ADU Models
  { id: 'seed_studio', category: 'ADU', name: 'Seed Studio', sqft: 400, bedrooms: 1, bathrooms: 1, kitPlus: 94_000, kitMax: 115_000, garage: false, upcoming: false, defaultBuild: 25_000 },
  { id: 'seed_1br', category: 'ADU', name: 'Seed 1 BDRM', sqft: 563, bedrooms: 1, bathrooms: 1, kitPlus: 115_000, kitMax: 145_000, garage: false, upcoming: false, defaultBuild: 29_000 },
  { id: 'umbra_1br', category: 'ADU', name: 'Umbra 1 BDRM', sqft: 707, bedrooms: 1, bathrooms: 1, kitPlus: 149_000, kitMax: 175_000, garage: false, upcoming: false, defaultBuild: 32_000 },
  { id: 'seed_2br_xl', category: 'ADU', name: 'Seed 2 BDRM XL', sqft: 834, bedrooms: 2, bathrooms: 2, kitPlus: 149_000, kitMax: 188_000, garage: false, upcoming: false, defaultBuild: 35_000 },
  { id: 'umbra_2br_xl', category: 'ADU', name: 'Umbra 2 BDRM XL', sqft: 976, bedrooms: 2, bathrooms: 2, kitPlus: null, kitMax: 205_000, garage: false, upcoming: false, defaultBuild: 38_000 },
  // SPH Models
  { id: 'co_live', category: 'SPH', name: 'Co-live', sqft: 1203, bedrooms: 2, bathrooms: 2.5, kitPlus: 180_000, kitMax: 220_000, garage: true, upcoming: false, defaultBuild: 44_000 },
  { id: 'otium', category: 'SPH', name: 'Otium Bungalow', sqft: 1120, bedrooms: 2, bathrooms: 2, kitPlus: null, kitMax: 232_000, garage: false, upcoming: false, defaultBuild: 42_000 },
  { id: 'montana', category: 'SPH', name: 'Montana', sqft: 1564, bedrooms: 3, bathrooms: 2, kitPlus: 225_000, kitMax: 270_000, garage: true, upcoming: false, defaultBuild: 53_000 },
  { id: 'birmingham', category: 'SPH', name: 'Birmingham', sqft: 1712, bedrooms: 4, bathrooms: 2, kitPlus: 235_000, kitMax: 280_000, garage: false, upcoming: false, defaultBuild: 56_000 },
  { id: 'coastal', category: 'SPH', name: 'Coastal', sqft: 1818, bedrooms: 4, bathrooms: 2, kitPlus: null, kitMax: 285_000, garage: true, upcoming: true, defaultBuild: 59_000 },
  { id: 'luna', category: 'SPH', name: 'Luna', sqft: 2733, bedrooms: 5, bathrooms: 3.5, kitPlus: 349_000, kitMax: 415_000, garage: true, upcoming: false, defaultBuild: 81_000 },
  { id: 'penumbra', category: 'SPH', name: 'Penumbra', sqft: 4010, bedrooms: 5.5, bathrooms: 5.5, kitPlus: null, kitMax: 465_000, garage: true, upcoming: true, defaultBuild: 111_000 },
  { id: 'alpenumbra', category: 'SPH', name: 'Alpenumbra', sqft: 3962, bedrooms: 5.5, bathrooms: 5.5, kitPlus: null, kitMax: 480_000, garage: true, upcoming: true, defaultBuild: 110_000 },
];

export const MODELS_BY_ID: Readonly<Record<string, OlaminaModel>> = MODELS.reduce(
  (acc, m) => {
    acc[m.id] = m;
    return acc;
  },
  {} as Record<string, OlaminaModel>,
);

export function findModel(id: string): OlaminaModel | undefined {
  return MODELS_BY_ID[id];
}

/**
 * Olamina-specific: kit price depends on the chosen tier with fallback to
 * the other tier when the requested one is null. Per KTD #4 this is the
 * point of meaningful divergence from the LGS package.
 */
export function getKitPrice(model: OlaminaModel, tier: KitTier): number {
  if (tier === 'plus') {
    return model.kitPlus ?? model.kitMax ?? 0;
  }
  return model.kitMax ?? model.kitPlus ?? 0;
}
