// Public surface for calc-lgs-dscr.
// Default export: the React component (federation-ready per KTD #20).
// Named exports: domain functions and the LGS model catalog.
export { default, LgsDscrComponent } from './Component';
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
export { MODELS, MODELS_BY_ID, findModel } from './models';
export type { LgsModel, ModelCategory } from './models';
