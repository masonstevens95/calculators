// Public surface for calc-modular-home-dscr.
// Default export: the React component (federation-ready per KTD #20).
// Named exports: domain functions, the unified model catalog, and presets.
export { default, ModularHomeDscrComponent } from './Component';
export {
  computeDscr,
  monthlyPayment,
  computePerHome,
  validateDscrInputs,
} from './domain';
export type {
  DscrInputs,
  HomeInput,
  PerHomeOutput,
  DscrTotals,
  DscrSummary,
  DscrCash,
  DscrOutput,
  ComputeDscrResult,
} from './domain';
export {
  MODELS,
  findModel,
  modelsForBuilder,
  getKitPrice,
  BUILDER_LABELS,
} from './models';
export type {
  Builder,
  DscrModel,
  KitTier,
  KitTiers,
  ModelCategory,
} from './models';
export {
  PRESETS_BY_BUILDER,
  presetsForBuilder,
  DEFAULT_HOMES_BY_BUILDER,
  defaultInputs,
} from './presets';
export type { Preset } from './presets';
