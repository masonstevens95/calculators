// Public surface for calc-surry-county-offer.
// Domain symbols land first (red→green); the React Component default export
// is added once the component lands later in U4.
export {
  computeOffer,
  monthlyPayment,
  netProceedsCalc,
  concessionLimit,
  validateOfferInputs,
} from './domain';
export type { OfferInputs, ScenarioOutput, ComputeOfferResult } from './domain';
