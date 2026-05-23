// Non-tunable defaults for the Rent vs Sell calculator.
// Everything property-, rental-, or sale-specific is now part of
// RentSellInputs and tuned in the UI.
export type RentSellConstants = {
  /** Current calendar year, drives Section 121 timeline. */
  currentYear: number;
  /** IRS residential depreciation period (years). */
  depreciationYears: number;
  /** Section 121 capital-gains exclusion ($, single filer). */
  s121Single: number;
  /** Section 121 capital-gains exclusion ($, married filing jointly). */
  s121MFJ: number;
  /** Depreciation recapture rate (IRS Section 1250 max). */
  recapturePct: number;
  /** Lower and upper bounds for the breakeven bisection ($). */
  solverMinPrice: number;
  solverMaxPrice: number;
};

export const RENT_SELL_DEFAULTS: RentSellConstants = {
  currentYear: 2026,
  depreciationYears: 27.5,
  s121Single: 250_000,
  s121MFJ: 500_000,
  recapturePct: 25,
  solverMinPrice: 50_000,
  solverMaxPrice: 2_000_000,
};

/** Initial input values — Birchwood-style defaults but fully editable. */
export const RENT_SELL_INITIAL_INPUTS = {
  // Property
  mortgageBalance: 162_317,
  mortgageRatePct: 3.75,
  monthlyPI: 826,
  salePrice: 305_000,
  appRatePct: 2,
  // Rental
  rent: 2_000,
  taxesMonthly: 280,
  insuranceMonthly: 275,
  maintenancePctYr: 1,
  vacancyPct: 8,
  managed: false,
  managedPct: 9,
  accountingAnnual: 200,
  marginalTaxPct: 22,
  // Sale costs / cap gain
  purchasePrice: 180_000,
  commissionPct: 5.5,
  closingPct: 1,
  s121: 'single' as const,
  ltcgPct: 15,
  landValue: 30_000,
  // Investment
  invRatePct: 7,
  holdingYears: 10,
  // Section 121 timeline
  moveoutYear: 2026,
} as const;
