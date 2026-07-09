// Non-tunable defaults for the Solar + Battery calculator.
// Everything system- or energy-specific is part of SolarBatteryInputs and
// tuned in the UI.
export type SolarBatteryConstants = {
  /** Utility rate escalation sweep bounds (%) for the sensitivity chart. */
  sweepStartPct: number;
  sweepEndPct: number;
  sweepStepPct: number;
  /** Number of years shown in the annual savings/cost breakdown chart. */
  breakdownYears: number;
};

export const SOLAR_BATTERY_DEFAULTS: SolarBatteryConstants = {
  sweepStartPct: 0,
  sweepEndPct: 8,
  sweepStepPct: 1,
  breakdownYears: 15,
};

/**
 * Initial input values — a realistic mid-size residential system, fully editable.
 *
 * Energy-usage defaults are sourced for an ~1,800 sqft house in Hillsborough, NC
 * (Duke Energy Progress territory, the incorporated town's utility):
 *  - annualUsageKwh: ~12,000 kWh/yr — NC household average runs ~11,900 kWh/yr
 *    (EIA), higher than the national average due to electric heat/AC load.
 *  - utilityRatePerKwh: $0.135/kWh — Duke Energy Progress all-in residential
 *    rate is ~12.5-14c/kWh as of 2026.
 *  - productionPerKw: 1,500 kWh/kW/yr — central NC (Raleigh-Durham-area) solar
 *    yield; scales automatically with solarSizeKw via annualProductionKwh().
 */
export const SOLAR_BATTERY_INITIAL_INPUTS = {
  // Solar
  solarSizeKw: 8,
  solarCostMode: 'perWatt' as const,
  solarCostPerWatt: 2.75,
  solarTotalCost: 22_000,
  // Battery
  batteryCapacityKwh: 13.5,
  batteryCostMode: 'perKwh' as const,
  batteryCostPerKwh: 700,
  batteryTotalCost: 9_450,
  // Costs & incentives
  softCostsMode: 'percent' as const,
  softCostsPct: 10,
  softCostsFlat: 3_145,
  federalItcPct: 30,
  stateRebate: 1_000,
  // Financing
  financeMode: 'loan' as const,
  downPaymentPct: 20,
  loanRatePct: 6.99,
  loanTermYears: 15,
  indexFundReturnPct: 7,
  // Energy / usage — Hillsborough, NC (see comment above)
  annualUsageKwh: 12_000,
  utilityRatePerKwh: 0.135,
  rateEscalationPct: 3,
  productionPerKw: 1_500,
  selfConsumptionPct: 75,
  netMeteringPct: 100,
  systemDegradationPct: 0.5,
  // Analysis
  analysisYears: 25,
} as const;
