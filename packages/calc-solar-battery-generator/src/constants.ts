// Non-tunable defaults for the Solar + Battery + Generator calculator.
// Everything system-, energy-, or generator-specific is part of
// SolarBatteryGeneratorInputs and tuned in the UI.
export type SolarBatteryGeneratorConstants = {
  /** Utility rate escalation sweep bounds (%) for the sensitivity chart. */
  sweepStartPct: number;
  sweepEndPct: number;
  sweepStepPct: number;
  /** Number of years shown in the annual savings/cost breakdown chart. */
  breakdownYears: number;
};

export const SOLAR_BATTERY_GENERATOR_DEFAULTS: SolarBatteryGeneratorConstants = {
  sweepStartPct: 0,
  sweepEndPct: 8,
  sweepStepPct: 1,
  breakdownYears: 15,
};

/** Initial input values — a realistic mid-size residential system, fully editable. */
export const SOLAR_BATTERY_GENERATOR_INITIAL_INPUTS = {
  // System & cost
  solarSizeKw: 8,
  solarCostPerWatt: 2.75,
  batteryCapacityKwh: 13.5,
  batteryCostPerKwh: 700,
  generatorCost: 5_000,
  softCostsPct: 10,
  federalItcPct: 30,
  stateRebate: 1_000,
  // Financing
  financeMode: 'loan' as const,
  downPaymentPct: 20,
  loanRatePct: 6.99,
  loanTermYears: 15,
  // Energy / usage
  annualUsageKwh: 11_000,
  utilityRatePerKwh: 0.18,
  rateEscalationPct: 3,
  productionPerKw: 1_400,
  selfConsumptionPct: 75,
  netMeteringPct: 100,
  systemDegradationPct: 0.5,
  // Generator / backup
  fuelCostPerGallon: 3.5,
  generatorBurnRateGalPerHr: 0.75,
  annualOutageHours: 24,
  generatorMaintenanceAnnual: 150,
  generatorReplaceYear: 12,
  generatorReplaceCost: 5_500,
  // Analysis
  analysisYears: 25,
} as const;
