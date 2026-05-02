import type { ValidationResult, ValidatorOptions } from './types';

export type RangeOptions = ValidatorOptions & {
  min?: number;
  max?: number;
};

function defaultMessage(min: number | undefined, max: number | undefined): string {
  if (min !== undefined && max !== undefined) {
    return `Value must be between ${min} and ${max}.`;
  }
  if (min !== undefined) {
    return `Value must be at least ${min}.`;
  }
  if (max !== undefined) {
    return `Value must be at most ${max}.`;
  }
  return 'Value out of range.';
}

export function range(value: unknown, options: RangeOptions): ValidationResult {
  const { min, max } = options;
  const message = options.message ?? defaultMessage(min, max);

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { valid: false, message };
  }
  if (min !== undefined && value < min) {
    return { valid: false, message };
  }
  if (max !== undefined && value > max) {
    return { valid: false, message };
  }
  return { valid: true };
}
