// Public surface for calc-surry-county-offer.
// Default export: the React component (federation-ready per KTD #20).
// Named exports: domain functions for callers who want logic without UI.
export { default, SurryCountyOfferComponent } from './Component';
export {
  computeOffer,
  monthlyPayment,
  netProceedsCalc,
  concessionLimit,
  validateOfferInputs,
} from './domain';
export type { OfferInputs, ScenarioOutput, ComputeOfferResult } from './domain';
