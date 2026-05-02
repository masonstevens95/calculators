// Pure domain for the Olamina (Momo Homes) DSCR calculator.
//
// Math authored INDEPENDENTLY of calc-lgs-dscr per KTD #4. The structure is
// the same (DSCR is DSCR), but every formula is re-typed by hand from the
// original JS — `git log` shows the two domains landing in separate commits
// without copy-pasting between packages. Drift surfaces in test failures in
// both; the cross-package agreement test in tests/cross-package.test.ts
// verifies the zero-overhead overlap point.
//
// Olamina-specific divergence from LGS: kit pricing depends on a tier
// (plus | max), with per-model fallbacks (KTD #4 acknowledged this as the
// genuine difference).

import { findModel, getKitPrice } from './models';
import type { KitTier, OlaminaModel } from './models';

export type HomeInput = {
  modelId: string;
  buildOverride?: number;
};

export type DscrInputs = {
  homes: HomeInput[];
  ratePct: number;
  downPct: number;
  dscrTarget: number;
  termYears: number;
  discountPct: number;
  infraTotal: number;
  taxRatePct: number;
  insRatePct: number;
  reserveMonths: number;
  origFeePct: number;
  otherClosing: number;
  /** Olamina-specific addon per KTD #4. */
  kitTier: KitTier;
};

export type PerHomeOutput = {
  model: OlaminaModel;
  /** Discounted kit price for the chosen tier. */
  kitPriceDiscounted: number;
  buildCost: number;
  infraShare: number;
  totalCost: number;
  down: number;
  loan: number;
  pi: number;
  tax: number;
  ins: number;
  pitia: number;
  rentNeeded: number;
};

export type DscrTotals = {
  sqft: number;
  /** Sum of discounted kits. */
  kit: number;
  build: number;
  totalCost: number;
  down: number;
  pitia: number;
  rent: number;
};

export type DscrSummary = {
  avgRentPerHome: number;
  annualRent: number;
  /** Kit total grossed-up by the discount (the pre-discount price). */
  kitBeforeDiscount: number;
  discountSavings: number;
  ltvPct: number;
};

export type DscrCash = {
  loanAmount: number;
  origCost: number;
  totalClosing: number;
  reserves: number;
  totalCashNeeded: number;
};

export type DscrOutput = {
  perHome: PerHomeOutput[];
  totals: DscrTotals;
  summary: DscrSummary;
  cash: DscrCash;
};

export type ComputeDscrResult =
  | { ok: true; result: DscrOutput }
  | { ok: false; errors: Partial<Record<keyof DscrInputs, string>> };

export function monthlyPayment(principal: number, annualRatePct: number, termYears: number): number {
  if (principal <= 0) return 0;
  const monthlyRate = annualRatePct / 100 / 12;
  const months = termYears * 12;
  if (monthlyRate === 0) return principal / months;
  const growth = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * growth) / (growth - 1);
}

const NUMERIC_FIELDS: readonly (keyof DscrInputs)[] = [
  'ratePct',
  'downPct',
  'dscrTarget',
  'termYears',
  'discountPct',
  'infraTotal',
  'taxRatePct',
  'insRatePct',
  'reserveMonths',
  'origFeePct',
  'otherClosing',
];

export function validateDscrInputs(
  inputs: DscrInputs,
): Partial<Record<keyof DscrInputs, string>> {
  const errors: Partial<Record<keyof DscrInputs, string>> = {};
  for (const field of NUMERIC_FIELDS) {
    const value = inputs[field];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors[field] = `${field} must be a finite number.`;
      continue;
    }
    if (value < 0) {
      errors[field] = `${field} must be zero or greater.`;
    }
  }
  if (inputs.kitTier !== 'plus' && inputs.kitTier !== 'max') {
    errors.kitTier = 'kitTier must be "plus" or "max".';
  }
  if (!Array.isArray(inputs.homes) || inputs.homes.length === 0) {
    errors.homes = 'At least one home is required.';
  } else {
    for (const home of inputs.homes) {
      if (!findModel(home.modelId)) {
        errors.homes = `Unknown model: ${home.modelId}`;
        break;
      }
    }
  }
  return errors;
}

export function computePerHome(home: HomeInput, inputs: DscrInputs): PerHomeOutput | undefined {
  const model = findModel(home.modelId);
  if (!model) return undefined;

  const buildCost = home.buildOverride ?? model.defaultBuild;
  const kitBase = getKitPrice(model, inputs.kitTier);
  const kitPriceDiscounted = kitBase * (1 - inputs.discountPct / 100);
  const infraShare = inputs.homes.length > 0 ? inputs.infraTotal / inputs.homes.length : 0;
  const totalCost = kitPriceDiscounted + buildCost + infraShare;
  const down = totalCost * (inputs.downPct / 100);
  const loan = totalCost - down;
  const pi = monthlyPayment(loan, inputs.ratePct, inputs.termYears);
  const tax = (totalCost * (inputs.taxRatePct / 100)) / 12;
  const ins = (totalCost * (inputs.insRatePct / 100)) / 12;
  const pitia = pi + tax + ins;
  const rentNeeded = pitia * inputs.dscrTarget;

  return {
    model,
    kitPriceDiscounted,
    buildCost,
    infraShare,
    totalCost,
    down,
    loan,
    pi,
    tax,
    ins,
    pitia,
    rentNeeded,
  };
}

export function computeDscr(inputs: DscrInputs): ComputeDscrResult {
  const errors = validateDscrInputs(inputs);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const perHome: PerHomeOutput[] = [];
  for (const home of inputs.homes) {
    const out = computePerHome(home, inputs);
    if (out) perHome.push(out);
  }

  const totals: DscrTotals = {
    sqft: 0,
    kit: 0,
    build: 0,
    totalCost: 0,
    down: 0,
    pitia: 0,
    rent: 0,
  };
  for (const ph of perHome) {
    totals.sqft += ph.model.sqft;
    totals.kit += ph.kitPriceDiscounted;
    totals.build += ph.buildCost;
    totals.totalCost += ph.totalCost;
    totals.down += ph.down;
    totals.pitia += ph.pitia;
    totals.rent += ph.rentNeeded;
  }

  const kitBeforeDiscount =
    inputs.discountPct < 100 ? totals.kit / (1 - inputs.discountPct / 100) : totals.kit;
  const summary: DscrSummary = {
    avgRentPerHome: perHome.length > 0 ? totals.rent / perHome.length : 0,
    annualRent: totals.rent * 12,
    kitBeforeDiscount,
    discountSavings: kitBeforeDiscount - totals.kit,
    ltvPct: totals.totalCost > 0 ? ((totals.totalCost - totals.down) / totals.totalCost) * 100 : 0,
  };

  const loanAmount = totals.totalCost - totals.down;
  const origCost = (loanAmount * inputs.origFeePct) / 100;
  const totalClosing = origCost + inputs.otherClosing;
  const reserves = totals.pitia * inputs.reserveMonths;
  const cash: DscrCash = {
    loanAmount,
    origCost,
    totalClosing,
    reserves,
    totalCashNeeded: totalClosing + reserves,
  };

  return {
    ok: true,
    result: { perHome, totals, summary, cash },
  };
}
