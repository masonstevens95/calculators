// Pure domain for the Winston-Salem Land Value Tax calculator.
// Behavior reference: reference/html-originals/lvt-calculator.html.

import { SAMPLE_PARCELS, WS_BASE } from './parcels';
import type { Parcel } from './parcels';

export type LvtInputs = {
  /** Shift fraction toward LVT, range [0, 1]. 0 = uniform; 1 = pure LVT. */
  shift: number;
  /** Optional per-user parcel for the "your bill" UI. */
  myParcel?: Parcel;
};

export type LvtRates = {
  uniformRate: number;
  pureLvtRate: number;
  landRate: number;
  impRate: number;
  /** landRate / impRate, or Infinity at pure LVT. */
  impliedK: number;
  /** Revenue target = (L + I) × current uniform rate. */
  target: number;
};

export type ParcelBill = {
  parcel: Parcel;
  /** Today's bill at the uniform rate. */
  today: number;
  /** New bill under the split rates. */
  next: number;
  /** Bill at pure LVT (100% shift). */
  pure: number;
  /** next − today. */
  delta: number;
};

export type LvtOutput = {
  rates: LvtRates;
  /** Bills for the SAMPLE_PARCELS list. */
  sampleBills: ParcelBill[];
  /** Optional bill for the user-supplied parcel. */
  myBill?: ParcelBill;
};

export type ComputeLvtResult =
  | { ok: true; result: LvtOutput }
  | { ok: false; errors: Partial<Record<keyof LvtInputs, string>> };

export function computeRates(shift: number, base = WS_BASE): LvtRates {
  const s = Math.max(0, Math.min(1, shift));
  const target = (base.L + base.I) * base.rate;
  const uniformRate = target / (base.L + base.I); // = base.rate
  const pureLvtRate = base.L > 0 ? target / base.L : 0;
  const impRate = (1 - s) * uniformRate;
  const landRate = (1 - s) * uniformRate + s * pureLvtRate;
  const impliedK = impRate > 0 ? landRate / impRate : Number.POSITIVE_INFINITY;
  return { uniformRate, pureLvtRate, landRate, impRate, impliedK, target };
}

export function computeParcelBill(parcel: Parcel, rates: LvtRates, currentRate: number): ParcelBill {
  const today = (parcel.land + parcel.imp) * currentRate;
  const next = parcel.land * rates.landRate + parcel.imp * rates.impRate;
  const pure = parcel.land * rates.pureLvtRate;
  return { parcel, today, next, pure, delta: next - today };
}

export function validateLvtInputs(inputs: LvtInputs): Partial<Record<keyof LvtInputs, string>> {
  const errors: Partial<Record<keyof LvtInputs, string>> = {};
  if (typeof inputs.shift !== 'number' || !Number.isFinite(inputs.shift)) {
    errors.shift = 'shift must be a finite number.';
  }
  // Note: out-of-range shift values are clamped to [0, 1] in computeRates
  // (matches the HTML original's behavior). Validation only requires finite.
  if (inputs.myParcel) {
    const { land, imp } = inputs.myParcel;
    if (typeof land !== 'number' || !Number.isFinite(land) || land < 0) {
      errors.myParcel = 'myParcel.land must be a non-negative finite number.';
    } else if (typeof imp !== 'number' || !Number.isFinite(imp) || imp < 0) {
      errors.myParcel = 'myParcel.imp must be a non-negative finite number.';
    }
  }
  return errors;
}

export function computeLvt(inputs: LvtInputs, base = WS_BASE): ComputeLvtResult {
  const errors = validateLvtInputs(inputs);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  const rates = computeRates(inputs.shift, base);
  const sampleBills = SAMPLE_PARCELS.map((p) => computeParcelBill(p, rates, base.rate));
  const myBill = inputs.myParcel
    ? computeParcelBill(inputs.myParcel, rates, base.rate)
    : undefined;
  return { ok: true, result: { rates, sampleBills, myBill } };
}
