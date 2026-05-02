// Public surface for calc-olamina-dscr.
// Default export: the React component (federation-ready per KTD #20).
// Named exports: domain functions and the Olamina model catalog.
export { default, OlaminaDscrComponent } from './Component';
export { computeDscr, computePerHome, monthlyPayment, validateDscrInputs } from './domain';
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
export { MODELS, MODELS_BY_ID, findModel, getKitPrice } from './models';
export type { OlaminaModel, ModelCategory, KitTier } from './models';
