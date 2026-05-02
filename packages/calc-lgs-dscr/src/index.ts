// Domain-only public surface lands first (red→green); the React Component
// default export is added once it lands later in U5.
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
